import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Body,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { GetCurrentUserId } from '../common/decorators';
import { AtGuard } from '../auth/guards/at.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('bookings')
@UseGuards(AtGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async createBooking(
    @GetCurrentUserId() clientId: string,
    @Body() bookingData: {
      expertId: string;
      organizationId?: string;
      service: string;
      consultationType: string;
      scheduledDate: string;
      duration: number;
      amount: number;
      notes?: string;
    },
  ) {
    return this.bookingsService.createBooking(clientId, bookingData);
  }

  @Get('my')
  async getClientBookings(
    @GetCurrentUserId() clientId: string,
    @Query('status') status?: string,
  ) {
    const bookings = await this.bookingsService.getClientBookings(clientId, status);
    return bookings;
  }

  @Public()
  @Get('public/:bookingId')
  async getPublicBookingDetails(
    @Param('bookingId') bookingId: string,
  ) {
    return this.bookingsService.getPublicBookingDetails(bookingId);
  }

  @Public()
  @Post('public/:bookingId/pay')
  async payPublicBooking(
    @Param('bookingId') bookingId: string,
  ) {
    return this.bookingsService.payPublicBooking(bookingId);
  }

  @Public()
  @Get('public/:bookingId/receipt')
  async getPublicBookingReceipt(
    @Param('bookingId') bookingId: string,
  ) {
    return this.bookingsService.getPublicBookingReceipt(bookingId);
  }

  @Get(':bookingId')
  async getBookingDetails(
    @GetCurrentUserId() userId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.bookingsService.getBookingDetails(userId, bookingId);
  }

  @Post(':bookingId/cancel')
  async cancelBooking(
    @GetCurrentUserId() userId: string,
    @Param('bookingId') bookingId: string,
    @Body() body: { reason?: string },
  ) {
    return this.bookingsService.cancelBooking(userId, bookingId, body.reason);
  }
}

@Controller('experts/bookings')
@UseGuards(AtGuard)
export class ExpertBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  async getExpertBookings(
    @GetCurrentUserId() expertId: string,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.getExpertBookings(expertId, status);
  }

  @Get(':bookingId')
  async getBookingDetails(
    @GetCurrentUserId() expertId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.bookingsService.getBookingDetails(expertId, bookingId);
  }

  @Post(':bookingId/accept')
  async acceptBooking(
    @GetCurrentUserId() expertId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.bookingsService.acceptBooking(expertId, bookingId);
  }

  @Post(':bookingId/reject')
  async rejectBooking(
    @GetCurrentUserId() expertId: string,
    @Param('bookingId') bookingId: string,
    @Body() body: { reason?: string },
  ) {
    return this.bookingsService.rejectBooking(expertId, bookingId, body.reason);
  }

  @Post(':bookingId/cancel')
  async cancelBooking(
    @GetCurrentUserId() expertId: string,
    @Param('bookingId') bookingId: string,
    @Body() body: { reason?: string },
  ) {
    return this.bookingsService.cancelBooking(expertId, bookingId, body.reason);
  }
}
