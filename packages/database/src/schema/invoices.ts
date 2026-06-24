import { pgTable, uuid, text, decimal, timestamp, json } from "drizzle-orm/pg-core";
import { bookings } from "./bookings";

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // 'payment', 'edit_service', 'refund'
  description: text("description"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00").notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("issued").notNull(), // 'issued', 'paid', 'refunded', 'void'
  metadata: json("metadata").$type<{
    services?: Array<{ name: string; price: number; quantity: number }>;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    rejectionReason?: string;
    refundReason?: string;
  }>(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});
