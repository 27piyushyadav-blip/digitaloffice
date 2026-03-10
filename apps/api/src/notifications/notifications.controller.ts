import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { GetCurrentUserId } from '../common/decorators';

@Controller('experts/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @GetCurrentUserId() expertId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    return this.notificationsService.getNotifications(
      expertId,
      page,
      limit,
      unreadOnly,
    );
  }

  @Post(':id/read')
  async markNotificationRead(
    @GetCurrentUserId() expertId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.markNotificationRead(expertId, notificationId);
  }

  @Post('mark-all-read')
  async markAllNotificationsRead(@GetCurrentUserId() expertId: string) {
    return this.notificationsService.markAllNotificationsRead(expertId);
  }

  @Get('unread-count')
  async getUnreadCount(@GetCurrentUserId() expertId: string) {
    return this.notificationsService.getUnreadCount(expertId);
  }
}
