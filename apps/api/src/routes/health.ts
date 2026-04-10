import { Hono } from "hono";
import type { Variables } from "../app.js";

const app = new Hono<{ Variables: Variables }>();

app.get("/health", async (c) => {
  return c.json({
    status: "ok",
    service: "vectorless-api",
    timestamp: new Date().toISOString(),
  });
});

export { app as healthRoutes };
