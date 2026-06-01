import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class BookingsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createBooking(clientId: string, bookingData: {
    expertId: string;
    organizationId?: string;
    service: string;
    consultationType: string;
    scheduledDate: string;
    duration: number;
    amount: number;
    notes?: string;
  }) {
    const { expertId, organizationId, service, consultationType, scheduledDate, duration, amount, notes } = bookingData;

    if (!expertId) {
      throw new BadRequestException('Expert ID is required');
    }
    if (!service) {
      throw new BadRequestException('Service is required');
    }
    if (!scheduledDate) {
      throw new BadRequestException('Scheduled date is required');
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
      amount: String(amount),
    });

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
}
