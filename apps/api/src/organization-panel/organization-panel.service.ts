import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { expert, expertProfile, expertOrganizations, organisation, organizationProfile } from '@repo/database';
import { eq, and } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

import { MailService } from '@repo/mail';

// Force reload after database rebuild
@Injectable()
export class OrganizationPanelService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // Organization Profile APIs
  async getProfile(organizationId: string) {
    const org = await this.databaseService.findOrganizationById(organizationId);
    if (!org) throw new BadRequestException('Organization not found');
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
      logo: this.toFullUrl(org.logo),
      introVideo: this.toFullUrl(org.introVideo),
      documents: org.documents || [],
      fieldStatuses,
    };
  }

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
      tagline: 'Tagline',
      aboutUs: 'About Us',
      category: 'Category',
      industry: 'Industry',
      subdomain: 'Subdomain',
      location: 'Location',
      addressLine1: 'Address Line 1',
      city: 'City',
      state: 'State',
      zipCode: 'Zip Code',
      isPhysicalOffice: 'Is Physical Office',
      website: 'Website',
      websiteUrl: 'Website URL',
      officialEmail: 'Official Email',
      phone: 'Phone',
      phoneNumber: 'Phone Number',
      foundedYear: 'Founded Year',
      licenseNumber: 'License Number',
      taxIdNumber: 'ABN Number',
      bankName: 'Bank Name',
      bsbCode: 'BSB Code',
      bookingPolicy: 'Booking Policy',
      cancellationWindowHours: 'Cancellation Window',
      products: 'Products',
      features: 'Features',
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
      tagline: profileData.tagline !== undefined ? profileData.tagline : (existingProfile as any).tagline,
      aboutUs: profileData.aboutUs !== undefined ? profileData.aboutUs : (existingProfile as any).aboutUs,
      category: profileData.category !== undefined ? profileData.category : (existingProfile as any).category,
      industry: profileData.industry !== undefined ? profileData.industry : existingProfile.industry,
      subdomain: profileData.subdomain !== undefined ? profileData.subdomain : (existingProfile as any).subdomain,
      location: profileData.location !== undefined ? profileData.location : existingProfile.location,
      addressLine1: profileData.addressLine1 !== undefined ? profileData.addressLine1 : (existingProfile as any).addressLine1,
      city: profileData.city !== undefined ? profileData.city : (existingProfile as any).city,
      state: profileData.state !== undefined ? profileData.state : (existingProfile as any).state,
      zipCode: profileData.zipCode !== undefined ? profileData.zipCode : (existingProfile as any).zipCode,
      isPhysicalOffice: profileData.isPhysicalOffice !== undefined ? profileData.isPhysicalOffice : (existingProfile as any).isPhysicalOffice,
      coordinates: profileData.coordinates !== undefined ? profileData.coordinates : (existingProfile as any).coordinates,
      website: profileData.website !== undefined ? profileData.website : existingProfile.website,
      websiteUrl: profileData.websiteUrl !== undefined ? profileData.websiteUrl : (existingProfile as any).websiteUrl,
      officialEmail: profileData.officialEmail !== undefined ? profileData.officialEmail : (existingProfile as any).officialEmail,
      phone: profileData.phone !== undefined ? profileData.phone : (existingProfile as any).phone,
      phoneNumber: profileData.phoneNumber !== undefined ? profileData.phoneNumber : (existingProfile as any).phoneNumber,
      socialLinks: profileData.socialLinks !== undefined ? profileData.socialLinks : (existingProfile as any).socialLinks,
      logoUrl: profileData.logoUrl !== undefined ? profileData.logoUrl : (existingProfile as any).logoUrl,
      coverImageUrl: profileData.coverImageUrl !== undefined ? profileData.coverImageUrl : (existingProfile as any).coverImageUrl,
      documents: profileData.documents !== undefined ? profileData.documents : existingProfile.documents,
      workingHours: profileData.workingHours !== undefined ? profileData.workingHours : existingProfile.workingHours,
      operatingHours: profileData.operatingHours !== undefined ? profileData.operatingHours : (existingProfile as any).operatingHours,
      offeredServiceTypes: profileData.offeredServiceTypes !== undefined ? profileData.offeredServiceTypes : (existingProfile as any).offeredServiceTypes,
      bookingPolicy: profileData.bookingPolicy !== undefined ? profileData.bookingPolicy : (existingProfile as any).bookingPolicy,
      cancellationWindowHours: profileData.cancellationWindowHours !== undefined ? profileData.cancellationWindowHours : (existingProfile as any).cancellationWindowHours,
      bankDetails: profileData.bankDetails !== undefined ? profileData.bankDetails : (existingProfile as any).bankDetails,
      foundedYear: profileData.foundedYear !== undefined ? profileData.foundedYear : existingProfile.foundedYear,
      licenseNumber: profileData.licenseNumber !== undefined ? profileData.licenseNumber : existingProfile.licenseNumber,
      taxIdNumber: profileData.taxIdNumber !== undefined ? profileData.taxIdNumber : (existingProfile as any).taxIdNumber,
      businessLicenseUrl: profileData.businessLicenseUrl !== undefined ? profileData.businessLicenseUrl : (existingProfile as any).businessLicenseUrl,
      tags: profileData.tags !== undefined ? profileData.tags : existingProfile.tags,
      verificationStatus: profileData.verificationStatus !== undefined ? profileData.verificationStatus : existingProfile.verificationStatus,
      products: profileData.products !== undefined ? profileData.products : (existingProfile as any).products,
      features: profileData.features !== undefined ? profileData.features : (existingProfile as any).features,
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
    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/organization-logos/${file.filename}`;
    
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

  async uploadCoverImage(organizationId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/organization-covers/${file.filename}`;
    
    const existingOrg = await this.databaseService.findOrganizationById(organizationId);
    
    await this.databaseService.createProfileChange({
      entityType: 'organization',
      entityId: organizationId,
      field: 'Cover Image',
      oldValue: existingOrg?.coverImageUrl || null,
      newValue: fileUrl,
      status: 'pending'
    });
    
    await this.databaseService.updateOrganizationProfile(organizationId, { coverImageUrl: fileUrl });
    return {
      message: 'Cover image uploaded successfully',
      coverUrl: fileUrl,
      organizationId,
      status: 'PENDING_APPROVAL',
    };
  }

  async uploadIntroVideo(organizationId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/organization-videos/${file.filename}`;
    
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
    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/organization-docs/${file.filename}`;
    
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

  async uploadExpertAvatar(organizationId: string, file: Express.Multer.File, expertId?: string) {
    if (!file) throw new BadRequestException('No file uploaded');
    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/profile-images/${file.filename}`;
    
    if (expertId) {
      await this.updateExpertAvatar(organizationId, expertId, fileUrl);
    }
    
    return {
      message: 'Expert avatar uploaded successfully',
      fileUrl,
      status: 'SUCCESS',
    };
  }

  async uploadExpertVideo(organizationId: string, file: Express.Multer.File, expertId?: string) {
    if (!file) throw new BadRequestException('No file uploaded');
    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/intro-videos/${file.filename}`;
    
    if (expertId) {
      await this.updateExpertVideo(organizationId, expertId, fileUrl);
    }
    
    return {
      message: 'Expert video uploaded successfully',
      fileUrl,
      status: 'SUCCESS',
    };
  }

  // Verification APIs
  async getVerificationStatus(organizationId: string) {
    const org = await this.databaseService.findOrganizationById(organizationId);
    if (!org) throw new BadRequestException('Organization not found');

    return {
      status: org.verificationStatus,
      verified: org.verified,
      rejectionReason: org.rejectionReason,
      updatedAt: org.updatedAt,
    };
  }

  // Expert Management APIs
  async getOrganizationExperts(userId: string) {
    try {
      const org = await this.getProfile(userId);
      const organizationProfileId = org.id;

      const experts = await this.databaseService.db
        .select({
          id: expert.id,
          name: expert.name,
          email: expert.email,
          username: expert.username,
          avatar: expertProfile.profileImage,
          bio: expertProfile.bio,
          specialization: expertProfile.specialization,
          experience: expertProfile.experience,
          consultationFee: expertProfile.consultationFee,
          status: expertProfile.verificationStatus,
          createdAt: expert.createdAt,
          availability: expertProfile.availability,
          languages: expertProfile.languages,
          education: expertProfile.education,
          workHistory: expertProfile.workHistory,
          services: expertProfile.services,
          tags: expertProfile.tags,
        })
        .from(expertOrganizations)
        .innerJoin(expert, eq(expertOrganizations.expertId, expert.id))
        .leftJoin(expertProfile, eq(expert.id, expertProfile.userId))
        .where(eq(expertOrganizations.organizationId, organizationProfileId));

      return {
        experts: experts.map(e => ({
          ...e,
          avatar: this.toFullUrl(e.avatar),
          id: e.id,
          status: e.status === 'LIVE' ? 'active' : 'hidden',
          joinedAt: e.createdAt,
          totalBookings: 0, 
          revenue: 0,      
          timings: (e.availability as any[] || []).map(a => ({
            day: a.dayOfWeek?.substring(0, 3) || 'Day',
            time: `${a.startTime} - ${a.endTime}`
          })),
          services: e.services || [], 
          experience: e.experience,
          consultationFee: e.consultationFee,
          languages: e.languages || [],
          education: e.education || [],
          workHistory: e.workHistory || [],
          tags: e.tags || [],
        })),
        total: experts.length,
        active: experts.filter(e => e.status === 'LIVE').length,
        inactive: experts.filter(e => e.status !== 'LIVE').length,
      };
    } catch (error) {
      const fs = require('fs');
      fs.writeFileSync('c:\\Users\\HP\\Desktop\\project1\\digitaloffice\\apps\\api\\error_log.txt', error.stack || error.message);
      throw error;
    }
  }

  async createExpert(userId: string, data: any) {
    const orgProfile = await this.databaseService.db
  .select()
  .from(organizationProfile)
  .where(eq(organizationProfile.userId, userId));

if (orgProfile.length === 0) {
  throw new BadRequestException('Organization profile not found');
}

const organizationProfileId = orgProfile[0].id;

    const { name, email, username, bio, specialization, experience, consultationFee, avatar, introVideo, education, workHistory, availability, languages, socialLinks, tags, services } = data;

    // 1. Check if user already exists
    const existing = await this.databaseService.db
      .select()
      .from(expert)
      .where(eq(expert.email, email));
    
    if (existing.length > 0) throw new ConflictException('An expert with this email already exists');
    
    // Check if username exists
    const existingUsername = await this.databaseService.db
      .select()
      .from(expert)
      .where(eq(expert.username, username || email.split('@')[0]));
    
    if (existingUsername.length > 0) throw new ConflictException('An expert with this username already exists');

    // 2. Create Expert Account
    const randomPass = randomBytes(16).toString('hex');
    const hashedPassword = await argon2.hash(randomPass);

    const [newExpert] = await this.databaseService.db
      .insert(expert)
      .values({
        name,
        email,
        username: username || email.split('@')[0],
        password: hashedPassword,
        isEmailVerified: true, // Organization added experts are pre-verified
      })
      .returning();

    // 3. Create Expert Profile
    await this.databaseService.db
      .insert(expertProfile)
      .values({
        userId: newExpert.id,
        bio,
        specialization,
        experience: Number(experience) || 0,
        consultationFee: consultationFee ? String(consultationFee) : "0",
        profileImage: avatar,
        introVideo,
        education: education || [],
        workHistory: workHistory || [],
        availability: availability || [],
        languages: languages || [],
        socialLinks: socialLinks || {},
        tags: tags || [],
        services: services || [],
        verificationStatus: 'LIVE', // Mark as live immediately when added by organization
        isVerified: true,
      });

    // 4. Link to Organization Profile
    await this.databaseService.db
      .insert(expertOrganizations)
      .values({
        expertId: newExpert.id,
        organizationId: organizationProfileId,
        status: 'APPROVED',
        joinedAt: new Date(),
      });

    return {
      message: 'Expert created and linked successfully',
      expertId: newExpert.id,
      temporaryPassword: randomPass, // In a real system, we'd email this
    };
  }

  async getExpertDetails(organizationId: string, expertId: string) {
    const org = await this.getProfile(organizationId);
    const organizationProfileId = org.id;

    const [details] = await this.databaseService.db
      .select({
        id: expert.id,
        name: expert.name,
        email: expert.email,
        phone: (expertProfile as any).phone || null,
        username: expert.username,
        bio: expertProfile.bio,
        specialization: expertProfile.specialization,
        experience: expertProfile.experience,
        consultationFee: expertProfile.consultationFee,
        avatar: expertProfile.profileImage,
        videoUrl: expertProfile.introVideo,
        status: expertProfile.verificationStatus,
        joinedAt: expert.createdAt,
        availability: expertProfile.availability,
        services: expertProfile.services,
        languages: expertProfile.languages,
        education: expertProfile.education,
        workHistory: expertProfile.workHistory,
        socialLinks: expertProfile.socialLinks,
        tags: expertProfile.tags,
        documents: expertProfile.documents,
        leaves: expertProfile.leaves,
        timezone: expertProfile.timezone,
        gender: expertProfile.gender,
        location: expertProfile.location,
      })
      .from(expert)
      .leftJoin(expertProfile, eq(expert.id, expertProfile.userId))
      .innerJoin(expertOrganizations, eq(expert.id, expertOrganizations.expertId))
      .where(and(
        eq(expert.id, expertId),
        eq(expertOrganizations.organizationId, organizationProfileId)
      ));

    if (!details) throw new BadRequestException('Expert not found or not linked to this organization');

    return {
      ...details,
      status: details.status === 'LIVE' ? 'active' : 'hidden',
      avatar: this.toFullUrl(details.avatar),
      videoUrl: this.toFullUrl(details.videoUrl),
      timings: (details.availability as any[] || []).map(a => ({
        day: a.dayOfWeek?.substring(0, 3) || 'Day',
        time: `${a.startTime} - ${a.endTime}`
      })),
      services: (details.services as any[] || []).map(s =>
        typeof s === 'string'
          ? { name: s, price: 0, duration: 60 }
          : {
              name: s.name || '',
              price: Number(s.price ?? s.videoPrice ?? s.clinicPrice ?? 0),
              duration: Number(s.duration) || 60,
            }
      ),
    };
  }

  async updateExpert(userId: string, expertId: string, data: any) {
    const org = await this.getProfile(userId);
    const organizationProfileId = org.id;

    // Verify linkage
    const link = await this.databaseService.db
      .select()
      .from(expertOrganizations)
      .where(and(
        eq(expertOrganizations.expertId, expertId),
        eq(expertOrganizations.organizationId, organizationProfileId)
      ));
    
    if (link.length === 0) throw new BadRequestException('Expert not linked to this organization');

    const { 
      name, username, email, phone, bio, specialization, 
      experience, consultationFee, languages, education, 
      workHistory, socialLinks, tags, services, availability,
      timezone, gender, location, leaves
    } = data;

    // Update Expert basic info
    await this.databaseService.db
      .update(expert)
      .set({
        name: name !== undefined ? name : undefined,
        username: username !== undefined ? username : undefined,
        email: email !== undefined ? email : undefined,
      })
      .where(eq(expert.id, expertId));

    // Update Expert Profile info
    await this.databaseService.db
      .update(expertProfile)
      .set({
        phone: phone !== undefined ? phone : undefined,
        bio: bio !== undefined ? bio : undefined,
        specialization: specialization !== undefined ? specialization : undefined,
        experience: experience !== undefined ? Number(experience) : undefined,
        consultationFee: consultationFee !== undefined ? String(consultationFee) : undefined,
        languages: languages !== undefined ? languages : undefined,
        education: education !== undefined ? education : undefined,
        workHistory: workHistory !== undefined ? workHistory : undefined,
        socialLinks: socialLinks !== undefined ? socialLinks : undefined,
        tags: tags !== undefined ? tags : undefined,
        services: services !== undefined ? services : undefined,
        availability: availability !== undefined ? availability : undefined,
        timezone: timezone !== undefined ? timezone : undefined,
        gender: gender !== undefined ? gender : undefined,
        location: location !== undefined ? location : undefined,
        leaves: leaves !== undefined ? leaves : undefined,
      })
      .where(eq(expertProfile.userId, expertId));

    return { message: 'Expert profile updated successfully' };
  }

  async updateExpertAvatar(userId: string, expertId: string, avatarUrl: string) {
    const org = await this.getProfile(userId);
    const organizationProfileId = org.id;

    // Verify linkage
    const link = await this.databaseService.db
      .select()
      .from(expertOrganizations)
      .where(and(
        eq(expertOrganizations.expertId, expertId),
        eq(expertOrganizations.organizationId, organizationProfileId)
      ));
    
    if (link.length === 0) throw new BadRequestException('Expert not linked to this organization');

    await this.databaseService.db
      .update(expertProfile)
      .set({ profileImage: avatarUrl })
      .where(eq(expertProfile.userId, expertId));

    await this.databaseService.db
      .update(expert)
      .set({ image: avatarUrl })
      .where(eq(expert.id, expertId));

    return { message: 'Expert avatar updated successfully', avatarUrl };
  }

  async updateExpertVideo(userId: string, expertId: string, videoUrl: string) {
    const org = await this.getProfile(userId);
    const organizationProfileId = org.id;

    // Verify linkage
    const link = await this.databaseService.db
      .select()
      .from(expertOrganizations)
      .where(and(
        eq(expertOrganizations.expertId, expertId),
        eq(expertOrganizations.organizationId, organizationProfileId)
      ));
    
    if (link.length === 0) throw new BadRequestException('Expert not linked to this organization');

    await this.databaseService.db
      .update(expertProfile)
      .set({ introVideo: videoUrl })
      .where(eq(expertProfile.userId, expertId));

    return { message: 'Expert video updated successfully', videoUrl };
  }

  async updateExpertTimings(userId: string, expertId: string, availability: any[]) {
    const org = await this.getProfile(userId);
    const organizationProfileId = org.id;

    // Verify linkage
    const link = await this.databaseService.db
      .select()
      .from(expertOrganizations)
      .where(and(
        eq(expertOrganizations.expertId, expertId),
        eq(expertOrganizations.organizationId, organizationProfileId)
      ));
    
    if (link.length === 0) throw new BadRequestException('Expert not linked to this organization');

    await this.databaseService.db
      .update(expertProfile)
      .set({ availability })
      .where(eq(expertProfile.userId, expertId));

    return { message: 'Expert timings updated successfully' };
  }

  async updateExpertStatus(userId: string, expertId: string, status: string) {
    const org = await this.getProfile(userId);
    const organizationProfileId = org.id;

    // Verify linkage
    const link = await this.databaseService.db
      .select()
      .from(expertOrganizations)
      .where(and(
        eq(expertOrganizations.expertId, expertId),
        eq(expertOrganizations.organizationId, organizationProfileId)
      ));
    
    if (link.length === 0) throw new BadRequestException('Expert not linked to this organization');

    const dbStatus = status === 'active' ? 'LIVE' : 'ONBOARDING';

    await this.databaseService.db
      .update(expertProfile)
      .set({ verificationStatus: dbStatus })
      .where(eq(expertProfile.userId, expertId));

    return { message: `Expert status updated to ${status}` };
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
    const services = await this.databaseService.listOrganizationServices(organizationId);
    const org = await this.databaseService.ensureOrganizationProfile(organizationId);
    return {
      services,
      defaultLayout: org?.defaultLayout || { horizontal: [], vertical: [] },
      total: services.length,
      active: services.filter((s: any) => s.isActive).length,
    };
  }

  async createService(organizationId: string, serviceData: any) {
    if (!serviceData?.name) throw new BadRequestException('Service name is required');
    if (serviceData?.basePrice === undefined || serviceData?.basePrice === null) throw new BadRequestException('Service basePrice is required');
    const created = await this.databaseService.createOrganizationService(organizationId, serviceData);
    if (!created) throw new BadRequestException('Unable to create service');
    return { message: 'Service created successfully', service: created };
  }

  async updateService(organizationId: string, serviceId: string, serviceData: any) {
    const updated = await this.databaseService.updateOrganizationService(organizationId, serviceId, serviceData || {});
    if (!updated) throw new BadRequestException('Service not found');
    return { message: 'Service updated successfully', service: updated };
  }

  async deleteService(organizationId: string, serviceId: string) {
    const ok = await this.databaseService.deleteOrganizationService(organizationId, serviceId);
    if (!ok) throw new BadRequestException('Service not found');
    return { message: 'Service deleted successfully', serviceId };
  }

  async getServiceCategories(organizationId: string) {
    const categories = await this.databaseService.listOrganizationServiceCategories(organizationId);
    return { categories };
  }

  async createServiceCategory(organizationId: string, name: string) {
    if (!name) throw new BadRequestException('Category name is required');
    const category = await this.databaseService.createOrganizationServiceCategory(organizationId, name);
    if (!category) throw new BadRequestException('Failed to create category');
    return { message: 'Category created successfully', category };
  }

  async deleteServiceCategory(organizationId: string, categoryId: string) {
    const ok = await this.databaseService.deleteOrganizationServiceCategory(organizationId, categoryId);
    if (!ok) throw new BadRequestException('Category not found');
    return { message: 'Category deleted successfully', categoryId };
  }

  async updateServiceCategoryLayout(organizationId: string, categoryId: string, layout: any) {
    if (categoryId === 'default') {
      const updatedProfile = await this.databaseService.updateOrganizationDefaultLayout(organizationId, layout);
      if (!updatedProfile) throw new BadRequestException('Organization profile not found');
      return { message: 'Default layout updated successfully', defaultLayout: updatedProfile.defaultLayout };
    }
    const updated = await this.databaseService.updateOrganizationServiceCategoryLayout(organizationId, categoryId, layout);
    if (!updated) throw new BadRequestException('Category not found');
    return { message: 'Layout updated successfully', category: updated };
  }

  async getOrganizationBanners(organizationId: string) {
    const banners = await this.databaseService.getOrganizationBanners(organizationId);
    if (!banners) throw new BadRequestException('Organization profile not found');
    return { banners };
  }

  async updateOrganizationBanners(organizationId: string, bannersData: any) {
    const updated = await this.databaseService.updateOrganizationBanners(organizationId, bannersData);
    if (!updated) throw new BadRequestException('Organization profile not found');
    return { message: 'Banners updated successfully', banners: updated.banners };
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
    const [booking] = await this.databaseService.findBookingById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    return booking;
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

  async createVoiceCallBooking(organizationId: string, bookingData: any) {
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerNotes,
      services,
      expertId,
      scheduledDate,
      scheduledTime,
      totalAmount,
      paymentLink,
      orderId,
    } = bookingData;

    if (!customerName || !customerPhone) {
      throw new BadRequestException('Customer name and phone are required');
    }
    if (!services || services.length === 0) {
      throw new BadRequestException('At least one service is required');
    }

    // Get org profile to associate booking
    const org = await this.getProfile(organizationId);

    // Create a client record for the customer if they don't exist
    // For voice call orders, we'll use a placeholder client ID or create one
    // For now, we'll use the organization ID as a reference since this is an organization-initiated booking
    const clientId = organizationId; // This represents the organization creating the booking on behalf of customer

    // Calculate total duration from services
    const totalDuration = services.reduce((sum: number, s: any) => sum + (s.duration || 60), 0);

    // Parse scheduled date and time to create a proper Date object
    let scheduledDateTime: Date | null = null;
    if (scheduledDate && scheduledTime) {
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const [period] = scheduledTime.split(' ');
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;

      const dateObj = new Date(scheduledDate);
      dateObj.setHours(hour24, minutes, 0, 0);
      scheduledDateTime = dateObj;
    }

    // Create booking in database
    const booking = await this.databaseService.createBooking({
      clientId: clientId,
      expertId: expertId || null,
      organizationId: org.id,
      service: services.map((s: any) => s.name).join(', '),
      consultationType: 'offline', // Voice call orders are typically offline/in-person
      scheduledDate: scheduledDateTime || new Date(),
      duration: totalDuration,
      amount: String(totalAmount),
    });

    return {
      message: 'Voice call order created successfully',
      booking: {
        id: booking.id,
        organizationId: org.id,
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail || null,
          notes: customerNotes || null,
        },
        services: services.map((s: any) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          quantity: s.quantity || 1,
          total: s.price * (s.quantity || 1),
        })),
        expertId: expertId || null,
        scheduledDate: scheduledDate || null,
        scheduledTime: scheduledTime || null,
        totalAmount: totalAmount || 0,
        paymentLink: paymentLink || null,
        status: booking.status,
        createdAt: booking.createdAt,
      },
    };
  }

  async sendPaymentLink(organizationId: string, emailData: any) {
    const { customerEmail, customerName, paymentLink, totalAmount } = emailData;

    if (!customerEmail || !customerName || !paymentLink) {
      throw new BadRequestException('Email, customer name and payment link are required');
    }

    const org = await this.getProfile(organizationId);

    try {
      await this.mailService.sendPaymentLinkEmail(
        customerEmail,
        customerName,
        paymentLink,
        totalAmount || 0,
        org.name,
      );
      return { message: 'Payment link sent via email successfully' };
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Failed to send payment email. Please try again.');
    }
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

  // Chat APIs
  async getConversations(userId: string) {
    const orgProfile = await this.getProfile(userId);
    const conversations = await this.databaseService.findConversationsByOrganizationId(orgProfile.id);
    return { conversations };
  }

  async getMessages(userId: string, conversationId: string, page: number = 1, limit: number = 50) {
    // In a real system, you'd verify the conversation belongs to the organization here
    return await this.databaseService.findMessagesByConversationId(conversationId, page, limit);
  }

  // Refund request related methods
  async createRefundRequest(organizationId: string, data: {
    bookingId: string;
    amount: string;
    reason: string;
    refundType: string;
    paymentMethod?: string;
    metadata?: any;
  }) {
    // Fetch the booking to get the clientId and organizationId
    const booking = await this.databaseService.findBookingById(data.bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    return this.databaseService.createRefundRequest({
      bookingId: data.bookingId,
      clientId: booking.clientId,
      organizationId: booking.organizationId, // Use the booking's organizationId
      amount: data.amount,
      reason: data.reason,
      refundType: data.refundType,
      paymentMethod: data.paymentMethod,
      metadata: data.metadata,
    });
  }

  async getOrganizationRefundRequests(organizationId: string, status?: string) {
    return this.databaseService.getRefundRequests(organizationId, status);
  }

  async updateRefundStatus(refundId: string, status: string, rejectionReason?: string) {
    return this.databaseService.updateRefundStatus(refundId, status, rejectionReason);
  }

  // Edit service request related methods
  async createEditServiceRequest(organizationId: string, data: {
    bookingId: string;
    clientId?: string;
    originalService: string;
    originalAmount: string;
    newService: string;
    newAmount: string;
    reason: string;
    metadata?: any;
  }) {
    const booking = await this.databaseService.findBookingById(data.bookingId);
    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    const resolvedOrgId = booking.organizationId || organizationId;
    const resolvedClientId = booking.clientId || data.clientId;

    if (!resolvedClientId) {
      throw new BadRequestException('Client ID is required');
    }

    return this.databaseService.createEditServiceRequest({
      bookingId: data.bookingId,
      clientId: resolvedClientId,
      organizationId: resolvedOrgId,
      originalService: data.originalService,
      originalAmount: data.originalAmount,
      newService: data.newService,
      newAmount: data.newAmount,
      reason: data.reason,
      metadata: data.metadata,
    });
  }

  async getOrganizationEditServiceRequests(organizationId: string, status?: string) {
    return this.databaseService.getEditServiceRequests(organizationId, status);
  }

  async updateEditServiceStatus(requestId: string, status: string, rejectionReason?: string) {
    return this.databaseService.updateEditServiceStatus(requestId, status, rejectionReason);
  }
}
