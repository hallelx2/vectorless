import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().default("vectorless-docs"),
  R2_PUBLIC_URL: z.string().optional(),
  QSTASH_URL: z.string().url().default("https://qstash-us-east-1.upstash.io"),
  QSTASH_TOKEN: z.string().min(1),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1),
  API_BASE_URL: z.string().url().default("http://localhost:3001"),
  PORT: z.coerce.number().default(3001),
  LLM_PROVIDER: z.enum(["anthropic", "gemini"]).default("gemini"),
  ANTHROPIC_API_KEY: z.string().optional(),
  // Vertex AI (Gemini via Google Cloud) — uses service account credentials JSON
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  GOOGLE_CLOUD_LOCATION: z.string().default("us-central1"),
  OPENAI_API_KEY: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(16),
});

function loadConfig() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    console.error("❌ Invalid environment variables:", JSON.stringify(errors));
    throw new Error(`Missing env vars: ${Object.keys(errors).join(", ")}`);
  }
  return parsed.data;
}

export const config = loadConfig();
export type Config = z.infer<typeof envSchema>;
