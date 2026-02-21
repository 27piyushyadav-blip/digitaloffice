import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";

const getColumns = () => ({
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  username: text("username").notNull().unique(),
  image: text("image"),
  googleId: text("google_id").unique(),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  verificationToken: text("verification_token"),
  verificationExpires: timestamp("verification_expires"),
  refreshToken: text("refresh_token"),
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