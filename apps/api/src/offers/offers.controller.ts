import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AtGuard } from '../auth/guards/at.guard';
import { GetCurrentUserId } from '../common/decorators';
import { OffersService } from './offers.service';

@Controller('offers')
@UseGuards(AtGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post('/:offerId/accept')
  async accept(@GetCurrentUserId() userId: string, @Param('offerId') offerId: string) {
    return this.offersService.acceptOffer(userId, offerId);
  }

  @Post('/:offerId/pay')
  async pay(@GetCurrentUserId() userId: string, @Param('offerId') offerId: string) {
    return this.offersService.payOffer(userId, offerId);
  }

  // Temporary: allow manual mark-paid using current mocked payment flow
  @Post('/:offerId/mark-paid')
  async markPaid(@Param('offerId') offerId: string) {
    return this.offersService.markPaid(offerId);
  }
}

