import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VerificationService } from './verification.service';
import { GetCurrentUserId } from '../common/decorators';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('experts/verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('documents')
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
        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/jpg',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Only PDF and image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadVerificationDocument(
    @GetCurrentUserId() expertId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!documentType) {
      throw new BadRequestException('Document type is required');
    }

    return this.verificationService.uploadDocument(
      expertId,
      file,
      documentType,
    );
  }

  @Get('status')
  async getVerificationStatus(@GetCurrentUserId() expertId: string) {
    return this.verificationService.getVerificationStatus(expertId);
  }
}
