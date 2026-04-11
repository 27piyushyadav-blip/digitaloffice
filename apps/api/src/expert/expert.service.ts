import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ExpertService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getProfile(expertId: string) {
    const expertData = await this.databaseService.findExpertById(expertId);
    
    if (!expertData) {
      throw new BadRequestException('Expert not found');
    }

    const toFullUrl = (url: string | null) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      return `http://localhost:3000${url}`;
    };

    const changes = await this.databaseService.findLatestProfileChanges(expertId);
    const fieldStatuses: Record<string, { value: any; status: string }> = {};
    if (changes) {
      for (const change of changes) {
        // change.field is 'Gender', 'Location', etc. from the audit log
        const fieldKey = change.field.toLowerCase();
        if (!fieldStatuses[fieldKey]) {
          fieldStatuses[fieldKey] = {
            value: change.newValue,
            status: change.status,
          };
        }
      }
    }

    return {
      id: expertData.id,
      name: expertData.name,
      email: expertData.email,
      username: expertData.username,
      image: expertData.image,
      bio: expertData.profile?.bio || null,
      experience: expertData.profile?.experience || 0,
      specialization: expertData.profile?.specialization || null,
      consultationFee: expertData.profile?.consultationFee || null,
      languages: expertData.profile?.languages || [],
      education: expertData.profile?.education || [],
      latestEducation: expertData.profile?.latestEducation || null,
      profileImage: toFullUrl(expertData.profile?.profileImage || null),
      introVideo: toFullUrl(expertData.profile?.introVideo || null),
      verificationStatus: expertData.profile?.verificationStatus || 'ONBOARDING',
      rejectionReason: expertData.profile?.rejectionReason || null,
      hasPendingUpdates: expertData.profile?.hasPendingUpdates || false,
      isVerified: expertData.profile?.isVerified || false,
      createdAt: expertData.profile?.createdAt || null,
      updatedAt: expertData.profile?.updatedAt || null,
      // Additional fields
      timezone: expertData.profile?.timezone || null,
      gender: expertData.profile?.gender || null,
      location: expertData.profile?.location || null,
      socialLinks: expertData.profile?.socialLinks || {},
      tags: expertData.profile?.tags || [],
      workHistory: expertData.profile?.workHistory || [],
      services: expertData.profile?.services || [],
      documents: expertData.profile?.documents || [],
      availability: expertData.profile?.availability || [],
      leaves: expertData.profile?.leaves || [],
      fieldStatuses,
    };
  }

  async updateProfile(expertId: string, updateData: any) {
    const { 
      name,
      username,
      bio, 
      experience, 
      specialization, 
      consultationFee, 
      languages, 
      education, 
      latestEducation,
      timezone,
      gender,
      location,
      socialLinks,
      tags,
      workHistory,
      services,
      documents,
      availability,
      leaves
    } = updateData;

    // Get existing profile to track changes
    const existingProfile = await this.databaseService.findExpertById(expertId);
    const currentProfileData = existingProfile.profile || {};

    // Track changes for admin review
    const changes = [];
    
    // Check each field for changes and create audit entries
    // Fetch existing pending changes to avoid recreating unchanged pending requests
    const latestChanges = await this.databaseService.findLatestProfileChanges(expertId);
    const pendingValues: Record<string, any> = {};
    if (latestChanges) {
      for (const change of latestChanges) {
        if (change.status === 'pending') {
          const fieldKey = change.field.toLowerCase();
          if (!pendingValues[fieldKey]) {
            pendingValues[fieldKey] = change.newValue;
          }
        }
      }
    }

    const fieldMappings: Record<string, string> = {
      name: 'Name',
      username: 'Username',
      bio: 'Bio',
      gender: 'Gender', 
      location: 'Location',
      timezone: 'Timezone',
      specialization: 'Specialization',
      languages: 'Languages',
      tags: 'Tags'
    };

    for (const [field, displayName] of Object.entries(fieldMappings)) {
      // For name and username, get values from expert table, not profile table
      let dbValue;
      if (field === 'name' || field === 'username') {
        dbValue = existingProfile[field];
      } else {
        dbValue = currentProfileData[field];
      }
      
      const newValue = updateData[field];
      
      const effectiveValue = pendingValues[field] !== undefined ? pendingValues[field] : (dbValue || null);
      
      if (effectiveValue !== newValue && newValue !== undefined) {
        changes.push({
          entityType: field === 'name' || field === 'username' ? 'expert' : 'expert_profile',
          entityId: expertId,
          field: displayName,
          oldValue: dbValue || null,
          newValue: newValue,
          status: 'pending'
        });
      }
    }

    // Create audit trail entries if there are changes
    if (changes.length > 0) {
      for (const change of changes) {
        await this.databaseService.createProfileChange(change);
      }
    }

    // Update expert table (for name and username)
    const expertUpdateData: any = {};
    if (name !== undefined) expertUpdateData.name = name;
    if (username !== undefined) expertUpdateData.username = username;

    if (Object.keys(expertUpdateData).length > 0) {
      await this.databaseService.updateExpert(expertId, expertUpdateData);
    }

    // Update profile table (for all other fields)
    const profileUpdateData = {
      bio,
      experience: experience ? parseInt(experience) : undefined,
      specialization,
      consultationFee: consultationFee ? parseFloat(consultationFee) : undefined,
      languages: languages || [],
      education: education || [],
      latestEducation: latestEducation || null,
      timezone,
      gender,
      location,
      socialLinks: socialLinks || {},
      tags: tags || [],
      workHistory: workHistory || [],
      services: services || [],
      documents: documents || [],
      availability: availability || [],
      leaves: leaves || [],
    };

    const updatedProfile = await this.databaseService.updateExpertProfile(expertId, profileUpdateData);

    return {
      message: 'Profile update submitted for admin approval',
      status: 'PENDING_APPROVAL',
      profile: updatedProfile,
      changes: changes.length
    };
  }

  async uploadProfileImage(expertId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileUrl = `http://localhost:3000/uploads/profile-images/${file.filename}`;
    
    // Update profile image in database
    await this.databaseService.updateExpertProfile(expertId, {
      profileImage: fileUrl,
    });

    return {
      message: 'Profile image uploaded successfully',
      fileUrl,
      status: 'PENDING_APPROVAL',
    };
  }

  async uploadIntroVideo(expertId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileUrl = `http://localhost:3000/uploads/intro-videos/${file.filename}`;
    
    // Update intro video in database
    await this.databaseService.updateExpertProfile(expertId, {
      introVideo: fileUrl,
    });

    return {
      message: 'Intro video uploaded successfully',
      fileUrl,
      status: 'PENDING_APPROVAL',
    };
  }

  async uploadDocument(expertId: string, file: Express.Multer.File, title: string, category: string) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!title || !category) {
      throw new BadRequestException('Title and category are required');
    }

    const fileUrl = `http://localhost:3000/uploads/verification-documents/${file.filename}`;
    
    // Get existing documents
    const expertData = await this.databaseService.findExpertById(expertId);
    const existingDocuments = expertData.profile?.documents || [];
    
    // Add new document
    const newDocument = {
      title,
      category,
      url: fileUrl,
      fileType: file.mimetype,
      fileSize: `${Math.round(file.size / 1024)}KB`
    };

    const updatedDocuments = [...existingDocuments, newDocument];
    
    // Update documents in database
    await this.databaseService.updateExpertProfile(expertId, {
      documents: updatedDocuments,
    });

    return {
      message: 'Document uploaded successfully',
      document: newDocument,
      status: 'PENDING_APPROVAL',
    };
  }

  async getDashboard(expertId: string) {
    const expertData = await this.databaseService.findExpertById(expertId);
    
    if (!expertData) {
      throw new BadRequestException('Expert not found');
    }

    // TODO: Implement actual dashboard metrics from bookings, sessions, and earnings tables
    // For now, return basic profile status
    return {
      todayBookings: 0, // TODO: Query bookings table for today's bookings
      upcomingBookings: 0, // TODO: Query bookings table for upcoming bookings
      completedSessions: 0, // TODO: Query sessions table for completed sessions
      earningsThisMonth: 0, // TODO: Query earnings table for this month's earnings
      status: expertData.profile?.verificationStatus || 'ONBOARDING',
      onboarding: expertData.profile?.verificationStatus === 'ONBOARDING',
      rejectionReason: expertData.profile?.rejectionReason || null,
      profile: {
        hasPendingUpdates: expertData.profile?.hasPendingUpdates || false,
      },
    };
  }
}
