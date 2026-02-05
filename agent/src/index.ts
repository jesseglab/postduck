#!/usr/bin/env node

import http from "http";
import { proxyRequest } from "./proxy";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 19199;
const VERSION = "0.1.0";

function setCorsHeaders(res: http.ServerResponse, origin?: string) {
  // Allow requests from postduck.org and localhost (for development)
  if (
    !origin ||
    origin.includes("postduck.org") ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1")
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;

  // Handle OPTIONS preflight requests
  if (req.method === "OPTIONS") {
    setCorsHeaders(res, origin);
    res.writeHead(200);
    res.end();
    return;
  }

  // Set CORS headers for all responses
  setCorsHeaders(res, origin);

  // Health check endpoint
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", version: VERSION }));
    return;
  }

  // Proxy endpoint
  if (req.method === "POST" && req.url === "/proxy") {
    try {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const params = JSON.parse(body);
          const result = await proxyRequest(params);

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              statusCode: 0,
              headers: {},
              body: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              duration: 0,
              size: 0,
            })
          );
        }
      });
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          statusCode: 0,
          headers: {},
          body: `Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          duration: 0,
          size: 0,
        })
      );
    }
    return;
  }

  // 404 for other routes
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`\n🚀 Postduck Agent v${VERSION}`);
  console.log(`   Listening on http://localhost:${PORT}`);
  console.log(`   Ready to proxy localhost requests!\n`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Shutting down Postduck Agent...");
  server.close(() => {
    console.log("✅ Agent stopped\n");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  server.close(() => {
    process.exit(0);
  });
});
