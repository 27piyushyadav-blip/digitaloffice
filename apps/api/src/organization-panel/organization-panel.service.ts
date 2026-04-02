import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

// Force reload after database rebuild
@Injectable()
export class OrganizationPanelService {
  constructor(private readonly databaseService: DatabaseService) {}

  // Organization Profile APIs
  async getProfile(organizationId: string) {
    const org = await this.databaseService.findOrganizationById(organizationId);
    if (!org) throw new BadRequestException('Organization not found');
    const toFullUrl = (url: string | null) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      return `http://localhost:3000${url}`;
    };
    
    const changes = await this.databaseService.findLatestProfileChanges(organizationId);
    const fieldStatuses: Record<string, { value: any; status: string }> = {};
    if (changes) {
      for (const change of changes) {
        if (change.entityType === 'organization') {
          const fieldKey = change.field.toLowerCase();
          if (!fieldStatuses[fieldKey]) {
            fieldStatuses[fieldKey] = {
              value: change.newValue,
              status: change.status,
            };
          }
        }
      }
    }

    return {
      ...org,
      logo: toFullUrl(org.logo),
      introVideo: toFullUrl(org.introVideo),
      documents: org.documents || [],
      fieldStatuses,
    };
  }

  async updateProfile(organizationId: string, profileData: any) {
    const existingProfile = await this.databaseService.findOrganizationById(organizationId);
    if (!existingProfile) throw new BadRequestException('Organization not found');

    const changes = [];
    const latestChanges = await this.databaseService.findLatestProfileChanges(organizationId);
    const pendingValues: Record<string, any> = {};
    if (latestChanges) {
      for (const change of latestChanges) {
        if (change.status === 'pending' && change.entityType === 'organization') {
          const fieldKey = change.field.toLowerCase();
          if (!pendingValues[fieldKey]) {
            pendingValues[fieldKey] = change.newValue;
          }
        }
      }
    }

    const fieldMappings: Record<string, string> = {
      name: 'Name',
      description: 'Description',
      industry: 'Industry',
      location: 'Location',
      website: 'Website',
    };

    for (const [field, displayName] of Object.entries(fieldMappings)) {
      const dbValue = (existingProfile as any)[field];
      const newValue = profileData[field];
      const effectiveValue = pendingValues[field] !== undefined ? pendingValues[field] : (dbValue || null);
      
      if (effectiveValue !== newValue && newValue !== undefined) {
        changes.push({
          entityType: 'organization',
          entityId: organizationId,
          field: displayName,
          oldValue: dbValue || null,
          newValue: newValue,
          status: 'pending'
        });
      }
    }

    if (changes.length > 0) {
      for (const change of changes) {
        await this.databaseService.createProfileChange(change);
      }
    }

    const updatedOrg = await this.databaseService.updateOrganizationProfile(organizationId, {
      name: profileData.name !== undefined ? profileData.name : existingProfile.name,
      description: profileData.description !== undefined ? profileData.description : existingProfile.description,
      industry: profileData.industry !== undefined ? profileData.industry : existingProfile.industry,
      location: profileData.location !== undefined ? profileData.location : existingProfile.location,
      website: profileData.website !== undefined ? profileData.website : existingProfile.website,
    });

    return {
      message: 'Profile update submitted for admin approval',
      status: 'PENDING_APPROVAL',
      profile: updatedOrg,
      changes: changes.length
    };
  }

  async uploadLogo(organizationId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const fileUrl = `http://localhost:3000/uploads/organization-logos/${file.filename}`;
    
    const existingOrg = await this.databaseService.findOrganizationById(organizationId);
    
    await this.databaseService.createProfileChange({
      entityType: 'organization',
      entityId: organizationId,
      field: 'Logo',
      oldValue: existingOrg?.logo || null,
      newValue: fileUrl,
      status: 'pending'
    });
    
    await this.databaseService.updateOrganizationProfile(organizationId, { logo: fileUrl });
    return {
      message: 'Logo uploaded successfully',
      logoUrl: fileUrl,
      organizationId,
      status: 'PENDING_APPROVAL',
    };
  }

  async uploadIntroVideo(organizationId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const fileUrl = `http://localhost:3000/uploads/organization-videos/${file.filename}`;
    
    const existingOrg = await this.databaseService.findOrganizationById(organizationId);
    
    await this.databaseService.createProfileChange({
      entityType: 'organization',
      entityId: organizationId,
      field: 'Intro Video',
      oldValue: existingOrg?.introVideo || null,
      newValue: fileUrl,
      status: 'pending'
    });

    await this.databaseService.updateOrganizationProfile(organizationId, { introVideo: fileUrl });
    return {
      message: 'Intro video uploaded successfully',
      fileUrl,
      organizationId,
      status: 'PENDING_APPROVAL',
    };
  }

  async uploadDocuments(organizationId: string, file: Express.Multer.File, title: string, category: string) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!title || !category) throw new BadRequestException('Title and category are required');
    const fileUrl = `http://localhost:3000/uploads/organization-docs/${file.filename}`;
    
    const existingOrg = await this.databaseService.findOrganizationById(organizationId);
    
    await this.databaseService.createProfileChange({
      entityType: 'organization',
      entityId: organizationId,
      field: `Document: ${category} - ${title}`,
      oldValue: null,
      newValue: fileUrl,
      status: 'pending'
    });

    const existingDocs = existingOrg?.documents || [];
    const newDocument = {
      title,
      category,
      url: fileUrl,
      fileType: file.mimetype,
      fileSize: `${Math.round(file.size / 1024)}KB`
    };
    const updatedDocs = [...existingDocs, newDocument];
    await this.databaseService.updateOrganizationProfile(organizationId, { documents: updatedDocs });
    return {
      message: 'Document uploaded successfully',
      document: newDocument,
      organizationId,
      status: 'PENDING_APPROVAL',
    };
  }

  // Verification APIs
  async getVerificationStatus(organizationId: string) {
    // TODO: Implement actual database query
    return {
      status: 'VERIFIED',
      submittedAt: new Date('2024-01-15'),
      verifiedAt: new Date('2024-01-20'),
      rejectionReason: null,
    };
  }

  // Expert Management APIs
  async getOrganizationExperts(organizationId: string) {
    // TODO: Implement actual database query
    return {
      experts: [
        {
          id: 'exp_1',
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@example.com',
          phone: '+1 234-567-8900',
          specialization: 'Business Consulting',
          rating: 4.8,
          totalBookings: 45,
          revenue: 1250,
          status: 'active',
          joinedAt: new Date('2024-01-01'),
          profileImage: '/avatars/sarah.jpg',
        },
        {
          id: 'exp_2',
          name: 'Dr. Michael Chen',
          email: 'michael.chen@example.com',
          phone: '+1 234-567-8901',
          specialization: 'Financial Advisory',
          rating: 4.6,
          totalBookings: 38,
          revenue: 980,
          status: 'active',
          joinedAt: new Date('2024-01-15'),
          profileImage: '/avatars/michael.jpg',
        },
      ],
      total: 2,
      active: 2,
      inactive: 0,
    };
  }

  async getExpertDetails(organizationId: string, expertId: string) {
    // TODO: Implement actual database query
    return {
      id: expertId,
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1 234-567-8900',
      specialization: 'Business Consulting',
      rating: 4.8,
      totalBookings: 45,
      revenue: 1250,
      status: 'active',
      joinedAt: new Date('2024-01-01'),
      profileImage: '/avatars/sarah.jpg',
      bio: 'Experienced business consultant with 10+ years helping companies grow.',
      services: ['Business Consulting', 'Strategy Planning'],
      availability: [
        { day: 'Mon', time: '9AM - 5PM' },
        { day: 'Wed', time: '9AM - 5PM' },
        { day: 'Fri', time: '9AM - 5PM' },
      ],
    };
  }

  async removeExpert(organizationId: string, expertId: string) {
    // TODO: Implement actual database update
    return {
      message: 'Expert removed successfully',
      expertId,
      organizationId,
      removedAt: new Date(),
    };
  }

  async assignExpertService(organizationId: string, expertId: string, serviceData: any) {
    // TODO: Implement actual database update
    return {
      message: 'Service assigned to expert successfully',
      expertId,
      organizationId,
      serviceId: 'service_' + Date.now(),
      serviceName: serviceData.serviceName,
      assignedAt: new Date(),
    };
  }

  // Join Request APIs
  async getJoinRequests(organizationId: string) {
    // TODO: Implement actual database query
    return {
      requests: [
        {
          id: 'req_1',
          expertId: 'exp_3',
          expertName: 'Dr. Alice Brown',
          email: 'alice.brown@example.com',
          specialization: 'Psychology',
          experience: '5 years',
          message: 'I would like to join your organization',
          requestedAt: new Date(),
          status: 'PENDING',
        },
        {
          id: 'req_2',
          expertId: 'exp_4',
          expertName: 'Dr. Carol White',
          email: 'carol.white@example.com',
          specialization: 'Counseling',
          experience: '3 years',
          message: 'Interested in joining your team',
          requestedAt: new Date(),
          status: 'PENDING',
        },
      ],
      total: 2,
      pending: 2,
    };
  }

  async acceptJoinRequest(organizationId: string, requestId: string) {
    // TODO: Implement actual database update
    return {
      message: 'Join request accepted successfully',
      requestId,
      organizationId,
      expertId: 'exp_3',
      acceptedAt: new Date(),
    };
  }

  async rejectJoinRequest(organizationId: string, requestId: string) {
    // TODO: Implement actual database update
    return {
      message: 'Join request rejected',
      requestId,
      organizationId,
      rejectedAt: new Date(),
    };
  }

  async inviteExpert(organizationId: string, inviteData: any) {
    // TODO: Implement actual email sending and database insert
    return {
      message: 'Expert invited successfully',
      invitationId: 'inv_' + Date.now(),
      organizationId,
      expertEmail: inviteData.email,
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
  }

  // Services Management APIs
  async getServices(organizationId: string) {
    // TODO: Implement actual database query
    return {
      services: [
        {
          id: 'service_1',
          name: 'Legal Consultation',
          price: 2000,
          duration: 60,
          mode: ['online', 'offline'],
          description: 'Professional legal advice and consultation',
          isActive: true,
        },
        {
          id: 'service_2',
          name: 'Tax Filing Help',
          price: 1500,
          duration: 45,
          mode: ['online'],
          description: 'Assistance with tax filing and documentation',
          isActive: true,
        },
      ],
      total: 2,
      active: 2,
    };
  }

  async createService(organizationId: string, serviceData: any) {
    // TODO: Implement actual database insert
    return {
      message: 'Service created successfully',
      serviceId: 'service_' + Date.now(),
      organizationId,
      ...serviceData,
      createdAt: new Date(),
    };
  }

  async updateService(organizationId: string, serviceId: string, serviceData: any) {
    // TODO: Implement actual database update
    return {
      message: 'Service updated successfully',
      serviceId,
      organizationId,
      ...serviceData,
      updatedAt: new Date(),
    };
  }

  async deleteService(organizationId: string, serviceId: string) {
    // TODO: Implement actual database update
    return {
      message: 'Service deleted successfully',
      serviceId,
      organizationId,
      deletedAt: new Date(),
    };
  }

  // Booking Management APIs
  async getOrganizationBookings(organizationId: string, status?: string) {
    // TODO: Implement actual database query
    const bookings = [
      {
        id: 'book_1',
        clientId: 'client_1',
        clientName: 'John Doe',
        expertId: 'exp_1',
        expertName: 'Dr. Sarah Johnson',
        service: 'Legal Consultation',
        scheduledDate: new Date('2024-03-10T14:00:00Z'),
        duration: 60,
        amount: 2000,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
      {
        id: 'book_2',
        clientId: 'client_2',
        clientName: 'Jane Smith',
        expertId: 'exp_2',
        expertName: 'Dr. Michael Chen',
        service: 'Tax Filing Help',
        scheduledDate: new Date('2024-03-10T15:30:00Z'),
        duration: 45,
        amount: 1500,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
    ];

    const filteredBookings = status 
      ? bookings.filter(booking => booking.status.toLowerCase() === status.toLowerCase())
      : bookings;

    return {
      bookings: filteredBookings,
      total: filteredBookings.length,
      status: status || 'all',
    };
  }

  async getBookingDetails(organizationId: string, bookingId: string) {
    // TODO: Implement actual database query
    return {
      id: bookingId,
      clientId: 'client_1',
      clientName: 'John Doe',
      clientEmail: 'john.doe@example.com',
      clientPhone: '9876543210',
      expertId: 'exp_1',
      expertName: 'Dr. Sarah Johnson',
      service: 'Legal Consultation',
      scheduledDate: new Date('2024-03-10T14:00:00Z'),
      duration: 60,
      amount: 2000,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      meetingUrl: 'https://meet.example.com/room/123456',
      notes: 'Client needs help with business registration',
      createdAt: new Date('2024-03-08T10:00:00Z'),
    };
  }

  async cancelBooking(organizationId: string, bookingId: string) {
    // TODO: Implement actual database update
    return {
      message: 'Booking cancelled successfully',
      bookingId,
      organizationId,
      cancelledAt: new Date(),
      refundStatus: 'PROCESSING',
    };
  }

  async reassignBooking(organizationId: string, bookingId: string, reassignData: any) {
    // TODO: Implement actual database update
    return {
      message: 'Booking reassigned successfully',
      bookingId,
      organizationId,
      newExpertId: reassignData.expertId,
      newExpertName: 'Dr. Emily Davis',
      reassignedAt: new Date(),
    };
  }

  // Analytics & Revenue APIs
  async getDashboard(organizationId: string) {
    // TODO: Implement actual database query
    return {
      totalExperts: 10,
      todayBookings: 5,
      monthlyRevenue: 50000,
      pendingSessions: 3,
      totalBookings: 45,
      activeExperts: 8,
      pendingJoinRequests: 2,
      unreadNotifications: 7,
      recentActivity: [
        {
          type: 'booking',
          message: 'New booking with Dr. Sarah Johnson',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
        },
        {
          type: 'expert',
          message: 'Dr. Alice Brown requested to join',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ],
    };
  }

  async getRevenue(organizationId: string, month?: string) {
    // TODO: Implement actual database query
    return {
      totalRevenue: 50000,
      monthlyRevenue: 50000,
      expertCommission: 35000,
      platformFee: 15000,
      netRevenue: 35000,
      revenueBreakdown: [
        {
          month: '2024-01',
          revenue: 45000,
          bookings: 40,
        },
        {
          month: '2024-02',
          revenue: 48000,
          bookings: 42,
        },
        {
          month: '2024-03',
          revenue: 50000,
          bookings: 45,
        },
      ],
      topPerformingServices: [
        {
          serviceName: 'Legal Consultation',
          revenue: 25000,
          bookings: 20,
        },
        {
          serviceName: 'Tax Filing Help',
          revenue: 15000,
          bookings: 15,
        },
      ],
    };
  }

  async getExpertPerformance(organizationId: string) {
    // TODO: Implement actual database query
    return {
      experts: [
        {
          expertId: 'exp_1',
          expertName: 'Dr. Sarah Johnson',
          sessionsCompleted: 120,
          rating: 4.8,
          totalRevenue: 24000,
          averageSessionDuration: 58,
          cancellationRate: 0.05,
        },
        {
          expertId: 'exp_2',
          expertName: 'Dr. Michael Chen',
          sessionsCompleted: 95,
          rating: 4.6,
          totalRevenue: 19000,
          averageSessionDuration: 62,
          cancellationRate: 0.03,
        },
      ],
      totalExperts: 2,
      averageRating: 4.7,
      totalSessions: 215,
      totalRevenue: 43000,
    };
  }

  // Notifications APIs
  async getNotifications(organizationId: string) {
    // TODO: Implement actual database query
    return {
      notifications: [
        {
          id: 'notif_1',
          title: 'New Booking',
          message: 'John Doe booked a session with Dr. Sarah Johnson',
          type: 'booking',
          isRead: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
        },
        {
          id: 'notif_2',
          title: 'Expert Request',
          message: 'Dr. Alice Brown wants to join your organization',
          type: 'expert_request',
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: 'notif_3',
          title: 'Payment Received',
          message: 'Payment received for booking #book_123',
          type: 'payment',
          isRead: true,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
      ],
      total: 3,
      unread: 2,
    };
  }

  async markNotificationRead(organizationId: string, notificationId: string) {
    // TODO: Implement actual database update
    return {
      message: 'Notification marked as read',
      notificationId,
      organizationId,
      readAt: new Date(),
    };
  }
}
