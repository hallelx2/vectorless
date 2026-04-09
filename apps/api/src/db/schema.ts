import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";

// LLM Provider enum
export const llmProviderEnum = pgEnum("llm_provider", [
  "gemini",
  "anthropic",
  "openai",
]);

// Enums
export const sourceTypeEnum = pgEnum("source_type", [
  "pdf",
  "docx",
  "txt",
  "url",
]);
export const tocStrategyEnum = pgEnum("toc_strategy", [
  "extract",
  "generate",
  "hybrid",
]);
export const documentStatusEnum = pgEnum("document_status", [
  "processing",
  "ready",
  "failed",
]);
export const apiKeyStatusEnum = pgEnum("api_key_status", [
  "active",
  "revoked",
]);
export const retrievalModeEnum = pgEnum("retrieval_mode", [
  "vectorless",
  "hybrid",
  "vector",
]);
export const relationshipTypeEnum = pgEnum("relationship_type", [
  "adjacent",
  "co_retrieved",
  "cross_reference",
  "similar",
]);

// Helper for generating IDs
const generateId = () => nanoid(21);

// Projects table
export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// API Keys table
export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    status: apiKeyStatusEnum("status").notNull().default("active"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("api_keys_key_hash_idx").on(table.keyHash),
    index("api_keys_project_id_idx").on(table.projectId),
  ]
);

// Documents table
export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    sourceType: sourceTypeEnum("source_type").notNull(),
    tocStrategy: tocStrategyEnum("toc_strategy").notNull().default("extract"),
    toc: jsonb("toc"),
    sectionCount: integer("section_count"),
    status: documentStatusEnum("status").notNull().default("processing"),
    originalFileUrl: text("original_file_url"),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("documents_project_id_idx").on(table.projectId),
    index("documents_status_idx").on(table.status),
  ]
);

// Sections table
export const sections = pgTable(
  "sections",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    docId: text("doc_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    parentSectionId: text("parent_section_id"),
    title: text("title").notNull(),
    summary: text("summary"),
    content: text("content").notNull(),
    pageRange: jsonb("page_range"),
    orderIndex: integer("order_index").notNull(),
    level: integer("level").notNull().default(1),
    tokenCount: integer("token_count").notNull().default(0),
    crossReferences: jsonb("cross_references"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sections_doc_id_idx").on(table.docId),
    index("sections_doc_order_idx").on(table.docId, table.orderIndex),
  ]
);

// Query Logs table
export const queryLogs = pgTable(
  "query_logs",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    documentId: text("document_id").references(() => documents.id, {
      onDelete: "set null",
    }),
    queryText: text("query_text").notNull(),
    retrievalMode: retrievalModeEnum("retrieval_mode").notNull(),
    sectionsSelected: text("sections_selected")
      .array()
      .notNull()
      .default([]),
    llmReasoning: text("llm_reasoning"),
    satisfaction: integer("satisfaction"),
    latencyMs: integer("latency_ms"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("query_logs_project_id_idx").on(table.projectId),
    index("query_logs_document_id_idx").on(table.documentId),
  ]
);

// LLM Keys table (BYOK — Bring Your Own Key)
export const llmKeys = pgTable(
  "llm_keys",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    provider: llmProviderEnum("provider").notNull(),
    label: text("label").notNull(), // e.g. "My Gemini Key", "Production Anthropic"
    encryptedKey: text("encrypted_key").notNull(), // AES-256-GCM encrypted
    keyMask: text("key_mask").notNull(), // e.g. "sk-ant-a...3xfQ" for display
    isActive: text("is_active").notNull().default("true"), // "true" or "false"
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("llm_keys_project_id_idx").on(table.projectId),
    index("llm_keys_project_provider_idx").on(table.projectId, table.provider),
  ]
);

// Section Relationships table
export const sectionRelationships = pgTable(
  "section_relationships",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    sectionAId: text("section_a_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    sectionBId: text("section_b_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    relationshipType: relationshipTypeEnum("relationship_type").notNull(),
    weight: real("weight").notNull().default(1.0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("section_rel_unique_idx").on(
      table.sectionAId,
      table.sectionBId,
      table.relationshipType
    ),
  ]
);

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  apiKeys: many(apiKeys),
  llmKeys: many(llmKeys),
  documents: many(documents),
  queryLogs: many(queryLogs),
}));

export const llmKeysRelations = relations(llmKeys, ({ one }) => ({
  project: one(projects, {
    fields: [llmKeys.projectId],
    references: [projects.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  sections: many(sections),
}));

export const sectionsRelations = relations(sections, ({ one }) => ({
  document: one(documents, {
    fields: [sections.docId],
    references: [documents.id],
  }),
}));
