const { URL } = require('node:url');

const safeRequestMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

const getHeaderOrigin = (headerValue) => {
  if (headerValue === undefined) {
    return undefined;
  }

  try {
    return new URL(headerValue).origin;
  } catch {
    return undefined;
  }
};

const getRequestOrigin = (req) => {
  const origin = getHeaderOrigin(req.get('origin'));

  if (origin !== undefined) {
    return origin;
  }

  return getHeaderOrigin(req.get('referer'));
};

const getAllowedOrigin = (allowedOrigin) => {
  try {
    return new URL(allowedOrigin).origin;
  } catch {
    throw new Error(`Invalid CSRF allowed origin: ${allowedOrigin}`);
  }
};

const createCsrfTokenHandler =
  ({ tokens, secret }) =>
  (_req, res) => {
    res.json({ token: tokens.create(secret) });
  };

const createCsrfProtection =
  ({ allowedOrigin }) => {
    const expectedOrigin = getAllowedOrigin(allowedOrigin);

    return (req, res, nextMiddleware) => {
      const isSafeRequest = safeRequestMethods.has(req.method);
      const hasCookies = req.get('cookie') !== undefined;

      if (
        isSafeRequest ||
        !hasCookies ||
        getRequestOrigin(req) === expectedOrigin
      ) {
        nextMiddleware();
        return;
      }

      res.status(403).json({ error: 'CSRF validation failed' });
    };
  };

module.exports = {
  createCsrfProtection,
  createCsrfTokenHandler,
};
