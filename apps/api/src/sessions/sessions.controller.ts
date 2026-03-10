import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { GetCurrentUserId } from '../common/decorators';

@Controller('experts/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post(':bookingId/start')
  async startSession(
    @GetCurrentUserId() expertId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.sessionsService.startSession(expertId, bookingId);
  }

  @Get(':bookingId/join')
  async joinSession(
    @GetCurrentUserId() expertId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.sessionsService.joinSession(expertId, bookingId);
  }

  @Post(':bookingId/end')
  async endSession(
    @GetCurrentUserId() expertId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.sessionsService.endSession(expertId, bookingId);
  }

  @Post(':sessionId/whiteboard')
  async createWhiteboardSession(
    @GetCurrentUserId() expertId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.sessionsService.createWhiteboardSession(expertId, sessionId);
  }

  @Post(':sessionId/whiteboard/save')
  async saveWhiteboard(
    @GetCurrentUserId() expertId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.sessionsService.saveWhiteboard(expertId, sessionId);
  }
}
