import { pgTable, uuid, text, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull(),
  expertId: uuid("expert_id").notNull(),
  organizationId: uuid("organization_id"), // Optional - if expert belongs to org
  service: text("service").notNull(),
  consultationType: text("consultation_type").default("online"), // online, offline
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration").notNull(), // minutes
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"), // pending, confirmed, cancelled, completed, no_show
  paymentStatus: text("payment_status").default("pending"), // pending, paid, refunded, failed
  meetingUrl: text("meeting_url"),
  meetingId: text("meeting_id"), // For video conferencing integration
  notes: text("notes"),
  rejectionReason: text("rejection_reason"),
  cancellationReason: text("cancellation_reason"),
  acceptedAt: timestamp("accepted_at"),
  rejectedAt: timestamp("rejected_at"),
  cancelledAt: timestamp("cancelled_at"),
  completedAt: timestamp("completed_at"),
  pointsEarned: integer("points_earned").default(0).notNull(),
  pointsRedeemed: integer("points_redeemed").default(0).notNull(),
  pointsDiscountAmount: decimal("points_discount_amount", { precision: 10, scale: 4 }).default("0.0000").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Booking = typeof bookings.$inferSelect;
