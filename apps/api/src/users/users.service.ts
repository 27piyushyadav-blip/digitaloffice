import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  private toFullUrl(url: string | null) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
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

    const fileUrl = `http://localhost:3000/uploads/profiles/${file.filename}`;
    
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
