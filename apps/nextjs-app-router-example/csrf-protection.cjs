const { URL } = require('node:url');

const csrfCookieName = 'scenarist-csrf-secret';
const safeRequestMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

const getCookieValue = (cookieHeader, cookieName) => {
  const cookie = (cookieHeader ?? '')
    .split(';')
    .map((candidate) => candidate.trim())
    .find((candidate) => candidate.startsWith(`${cookieName}=`));

  return cookie === undefined
    ? undefined
    : decodeURIComponent(cookie.slice(cookieName.length + 1));
};

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

const hasSameOriginEvidence = (req) => {
  const host = req.get('host');

  if (host === undefined) {
    return false;
  }

  const expectedOrigin = `${req.protocol}://${host}`;
  const origin = getHeaderOrigin(req.get('origin'));
  const refererOrigin = getHeaderOrigin(req.get('referer'));

  return origin === expectedOrigin || refererOrigin === expectedOrigin;
};

const hasValidCsrfToken = (req, tokens, cookieName) => {
  const token = req.get('x-csrf-token');
  const secret = getCookieValue(req.get('cookie'), cookieName);

  return (
    token !== undefined && secret !== undefined && tokens.verify(secret, token)
  );
};

const createCsrfTokenHandler =
  ({ tokens, cookieName = csrfCookieName, secureCookies }) =>
  (req, res) => {
    const existingSecret = getCookieValue(req.get('cookie'), cookieName);
    const secret = existingSecret ?? tokens.secretSync();

    res.cookie(cookieName, secret, {
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookies,
    });
    res.json({ token: tokens.create(secret) });
  };

const createCsrfProtection =
  ({ tokens, cookieName = csrfCookieName }) =>
  (req, res, nextMiddleware) => {
    const isSafeRequest = safeRequestMethods.has(req.method);
    const hasCookies = req.get('cookie') !== undefined;

    if (
      isSafeRequest ||
      !hasCookies ||
      hasSameOriginEvidence(req) ||
      hasValidCsrfToken(req, tokens, cookieName)
    ) {
      nextMiddleware();
      return;
    }

    res.status(403).json({ error: 'CSRF validation failed' });
  };

module.exports = {
  createCsrfProtection,
  createCsrfTokenHandler,
  csrfCookieName,
};
