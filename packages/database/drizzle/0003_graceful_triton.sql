ALTER TABLE "expert_profile" ADD COLUMN "timezone" text;--> statement-breakpoint
ALTER TABLE "expert_profile" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "expert_profile" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "expert_profile" ADD COLUMN "social_links" json;--> statement-breakpoint
ALTER TABLE "expert_profile" ADD COLUMN "tags" json;--> statement-breakpoint
ALTER TABLE "expert_profile" ADD COLUMN "work_history" json;--> statement-breakpoint
ALTER TABLE "expert_profile" ADD COLUMN "services" json;--> statement-breakpoint
ALTER TABLE "expert_profile" ADD COLUMN "documents" json;--> statement-breakpoint
ALTER TABLE "expert_profile" ADD COLUMN "availability" json;--> statement-breakpoint
ALTER TABLE "expert_profile" ADD COLUMN "leaves" json;