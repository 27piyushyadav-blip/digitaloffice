import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { client, expert, organisation } from "./users";

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => client.id, { onDelete: "cascade" }).notNull(),
  expertId: uuid("expert_id").references(() => expert.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").references(() => organisation.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  status: text("status").default("active").notNull(), // active, flagged, deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Review = typeof reviews.$inferSelect;
