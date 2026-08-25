import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { AtGuard } from '../auth/guards/at.guard';
import { GetCurrentUserId } from '../common/decorators';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('users')
@UseGuards(AtGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Get current user profile
  @Get('/profile')
  async getProfile(@GetCurrentUserId() userId: string) {
    return this.usersService.getProfile(userId);
  }

  // Update user profile
  @Put('/profile')
  async updateProfile(
    @GetCurrentUserId() userId: string,
    @Body() updateData: any,
  ) {
    return this.usersService.updateProfile(userId, updateData);
  }

  // Upload profile image
  @Post('/profile/image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileExt = extname(file.originalname);
          cb(null, `user-${uniqueSuffix}${fileExt}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|avif/;
        const fileExt = extname(file.originalname).toLowerCase();
        const isExtAllowed = allowedTypes.test(fileExt);
        const isMimeTypeAllowed = allowedTypes.test(file.mimetype);
        if (isMimeTypeAllowed && isExtAllowed) {
          return cb(null, true);
        } else {
          return cb(new Error('Only image files are allowed!'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadProfileImage(
    @GetCurrentUserId() userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadProfileImage(userId, file);
  }

  // Get current user
  @Get('/me')
  async getCurrentUser(@GetCurrentUserId() userId: string) {
    return this.usersService.getCurrentUser(userId);
  }

  // Get user dashboard
  @Get('/dashboard')
  async getDashboard(@GetCurrentUserId() userId: string) {
    return this.usersService.getDashboard(userId);
  }

  // Get client loyalty points for a specific organization
  @Get('/loyalty-points/:orgId')
  async getLoyaltyPoints(
    @GetCurrentUserId() userId: string,
    @Param('orgId') orgId: string,
  ) {
    return this.usersService.getLoyaltyPoints(userId, orgId);
  }
}
