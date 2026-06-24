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

  async sendPaymentLinkEmail(
    email: string,
    customerName: string,
    paymentLink: string,
    amount: number,
    orgName: string,
    servicesList?: string[],
  ) {
    const servicesHtml = servicesList && servicesList.length > 0
      ? `<div style="margin-top: 16px; border-top: 1px dashed #e2e8f0; padding-top: 16px; text-align: left;">
           <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Services Requested</p>
           <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155; line-height: 1.6;">
             ${servicesList.map(service => `<li style="margin-bottom: 4px;">${service}</li>`).join('')}
           </ul>
         </div>`
      : '';

    await this.transporter.sendMail({
      from: `"${orgName} via Digital Office" <${this.configService.get<string>("GMAIL_USER")}>`,
      to: email,
      subject: `Complete Your Booking Payment - ${orgName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; padding: 40px 20px; min-height: 100%;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #eef0f3;">
            
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
              <p style="margin: 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.85;">Payment Request</p>
              <h1 style="margin: 6px 0 0 0; font-size: 22px; font-weight: 800; letter-spacing: -0.025em; color: #ffffff;">Secure Checkout Link</h1>
            </div>

            <!-- Main Body -->
            <div style="padding: 32px 24px; color: #334155; line-height: 1.6;">
              <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #0f172a;">Dear ${customerName},</p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569;">
                Thank you for scheduling a booking with <strong>${orgName}</strong>. To finalize your appointment and confirm the reservation, please complete the payment using our secure checkout page.
              </p>

              <!-- Payment Details Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="font-size: 14px; color: #64748b; padding-bottom: 8px; text-align: left;">Merchant</td>
                    <td style="font-size: 14px; font-weight: 600; color: #1e293b; text-align: right; padding-bottom: 8px;">${orgName}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 14px; color: #64748b; text-align: left;">Total Amount Due</td>
                    <td style="font-size: 20px; font-weight: 700; color: #2563eb; text-align: right;">$${amount} USD</td>
                  </tr>
                </table>
                ${servicesHtml}
              </div>

              <!-- Button CTA -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${paymentLink}" style="display: inline-block; padding: 16px 36px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);">
                  Pay & Confirm Booking
                </a>
              </div>

              <!-- Security Information -->
              <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b;">
                <p style="margin: 0;">
                  🔒 <strong>Secure Payment processed via SSL 256-bit encryption.</strong>
                </p>
                <p style="margin: 4px 0 0 0;">This payment link is unique to your booking and is valid for 24 hours.</p>
              </div>

            </div>

            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0;">If you did not make this request or believe this email was sent in error, please disregard it.</p>
              <p style="margin: 6px 0 0 0;">&copy; 2026 ${orgName}. Powered by Digital Office.</p>
            </div>

          </div>
        </div>
      `,
    });
  }

  async sendInvoiceEmail(
    email: string,
    customerName: string,
    invoiceDetails: {
      invoiceNumber: string;
      date: string;
      bookingId: string;
      orgName: string;
      orgAddress?: string;
      orgPhone?: string;
      orgEmail?: string;
      services: Array<{ name: string; price: number; quantity: number }>;
      subtotal: number;
      tax: number;
      discount?: number;
      amount: number;
      type: string; // 'payment' | 'edit_service' | 'refund'
    }
  ) {
    const {
      invoiceNumber,
      date,
      bookingId,
      orgName,
      orgAddress,
      orgPhone,
      orgEmail,
      services,
      subtotal,
      tax,
      discount,
      amount,
      type
    } = invoiceDetails;

    const emailSubject = type === 'refund' 
      ? `Credit Note / Refund Receipt - ${invoiceNumber}` 
      : type === 'edit_service'
      ? `Booking Invoice Updated - ${invoiceNumber}`
      : `Payment Invoice Receipt - ${invoiceNumber}`;

    await this.transporter.sendMail({
      from: `"${orgName} Payments" <${this.configService.get<string>("GMAIL_USER")}>`,
      to: email,
      subject: emailSubject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 10px; color: #1e293b; line-height: 1.5;">
          <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
            <!-- Top banner accent -->
            <div style="background-color: ${type === 'refund' ? '#10b981' : '#4f46e5'}; height: 8px;"></div>
            
            <!-- Invoice Content -->
            <div style="padding: 40px 32px;">
              
              <!-- Top Section -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="vertical-align: top;">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: -0.025em;">${orgName}</h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Powered by Velvetbook</p>
                  </td>
                  <td style="vertical-align: top; text-align: right;">
                    <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: ${type === 'refund' ? '#10b981' : '#4f46e5'}; text-transform: uppercase; letter-spacing: 0.05em;">
                      ${type === 'refund' ? 'CREDIT NOTE' : 'INVOICE'}
                    </h2>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #475569;">
                      <strong>Invoice #</strong> ${invoiceNumber}
                    </p>
                    <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">
                      <strong>Date:</strong> ${date}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Billing Info (3 columns layout) -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 35px; background-color: #fafafa; border-radius: 12px; border: 1px solid #f1f1f1;">
                <tr>
                  <!-- Bill From -->
                  <td style="width: 33.33%; padding: 20px; vertical-align: top; border-right: 1px solid #f1f1f1;">
                    <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">BILL FROM</p>
                    <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #1e293b;">${orgName}</p>
                    ${orgAddress ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; line-height: 1.4;">${orgAddress}</p>` : ''}
                    ${orgPhone ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">📞 ${orgPhone}</p>` : ''}
                    ${orgEmail ? `<p style="margin: 0; font-size: 12px; color: #64748b;">✉️ ${orgEmail}</p>` : ''}
                  </td>
                  <!-- Bill To -->
                  <td style="width: 33.33%; padding: 20px; vertical-align: top; border-right: 1px solid #f1f1f1;">
                    <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">BILL TO</p>
                    <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #1e293b;">${customerName}</p>
                    ${orgPhone ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">📞 Customer phone</p>` : ''}
                    ${email ? `<p style="margin: 0; font-size: 12px; color: #64748b;">✉️ ${email}</p>` : ''}
                  </td>
                  <!-- Invoice For -->
                  <td style="width: 33.33%; padding: 20px; vertical-align: top;">
                    <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">INVOICE FOR</p>
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #475569;">
                      <strong>Booking ID:</strong> <span style="font-family: monospace; font-size: 11px;">#${bookingId.slice(0, 8).toUpperCase()}</span>
                    </p>
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #475569;">
                      <strong>Type:</strong> ${type === 'refund' ? 'Refund / Credit' : type === 'edit_service' ? 'Service Change' : 'New Purchase'}
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #475569;">
                      <strong>Status:</strong> <span style="display: inline-block; padding: 2px 8px; background-color: ${type === 'refund' ? '#d1fae5' : '#e0e7ff'}; color: ${type === 'refund' ? '#065f46' : '#3730a3'}; font-size: 10px; font-weight: 700; border-radius: 9999px;">${type === 'refund' ? 'REFUNDED' : 'PAID'}</span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Items Table -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                  <tr style="border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 11px; font-weight: 700; color: #475569;">
                    <th style="padding-bottom: 10px; text-align: left; width: 50px;">#</th>
                    <th style="padding-bottom: 10px; text-align: left;">DESCRIPTION</th>
                    <th style="padding-bottom: 10px; text-align: right; width: 60px;">QTY</th>
                    <th style="padding-bottom: 10px; text-align: right; width: 100px;">UNIT PRICE</th>
                    <th style="padding-bottom: 10px; text-align: right; width: 80px;">TAX (%)</th>
                    <th style="padding-bottom: 10px; text-align: right; width: 110px;">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  ${services.map((svc, idx) => `
                    <tr style="border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155;">
                      <td style="padding: 12px 0; text-align: left;">${idx + 1}</td>
                      <td style="padding: 12px 0; text-align: left; font-weight: 500; color: #0f172a;">${svc.name}</td>
                      <td style="padding: 12px 0; text-align: right;">${svc.quantity}</td>
                      <td style="padding: 12px 0; text-align: right;">${Number(svc.price).toFixed(2)}</td>
                      <td style="padding: 12px 0; text-align: right;">18%</td>
                      <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #0f172a;">
                        ${(Number(svc.price) * svc.quantity).toFixed(2)}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <!-- Bottom Notes & Summary columns -->
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                  <!-- Notes -->
                  <td style="width: 55%; vertical-align: top; padding-right: 40px;">
                    <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">NOTES</p>
                    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                      Thank you for your business! This is an automatically generated receipt for your records. If you have any questions or concerns regarding this transaction, please feel free to reach out to us.
                    </p>
                  </td>
                  <!-- Summary -->
                  <td style="width: 45%; vertical-align: top;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
                      <tr>
                        <td style="padding: 6px 0; text-align: left;">Subtotal</td>
                        <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1e293b;">${Number(subtotal).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; text-align: left;">Tax (GST 18%)</td>
                        <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1e293b;">${Number(tax).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; text-align: left;">Discount</td>
                        <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #10b981;">-${Number(discount || 0).toFixed(2)}</td>
                      </tr>
                      <tr style="border-top: 1px solid #e2e8f0;">
                        <td style="padding: 12px 0 0 0; text-align: left; font-size: 15px; font-weight: 800; color: #0f172a;">TOTAL</td>
                        <td style="padding: 12px 0 0 0; text-align: right; font-size: 18px; font-weight: 800; color: ${type === 'refund' ? '#10b981' : '#4f46e5'};">
                          ${Number(amount).toFixed(2)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Bottom Line contact details -->
              <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
                <p style="margin: 0;">
                  ${orgPhone ? `📞 ${orgPhone}  •  ` : ''}
                  ${orgEmail ? `✉️ ${orgEmail}  •  ` : ''}
                  ${orgName}
                </p>
                <p style="margin: 4px 0 0 0;">This transaction is securely processed in accordance with our terms of service.</p>
              </div>

            </div>
          </div>
        </div>
      `,
    });
  }
}
