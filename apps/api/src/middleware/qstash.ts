import type { Context, Next } from "hono";
import { Receiver } from "@upstash/qstash";
import { config } from "../config.js";
import { unauthorized } from "./error-handler.js";

const receiver = new Receiver({
  currentSigningKey: config.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: config.QSTASH_NEXT_SIGNING_KEY,
});

export async function qstashMiddleware(c: Context, next: Next) {
  const signature = c.req.header("upstash-signature");
  if (!signature) {
    throw unauthorized("Missing QStash signature");
  }

  try {
    // Clone the request so the body can still be read by the route handler
    const body = await c.req.raw.clone().text();

    await receiver.verify({
      signature,
      body,
      url: `${config.API_BASE_URL}${c.req.path}`,
    });
  } catch {
    throw unauthorized("Invalid QStash signature");
  }

  await next();
}
