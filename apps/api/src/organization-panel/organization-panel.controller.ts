import {
  Controller,
  Get,
  Post,
  Put,
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
  async uploadLogo(
    @GetCurrentUserId() organizationId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.organizationPanelService.uploadLogo(organizationId, file);
  }

  @Post('/profile/documents')
  async uploadDocuments(
    @GetCurrentUserId() organizationId: string,
    @Body() documentData: any,
  ) {
    return this.organizationPanelService.uploadDocuments(organizationId, documentData);
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

  @Post('/bookings/:bookingId/reassign')
  async reassignBooking(
    @GetCurrentUserId() organizationId: string,
    @Param('bookingId') bookingId: string,
    @Body() reassignData: any,
  ) {
    return this.organizationPanelService.reassignBooking(organizationId, bookingId, reassignData);
  }

  // Analytics & Revenue APIs
  @Get('/dashboard')
  async getDashboard(@GetCurrentUserId() organizationId: string) {
    return this.organizationPanelService.getDashboard(organizationId);
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
}
