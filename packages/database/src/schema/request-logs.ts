import { pgTable, uuid, text, timestamp, json } from "drizzle-orm/pg-core";

export const requestLogs = pgTable("request_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull(),
  requestType: text("request_type").notNull(), // 'refund', 'edit_service', 'dispute'
  action: text("action").notNull(), // 'submitted', 'approved', 'rejected', 'rescheduled', 'disputed'
  performedBy: text("performed_by").notNull(), // 'client', 'organization', 'admin'
  actorId: uuid("actor_id"),
  details: text("details").notNull(),
  metadata: json("metadata").$type<{
    amount?: string;
    reason?: string;
    newService?: string;
    newAmount?: string;
    scheduledDate?: string;
    rejectionReason?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RequestLog = typeof requestLogs.$inferSelect;
