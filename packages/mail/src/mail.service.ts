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
    const baseRole = role.split("/")[0];
    let frontendUrl: string;
    
    if (baseRole === 'client') {
      frontendUrl = this.configService.getOrThrow<string>("CLIENT_FRONTEND_URL");
    } else if (baseRole === 'expert') {
      frontendUrl = this.configService.getOrThrow<string>("EXPERT_FRONTEND_URL");
    }
    else if (baseRole === 'organisation') {
      frontendUrl = this.configService.getOrThrow<string>("ORGANISATION_FRONTEND_URL");
    }
    else if (baseRole === 'admin') {
      frontendUrl = this.configService.getOrThrow<string>("ADMIN_FRONTEND_URL");
    }
    else {
      frontendUrl = this.configService.getOrThrow<string>("FRONTEND_URL");
    }
    
    const url = `${frontendUrl}/auth/${role}/verify?token=${token}`;

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

  async sendPaymentLinkEmail(email: string, customerName: string, paymentLink: string, amount: number, orgName: string) {
    await this.transporter.sendMail({
      from: `"Digital Office" <${this.configService.get<string>("GMAIL_USER")}>`,
      to: email,
      subject: `Payment Link from ${orgName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #1e3a8a; margin-bottom: 10px;">Payment Link Request</h2>
          <p>Hi ${customerName},</p>
          <p>We've generated a secure payment link for your requested services at <strong>${orgName}</strong>.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f1f5f9;">
            <p style="margin: 0; font-size: 14px; color: #475569;">Total Amount Due</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #2563eb;">$${amount} USD</p>
          </div>
          <p>Please click the button below to complete your payment securely. The link is valid for 24 hours.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
              Pay Now Securely
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">If you did not request this service, please ignore this email. Secure payment processed via Digital Office.</p>
        </div>
      `,
    });
  }
}
