import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Subject } from 'rxjs';

@Injectable()
export class ChatService {
  private readonly messageSubject = new Subject<any>();
  public readonly message$ = this.messageSubject.asObservable();
  
  private readonly readSubject = new Subject<any>();
  public readonly read$ = this.readSubject.asObservable();

  constructor(private readonly databaseService: DatabaseService) {}

  private calcFinalPrice(params: {
    basePrice: number;
    discountType?: 'percent' | 'fixed' | null;
    discountValue?: number | null;
  }) {
    const base = Number(params.basePrice || 0);
    const type = params.discountType || null;
    const val = params.discountValue === undefined || params.discountValue === null ? null : Number(params.discountValue);
    let discountAmount = 0;
    if (type === 'percent' && val !== null) {
      const pct = Math.max(0, Math.min(100, val));
      discountAmount = (base * pct) / 100;
    } else if (type === 'fixed' && val !== null) {
      discountAmount = Math.max(0, val);
    }
    const finalPrice = Math.max(0, base - discountAmount);
    return { basePrice: base, discountAmount, finalPrice };
  }

  // Get conversations for a user (client or expert)
  async getConversations(userId: string, userType: string = 'client') {
    const validType = (userType === 'expert' ? 'expert' : 'client') as 'client' | 'expert';
    const convos = await this.databaseService.findConversationsByUserId(userId, validType);
    return { conversations: convos };
  }

  // Get messages for a conversation
  async getMessages(userId: string, conversationId: string, page: number, limit: number) {
    return await this.databaseService.findMessagesByConversationId(conversationId, page, limit);
  }

  // Send message via REST API
  async sendMessage(userId: string, conversationId: string, messageData: any) {
    // 1. Find the conversation by ID first
    let convo = await this.databaseService.findConversationById(conversationId);
    
    // 2. Fallback to legacy participant-based lookup if ID search fails
    if (!convo) {
      convo = await this.databaseService.findOrCreateConversation({
        clientId: messageData.clientId || userId,
        expertId: messageData.expertId || messageData.recipientId,
        type: 'expert',
      });
    }

    const senderType = messageData.senderType || 'client';
    
    // 3. Robust recipient identification
    let recipientId = messageData.recipientId || (senderType === 'client' ? convo.expertId : convo.clientId);
    let recipientType = messageData.recipientType || (senderType === 'client' ? 'expert' : 'client');

    const savedMessage = await this.databaseService.createMessage({
      conversationId: convo.id,
      senderId: userId,
      senderType,
      content: messageData.message || messageData.content,
      recipientId,
      recipientType,
      messageType: messageData.contentType || 'text',
      payload: messageData.payload || null,
    });

    // Notify listeners (like ChatGateway) for real-time delivery
    this.messageSubject.next({ ...savedMessage, organizationId: convo.organizationId });

    return savedMessage;
  }

  // Save message to database (for WebSocket path)
  async saveMessage(messageData: {
    conversationId: string;
    senderId: string;
    senderType: string;
    message: string;
    recipientType: string;
    recipientId: string;
    contentType?: string;
  }) {
    const savedMessage = await this.databaseService.createMessage({
      conversationId: messageData.conversationId,
      senderId: messageData.senderId,
      senderType: messageData.senderType,
      content: messageData.message,
      recipientId: messageData.recipientId,
      recipientType: messageData.recipientType,
      messageType: messageData.contentType || 'text',
      payload: (messageData as any).payload || null,
    });

    // Fetch conversation to get organizationId for broadcasting
    const convo = await this.databaseService.findConversationById(messageData.conversationId);
    
    // Notify listeners for real-time delivery
    this.messageSubject.next({ ...savedMessage, organizationId: convo?.organizationId });

    return savedMessage;
  }

  // Get or create conversation
  async getOrCreateConversation(participants: {
    clientId: string;
    expertId?: string;
    organizationId?: string;
    type: 'expert' | 'organization';
  }) {
    const convo = await this.databaseService.findOrCreateConversation({
      clientId: participants.clientId,
      expertId: participants.expertId,
      type: participants.type,
    });

    return {
      id: convo.id,
      _id: convo.id,
      type: convo.type,
      clientId: convo.clientId,
      expertId: convo.expertId,
      status: convo.status,
      createdAt: convo.createdAt,
      updatedAt: convo.updatedAt,
    };
  }

  // Mark messages as read
  async markAsRead(conversationId: string, userId: string, userType: string) {
    await this.databaseService.markMessagesAsRead(conversationId, userId, userType);
    
    // Broadcast the read event
    const convo = await this.databaseService.findConversationById(conversationId);
    this.readSubject.next({ conversationId, readByUserId: userId, organizationId: convo?.organizationId });
    
    return { success: true };
  }

