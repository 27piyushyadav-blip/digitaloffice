import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExpertService } from './expert.service';
import { GetCurrentUserId } from '../common/decorators';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('experts')
export class ExpertController {
  constructor(private readonly expertService: ExpertService) {}

  @Get('profile')
  async getProfile(@GetCurrentUserId() expertId: string) {
    return this.expertService.getProfile(expertId);
  }

  @Put('profile')
  async updateProfile(
    @GetCurrentUserId() expertId: string,
    @Body() updateData: any,
  ) {
    return this.expertService.updateProfile(expertId, updateData);
  }

  @Post('profile/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profile-images',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadProfileImage(
    @GetCurrentUserId() expertId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.expertService.uploadProfileImage(expertId, file);
  }

  @Post('profile/intro-video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/intro-videos',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(mp4|avi|mov|wmv)$/)) {
          return cb(new BadRequestException('Only video files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  )
  async uploadIntroVideo(
    @GetCurrentUserId() expertId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.expertService.uploadIntroVideo(expertId, file);
  }

  @Post('profile/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/verification-documents',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Allow common document and image types
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'image/jpg'
        ];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Only PDF, Word, and image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadDocument(
    @GetCurrentUserId() expertId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title: string; category: string },
  ) {
    return this.expertService.uploadDocument(expertId, file, body.title, body.category);
  }

  @Get('dashboard')
  async getDashboard(@GetCurrentUserId() expertId: string) {
    return this.expertService.getDashboard(expertId);
  }
}
