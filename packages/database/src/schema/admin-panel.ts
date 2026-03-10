import { pgTable, uuid, text, timestamp, boolean, integer, json } from "drizzle-orm/pg-core";

// 1. Categories Table - For expert service categories
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  expertCount: integer("expert_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// 2. Profile Changes Table - For tracking profile update requests
export const profileChanges = pgTable("profile_changes", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(), // 'expert', 'organization', 'client'
  entityId: uuid("entity_id").notNull(),
  field: text("field").notNull(), // 'experience', 'description', 'phone', etc.
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  reason: text("reason"),
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected'
  reviewedBy: uuid("reviewed_by"), // Admin ID who reviewed
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// 3. Refunds Table - For tracking refund requests
export const refunds = pgTable("refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull(),
  clientId: uuid("client_id").notNull(),
  expertId: uuid("expert_id").notNull(),
  amount: text("amount").notNull(), // Using text for decimal precision
  reason: text("reason").notNull(),
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected'
  processedBy: uuid("processed_by"), // Admin ID who processed
  processedAt: timestamp("processed_at"),
  rejectionReason: text("rejection_reason"),
  refundMethod: text("refund_method"), // 'original_payment', 'bank_transfer', 'wallet'
  refundReference: text("refund_reference"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// 4. Disputes Table - For tracking user disputes
export const disputes = pgTable("disputes", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull(),
  clientId: uuid("client_id").notNull(),
  expertId: uuid("expert_id").notNull(),
  type: text("type").notNull(), // 'service_quality', 'payment_issue', 'behavior', 'technical'
  description: text("description").notNull(),
  status: text("status").default("pending").notNull(), // 'pending', 'investigating', 'resolved'
  resolution: text("resolution"),
  resolvedBy: uuid("resolved_by"), // Admin ID who resolved
  resolvedAt: timestamp("resolved_at"),
  evidence: json("evidence"), // Array of evidence URLs or descriptions
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// 5. Activity Logs Table - For tracking admin actions
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id").notNull(),
  action: text("action").notNull(), // 'expert_approved', 'organization_rejected', 'user_banned', etc.
  details: text("details").notNull(),
  targetId: uuid("target_id"), // ID of the entity being acted upon
  targetType: text("target_type"), // 'expert', 'organization', 'user', 'booking', etc.
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: json("metadata"), // Additional action-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Platform Settings Table - For platform configuration
export const platformSettings = pgTable("platform_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'commission', 'booking', 'verification', etc.
  type: text("type").notNull(), // 'number', 'string', 'boolean', 'json'
  isPublic: boolean("is_public").default(false).notNull(), // Whether this setting is exposed to frontend
  updatedBy: uuid("updated_by"), // Admin ID who last updated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// 7. Organization Verification Documents Table - For organization documents
export const organizationVerificationDocuments = pgTable("organization_verification_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  documentType: text("document_type").notNull(), // 'business_license', 'gst_certificate', 'address_proof', etc.
  fileUrl: text("file_url").notNull(),
  originalFileName: text("original_file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected'
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: uuid("reviewed_by"), // Admin ID who reviewed
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
