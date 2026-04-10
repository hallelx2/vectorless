// Simple test handler to verify Vercel function works
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ status: "ok", service: "vectorless-api", runtime: "vercel" }));
}
