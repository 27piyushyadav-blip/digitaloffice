import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AtGuard } from '../auth/guards/at.guard';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: 'client' | 'expert' | 'organization';
  organizationId?: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  constructor(private readonly chatService: ChatService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Extract user info from token (you'll need to implement token validation)
    const token = client.handshake.auth.token;
    if (token) {
      try {
        // TODO: Validate JWT token and extract user info
        // For now, we'll mock the user info
        const userInfo = await this.validateToken(token);
        client.userId = userInfo.userId;
        client.userType = userInfo.userType;
        client.organizationId = userInfo.organizationId;
        
        // Join user to their personal room
        client.join(`user_${client.userId}`);
        
        // Join organization room if applicable
        if (client.userType === 'organization' && client.organizationId) {
          client.join(`org_${client.organizationId}`);
        }
        
        this.logger.log(`User ${client.userId} (${client.userType}) authenticated`);
      } catch (error) {
        this.logger.error(`Authentication failed: ${error.message}`);
        client.disconnect();
      }
    } else {
      this.logger.error('No token provided');
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-expert-chat')
  async handleJoinExpertChat(
    @MessageBody() data: { expertId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (client.userType !== 'client') {
      client.emit('error', { message: 'Only clients can join expert chats' });
      return;
    }

    const roomName = `expert_${data.expertId}`;
    client.join(roomName);
    
    // Notify expert that client joined
    this.server.to(`user_${data.expertId}`).emit('client-joined', {
      clientId: client.userId,
      roomName,
    });

    client.emit('joined-chat', { roomName, type: 'expert' });
  }

  @SubscribeMessage('join-organization-chat')
  async handleJoinOrganizationChat(
    @MessageBody() data: { organizationId: string; expertId?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (client.userType !== 'client') {
      client.emit('error', { message: 'Only clients can join organization chats' });
      return;
    }

    const roomName = `org_${data.organizationId}`;
    client.join(roomName);
    
    // Notify organization members
    this.server.to(`org_${data.organizationId}`).emit('client-joined', {
      clientId: client.userId,
      expertId: data.expertId,
      roomName,
    });

    client.emit('joined-chat', { roomName, type: 'organization' });
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody() data: {
      conversationId: string;
      message: string;
      recipientType: 'expert' | 'organization';
      recipientId: string;
    },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      // Save message to database
      const savedMessage = await this.chatService.saveMessage({
        conversationId: data.conversationId,
        senderId: client.userId,
        senderType: client.userType,
        message: data.message,
        recipientType: data.recipientType,
        recipientId: data.recipientId,
      });

      // Determine target room
      let targetRoom: string;
      if (data.recipientType === 'expert') {
        targetRoom = `user_${data.recipientId}`;
      } else {
        targetRoom = `org_${data.recipientId}`;
      }

      // Send message to recipient
      this.server.to(targetRoom).emit('new-message', savedMessage);

      // Send confirmation to sender
      client.emit('message-sent', savedMessage);

    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('typing-start')
  async handleTypingStart(
    @MessageBody() data: { conversationId: string; recipientType: string; recipientId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    let targetRoom: string;
    if (data.recipientType === 'expert') {
      targetRoom = `user_${data.recipientId}`;
    } else {
      targetRoom = `org_${data.recipientId}`;
    }

    this.server.to(targetRoom).emit('user-typing', {
      conversationId: data.conversationId,
      userId: client.userId,
      userType: client.userType,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing-stop')
  async handleTypingStop(
    @MessageBody() data: { conversationId: string; recipientType: string; recipientId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    let targetRoom: string;
    if (data.recipientType === 'expert') {
      targetRoom = `user_${data.recipientId}`;
    } else {
      targetRoom = `org_${data.recipientId}`;
    }

    this.server.to(targetRoom).emit('user-typing', {
      conversationId: data.conversationId,
      userId: client.userId,
      userType: client.userType,
      isTyping: false,
    });
  }

  private async validateToken(token: string): Promise<{
    userId: string;
    userType: 'client' | 'expert' | 'organization';
    organizationId?: string;
  }> {
    // TODO: Implement actual JWT validation
    // For now, return mock data
    return {
      userId: 'mock_user_id',
      userType: 'client',
      organizationId: undefined,
    };
  }
}
