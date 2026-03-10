import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AvailabilityService {
  constructor(private readonly databaseService: DatabaseService) {}

  async setAvailability(
    expertId: string,
    availabilityData: { day: string; startTime: string; endTime: string },
  ) {
    const { day, startTime, endTime } = availabilityData;

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new BadRequestException('Invalid time format. Use HH:MM format.');
    }

    // Validate that end time is after start time
    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time.');
    }

    // TODO: Save availability to database
    const availabilityId = 'avail_' + Date.now();

    return {
      message: 'Availability set successfully',
      availability: {
        id: availabilityId,
        expertId,
        day,
        startTime,
        endTime,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    };
  }

  async updateAvailability(
    expertId: string,
    availabilityId: string,
    updateData: { day?: string; startTime?: string; endTime?: string },
  ) {
    // TODO: Verify availability belongs to expert
    // TODO: Update availability in database

    return {
      message: 'Availability updated successfully',
      availabilityId,
      updatedFields: Object.keys(updateData),
    };
  }

  async getAvailability(expertId: string) {
    // TODO: Get availability from database
    const mockAvailability = [
      {
        id: 'avail_1',
        day: 'Monday',
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
      },
      {
        id: 'avail_2',
        day: 'Tuesday',
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
      },
      {
        id: 'avail_3',
        day: 'Wednesday',
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
      },
      {
        id: 'avail_4',
        day: 'Thursday',
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
      },
      {
        id: 'avail_5',
        day: 'Friday',
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
      },
    ];

    return {
      availability: mockAvailability,
      blockedSlots: [
        {
          id: 'block_1',
          startDate: '2024-12-25T00:00:00Z',
          endDate: '2024-12-25T23:59:59Z',
          reason: 'Christmas Holiday',
        },
      ],
    };
  }

  async blockTimeSlot(
    expertId: string,
    blockData: { startDate: string; endDate: string; reason?: string },
  ) {
    const { startDate, endDate, reason } = blockData;

    // TODO: Validate date format and logic
    // TODO: Save blocked time slot to database
    const blockId = 'block_' + Date.now();

    return {
      message: 'Time slot blocked successfully',
      blockedSlot: {
        id: blockId,
        expertId,
        startDate,
        endDate,
        reason: reason || 'Personal time',
        createdAt: new Date().toISOString(),
      },
    };
  }

  async deleteAvailability(expertId: string, availabilityId: string) {
    // TODO: Verify availability belongs to expert
    // TODO: Delete availability from database

    return {
      message: 'Availability deleted successfully',
      availabilityId,
    };
  }
}
