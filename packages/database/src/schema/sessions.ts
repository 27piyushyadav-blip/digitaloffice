import { pgTable, uuid, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull(),
  expertId: uuid("expert_id").notNull(),
  clientId: uuid("client_id").notNull(),
  meetingUrl: text("meeting_url"),
  meetingId: text("meeting_id"), // External video service ID
  whiteboardUrl: text("whiteboard_url"),
  whiteboardData: text("whiteboard_data"), // Saved whiteboard content
  status: text("status").default("scheduled"), // scheduled, started, ended, cancelled
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // Actual session duration in minutes
  recordingUrl: text("recording_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Session = typeof sessions.$inferSelect;
