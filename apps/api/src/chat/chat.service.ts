import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Subject } from 'rxjs';

@Injectable()
export class ChatService {
  private readonly messageSubject = new Subject<any>();
  public readonly message$ = this.messageSubject.asObservable();

  constructor(private readonly databaseService: DatabaseService) {}

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
    });

    // Notify listeners (like ChatGateway) for real-time delivery
    this.messageSubject.next(savedMessage);

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
    });

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
    return { success: true };
  }
}
