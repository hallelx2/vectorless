import { app } from "../src/app.js";

export default async function handler(req: any, res: any) {
  try {
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

    const body =
      req.method !== "GET" && req.method !== "HEAD"
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
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: { code: "server_error", message: err.message, status: 500 },
      })
    );
  }
}
