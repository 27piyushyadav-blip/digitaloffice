import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import {
  DatabaseClient,
  client,
  expert,
  organisation,
  admin,
} from "@repo/database";
import { RegisterDto, LoginDto, RegisterSchema } from "@repo/contract";
import { eq, or } from "drizzle-orm";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
  NumberDictionary,
} from "unique-names-generator";
import { MailService } from "@repo/mail";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  constructor(
    @Inject("DB_CLIENT") private readonly db: DatabaseClient,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  private getTable(role: string) {
    const tables = { client, expert, organisation, admin };
    const table = tables[role as keyof typeof tables];
    if (!table) throw new UnauthorizedException("Invalid role provided");
    return table;
  }

  private async generateUniqueUsername(table: any): Promise<string> {
    const numberDict = NumberDictionary.generate({ min: 100, max: 999 });
    let username = "";
    let isUnique = false;
    while (!isUnique) {
      username = uniqueNamesGenerator({
        dictionaries: [adjectives, animals, numberDict],
        separator: "-",
      });
      const [existing] = await this.db
        .select()
        .from(table)
        .where(eq(table.username, username));
      if (!existing) isUnique = true;
    }
    return username;
  }

  async getTokens(userId: string, email: string, role: string, name?: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role, name },
        {
          secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
          expiresIn: "15m",
        }
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role, name },
        {
          secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
          expiresIn: "7d",
        }
      ),
    ]);
    return { access_token: at, refresh_token: rt };
  }

  async updateRefreshToken(
    userId: string,
    role: string,
    refreshToken: string | null
  ) {
    const table = this.getTable(role);
    const hashedToken = refreshToken ? await argon2.hash(refreshToken) : null;
    await this.db
      .update(table)
      .set({ refreshToken: hashedToken })
      .where(eq(table.id, userId));
  }

  async register(dto: RegisterDto, role: string) {
    const table = this.getTable(role);
    const [existing] = await this.db
      .select()
      .from(table)
      .where(eq(table.email, dto.email));
    if (existing)
      throw new ConflictException(`Email already registered as ${role}`);

    const username = await this.generateUniqueUsername(table);
    const imageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    const verificationToken = randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const hashedPassword = await argon2.hash(dto.password);

    let newUser;
    try {
      [newUser] = await this.db
        .insert(table)
        .values({
          ...dto,
          password: hashedPassword,
          username,
          image: imageUrl,
          isEmailVerified: false,
          verificationToken,
          verificationExpires,
        })
        .returning();

      await this.mailService.sendVerificationEmail(
        dto.email,
        verificationToken,
        role
      );
    } catch (error) {
      if (newUser) await this.db.delete(table).where(eq(table.id, newUser.id));
      throw new InternalServerErrorException(
        "Failed to send verification email. Please try again."
      );
    }

    return { message: "Check your email to verify your account." };
  }

  async login(dto: LoginDto, role: string) {
    const table = this.getTable(role);
    const [user] = await this.db
      .select()
      .from(table)
      .where(
        or(eq(table.email, dto.identifier), eq(table.username, dto.identifier))
      );

    if (!user) throw new UnauthorizedException("Invalid credentials");
    if (!user.password)
      throw new UnauthorizedException("Please login using Google");

    if (!(await argon2.verify(user.password, dto.password)))
      throw new UnauthorizedException("Invalid credentials");
    if (!user.isEmailVerified)
      throw new UnauthorizedException("Please verify your email");
    if (user.isBlocked) throw new UnauthorizedException("Account is suspended");

    const tokens = await this.getTokens(user.id, user.email, role, user.name);
    await this.updateRefreshToken(user.id, role, tokens.refresh_token);
    return tokens;
  }

  async handleGoogleRedirect(googlePayload: any) {
    const { role, email, googleId, name, image } = googlePayload;
    if (!googleId || !email)
      throw new UnauthorizedException("Invalid Google payload");

    const table = this.getTable(role);
    let [user] = await this.db
      .select()
      .from(table)
      .where(eq(table.email, email));

    if (user) {
      if (!user.googleId || !user.isEmailVerified) {
        await this.db
          .update(table)
          .set({ googleId, isEmailVerified: true })
          .where(eq(table.id, user.id));
      }
    } else {
      const username = await this.generateUniqueUsername(table);
      [user] = await this.db
        .insert(table)
        .values({
          name,
          email,
          googleId,
          image,
          username,
          isEmailVerified: true,
        })
        .returning();
    }

    const tokens = await this.getTokens(user.id, user.email, role, user.name);
    await this.updateRefreshToken(user.id, role, tokens.refresh_token);

    // Route to correct frontend based on role
    let frontendUrl: string;
    switch (role) {
      case 'expert':
        frontendUrl = this.configService.getOrThrow("EXPERT_FRONTEND_URL");
        break;
      case 'client':
        frontendUrl = this.configService.getOrThrow("CLIENT_FRONTEND_URL");
        break;
      case 'organisation':
        frontendUrl = this.configService.getOrThrow("ORGANISATION_FRONTEND_URL");
        break;
      case 'admin':
        frontendUrl = this.configService.getOrThrow("ADMIN_FRONTEND_URL");
        break;
      default:
        frontendUrl = this.configService.getOrThrow("FRONTEND_URL");
    }

    return {
      url: `${frontendUrl}/auth/callback?at=${tokens.access_token}&rt=${tokens.refresh_token}`,
    };
  }

  async forgotPassword(email: string, role: string) {
    const table = this.getTable(role);
    const [user] = await this.db
      .select()
      .from(table)
      .where(eq(table.email, email));

    if (user && user.password) {
      const resetToken = randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 3600000);

      await this.db
        .update(table)
        .set({
          verificationToken: resetToken,
          verificationExpires: resetExpires,
        })
        .where(eq(table.id, user.id));

      await this.mailService.sendVerificationEmail(
        email,
        resetToken,
        `${role}/reset-password`
      );
    }
    return { message: "If an account exists, a reset link has been sent." };
  }

  async resetPassword(token: string, newPass: string, role: string) {
    const table = this.getTable(role);
    const [user] = await this.db
      .select()
      .from(table)
      .where(eq(table.verificationToken, token));

    if (
      !user ||
      !user.verificationExpires ||
      user.verificationExpires < new Date()
    ) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    const passwordSchema = RegisterSchema.shape.password;
    const validation = passwordSchema.safeParse(newPass);
    if (!validation.success) {
      const firstError =
        validation.error.issues[0]?.message || "Invalid password";
      throw new BadRequestException(firstError);
    }

    const hashedPassword = await argon2.hash(newPass);
    await this.db
      .update(table)
      .set({
        password: hashedPassword,
        verificationToken: null,
        verificationExpires: null,
        refreshToken: null,
      })
      .where(eq(table.id, user.id));

    return { message: "Password updated successfully" };
  }

  async refreshTokens(userId: string, role: string, refreshToken: string) {
    const table = this.getTable(role);
    const [user] = await this.db
      .select()
      .from(table)
      .where(eq(table.id, userId));

    if (
      !user ||
      !user.refreshToken ||
      !(await argon2.verify(user.refreshToken, refreshToken))
    ) {
      throw new UnauthorizedException("Access Denied");
    }

    const tokens = await this.getTokens(user.id, user.email, role);
    await this.updateRefreshToken(user.id, role, tokens.refresh_token);
    return tokens;
  }

  async logout(userId: string, role: string) {
    await this.updateRefreshToken(userId, role, null);
    return { message: "Logged out successfully" };
  }

  async verifyEmail(token: string, role: string) {
    const table = this.getTable(role);
    const [user] = await this.db
      .select()
      .from(table)
      .where(eq(table.verificationToken, token));

    if (
      !user ||
      !user.verificationExpires ||
      user.verificationExpires < new Date()
    ) {
      throw new BadRequestException("Invalid or expired verification token");
    }

    await this.db
      .update(table)
      .set({
        isEmailVerified: true,
        verificationToken: null,
        verificationExpires: null,
      })
      .where(eq(table.id, user.id));

    return { message: "Email verified successfully. You can now login." };
  }

  async fixAvatarUrls() {
    console.log("Starting avatar URL fixes...");

    // Fix expert avatars
    const experts = await this.db.select().from(expert);
    let fixedCount = 0;
    
    for (const expertRecord of experts) {
      if (expertRecord.image && expertRecord.image.includes('api.dicebear.com{username}')) {
        const newImageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${expertRecord.username}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9`;
        await this.db
          .update(expert)
          .set({ image: newImageUrl })
          .where(eq(expert.id, expertRecord.id));
        console.log(`Fixed expert avatar: ${expertRecord.email}`);
        fixedCount++;
      }
    }

    // Fix client avatars
    const clients = await this.db.select().from(client);
    for (const clientRecord of clients) {
      if (clientRecord.image && clientRecord.image.includes('api.dicebear.com{username}')) {
        const newImageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${clientRecord.username}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9`;
        await this.db
          .update(client)
          .set({ image: newImageUrl })
          .where(eq(client.id, clientRecord.id));
        console.log(`Fixed client avatar: ${clientRecord.email}`);
        fixedCount++;
      }
    }

    // Fix organisation avatars
    const organisations = await this.db.select().from(organisation);
    for (const orgRecord of organisations) {
      if (orgRecord.image && orgRecord.image.includes('api.dicebear.com{username}')) {
        const newImageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${orgRecord.username}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9`;
        await this.db
          .update(organisation)
          .set({ image: newImageUrl })
          .where(eq(organisation.id, orgRecord.id));
        console.log(`Fixed organisation avatar: ${orgRecord.email}`);
        fixedCount++;
      }
    }

    // Fix admin avatars
    const admins = await this.db.select().from(admin);
    for (const adminRecord of admins) {
      if (adminRecord.image && adminRecord.image.includes('api.dicebear.com{username}')) {
        const newImageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminRecord.username}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9`;
        await this.db
          .update(admin)
          .set({ image: newImageUrl })
          .where(eq(admin.id, adminRecord.id));
        console.log(`Fixed admin avatar: ${adminRecord.email}`);
        fixedCount++;
      }
    }

    console.log(`Avatar URL fixes completed! Fixed ${fixedCount} records.`);
    return { message: `Fixed ${fixedCount} avatar URLs` };
  }
}
