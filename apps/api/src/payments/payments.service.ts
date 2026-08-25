import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private readonly databaseService: DatabaseService) {
    const stripeKey = process.env.STRIPE_SECRET_KEY || 'pk_live_51TnWxJRtWyTHe4oWlZxhSZEdAW3rbgItUZ8HkwrVywI6T2EOT5YjIsLTx0RLN4qlIXDiOzhwvnewOEjf3IxHTJHW00mpmnyhGk';
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-01-27.acacia' as any,
    });
  }

  // Create payment (Stripe PaymentIntent)
  async createPayment(userId: string, paymentData: any) {
    try {
      const amount = Number(paymentData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new BadRequestException('Invalid payment amount');
      }

      if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'pk_live_51TnWxJRtWyTHe4oWlZxhSZEdAW3rbgItUZ8HkwrVywI6T2EOT5YjIsLTx0RLN4qlIXDiOzhwvnewOEjf3IxHTJHW00mpmnyhGk') {
        return {
          message: 'Stripe PaymentIntent mock created successfully',
          paymentId: 'pi_mock_' + Math.random().toString(36).substring(2, 9),
          clientSecret: 'pi_mock_secret_' + Math.random().toString(36).substring(2, 9),
          amount: amount,
          status: 'pending',
        };
      }

      const amountInCents = Math.round(amount * 100);
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: paymentData.currency || 'usd',
        metadata: {
          userId,
          bookingId: paymentData.bookingId || '',
          ...paymentData.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        message: 'Stripe PaymentIntent created successfully',
        paymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: amount,
        status: 'pending',
      };
    } catch (err: any) {
      throw new BadRequestException('Failed to create payment intent: ' + err.message);
    }
  }

  // Helper to create payment intent for public checkout
  async createPublicPaymentIntent(bookingId: string, amount: number) {
    try {
      if (isNaN(amount) || amount <= 0) {
        throw new BadRequestException('Invalid payment amount');
      }

      if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'pk_live_51TnWxJRtWyTHe4oWlZxhSZEdAW3rbgItUZ8HkwrVywI6T2EOT5YjIsLTx0RLN4qlIXDiOzhwvnewOEjf3IxHTJHW00mpmnyhGk') {
        return {
          clientSecret: 'pi_mock_secret_' + Math.random().toString(36).substring(2, 9),
          paymentIntentId: 'pi_mock_' + Math.random().toString(36).substring(2, 9),
        };
      }

      const amountInCents = Math.round(amount * 100);
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: {
          bookingId,
          isPublicBooking: 'true',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (err: any) {
      throw new BadRequestException('Failed to create public payment intent: ' + err.message);
    }
  }

  // Verify payment status with Stripe
  async verifyPayment(verificationData: any) {
    try {
      const { paymentId } = verificationData;
      if (!paymentId) {
        throw new BadRequestException('Stripe paymentId is required');
      }

      if (paymentId.startsWith('pi_mock_')) {
        return {
          message: `Stripe payment verification: succeeded (mocked)`,
          paymentId: paymentId,
          status: 'completed',
        };
      }

      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);

      return {
        message: `Stripe payment verification: ${paymentIntent.status}`,
        paymentId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
      };
    } catch (err: any) {
      throw new BadRequestException('Failed to verify payment: ' + err.message);
    }
  }

  // Get payment history
  async getPaymentHistory(userId: string, page: number, limit: number) {
    // TODO: Implement actual database query
    return {
      payments: [
        {
          id: 'pay_1',
          amount: 2000,
          status: 'completed',
          date: new Date(),
          description: 'Consultation with Expert',
        },
      ],
      pagination: {
        page,
        limit,
        total: 1,
        totalPages: 1,
      },
    };
  }

  // Get invoice
  async getInvoice(paymentId: string, userId: string) {
    return {
      invoiceId: 'inv_' + Date.now(),
      paymentId,
      amount: 2000,
      status: 'paid',
      date: new Date(),
      items: [
        {
          description: 'Expert Consultation',
          quantity: 1,
          price: 2000,
        },
      ],
      total: 2000,
    };
  }

  // Create Stripe Express Connected Account for organization
  async createExpressAccount(email: string) {
    try {
      if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('pk_') || process.env.STRIPE_SECRET_KEY === 'pk_live_51TnWxJRtWyTHe4oWlZxhSZEdAW3rbgItUZ8HkwrVywI6T2EOT5YjIsLTx0RLN4qlIXDiOzhwvnewOEjf3IxHTJHW00mpmnyhGk') {
        const mockAccountId = 'acct_mock_' + Math.random().toString(36).substring(2, 10);
        return {
          id: mockAccountId,
          type: 'express',
          mocked: true,
        };
      }

      try {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        const response = await fetch('https://api.stripe.com/v2/core/accounts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Stripe-Version': '2026-06-24.preview',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contact_email: email,
            display_name: 'Organization Partner',
            dashboard: 'express',
            identity: {
              country: 'au',
            },
            configuration: {
              recipient: {
                capabilities: {
                  stripe_balance: {
                    stripe_transfers: {
                      requested: true
                    }
                  }
                }
              }
            },
            defaults: {
              responsibilities: {
                fees_collector: 'application',
                losses_collector: 'application'
              }
            }
          }),
        });

        if (response.ok) {
          const account: any = await response.json();
          return {
            id: account.id,
            type: 'express',
            mocked: false,
          };
        }

        const errorText = await response.text();
        if (errorText.includes('accounts_v2_access_blocked') || errorText.includes('Accounts v2 is not enabled')) {
          return await this.createExpressAccountV1(email);
        }
        throw new Error(`Stripe v2 API error: ${response.statusText} - ${errorText}`);
      } catch (err: any) {
        const msg = err.message || '';
        if (msg.includes('accounts_v2_access_blocked') || msg.includes('Accounts v2 is not enabled')) {
          return await this.createExpressAccountV1(email);
        }
        throw err;
      }
    } catch (err: any) {
      throw new BadRequestException('Failed to create Stripe connected account: ' + err.message);
    }
  }

  // Fallback V1 Creation
  private async createExpressAccountV1(email: string) {
    const account = await this.stripe.accounts.create({
      type: 'express',
      email: email,
      capabilities: {
        transfers: { requested: true },
      },
    });

    return {
      id: account.id,
      type: account.type,
      mocked: false,
    };
  }

  // Create Stripe Account Link for onboarding redirection
  async createAccountLink(accountId: string, returnUrl: string, refreshUrl: string) {
    try {
      if (accountId.startsWith('acct_mock_')) {
        return {
          url: returnUrl + '?status=success&mock=true',
        };
      }

      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return {
        url: accountLink.url,
      };
    } catch (err: any) {
      throw new BadRequestException('Failed to create Stripe account link: ' + err.message);
    }
  }

  // Retrieve Connected Account details
  async retrieveConnectedAccount(accountId: string) {
    try {
      if (accountId.startsWith('acct_mock_')) {
        return {
          id: accountId,
          details_submitted: true,
          payouts_enabled: true,
          mocked: true,
        };
      }

      const account = await this.stripe.accounts.retrieve(accountId);
      return {
        id: account.id,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        mocked: false,
      };
    } catch (err: any) {
      throw new BadRequestException('Failed to retrieve connected account: ' + err.message);
    }
  }

  // Transfer funds from platform account to Connected Account
  async createStripeTransfer(amount: number, destinationAccountId: string, currency: string = 'aud') {
    try {
      if (destinationAccountId.startsWith('acct_mock_')) {
        return {
          id: 'tr_mock_' + Math.random().toString(36).substring(2, 10),
          amount: amount,
          destination: destinationAccountId,
          status: 'succeeded',
          mocked: true,
        };
      }

      const amountInCents = Math.round(amount * 100);
      const transfer = await this.stripe.transfers.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        destination: destinationAccountId,
      });

      return {
        id: transfer.id,
        amount: transfer.amount,
        destination: transfer.destination,
        status: 'succeeded',
        mocked: false,
      };
    } catch (err: any) {
      throw new BadRequestException('Failed to execute Stripe Connect transfer: ' + err.message);
    }
  }
}

