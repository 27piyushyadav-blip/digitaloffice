import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  UseGuards,
  Query,
  Param,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrganizationPanelService } from './organization-panel.service';
import { AtGuard } from '../auth/guards/at.guard';
import { GetCurrentUserId } from '../common/decorators';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

@Controller('organizations')
@UseGuards(AtGuard)
export class OrganizationPanelController {
  constructor(private readonly organizationPanelService: OrganizationPanelService) {}

  // Organization Profile APIs
  @Get('/profile')
  async getProfile(@GetCurrentUserId() organizationId: string) {
    return this.organizationPanelService.getProfile(organizationId);
  }

  @Put('/profile')
  async updateProfile(
    @GetCurrentUserId() organizationId: string,
    @Body() profileData: any,
  ) {
    return this.organizationPanelService.updateProfile(organizationId, profileData);
  }

  @Post('/profile/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/organization-logos',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|avif)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadLogo(
    @GetCurrentUserId() organizationId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.organizationPanelService.uploadLogo(organizationId, file);
  }

  @Post('/profile/cover-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/organization-covers',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|avif)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadCoverImage(
    @GetCurrentUserId() organizationId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.organizationPanelService.uploadCoverImage(organizationId, file);
  }

  @Post('/profile/intro-video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/organization-videos',
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
    @GetCurrentUserId() organizationId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.organizationPanelService.uploadIntroVideo(organizationId, file);
  }

  @Post('/profile/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/organization-docs',
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
  async uploadDocuments(
    @GetCurrentUserId() organizationId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title: string; category: string },
  ) {
    return this.organizationPanelService.uploadDocuments(organizationId, file, body.title, body.category);
  }

  // Verification APIs
  @Get('/verification/status')
  async getVerificationStatus(@GetCurrentUserId() organizationId: string) {
    return this.organizationPanelService.getVerificationStatus(organizationId);
  }

  // Expert Management APIs
  @Get('/experts')
  async getOrganizationExperts(@GetCurrentUserId() organizationId: string) {
    return this.organizationPanelService.getOrganizationExperts(organizationId);
  }

  @Get('/experts/:expertId')
  async getExpertDetails(
    @GetCurrentUserId() organizationId: string,
    @Param('expertId') expertId: string,
  ) {
    return this.organizationPanelService.getExpertDetails(organizationId, expertId);
  }

  @Delete('/experts/:expertId')
  async removeExpert(
    @GetCurrentUserId() organizationId: string,
    @Param('expertId') expertId: string,
  ) {
    return this.organizationPanelService.removeExpert(organizationId, expertId);
  }

