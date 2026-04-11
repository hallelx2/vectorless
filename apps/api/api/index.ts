let appInstance: any = null;
let initError: any = null;

async function getApp() {
  if (appInstance) return appInstance;
  if (initError) throw initError;
  try {
    const mod = await import("../src/app.js");
    appInstance = mod.app;
    return appInstance;
  } catch (err) {
    initError = err;
    throw err;
  }
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    const url = new URL(
      req.url || "/",
      `http://${req.headers.host || "localhost"}`
    );

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value)
        headers.set(
          key,
          Array.isArray(value) ? value.join(", ") : (value as string)
        );
    }

    let body: any = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await new Promise<Buffer>((resolve) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    const init: RequestInit = {
      method: req.method,
      headers,
    };

    // Only set body for methods that support it
    if (body && body.length > 0) {
      init.body = body;
      // Required for Request with body in Node.js
      (init as any).duplex = "half";
    }

    const request = new Request(url.toString(), init);
    const response = await app.fetch(request);

    res.statusCode = response.status;
    response.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      const arrayBuffer = await response.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error("Handler error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: {
          code: "server_error",
          message: err.message,
          status: 500,
          stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
        },
      })
    );
  }
}
