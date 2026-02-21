import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  UseGuards,
  Req,
  Res,
} from "@nestjs/common";
import { RegisterDto, LoginDto } from "@repo/contract";
import { AuthService } from "./auth.service";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { RtGuard } from "./guards/rt.guard";
import { GetCurrentUserId, GetCurrentUser, Public } from "../common/decorators";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post(":role/register")
  async register(@Param("role") role: string, @Body() body: RegisterDto) {
    return this.authService.register(body, role);
  }

  @Public()
  @Get(":role/verify")
  async verify(@Param("role") role: string, @Query("token") token: string) {
    return this.authService.verifyEmail(token, role);
  }

  @Public()
  @Post(":role/login")
  async login(@Param("role") role: string, @Body() body: LoginDto) {
    return this.authService.login(body, role);
  }

  @Public()
  @Post(":role/forgot-password")
  async forgotPassword(
    @Param("role") role: string,
    @Body("email") email: string
  ) {
    return this.authService.forgotPassword(email, role);
  }

  @Public()
  @Post(":role/reset-password")
  async resetPassword(
    @Param("role") role: string,
    @Query("token") token: string,
    @Body("password") newPass: string
  ) {
    return this.authService.resetPassword(token, newPass, role);
  }

  @Public()
  @Get(":role/google")
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Public()
  @Get("google/redirect")
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    const { url } = await this.authService.handleGoogleRedirect(req.user);
    return res.redirect(url);
  }

  @Post(":role/logout")
  async logout(
    @Param("role") role: string,
    @GetCurrentUserId() userId: string
  ) {
    return this.authService.logout(userId, role);
  }

  @Public()
  @Post(":role/refresh")
  @UseGuards(RtGuard)
  async refresh(
    @Param("role") role: string,
    @GetCurrentUserId() userId: string,
    @GetCurrentUser("refreshToken") refreshToken: string
  ) {
    return this.authService.refreshTokens(userId, role, refreshToken);
  }
}
