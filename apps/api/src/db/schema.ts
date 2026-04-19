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
    treeToc: jsonb("tree_toc"),
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
    isLeaf: text("is_leaf").notNull().default("true"),
    tokenCount: integer("token_count").notNull().default(0),
    crossReferences: jsonb("cross_references"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sections_doc_id_idx").on(table.docId),
    index("sections_doc_order_idx").on(table.docId, table.orderIndex),
    index("sections_parent_id_idx").on(table.parentSectionId),
    index("sections_doc_level_idx").on(table.docId, table.level),
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

// ── OAuth 2.1 Tables (Phase 3) ──

export const oauthClientSourceEnum = pgEnum("oauth_client_source", [
  "first_party",
  "dcr",
]);

export const oauthClients = pgTable(
  "oauth_clients",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    clientName: text("client_name").notNull(),
    clientSecretHash: text("client_secret_hash"), // null for public clients
    redirectUris: text("redirect_uris").array().notNull(),
    grantTypes: text("grant_types")
      .array()
      .notNull()
      .default(["authorization_code", "refresh_token"]),
    tokenEndpointAuthMethod: text("token_endpoint_auth_method")
      .notNull()
      .default("client_secret_basic"),
    source: oauthClientSourceEnum("source").notNull().default("dcr"),
    logoUri: text("logo_uri"),
    policyUri: text("policy_uri"),
    tosUri: text("tos_uri"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("oauth_clients_name_idx").on(t.clientName)]
);

export const oauthAuthorizationCodes = pgTable("oauth_authorization_codes", {
  code: text("code").primaryKey(), // hashed before storage
  clientId: text("client_id")
    .notNull()
    .references(() => oauthClients.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  projectId: text("project_id").notNull(),
  redirectUri: text("redirect_uri").notNull(),
  scopes: text("scopes").array().notNull(),
  codeChallenge: text("code_challenge").notNull(),
  codeChallengeMethod: text("code_challenge_method").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // 10 minutes
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const oauthRefreshTokens = pgTable(
  "oauth_refresh_tokens",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    tokenHash: text("token_hash").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    projectId: text("project_id").notNull(),
    scopes: text("scopes").array().notNull(),
    parentId: text("parent_id"), // for rotation chain tracking
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // 30 days
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("oauth_refresh_tokens_hash_idx").on(t.tokenHash),
    index("oauth_refresh_tokens_user_idx").on(t.userId),
  ]
);

export const oauthConsents = pgTable(
  "oauth_consents",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    userId: text("user_id").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.id, { onDelete: "cascade" }),
    scopes: text("scopes").array().notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("oauth_consents_user_client_idx").on(t.userId, t.clientId)]
);

export const oauthRevokedJtis = pgTable("oauth_revoked_jtis", {
  jti: text("jti").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // cleanup after access-token window
});

// ── Plans & Usage Tables (Phase 4) ──

export const planEnum = pgEnum("plan", ["free", "pro", "enterprise"]);
export const usageKindEnum = pgEnum("usage_kind", [
  "query",
  "ingest_page",
  "tree_nav",
]);

export const userPlans = pgTable("user_plans", {
  userId: text("user_id").primaryKey(),
  plan: planEnum("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodStart: timestamp("current_period_start", {
    withTimezone: true,
  }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usageRecords = pgTable(
  "usage_records",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    userId: text("user_id").notNull(),
    projectId: text("project_id").notNull(),
    kind: usageKindEnum("kind").notNull(),
    count: integer("count").notNull().default(1),
    metadata: jsonb("metadata"), // doc_id, tool_name, token counts
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("usage_user_time_idx").on(t.userId, t.recordedAt),
    index("usage_kind_time_idx").on(t.kind, t.recordedAt),
  ]
);

// ── Relations ──

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

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  document: one(documents, {
    fields: [sections.docId],
    references: [documents.id],
  }),
  parent: one(sections, {
    fields: [sections.parentSectionId],
    references: [sections.id],
    relationName: "parentChild",
  }),
  children: many(sections, {
    relationName: "parentChild",
  }),
}));
