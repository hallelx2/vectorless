export default async function handler(req: any, res: any) {
  try {
    const { handle } = await import("hono/vercel");
    const { app } = await import("../src/app.js");
    return handle(app)(req, res);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: err.message,
      stack: err.stack?.split("\n").slice(0, 10),
    }));
  }
}
