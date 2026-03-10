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
} from '@nestjs/common';
import { AdminPanelService } from './admin-panel.service';
import { AtGuard } from '../auth/guards/at.guard';
import { GetCurrentUserId } from '../common/decorators';

@Controller('admin')
@UseGuards(AtGuard)
export class AdminPanelController {
  constructor(private readonly adminPanelService: AdminPanelService) {}

  // Admin Authentication APIs
  @Get('/auth/profile')
  async getAdminProfile(@GetCurrentUserId() adminId: string) {
    return this.adminPanelService.getAdminProfile(adminId);
  }

  // Expert Verification APIs
  @Get('/experts/pending')
  async getPendingExperts() {
    return this.adminPanelService.getPendingExperts();
  }

  @Post('/experts/:expertId/approve')
  async approveExpert(@Param('expertId') expertId: string) {
    return this.adminPanelService.approveExpert(expertId);
  }

  @Post('/experts/:expertId/reject')
  async rejectExpert(
    @Param('expertId') expertId: string,
    @Body() rejectData: any,
  ) {
    return this.adminPanelService.rejectExpert(expertId, rejectData);
  }

  @Get('/experts')
  async getAllExperts(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('organization') organization?: string,
  ) {
    return this.adminPanelService.getAllExperts(status, category, organization);
  }

  @Post('/experts/:expertId/suspend')
  async suspendExpert(
    @Param('expertId') expertId: string,
    @Body() suspendData: any,
  ) {
    return this.adminPanelService.suspendExpert(expertId, suspendData);
  }

  // Organization Verification APIs
  @Get('/organizations/pending')
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

  @Get('/organizations')
  async getAllOrganizations(
    @Query('status') status?: string,
    @Query('location') location?: string,
    @Query('industry') industry?: string,
  ) {
    return this.adminPanelService.getAllOrganizations(status, location, industry);
  }

  @Post('/organizations/:orgId/suspend')
  async suspendOrganization(
    @Param('orgId') orgId: string,
    @Body() suspendData: any,
  ) {
    return this.adminPanelService.suspendOrganization(orgId, suspendData);
  }

  // Profile Change Approval APIs
  @Get('/profile-changes')
  async getPendingProfileChanges() {
    return this.adminPanelService.getPendingProfileChanges();
  }

  @Post('/profile-changes/{changeId}/approve')
  async approveProfileChange(@Param('changeId') changeId: string) {
    return this.adminPanelService.approveProfileChange(changeId);
  }

  @Post('/profile-changes/{changeId}/reject')
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

  @Get('/bookings/{bookingId}')
  async getBookingDetails(@Param('bookingId') bookingId: string) {
    return this.adminPanelService.getBookingDetails(bookingId);
  }

  @Post('/bookings/{bookingId}/cancel')
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

  @Post('/refunds/{refundId}/approve')
  async approveRefund(@Param('refundId') refundId: string) {
    return this.adminPanelService.approveRefund(refundId);
  }

  @Post('/refunds/{refundId}/reject')
  async rejectRefund(@Param('refundId') refundId: string) {
    return this.adminPanelService.rejectRefund(refundId);
  }

  @Get('/disputes')
  async getDisputes() {
    return this.adminPanelService.getDisputes();
  }

  @Post('/disputes/{disputeId}/resolve')
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

  @Put('/categories/{id}')
  async updateCategory(
    @Param('id') categoryId: string,
    @Body() categoryData: any,
  ) {
    return this.adminPanelService.updateCategory(categoryId, categoryData);
  }

  @Delete('/categories/{id}')
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
  @Delete('/reviews/{reviewId}')
  async removeReview(@Param('reviewId') reviewId: string) {
    return this.adminPanelService.removeReview(reviewId);
  }

  @Delete('/users/{userId}')
  async removeUser(@Param('userId') userId: string) {
    return this.adminPanelService.removeUser(userId);
  }

  @Post('/users/{userId}/ban')
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
