import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class EarningsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getEarningsSummary(expertId: string) {
    // TODO: Calculate actual earnings from database
    return {
      totalEarnings: 50000,
      pendingPayout: 10000,
      completedPayout: 40000,
      thisMonthEarnings: 12000,
      lastMonthEarnings: 8500,
      averagePerSession: 2000,
      totalSessions: 25,
      currency: 'USD',
    };
  }

  async getTransactions(expertId: string, page?: number, limit?: number) {
    const pageNum = page || 1;
    const limitNum = limit || 10;

    // TODO: Get transactions from database with pagination
    const mockTransactions = [
      {
        id: 'txn_1',
        bookingId: 'booking_1',
        amount: 2000,
        commission: 200, // 10% platform fee
        netAmount: 1800,
        status: 'completed',
        type: 'session_payment',
        description: 'Tax Consultation - Online',
        createdAt: '2024-03-10T14:30:00Z',
        completedAt: '2024-03-10T16:15:00Z',
      },
      {
        id: 'txn_2',
        bookingId: 'booking_2',
        amount: 3000,
        commission: 300,
        netAmount: 2700,
        status: 'pending',
        type: 'session_payment',
        description: 'Financial Planning - Offline',
        createdAt: '2024-03-11T09:15:00Z',
        completedAt: null,
      },
      {
        id: 'txn_3',
        amount: 1800,
        commission: 0,
        netAmount: 1800,
        status: 'completed',
        type: 'payout',
        description: 'Weekly Payout',
        createdAt: '2024-03-08T10:00:00Z',
        completedAt: '2024-03-08T12:00:00Z',
      },
    ];

    return {
      transactions: mockTransactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: mockTransactions.length,
        totalPages: Math.ceil(mockTransactions.length / limitNum),
      },
    };
  }

  async getPayoutHistory(expertId: string, page?: number, limit?: number) {
    const pageNum = page || 1;
    const limitNum = limit || 10;

    // TODO: Get payout history from database with pagination
    const mockPayouts = [
      {
        id: 'payout_1',
        amount: 1800,
        status: 'completed',
        method: 'bank_transfer',
        bankAccount: '****1234',
        processedAt: '2024-03-08T12:00:00Z',
        createdAt: '2024-03-08T10:00:00Z',
        transactionId: 'TXN123456789',
      },
      {
        id: 'payout_2',
        amount: 2200,
        status: 'processing',
        method: 'bank_transfer',
        bankAccount: '****1234',
        processedAt: null,
        createdAt: '2024-03-15T10:00:00Z',
        transactionId: null,
      },
      {
        id: 'payout_3',
        amount: 1500,
        status: 'failed',
        method: 'bank_transfer',
        bankAccount: '****1234',
        processedAt: null,
        createdAt: '2024-03-01T10:00:00Z',
        transactionId: null,
        failureReason: 'Bank account verification failed',
      },
    ];

    return {
      payouts: mockPayouts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: mockPayouts.length,
        totalPages: Math.ceil(mockPayouts.length / limitNum),
      },
    };
  }
}
