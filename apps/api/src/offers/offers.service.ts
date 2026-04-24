import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class OffersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async acceptOffer(userId: string, offerId: string) {
    const data = await this.databaseService.getOfferWithItems(offerId);
    if (!data) throw new BadRequestException('Offer not found');
    if (data.offer.clientId !== userId) throw new BadRequestException('Not allowed');
    if (data.offer.status !== 'sent') return { offer: data.offer, items: data.items };
    const updated = await this.databaseService.acceptOffer(offerId);
    return { offer: updated, items: data.items };
  }

  async payOffer(userId: string, offerId: string) {
    const data = await this.databaseService.getOfferWithItems(offerId);
    if (!data) throw new BadRequestException('Offer not found');
    if (data.offer.clientId !== userId) throw new BadRequestException('Not allowed');
    if (data.offer.status !== 'accepted' && data.offer.status !== 'sent') {
      throw new BadRequestException('Offer is not payable');
    }

    // Ensure accepted
    if (data.offer.status === 'sent') {
      await this.databaseService.acceptOffer(offerId);
    }

    const payment = await this.paymentsService.createPayment(userId, {
      amount: Number(data.offer.total),
      currency: data.offer.currency,
      offerId,
      description: `Offer ${offerId}`,
    });

    return { offerId, payment };
  }

  // Hook into existing verify flow for now (until real gateway webhooks)
  async markPaid(offerId: string) {
    const updated = await this.databaseService.markOfferPaid(offerId);
    if (!updated) throw new BadRequestException('Offer not found');
    return { offer: updated };
  }
}

