import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getNotifications(
    expertId: string,
    page?: number,
    limit?: number,
    unreadOnly?: boolean,
  ) {
    const pageNum = page || 1;
    const limitNum = limit || 10;

    // TODO: Get notifications from database with filters and pagination
    const mockNotifications = [
      {
        id: 'notif_1',
        title: 'New Booking Request',
        message: 'John Doe has requested a Tax Consultation for March 15, 2024',
        type: 'booking_request',
        isRead: false,
        createdAt: '2024-03-10T14:30:00Z',
        data: {
          bookingId: 'booking_1',
          clientId: 'client_123',
          clientName: 'John Doe',
        },
      },
      {
        id: 'notif_2',
        title: 'Profile Update Approved',
        message: 'Your profile changes have been approved by the admin',
        type: 'profile_approved',
        isRead: true,
        createdAt: '2024-03-09T10:15:00Z',
        data: {
          profileId: 'profile_123',
        },
      },
      {
        id: 'notif_3',
        title: 'Payment Processed',
        message: 'Your payout of $1,800 has been processed successfully',
        type: 'payment',
        isRead: false,
        createdAt: '2024-03-08T12:00:00Z',
        data: {
          payoutId: 'payout_1',
          amount: 1800,
        },
      },
      {
        id: 'notif_4',
        title: 'Session Reminder',
        message: 'You have a session with Jane Smith in 30 minutes',
        type: 'session_reminder',
        isRead: false,
        createdAt: '2024-03-07T13:30:00Z',
        data: {
          bookingId: 'booking_2',
          sessionId: 'session_456',
          startTime: '2024-03-07T14:00:00Z',
        },
      },
    ];

    let filteredNotifications = mockNotifications;

    if (unreadOnly) {
      filteredNotifications = mockNotifications.filter(n => !n.isRead);
    }

    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

    return {
      notifications: paginatedNotifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredNotifications.length,
        totalPages: Math.ceil(filteredNotifications.length / limitNum),
      },
      unreadCount: mockNotifications.filter(n => !n.isRead).length,
    };
  }

  async markNotificationRead(expertId: string, notificationId: string) {
    // TODO: Verify notification belongs to expert
    // TODO: Update notification read status in database

    return {
      message: 'Notification marked as read',
      notificationId,
      markedAt: new Date().toISOString(),
    };
  }

  async markAllNotificationsRead(expertId: string) {
    // TODO: Update all notifications for expert as read in database

    return {
      message: 'All notifications marked as read',
      markedAt: new Date().toISOString(),
      count: 3, // Number of notifications that were marked as read
    };
  }

  async getUnreadCount(expertId: string) {
    // TODO: Get unread count from database
    return {
      unreadCount: 3,
      totalCount: 10,
    };
  }
}
