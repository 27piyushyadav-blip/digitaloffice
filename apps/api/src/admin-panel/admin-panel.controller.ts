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
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AdminPanelService } from './admin-panel.service';
import { AtGuard } from '../auth/guards/at.guard';
import { GetCurrentUserId } from '../common/decorators';

@Controller('admin')
@UseGuards(AtGuard)
export class AdminPanelController {
  constructor(private readonly adminPanelService: AdminPanelService) {}

  // Admin Authentication APIs
  @Get('auth/profile')
  async getAdminProfile(@GetCurrentUserId() adminId: string) {
    return this.adminPanelService.getAdminProfile(adminId);
  }

  // Expert Verification APIs
  @Get('experts/pending')
  async getPendingExperts() {
    return this.adminPanelService.getPendingExperts();
  }

  @Post('experts/:expertId/approve')
  async approveExpert(@Param('expertId') expertId: string) {
    return this.adminPanelService.approveExpert(expertId);
  }

  @Post('experts/:expertId/reject')
  async rejectExpert(
    @Param('expertId') expertId: string,
    @Body() rejectData: any,
  ) {
    return this.adminPanelService.rejectExpert(expertId, rejectData);
  }

  @Get('experts')
  async getAllExperts(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('organization') organization?: string,
  ) {
    return this.adminPanelService.getAllExperts(status, category, organization);
  }

  @Post('experts/:expertId/suspend')
  async suspendExpert(
    @Param('expertId') expertId: string,
    @Body() suspendData: any,
  ) {
    return this.adminPanelService.suspendExpert(expertId, suspendData);
  }

  @Get('/experts/:expertId')
  async getExpertFullDetails(@Param('expertId') expertId: string) {
    return this.adminPanelService.getExpertDetails(null, expertId);
  }

  @Put('/experts/:expertId')
  async updateExpertProfileDirect(
    @Param('expertId') expertId: string,
    @Body() updateData: any,
  ) {
    return this.adminPanelService.updateExpert(null, expertId, updateData);
  }

