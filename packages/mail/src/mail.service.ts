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
      invoiceCustomization?: {
        logoUrl?: string;
        brandName?: string;
        color?: string;
        backgroundColor?: string;
        textSize?: string;
      };
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
      type,
      invoiceCustomization
    } = invoiceDetails;

    const accentColor = invoiceCustomization?.color || (type === 'refund' ? '#10b981' : '#4f46e5');
    const customBrandName = invoiceCustomization?.brandName || orgName;
    const cardBgColor = invoiceCustomization?.backgroundColor || '#ffffff';

    // Sizing customization
    let baseFontSize = '13px';
    let headerFontSize = '26px';
    let titleFontSize = '24px';
    let paddingStyle = '40px 32px';
    let rowPadding = '12px 0';
    if (invoiceCustomization?.textSize === 'small') {
      baseFontSize = '11px';
      headerFontSize = '22px';
      titleFontSize = '20px';
      paddingStyle = '24px 20px';
      rowPadding = '8px 0';
    } else if (invoiceCustomization?.textSize === 'large') {
      baseFontSize = '15px';
      headerFontSize = '30px';
      titleFontSize = '28px';
      paddingStyle = '48px 40px';
      rowPadding = '16px 0';
    }

    const emailSubject = type === 'refund' 
      ? `Credit Note / Refund Receipt - ${invoiceNumber}` 
      : type === 'edit_service'
      ? `Booking Invoice Updated - ${invoiceNumber}`
      : `Payment Invoice Receipt - ${invoiceNumber}`;

    await this.transporter.sendMail({
      from: `"${customBrandName} Payments" <${this.configService.get<string>("GMAIL_USER")}>`,
      to: email,
      subject: emailSubject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 10px; color: #1e293b; line-height: 1.5;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 700px; margin: 0 auto; background-color: ${cardBgColor}; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); border-collapse: collapse;">
            <!-- Top banner accent -->
            <tr>
              <td colspan="2" style="background-color: ${accentColor}; height: 8px; line-height: 8px; font-size: 8px;">&nbsp;</td>
            </tr>
            
            <!-- Main Content padding wrapper -->
            <tr>
              <td colspan="2" style="padding: ${paddingStyle};">
                
                <!-- Header grid -->
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; margin-bottom: 30px;">
                  <tr>
                    <!-- Header Left: Logo and Provider Info -->
                    <td width="55%" style="vertical-align: top; padding-right: 20px;">
                      ${invoiceCustomization?.logoUrl ? `<img src="${invoiceCustomization.logoUrl}" alt="${customBrandName}" style="max-height: 60px; display: block; margin-bottom: 12px; border-radius: 8px;" />` : ''}
                      <h1 style="margin: 0 0 12px 0; font-size: ${headerFontSize}; font-weight: 800; color: ${accentColor}; text-transform: uppercase; letter-spacing: -0.025em; line-height: 1.2;">${customBrandName}</h1>
                      <div style="font-size: ${baseFontSize}; color: #64748b; line-height: 1.6;">
                        ${orgAddress ? `<p style="margin: 0 0 4px 0;">📍 ${orgAddress}</p>` : ''}
                        ${orgPhone ? `<p style="margin: 0 0 4px 0;">📞 ${orgPhone}</p>` : ''}
                        ${orgEmail ? `<p style="margin: 0 0 4px 0;">✉️ ${orgEmail}</p>` : ''}
                      </div>
                    </td>
                    
                    <!-- Header Right: Invoice Details & BILL TO -->
                    <td width="45%" style="vertical-align: top; text-align: right;">
                      <h2 style="margin: 0 0 15px 0; font-size: 32px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1;">
                        ${type === 'refund' ? 'CREDIT' : 'INVOICE'}
                      </h2>
                      
                      <!-- Meta Details table -->
                      <table cellpadding="0" cellspacing="0" border="0" align="right" style="border-collapse: collapse; margin-bottom: 20px; font-size: ${baseFontSize}; color: #475569; text-align: right;">
                        <tr>
                          <td style="padding: 2px 10px 2px 0; font-weight: bold; color: #64748b;">Invoice No.</td>
                          <td style="padding: 2px 0 2px 10px; color: #0f172a; font-weight: bold;">: ${invoiceNumber}</td>
                        </tr>
                        <tr>
                          <td style="padding: 2px 10px 2px 0; font-weight: bold; color: #64748b;">Invoice Date</td>
                          <td style="padding: 2px 0 2px 10px; color: #0f172a;">: ${date}</td>
                        </tr>
                        <tr>
                          <td style="padding: 2px 10px 2px 0; font-weight: bold; color: #64748b;">Status</td>
                          <td style="padding: 2px 0 2px 10px; color: ${type === 'refund' ? '#059669' : '#4f46e5'}; font-weight: bold;">: ${type === 'refund' ? 'REFUNDED' : 'PAID'}</td>
                        </tr>
                      </table>
                      <div style="clear: both;"></div>
                      
                      <!-- BILL TO Box matching reference design card -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 12px; text-align: left;">
                        <tr>
                          <td style="padding: 16px;">
                            <p style="margin: 0 0 6px 0; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">BILL TO</p>
                            <p style="margin: 0 0 4px 0; font-size: ${baseFontSize}; font-weight: 700; color: #1e293b;">${customerName}</p>
                            ${email ? `<p style="margin: 0 0 2px 0; font-size: ${baseFontSize}; color: #64748b;">${email}</p>` : ''}
                            <p style="margin: 0; font-size: ${baseFontSize}; color: #64748b;"><strong>Booking ID:</strong> #${bookingId.slice(0, 8).toUpperCase()}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Items Table -->
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; margin-bottom: 30px;">
                  <thead>
                    <tr style="background-color: ${accentColor}; color: #ffffff;">
                      <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; border-top-left-radius: 8px; border-bottom-left-radius: 8px; width: 40px;">#</th>
                      <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase;">DESCRIPTION</th>
                      <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; width: 50px;">QTY</th>
                      <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; width: 90px;">UNIT PRICE</th>
                      <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; width: 60px;">TAX (%)</th>
                      <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; border-top-right-radius: 8px; border-bottom-right-radius: 8px; width: 100px;">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${services.map((svc, idx) => `
                      <tr style="border-bottom: 1px solid #f1f5f9; font-size: ${baseFontSize}; color: #334155;">
                        <td style="padding: ${rowPadding} 12px; text-align: left; color: #94a3b8;">${String(idx + 1).padStart(2, '0')}</td>
                        <td style="padding: ${rowPadding} 12px; text-align: left; font-weight: 600; color: #0f172a;">${svc.name}</td>
                        <td style="padding: ${rowPadding} 12px; text-align: right;">${svc.quantity}</td>
                        <td style="padding: ${rowPadding} 12px; text-align: right;">$${Number(svc.price).toFixed(2)}</td>
                        <td style="padding: ${rowPadding} 12px; text-align: right;">18%</td>
                        <td style="padding: ${rowPadding} 12px; text-align: right; font-weight: 700; color: #0f172a;">
                          $${(Number(svc.price) * svc.quantity).toFixed(2)}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <!-- Bottom Notes + Summary Columns -->
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; margin-top: 10px;">
                  <tr>
                    <!-- Bottom Left: Payment Information & Thank you -->
                    <td width="55%" style="vertical-align: top; padding-right: 40px;">
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 15px;">
                        <tr>
                          <td style="padding: 16px; font-size: ${baseFontSize}; color: #475569;">
                            <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">PAYMENT INFORMATION</p>
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; font-size: ${baseFontSize}; text-align: left;">
                              <tr>
                                <td style="padding: 2px 0; color: #64748b;">Account Name</td>
                                <td style="padding: 2px 0; font-weight: bold; color: #1e293b;">: ${customBrandName} Pty Ltd</td>
                              </tr>
                              <tr>
                                <td style="padding: 2px 0; color: #64748b;">BSB / Bank</td>
                                <td style="padding: 2px 0; font-weight: bold; color: #1e293b;">: 123-456 (Wellness Bank)</td>
                              </tr>
                              <tr>
                                <td style="padding: 2px 0; color: #64748b;">Account No.</td>
                                <td style="padding: 2px 0; font-weight: bold; color: #1e293b;">: 9876 5432 1098</td>
                              </tr>
                              <tr>
                                <td style="padding: 2px 0; color: #64748b;">Reference</td>
                                <td style="padding: 2px 0; font-weight: bold; color: #1e293b;">: INV-${invoiceNumber.slice(-8)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 0; font-family: 'Georgia', serif; font-style: italic; font-size: 16px; color: ${accentColor}; text-align: left;">
                        Thank You! ❤️
                      </p>
                      <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">
                        We appreciate your trust in our services. We look forward to serving you again.
                      </p>
                    </td>
                    
                    <!-- Bottom Right: Summary Calculations -->
                    <td width="45%" style="vertical-align: top;">
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; font-size: ${baseFontSize}; color: #475569;">
                        <tr>
                          <td style="padding: 6px 0; text-align: left;">Subtotal</td>
                          <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1e293b;">$${Number(subtotal).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; text-align: left;">Tax (GST 18%)</td>
                          <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1e293b;">$${Number(tax).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; text-align: left;">Discount</td>
                          <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #059669;">-$${Number(discount || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colspan="2" style="padding: 10px 0 0 0;">
                            <!-- Highlighted Total Box -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; background-color: ${accentColor}; border-radius: 8px; color: #ffffff;">
                              <tr>
                                <td style="padding: 12px; font-weight: bold; font-size: 13px;">TOTAL AMOUNT</td>
                                <td style="padding: 12px; font-weight: 800; font-size: 18px; text-align: right;">$${Number(amount).toFixed(2)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Bottom Line contact details & Core Badges -->
                <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">
                  
                  <!-- Badges block -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; margin-bottom: 20px; text-align: center; font-size: 11px; font-weight: bold; color: #64748b;">
                    <tr>
                      <td style="width: 25%;">🌿 Natural & Safe</td>
                      <td style="width: 25%;">✨ Hygienic & Clean</td>
                      <td style="width: 25%;">⏰ On-time Service</td>
                      <td style="width: 25%;">❤️ Customer Care</td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0;">
                    This transaction is securely processed in accordance with our terms of service.<br />
                    Powered by <strong>Velvetbook</strong>
                  </p>
                </div>

              </td>
            </tr>
          </table>
        </div>
      `,
    });
  }
}
