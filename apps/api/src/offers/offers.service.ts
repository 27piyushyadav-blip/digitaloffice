import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PaymentsService } from '../payments/payments.service';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class OffersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly paymentsService: PaymentsService,
    private readonly chatService: ChatService,
  ) {}

  async acceptOffer(userId: string, offerId: string) {
    const data = await this.databaseService.getOfferWithItems(offerId);
    if (!data) throw new BadRequestException('Offer not found');
    if (data.offer.clientId !== userId) throw new BadRequestException('Not allowed');
    if (data.offer.status !== 'sent') return { offer: data.offer, items: data.items };
    const updated = await this.databaseService.acceptOffer(offerId);
    
    // Broadcast update
    this.chatService.emitOfferUpdate({
      conversationId: data.offer.conversationId,
      offerId: offerId,
      status: 'accepted',
      organizationId: data.offer.organizationId,
    });

    return { offer: updated, items: data.items };
  }

  async declineOffer(userId: string, offerId: string) {
    const data = await this.databaseService.getOfferWithItems(offerId);
    if (!data) throw new BadRequestException('Offer not found');
    if (data.offer.clientId !== userId) throw new BadRequestException('Not allowed');
    if (data.offer.status !== 'sent') return { offer: data.offer, items: data.items };
    const updated = await this.databaseService.declineOffer(offerId);
    
    // Broadcast update
    this.chatService.emitOfferUpdate({
      conversationId: data.offer.conversationId,
      offerId: offerId,
      status: 'cancelled',
      organizationId: data.offer.organizationId,
    });

    return { offer: updated, items: data.items };
  }

  async payOffer(userId: string, offerId: string, bookingData?: any) {
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

    // Save booking metadata if provided (Date, Time, Type, etc.)
    if (bookingData && bookingData.scheduledDate) {
      await this.databaseService.saveOfferBookingMetadata(offerId, {
        scheduledDate: bookingData.scheduledDate,
        time: bookingData.time,
        timezone: bookingData.timezone,
        consultationType: bookingData.type,
        expertId: bookingData.expertId,
      });
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
    const data = await this.databaseService.getOfferWithItems(offerId);
    if (!data) throw new BadRequestException('Offer not found');

    const updated = await this.databaseService.markOfferPaid(offerId);
    if (!updated) throw new BadRequestException('Offer not found');

    // Create booking if metadata exists
    if (updated.bookingMetadata) {
      const meta = updated.bookingMetadata as any;
      await this.databaseService.createBooking({
        clientId: updated.clientId,
        expertId: meta.expertId,
        organizationId: updated.organizationId,
        service: data.items.map(it => it.nameSnapshot).join(', '),
        consultationType: meta.consultationType === 'Video Call' ? 'online' : 'offline',
        scheduledDate: new Date(`${meta.scheduledDate}T${meta.time}:00`),
        duration: data.items.reduce((sum, it) => sum + (it as any).durationMinutes * it.quantity, 0) || 60,
        amount: updated.total,
      });
    }

    // Broadcast update
    this.chatService.emitOfferUpdate({
      conversationId: updated.conversationId,
      offerId: offerId,
      status: 'paid',
      organizationId: updated.organizationId,
    });

    return { offer: updated };
  }
}

