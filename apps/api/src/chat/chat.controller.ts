import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AtGuard } from '../auth/guards/at.guard';
import { GetCurrentUserId } from '../common/decorators';

@Controller('chat')
@UseGuards(AtGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Get conversations — pass userType from query param
  @Get('/conversations')
  async getConversations(
    @GetCurrentUserId() userId: string,
    @Query('userType') userType: string = 'client',
  ) {
    return this.chatService.getConversations(userId, userType);
  }

  // Get messages
  @Get('/:conversationId/messages')
  async getMessages(
    @GetCurrentUserId() userId: string,
    @Param('conversationId') conversationId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.chatService.getMessages(userId, conversationId, page, limit);
  }

  // Send message
  @Post('/:conversationId/send')
  async sendMessage(
    @GetCurrentUserId() userId: string,
    @Param('conversationId') conversationId: string,
    @Body() messageData: any,
  ) {
    return this.chatService.sendMessage(userId, conversationId, messageData);
  }

  // Start expert conversation
  @Post('/expert/start')
  async startExpertConversation(
    @GetCurrentUserId() userId: string,
    @Body() data: { expertId: string; initialMessage?: string },
  ) {
    const conversation = await this.chatService.getOrCreateConversation({
      clientId: userId,
      expertId: data.expertId,
      type: 'expert',
    });

    if (data.initialMessage) {
      await this.chatService.saveMessage({
        conversationId: conversation.id || conversation._id,
        senderId: userId,
        senderType: 'client',
        message: data.initialMessage,
        recipientType: 'expert',
        recipientId: data.expertId,
      });
    }

    return conversation;
  }

  // Mark messages as read
  @Post('/:conversationId/read')
  async markAsRead(
    @GetCurrentUserId() userId: string,
    @Param('conversationId') conversationId: string,
    @Body() data: { userType?: string },
  ) {
    return this.chatService.markAsRead(conversationId, userId, data.userType || 'client');
  }
}