  @Post('/experts/:expertId/dp')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profile-images',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadExpertDPDirect(
    @Param('expertId') expertId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.adminPanelService.uploadExpertDP(expertId, file);
  }

  @Post('/experts/:expertId/video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/intro-videos',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(mp4|avi|mov|wmv)$/)) {
          return cb(new BadRequestException('Only video files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadExpertVideoDirect(
    @Param('expertId') expertId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.adminPanelService.uploadExpertVideo(expertId, file);
  }

  @Post('/experts/:expertId/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/expert-docs',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Only PDF, Word, and image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadExpertDocumentDirect(
    @Param('expertId') expertId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title: string; category: string },
  ) {
    return this.adminPanelService.uploadExpertDocument(expertId, file, body?.title, body?.category);
  }

  @Get('/experts/:expertId/bookings')
  async getExpertBookingsDirect(
    @Param('expertId') expertId: string,
    @Query('status') status?: string,
  ) {
    return this.adminPanelService.getExpertBookings(expertId, status);
  }

  // Organization Verification APIs
  @Get('organizations/pending')
  async getPendingOrganizations() {
    return this.adminPanelService.getPendingOrganizations();
  }

  @Post('/organizations/:orgId/approve')
  async approveOrganization(@Param('orgId') orgId: string) {
    return this.adminPanelService.approveOrganization(orgId);
  }

  @Post('/organizations/:orgId/reject')
  async rejectOrganization(
    @Param('orgId') orgId: string,
    @Body() rejectData: any,
  ) {
    return this.adminPanelService.rejectOrganization(orgId, rejectData);
  }

  @Get('organizations')
  async getAllOrganizations(
    @Query('status') status?: string,
    @Query('location') location?: string,
    @Query('industry') industry?: string,
  ) {
    return this.adminPanelService.getAllOrganizations(status, location, industry);
  }

  @Post('organizations/:orgId/suspend')
  async suspendOrganization(
    @Param('orgId') orgId: string,
    @Body() suspendData: any,
  ) {
    return this.adminPanelService.suspendOrganization(orgId, suspendData);
  }

  @Post('organizations/:orgId/hold')
  async toggleHold(
    @Param('orgId') orgId: string,
    @Body() data: { isBlocked: boolean; durationMinutes?: number },
  ) {
    return this.adminPanelService.toggleOrganizationHold(orgId, data.isBlocked, data.durationMinutes);
  }

  @Post('organizations/:orgId/messaging-toggle')
  async toggleOrganizationMessaging(
    @Param('orgId') orgId: string,
    @Body() data: { isDisabled: boolean },
  ) {
    return this.adminPanelService.toggleOrganizationMessaging(orgId, data.isDisabled);
  }

  @Post('organizations/:orgId/refund')
  async requestOrganizationRefund(
    @Param('orgId') orgId: string,
    @Body() data: any,
  ) {
    return this.adminPanelService.requestOrganizationRefund(orgId, data);
  }

  @Put('organizations/:orgId')
  async updateOrganization(
    @Param('orgId') orgId: string,
    @Body() updateData: any,
  ) {
    return this.adminPanelService.updateOrganization(orgId, updateData);
  }

  @Get('organizations/:orgId/check-details')
  async checkOrganizationDetails(@Param('orgId') orgId: string) {
    return this.adminPanelService.checkOrganizationDetails(orgId);
  }

  @Get('organizations/:orgId')
  async getOrganizationDetails(@Param('orgId') orgId: string) {
    return this.adminPanelService.getOrganizationDetails(orgId);
  }

  @Post('/organizations/:orgId/dp')
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
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadOrganizationDP(
    @Param('orgId') orgId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.adminPanelService.uploadOrganizationDP(orgId, file);
  }

  @Post('/organizations/:orgId/video')
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
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadOrganizationVideo(
    @Param('orgId') orgId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.adminPanelService.uploadOrganizationVideo(orgId, file);
  }

  @Post('/organizations/:orgId/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/organization-docs',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
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
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadOrganizationDocument(
    @Param('orgId') orgId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title: string; category: string },
  ) {
    return this.adminPanelService.uploadOrganizationDocument(orgId, file, body.title, body.category);
  }

  @Get('/organizations/:orgId/reviews')
  async getOrganizationReviews(@Param('orgId') orgId: string) {
    return this.adminPanelService.getOrganizationReviews(orgId);
  }

  @Get('/organizations/:orgId/services')
  async getOrganizationServices(@Param('orgId') orgId: string) {
    return this.adminPanelService.getOrganizationServices(orgId);
  }

  @Post('/organizations/:orgId/services')
  async createOrganizationService(
    @Param('orgId') orgId: string,
    @Body() serviceData: any
  ) {
    return this.adminPanelService.createOrganizationService(orgId, serviceData);
  }

  @Put('/organizations/:orgId/services/:serviceId')
  async updateOrganizationService(
    @Param('orgId') orgId: string,
    @Param('serviceId') serviceId: string,
    @Body() updateData: any
  ) {
    return this.adminPanelService.updateOrganizationService(orgId, serviceId, updateData);
  }

  @Delete('/organizations/:orgId/services/:serviceId')
  async deleteOrganizationService(
    @Param('orgId') orgId: string,
    @Param('serviceId') serviceId: string
  ) {
    return this.adminPanelService.deleteOrganizationService(orgId, serviceId);
  }

  @Get('/organizations/:orgId/experts')
  async getOrganizationExperts(@Param('orgId') orgId: string) {
    return this.adminPanelService.getOrganizationExperts(orgId);
  }

  @Get('/organizations/:orgId/experts/:expertId')
  async getExpertDetails(
    @Param('orgId') orgId: string,
    @Param('expertId') expertId: string
  ) {
    return this.adminPanelService.getExpertDetails(orgId, expertId);
  }

  @Put('/organizations/:orgId/experts/:expertId')
  async updateExpertDetails(
    @Param('orgId') orgId: string,
    @Param('expertId') expertId: string,
    @Body() updateData: any
  ) {
    return this.adminPanelService.updateExpert(orgId, expertId, updateData);
  }

  @Delete('/organizations/:orgId/experts/:expertId')
  async removeExpertFromOrganization(
    @Param('orgId') orgId: string,
    @Param('expertId') expertId: string
  ) {
    return this.adminPanelService.removeExpertFromOrganization(orgId, expertId);
  }

  @Post('/organizations/:orgId/experts')
  async addExpertToOrganization(
    @Param('orgId') orgId: string,
    @Body('expertId') expertId: string
  ) {
    if (!expertId) throw new BadRequestException('expertId is required');
    return this.adminPanelService.addExpertToOrganization(orgId, expertId);
  }

  @Post('/organizations/:orgId/experts/:expertId/dp')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profile-images',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadExpertDP(
    @Param('orgId') orgId: string,
    @Param('expertId') expertId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.adminPanelService.uploadExpertDP(expertId, file);
  }

  @Post('/organizations/:orgId/experts/:expertId/video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/intro-videos',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(mp4|avi|mov|wmv)$/)) {
          return cb(new BadRequestException('Only video files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadExpertVideo(
    @Param('orgId') orgId: string,
    @Param('expertId') expertId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.adminPanelService.uploadExpertVideo(expertId, file);
  }

  @Post('/organizations/:orgId/experts/:expertId/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/expert-docs',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
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
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadExpertDocument(
    @Param('orgId') orgId: string,
    @Param('expertId') expertId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title: string; category: string },
  ) {
    return this.adminPanelService.uploadExpertDocument(expertId, file, body?.title, body?.category);
  }

  // Administrative Actions
  @Post('/refunds/request')
  async requestRefund(
    @Body() refundData: { bookingId: string; amount: string; reason: string },
  ) {
    return this.adminPanelService.requestRefund(refundData.bookingId, refundData.amount, refundData.reason);
  }

  @Post('/users/:userId/messaging')
  async toggleMessaging(
    @Param('userId') userId: string,
    @Body() data: { userType: 'client' | 'expert' | 'organisation'; disabled: boolean },
  ) {
    return this.adminPanelService.toggleMessaging(userId, data.userType, data.disabled);
  }

  @Post('/users/:userId/block')
  async toggleUserBlock(
    @Param('userId') userId: string,
    @Body() data: { userType: 'client' | 'expert' | 'organisation'; blocked: boolean; until?: string },
  ) {
    const until = data.until ? new Date(data.until) : null;
    return this.adminPanelService.toggleUserBlock(userId, data.userType, data.blocked, until);
  }

  // Profile Change Approval APIs
  @Get('/profile-changes')
  async getPendingProfileChanges() {
    return this.adminPanelService.getPendingProfileChanges();
  }

  @Post('/profile-changes/:changeId/approve')
  async approveProfileChange(@Param('changeId') changeId: string) {
    return this.adminPanelService.approveProfileChange(changeId);
  }

  @Post('/profile-changes/:changeId/reject')
  async rejectProfileChange(@Param('changeId') changeId: string) {
    return this.adminPanelService.rejectProfileChange(changeId);
  }

  // Booking Monitoring APIs
  @Get('/bookings')
  async getAllBookings(
    @Query('status') status?: string,
    @Query('expertId') expertId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('date') date?: string,
    @Query('consultationType') consultationType?: string,
  ) {
    return this.adminPanelService.getAllBookings(
      status,
      expertId,
      organizationId,
      date,
      consultationType,
    );
  }

  @Get('/bookings/:bookingId')
  async getBookingDetails(@Param('bookingId') bookingId: string) {
    return this.adminPanelService.getBookingDetails(bookingId);
  }

  @Post('/bookings/:bookingId/cancel')
  async cancelBooking(@Param('bookingId') bookingId: string) {
    return this.adminPanelService.cancelBooking(bookingId);
  }

  // Refund & Dispute APIs
  @Get('/refunds')
  async getRefundRequests(
    @Query('status') status?: 'pending' | 'approved' | 'rejected',
  ) {
    return this.adminPanelService.getRefundRequests(status);
  }

  @Post('/refunds/:refundId/approve')
  async approveRefund(@Param('refundId') refundId: string) {
    return this.adminPanelService.approveRefund(refundId);
  }

  @Post('/refunds/:refundId/reject')
  async rejectRefund(@Param('refundId') refundId: string) {
    return this.adminPanelService.rejectRefund(refundId);
  }

  @Get('/disputes')
  async getDisputes() {
    return this.adminPanelService.getDisputes();
  }

  @Post('/disputes/:disputeId/resolve')
  async resolveDispute(
    @Param('disputeId') disputeId: string,
    @Body() resolveData: any,
  ) {
    return this.adminPanelService.resolveDispute(disputeId, resolveData);
  }

  // Platform Analytics APIs
  @Get('/dashboard')
  async getDashboardStats() {
    return this.adminPanelService.getDashboardStats();
  }

  @Get('/analytics/bookings')
  async getBookingAnalytics() {
    return this.adminPanelService.getBookingAnalytics();
  }

  @Get('/analytics/revenue')
  async getRevenueAnalytics() {
    return this.adminPanelService.getRevenueAnalytics();
  }

  @Get('/analytics/experts')
  async getExpertAnalytics() {
    return this.adminPanelService.getExpertAnalytics();
  }

  // Category Management APIs
  @Post('/categories')
  async createCategory(@Body() categoryData: any) {
    return this.adminPanelService.createCategory(categoryData);
  }

  @Get('/categories')
  async getCategories() {
    return this.adminPanelService.getCategories();
  }

  @Put('/categories/:id')
  async updateCategory(
    @Param('id') categoryId: string,
    @Body() categoryData: any,
  ) {
    return this.adminPanelService.updateCategory(categoryId, categoryData);
  }

  @Delete('/categories/:id')
  async deleteCategory(@Param('id') categoryId: string) {
    return this.adminPanelService.deleteCategory(categoryId);
  }

  // Platform Settings APIs
  @Get('/settings')
  async getPlatformSettings() {
    return this.adminPanelService.getPlatformSettings();
  }

  @Put('/settings')
  async updatePlatformSettings(@Body() settingsData: any) {
    return this.adminPanelService.updatePlatformSettings(settingsData);
  }

  // Content Moderation APIs
  @Delete('/reviews/:reviewId')
  async removeReview(@Param('reviewId') reviewId: string) {
    return this.adminPanelService.removeReview(reviewId);
  }

  @Delete('/users/:userId')
  async removeUser(@Param('userId') userId: string) {
    return this.adminPanelService.removeUser(userId);
  }

  @Post('/users/:userId/ban')
  async banUser(
    @Param('userId') userId: string,
    @Body() banData: any,
  ) {
    return this.adminPanelService.banUser(userId, banData);
  }

  // Notifications API
  @Post('/notifications/send')
  async sendNotification(@Body() notificationData: any) {
    return this.adminPanelService.sendNotification(notificationData);
  }

  // Logs & Activity APIs
  @Get('/logs')
  async getActivityLogs() {
    return this.adminPanelService.getActivityLogs();
  }
}
