import {
  Controller,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EarningsService } from './earnings.service';
import { GetCurrentUserId } from '../common/decorators';

@Controller('experts/earnings')
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get('summary')
  async getEarningsSummary(@GetCurrentUserId() expertId: string) {
    return this.earningsService.getEarningsSummary(expertId);
  }

  @Get('transactions')
  async getTransactions(
    @GetCurrentUserId() expertId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.earningsService.getTransactions(expertId, page, limit);
  }

  @Get('payouts')
  async getPayoutHistory(
    @GetCurrentUserId() expertId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.earningsService.getPayoutHistory(expertId, page, limit);
  }
}
