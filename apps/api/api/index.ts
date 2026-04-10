import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono();

app.get("/test", (c) => c.json({ status: "ok", framework: "hono", runtime: "vercel" }));

export default handle(app);
