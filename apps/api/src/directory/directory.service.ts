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
      const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
      if (url.startsWith('http')) {
        if (url.includes('/uploads/')) {
          const path = url.split('/uploads/')[1];
          return `${baseUrl}/uploads/${path}`;
        }
        return url;
      }
      return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
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
    
    // Safety filter: ensure only visible experts are processed
    const visibleExperts = rawExperts.filter(item => item.expert_profile?.isVisible !== false);

    return {
      status: 'success',
      data: {
        experts: visibleExperts.map((item) => this.mapExpertToPublicProfile(item)),
        total: visibleExperts.length,
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

  private mapOrganizationToPublicProfile(org: any, services: any[] = []) {
    const toFullUrl = (url: string | null) => {
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
    };

    return {
        _id: org.id,
        userId: org.userId, // This is the organisation.id from the organisation table
        name: org.name,
        subdomain: org.subdomain,
        description: org.description || "",
        tagline: org.tagline || "",
        industry: org.industry || "",
        location: org.location || "Online",
        phone: org.phone || org.phoneNumber || null,
        phoneNumber: org.phoneNumber || org.phone || null,
        website: org.website || "",
        logo: toFullUrl(org.logo),
        coverImageUrl: toFullUrl(org.coverImageUrl),
        introVideo: toFullUrl(org.introVideo),
        verified: org.verified || org.verificationStatus === 'VERIFIED',
        memberCount: org.memberCount || 0,
        rating: typeof org.rating === 'number' ? org.rating : 4.5,
        reviewCount: 15,
        documents: org.documents || [],
        tags: org.tags || [],
        operatingHours: org.operatingHours || [],
        products: (org.products || []).map((p: any) => ({
          name: p.name || "",
          price: p.price || "",
          image: toFullUrl(p.image || null),
        })),
        features: org.features || [],
        services: services.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description || null,
          basePrice: Number(s.basePrice) || 0,
          durationMinutes: s.durationMinutes || 60,
          imageUrl: toFullUrl(s.imageUrl),
          isActive: s.isActive,
          categoryId: s.categoryId || null,
        })),
        serviceCount: services.length,
        showCategories: org.showCategories || false,
        defaultLayout: this.normalizeLayout(org.defaultLayout),
    };
  }

  async getLiveOrganizations() {
    const rawOrgs = await this.databaseService.findOrganizations('VERIFIED', undefined, undefined, true);
    
    // Safety filter: ensure only visible organizations are processed
    const visibleOrgs = rawOrgs.filter(org => org.isVisible !== false);

    if (visibleOrgs.length === 0) {
      return { status: 'success', data: { organizations: [], total: 0, hasMore: false } };
    }

    const orgIds = visibleOrgs.map(org => org.id);

    // Batch-fetch ALL experts and services for ALL orgs in 2 queries (no N+1)
    const [allRawExperts, allServices] = await Promise.all([
      this.databaseService.findMultipleOrganizationsExperts(orgIds, true),
      this.databaseService.listMultipleOrganizationServicesByProfileIds(orgIds),
    ]);

    // Group experts by orgId
    const expertsByOrgId = new Map<string, any[]>();
    for (const item of allRawExperts) {
      const orgId: string = item.organizationId;
      if (!expertsByOrgId.has(orgId)) expertsByOrgId.set(orgId, []);
      expertsByOrgId.get(orgId)!.push(item);
    }

    // Group services by orgId
    const servicesByOrgId = new Map<string, any[]>();
    for (const svc of allServices) {
      const orgId: string = svc.organizationId;
      if (!servicesByOrgId.has(orgId)) servicesByOrgId.set(orgId, []);
      servicesByOrgId.get(orgId)!.push(svc);
    }

    const organizations = visibleOrgs.map(org => {
      const rawExperts = expertsByOrgId.get(org.id) || [];
      const services = servicesByOrgId.get(org.id) || [];
      const experts = rawExperts.map(item => this.mapExpertToPublicProfile(item));
      return {
        ...this.mapOrganizationToPublicProfile({ ...org, memberCount: experts.length }, services),
        experts,
      };
    });

    return {
      status: 'success',
      data: {
        organizations,
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
      if (!rawOrg) {
        rawOrg = await this.databaseService.findOrganizationById(idOrSubdomain);
      }
    }
    
    if (!rawOrg) {
      rawOrg = await this.databaseService.findOrganizationBySubdomain(idOrSubdomain);
    }
    
    if (!rawOrg) return null;
    
    // Fetch affiliated experts (only visible ones), services, and reviews in parallel
    const [rawExperts, services, rawReviews, categories] = await Promise.all([
      this.databaseService.findOrganizationExperts(rawOrg.id, true),
      this.databaseService.listOrganizationServicesByProfileId(rawOrg.id),
      this.databaseService.findReviewsByOrganizationId(rawOrg.id),
      this.databaseService.listOrganizationServiceCategories(rawOrg.userId),
    ]);

    const experts = rawExperts.map((item) => this.mapExpertToPublicProfile(item));
    const reviews = (rawReviews || []).map((r: any) => ({
      name: r.client?.name || "Anonymous",
      comment: r.review.comment,
      rating: r.review.rating,
      time: r.review.createdAt ? new Date(r.review.createdAt).toLocaleDateString() : "Recently",
    }));

    // Resolve banner image URLs
    const toFullUrl = (url: string | null) => {
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
    };

    const rawBanners = rawOrg.banners || { horizontal: [], vertical: [] };
    const banners = {
      horizontal: (rawBanners.horizontal || []).map((b: any) => ({
        ...b,
        imageUrl: toFullUrl(b.imageUrl),
      })),
      vertical: (rawBanners.vertical || []).map((b: any) => ({
        ...b,
        imageUrl: toFullUrl(b.imageUrl),
      })),
    };

    return {
      status: 'success',
      data: {
        ...this.mapOrganizationToPublicProfile(rawOrg, services),
        categories: (categories || []).map(c => ({
          id: c.id,
          name: c.name,
          imageUrl: toFullUrl(c.imageUrl),
          price: c.price || null,
          layout: this.normalizeLayout(c.layout),
        })),
        experts,
        reviews,
        banners,
      }
    };
  }

  // ─── Dedicated sub-resource APIs ───────────────────────────────────────────

  private async resolveOrg(idOrSubdomain: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSubdomain);
    let org = null;
    if (isUuid) {
      org = await this.databaseService.findOrganizationByProfileId(idOrSubdomain);
      if (!org) {
        org = await this.databaseService.findOrganizationById(idOrSubdomain);
      }
    }
    if (!org)    org = await this.databaseService.findOrganizationBySubdomain(idOrSubdomain);
    return org;
  }

  async getOrganizationServices(idOrSubdomain: string) {
    const org = await this.resolveOrg(idOrSubdomain);
    if (!org) return null;

    const toFullUrl = (url: string | null) => {
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
    };

    const services = await this.databaseService.listOrganizationServicesByProfileId(org.id);

    return {
      status: 'success',
      data: {
        services: services.map(s => ({
          id: s.id,
          name: s.name,
          description: (s as any).description || null,
          basePrice: Number(s.basePrice) || 0,
          durationMinutes: s.durationMinutes || 60,
          imageUrl: toFullUrl((s as any).imageUrl),
          isActive: s.isActive,
          categoryId: s.categoryId || null,
        })),
        total: services.length,
      }
    };
  }

  async getOrganizationExperts(idOrSubdomain: string, serviceFilter?: string) {
    const org = await this.resolveOrg(idOrSubdomain);
    if (!org) return null;

    const rawExperts = await this.databaseService.findOrganizationExperts(org.id, true);
    let experts = rawExperts.map(item => this.mapExpertToPublicProfile(item));

    // Filter by service name if provided
    if (serviceFilter) {
      const filterLower = serviceFilter.toLowerCase();
      experts = experts.filter(e =>
        Array.isArray(e.services) &&
        e.services.some((s: any) => {
          const name = typeof s === 'string' ? s : s?.name || '';
          return name.toLowerCase().includes(filterLower);
        })
      );
    }

    return {
      status: 'success',
      data: {
        experts,
        total: experts.length,
        filteredByService: serviceFilter || null,
      }
    };
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
}
