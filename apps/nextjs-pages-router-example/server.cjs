// Use Express 4 for custom server (Express 5 has incompatibility with Next.js Pages API routes)
const express = require('express4');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, port: 3000 });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Verification endpoint - only exists on custom server
  server.get('/__server-type', (_req, res) => {
    res.json({ serverType: 'custom', framework: 'express' });
  });

  // Express 4 wildcard syntax - matches all routes
  server.all('*', (req, res) => handle(req, res));
  server.listen(3000, () => {
    console.log('> Custom server ready on http://localhost:3000');
  });
});
