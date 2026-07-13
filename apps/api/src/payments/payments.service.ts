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
}

