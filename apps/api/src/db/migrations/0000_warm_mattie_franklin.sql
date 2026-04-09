CREATE TYPE "public"."api_key_status" AS ENUM('active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('adjacent', 'co_retrieved', 'cross_reference', 'similar');--> statement-breakpoint
CREATE TYPE "public"."retrieval_mode" AS ENUM('vectorless', 'hybrid', 'vector');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('pdf', 'docx', 'txt', 'url');--> statement-breakpoint
CREATE TYPE "public"."toc_strategy" AS ENUM('extract', 'generate', 'hybrid');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"status" "api_key_status" DEFAULT 'active' NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"source_type" "source_type" NOT NULL,
	"toc_strategy" "toc_strategy" DEFAULT 'extract' NOT NULL,
	"toc" jsonb,
	"section_count" integer,
	"status" "document_status" DEFAULT 'processing' NOT NULL,
	"original_file_url" text,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "query_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"document_id" text,
	"query_text" text NOT NULL,
	"retrieval_mode" "retrieval_mode" NOT NULL,
	"sections_selected" text[] DEFAULT '{}' NOT NULL,
	"llm_reasoning" text,
	"satisfaction" integer,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "section_relationships" (
	"id" text PRIMARY KEY NOT NULL,
	"section_a_id" text NOT NULL,
	"section_b_id" text NOT NULL,
	"relationship_type" "relationship_type" NOT NULL,
	"weight" real DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" text PRIMARY KEY NOT NULL,
	"doc_id" text NOT NULL,
	"parent_section_id" text,
	"title" text NOT NULL,
	"summary" text,
	"content" text NOT NULL,
	"page_range" jsonb,
	"order_index" integer NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"cross_references" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "query_logs" ADD CONSTRAINT "query_logs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "query_logs" ADD CONSTRAINT "query_logs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_relationships" ADD CONSTRAINT "section_relationships_section_a_id_sections_id_fk" FOREIGN KEY ("section_a_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_relationships" ADD CONSTRAINT "section_relationships_section_b_id_sections_id_fk" FOREIGN KEY ("section_b_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_doc_id_documents_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_key_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_project_id_idx" ON "api_keys" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "documents_project_id_idx" ON "documents" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "query_logs_project_id_idx" ON "query_logs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "query_logs_document_id_idx" ON "query_logs" USING btree ("document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "section_rel_unique_idx" ON "section_relationships" USING btree ("section_a_id","section_b_id","relationship_type");--> statement-breakpoint
CREATE INDEX "sections_doc_id_idx" ON "sections" USING btree ("doc_id");--> statement-breakpoint
CREATE INDEX "sections_doc_order_idx" ON "sections" USING btree ("doc_id","order_index");