import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AtGuard } from '../auth/guards/at.guard';
import { GetCurrentUserId } from '../common/decorators';

@Controller('payments')
@UseGuards(AtGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Create payment
  @Post('/create')
  async createPayment(
    @GetCurrentUserId() userId: string,
    @Body() paymentData: any,
  ) {
    return this.paymentsService.createPayment(userId, paymentData);
  }

  // Verify payment
  @Post('/verify')
  async verifyPayment(@Body() verificationData: any) {
    return this.paymentsService.verifyPayment(verificationData);
  }

  // Get payment history
  @Get('/history')
  async getPaymentHistory(
    @GetCurrentUserId() userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.paymentsService.getPaymentHistory(userId, page, limit);
  }

  // Get invoice
  @Get('/:paymentId/invoice')
  async getInvoice(
    @Param('paymentId') paymentId: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.paymentsService.getInvoice(paymentId, userId);
  }
}
