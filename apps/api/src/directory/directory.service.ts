import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DirectoryService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  private mapExpertToPublicProfile(item: any) {
    const { expert, expert_profile } = item;
    
    const toFullUrl = (url: string | null) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
      return `${baseUrl}${url}`;
    };

    // Calculate starting price
    let startingPrice = Infinity;
    if (expert_profile.services && Array.isArray(expert_profile.services)) {
        expert_profile.services.forEach((s: any) => {
            if (s.videoPrice && s.videoPrice < startingPrice) startingPrice = s.videoPrice;
            if (s.clinicPrice && s.clinicPrice < startingPrice) startingPrice = s.clinicPrice;
        });
    }

    // Default latest education summary
    let latestEducation = expert_profile.latestEducation;
    if (!latestEducation && expert_profile.education && Array.isArray(expert_profile.education) && expert_profile.education.length > 0) {
        latestEducation = `${expert_profile.education[0].degree} in ${expert_profile.education[0].fieldOfStudy}`;
    }

    return {
        _id: expert.id,
        name: expert.name,
        username: expert.username,
        profilePicture: toFullUrl(expert_profile.profileImage || expert.image || null),
        specialization: expert_profile.specialization || "Mental Health Professional",
        rating: 4.8, // Default rating logic would go here
        reviewCount: expert_profile.reviews ? expert_profile.reviews.length : 12,
        experienceYears: typeof expert_profile.experience === 'number' ? expert_profile.experience : 0,
        location: expert_profile.location || "Online",
        education: expert_profile.education || [],
        latestEducation: latestEducation || "N/A",
        videoUrl: toFullUrl(expert_profile.introVideo || null),
        startingPrice: startingPrice === Infinity ? null : startingPrice,
        isOnline: true,
        isVerified: expert_profile.isVerified || expert_profile.verificationStatus === 'LIVE',
        languages: expert_profile.languages || ["English"],
        bio: expert_profile.bio || "",
        workHistory: expert_profile.workHistory || [],
        documents: expert_profile.documents || [],
        services: expert_profile.services || [],
        awards: expert_profile.awards || [],
        memberships: expert_profile.memberships || [],
        registrations: expert_profile.registrations || [],
        clinics: expert_profile.clinics || [],
        faqs: expert_profile.faqs || [],
        reviews: expert_profile.reviews || [],
        availability: expert_profile.availability || [],
        leaves: expert_profile.leaves || []
    };
  }

  async getLiveExperts() {
    const rawExperts = await this.databaseService.findLiveExperts();
    
    return {
      status: 'success',
      data: {
        experts: rawExperts.map((item) => this.mapExpertToPublicProfile(item)),
        total: rawExperts.length,
        hasMore: false,
      }
    };
  }

  async getLiveExpertById(id: string) {
    const rawExpert = await this.databaseService.findLiveExpertById(id);
    if (!rawExpert) return null;
    
    return {
      status: 'success',
      data: this.mapExpertToPublicProfile(rawExpert)
    };
  }

  private mapOrganizationToPublicProfile(org: any) {
    const toFullUrl = (url: string | null) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
      return `${baseUrl}${url}`;
    };

    return {
        _id: org.id,
        name: org.name,
        subdomain: org.subdomain,
        description: org.description || "",
        industry: org.industry || "",
        location: org.location || "Online",
        website: org.website || "",
        logo: toFullUrl(org.logo),
        introVideo: toFullUrl(org.introVideo),
        verified: org.verified || org.verificationStatus === 'VERIFIED',
        memberCount: org.memberCount || 0,
        rating: typeof org.rating === 'number' ? org.rating : 4.5,
        reviewCount: 15,
        documents: org.documents || [],
        tags: org.tags || []
    };
  }

  async getLiveOrganizations() {
    const rawOrgs = await this.databaseService.findOrganizations('VERIFIED');
    
    // For each organization, fetch real expert count if not already accurate
    const orgsWithCount = await Promise.all(rawOrgs.map(async (org) => {
      const experts = await this.databaseService.findOrganizationExperts(org.id);
      return {
        ...org,
        memberCount: experts.length
      };
    }));
    
    return {
      status: 'success',
      data: {
        organizations: orgsWithCount.map(org => this.mapOrganizationToPublicProfile(org)),
        total: rawOrgs.length,
        hasMore: false,
      }
    };
  }

  async getLiveOrganizationById(idOrSubdomain: string) {
    let rawOrg = null;
    
    // Check if it's a valid UUID before querying by ID to avoid Postgres crash
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSubdomain);
    
    if (isUuid) {
      rawOrg = await this.databaseService.findOrganizationByProfileId(idOrSubdomain);
    }
    
    if (!rawOrg) {
      rawOrg = await this.databaseService.findOrganizationBySubdomain(idOrSubdomain);
    }
    
    if (!rawOrg) return null;
    
    // Fetch affiliated experts
    const rawExperts = await this.databaseService.findOrganizationExperts(rawOrg.id);
    const experts = rawExperts.map((item) => this.mapExpertToPublicProfile(item));
    
    return {
      status: 'success',
      data: {
        ...this.mapOrganizationToPublicProfile(rawOrg),
        experts: experts
      }
    };
  }
}
