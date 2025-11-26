// Use Express 4 for custom server (Express 5 has incompatibility with Next.js Pages API routes)
const express = require('express4');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, port: 3000 });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  server.all('*', (req, res) => handle(req, res));
  server.listen(3000, () => {
    console.log('> Custom server ready on http://localhost:3000');
  });
});
