import { pgTable, uuid, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const verificationDocuments = pgTable("verification_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  expertId: uuid("expert_id").notNull(),
  documentType: text("document_type").notNull(), // degree_certificate, professional_license, identity_proof, address_proof
  fileUrl: text("file_url").notNull(),
  originalFileName: text("original_file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  status: text("status").default("PENDING"), // PENDING, APPROVED, REJECTED
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type VerificationDocument = typeof verificationDocuments.$inferSelect;
