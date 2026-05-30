import { pgTable, uuid, text, decimal, timestamp, json } from "drizzle-orm/pg-core";
import { bookings } from "./bookings";
import { client } from "./users";

export const editServiceRequests = pgTable("edit_service_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").notNull().references(() => client.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id"), // No foreign key constraint for now
  originalService: text("original_service").notNull(),
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }).notNull(),
  newService: text("new_service").notNull(),
  newAmount: decimal("new_amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  metadata: json("metadata").$type<{
    files?: Array<{ name: string; url: string; type: string }>;
    additionalServices?: Array<{ id: string; name: string; price: number }>;
    removedServices?: Array<{ id: string; name: string; price: number }>;
  }>(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type EditServiceRequest = typeof editServiceRequests.$inferSelect;
