import { pgTable, uuid, text, integer, decimal, boolean, timestamp, varchar, index, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizationProfile } from "./organizations";
import { conversations } from "./chat";
import { client } from "./users";

export const organizationServiceCategories = pgTable(
  "organization_service_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationProfile.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => ({
    orgIdx: index("idx_org_service_category_org").on(table.organizationId),
  }),
);

export const organizationServices = pgTable(
  "organization_services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationProfile.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => organizationServiceCategories.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
    discountType: varchar("discount_type", { enum: ["percent", "fixed"] }),
    discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
    durationMinutes: integer("duration_minutes"),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => ({
    orgIdx: index("idx_org_service_org").on(table.organizationId),
    categoryIdx: index("idx_org_service_category").on(table.categoryId),
  }),
);

export const offers = pgTable(
  "offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationProfile.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").notNull().references(() => client.id, { onDelete: "cascade" }),
    status: varchar("status", { enum: ["sent", "accepted", "paid", "expired", "cancelled"] }).default("sent").notNull(),
    currency: text("currency").default("USD").notNull(),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0").notNull(),
    discountTotal: decimal("discount_total", { precision: 10, scale: 2 }).default("0").notNull(),
    total: decimal("total", { precision: 10, scale: 2 }).default("0").notNull(),
    acceptedAt: timestamp("accepted_at"),
    paidAt: timestamp("paid_at"),
    bookingMetadata: json("booking_metadata").$type<{
      scheduledDate: string;
      time: string;
      timezone: string;
      consultationType: "Video Call" | "Clinic Visit";
      expertId: string;
    } | null>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  },
  (table) => ({
    convoIdx: index("idx_offer_conversation").on(table.conversationId),
    orgIdx: index("idx_offer_org").on(table.organizationId),
    clientIdx: index("idx_offer_client").on(table.clientId),
  }),
);

export const offerItems = pgTable(
  "offer_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offerId: uuid("offer_id").notNull().references(() => offers.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => organizationServices.id, { onDelete: "set null" }),
    nameSnapshot: text("name_snapshot").notNull(),
    basePriceSnapshot: decimal("base_price_snapshot", { precision: 10, scale: 2 }).notNull(),
    discountTypeSnapshot: varchar("discount_type_snapshot", { enum: ["percent", "fixed"] }),
    discountValueSnapshot: decimal("discount_value_snapshot", { precision: 10, scale: 2 }),
    finalPriceSnapshot: decimal("final_price_snapshot", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    offerIdx: index("idx_offer_items_offer").on(table.offerId),
  }),
);

export const organizationServiceCategoriesRelations = relations(organizationServiceCategories, ({ one, many }) => ({
  organization: one(organizationProfile, {
    fields: [organizationServiceCategories.organizationId],
    references: [organizationProfile.id],
  }),
  services: many(organizationServices),
}));

export const organizationServicesRelations = relations(organizationServices, ({ one }) => ({
  organization: one(organizationProfile, {
    fields: [organizationServices.organizationId],
    references: [organizationProfile.id],
  }),
  category: one(organizationServiceCategories, {
    fields: [organizationServices.categoryId],
    references: [organizationServiceCategories.id],
  }),
}));

export const offersRelations = relations(offers, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [offers.conversationId],
    references: [conversations.id],
  }),
  organization: one(organizationProfile, {
    fields: [offers.organizationId],
    references: [organizationProfile.id],
  }),
  client: one(client, {
    fields: [offers.clientId],
    references: [client.id],
  }),
  items: many(offerItems),
}));

export const offerItemsRelations = relations(offerItems, ({ one }) => ({
  offer: one(offers, {
    fields: [offerItems.offerId],
    references: [offers.id],
  }),
}));

export type OrganizationServiceCategory = typeof organizationServiceCategories.$inferSelect;
export type NewOrganizationServiceCategory = typeof organizationServiceCategories.$inferInsert;

export type OrganizationService = typeof organizationServices.$inferSelect;
export type NewOrganizationService = typeof organizationServices.$inferInsert;

export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;

export type OfferItem = typeof offerItems.$inferSelect;
export type NewOfferItem = typeof offerItems.$inferInsert;

