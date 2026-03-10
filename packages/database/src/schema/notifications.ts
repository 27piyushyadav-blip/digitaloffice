import { pgTable, uuid, text, timestamp, boolean, json } from "drizzle-orm/pg-core";

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  expertId: uuid("expert_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // booking_request, booking_confirmed, session_reminder, payment, profile_approved, etc.
  isRead: boolean("is_read").default(false),
  data: json("data").$type<any>(), // Additional data like bookingId, amount, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});

export type Notification = typeof notifications.$inferSelect;
