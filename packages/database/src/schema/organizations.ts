import { pgTable, uuid, text, integer, decimal, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { expert, organisation } from "./users";

export const organizationProfile = pgTable("organization_profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => organisation.id, { onDelete: "cascade" }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"), // Bio
  industry: text("industry"),
  specialties: json("specialties").$type<string[]>(),
  location: text("location"), // Address
  website: text("website"),
  logo: text("logo"), // Profile Image
  introVideo: text("intro_video"),
  foundedYear: text("founded_year"),
  licenseNumber: text("license_number"),
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
  verified: boolean("verified").default(false),
  memberCount: integer("member_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  verificationStatus: text("verification_status").default("PENDING"), // PENDING, VERIFIED, REJECTED
  rejectionReason: text("rejection_reason"),
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
