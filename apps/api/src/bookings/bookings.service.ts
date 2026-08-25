import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { MailService } from '@repo/mail';
import { sendInvoiceEmailHelper } from '../common/utils/invoice-email.util';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mailService: MailService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async createBooking(clientId: string, bookingData: {
    expertId: string;
    organizationId?: string;
    service: string;
    consultationType: string;
    scheduledDate: string;
    duration: number;
    amount: number;
    notes?: string;
    pointsToRedeem?: number;
  }) {
    const { expertId, organizationId, service, consultationType, scheduledDate, duration, amount, notes, pointsToRedeem } = bookingData;

    if (!expertId) {
      throw new BadRequestException('Expert ID is required');
    }
    if (!service) {
      throw new BadRequestException('Service is required');
    }
    if (!scheduledDate) {
      throw new BadRequestException('Scheduled date is required');
    }

    // 1. Calculate discount if points are redeemed
    let finalAmount = amount;
    let actualPointsToRedeem = 0;
    let pointsDiscountAmount = 0;

    if (pointsToRedeem && pointsToRedeem > 0 && organizationId) {
      // Fetch org settings
      const org = await this.databaseService.findOrganizationById(organizationId);
      if (org && org.loyaltyPointsEnabled) {
        const clientPoints = await this.databaseService.getClientOrganizationPoints(clientId, organizationId);
        const requestedPoints = Math.min(pointsToRedeem, clientPoints);
        
        // 1 point = 0.20 cents ($0.002)
        const calculatedDiscount = requestedPoints * 0.002;
        pointsDiscountAmount = Math.min(amount, calculatedDiscount);
        actualPointsToRedeem = Math.ceil(pointsDiscountAmount / 0.002);
        
        finalAmount = Math.max(0, amount - pointsDiscountAmount);
      }
    }

    // Parse the scheduled date string to Date object
    const scheduledDateTime = new Date(scheduledDate);

    // Create booking in database
    const booking = await this.databaseService.createBooking({
      clientId,
      expertId,
      organizationId: organizationId || null,
      service,
      consultationType: consultationType || 'online',
      scheduledDate: scheduledDateTime,
      duration,
      amount: String(finalAmount),
      pointsRedeemed: actualPointsToRedeem,
      pointsDiscountAmount: String(pointsDiscountAmount),
      notes: notes || null,
    });

    if (booking && booking.paymentStatus === 'paid') {
      sendInvoiceEmailHelper(this.databaseService, this.mailService, booking.id, 'payment').catch(err => {
        console.error('Failed to send invoice email after booking creation:', err);
      });
    }

    return {
      message: 'Booking created successfully',
      booking,
    };
  }

  async getClientBookings(clientId: string, status?: string) {
    const bookings = await this.databaseService.findClientBookings(clientId, status);
    return bookings;
  }

  async getExpertBookings(expertId: string, status?: string) {
    const bookings = await this.databaseService.findExpertBookings(expertId, status);
    return bookings;
  }

  async getBookingDetails(userId: string, bookingId: string) {
    const details = await this.databaseService.findBookingDetailsById(bookingId);
    if (!details || !details.booking) {
      throw new NotFoundException('Booking not found');
    }

    const booking = details.booking;

    // Verify the user has access to this booking
    if (booking.clientId !== userId && booking.expertId !== userId) {
      throw new NotFoundException('Booking not found');
    }

    return details;
  }

  async acceptBooking(expertId: string, bookingId: string) {
    const booking = await this.databaseService.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.expertId !== expertId) {
      throw new BadRequestException('You do not have permission to accept this booking');
    }

    if (booking.status !== 'pending') {
      throw new BadRequestException('Booking is not in pending status');
    }

    // Update booking status to confirmed
    await this.databaseService.updateBookingStatus(bookingId, 'confirmed', { acceptedAt: new Date() });

    return {
      message: 'Booking accepted successfully',
      bookingId,
      status: 'confirmed',
      acceptedAt: new Date().toISOString(),
    };
  }

  async rejectBooking(expertId: string, bookingId: string, reason?: string) {
    const booking = await this.databaseService.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.expertId !== expertId) {
      throw new BadRequestException('You do not have permission to reject this booking');
    }

    if (booking.status !== 'pending') {
      throw new BadRequestException('Booking is not in pending status');
    }

    // Update booking status to rejected
    await this.databaseService.updateBookingStatus(bookingId, 'rejected', { 
      rejectedAt: new Date(),
      rejectionReason: reason || 'Expert unavailable'
    });

    return {
      message: 'Booking rejected successfully',
      bookingId,
      status: 'rejected',
      reason: reason || 'Expert unavailable',
      rejectedAt: new Date().toISOString(),
    };
  }

  async cancelBooking(userId: string, bookingId: string, reason?: string) {
    const booking = await this.databaseService.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify the user has access to cancel this booking
    if (booking.clientId !== userId && booking.expertId !== userId) {
      throw new BadRequestException('You do not have permission to cancel this booking');
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      throw new BadRequestException('Cannot cancel a ' + booking.status + ' booking');
    }

    // Update booking status to cancelled
    await this.databaseService.updateBookingStatus(bookingId, 'cancelled', {
      cancelledAt: new Date(),
      cancellationReason: reason || 'Cancelled by user'
    });

    return {
      message: 'Booking cancelled successfully',
      bookingId,
      status: 'cancelled',
      reason: reason || 'Cancelled by user',
      cancelledAt: new Date().toISOString(),
    };
  }

  async getPublicBookingDetails(bookingId: string) {
    const details = await this.databaseService.findBookingDetailsById(bookingId);
    if (!details || !details.booking) {
      throw new NotFoundException('Booking not found');
    }

    const booking = details.booking;

    // Check if it's a voice call booking by checking notes JSON
    let parsedNotes: any = null;
    try {
      if (booking.notes) {
        parsedNotes = JSON.parse(booking.notes);
      }
    } catch (e) {
      // Not a JSON notes or not a voice call booking
    }

    if (!parsedNotes || !parsedNotes.isVoiceCallBooking) {
      throw new BadRequestException('This booking is not available for public checkout');
    }

    return {
      ...details,
      customerDetails: {
        name: parsedNotes.customerName,
        phone: parsedNotes.customerPhone,
        email: parsedNotes.customerEmail,
        notes: parsedNotes.customerNotes,
      },
      services: parsedNotes.services || [],
    };
  }

  async createPublicPaymentIntent(bookingId: string, pointsToRedeem?: number) {
    const booking = await this.databaseService.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if it's a voice call booking by checking notes JSON
    let parsedNotes: any = null;
    try {
      if (booking.notes) {
        parsedNotes = JSON.parse(booking.notes);
      }
    } catch (e) {
      // Not a JSON
    }

    if (!parsedNotes || !parsedNotes.isVoiceCallBooking) {
      throw new BadRequestException('This booking is not eligible for public payment');
    }

    let subtotal = Number(booking.amount);

    // Apply loyalty points if requested
    if (pointsToRedeem && pointsToRedeem > 0 && booking.organizationId) {
      const org = await this.databaseService.findOrganizationById(booking.organizationId);
      if (org && org.loyaltyPointsEnabled) {
        const clientPoints = await this.databaseService.getClientOrganizationPoints(booking.clientId, booking.organizationId);
        const requestedPoints = Math.min(pointsToRedeem, clientPoints);
        
        // 1 point = 0.20 cents ($0.002)
        const calculatedDiscount = requestedPoints * 0.002;
        const pointsDiscountAmount = Math.min(subtotal, calculatedDiscount);
        const actualPointsRedeemed = Math.ceil(pointsDiscountAmount / 0.002);
        
        subtotal = Math.max(0, subtotal - pointsDiscountAmount);

        // Deduct points from user balance
        await this.databaseService.updateClientOrganizationPoints(booking.clientId, booking.organizationId, -actualPointsRedeemed);

        // Update booking row amount and points details
        await this.databaseService.updateBookingPoints(bookingId, {
          amount: String(subtotal),
          pointsRedeemed: actualPointsRedeemed,
          pointsDiscountAmount: String(pointsDiscountAmount),
        });
      }
    }

    const tax = Math.round(subtotal * 0.05); // Match frontend 5% tax calculations
    const total = subtotal + tax;

    return this.paymentsService.createPublicPaymentIntent(bookingId, total);
  }

  async payPublicBooking(bookingId: string, paymentIntentId?: string) {
    const booking = await this.databaseService.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if it's a voice call booking by checking notes JSON
    let parsedNotes: any = null;
    try {
      if (booking.notes) {
        parsedNotes = JSON.parse(booking.notes);
      }
    } catch (e) {
      // Not a JSON
    }

    if (!parsedNotes || !parsedNotes.isVoiceCallBooking) {
      throw new BadRequestException('This booking is not eligible for public payment');
    }

    if (booking.paymentStatus === 'paid') {
      return {
        message: 'Booking is already paid',
        booking,
      };
    }

    // Verify Stripe payment intent status if provided
    if (paymentIntentId) {
      const stripeVerify = await this.paymentsService.verifyPayment({ paymentId: paymentIntentId });
      if (stripeVerify.status !== 'completed') {
        throw new BadRequestException('Stripe payment has not succeeded yet');
      }
    }

    // Update paymentStatus to paid, status to confirmed, acceptedAt to now
    const updated = await this.databaseService.updateBookingStatus(bookingId, 'confirmed', {
      paymentStatus: 'paid',
      acceptedAt: new Date(),
    });

    if (updated) {
      sendInvoiceEmailHelper(this.databaseService, this.mailService, updated.id, 'payment').catch(err => {
        console.error('Failed to send invoice email after payment:', err);
      });
    }

    return {
      message: 'Booking paid and confirmed successfully',
      booking: updated,
    };
  }

  async getPublicBookingReceipt(bookingId: string) {
    // Fetch booking + org details
    const details = await this.databaseService.findBookingDetailsById(bookingId);
    if (!details || !details.booking) {
      throw new NotFoundException('Booking not found');
    }

    const { booking, organization } = details;

    // Fetch payment invoice
    const invoice = await this.databaseService.findInvoiceByBookingIdAndType(bookingId, 'payment');

    // Resolve customer details from notes or fallback
    let customerName = 'Valued Customer';
    let customerEmail = '';
    let services: Array<{ name: string; price: number; quantity: number }> = [];

    let parsedNotes: any = null;
    try {
      if (booking.notes) parsedNotes = JSON.parse(booking.notes);
    } catch (e) {}

    if (parsedNotes) {
      customerName = parsedNotes.customerName || customerName;
      customerEmail = parsedNotes.customerEmail || customerEmail;
      services = Array.isArray(parsedNotes.services) ? parsedNotes.services : [];
    }

    if (services.length === 0) {
      services = [{ name: booking.service, price: Number(booking.amount), quantity: 1 }];
    }

    if (!invoice) {
      // Return a minimal receipt even if invoice record not found
      return {
        invoiceNumber: `INV-${bookingId.slice(0, 8).toUpperCase()}`,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        bookingId: booking.id,
        type: 'payment',
        customerName,
        customerEmail,
        orgName: (organization as any)?.name || 'Digital Office',
        orgAddress: (organization as any)?.addressLine1 || (organization as any)?.location || '',
        orgPhone: (organization as any)?.phone || (organization as any)?.phoneNumber || '',
        orgEmail: (organization as any)?.officialEmail || (organization as any)?.email || '',
        invoiceCustomization: (organization as any)?.invoiceCustomization || null,
        services,
        subtotal: Number(booking.amount),
        tax: 0,
        discount: 0,
        amount: Number(booking.amount),
      };
    }

    let metadata: any = invoice.metadata;
    if (metadata && typeof metadata === 'string') {
      try { metadata = JSON.parse(metadata); } catch (e) {}
    }

    if (metadata?.customerName) customerName = metadata.customerName;
    if (metadata?.customerEmail) customerEmail = metadata.customerEmail;
    if (Array.isArray(metadata?.services) && metadata.services.length > 0) {
      services = metadata.services;
    }

    const dateFormatted = new Date(invoice.issuedAt).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

    return {
      invoiceNumber: invoice.invoiceNumber,
      date: dateFormatted,
      bookingId: booking.id,
      type: invoice.type,
      customerName,
      customerEmail,
      orgName: (organization as any)?.name || 'Digital Office',
      orgAddress: (organization as any)?.addressLine1 || (organization as any)?.location || '',
      orgPhone: (organization as any)?.phone || (organization as any)?.phoneNumber || '',
      orgEmail: (organization as any)?.officialEmail || (organization as any)?.email || '',
      services: services.map((s: any) => ({
        name: s.name,
        price: Number(s.price),
        quantity: Number(s.quantity || 1),
      })),
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      discount: Number(invoice.discount || 0),
      amount: Number(invoice.amount),
      invoiceCustomization: (organization as any)?.invoiceCustomization || null,
    };
  }
}
