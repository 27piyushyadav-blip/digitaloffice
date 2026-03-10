import { pgTable, uuid, text, decimal, timestamp, boolean } from "drizzle-orm/pg-core";

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  expertId: uuid("expert_id").notNull(),
  bookingId: uuid("booking_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 10, scale: 2 }).notNull(), // Platform fee
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"), // pending, completed, failed
  type: text("type").notNull(), // session_payment, payout, refund, bonus
  description: text("description"),
  externalId: text("external_id"), // Payment gateway transaction ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const payouts = pgTable("payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  expertId: uuid("expert_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("processing"), // processing, completed, failed
  method: text("method").default("bank_transfer"), // bank_transfer, paypal, etc.
  bankAccount: text("bank_account"), // Masked account number
  transactionId: text("transaction_id"), // Bank transaction ID
  failureReason: text("failure_reason"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Transaction = typeof transactions.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
