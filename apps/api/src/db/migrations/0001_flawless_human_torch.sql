CREATE TYPE "public"."llm_provider" AS ENUM('gemini', 'anthropic', 'openai');--> statement-breakpoint
CREATE TABLE "llm_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"provider" "llm_provider" NOT NULL,
	"label" text NOT NULL,
	"encrypted_key" text NOT NULL,
	"key_mask" text NOT NULL,
	"is_active" text DEFAULT 'true' NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "llm_keys" ADD CONSTRAINT "llm_keys_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "llm_keys_project_id_idx" ON "llm_keys" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "llm_keys_project_provider_idx" ON "llm_keys" USING btree ("project_id","provider");