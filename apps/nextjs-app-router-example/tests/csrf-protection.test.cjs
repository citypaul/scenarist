const assert = require('node:assert/strict');
const test = require('node:test');
const Tokens = require('csrf');
const {
  createCsrfProtection,
  createCsrfTokenHandler,
  csrfCookieName,
} = require('../csrf-protection.cjs');

const createRequest = ({ method = 'POST', headers = {}, protocol = 'http' }) => ({
  method,
  protocol,
  get: (name) => headers[name.toLowerCase()],
});

const createResponse = () => ({
  cookies: [],
  body: undefined,
  statusCode: undefined,
  cookie(name, value, options) {
    this.cookies.push({ name, value, options });
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  },
});

const createNextSpy = () => {
  const calls = [];

  return {
    next: () => calls.push(true),
    wasCalled: () => calls.length > 0,
  };
};

test('allows mutating requests without ambient cookies', () => {
  const tokens = new Tokens();
  const middleware = createCsrfProtection({ tokens });
  const response = createResponse();
  const next = createNextSpy();

  middleware(createRequest({}), response, next.next);

  assert.equal(next.wasCalled(), true);
  assert.equal(response.statusCode, undefined);
});

test('allows same-origin mutating requests with ambient cookies', () => {
  const tokens = new Tokens();
  const middleware = createCsrfProtection({ tokens });
  const response = createResponse();
  const next = createNextSpy();

  middleware(
    createRequest({
      headers: {
        cookie: 'session=abc',
        host: 'localhost:3006',
        origin: 'http://localhost:3006',
      },
    }),
    response,
    next.next,
  );

  assert.equal(next.wasCalled(), true);
  assert.equal(response.statusCode, undefined);
});

test('rejects cross-origin mutating requests with ambient cookies', () => {
  const tokens = new Tokens();
  const middleware = createCsrfProtection({ tokens });
  const response = createResponse();
  const next = createNextSpy();

  middleware(
    createRequest({
      headers: {
        cookie: 'session=abc',
        host: 'localhost:3006',
        origin: 'http://evil.example',
      },
    }),
    response,
    next.next,
  );

  assert.equal(next.wasCalled(), false);
  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { error: 'CSRF validation failed' });
});

test('allows token-bearing mutating requests without origin evidence', () => {
  const tokens = new Tokens();
  const handler = createCsrfTokenHandler({ tokens, secureCookies: false });
  const tokenResponse = createResponse();

  handler(createRequest({ method: 'GET' }), tokenResponse);

  const csrfCookie = tokenResponse.cookies.find(
    (cookie) => cookie.name === csrfCookieName,
  );
  assert.notEqual(csrfCookie, undefined);
  assert.deepEqual(csrfCookie.options, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
  });

  const middleware = createCsrfProtection({ tokens });
  const protectedResponse = createResponse();
  const next = createNextSpy();

  middleware(
    createRequest({
      headers: {
        cookie: `${csrfCookieName}=${encodeURIComponent(csrfCookie.value)}`,
        'x-csrf-token': tokenResponse.body.token,
      },
    }),
    protectedResponse,
    next.next,
  );

  assert.equal(next.wasCalled(), true);
  assert.equal(protectedResponse.statusCode, undefined);
});
