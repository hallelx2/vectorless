import { Hono } from "hono";

const app = new Hono();

app.get("/test", (c) => c.json({ status: "ok", framework: "hono" }));
app.get("/health", (c) => c.json({ status: "ok", service: "vectorless-api" }));

// Vercel serverless handler - use Node.js compatible export
export default async function handler(req: any, res: any) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value as string);
  }

  const body = req.method !== "GET" && req.method !== "HEAD"
    ? await new Promise<Buffer>((resolve) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      })
    : undefined;

  const request = new Request(url.toString(), {
    method: req.method,
    headers,
    body,
  });

  const response = await app.fetch(request);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const responseBody = await response.text();
  res.end(responseBody);
}
