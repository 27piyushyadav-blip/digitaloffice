import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

  // Send offer (organization)
  @Post('/:conversationId/send-offer')
  async sendOffer(
    @GetCurrentUserId() userId: string,
    @Param('conversationId') conversationId: string,
    @Body() data: any,
  ) {
    return this.chatService.sendOffer(userId, conversationId, data);
  }

  // Upload chat media
  @Post('/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/chat',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'video/mp4', 'video/quicktime', 'video/x-msvideo',
          'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'
        ];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Invalid file type'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  )
  async uploadMedia(
    @GetCurrentUserId() userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    
    // Convert to full URL
    const fileUrl = `${process.env.APP_URL || 'http://localhost:3000'}/uploads/chat/${file.filename}`;
    
    return {
      fileUrl,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
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
