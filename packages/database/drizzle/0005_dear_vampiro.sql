ALTER TABLE "organizations" ADD COLUMN "intro_video" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "documents" json;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "has_pending_updates" boolean DEFAULT false;