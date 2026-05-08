const Tokens = require('csrf');
const express = require('express');
const next = require('next');
const {
  createCsrfProtection,
  createCsrfTokenHandler,
} = require('./csrf-protection.cjs');

const dev = process.env.NODE_ENV !== 'production';
const port = Number(process.env.NEXTJS_APP_ROUTER_PORT ?? process.env.PORT ?? 3002);
process.env.NEXT_PUBLIC_APP_BASE_URL ??= `http://localhost:${port}`;
const app = next({ dev, port, webpack: true });
const handle = app.getRequestHandler();
const csrfTokens = new Tokens();
const csrfSecret = csrfTokens.secretSync();

app.prepare().then(() => {
  const server = express();

  // Verification endpoint - only exists on custom server
  server.get('/__server-type', (_req, res) => {
    res.json({ serverType: 'custom', framework: 'express' });
  });

  server.get(
    '/__csrf',
    createCsrfTokenHandler({ tokens: csrfTokens, secret: csrfSecret }),
  );

  server.use(
    createCsrfProtection({ allowedOrigin: process.env.NEXT_PUBLIC_APP_BASE_URL }),
  );

  // Express 5 wildcard syntax - matches all routes
  server.all('/{*path}', (req, res) => handle(req, res));
  server.listen(port, () => {
    console.log(`> Custom server ready on http://localhost:${port}`);
  });
});
