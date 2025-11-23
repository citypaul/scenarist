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

import { spawn, type ChildProcess } from 'node:child_process';
import waitOn from 'wait-on';

const processes: ChildProcess[] = [];

export async function setup() {
  // Start json-server (real backend for production tests)
  processes.push(
    spawn(
      'npx',
      [
        'json-server',
        '--watch',
        'fake-api/db.json',
        '--port',
        '3001',
        '--host',
        '127.0.0.1',
      ],
      {
        stdio: 'ignore',
        cwd: process.cwd(),
      }
    )
  );

  // Start production Express server
  processes.push(
    spawn('node', ['dist/server.js'], {
      env: { ...process.env, NODE_ENV: 'production', PORT: '3000' },
      stdio: 'ignore',
      cwd: process.cwd(),
    })
  );

  // Wait for both servers to be ready
  // wait-on checks HTTP endpoints and retries until success or timeout
  await waitOn({
    resources: [
      'http://127.0.0.1:3001/cart', // json-server endpoint
      'http://localhost:3000/health', // Express health check
    ],
    timeout: 30000, // 30 seconds
    interval: 500, // Check every 500ms
  });
}

export async function teardown() {
  // Kill all spawned processes
  // Guaranteed to run even if tests crash
  processes.forEach((process) => process.kill());
}
