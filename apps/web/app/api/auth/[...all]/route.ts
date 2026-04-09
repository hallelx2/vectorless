import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Force dynamic rendering — auth requires runtime env vars
export const dynamic = "force-dynamic";

export const { GET, POST } = toNextJsHandler(auth);
