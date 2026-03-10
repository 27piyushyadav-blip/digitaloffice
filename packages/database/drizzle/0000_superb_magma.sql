CREATE TABLE "availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expert_id" uuid NOT NULL,
	"day" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_time_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expert_id" uuid NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"reason" text,
	"is_recurring" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"expert_id" uuid NOT NULL,
	"organization_id" uuid,
	"service" text NOT NULL,
	"consultation_type" text DEFAULT 'online',
	"scheduled_date" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending',
	"payment_status" text DEFAULT 'pending',
	"meeting_url" text,
	"meeting_id" text,
	"notes" text,
	"rejection_reason" text,
	"cancellation_reason" text,
	"accepted_at" timestamp,
	"rejected_at" timestamp,
	"cancelled_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expert_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'processing',
	"method" text DEFAULT 'bank_transfer',
	"bank_account" text,
	"transaction_id" text,
	"failure_reason" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expert_id" uuid NOT NULL,
	"booking_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"commission" numeric(10, 2) NOT NULL,
	"net_amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending',
	"type" text NOT NULL,
	"description" text,
	"external_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "expert_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bio" text,
	"experience" integer DEFAULT 0,
	"specialization" text,
	"consultation_fee" numeric(10, 2),
	"languages" json,
	"education" json,
	"latest_education" text,
	"profile_image" text,
	"intro_video" text,
	"verification_status" text DEFAULT 'ONBOARDING',
	"rejection_reason" text,
	"has_pending_updates" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"verification_submitted_at" timestamp,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expert_id" uuid NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"data" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "expert_organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expert_id" uuid,
	"organization_id" uuid,
	"role" text DEFAULT 'Member',
	"status" text DEFAULT 'PENDING',
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"joined_at" timestamp,
	"left_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"industry" text,
	"location" text,
	"website" text,
	"logo" text,
	"verified" boolean DEFAULT false,
	"member_count" integer DEFAULT 0,
	"rating" numeric(3, 2) DEFAULT '0',
	"verification_status" text DEFAULT 'PENDING',
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"expert_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"meeting_url" text,
	"meeting_id" text,
	"whiteboard_url" text,
	"whiteboard_data" text,
	"status" text DEFAULT 'scheduled',
	"started_at" timestamp,
	"ended_at" timestamp,
	"duration" integer,
	"recording_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"username" text NOT NULL,
	"image" text,
	"google_id" text,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" text,
	"verification_expires" timestamp,
	"refresh_token" text,
	"consent" boolean DEFAULT false NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_email_unique" UNIQUE("email"),
	CONSTRAINT "admin_username_unique" UNIQUE("username"),
	CONSTRAINT "admin_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "client" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"username" text NOT NULL,
	"image" text,
	"google_id" text,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" text,
	"verification_expires" timestamp,
	"refresh_token" text,
	"consent" boolean DEFAULT false NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_email_unique" UNIQUE("email"),
	CONSTRAINT "client_username_unique" UNIQUE("username"),
	CONSTRAINT "client_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "expert" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"username" text NOT NULL,
	"image" text,
	"google_id" text,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" text,
	"verification_expires" timestamp,
	"refresh_token" text,
	"consent" boolean DEFAULT false NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "expert_email_unique" UNIQUE("email"),
	CONSTRAINT "expert_username_unique" UNIQUE("username"),
	CONSTRAINT "expert_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "organisation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"username" text NOT NULL,
	"image" text,
	"google_id" text,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" text,
	"verification_expires" timestamp,
	"refresh_token" text,
	"consent" boolean DEFAULT false NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organisation_email_unique" UNIQUE("email"),
	CONSTRAINT "organisation_username_unique" UNIQUE("username"),
	CONSTRAINT "organisation_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "verification_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expert_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"file_url" text NOT NULL,
	"original_file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"status" text DEFAULT 'PENDING',
	"admin_notes" text,
	"rejection_reason" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expert_organizations" ADD CONSTRAINT "expert_organizations_expert_id_expert_id_fk" FOREIGN KEY ("expert_id") REFERENCES "public"."expert"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_organizations" ADD CONSTRAINT "expert_organizations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;