import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { GetCurrentUserId } from '../common/decorators';

@Controller('experts/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  async setAvailability(
    @GetCurrentUserId() expertId: string,
    @Body() body: { day: string; startTime: string; endTime: string },
  ) {
    const { day, startTime, endTime } = body;

    if (!day || !startTime || !endTime) {
      throw new BadRequestException('Day, start time, and end time are required');
    }

    return this.availabilityService.setAvailability(expertId, {
      day,
      startTime,
      endTime,
    });
  }

  @Put(':id')
  async updateAvailability(
    @GetCurrentUserId() expertId: string,
    @Param('id') availabilityId: string,
    @Body() body: { day?: string; startTime?: string; endTime?: string },
  ) {
    return this.availabilityService.updateAvailability(expertId, availabilityId, body);
  }

  @Get()
  async getAvailability(@GetCurrentUserId() expertId: string) {
    return this.availabilityService.getAvailability(expertId);
  }

  @Post('block')
  async blockTimeSlot(
    @GetCurrentUserId() expertId: string,
    @Body() body: { startDate: string; endDate: string; reason?: string },
  ) {
    const { startDate, endDate, reason } = body;

    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    return this.availabilityService.blockTimeSlot(expertId, {
      startDate,
      endDate,
      reason,
    });
  }

  @Delete(':id')
  async deleteAvailability(
    @GetCurrentUserId() expertId: string,
    @Param('id') availabilityId: string,
  ) {
    return this.availabilityService.deleteAvailability(expertId, availabilityId);
  }
}
