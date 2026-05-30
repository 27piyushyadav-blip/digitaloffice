import { pgTable, uuid, text, decimal, timestamp, json } from "drizzle-orm/pg-core";
import { bookings } from "./bookings";
import { client } from "./users";

export const refundRequests = pgTable("refund_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").notNull().references(() => client.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id"), // No foreign key constraint for now
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  refundType: text("refund_type").notNull(), // full, partial
  status: text("status").default("pending").notNull(), // pending, approved, rejected, processing
  rejectionReason: text("rejection_reason"),
  paymentMethod: text("payment_method"),
  metadata: json("metadata").$type<{
    files?: Array<{ name: string; url: string; type: string }>;
    rating?: number;
    feedback?: string;
  }>(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type RefundRequest = typeof refundRequests.$inferSelect;
