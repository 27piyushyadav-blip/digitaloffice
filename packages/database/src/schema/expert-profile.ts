import { pgTable, uuid, text, integer, decimal, json, boolean, timestamp } from "drizzle-orm/pg-core";

export const expertProfile = pgTable("expert_profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  bio: text("bio"),
  experience: integer("experience").default(0),
  specialization: text("specialization"),
  consultationFee: decimal("consultation_fee", { precision: 10, scale: 2 }),
  languages: json("languages").$type<string[]>(),
  education: json("education").$type<Array<{
    degree: string;
    fieldOfStudy: string;
    institution: string;
    startDate: string;
    endDate: string;
    current: boolean;
  }>>(),
  latestEducation: text("latest_education"),
  profileImage: text("profile_image"),
  introVideo: text("intro_video"),
  verificationStatus: text("verification_status").default("ONBOARDING"), // ONBOARDING, PENDING_INITIAL, REJECTED, LIVE
  rejectionReason: text("rejection_reason"),
  hasPendingUpdates: boolean("has_pending_updates").default(false),
  isVerified: boolean("is_verified").default(false),
  verificationSubmittedAt: timestamp("verification_submitted_at"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
  
  // Additional profile fields
  timezone: text("timezone"),
  phone: text("phone"),
  gender: text("gender"),
  location: text("location"),
  socialLinks: json("social_links").$type<Record<string, string>>(),
  tags: json("tags").$type<string[]>(),
  workHistory: json("work_history").$type<Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    current: boolean;
  }>>(),
  services: json("services").$type<Array<{
    name: string;
    duration: number;
    videoPrice: number;
    clinicPrice: number;
    currency: string;
    description: string;
  }>>(),
  documents: json("documents").$type<Array<{
    title: string;
    category: string;
    url: string;
    fileType?: string;
    fileSize?: string;
  }>>(),
  availability: json("availability").$type<Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>>(),
  leaves: json("leaves").$type<Array<{
    date: string | Date;
    note?: string;
    isRecurring?: boolean;
  }>>(),
});

export type ExpertProfile = typeof expertProfile.$inferSelect;
