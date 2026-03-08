import http from "http";
import { parse } from "url";

const port = parseInt(process.env.PORT || "5000", 10);
let nextHandler;
let isReady = false;

const server = http.createServer(async (req, res) => {
  if (!isReady) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Loading</title><meta http-equiv='refresh' content='2'></head><body><p>Starting up...</p></body></html>");
    return;
  }

  try {
    const parsedUrl = parse(req.url, true);
    await nextHandler(req, res, parsedUrl);
  } catch (err) {
    console.error("Request handler error:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    }
  }
});

server.listen(port, "0.0.0.0", async () => {
  console.log(`Health check server running on port ${port}`);

  try {
    const next = (await import("next")).default;
    const app = next({ dev: false, hostname: "0.0.0.0", port });
    nextHandler = app.getRequestHandler();
    await app.prepare();
    isReady = true;
    console.log(`Next.js production server ready on port ${port}`);
  } catch (err) {
    console.error("Failed to initialize Next.js:", err);
    process.exit(1);
  }
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down...");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down...");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
});
