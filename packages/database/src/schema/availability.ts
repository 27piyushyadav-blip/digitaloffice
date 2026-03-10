import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const availability = pgTable("availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  expertId: uuid("expert_id").notNull(),
  day: text("day").notNull(), // Monday, Tuesday, etc.
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const blockedTimeSlots = pgTable("blocked_time_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  expertId: uuid("expert_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"), // vacation, holiday, personal time, etc.
  isRecurring: boolean("is_recurring").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Availability = typeof availability.$inferSelect;
export type BlockedTimeSlot = typeof blockedTimeSlots.$inferSelect;
