import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: this.configService.getOrThrow<string>("GMAIL_USER"),
        pass: this.configService.getOrThrow<string>("GMAIL_PASS"),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string, role: string) {
    const appUrl = this.configService.getOrThrow<string>("APP_URL");
    const url = `${appUrl}/auth/${role}/verify?token=${token}`;

    await this.transporter.sendMail({
      from: `"No Reply" <${this.configService.get<string>("GMAIL_USER")}>`,
      to: email,
      subject: "Verify your Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>Action Required: Verify Your Account</h2>
          <p>Thanks for signing up! Please click the button below to verify your email address.</p>
          <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Verify Email Address
          </a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">If you did not create an account, no further action is required.</p>
        </div>
      `,
    });
  }
}
