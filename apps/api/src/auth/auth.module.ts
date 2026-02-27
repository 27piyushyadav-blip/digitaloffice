import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { GoogleStrategy } from "./strategies/google.strategy";
import { JwtModule } from "@nestjs/jwt";
import { AtStrategy } from "./strategies/at.strategy";
import { RtStrategy } from "./strategies/rt.strategy";
import { MailModule } from "@repo/mail";

@Module({
  imports: [JwtModule.register({}), MailModule.forRoot()],
  providers: [AuthService, GoogleStrategy, AtStrategy, RtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
