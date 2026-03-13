CREATE TABLE "conversation_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar DEFAULT 'participant' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"last_read_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar NOT NULL,
	"client_id" uuid NOT NULL,
	"expert_id" uuid,
	"organization_id" uuid,
	"status" varchar DEFAULT 'active' NOT NULL,
	"last_message_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_type" varchar NOT NULL,
	"recipient_id" uuid NOT NULL,
	"recipient_type" varchar NOT NULL,
	"content" text NOT NULL,
	"message_type" varchar DEFAULT 'text' NOT NULL,
	"file_url" text,
	"file_name" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"is_edited" boolean DEFAULT false NOT NULL,
	"edited_at" timestamp,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "typing_indicators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"user_type" varchar NOT NULL,
	"is_typing" boolean DEFAULT true NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_expert_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."expert"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_expert_id_expert_id_fk" FOREIGN KEY ("expert_id") REFERENCES "public"."expert"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_client_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "typing_indicators" ADD CONSTRAINT "typing_indicators_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "typing_indicators" ADD CONSTRAINT "typing_indicators_user_id_client_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_participant_conversation_id" ON "conversation_participants" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_participant_user_id" ON "conversation_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_conversation_client_id" ON "conversations" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_conversation_expert_id" ON "conversations" USING btree ("expert_id");--> statement-breakpoint
CREATE INDEX "idx_conversation_organization_id" ON "conversations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_message_conversation_id" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_message_sender_id" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_message_recipient_id" ON "messages" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_message_created_at" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_typing_conversation_id" ON "typing_indicators" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_typing_user_id" ON "typing_indicators" USING btree ("user_id");