/**
 * Global Setup for Production Tests
 *
 * Manages server lifecycle for production E2E tests:
 * - Starts json-server (backend) and production Express server
 * - Waits for both servers to be ready using wait-on library
 * - Guarantees cleanup on teardown (even if tests crash)
 *
 * This eliminates mutable variables (let) from tests and uses
 * well-tested library for server readiness checking.
 */

import { spawn } from "node:child_process";
import { copyFileSync } from "node:fs";
import { join } from "node:path";
import waitOn from "wait-on";

export async function setup() {
  // Reset json-server database to clean state before each test run
  const dbTemplate = join(process.cwd(), "fake-api/db.template.json");
  const dbFile = join(process.cwd(), "fake-api/db.json");
  copyFileSync(dbTemplate, dbFile);

  // Start json-server (real backend for production tests)
  const jsonServer = spawn(
    "npx",
    [
      "json-server",
      "fake-api/db.json",
      "--port",
      "3001",
      "--host",
      "localhost",
    ],
    {
      stdio: "inherit", // Show output for debugging
      cwd: process.cwd(),
    },
  );

  jsonServer.on("error", (err) => {
    console.error("json-server failed to start:", err);
  });

  // Start production Express server
  const expressServer = spawn("node", ["dist/server.js"], {
    env: { ...process.env, NODE_ENV: "production", PORT: "3000" },
    stdio: "inherit", // Show output for debugging
    cwd: process.cwd(),
  });

  expressServer.on("error", (err) => {
    console.error("Express server failed to start:", err);
  });

  // Wait for both servers to be ready
  // wait-on checks HTTP endpoints and retries until success or timeout
  await waitOn({
    resources: [
      "http://localhost:3001/cart", // json-server endpoint
      "http://localhost:3000/health", // Express health check
    ],
    timeout: 30000, // 30 seconds
    interval: 500, // Check every 500ms
  });

  // Return cleanup function (Vitest calls this automatically on teardown)
  return async () => {
    jsonServer.kill();
    expressServer.kill();
  };
}
