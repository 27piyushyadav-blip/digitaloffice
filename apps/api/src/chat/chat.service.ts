import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ChatService {
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
    // Determine sender/recipient types from the conversation
    const convo = await this.databaseService.findOrCreateConversation({
      clientId: messageData.clientId || userId,
      expertId: messageData.expertId || messageData.recipientId,
      type: 'expert',
    });

    const senderType = messageData.senderType || 'client';
    const recipientType = senderType === 'client' ? 'expert' : 'client';
    const recipientId = senderType === 'client' ? convo.expertId : convo.clientId;

    const savedMessage = await this.databaseService.createMessage({
      conversationId,
      senderId: userId,
      senderType,
      content: messageData.message || messageData.content,
      recipientId,
      recipientType,
      messageType: messageData.contentType || 'text',
    });

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
