import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  date,
  unique,
} from "drizzle-orm/pg-core";

// ─── Better Auth Tables ───

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── API Keys ───

export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  permissions: text("permissions").notNull().default("full"),
  rateLimit: integer("rate_limit").default(1000),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Usage Logs ───

export const usageLogs = pgTable("usage_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  apiKeyId: text("api_key_id").references(() => apiKeys.id),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code").notNull(),
  latencyMs: integer("latency_ms"),
  requestMeta: jsonb("request_meta"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Daily Aggregates ───

export const usageDaily = pgTable(
  "usage_daily",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    date: date("date").notNull(),
    totalRequests: integer("total_requests").notNull().default(0),
    successful: integer("successful").notNull().default(0),
    failed: integer("failed").notNull().default(0),
    avgLatencyMs: integer("avg_latency_ms"),
    endpointBreakdown: jsonb("endpoint_breakdown"),
  },
  (table) => [unique("usage_daily_user_date").on(table.userId, table.date)]
);

// ─── Playground Sessions ───

export const playgroundSessions = pgTable("playground_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  name: text("name"),
  query: text("query").notNull(),
  docIds: text("doc_ids").array(),
  tocStrategy: text("toc_strategy"),
  selectedSections: jsonb("selected_sections"),
  reasoning: text("reasoning"),
  timing: jsonb("timing"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── LLM Keys (BYOK - Bring Your Own Key) ───

export const llmKeys = pgTable("llm_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'gemini' | 'anthropic' | 'openai'
  label: text("label").notNull(),
  encryptedKey: text("encrypted_key").notNull(), // AES-256-GCM encrypted
  keyMask: text("key_mask").notNull(), // e.g. "AIzaSyD-...cdef"
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