  @Post('/experts/upload-avatar')
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
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|avif)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadExpertAvatar(
    @GetCurrentUserId() organizationId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('expertId') expertId?: string,
  ) {
    return this.organizationPanelService.uploadExpertAvatar(organizationId, file, expertId);
  }

  @Post('/experts/upload-video')
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
  async uploadExpertVideo(
    @GetCurrentUserId() organizationId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('expertId') expertId?: string,
  ) {
    return this.organizationPanelService.uploadExpertVideo(organizationId, file, expertId);
  }

  @Put('/experts/:expertId')
  async updateExpert(
    @GetCurrentUserId() organizationId: string,
    @Param('expertId') expertId: string,
    @Body() data: any,
  ) {
    return this.organizationPanelService.updateExpert(organizationId, expertId, data);
  }

  @Patch('/experts/:expertId/avatar')
  async updateExpertAvatar(
    @GetCurrentUserId() organizationId: string,
    @Param('expertId') expertId: string,
    @Body('avatarUrl') avatarUrl: string,
  ) {
    return this.organizationPanelService.updateExpertAvatar(organizationId, expertId, avatarUrl);
  }

  @Patch('/experts/:expertId/video')
  async updateExpertVideoUrl(
    @GetCurrentUserId() organizationId: string,
    @Param('expertId') expertId: string,
    @Body('videoUrl') videoUrl: string,
  ) {
    return this.organizationPanelService.updateExpertVideo(organizationId, expertId, videoUrl);
  }

  @Patch('/experts/:expertId/timings')
  async updateExpertTimings(
    @GetCurrentUserId() organizationId: string,
    @Param('expertId') expertId: string,
    @Body('availability') availability: any[],
  ) {
    return this.organizationPanelService.updateExpertTimings(organizationId, expertId, availability);
  }

  @Patch('/experts/:expertId/status')
  async updateExpertStatus(
    @GetCurrentUserId() organizationId: string,
    @Param('expertId') expertId: string,
    @Body('status') status: string,
  ) {
    return this.organizationPanelService.updateExpertStatus(organizationId, expertId, status);
  }

  @Post('/experts')
  async createExpert(
    @GetCurrentUserId() organizationId: string,
    @Body() expertData: any,
  ) {
    return this.organizationPanelService.createExpert(organizationId, expertData);
  }

  @Post('/experts/:expertId/services')
  async assignExpertService(
    @GetCurrentUserId() organizationId: string,
    @Param('expertId') expertId: string,
    @Body() serviceData: any,
  ) {
    return this.organizationPanelService.assignExpertService(organizationId, expertId, serviceData);
  }

  // Join Request APIs
  @Get('/join-requests')
  async getJoinRequests(@GetCurrentUserId() organizationId: string) {
    return this.organizationPanelService.getJoinRequests(organizationId);
  }

  @Post('/join-requests/:requestId/accept')
  async acceptJoinRequest(
    @GetCurrentUserId() organizationId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.organizationPanelService.acceptJoinRequest(organizationId, requestId);
  }

  @Post('/join-requests/:requestId/reject')
  async rejectJoinRequest(
    @GetCurrentUserId() organizationId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.organizationPanelService.rejectJoinRequest(organizationId, requestId);
  }

  @Post('/invite-expert')
  async inviteExpert(
    @GetCurrentUserId() organizationId: string,
    @Body() inviteData: any,
  ) {
    return this.organizationPanelService.inviteExpert(organizationId, inviteData);
  }

  // Services Management APIs
  @Get('/services')
  async getServices(@GetCurrentUserId() organizationId: string) {
    return this.organizationPanelService.getServices(organizationId);
  }

  @Post('/services')
  async createService(
    @GetCurrentUserId() organizationId: string,
    @Body() serviceData: any,
  ) {
    return this.organizationPanelService.createService(organizationId, serviceData);
  }

  @Put('/services/:serviceId')
  async updateService(
    @GetCurrentUserId() organizationId: string,
    @Param('serviceId') serviceId: string,
    @Body() serviceData: any,
  ) {
    return this.organizationPanelService.updateService(organizationId, serviceId, serviceData);
  }

  @Delete('/services/:serviceId')
  async deleteService(
    @GetCurrentUserId() organizationId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.organizationPanelService.deleteService(organizationId, serviceId);
  }

  @Get('/services/categories')
  async getServiceCategories(@GetCurrentUserId() organizationId: string) {
    return this.organizationPanelService.getServiceCategories(organizationId);
  }

  @Post('/services/categories')
  async createServiceCategory(
    @GetCurrentUserId() organizationId: string,
    @Body() body: { name: string; imageUrl?: string | null; price?: string | null },
  ) {
    return this.organizationPanelService.createServiceCategory(organizationId, body.name, body.imageUrl, body.price);
  }

  @Patch('/services/categories/:id')
  async updateServiceCategory(
    @GetCurrentUserId() organizationId: string,
    @Param('id') categoryId: string,
    @Body() data: { name?: string; imageUrl?: string | null; price?: string | null },
  ) {
    return this.organizationPanelService.updateServiceCategory(organizationId, categoryId, data);
  }

  @Post('/services/categories/upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/organization-categories',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|avif)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadCategoryImage(
    @GetCurrentUserId() organizationId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/organization-categories/${file.filename}`;
    return { imageUrl: fileUrl };
  }

  @Delete('/services/categories/:id')
  async deleteServiceCategory(
    @GetCurrentUserId() organizationId: string,
    @Param('id') categoryId: string,
  ) {
    return this.organizationPanelService.deleteServiceCategory(organizationId, categoryId);
  }

  @Put('/services/categories/:id/layout')
  async updateServiceCategoryLayout(
    @GetCurrentUserId() organizationId: string,
    @Param('id') categoryId: string,
    @Body() layout: any,
  ) {
    return this.organizationPanelService.updateServiceCategoryLayout(organizationId, categoryId, layout);
  }

  @Get('/banners')
  async getBanners(@GetCurrentUserId() organizationId: string) {
    return this.organizationPanelService.getOrganizationBanners(organizationId);
  }

  @Put('/banners')
  async updateBanners(
    @GetCurrentUserId() organizationId: string,
    @Body() bannersData: any,
  ) {
    return this.organizationPanelService.updateOrganizationBanners(organizationId, bannersData);
  }

  @Post('/banners/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/organization-banners',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|avif)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadBanner(
    @GetCurrentUserId() organizationId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/organization-banners/${file.filename}`;
    return { imageUrl: fileUrl };
  }



  @Post('/services/upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/organization-services',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|avif)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadServiceImage(
    @GetCurrentUserId() organizationId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/organization-services/${file.filename}`;
    return { imageUrl: fileUrl };
  }

  // Booking Management APIs
  @Get('/bookings')
  async getOrganizationBookings(
    @GetCurrentUserId() organizationId: string,
    @Query('status') status?: string,
  ) {
    return this.organizationPanelService.getOrganizationBookings(organizationId, status);
  }

  @Get('/bookings/:bookingId')
  async getBookingDetails(
    @GetCurrentUserId() organizationId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.organizationPanelService.getBookingDetails(organizationId, bookingId);
  }

  @Post('/bookings/:bookingId/cancel')
  async cancelBooking(
    @GetCurrentUserId() organizationId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.organizationPanelService.cancelBooking(organizationId, bookingId);
  }

  @Post('/bookings/:bookingId/accept')
  async acceptBooking(
    @GetCurrentUserId() organizationId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.organizationPanelService.acceptBooking(organizationId, bookingId);
  }

  @Post('/bookings/:bookingId/reject')
  async rejectBooking(
    @GetCurrentUserId() organizationId: string,
    @Param('bookingId') bookingId: string,
    @Body() body: { reason?: string },
  ) {
    return this.organizationPanelService.rejectBooking(organizationId, bookingId, body.reason);
  }

  @Post('/bookings/:bookingId/reschedule')
  async rescheduleBooking(
    @GetCurrentUserId() organizationId: string,
    @Param('bookingId') bookingId: string,
    @Body() body: { scheduledDate: string; expertId?: string },
  ) {
    return this.organizationPanelService.rescheduleBooking(organizationId, bookingId, body);
  }

  @Post('/bookings/:bookingId/reassign')
  async reassignBooking(
    @GetCurrentUserId() organizationId: string,
    @Param('bookingId') bookingId: string,
    @Body() reassignData: any,
  ) {
    return this.organizationPanelService.reassignBooking(organizationId, bookingId, reassignData);
  }

  @Post('/bookings')
  async createVoiceCallBooking(
    @GetCurrentUserId() organizationId: string,
    @Body() bookingData: any,
  ) {
    return this.organizationPanelService.createVoiceCallBooking(organizationId, bookingData);
  }

  @Post('/bookings/send-payment-link')
  async sendPaymentLink(
    @GetCurrentUserId() organizationId: string,
    @Body() emailData: any,
  ) {
    return this.organizationPanelService.sendPaymentLink(organizationId, emailData);
  }

  // Analytics & Revenue APIs
  @Get('/dashboard')
  async getDashboard(
    @GetCurrentUserId() organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.organizationPanelService.getDashboard(organizationId, startDate, endDate);
  }

  @Get('/revenue')
  async getRevenue(
    @GetCurrentUserId() organizationId: string,
    @Query('month') month?: string,
  ) {
    return this.organizationPanelService.getRevenue(organizationId, month);
  }

  @Get('/experts/performance')
  async getExpertPerformance(@GetCurrentUserId() organizationId: string) {
    return this.organizationPanelService.getExpertPerformance(organizationId);
  }

  // Notifications APIs
  @Get('/notifications')
  async getNotifications(@GetCurrentUserId() organizationId: string) {
    return this.organizationPanelService.getNotifications(organizationId);
  }

  @Post('/notifications/:id/read')
  async markNotificationRead(
    @GetCurrentUserId() organizationId: string,
    @Param('id') notificationId: string,
  ) {
    return this.organizationPanelService.markNotificationRead(organizationId, notificationId);
  }

  // Chat APIs
  @Get('/conversations')
  async getConversations(@GetCurrentUserId() userId: string) {
    return this.organizationPanelService.getConversations(userId);
  }

  @Get('/conversations/:id/messages')
  async getMessages(
    @GetCurrentUserId() userId: string,
    @Param('id') conversationId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.organizationPanelService.getMessages(userId, conversationId, Number(page) || 1, Number(limit) || 50);
  }

  // Refund Request APIs
  @Post('/refunds')
  async createRefundRequest(
    @GetCurrentUserId() organizationId: string,
    @Body() refundData: {
      bookingId: string;
      amount: string;
      reason: string;
      refundType: string;
      paymentMethod?: string;
      metadata?: any;
    },
  ) {
    return this.organizationPanelService.createRefundRequest(organizationId, refundData);
  }

  @Get('/refunds')
  async getRefundRequests(
    @GetCurrentUserId() organizationId: string,
    @Query('status') status?: string,
  ) {
    return this.organizationPanelService.getOrganizationRefundRequests(organizationId, status);
  }

  @Post('/refunds/:id/approve')
  async approveRefund(
    @GetCurrentUserId() organizationId: string,
    @Param('id') refundId: string,
  ) {
    return this.organizationPanelService.updateRefundStatus(refundId, 'approved');
  }

  @Post('/refunds/:id/reject')
  async rejectRefund(
    @GetCurrentUserId() organizationId: string,
    @Param('id') refundId: string,
    @Body() body: { reason?: string },
  ) {
    return this.organizationPanelService.updateRefundStatus(refundId, 'rejected', body.reason);
  }

  // Edit Service Request APIs
  @Post('/edit-service-requests')
  async createEditServiceRequest(
    @GetCurrentUserId() organizationId: string,
    @Body() editData: {
      bookingId: string;
      clientId: string;
      originalService: string;
      originalAmount: string;
      newService: string;
      newAmount: string;
      reason: string;
      metadata?: any;
    },
  ) {
    return this.organizationPanelService.createEditServiceRequest(organizationId, editData);
  }

  @Get('/edit-service-requests')
  async getEditServiceRequests(
    @GetCurrentUserId() organizationId: string,
    @Query('status') status?: string,
  ) {
    return this.organizationPanelService.getOrganizationEditServiceRequests(organizationId, status);
  }

  @Post('/edit-service-requests/:id/approve')
  async approveEditServiceRequest(
    @GetCurrentUserId() organizationId: string,
    @Param('id') requestId: string,
  ) {
    return this.organizationPanelService.updateEditServiceStatus(requestId, 'approved');
  }

  @Post('/edit-service-requests/:id/reject')
  async rejectEditServiceRequest(
    @GetCurrentUserId() organizationId: string,
    @Param('id') requestId: string,
    @Body() body: { reason?: string },
  ) {
    return this.organizationPanelService.updateEditServiceStatus(requestId, 'rejected', body.reason);
  }

  @Get('/action-centre/requests')
  async getActionCentreRequests(
    @GetCurrentUserId() organizationId: string,
  ) {
    return this.organizationPanelService.getActionCentreRequests(organizationId);
  }

  @Get('/action-centre/requests/:id')
  async getRequestDetails(
    @GetCurrentUserId() organizationId: string,
    @Param('id') id: string,
    @Query('type') type: string,
  ) {
    return this.organizationPanelService.getRequestDetails(organizationId, id, type);
  }

  @Get('/action-centre/logs')
  async getRequestLogs(
    @GetCurrentUserId() organizationId: string,
  ) {
    return this.organizationPanelService.getOrganizationRequestLogs(organizationId);
  }
}

// Trigger reload after database package build (v2)

