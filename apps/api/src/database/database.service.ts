import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  DatabaseClient,
  expert,
  expertProfile,
  profileChanges,
  client,
  conversations,
  messages,
  organizationProfile,
  organisation,
  expertOrganizations,
  organizationServices,
  organizationServiceCategories,
  offers,
  offerItems,
  bookings,
} from '@repo/database';
import { eq, and, desc, or, sql, isNull, inArray } from 'drizzle-orm';

@Injectable()
export class DatabaseService {
  constructor(@Inject('DB_CLIENT') public readonly db: any) {}

  // User (Client) related queries
  async findClientById(clientId: string) {
    const [clientData] = await this.db
      .select()
      .from(client)
      .where(eq(client.id, clientId));
    
    return clientData || null;
  }

  async updateClientProfile(clientId: string, data: any) {
    const [updatedClient] = await this.db
      .update(client)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(client.id, clientId))
      .returning();
      
    return updatedClient;
  }

  // Expert related queries
  async findExpertById(expertId: string) {
    const [expertData] = await this.db
      .select()
      .from(expert)
      .where(eq(expert.id, expertId));
    
    if (!expertData) return null;

    const [profileData] = await this.db
      .select()
      .from(expertProfile)
      .where(eq(expertProfile.userId, expertId));

    return {
      ...expertData,
      profile: profileData || null
    };
  }

  async findLiveExperts() {
    return await this.db
      .select({
        expert: expert,
        expert_profile: expertProfile
      })
      .from(expertProfile)
      .innerJoin(expert, eq(expertProfile.userId, expert.id))
      .leftJoin(expertOrganizations, eq(expert.id, expertOrganizations.expertId))
      .where(isNull(expertOrganizations.organizationId));
  }

  async findLiveExpertById(expertId: string) {
    const [result] = await this.db
      .select()
      .from(expertProfile)
      .innerJoin(expert, eq(expertProfile.userId, expert.id))
      .where(eq(expertProfile.userId, expertId));
    return result || null;
  }

  async updateExpert(expertId: string, data: any) {
    const [updatedExpert] = await this.db
      .update(expert)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(expert.id, expertId))
      .returning();
    return updatedExpert;
  }

  async updateExpertProfile(expertId: string, data: any) {
    const existingProfile = await this.db
      .select()
      .from(expertProfile)
      .where(eq(expertProfile.userId, expertId));

    if (existingProfile.length === 0) {
      // Create new profile
      const [newProfile] = await this.db
        .insert(expertProfile)
        .values({
          userId: expertId,
          ...data,
          verificationStatus: 'PENDING_INITIAL',
          hasPendingUpdates: true,
        })
        .returning();
      return newProfile;
    } else {
      // Update existing profile
      const [updatedProfile] = await this.db
        .update(expertProfile)
        .set({
          ...data,
          hasPendingUpdates: true,
          updatedAt: new Date(),
        })
        .where(eq(expertProfile.userId, expertId))
        .returning();
      return updatedProfile;
    }
  }

  async createProfileChange(changeData: any) {
    const [newChange] = await this.db
      .insert(profileChanges)
      .values({
        ...changeData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newChange;
  }

  async findLatestProfileChanges(expertId: string) {
    return await this.db
      .select()
      .from(profileChanges)
      .where(eq(profileChanges.entityId, expertId))
      .orderBy(desc(profileChanges.createdAt));
  }

  async createVerificationDocument(expertId: string, document: any) {
    // TODO: Implement actual database insert
    return { id: 'doc_' + Date.now(), ...document };
  }

  async findVerificationDocuments(expertId: string) {
    // TODO: Implement actual database query
    return [];
  }

  async ensureOrganizationProfile(userId: string) {
    const [existing] = await this.db.select().from(organizationProfile).where(eq(organizationProfile.userId, userId));
    if (existing) return existing;

    const [account] = await this.db.select().from(organisation).where(eq(organisation.id, userId));
    if (!account) return null;

    const [inserted] = await this.db
      .insert(organizationProfile)
      .values({
        userId: userId,
        name: account.name,
        officialEmail: account.email || null,
        logo: account.image || null,
        logoUrl: account.image || null,
        offeredServiceTypes: [],
        operatingHours: [],
        tags: [],
        documents: [],
      })
      .returning();

    return inserted || null;
  }

  async listOrganizationServices(organizationUserId: string) {
    const org = await this.ensureOrganizationProfile(organizationUserId);
    if (!org) return [];

    return await this.db
      .select()
      .from(organizationServices)
      .where(eq(organizationServices.organizationId, org.id))
      .orderBy(desc(organizationServices.updatedAt));
  }

  async createOrganizationService(organizationUserId: string, data: any) {
    const org = await this.ensureOrganizationProfile(organizationUserId);
    if (!org) return null;

    const [created] = await this.db
      .insert(organizationServices)
      .values({
        organizationId: org.id,
        categoryId: data.categoryId || null,
        name: data.name,
        basePrice: String(data.basePrice),
        discountType: data.discountType || null,
        discountValue: data.discountValue !== undefined && data.discountValue !== null ? String(data.discountValue) : null,
        durationMinutes: data.durationMinutes ?? null,
        imageUrl: data.imageUrl ?? null,
        isActive: data.isActive ?? true,
      })
      .returning();

    return created || null;
  }

  async updateOrganizationService(organizationUserId: string, serviceId: string, data: any) {
    const org = await this.ensureOrganizationProfile(organizationUserId);
    if (!org) return null;

    const [updated] = await this.db
      .update(organizationServices)
      .set({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.basePrice !== undefined ? { basePrice: String(data.basePrice) } : {}),
        ...(data.discountType !== undefined ? { discountType: data.discountType } : {}),
        ...(data.discountValue !== undefined ? { discountValue: data.discountValue === null ? null : String(data.discountValue) } : {}),
        ...(data.durationMinutes !== undefined ? { durationMinutes: data.durationMinutes } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(organizationServices.id, serviceId), eq(organizationServices.organizationId, org.id)))
      .returning();

    return updated || null;
  }

  async deleteOrganizationService(organizationUserId: string, serviceId: string) {
    const org = await this.ensureOrganizationProfile(organizationUserId);
    if (!org) return false;

    const deleted = await this.db
      .delete(organizationServices)
      .where(and(eq(organizationServices.id, serviceId), eq(organizationServices.organizationId, org.id)))
      .returning();

    return deleted.length > 0;
  }

  async createOffer(data: {
    conversationId: string;
    organizationProfileId: string;
    clientId: string;
    currency?: string;
    subtotal: string;
    discountTotal: string;
    total: string;
  }) {
    const [created] = await this.db
      .insert(offers)
      .values({
        conversationId: data.conversationId,
        organizationId: data.organizationProfileId,
        clientId: data.clientId,
        currency: data.currency || 'USD',
        subtotal: data.subtotal,
        discountTotal: data.discountTotal,
        total: data.total,
        status: 'sent',
      })
      .returning();
    return created || null;
  }

  async createOfferItems(data: {
    offerId: string;
    items: Array<{
      serviceId?: string | null;
      nameSnapshot: string;
      basePriceSnapshot: string;
      discountTypeSnapshot?: 'percent' | 'fixed' | null;
      discountValueSnapshot?: string | null;
      finalPriceSnapshot: string;
      quantity: number;
    }>;
  }) {
    if (data.items.length === 0) return [];
    const inserted = await this.db
      .insert(offerItems)
      .values(
        data.items.map((i) => ({
          offerId: data.offerId,
          serviceId: i.serviceId || null,
          nameSnapshot: i.nameSnapshot,
          basePriceSnapshot: i.basePriceSnapshot,
          discountTypeSnapshot: i.discountTypeSnapshot || null,
          discountValueSnapshot: i.discountValueSnapshot || null,
          finalPriceSnapshot: i.finalPriceSnapshot,
          quantity: i.quantity,
        })),
      )
      .returning();
    return inserted;
  }

  async getOfferWithItems(offerId: string) {
    const [offer] = await this.db.select().from(offers).where(eq(offers.id, offerId));
    if (!offer) return null;
    const items = await this.db.select().from(offerItems).where(eq(offerItems.offerId, offerId));
    return { offer, items };
  }

  async acceptOffer(offerId: string) {
    const [updated] = await this.db
      .update(offers)
      .set({ status: 'accepted', acceptedAt: new Date(), updatedAt: new Date() })
      .where(eq(offers.id, offerId))
      .returning();
    return updated || null;
  }

  async declineOffer(offerId: string) {
    const [updated] = await this.db
      .update(offers)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(offers.id, offerId))
      .returning();
    return updated || null;
  }

  async markOfferPaid(offerId: string) {
    const [updated] = await this.db
      .update(offers)
      .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
      .where(eq(offers.id, offerId))
      .returning();
    return updated || null;
  }

  async saveOfferBookingMetadata(offerId: string, metadata: any) {
    const [updated] = await this.db
      .update(offers)
      .set({ bookingMetadata: metadata, updatedAt: new Date() })
      .where(eq(offers.id, offerId))
      .returning();
    return updated || null;
  }

  async createBooking(data: {
    clientId: string;
    expertId: string;
    organizationId?: string;
    service: string;
    consultationType: string;
    scheduledDate: Date;
    duration: number;
    amount: string;
  }) {
    const [inserted] = await this.db
      .insert(bookings)
      .values({
        clientId: data.clientId,
        expertId: data.expertId,
        organizationId: data.organizationId || null,
        service: data.service,
        consultationType: data.consultationType,
        scheduledDate: data.scheduledDate,
        duration: data.duration,
        amount: data.amount,
        status: 'confirmed',
        paymentStatus: 'paid',
      })
      .returning();
    return inserted || null;
  }

  async findOrganizationBySubdomain(subdomain: string) {
    let [org] = await this.db.select().from(organizationProfile).where(eq(organizationProfile.subdomain, subdomain));
    return org || null;
  }

  async findOrganizationByProfileId(profileId: string) {
    let [org] = await this.db.select().from(organizationProfile).where(eq(organizationProfile.id, profileId));
    return org || null;
  }

  async findOrganizationById(userId: string) {
    const [org] = await this.db
      .select({
        ...organizationProfile,
        email: organisation.email,
        ownerName: organisation.name,
        isBlocked: organisation.isBlocked,
        blockedUntil: organisation.blockedUntil,
        messagingDisabled: organisation.messagingDisabled,
      })
      .from(organizationProfile)
      .innerJoin(organisation, eq(organizationProfile.userId, organisation.id))
      .where(eq(organizationProfile.userId, userId))
      .limit(1);
    return org;
  }

  async updateExpertStatus(expertId: string, status: string) {
    await this.db.update(expertProfile)
      .set({ verificationStatus: status, updatedAt: new Date() })
      .where(eq(expertProfile.userId, expertId));
    return { expertId, status };
  }

  async requestRefund(bookingId: string, amount: string, reason: string) {
    const [updated] = await this.db.update(bookings)
      .set({ 
        paymentStatus: 'refunded', 
        status: 'cancelled',
        cancellationReason: reason,
        updatedAt: new Date() 
      })
      .where(eq(bookings.id, bookingId))
      .returning();
    return updated;
  }

  async findOrganizationExperts(organizationProfileId: string) {
    return await this.db
      .select({
        expert: expert,
        expert_profile: expertProfile,
      })
      .from(expertOrganizations)
      .innerJoin(expert, eq(expertOrganizations.expertId, expert.id))
      .leftJoin(expertProfile, eq(expert.id, expertProfile.userId))
      .where(eq(expertOrganizations.organizationId, organizationProfileId));
  }

  async addExpertToOrganization(organizationId: string, expertId: string) {
    const [existing] = await this.db.select().from(expertOrganizations)
      .where(and(eq(expertOrganizations.organizationId, organizationId), eq(expertOrganizations.expertId, expertId)));
      
    if (existing) {
      if (existing.status !== 'APPROVED') {
        const [updated] = await this.db.update(expertOrganizations)
          .set({ status: 'APPROVED', joinedAt: new Date() })
          .where(eq(expertOrganizations.id, existing.id))
          .returning();
        return updated;
      }
      return existing;
    }
    
    const [inserted] = await this.db.insert(expertOrganizations).values({
      expertId,
      organizationId,
      status: 'APPROVED',
      joinedAt: new Date()
    }).returning();
    
    return inserted;
  }

  async removeExpertFromOrganization(organizationId: string, expertId: string) {
    const deleted = await this.db.delete(expertOrganizations)
      .where(and(eq(expertOrganizations.organizationId, organizationId), eq(expertOrganizations.expertId, expertId)))
      .returning();
      
    return deleted.length > 0;
  }

  async updateOrganizationProfile(organizationId: string, data: any) {
    const [existingProfile] = await this.db.select().from(organizationProfile).where(eq(organizationProfile.userId, organizationId));
    
    if (!existingProfile) {
      const [inserted] = await this.db.insert(organizationProfile).values({
        userId: organizationId,
        name: data.name || 'New Organization',
        ...data,
        hasPendingUpdates: true,
        verificationStatus: data.verificationStatus || 'ONBOARDING',
      }).returning();
      return inserted;
    } else {
      const [updatedOrg] = await this.db
        .update(organizationProfile)
        .set({
          ...data,
          hasPendingUpdates: true,
          updatedAt: new Date(),
        })
        .where(eq(organizationProfile.userId, organizationId))
        .returning();
      return updatedOrg;
    }
  }

  async findOrganizationsByStatus(status: string) {
    const orgs = await this.db
      .select({
        ...organizationProfile,
        email: organisation.email,
      })
      .from(organizationProfile)
      .leftJoin(organisation, eq(organizationProfile.userId, organisation.id))
      .where(eq(organizationProfile.verificationStatus, status));

    if (orgs.length === 0) return [];
    
    const orgIds = orgs.map((o: any) => o.id);
    const counts = await this.db.select({
      organizationId: expertOrganizations.organizationId,
      count: sql<number>`count(*)`
    })
    .from(expertOrganizations)
    .where(inArray(expertOrganizations.organizationId, orgIds))
    .groupBy(expertOrganizations.organizationId);

    const countMap = Object.fromEntries(counts.map((c: any) => [c.organizationId, Number(c.count)]));

    return orgs.map((org: any) => ({
      ...org,
      memberCount: countMap[org.id] || org.memberCount || 0
    }));
  }

  async findOrganizations(status?: string, location?: string, industry?: string) {
    let conditions = [];
    if (status) conditions.push(eq(organizationProfile.verificationStatus, status));
    if (location) conditions.push(eq(organizationProfile.location, location));
    if (industry) conditions.push(eq(organizationProfile.industry, industry));

    let query = this.db
      .select({
        ...organizationProfile,
        email: organisation.email,
      })
      .from(organizationProfile)
      .leftJoin(organisation, eq(organizationProfile.userId, organisation.id));
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const orgs = await query;
    if (orgs.length === 0) return [];
    
    const orgIds = orgs.map((o: any) => o.id);
    const counts = await this.db.select({
      organizationId: expertOrganizations.organizationId,
      count: sql<number>`count(*)`
    })
    .from(expertOrganizations)
    .where(inArray(expertOrganizations.organizationId, orgIds))
    .groupBy(expertOrganizations.organizationId);

    const countMap = Object.fromEntries(counts.map((c: any) => [c.organizationId, Number(c.count)]));

    return orgs.map((org: any) => ({
      ...org,
      memberCount: countMap[org.id] || org.memberCount || 0
    }));
  }


  async createJoinRequest(expertId: string, organizationId: string) {
    // TODO: Implement actual database insert
    return { id: 'req_' + Date.now(), expertId, organizationId };
  }

  // Availability related queries
  async setAvailability(expertId: string, availability: any) {
    // TODO: Implement actual database insert
    return { id: 'avail_' + Date.now(), expertId, ...availability };
  }

  async findAvailability(expertId: string) {
    // TODO: Implement actual database query
    return { availability: [], blockedSlots: [] };
  }

  // Booking related queries
  async findExpertBookings(expertId: string, status?: string) {
    let conditions = [eq(bookings.expertId, expertId)];
    if (status) conditions.push(eq(bookings.status, status));
    
    return await this.db
      .select({
        booking: bookings,
        client: client,
      })
      .from(bookings)
      .leftJoin(client, eq(bookings.clientId, client.id))
      .where(and(...conditions))
      .orderBy(desc(bookings.createdAt));
  }

  async findBookingById(expertId: string, bookingId: string) {
    // TODO: Implement actual database query
    return null;
  }

  async updateBookingStatus(expertId: string, bookingId: string, status: string) {
    // TODO: Implement actual database update
    return { bookingId, status };
  }

  // Session related queries
  async createSession(expertId: string, bookingId: string) {
    // TODO: Implement actual database insert
    return { id: 'session_' + Date.now(), expertId, bookingId };
  }

  async findSessionById(expertId: string, sessionId: string) {
    // TODO: Implement actual database query
    return null;
  }

  async endSession(expertId: string, sessionId: string) {
    // TODO: Implement actual database update
    return { sessionId, endedAt: new Date() };
  }

  // Earnings related queries
  async calculateEarnings(expertId: string) {
    // TODO: Implement actual database query
    return {
      totalEarnings: 0,
      pendingPayout: 0,
      completedPayout: 0,
      thisMonthEarnings: 0,
    };
  }

  async findTransactions(expertId: string, page: number, limit: number) {
    // TODO: Implement actual database query
    return { transactions: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }

  async findPayouts(expertId: string, page: number, limit: number) {
    // TODO: Implement actual database query
    return { payouts: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }

  // Notification related queries
  async findNotifications(expertId: string, page: number, limit: number, unreadOnly?: boolean) {
    // TODO: Implement actual database query
    return { 
      notifications: [], 
      pagination: { page, limit, total: 0, totalPages: 0 },
      unreadCount: 0 
    };
  }

  async markNotificationRead(expertId: string, notificationId: string) {
    // TODO: Implement actual database update
    return { notificationId, markedAt: new Date() };
  }

  async markAllNotificationsRead(expertId: string) {
    // TODO: Implement actual database update
    return { expertId, markedAt: new Date(), count: 0 };
  }

  async getUnreadCount(expertId: string) {
    // TODO: Implement actual database query
    return { unreadCount: 0, totalCount: 0 };
  }

  async toggleUserBlock(userId: string, userType: 'client' | 'expert' | 'organisation', isBlocked: boolean, blockedUntil?: Date | null) {
    const table = userType === 'client' ? client : userType === 'expert' ? expert : organisation;
    const [updated] = await this.db
      .update(table)
      .set({ isBlocked, blockedUntil, updatedAt: new Date() })
      .where(eq(table.id, userId))
      .returning();
    return updated;
  }

  async toggleMessaging(userId: string, userType: 'client' | 'expert' | 'organisation', messagingDisabled: boolean) {
    const table = userType === 'client' ? client : userType === 'expert' ? expert : organisation;
    const [updated] = await this.db
      .update(table)
      .set({ messagingDisabled, updatedAt: new Date() })
      .where(eq(table.id, userId))
      .returning();
    return updated;
  }

  // ==================== CHAT QUERIES ====================

  async findConversationsByUserId(userId: string, userType: 'client' | 'expert') {
    const condition = userType === 'client'
      ? eq(conversations.clientId, userId)
      : eq(conversations.expertId, userId);

    const rows = await this.db
      .select()
      .from(conversations)
      .where(condition)
      .orderBy(desc(conversations.lastMessageAt));

    // Enrich each conversation with other user's info
    const enriched = [];
    for (const convo of rows) {
      const otherUserId = userType === 'client' ? convo.expertId : convo.clientId;
      const otherTable = userType === 'client' ? expert : client;
      const [otherUser] = await this.db.select().from(otherTable).where(eq(otherTable.id, otherUserId));

      // Get other user's profile image (for expert, check expertProfile too)
      let profilePicture = otherUser?.image || null;
      let epData: any = null;
      if (userType === 'client' && otherUser) {
        const [ep] = await this.db.select().from(expertProfile).where(eq(expertProfile.userId, otherUser.id));
        if (ep) {
            epData = ep;
            if (ep.profileImage) profilePicture = ep.profileImage;
        }
      }

      // Get last message
      const [lastMsg] = await this.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, convo.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      // Count unread messages for this user
      const unreadResult = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, convo.id),
            eq(messages.isRead, false),
            // Messages NOT sent by me (i.e., sent by the other person)
            userType === 'client'
              ? eq(messages.senderType, 'expert')
              : eq(messages.senderType, 'client')
          )
        );

      enriched.push({
        _id: convo.id,
        type: convo.type,
        status: convo.status,
        clientId: convo.clientId, // Add clientId for client users
        expertId: convo.expertId, // Add expertId for completeness
        otherUser: otherUser ? {
          _id: otherUser.id,
          id: otherUser.id,
          name: otherUser.name,
          profilePicture: profilePicture,
          availability: epData?.availability || null,
          services: epData?.services || null,
          isOnline: false,
          lastSeen: null,
        } : null,
        lastMessage: lastMsg?.content || null,
        lastMessageAt: lastMsg?.createdAt || convo.createdAt,
        lastMessageSender: lastMsg?.senderId || null,
        lastMessageStatus: 'sent',
        expertUnreadCount: userType === 'expert' ? Number(unreadResult[0]?.count || 0) : 0,
        userUnreadCount: userType === 'client' ? Number(unreadResult[0]?.count || 0) : 0,
      });
    }

    return enriched;
  }

  async findConversationsByOrganizationId(organizationProfileId: string) {
    // Find all experts in this organization
    const expertLinks = await this.db.select().from(expertOrganizations).where(eq(expertOrganizations.organizationId, organizationProfileId));
    const expertIds = expertLinks.map(link => link.expertId);

    // Find conversations where organizationId matches OR expertId is in the organization's team
    const rows = await this.db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.organizationId, organizationProfileId),
          expertIds.length > 0 ? sql`${conversations.expertId} IN (${sql.join(expertIds, sql`, `)})` : sql`FALSE`
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    // Enrich each conversation with other user's info (Client info)
    const enriched = [];
    for (const convo of rows) {
      const [otherUser] = await this.db.select().from(client).where(eq(client.id, convo.clientId));
      
      // Get last message
      const [lastMsg] = await this.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, convo.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      // Count unread messages for 'organization' view (sent by client)
      const unreadResult = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, convo.id),
            eq(messages.isRead, false),
            eq(messages.senderType, 'client')
          )
        );

      enriched.push({
        _id: convo.id,
        id: convo.id,
        type: convo.type,
        status: convo.status,
        expertId: convo.expertId,
        clientId: convo.clientId,
        otherUser: otherUser ? {
          _id: otherUser.id,
          name: otherUser.name,
          profilePicture: otherUser.image || null,
          isOnline: false,
          lastSeen: null,
        } : null,
        lastMessage: lastMsg?.content || null,
        lastMessageAt: lastMsg?.createdAt || convo.createdAt,
        lastMessageSender: lastMsg?.senderId || null,
        unreadCount: Number(unreadResult[0]?.count || 0),
      });
    }

    return enriched;
  }

  async findMessagesByConversationId(conversationId: string, page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;

    const msgs = await this.db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        senderType: messages.senderType,
        recipientId: messages.recipientId,
        content: messages.content,
        messageType: messages.messageType,
        payload: messages.payload,
        createdAt: messages.createdAt,
        isRead: messages.isRead,
        isDeleted: messages.isDeleted,
        offerStatus: offers.status,
        bookingMetadata: offers.bookingMetadata,
      })
      .from(messages)
      .leftJoin(offers, sql`${messages.payload}->>'id' = ${offers.id}::text`)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.conversationId, conversationId));

    const total = Number(totalResult[0]?.count || 0);

    return {
      messages: msgs.reverse().map(m => {
        const payload = m.payload || null;
        if (m.messageType === 'offer' && payload && m.offerStatus) {
            payload.status = m.offerStatus;
            payload.bookingMetadata = m.bookingMetadata || null;
        }
        
        return {
          _id: m.id,
          conversationId: m.conversationId,
          sender: m.senderId,
          senderModel: m.senderType === 'client' ? 'User' : 'Expert',
          content: m.content,
          contentType: m.messageType,
          payload,
          createdAt: m.createdAt,
          readBy: m.isRead ? [m.senderId, m.recipientId] : [m.senderId],
          status: 'sent',
          isDeleted: m.isDeleted,
          recipientId: m.recipientId,
          senderType: m.senderType,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createMessage(data: {
    conversationId: string;
    senderId: string;
    senderType: string;
    content: string;
    recipientId: string;
    recipientType: string;
    messageType?: string;
    payload?: Record<string, any> | null;
  }) {
    const [newMsg] = await this.db
      .insert(messages)
      .values({
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderType: data.senderType,
        content: data.content,
        recipientId: data.recipientId,
        recipientType: data.recipientType,
        messageType: data.messageType || 'text',
        payload: data.payload || null,
      })
      .returning();

    // Update conversation's lastMessageAt
    await this.db
      .update(conversations)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(conversations.id, data.conversationId));

    return {
      _id: newMsg.id,
      conversationId: newMsg.conversationId,
      sender: newMsg.senderId,
      senderModel: newMsg.senderType === 'client' ? 'User' : 'Expert',
      content: newMsg.content,
      contentType: newMsg.messageType,
      payload: (newMsg as any).payload || null,
      createdAt: newMsg.createdAt,
      readBy: [newMsg.senderId],
      status: 'sent',
      isDeleted: false,
      recipientId: newMsg.recipientId,
      senderType: newMsg.senderType,
    };
  }

  async findConversationById(conversationId: string) {
    const [existing] = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));
    return existing || null;
  }

  async findOrCreateConversation(data: {
    clientId: string;
    expertId: string;
    type: string;
  }) {
    // Check for existing conversation
    const [existing] = await this.db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.clientId, data.clientId),
          eq(conversations.expertId, data.expertId),
        )
      );

    if (existing) return existing;

    // Detect expert's organization if any
    let organizationId = null;
    if (data.expertId) {
      const [orgLink] = await this.db
        .select()
        .from(expertOrganizations)
        .where(eq(expertOrganizations.expertId, data.expertId))
        .limit(1);
      if (orgLink) organizationId = orgLink.organizationId;
    }

    // Create new
    const [newConvo] = await this.db
      .insert(conversations)
      .values({
        clientId: data.clientId,
        expertId: data.expertId,
        organizationId: organizationId,
        type: data.type || 'expert',
        status: 'active',
      })
      .returning();

    return newConvo;
  }

  async markMessagesAsRead(conversationId: string, userId: string, userType: string) {
    // Mark all messages in this conversation that were NOT sent by this user as read
    const senderTypeToMark = userType === 'client' ? 'expert' : 'client';
    
    // Get messages to update
    const messagesToUpdate = await this.db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.senderType, senderTypeToMark),
          eq(messages.isRead, false),
        )
      );

    // Update each message to add the reader to readBy array
    for (const message of messagesToUpdate) {
      const currentReadBy = message.readBy || [];
      if (!currentReadBy.includes(userId)) {
        await this.db
          .update(messages)
          .set({ 
            isRead: true, 
            readAt: new Date(),
            readBy: [...currentReadBy, userId]
          })
          .where(eq(messages.id, message.id));
      }
    }
  }
}
