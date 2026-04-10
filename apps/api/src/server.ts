import { serve } from "@hono/node-server";
import { config } from "./config.js";
import { app } from "./app.js";

serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  console.log(`Vectorless API running on port ${info.port}`);
});
