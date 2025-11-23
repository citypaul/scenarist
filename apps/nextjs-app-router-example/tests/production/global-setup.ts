/**
 * Playwright Global Setup for Production Tests
 *
 * Manages server lifecycle for production E2E tests:
 * - Builds Next.js app in production mode
 * - Starts json-server (backend) and Next.js production server
 * - Waits for both servers to be ready using wait-on library
 * - Stores cleanup function for globalTeardown
 *
 * Playwright globalSetup pattern:
 * - Runs once before all tests
 * - Can return teardown function or use separate globalTeardown file
 * - We use manual process tracking with globalTeardown file
 *
 * @see https://playwright.dev/docs/test-global-setup-teardown
 */

import { spawn, execSync, type ChildProcess } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import waitOn from 'wait-on';

// Store process PIDs for teardown
const pidsFile = join(process.cwd(), '.test-server-pids.json');

export default async function globalSetup() {
  console.log('Building Next.js app in production mode...');

  // Build Next.js app with NODE_ENV=production
  execSync('pnpm build:production', {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  console.log('Build complete. Starting servers...');

  // Reset json-server database to clean state before each test run
  const dbTemplate = join(process.cwd(), 'fake-api/db.template.json');
  const dbFile = join(process.cwd(), 'fake-api/db.json');
  copyFileSync(dbTemplate, dbFile);

  // Start json-server (real backend for production tests)
  const jsonServer = spawn(
    'npx',
    [
      'json-server',
      '--watch',
      'fake-api/db.json',
      '--port',
      '3001',
      '--host',
      'localhost',
    ],
    {
      stdio: 'inherit', // Show output for debugging
      cwd: process.cwd(),
      detached: false,
    }
  );

  jsonServer.on('error', (err) => {
    console.error('json-server failed to start:', err);
  });

  // Start Next.js production server
  const nextServer = spawn('npx', ['next', 'start', '--port', '3000'], {
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: 'inherit', // Show output for debugging
    cwd: process.cwd(),
    detached: false,
  });

  nextServer.on('error', (err) => {
    console.error('Next.js server failed to start:', err);
  });

  // Wait for both servers to be ready
  // wait-on checks HTTP endpoints and retries until success or timeout
  console.log('Waiting for servers to be ready...');
  await waitOn({
    resources: [
      'http://localhost:3001/cart', // json-server endpoint
      'http://localhost:3000/api/health', // Next.js health check
    ],
    timeout: 60000, // 60 seconds (Next.js can take longer to start)
    interval: 500, // Check every 500ms
  });

  console.log('Servers ready!');

  // Store PIDs for teardown
  writeFileSync(
    pidsFile,
    JSON.stringify({
      jsonServer: jsonServer.pid,
      nextServer: nextServer.pid,
    })
  );

  // Return teardown function (Playwright will call it after tests)
  return async () => {
    console.log('Cleaning up servers...');
    jsonServer.kill();
    nextServer.kill();
  };
}
