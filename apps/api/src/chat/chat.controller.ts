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

  // Get conversations
  @Get('/conversations')
  async getConversations(@GetCurrentUserId() userId: string) {
    return this.chatService.getConversations(userId);
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
}
