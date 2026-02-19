import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";

const getColumns = () => ({
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  username: text("username").notNull().unique(),
  image: text("image"),
  consent: boolean("consent").default(false).notNull(),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const client = pgTable("client", getColumns());
export const expert = pgTable("expert", getColumns());
export const organisation = pgTable("organisation", getColumns());
export const admin = pgTable("admin", getColumns());
// https://github.com/27piyushyadav-blip/digitaloffices2/tree/restructure