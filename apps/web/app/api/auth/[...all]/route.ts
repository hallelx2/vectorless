import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Force dynamic rendering — auth requires runtime env vars
export const dynamic = "force-dynamic";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;
export const POST = handler.POST;

// Handle CORS preflight for Cloudflare Workers
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
