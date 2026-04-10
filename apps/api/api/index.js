export default async function handler(req, res) {
  try {
    // Test if we can import Fastify
    const Fastify = (await import("fastify")).default;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, fastify: typeof Fastify }));
  } catch (err) {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message, stack: err.stack?.split("\n").slice(0, 5) }));
  }
}
