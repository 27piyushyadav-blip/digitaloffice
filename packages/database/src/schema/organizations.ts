import { pgTable, uuid, text, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { expert } from "./users";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  industry: text("industry"),
  location: text("location"),
  website: text("website"),
  logo: text("logo"),
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
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  role: text("role").default("Member"), // Member, Senior Consultant, Manager, etc.
  status: text("status").default("PENDING"), // PENDING, APPROVED, REJECTED
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Organization = typeof organizations.$inferSelect;
export type ExpertOrganization = typeof expertOrganizations.$inferSelect;
