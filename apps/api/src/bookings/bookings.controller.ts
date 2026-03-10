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

@Controller('experts/bookings')
export class BookingsController {
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
