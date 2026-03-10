import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AtGuard } from '../auth/guards/at.guard';
import { GetCurrentUserId } from '../common/decorators';

@Controller('reviews')
@UseGuards(AtGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Create review
  @Post('/')
  async createReview(
    @GetCurrentUserId() userId: string,
    @Body() reviewData: any,
  ) {
    return this.reviewsService.createReview(userId, reviewData);
  }

  // Get my reviews
  @Get('/my')
  async getMyReviews(
    @GetCurrentUserId() userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.reviewsService.getMyReviews(userId, page, limit);
  }
}
