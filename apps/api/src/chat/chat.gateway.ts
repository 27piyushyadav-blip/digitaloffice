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
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

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

  constructor(
    private readonly chatService: ChatService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    const token = client.handshake.auth.token;
    if (token) {
      try {
        const userInfo = await this.validateToken(token);
        client.userId = userInfo.userId;
        client.userType = userInfo.userType;
        client.organizationId = userInfo.organizationId;
        
        // Join user to their personal room
        client.join(`user_${client.userId}`);
        
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

  @SubscribeMessage('join-conversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const roomName = `conversation_${data.conversationId}`;
    client.join(roomName);

    // Mark messages as read when joining
    if (client.userId && client.userType) {
      await this.chatService.markAsRead(data.conversationId, client.userId, client.userType);
      
      // Notify the other user that messages have been read
      this.server.to(roomName).emit('messages-read', {
        conversationId: data.conversationId,
        readByUserId: client.userId,
      });
    }

    client.emit('joined-conversation', { conversationId: data.conversationId, roomName });
  }

  @SubscribeMessage('leave-conversation')
  async handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.leave(`conversation_${data.conversationId}`);
  }

  @SubscribeMessage('fetch-messages')
  async handleFetchMessages(
    @MessageBody() data: { conversationId: string; page?: number; limit?: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const result = await this.chatService.getMessages(
        client.userId,
        data.conversationId,
        data.page || 1,
        data.limit || 50,
      );
      client.emit('messages-loaded', result);
    } catch (error) {
      client.emit('error', { message: 'Failed to fetch messages' });
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody() data: {
      conversationId: string;
      content: string;
      contentType?: string;
      recipientId: string;
    },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const recipientType = client.userType === 'client' ? 'expert' : 'client';
      
      const savedMessage = await this.chatService.saveMessage({
        conversationId: data.conversationId,
        senderId: client.userId,
        senderType: client.userType,
        message: data.content,
        recipientType,
        recipientId: data.recipientId,
        contentType: data.contentType || 'text',
      });

      // Emit to the conversation room (both sender & recipient if they're in the room)
      this.server.to(`conversation_${data.conversationId}`).emit('new-message', savedMessage);

      // Also emit to the recipient's personal room (for sidebar updates even if not in the conversation room)
      this.server.to(`user_${data.recipientId}`).emit('new-message', savedMessage);

      // Emit confirmation to sender (in case they're not in the conversation room yet)
      client.emit('message-sent', savedMessage);

    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('typing-start')
  async handleTypingStart(
    @MessageBody() data: { conversationId: string; recipientId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.server.to(`user_${data.recipientId}`).emit('user-typing', {
      conversationId: data.conversationId,
      typerId: client.userId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing-stop')
  async handleTypingStop(
    @MessageBody() data: { conversationId: string; recipientId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.server.to(`user_${data.recipientId}`).emit('user-typing', {
      conversationId: data.conversationId,
      typerId: client.userId,
      isTyping: false,
    });
  }

  @SubscribeMessage('mark-read')
  async handleMarkRead(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (client.userId && client.userType) {
      await this.chatService.markAsRead(data.conversationId, client.userId, client.userType);
      
      this.server.to(`conversation_${data.conversationId}`).emit('messages-read', {
        conversationId: data.conversationId,
        readByUserId: client.userId,
      });
    }
  }

  private async validateToken(token: string): Promise<{
    userId: string;
    userType: 'client' | 'expert' | 'organization';
    organizationId?: string;
  }> {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const payload: any = this.jwtService.verify(token, { secret });
    
    return {
      userId: payload.sub,
      userType: payload.role || 'client',
      organizationId: payload.organizationId,
    };
  }
}
