import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AdminPanelService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  // Admin Authentication APIs
  async getAdminProfile(adminId: string) {
    // TODO: Implement actual database query
    return {
      id: adminId,
      name: 'Admin User',
      email: 'admin@digitaloffices.com',
      role: 'super_admin',
      permissions: ['all'],
      lastLogin: new Date(),
    };
  }

  // Expert Verification APIs
  async getPendingExperts() {
    // TODO: Implement actual database query
    return [
      {
        expertId: 'exp_123',
        name: 'Dr. Sharma',
        email: 'sharma@example.com',
        category: 'Legal Advisor',
        experience: '10 years',
        documents: ['aadhaar.pdf', 'degree.pdf', 'license.pdf'],
        status: 'pending',
        submittedAt: new Date('2024-03-08'),
      },
      {
        expertId: 'exp_456',
        name: 'Dr. Patel',
        email: 'patel@example.com',
        category: 'Tax Consultant',
        experience: '8 years',
        documents: ['pan.pdf', 'degree.pdf'],
        status: 'pending',
        submittedAt: new Date('2024-03-09'),
      },
    ];
  }

  async approveExpert(expertId: string) {
    return this.databaseService.updateExpertStatus(expertId, 'LIVE');
  }

  async rejectExpert(expertId: string, rejectData: any) {
    return this.databaseService.updateExpertStatus(expertId, 'REJECTED');
  }

  async getAllExperts(status?: string, category?: string, organization?: string) {
    // TODO: Implement actual database query with filters
    return {
      experts: [
        {
          expertId: 'exp_123',
          name: 'Dr. Sharma',
          email: 'sharma@example.com',
          category: 'Legal Advisor',
          experience: '10 years',
          rating: 4.8,
          totalBookings: 120,
          revenue: 240000,
          status: 'verified',
          organizationId: 'org_1',
          organizationName: 'Legal Solutions Inc',
          joinedAt: new Date('2024-01-15'),
        },
        {
          expertId: 'exp_456',
          name: 'Dr. Patel',
          email: 'patel@example.com',
          category: 'Tax Consultant',
          experience: '8 years',
          rating: 4.6,
          totalBookings: 95,
          revenue: 190000,
          status: 'pending',
          organizationId: null,
          organizationName: null,
          joinedAt: new Date('2024-03-01'),
        },
      ],
      total: 2,
      filters: { status, category, organization },
    };
  }

  async suspendExpert(expertId: string, suspendData: any) {
    const until = suspendData.suspendedUntil ? new Date(suspendData.suspendedUntil) : null;
    return this.databaseService.toggleUserBlock(expertId, 'expert', true, until);
  }

  async toggleMessaging(userId: string, userType: 'client' | 'expert' | 'organisation', disabled: boolean) {
    return this.databaseService.toggleMessaging(userId, userType, disabled);
  }

  async toggleUserBlock(userId: string, userType: 'client' | 'expert' | 'organisation', blocked: boolean, until?: Date | null) {
    return this.databaseService.toggleUserBlock(userId, userType, blocked, until);
  }

  async requestRefund(bookingId: string, amount: string, reason: string) {
    return this.databaseService.requestRefund(bookingId, amount, reason);
  }

  // Organization Verification APIs
  async getPendingOrganizations() {
    const orgs = await this.databaseService.findOrganizationsByStatus('PENDING');
    return orgs.map(org => ({
      orgId: org.id,
      userId: org.userId,
      name: org.name,
      email: org.email,
      phone: org.phone,
      industry: org.industry,
      location: org.location,
      description: org.description,
      logo: org.logo,
      introVideo: org.introVideo,
      website: org.website,
      documents: org.documents,
      status: org.verificationStatus,
      rejectionReason: org.rejectionReason,
      submittedAt: org.updatedAt,
      tagline: org.tagline,
      category: org.category,
      subdomain: org.subdomain,
      aboutUs: org.aboutUs,
      coverImageUrl: org.coverImageUrl,
      officialEmail: org.officialEmail,
      phoneNumber: org.phoneNumber,
      websiteUrl: org.websiteUrl,
      socialLinks: org.socialLinks,
      isPhysicalOffice: org.isPhysicalOffice,
      addressLine1: org.addressLine1,
      city: org.city,
      state: org.state,
      zipCode: org.zipCode,
      coordinates: org.coordinates,
      offeredServiceTypes: org.offeredServiceTypes,
      bookingPolicy: org.bookingPolicy,
      cancellationWindowHours: org.cancellationWindowHours,
      operatingHours: org.operatingHours,
      taxIdNumber: org.taxIdNumber,
      businessLicenseUrl: org.businessLicenseUrl,
      bankDetails: org.bankDetails,
    }));
  }

  async approveOrganization(orgId: string) {
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');
    await this.databaseService.updateOrganizationProfile(org.userId, {
      verified: true,
      verificationStatus: 'VERIFIED',
    });
    return {
      message: 'Organization approved successfully',
      orgId,
      approvedAt: new Date(),
      status: 'VERIFIED',
    };
  }

  async rejectOrganization(orgId: string, rejectData: any) {
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');
    await this.databaseService.updateOrganizationProfile(org.userId, {
      verified: false,
      verificationStatus: 'REJECTED',
      rejectionReason: rejectData.reason,
    });
    return {
      message: 'Organization rejected',
      orgId,
      reason: rejectData.reason,
      rejectedAt: new Date(),
      status: 'REJECTED',
    };
  }

  async getAllOrganizations(status?: string, location?: string, industry?: string) {
    const orgs = await this.databaseService.findOrganizations(status, location, industry);
    
    // Efficiently fetch experts for all organizations in the list
    const orgIds = orgs.map(org => org.id);
    const allExperts = await this.databaseService.findMultipleOrganizationsExperts(orgIds);
    
    // Group experts by organizationId
    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const formatUrl = (url: string | null) => {
      if (!url) return null;
      if (url.startsWith('http')) {
        if (url.includes('/uploads/')) {
          const path = url.split('/uploads/')[1];
          return `${baseUrl}/uploads/${path}`;
        }
        return url;
      }
      return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const expertsByOrg: Record<string, any[]> = {};
    allExperts.forEach(item => {
      if (!expertsByOrg[item.organizationId]) {
        expertsByOrg[item.organizationId] = [];
      }
      expertsByOrg[item.organizationId].push(this.mapExpert(item, formatUrl));
    });

    return {
      organizations: orgs.map(org => ({
        orgId: org.id,
        userId: org.userId,
        name: org.name,
        email: org.email,
        phone: org.phone,
        industry: org.industry,
        location: org.location,
        description: org.description,
        logo: formatUrl(org.logo),
        introVideo: formatUrl(org.introVideo),
        website: org.website,
        memberCount: org.memberCount,
        rating: org.rating,
        status: org.verificationStatus?.toLowerCase() || 'pending',
        isBlocked: org.isBlocked || false,
        messagingDisabled: org.messagingDisabled || false,
        blockedUntil: org.blockedUntil,
        isVisible: org.isVisible ?? true,
        rejectionReason: org.rejectionReason,
        joinedAt: org.createdAt,
        documents: (org.documents as any[])?.map(doc => ({
          ...doc,
          url: formatUrl(doc.url)
        })) || [],
        tagline: org.tagline,
        category: org.category,
        subdomain: org.subdomain,
        aboutUs: org.aboutUs,
        coverImageUrl: formatUrl(org.coverImageUrl),
        officialEmail: org.officialEmail,
        phoneNumber: org.phoneNumber,
        websiteUrl: org.websiteUrl,
        socialLinks: org.socialLinks,
        isPhysicalOffice: org.isPhysicalOffice,
        addressLine1: org.addressLine1,
        city: org.city,
        state: org.state,
        zipCode: org.zipCode,
        coordinates: org.coordinates,
        offeredServiceTypes: org.offeredServiceTypes,
        bookingPolicy: org.bookingPolicy,
        cancellationWindowHours: org.cancellationWindowHours,
        operatingHours: org.operatingHours,
        taxIdNumber: org.taxIdNumber,
        businessLicenseUrl: org.businessLicenseUrl,
        bankDetails: org.bankDetails,
        experts: expertsByOrg[org.id] || [],
      })),
      total: orgs.length,
      verifiedCount: orgs.filter(o => o.verificationStatus === 'VERIFIED').length,
      pendingCount: orgs.filter(o => o.verificationStatus === 'PENDING').length,
      rejectedCount: orgs.filter(o => o.verificationStatus === 'REJECTED').length,
      filters: { status, location, industry },
    };
  }

  async suspendOrganization(orgId: string, suspendData: any) {
    const until = suspendData.suspendedUntil ? new Date(suspendData.suspendedUntil) : null;
    return this.databaseService.toggleUserBlock(orgId, 'organisation', true, until);
  }

  async toggleOrganizationHold(orgId: string, isBlocked: boolean, durationMinutes?: number) {
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    let blockedUntil = null;
    if (isBlocked && durationMinutes) {
      blockedUntil = new Date();
      blockedUntil.setMinutes(blockedUntil.getMinutes() + durationMinutes);
    }

    return this.databaseService.toggleUserBlock(org.userId, 'organisation', isBlocked, blockedUntil);
  }

  async toggleOrganizationMessaging(orgId: string, isDisabled: boolean) {
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    return this.databaseService.toggleMessaging(org.userId, 'organisation', isDisabled);
  }

  async requestOrganizationRefund(orgId: string, data: any) {
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    // This is a stub for refund logic
    return {
      success: true,
      message: 'Refund request recorded successfully',
      orgId,
      refundAmount: data.amount,
      reason: data.reason,
    };
  }

  async updateOrganization(orgId: string, updateData: any) {
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    // Filter out fields that should not be updated directly or need special handling
    const allowedFields = [
      'name', 'description', 'tagline', 'location', 'aboutUs', 'category', 
      'subdomain', 'industry', 'phone', 'phoneNumber', 'officialEmail', 
      'website', 'websiteUrl', 'socialLinks', 'specialties', 'isPhysicalOffice',
      'addressLine1', 'city', 'state', 'zipCode', 'coordinates', 
      'offeredServiceTypes', 'operatingHours', 'bookingPolicy', 
      'cancellationWindowHours', 'bankDetails', 'workingHours', 'tags', 
      'isVisible', 'menu', 'verificationStatus', 'verified'
    ];

    const filteredData: any = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    await this.databaseService.updateOrganizationProfile(org.userId, filteredData);
    return {
      success: true,
      message: 'Organization updated successfully',
      orgId,
    };
  }

  async getOrganizationDetails(orgId: string) {
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async checkOrganizationDetails(orgId: string) {
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    const profileFields = [
      { field: 'name', label: 'Organization Name', value: org.name },
      { field: 'category', label: 'Category/Industry', value: org.category || org.industry },
      { field: 'tagline', label: 'Tagline', value: org.tagline },
      { field: 'aboutUs', label: 'About Us/Description', value: org.aboutUs || org.description },
      { field: 'officialEmail', label: 'Official Email', value: org.officialEmail || org.email },
      { field: 'phone', label: 'Phone Number', value: org.phoneNumber || org.phone },
      { field: 'subdomain', label: 'Subdomain', value: org.subdomain },
      { field: 'logo', label: 'Organization Logo', value: org.logo || org.logoUrl },
      { field: 'taxIdNumber', label: 'Tax ID / License Number', value: org.taxIdNumber || org.licenseNumber },
    ];

    const bankFields = [
      { field: 'bankName', label: 'Bank Name', value: org.bankDetails?.bankName },
      { field: 'accountName', label: 'Account Name', value: org.bankDetails?.accountName },
      { field: 'accountNumber', label: 'Account Number', value: org.bankDetails?.accountNumber },
      { field: 'bsbCode', label: 'BSB/IFSC Code', value: org.bankDetails?.bsbCode || org.bankDetails?.ifscCode },
    ];

    const ownerFields = [
      { field: 'ownerName', label: 'Owner Name', value: org.ownerName },
      { field: 'email', label: 'Owner Email', value: org.email },
    ];

    const missingFields = [
      ...profileFields.filter(f => !f.value),
      ...bankFields.filter(f => !f.value),
      ...ownerFields.filter(f => !f.value),
    ];

    const totalFields = profileFields.length + bankFields.length + ownerFields.length;
    const filledFields = totalFields - missingFields.length;
    const completionPercentage = Math.round((filledFields / totalFields) * 100);

    return {
      orgId,
      name: org.name,
      completionPercentage,
      status: org.verificationStatus,
      details: {
        profile: profileFields,
        bank: bankFields,
        owner: ownerFields,
      },
      missingFields: missingFields.map(f => f.label),
      isProperlyFilled: missingFields.length === 0,
    };
  }

  async uploadOrganizationDP(orgId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/organization-logos/${file.filename}`;
    
    // Update multiple fields for backward compatibility
    await this.databaseService.updateOrganizationProfile(org.userId, { 
      logo: fileUrl, 
      logoUrl: fileUrl, 
      image: fileUrl 
    });
    
    return { success: true, url: fileUrl };
  }

  async uploadOrganizationVideo(orgId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/organization-videos/${file.filename}`;
    await this.databaseService.updateOrganizationProfile(org.userId, { introVideo: fileUrl });
    return { success: true, url: fileUrl };
  }

  async uploadOrganizationDocument(orgId: string, file: Express.Multer.File, title: string, category: string) {
    if (!file) throw new BadRequestException('No file uploaded');
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/organization-docs/${file.filename}`;
    
    const existingDocs = org && Array.isArray(org.documents) ? org.documents : [];
    const newDoc = {
      title: title || file.originalname,
      category: category || 'General',
      url: fileUrl,
      uploadedAt: new Date().toISOString(),
      fileType: file.mimetype,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`
    };
    
    await this.databaseService.updateOrganizationProfile(org.userId, { 
      documents: [...existingDocs, newDoc] 
    });
    return { success: true, url: fileUrl, document: newDoc };
  }

  async getOrganizationReviews(orgId: string) {
    const org = await this.databaseService.findOrganizationById(orgId);
    if (!org) throw new NotFoundException('Organization not found');
    return this.databaseService.findReviewsByOrganizationId(orgId);
  }

  async getOrganizationServices(orgId: string) {
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');
    return this.databaseService.listOrganizationServices(org.userId);
  }

  async createOrganizationService(orgId: string, data: any) {
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');
    return this.databaseService.createOrganizationService(org.userId, data);
  }

  async updateOrganizationService(orgId: string, serviceId: string, data: any) {
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');
    return this.databaseService.updateOrganizationService(org.userId, serviceId, data);
  }

  async deleteOrganizationService(orgId: string, serviceId: string) {
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');
    return this.databaseService.deleteOrganizationService(org.userId, serviceId);
  }

  async uploadExpertDP(expertId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const expert = await this.databaseService.findExpertById(expertId);
    if (!expert) throw new NotFoundException('Expert not found');

    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/profile-images/${file.filename}`;
    
    // Update multiple fields for backward compatibility
    await this.databaseService.updateExpertProfile(expertId, { 
      avatarUrl: fileUrl, 
      profileImageUrl: fileUrl,
      profileImage: fileUrl 
    });
    
    return { success: true, url: fileUrl };
  }

  async uploadExpertVideo(expertId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const expert = await this.databaseService.findExpertById(expertId);
    if (!expert) throw new NotFoundException('Expert not found');

    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/intro-videos/${file.filename}`;
    await this.databaseService.updateExpertProfile(expertId, { 
      videoUrl: fileUrl, 
      introVideoUrl: fileUrl,
      introVideo: fileUrl
    });
    return { success: true, url: fileUrl };
  }

  async uploadExpertDocument(expertId: string, file: Express.Multer.File, title: string, category: string) {
    if (!file) throw new BadRequestException('No file uploaded');
    const expert = await this.databaseService.findExpertById(expertId);
    if (!expert) throw new NotFoundException('Expert not found');

    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/expert-docs/${file.filename}`;
    
    // In expertProfile, it might be nested under .profile
    const profile = (expert as any).profile || expert;
    const existingDocs = profile && Array.isArray(profile.documents) ? profile.documents : [];
    
    const newDoc = {
      title: title || file.originalname,
      category: category || 'General',
      url: fileUrl,
      uploadedAt: new Date().toISOString(),
      fileType: file.mimetype,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`
    };
    
    await this.databaseService.updateExpertProfile(expertId, { documents: [...existingDocs, newDoc] });
    return { success: true, url: fileUrl, document: newDoc };
  }

  async getOrganizationExperts(orgId: string) {
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');
    const experts = await this.databaseService.findOrganizationExperts(org.id);

    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const formatUrl = (url: string | null) => {
      if (!url) return null;
      if (url.startsWith('http')) {
        if (url.includes('/uploads/')) {
          const path = url.split('/uploads/')[1];
          return `${baseUrl}/uploads/${path}`;
        }
        return url;
      }
      return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    return experts.map((item: any) => this.mapExpert(item, formatUrl));
  }

  async getExpertDetails(orgId: string, expertId: string) {
    const expert = await this.databaseService.findExpertById(expertId);
    if (!expert) throw new NotFoundException('Expert not found');
    return expert;
  }

  private mapExpert(item: any, formatUrl: (url: string | null) => string | null) {
    const ep = item.expert_profile;
    const e = item.expert;
    
    return {
      expertId: e.id,
      id: e.id, // For frontend compatibility
      name: e.name,
      username: e.username,
      email: e.email,
      phone: e.phone,
      image: formatUrl(ep?.profileImage || e.image),
      profileImage: formatUrl(ep?.profileImage || e.image),
      introVideo: formatUrl(ep?.videoUrl || ep?.introVideo),
      bio: ep?.bio,
      category: ep?.category,
      specialization: ep?.specialization || ep?.category,
      experience: ep?.experience,
      rating: ep?.rating || 0,
      totalBookings: ep?.totalBookings || 0,
      status: ep?.verificationStatus?.toLowerCase() || 'pending',
      verificationStatus: ep?.verificationStatus || 'PENDING',
      isVisible: ep?.isVisible ?? true,
      languages: ep?.languages || [],
      socialLinks: ep?.socialLinks || {},
      documents: (ep?.documents as any[])?.map(doc => ({
        ...doc,
        url: formatUrl(doc.url)
      })) || [],
      education: ep?.education || [],
      workHistory: ep?.workHistory || [],
      services: ep?.services || [],
      availability: ep?.availability || [],
      isVerified: ep?.verificationStatus === 'LIVE' || ep?.verificationStatus === 'VERIFIED',
      isOnline: ep?.isOnline || false,
    };
  }

  async updateExpert(orgId: string, expertId: string, data: any) {
    const expertRecord = await this.databaseService.findExpertById(expertId);
    if (!expertRecord) throw new NotFoundException('Expert not found');

    // Split data into basic info and profile info
    const basicFields = ['name', 'email', 'username', 'image'];
    const basicData: any = {};
    const profileData: any = {};

    Object.keys(data).forEach(key => {
      if (basicFields.includes(key)) {
        basicData[key] = data[key];
      } else {
        profileData[key] = data[key];
      }
    });

    if (Object.keys(basicData).length > 0) {
      await this.databaseService.updateExpert(expertId, basicData);
    }

    if (Object.keys(profileData).length > 0) {
      await this.databaseService.updateExpertProfile(expertId, profileData);
    }

    return { 
      success: true, 
      message: 'Expert updated successfully',
      expertId 
    };
  }

  async addExpertToOrganization(orgId: string, expertId: string) {
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');
    
    const expert = await this.databaseService.findExpertById(expertId);
    if (!expert) throw new NotFoundException('Expert not found');

    return this.databaseService.addExpertToOrganization(orgId, expertId);
  }

  async removeExpertFromOrganization(orgId: string, expertId: string) {
    const org = await this.databaseService.findOrganizationByProfileId(orgId);
    if (!org) throw new NotFoundException('Organization not found');

    const result = await this.databaseService.removeExpertFromOrganization(orgId, expertId);
    if (!result) throw new BadRequestException('Expert was not part of this organization');
    
    return { success: true, message: 'Expert removed successfully' };
  }

  async getExpertBookings(expertId: string, status?: string) {
    const expert = await this.databaseService.findExpertById(expertId);
    if (!expert) throw new NotFoundException('Expert not found');
    return this.databaseService.findExpertBookings(expertId, status);
  }

  // Profile Change Approval APIs
  async getPendingProfileChanges() {
    // TODO: Implement actual database query
    return [
      {
        changeId: 'chg_123',
        type: 'expert',
        entityId: 'exp_123',
        entityType: 'expert',
        field: 'experience',
        oldValue: '5 years',
        newValue: '10 years',
        reason: 'Updated experience',
        submittedAt: new Date('2024-03-10'),
      },
      {
        changeId: 'chg_456',
        type: 'organization',
        entityId: 'org_123',
        entityType: 'organization',
        field: 'description',
        oldValue: 'Legal consultancy firm',
        newValue: 'Professional legal consultancy with 20+ years of experience',
        reason: 'Updated company description',
        submittedAt: new Date('2024-03-09'),
      },
    ];
  }

  async approveProfileChange(changeId: string) {
    // TODO: Implement actual database update
    return {
      message: 'Profile change approved',
      changeId,
      approvedAt: new Date(),
    };
  }

  async rejectProfileChange(changeId: string) {
    // TODO: Implement actual database update
    return {
      message: 'Profile change rejected',
      changeId,
      rejectedAt: new Date(),
    };
  }

  // Booking Monitoring APIs
  async getAllBookings(
    status?: string,
    expertId?: string,
    organizationId?: string,
    date?: string,
    consultationType?: string,
  ) {
    // TODO: Implement actual database query with filters
    return {
      bookings: [
        {
          bookingId: 'book_123',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          expertName: 'Dr. Sharma',
          expertId: 'exp_123',
          organizationName: 'ABC Legal Consultancy',
          service: 'Legal Consultation',
          consultationType: 'online',
          scheduledDate: new Date('2024-03-10T14:00:00Z'),
          duration: 60,
          amount: 2000,
          status: 'confirmed',
          paymentStatus: 'paid',
        },
        {
          bookingId: 'book_456',
          clientName: 'Jane Smith',
          clientEmail: 'jane@example.com',
          expertName: 'Dr. Patel',
          expertId: 'exp_456',
          organizationName: null,
          service: 'Tax Filing Help',
          consultationType: 'offline',
          scheduledDate: new Date('2024-03-11T10:00:00Z'),
          duration: 45,
          amount: 1500,
          status: 'pending',
          paymentStatus: 'pending',
        },
      ],
      total: 2,
      filters: { status, expertId, organizationId, date, consultationType },
    };
  }

  async getBookingDetails(bookingId: string) {
    // TODO: Implement actual database query
    return {
      bookingId,
      clientName: 'John Doe',
      clientEmail: 'john@example.com',
      clientPhone: '9876543210',
      expertName: 'Dr. Sharma',
      expertEmail: 'sharma@example.com',
      organizationName: 'ABC Legal Consultancy',
      service: 'Legal Consultation',
      consultationType: 'online',
      scheduledDate: new Date('2024-03-10T14:00:00Z'),
      duration: 60,
      amount: 2000,
      status: 'confirmed',
      paymentStatus: 'paid',
      meetingUrl: 'https://meet.example.com/room/123456',
      notes: 'Client needs help with business registration',
      createdAt: new Date('2024-03-08T10:00:00Z'),
    };
  }

  async cancelBooking(bookingId: string) {
    // TODO: Implement actual database update
    return {
      message: 'Booking cancelled by admin',
      bookingId,
      cancelledAt: new Date(),
      refundStatus: 'processing',
    };
  }

  // Refund & Dispute APIs
  async getRefundRequests(status?: 'pending' | 'approved' | 'rejected') {
    // TODO: Implement actual database query
    return {
      refundRequests: [
        {
          refundId: 'refund_123',
          bookingId: 'book_123',
          clientName: 'John Doe',
          expertName: 'Dr. Sharma',
          amount: 2000,
          reason: 'Expert did not attend session',
          status: 'pending',
          requestedAt: new Date('2024-03-09'),
        },
        {
          refundId: 'refund_456',
          bookingId: 'book_456',
          clientName: 'Jane Smith',
          expertName: 'Dr. Patel',
          amount: 1500,
          reason: 'Technical issues during session',
          status: 'approved',
          requestedAt: new Date('2024-03-08'),
          processedAt: new Date('2024-03-09'),
        },
      ],
      total: 2,
      filters: { status },
    };
  }

  async approveRefund(refundId: string) {
    // TODO: Implement actual database update
    return {
      message: 'Refund approved',
      refundId,
      approvedAt: new Date(),
      processedAt: new Date(),
    };
  }

  async rejectRefund(refundId: string) {
    // TODO: Implement actual database update
    return {
      message: 'Refund rejected',
      refundId,
      rejectedAt: new Date(),
    };
  }

  async getDisputes() {
    // TODO: Implement actual database query
    return [
      {
        disputeId: 'dispute_123',
        bookingId: 'book_123',
        clientName: 'John Doe',
        expertName: 'Dr. Sharma',
        type: 'service_quality',
        description: 'Expert was not prepared for consultation',
        status: 'pending',
        createdAt: new Date('2024-03-09'),
      },
      {
        disputeId: 'dispute_456',
        bookingId: 'book_456',
        clientName: 'Jane Smith',
        expertName: 'Dr. Patel',
        type: 'payment_issue',
        description: 'Charged more than agreed amount',
        status: 'resolved',
        createdAt: new Date('2024-03-08'),
        resolvedAt: new Date('2024-03-09'),
        resolution: 'Partial refund processed',
      },
    ];
  }

  async resolveDispute(disputeId: string, resolveData: any) {
    // TODO: Implement actual database update
    return {
      message: 'Dispute resolved',
      disputeId,
      resolution: resolveData.resolution,
      resolvedAt: new Date(),
      status: 'resolved',
    };
  }

  // Platform Analytics APIs
  async getDashboardStats() {
    // TODO: Implement actual database query
    return {
      totalUsers: 12000,
      totalExperts: 540,
      totalOrganizations: 80,
      totalBookings: 45000,
      revenue: 12000000,
      pendingExpertVerifications: 12,
      pendingOrganizationVerifications: 5,
      activeDisputes: 3,
      pendingRefunds: 8,
      monthlyGrowth: {
        users: 12,
        experts: 8,
        organizations: 5,
        bookings: 15,
        revenue: 18,
      },
    };
  }

  async getBookingAnalytics() {
    // TODO: Implement actual database query
    return {
      totalBookings: 45000,
      monthlyBookings: [
        { month: '2024-01', bookings: 3500, revenue: 700000 },
        { month: '2024-02', bookings: 3800, revenue: 760000 },
        { month: '2024-03', bookings: 4200, revenue: 840000 },
      ],
      bookingsByStatus: {
        completed: 38000,
        cancelled: 5000,
        pending: 2000,
      },
      bookingsByType: {
        online: 32000,
        offline: 13000,
      },
      topServices: [
        { name: 'Legal Consultation', count: 12000 },
        { name: 'Tax Filing Help', count: 8500 },
        { name: 'Business Advisory', count: 6500 },
      ],
    };
  }

  async getRevenueAnalytics() {
    // TODO: Implement actual database query
    return {
      totalRevenue: 12000000,
      monthlyRevenue: [
        { month: '2024-01', revenue: 700000, commission: 105000 },
        { month: '2024-02', revenue: 760000, commission: 114000 },
        { month: '2024-03', revenue: 840000, commission: 126000 },
      ],
      revenueBySource: {
        expertBookings: 9600000,
        organizationBookings: 2400000,
      },
      commissionBreakdown: {
        totalCommission: 1800000,
        expertPayouts: 10200000,
        platformRevenue: 1800000,
      },
    };
  }

  async getExpertAnalytics() {
    // TODO: Implement actual database query
    return {
      totalExperts: 540,
      activeExperts: 480,
      expertCategories: [
        { category: 'Legal', count: 180, avgRating: 4.7 },
        { category: 'Tax', count: 120, avgRating: 4.6 },
        { category: 'Medical', count: 90, avgRating: 4.8 },
        { category: 'Career', count: 60, avgRating: 4.5 },
        { category: 'Finance', count: 90, avgRating: 4.6 },
      ],
      topPerformers: [
        {
          expertId: 'exp_123',
          name: 'Dr. Sharma',
          bookings: 450,
          revenue: 900000,
          rating: 4.9,
        },
        {
          expertId: 'exp_456',
          name: 'Dr. Patel',
          bookings: 380,
          revenue: 760000,
          rating: 4.8,
        },
      ],
    };
  }

  // Category Management APIs
  async createCategory(categoryData: any) {
    // TODO: Implement actual database insert
    return {
      message: 'Category created successfully',
      categoryId: 'cat_' + Date.now(),
      ...categoryData,
      createdAt: new Date(),
    };
  }

  async getCategories() {
    // TODO: Implement actual database query
    return [
      {
        id: 'cat_1',
        name: 'Legal',
        description: 'Legal consultation and advisory services',
        isActive: true,
        expertCount: 180,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'cat_2',
        name: 'Tax',
        description: 'Tax filing and consultation services',
        isActive: true,
        expertCount: 120,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'cat_3',
        name: 'Medical',
        description: 'Medical consultation services',
        isActive: true,
        expertCount: 90,
        createdAt: new Date('2024-01-01'),
      },
    ];
  }

  async updateCategory(categoryId: string, categoryData: any) {
    // TODO: Implement actual database update
    return {
      message: 'Category updated successfully',
      categoryId,
      ...categoryData,
      updatedAt: new Date(),
    };
  }

  async deleteCategory(categoryId: string) {
    // TODO: Implement actual database update
    return {
      message: 'Category deleted successfully',
      categoryId,
      deletedAt: new Date(),
    };
  }

  // Platform Settings APIs
  async getPlatformSettings() {
    // TODO: Implement actual database query
    return {
      platformCommission: 15,
      minimumBookingAmount: 500,
      refundPolicy: '7 days full refund',
      sessionDurationLimits: {
        minimum: 15,
        maximum: 180,
      },
      expertVerificationRequired: true,
      organizationVerificationRequired: true,
      autoApprovalEnabled: false,
      maintenanceMode: false,
      supportEmail: 'support@digitaloffices.com',
      supportPhone: '+1-800-123-4567',
    };
  }

  async updatePlatformSettings(settingsData: any) {
    // TODO: Implement actual database update
    return {
      message: 'Platform settings updated successfully',
      ...settingsData,
      updatedAt: new Date(),
    };
  }

  // Content Moderation APIs
  async removeReview(reviewId: string) {
    const result = await this.databaseService.deleteReview(reviewId);
    if (!result) throw new NotFoundException('Review not found');
    return {
      success: true,
      message: 'Review removed successfully',
      reviewId,
      removedAt: new Date(),
    };
  }

  async removeUser(userId: string) {
    // TODO: Implement actual database update
    return {
      message: 'User removed successfully',
      userId,
      removedAt: new Date(),
    };
  }

  async banUser(userId: string, banData: any) {
    // TODO: Implement actual database update
    return {
      message: 'User banned successfully',
      userId,
      reason: banData.reason,
      bannedAt: new Date(),
      bannedUntil: banData.bannedUntil,
    };
  }

  // Notifications API
  async sendNotification(notificationData: any) {
    // TODO: Implement actual notification sending
    return {
      message: 'Notification sent successfully',
      notificationId: 'notif_' + Date.now(),
      target: notificationData.target,
      title: notificationData.title,
      notificationMessage: notificationData.message,
      sentAt: new Date(),
      recipientCount: this.getRecipientCount(notificationData.target),
    };
  }

  private getRecipientCount(target: string): number {
    // Mock recipient count based on target
    const counts = {
      all_experts: 540,
      all_organizations: 80,
      all_users: 12000,
      all_clients: 11460,
    };
    return counts[target as keyof typeof counts] || 0;
  }

  // Logs & Activity APIs
  async getActivityLogs() {
    // TODO: Implement actual database query
    return [
      {
        id: 'log_1',
        adminId: 'admin_1',
        adminName: 'Admin User',
        action: 'expert_approved',
        details: 'Approved expert Dr. Sharma',
        targetId: 'exp_123',
        targetType: 'expert',
        timestamp: new Date('2024-03-10T10:30:00Z'),
        ipAddress: '192.168.1.100',
      },
      {
        id: 'log_2',
        adminId: 'admin_1',
        adminName: 'Admin User',
        action: 'organization_rejected',
        details: 'Rejected organization Tax Advisors Ltd',
        targetId: 'org_456',
        targetType: 'organization',
        timestamp: new Date('2024-03-10T09:15:00Z'),
        ipAddress: '192.168.1.100',
      },
      {
        id: 'log_3',
        adminId: 'admin_1',
        adminName: 'Admin User',
        action: 'dispute_resolved',
        details: 'Resolved dispute dispute_123',
        targetId: 'dispute_123',
        targetType: 'dispute',
        timestamp: new Date('2024-03-09T16:45:00Z'),
        ipAddress: '192.168.1.100',
      },
    ];
  }
}