  async sendOffer(organizationUserId: string, conversationId: string, data: any) {
    const convo = await this.databaseService.findConversationById(conversationId);
    if (!convo) throw new BadRequestException('Conversation not found');
    if (!convo.clientId) throw new BadRequestException('Conversation client not found');

    const orgProfile = await this.databaseService.ensureOrganizationProfile(organizationUserId);
    if (!orgProfile) throw new BadRequestException('Organization not found');

    // Ensure this offer is being sent by the org that owns the conversation (if conversation is linked)
    if (convo.organizationId && convo.organizationId !== orgProfile.id) {
      throw new BadRequestException('Conversation does not belong to this organization');
    }

    const itemsInput: any[] = Array.isArray(data?.items) ? data.items : [];
    if (itemsInput.length === 0) throw new BadRequestException('Offer items are required');

    const orgServices = (await this.databaseService.listOrganizationServices(organizationUserId)) as any[];
    const serviceById = new Map<string, any>(orgServices.map((s: any) => [s.id, s]));

    const items = itemsInput.map((i) => {
      if (i.serviceId) {
        const svc = serviceById.get(String(i.serviceId));
        if (!svc) throw new BadRequestException('Invalid service in offer');
        const quantity = Math.max(1, Number(i.quantity || 1));
        const base = Number(svc.basePrice);
        const discountType = (svc.discountType as any) || null;
        const discountValue = svc.discountValue === null || svc.discountValue === undefined ? null : Number(svc.discountValue);
        const { discountAmount, finalPrice } = this.calcFinalPrice({ basePrice: base, discountType, discountValue });
        return {
          serviceId: svc.id,
          nameSnapshot: svc.name,
          basePriceSnapshot: base.toFixed(2),
          discountTypeSnapshot: discountType,
          discountValueSnapshot: discountValue === null ? null : discountValue.toFixed(2),
          finalPriceSnapshot: finalPrice.toFixed(2),
          quantity,
          _calc: { base, discountAmount, finalPrice },
        };
      }

      // Custom one-off service (emergency)
      if (!i.name) throw new BadRequestException('Custom service name is required');
      const quantity = Math.max(1, Number(i.quantity || 1));
      const base = Number(i.basePrice || 0);
      const discountType = (i.discountType as any) || null;
      const discountValue = i.discountValue === undefined || i.discountValue === null ? null : Number(i.discountValue);
      const { discountAmount, finalPrice } = this.calcFinalPrice({ basePrice: base, discountType, discountValue });
      return {
        serviceId: null,
        nameSnapshot: String(i.name),
        basePriceSnapshot: base.toFixed(2),
        discountTypeSnapshot: discountType,
        discountValueSnapshot: discountValue === null ? null : discountValue.toFixed(2),
        finalPriceSnapshot: finalPrice.toFixed(2),
        quantity,
        _calc: { base, discountAmount, finalPrice },
      };
    });

    const subtotal = items.reduce((sum, it: any) => sum + it._calc.base * it.quantity, 0);
    const discountTotal = items.reduce((sum, it: any) => sum + it._calc.discountAmount * it.quantity, 0);
    const total = items.reduce((sum, it: any) => sum + it._calc.finalPrice * it.quantity, 0);

    const offer = await this.databaseService.createOffer({
      conversationId: convo.id,
      organizationProfileId: orgProfile.id,
      clientId: convo.clientId,
      currency: data?.currency || 'USD',
      subtotal: subtotal.toFixed(2),
      discountTotal: discountTotal.toFixed(2),
      total: total.toFixed(2),
    });
    if (!offer) throw new BadRequestException('Unable to create offer');

    const savedItems = await this.databaseService.createOfferItems({
      offerId: offer.id,
      items: items.map((it: any) => ({
        serviceId: it.serviceId,
        nameSnapshot: it.nameSnapshot,
        basePriceSnapshot: it.basePriceSnapshot,
        discountTypeSnapshot: it.discountTypeSnapshot,
        discountValueSnapshot: it.discountValueSnapshot,
        finalPriceSnapshot: it.finalPriceSnapshot,
        quantity: it.quantity,
      })),
    });

    const payload = {
      offerId: offer.id,
      currency: offer.currency,
      subtotal: offer.subtotal,
      discountTotal: offer.discountTotal,
      total: offer.total,
      status: offer.status,
      items: savedItems,
    };

    const savedMessage = await this.databaseService.createMessage({
      conversationId: convo.id,
      senderId: organizationUserId,
      senderType: 'organization',
      content: data?.message || 'Offer',
      recipientId: convo.clientId,
      recipientType: 'client',
      messageType: 'offer',
      payload,
    });

    this.messageSubject.next({ ...savedMessage, organizationId: convo.organizationId || orgProfile.id });
    return { offerId: offer.id, message: savedMessage };
  }
}
