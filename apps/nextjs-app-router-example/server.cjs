const express = require('express');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, port: 3002 });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  server.all('/{*path}', (req, res) => handle(req, res));
  server.listen(3002, () => {
    console.log('> Custom server ready on http://localhost:3002');
  });
});
