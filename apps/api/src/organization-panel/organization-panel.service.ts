import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { expert, expertProfile, expertOrganizations, organisation, organizationProfile, bookings } from '@repo/database';
import { eq, and, desc, sql } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

import { MailService } from '@repo/mail';
import { sendInvoiceEmailHelper } from '../common/utils/invoice-email.util';

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
      showCategories: profileData.showCategories !== undefined ? profileData.showCategories : (existingProfile as any).showCategories,
      invoiceCustomization: profileData.invoiceCustomization !== undefined ? profileData.invoiceCustomization : (existingProfile as any).invoiceCustomization,
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

  async uploadInvoiceLogo(organizationId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/organization-logos/${file.filename}`;
    
    return {
      message: 'Invoice logo uploaded successfully',
      logoUrl: fileUrl,
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
          associationStatus: expertOrganizations.status,
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
          associationStatus: e.associationStatus,
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

    // Validate availability against organization operating hours
    this.validateExpertAvailability(orgProfile[0].operatingHours, availability);

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

    // Validate availability against organization operating hours
    this.validateExpertAvailability(org.operatingHours, availability);

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

    if (status === 'active') {
      await this.databaseService.db
        .update(expertOrganizations)
        .set({ status: 'APPROVED', joinedAt: new Date() })
        .where(and(
          eq(expertOrganizations.expertId, expertId),
          eq(expertOrganizations.organizationId, organizationProfileId)
        ));
    }

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
      defaultLayout: this.normalizeLayout(org?.defaultLayout),
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

  async createServiceCategory(organizationId: string, name: string, imageUrl?: string | null, price?: string | null) {
    if (!name) throw new BadRequestException('Category name is required');
    const category = await this.databaseService.createOrganizationServiceCategory(organizationId, name, imageUrl, price);
    if (!category) throw new BadRequestException('Failed to create category');
    return { message: 'Category created successfully', category };
  }

  async updateServiceCategory(organizationId: string, categoryId: string, data: { name?: string; imageUrl?: string | null; price?: string | null }) {
    const category = await this.databaseService.updateOrganizationServiceCategory(organizationId, categoryId, data);
    if (!category) throw new BadRequestException('Category not found');
    return { message: 'Category updated successfully', category };
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
      return { message: 'Default layout updated successfully', defaultLayout: this.normalizeLayout(updatedProfile.defaultLayout) };
    }
    const updated = await this.databaseService.updateOrganizationServiceCategoryLayout(organizationId, categoryId, layout);
    if (!updated) throw new BadRequestException('Category not found');
    return {
      message: 'Layout updated successfully',
      category: {
        ...updated,
        layout: this.normalizeLayout(updated.layout),
      },
    };
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
    const dbBookings = await this.databaseService.findOrganizationBookings(organizationId, status);
    
    // Deduplicate database rows resulting from left joins
    const seenIds = new Set<string>();
    const uniqueDbBookings = [];
    for (const b of dbBookings) {
      if (b.booking && b.booking.id && !seenIds.has(b.booking.id)) {
        seenIds.add(b.booking.id);
        uniqueDbBookings.push(b);
      }
    }
    
    const mapped = uniqueDbBookings.map((b: any) => {
      const scheduledDateTime = new Date(b.booking.scheduledDate);
      
      let clientName = b.client?.name || 'Unknown User';
      let clientPhone = b.client?.phone || null;

      if (b.booking.notes) {
        try {
          const parsedNotes = JSON.parse(b.booking.notes);
          if (parsedNotes && parsedNotes.isVoiceCallBooking) {
            if (parsedNotes.customerName) clientName = parsedNotes.customerName;
            if (parsedNotes.customerPhone) clientPhone = parsedNotes.customerPhone;
          }
        } catch (e) {
          // ignore
        }
      }
      
      return {
        id: b.booking.id,
        clientId: b.booking.clientId,
        clientName,
        clientPhone,
        userAvatar: b.client?.image || null,
        expertId: b.booking.expertId,
        expertName: b.expert?.name || 'Unassigned',
        expertAvatar: b.expertProfile?.profileImage || null,
        expertSpecialty: b.expertProfile?.specialization || b.expertProfile?.category || 'Therapy',
        service: b.booking.service,
        scheduledDate: scheduledDateTime,
        duration: b.booking.duration,
        amount: b.booking.amount,
        status: b.booking.status,
        paymentStatus: b.booking.paymentStatus,
        type: b.booking.consultationType || 'online',
        notes: b.booking.notes,
        cancellationReason: b.booking.cancellationReason,
        rejectionReason: b.booking.rejectionReason,
      };
    });

    let finalBookings = mapped;
    if (status && status.toLowerCase() === 'ongoing') {
      const now = new Date();
      finalBookings = mapped.filter((b: any) => {
        const dateObj = new Date(b.scheduledDate);
        const startTime = dateObj.getTime();
        const endTime = startTime + (b.duration || 60) * 60 * 1000;
        const curTime = now.getTime();
        
        return b.status.toLowerCase() === 'confirmed' && curTime >= startTime - 15 * 60 * 1000 && curTime <= endTime + 15 * 60 * 1000;
      });
    }

    return {
      bookings: finalBookings,
      total: finalBookings.length,
      status: status || 'all',
    };
  }

  async getBookingDetails(organizationId: string, bookingId: string) {
    const details = await this.databaseService.findBookingDetailsById(bookingId);
    if (!details || !details.booking) {
      throw new NotFoundException('Booking not found');
    }
    const org = await this.getProfile(organizationId);
    if (details.booking.organizationId !== organizationId && details.booking.organizationId !== org.id) {
      throw new BadRequestException('You do not have permission to view this booking');
    }
    
    let clientName = details.client?.name || 'Unknown User';
    let clientPhone = details.client?.phone || null;
    let clientEmail = details.client?.email || null;

    if (details.booking.notes) {
      try {
        const parsedNotes = JSON.parse(details.booking.notes);
        if (parsedNotes && parsedNotes.isVoiceCallBooking) {
          if (parsedNotes.customerName) clientName = parsedNotes.customerName;
          if (parsedNotes.customerPhone) clientPhone = parsedNotes.customerPhone;
          if (parsedNotes.customerEmail) clientEmail = parsedNotes.customerEmail;
        }
      } catch (e) {
        // ignore
      }
    }
    
    return {
      id: details.booking.id,
      clientId: details.booking.clientId,
      clientName,
      clientPhone,
      clientEmail,
      userAvatar: details.client?.image || null,
      expertId: details.booking.expertId,
      expertName: details.expert?.name || 'Unassigned',
      expertAvatar: details.expertProfile?.profileImage || null,
      service: details.booking.service,
      scheduledDate: details.booking.scheduledDate,
      duration: details.booking.duration,
      amount: details.booking.amount,
      status: details.booking.status,
      paymentStatus: details.booking.paymentStatus,
      type: details.booking.consultationType || 'online',
      notes: details.booking.notes,
      cancellationReason: details.booking.cancellationReason,
      rejectionReason: details.booking.rejectionReason,
      createdAt: details.booking.createdAt,
    };
  }

  async cancelBooking(organizationId: string, bookingId: string) {
    const booking = await this.databaseService.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const org = await this.getProfile(organizationId);
    if (booking.organizationId !== organizationId && booking.organizationId !== org.id) {
      throw new BadRequestException('You do not have permission to cancel this booking');
    }
    
    await this.databaseService.updateBookingStatus(bookingId, 'cancelled', {
      cancelledAt: new Date(),
      cancellationReason: 'Cancelled by organization admin'
    });
    
    return {
      message: 'Booking cancelled successfully',
      bookingId,
      organizationId,
      cancelledAt: new Date(),
      status: 'cancelled',
    };
  }

  async reassignBooking(organizationId: string, bookingId: string, reassignData: any) {
    const booking = await this.databaseService.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const org = await this.getProfile(organizationId);
    if (booking.organizationId !== organizationId && booking.organizationId !== org.id) {
      throw new BadRequestException('You do not have permission to reassign this booking');
    }
    
    const expertId = reassignData.expertId;
    const expertInfo = await this.databaseService.findExpertById(expertId);
    if (!expertInfo) {
      throw new BadRequestException('Expert not found');
    }
    
    await this.databaseService.db
      .update(bookings)
      .set({
        expertId: expertId,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));
      
    return {
      message: 'Booking reassigned successfully',
      bookingId,
      organizationId,
      newExpertId: expertId,
      newExpertName: expertInfo.name,
      reassignedAt: new Date(),
    };
  }

  async acceptBooking(organizationId: string, bookingId: string) {
    const booking = await this.databaseService.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const org = await this.getProfile(organizationId);
    if (booking.organizationId !== organizationId && booking.organizationId !== org.id) {
      throw new BadRequestException('You do not have permission to accept this booking');
    }
    if (booking.status !== 'pending') {
      throw new BadRequestException('Booking is not in pending status');
    }
    
    await this.databaseService.updateBookingStatus(bookingId, 'confirmed', { acceptedAt: new Date() });
    
    return {
      message: 'Booking accepted successfully',
      bookingId,
      status: 'confirmed',
      acceptedAt: new Date(),
    };
  }

  async rejectBooking(organizationId: string, bookingId: string, reason?: string) {
    const booking = await this.databaseService.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const org = await this.getProfile(organizationId);
    if (booking.organizationId !== organizationId && booking.organizationId !== org.id) {
      throw new BadRequestException('You do not have permission to reject this booking');
    }
    if (booking.status !== 'pending') {
      throw new BadRequestException('Booking is not in pending status');
    }
    
    await this.databaseService.updateBookingStatus(bookingId, 'rejected', { 
      rejectedAt: new Date(),
      rejectionReason: reason || 'Rejected by organization'
    });
    
    return {
      message: 'Booking rejected successfully',
      bookingId,
      status: 'rejected',
      rejectedAt: new Date(),
    };
  }

  async rescheduleBooking(organizationId: string, bookingId: string, data: { scheduledDate: string; expertId?: string }) {
    const booking = await this.databaseService.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const org = await this.getProfile(organizationId);
    if (booking.organizationId !== organizationId && booking.organizationId !== org.id) {
      throw new BadRequestException('You do not have permission to reschedule this booking');
    }
    
    const updateFields: any = {
      scheduledDate: new Date(data.scheduledDate),
      updatedAt: new Date(),
    };
    if (data.expertId) {
      updateFields.expertId = data.expertId;
    }
    
    await this.databaseService.db
      .update(bookings)
      .set(updateFields)
      .where(eq(bookings.id, bookingId));
      
    return {
      message: 'Booking rescheduled successfully',
      bookingId,
      scheduledDate: data.scheduledDate,
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

    // Parse scheduled date and time to create a proper Date object safely
    let scheduledDateTime: Date | null = null;
    if (scheduledDate && scheduledTime) {
      try {
        const [timePart, period] = scheduledTime.split(' ');
        const [hoursStr, minutesStr] = timePart.split(':');
        const hours = Number(hoursStr);
        const minutes = Number(minutesStr);

        let hour24 = hours;
        if (period === 'PM' && hours !== 12) hour24 += 12;
        if (period === 'AM' && hours === 12) hour24 = 0;

        const dateObj = new Date(scheduledDate);
        dateObj.setHours(hour24, minutes, 0, 0);
        if (!isNaN(dateObj.getTime())) {
          scheduledDateTime = dateObj;
        }
      } catch (e) {
        console.error('Failed to parse scheduled date time:', e);
      }
    }

    if (!scheduledDateTime || isNaN(scheduledDateTime.getTime())) {
      scheduledDateTime = new Date();
    }

    // Assign fallback expert if none chosen (since database expert_id is NOT NULL constraint)
    let finalExpertId = expertId;
    if (!finalExpertId) {
      const experts = await this.databaseService.findOrganizationExperts(org.id);
      if (experts && experts.length > 0) {
        finalExpertId = experts[0].expert.id;
      } else {
        throw new BadRequestException('At least one expert must be registered under this organization to create a booking');
      }
    }

    // Format customer details and services as a JSON string with isVoiceCallBooking = true
    const notesJson = JSON.stringify({
      isVoiceCallBooking: true,
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      customerNotes: customerNotes || null,
      services: services.map((s: any) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        quantity: s.quantity || 1,
      })),
    });

    // Create booking in database
    const booking = await this.databaseService.createBooking({
      clientId: clientId,
      expertId: finalExpertId,
      organizationId: organizationId,
      service: services.map((s: any) => s.name).join(', '),
      consultationType: 'offline', // Voice call orders are typically offline/in-person
      scheduledDate: scheduledDateTime || new Date(),
      duration: totalDuration,
      amount: String(totalAmount),
      status: 'pending',
      paymentStatus: 'pending',
      notes: notesJson,
    });

    const clientUrl = this.configService.get('CLIENT_FRONTEND_URL') || 'http://localhost:3002';
    const generatedPaymentLink = `${clientUrl.replace(/\/$/, '')}/invoice/${booking.id}`;

    return {
      message: 'Voice call order created successfully',
      booking: {
        id: booking.id,
        organizationId: organizationId,
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
        expertId: finalExpertId,
        scheduledDate: scheduledDate || null,
        scheduledTime: scheduledTime || null,
        totalAmount: totalAmount || 0,
        paymentLink: generatedPaymentLink,
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

    // Try to extract services from booking notes
    let servicesList: string[] = [];
    try {
      const url = new URL(paymentLink);
      let bookingId = url.searchParams.get('bookingId');
      if (!bookingId) {
        const pathParts = url.pathname.split('/');
        bookingId = pathParts[pathParts.length - 1];
      }
      if (bookingId) {
        const details = await this.databaseService.findBookingById(bookingId);
        if (details && details.notes) {
          const parsed = JSON.parse(details.notes);
          if (parsed && parsed.services && Array.isArray(parsed.services)) {
            servicesList = parsed.services.map((s: any) => `${s.name} (x${s.quantity || 1})`);
          }
        }
      }
    } catch (e) {
      // Ignore URL parsing or DB errors
    }

    try {
      await this.mailService.sendPaymentLinkEmail(
        customerEmail,
        customerName,
        paymentLink,
        totalAmount || 0,
        org.name,
        servicesList,
      );
      return { message: 'Payment link sent via email successfully' };
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Failed to send payment email. Please try again.');
    }
  }

  // Analytics & Revenue APIs
  async getDashboard(organizationId: string, startDateStr?: string, endDateStr?: string) {
    const org = await this.getProfile(organizationId);
    const orgProfileId = org.id;
    
    // Experts count
    const allExperts = await this.databaseService.db
      .select({ count: sql<number>`count(*)` })
      .from(expertOrganizations)
      .where(eq(expertOrganizations.organizationId, orgProfileId));
    const totalExpertsCount = Number(allExperts[0]?.count || 0);
    
    // Active experts count
    const liveExperts = await this.databaseService.db
      .select({ count: sql<number>`count(*)` })
      .from(expertOrganizations)
      .innerJoin(expertProfile, eq(expertOrganizations.expertId, expertProfile.userId))
      .where(and(eq(expertOrganizations.organizationId, orgProfileId), eq(expertProfile.verificationStatus, 'LIVE')));
    const activeExpertsCount = Number(liveExperts[0]?.count || 0);
    
    // Pending join requests
    const pendingJoin = await this.databaseService.db
      .select({ count: sql<number>`count(*)` })
      .from(expertOrganizations)
      .where(and(eq(expertOrganizations.organizationId, orgProfileId), eq(expertOrganizations.status, 'PENDING')));
    const pendingJoinRequestsCount = Number(pendingJoin[0]?.count || 0);
    
    // Bookings stats for this organizationId
    const rawBookings = await this.databaseService.findOrganizationBookings(organizationId);
    
    const seenIds = new Set<string>();
    const allBookings = [];
    for (const b of rawBookings) {
      if (b.booking && b.booking.id && !seenIds.has(b.booking.id)) {
        seenIds.add(b.booking.id);
        allBookings.push(b);
      }
    }

    // Filter by date range if provided
    let statsBookings = allBookings;
    if (startDateStr || endDateStr) {
      const start = startDateStr ? new Date(startDateStr) : null;
      const end = endDateStr ? new Date(endDateStr) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      statsBookings = allBookings.filter((b: any) => {
        const bDate = new Date(b.booking.scheduledDate);
        if (start && bDate < start) return false;
        if (end && bDate > end) return false;
        return true;
      });
    }
    
    const totalBookingsCount = statsBookings.length;
    const pendingBookingsCount = statsBookings.filter((b: any) => b.booking.status === 'pending').length;
    const confirmedBookingsCount = statsBookings.filter((b: any) => b.booking.status === 'confirmed').length;
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    const todayBookingsCount = statsBookings.filter((b: any) => {
      const date = new Date(b.booking.scheduledDate);
      return date >= startOfToday && date < endOfToday;
    }).length;
    
    // Revenue in the selected range (or current month if no range)
    const rangeRevenueSum = statsBookings
      .filter((b: any) => {
        if (startDateStr || endDateStr) {
          return b.booking.status === 'confirmed' || b.booking.status === 'completed';
        } else {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const date = new Date(b.booking.scheduledDate);
          return date >= startOfMonth && (b.booking.status === 'confirmed' || b.booking.status === 'completed');
        }
      })
      .reduce((sum: number, b: any) => sum + Number(b.booking.amount || 0), 0);
      
    // Disputes count
    const disputesCount = statsBookings.filter((b: any) => b.booking.status === 'disputed').length;
    
    // Recent bookings/activity
    const recentActivity = statsBookings.slice(0, 5).map((b: any) => {
      return {
        type: 'booking',
        message: `${b.client?.name || 'A customer'} booked a session with ${b.expert?.name || 'an expert'}`,
        timestamp: b.booking.createdAt,
      };
    });
    
    return {
      totalExperts: totalExpertsCount,
      activeExperts: activeExpertsCount,
      pendingJoinRequests: pendingJoinRequestsCount,
      totalBookings: totalBookingsCount,
      pendingSessions: pendingBookingsCount,
      confirmedBookings: confirmedBookingsCount,
      todayBookings: todayBookingsCount,
      monthlyRevenue: rangeRevenueSum,
      disputes: disputesCount,
      unreadNotifications: 0,
      recentActivity,
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
    const updated = await this.databaseService.updateRefundStatus(refundId, status, rejectionReason);
    if (status === 'approved' && updated) {
      sendInvoiceEmailHelper(this.databaseService, this.mailService, updated.bookingId, 'refund').catch(err => {
        console.error('Failed to send refund credit note email:', err);
      });
    }
    return updated;
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
    const updated = await this.databaseService.updateEditServiceStatus(requestId, status, rejectionReason);
    if (status === 'approved' && updated) {
      sendInvoiceEmailHelper(this.databaseService, this.mailService, updated.bookingId, 'edit_service').catch(err => {
        console.error('Failed to send updated service invoice email:', err);
      });
    }
    return updated;
  }

  private timeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }

  private validateExpertAvailability(operatingHours: any[] | null, availability: any[]) {
    if (!operatingHours || !Array.isArray(operatingHours)) {
      throw new BadRequestException('Organization operating hours are not configured.');
    }

    if (!availability || !Array.isArray(availability)) {
      return;
    }

    for (const slot of availability) {
      const dayName = slot.dayOfWeek;
      const start = slot.startTime;
      const end = slot.endTime;

      if (!dayName || !start || !end) {
        throw new BadRequestException('Availability dayOfWeek, startTime, and endTime are required.');
      }

      const dayHours = operatingHours.find(
        (h) => h && h.day && h.day.toLowerCase() === dayName.toLowerCase()
      );

      if (!dayHours) {
        throw new BadRequestException(`Organization does not have operating hours defined for ${dayName}.`);
      }

      if (dayHours.is_closed) {
        throw new BadRequestException(`Organization is closed on ${dayName}. Expert cannot set availability on this day.`);
      }

      const startMin = this.timeToMinutes(start);
      const endMin = this.timeToMinutes(end);
      const openMin = this.timeToMinutes(dayHours.open);
      const closeMin = this.timeToMinutes(dayHours.close);

      if (startMin < openMin) {
        throw new BadRequestException(
          `Expert start time ${start} on ${dayName} cannot be earlier than organization open time ${dayHours.open}.`
        );
      }

      if (endMin > closeMin) {
        throw new BadRequestException(
          `Expert end time ${end} on ${dayName} cannot be later than organization close time ${dayHours.close}.`
        );
      }

      if (startMin >= endMin) {
        throw new BadRequestException(
          `Expert start time ${start} must be earlier than end time ${end} on ${dayName}.`
        );
      }
    }
  }

  private normalizeLayout(rawLayout: any) {
    const defaultSections = {
      horizontal1: { type: 'services', title: 'Our Services', services: [] },
      horizontal2: { type: 'staff', title: 'Our Staffs', services: [] },
      vertical1: { type: 'services', title: 'Menu', services: [] },
      vertical2: { type: 'products', title: 'Products', services: [] },
    };

    if (!rawLayout || typeof rawLayout !== 'object') {
      return defaultSections;
    }

    const getSection = (key: string, fallbackType: string, fallbackTitle: string) => {
      const rawSec = rawLayout[key];
      if (rawSec && typeof rawSec === 'object') {
        return {
          type: rawSec.type || fallbackType,
          title: rawSec.title || fallbackTitle,
          services: Array.isArray(rawSec.services) ? rawSec.services : [],
        };
      }
      return { type: fallbackType, title: fallbackTitle, services: [] };
    };

    const hasOldKeys = ('horizontal' in rawLayout && Array.isArray(rawLayout.horizontal)) ||
                        ('vertical' in rawLayout && Array.isArray(rawLayout.vertical)) ||
                        ('vertical2' in rawLayout && Array.isArray(rawLayout.vertical2));

    const hasNewKeys = 'horizontal1' in rawLayout || 'horizontal2' in rawLayout || 'vertical1' in rawLayout || 'vertical2' in rawLayout;

    if (hasOldKeys && !hasNewKeys) {
      return {
        horizontal1: {
          type: 'services',
          title: 'Our Services',
          services: Array.isArray(rawLayout.horizontal) ? rawLayout.horizontal : [],
        },
        horizontal2: {
          type: 'staff',
          title: 'Our Staffs',
          services: [],
        },
        vertical1: {
          type: 'services',
          title: 'Menu',
          services: Array.isArray(rawLayout.vertical) ? rawLayout.vertical : [],
        },
        vertical2: {
          type: 'products',
          title: rawLayout.vertical2Name || 'Products',
          services: Array.isArray(rawLayout.vertical2) ? rawLayout.vertical2 : [],
        },
      };
    }

    return {
      horizontal1: getSection('horizontal1', 'services', 'Our Services'),
      horizontal2: getSection('horizontal2', 'staff', 'Our Staffs'),
      vertical1: getSection('vertical1', 'services', 'Menu'),
      vertical2: getSection('vertical2', 'products', 'Products'),
    };
  }

  async getActionCentreRequests(organizationId: string) {
    // 1. Get refund requests
    const refundData = await this.databaseService.getRefundRequests(organizationId);

    // 2. Get edit service requests
    const editData = await this.databaseService.getEditServiceRequests(organizationId);

    // 3. Get disputed bookings
    const disputedBookings = await this.databaseService.findOrganizationBookings(organizationId, 'disputed');

    // Consolidated list of requests
    const consolidatedRequests = [];

    // Add refund requests
    for (const item of refundData) {
      consolidatedRequests.push({
        id: item.refund.id,
        type: 'refund',
        customerName: item.client?.name || 'Unknown',
        customerEmail: item.client?.email || 'Unknown',
        serviceName: item.booking?.service || 'Unknown Service',
        amount: Number(item.refund.amount) || 0,
        reason: item.refund.reason,
        requestedOn: item.refund.requestedAt,
        status: item.refund.status, // pending, approved, rejected, processing
        bookingId: item.booking?.id,
      });
    }

    // Add edit service requests
    for (const item of editData) {
      consolidatedRequests.push({
        id: item.editRequest.id,
        type: 'reschedule',
        customerName: item.client?.name || 'Unknown',
        customerEmail: item.client?.email || 'Unknown',
        serviceName: item.booking?.service || 'Unknown Service',
        amount: Number(item.editRequest.newAmount) || 0,
        reason: item.editRequest.reason,
        requestedOn: item.editRequest.requestedAt,
        status: item.editRequest.status, // pending, approved, rejected
        bookingId: item.booking?.id,
      });
    }

    // Add disputed bookings (as disputes)
    for (const item of disputedBookings) {
      consolidatedRequests.push({
        id: item.booking.id, // using booking ID as identifier
        type: 'dispute',
        customerName: item.client?.name || 'Unknown',
        customerEmail: item.client?.email || 'Unknown',
        serviceName: item.booking.service || 'Unknown Service',
        amount: Number(item.booking.amount) || 0,
        reason: item.booking.notes || 'Disputed session',
        requestedOn: item.booking.createdAt,
        status: 'under review', // for disputes
        bookingId: item.booking.id,
      });
    }

    // Sort by requestedOn desc
    consolidatedRequests.sort((a, b) => new Date(b.requestedOn).getTime() - new Date(a.requestedOn).getTime());

    // Generate counts
    const totalRequests = consolidatedRequests.length;
    const pendingRequests = consolidatedRequests.filter(r => r.status === 'pending' || r.status === 'pending review').length;
    const rescheduleRequests = consolidatedRequests.filter(r => r.type === 'reschedule').length;
    const refundRequestsCount = consolidatedRequests.filter(r => r.type === 'refund').length;
    const disputesCount = consolidatedRequests.filter(r => r.type === 'dispute').length;
    const overdueCount = consolidatedRequests.filter(r => r.status === 'overdue').length;

    return {
      requests: consolidatedRequests,
      metrics: {
        totalRequests,
        pendingRequests,
        rescheduleRequests,
        refundRequests: refundRequestsCount,
        disputes: disputesCount,
        overdue: overdueCount,
      }
    };
  }

  async getRequestDetails(organizationId: string, requestId: string, requestType: string) {
    if (requestType === 'refund') {
      const allRefunds = await this.databaseService.getRefundRequests(organizationId);
      const refundItem = allRefunds.find((r: any) => r.refund.id === requestId);
      if (!refundItem) throw new BadRequestException('Request not found');

      // Fetch request timeline/logs
      const timelineLogs = await this.databaseService.getRequestLogsByRequestId(requestId);

      return {
        id: refundItem.refund.id,
        type: 'refund',
        status: refundItem.refund.status,
        serviceNature: {
          serviceName: refundItem.booking?.service || 'Health Consultation',
          category: 'Healthcare',
          serviceType: 'One-on-One',
          duration: refundItem.booking?.duration || 60,
          provider: refundItem.expert?.name || 'Dr. Michael Chen',
          location: refundItem.booking?.consultationType === 'online' ? 'Online (Video Call)' : 'Offline',
        },
        requestDetails: {
          reason: refundItem.refund.reason,
          description: refundItem.refund.reason,
          amountRequested: Number(refundItem.refund.amount) || 0,
          attachments: refundItem.refund.metadata?.files || [],
        },
        paymentDetails: {
          paymentMethod: refundItem.refund.paymentMethod || 'Visa •••• 4242',
          paidOn: refundItem.booking?.acceptedAt || refundItem.booking?.createdAt,
          amountPaid: Number(refundItem.booking?.amount) || 0,
          refundableAmount: Number(refundItem.refund.amount) || 0,
          transactionId: refundItem.booking?.meetingId || 'TXN-8844-7721-9988',
        },
        customerInfo: {
          name: refundItem.client?.name || 'Sarah Johnson',
          email: refundItem.client?.email || 'sarah.j@email.com',
          phone: refundItem.client?.email ? '+1 (555) 123-4567' : '',
          bookingId: refundItem.booking?.id,
          bookingDate: refundItem.booking?.scheduledDate,
          bookingTime: refundItem.booking?.scheduledDate ? new Date(refundItem.booking.scheduledDate).toLocaleTimeString() : '',
          status: refundItem.booking?.status,
        },
        timeline: timelineLogs,
      };
    } else if (requestType === 'reschedule') {
      const allEdits = await this.databaseService.getEditServiceRequests(organizationId);
      const editItem = allEdits.find((e: any) => e.editRequest.id === requestId);
      if (!editItem) throw new BadRequestException('Request not found');

      const timelineLogs = await this.databaseService.getRequestLogsByRequestId(requestId);

      return {
        id: editItem.editRequest.id,
        type: 'reschedule',
        status: editItem.editRequest.status,
        serviceNature: {
          serviceName: editItem.booking?.service || 'Mental Health Session',
          category: 'Healthcare',
          serviceType: 'One-on-One',
          duration: editItem.booking?.duration || 60,
          provider: 'Dr. Sarah Williams',
          location: editItem.booking?.consultationType === 'online' ? 'Online (Video Call)' : 'Offline',
        },
        requestDetails: {
          reason: editItem.editRequest.reason,
          description: editItem.editRequest.reason,
          amountRequested: Number(editItem.editRequest.newAmount) || 0,
          attachments: editItem.editRequest.metadata?.files || [],
        },
        paymentDetails: {
          paymentMethod: 'Visa •••• 4242',
          paidOn: editItem.booking?.acceptedAt || editItem.booking?.createdAt,
          amountPaid: Number(editItem.booking?.amount) || 0,
          refundableAmount: Number(editItem.editRequest.newAmount) || 0,
          transactionId: editItem.booking?.meetingId || 'TXN-8844-7721-9988',
        },
        customerInfo: {
          name: editItem.client?.name || 'Robert Davis',
          email: editItem.client?.email || 'robert.d@email.com',
          phone: '',
          bookingId: editItem.booking?.id,
          bookingDate: editItem.booking?.scheduledDate,
          bookingTime: editItem.booking?.scheduledDate ? new Date(editItem.booking.scheduledDate).toLocaleTimeString() : '',
          status: editItem.booking?.status,
        },
        timeline: timelineLogs,
      };
    } else {
      // Disputed bookings details
      const rawBookings = await this.databaseService.findOrganizationBookings(organizationId);
      const disputedItem = rawBookings.find((b: any) => b.booking.id === requestId);
      if (!disputedItem) throw new BadRequestException('Request not found');

      return {
        id: disputedItem.booking.id,
        type: 'dispute',
        status: 'under review',
        serviceNature: {
          serviceName: disputedItem.booking.service || 'Therapy Session',
          category: 'Healthcare',
          serviceType: 'One-on-One',
          duration: disputedItem.booking.duration || 60,
          provider: disputedItem.expert?.name || 'Dr. Sarah Williams',
          location: disputedItem.booking.consultationType === 'online' ? 'Online (Video Call)' : 'Offline',
        },
        requestDetails: {
          reason: disputedItem.booking.notes || 'Dispute raised for this session',
          description: disputedItem.booking.notes || 'Charged but provider no-show',
          amountRequested: Number(disputedItem.booking.amount) || 0,
          attachments: [],
        },
        paymentDetails: {
          paymentMethod: 'Visa •••• 4242',
          paidOn: disputedItem.booking.acceptedAt || disputedItem.booking.createdAt,
          amountPaid: Number(disputedItem.booking.amount) || 0,
          refundableAmount: Number(disputedItem.booking.amount) || 0,
          transactionId: disputedItem.booking.meetingId || 'TXN-8844-7721-9988',
        },
        customerInfo: {
          name: disputedItem.client?.name || 'Michael Kim',
          email: disputedItem.client?.email || 'michael.k@email.com',
          phone: '',
          bookingId: disputedItem.booking.id,
          bookingDate: disputedItem.booking.scheduledDate,
          bookingTime: disputedItem.booking.scheduledDate ? new Date(disputedItem.booking.scheduledDate).toLocaleTimeString() : '',
          status: disputedItem.booking.status,
        },
        timeline: [],
      };
    }
  }

  async getOrganizationRequestLogs(organizationId: string) {
    return await this.databaseService.getOrganizationRequestLogs(organizationId);
  }
}

