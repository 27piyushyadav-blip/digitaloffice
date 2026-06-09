import { pgTable, uuid, text, integer, decimal, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { expert, organisation } from "./users";

export const organizationProfile = pgTable("organization_profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => organisation.id, { onDelete: "cascade" }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"), // Bio
  tagline: text("tagline"),
  logo: text("logo"), // Profile Image
  logoUrl: text("logo_url"),
  coverImageUrl: text("cover_image_url"),
  aboutUs: text("about_us"),
  category: text("category"),
  subdomain: text("subdomain"),
  industry: text("industry"),
  phone: text("phone"),
  phoneNumber: text("phone_number"),
  officialEmail: text("official_email"),
  website: text("website"),
  websiteUrl: text("website_url"),
  socialLinks: json("social_links").$type<{
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  }>(),
  specialties: json("specialties").$type<string[]>(),
  location: text("location"), // Address
  isPhysicalOffice: boolean("is_physical_office").default(false),
  addressLine1: text("address_line_1"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  coordinates: json("coordinates").$type<{
    lat: number;
    lng: number;
  }>(),
  introVideo: text("intro_video"),
  foundedYear: text("founded_year"),
  licenseNumber: text("license_number"),
  taxIdNumber: text("tax_id_number"),
  businessLicenseUrl: text("business_license_url"),
  offeredServiceTypes: json("offered_service_types").$type<string[]>(),
  operatingHours: json("operating_hours").$type<Array<{
    day: string;
    open: string;
    close: string;
    is_closed: boolean;
  }>>(),
  bookingPolicy: text("booking_policy"),
  cancellationWindowHours: integer("cancellation_window_hours"),
  bankDetails: json("bank_details").$type<{
    bankName?: string;
    accountName: string;
    accountNumber: string;
    ifscCode?: string;
    bsbCode?: string;
  }>(),
  workingHours: text("working_hours"),
  tags: json("tags").$type<string[]>(),
  documents: json("documents").$type<Array<{
    title: string;
    category: string;
    url: string;
    fileType?: string;
    fileSize?: string;
  }>>(),
  hasPendingUpdates: boolean("has_pending_updates").default(false),
  isVisible: boolean("is_visible").default(true),
  menu: json("menu").$type<any[]>(),
  defaultLayout: json("default_layout").$type<{
    horizontal?: string[];
    vertical?: string[];
    vertical2Name?: string;
    horizontal1?: { type: string; title: string; services: string[] };
    horizontal2?: { type: string; title: string; services: string[] };
    vertical1?: { type: string; title: string; services: string[] };
    vertical2?: string[] | { type: string; title: string; services: string[] };
  }>(),
  banners: json("banners").$type<{
    horizontal: Array<{ id: string; imageUrl: string; title?: string; link?: string }>;
    vertical: Array<{ id: string; imageUrl: string; title?: string; link?: string }>;
  }>(),
  products: json("products").$type<Array<{ name: string; price: string; image: string }>>(),
  features: json("features").$type<Array<{ title: string; description: string }>>(),
  verified: boolean("verified").default(false),
  memberCount: integer("member_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  verificationStatus: text("verification_status").default("ONBOARDING"), // ONBOARDING, PENDING, VERIFIED, REJECTED
  rejectionReason: text("rejection_reason"),
  showCategories: boolean("show_categories").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const expertOrganizations = pgTable("expert_organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  expertId: uuid("expert_id").references(() => expert.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").references(() => organizationProfile.id, { onDelete: "cascade" }),
  role: text("role").default("Member"), // Member, Senior Consultant, Manager, etc.
  status: text("status").default("PENDING"), // PENDING, APPROVED, REJECTED
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type OrganizationProfile = typeof organizationProfile.$inferSelect;
export type ExpertOrganization = typeof expertOrganizations.$inferSelect;
