import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { DatabaseClient, client } from "@repo/database";
import { eq } from "drizzle-orm";
import * as argon2 from "argon2";

@Injectable()
export class AuthService {
  constructor(@Inject("DB_CLIENT") private readonly db: DatabaseClient) {}

  async register(data: any) {
    const { email, password, name, username } = data;

    // Check if user exists
    const existing = await this.db
      .select()
      .from(client)
      .where(eq(client.email, email));
    if (existing.length > 0) throw new ConflictException("User already exists");

    // Hash password
    const hashedPassword = await argon2.hash(password);

    // Insert
    const [newUser] = await this.db
      .insert(client)
      .values({
        ...data,
        password: hashedPassword,
      })
      .returning();

    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async login(email: string, pass: string) {
    const [user] = await this.db
      .select()
      .from(client)
      .where(eq(client.email, email));

    if (!user || !(await argon2.verify(user.password, pass))) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const { password: _, ...result } = user;
    return result;
  }
}
