import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  private toFullUrl(url: string | null) {
    if (!url) return null;
    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    if (url.startsWith('http')) {
      if (url.includes('/uploads/')) {
        const path = url.split('/uploads/')[1];
        return `${baseUrl}/uploads/${path}`;
      }
      return url;
    }
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  // Get user profile
  async getProfile(userId: string) {
    const clientData = await this.databaseService.findClientById(userId);
    if (!clientData) {
      throw new BadRequestException('User not found');
    }

    return {
      status: 'success',
      data: {
        id: clientData.id,
        name: clientData.name,
        email: clientData.email,
        username: clientData.username,
        profilePicture: this.toFullUrl(clientData.image),
        createdAt: clientData.createdAt,
        notificationPreferences: {
          marketing: false,
          security: true,
          transactional: true
        }
      }
    };
  }

  // Update user profile
  async updateProfile(userId: string, updateData: any) {
    const { name } = updateData;
    
    // We only update the name currently as per the UI
    const updatedUser = await this.databaseService.updateClientProfile(userId, { name });

    return {
      message: 'Profile updated successfully',
      status: 'success',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
      }
    };
  }

  // Upload profile image
  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/profiles/${file.filename}`;
    
    // Update profile image in database
    await this.databaseService.updateClientProfile(userId, {
      image: fileUrl,
    });

    return {
      message: 'Profile picture updated successfully',
      status: 'success',
      fileUrl,
    };
  }

  // Get current user
  async getCurrentUser(userId: string) {
    // TODO: Implement actual database query
    return {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'client',
    };
  }

  // Get user dashboard
  async getDashboard(userId: string) {
    // TODO: Implement actual database query
    return {
      upcomingBookings: 2,
      completedBookings: 10,
      totalSpent: 12000,
      recentActivity: [],
    };
  }
}
