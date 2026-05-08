const assert = require('node:assert/strict');
const test = require('node:test');
const Tokens = require('csrf');
const {
  createCsrfProtection,
  createCsrfTokenHandler,
} = require('../csrf-protection.cjs');

const allowedOrigin = 'http://localhost:3006';

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
  const middleware = createCsrfProtection({ allowedOrigin });
  const response = createResponse();
  const next = createNextSpy();

  middleware(createRequest({}), response, next.next);

  assert.equal(next.wasCalled(), true);
  assert.equal(response.statusCode, undefined);
});

test('allows same-origin mutating requests with ambient cookies', () => {
  const middleware = createCsrfProtection({ allowedOrigin });
  const response = createResponse();
  const next = createNextSpy();

  middleware(
    createRequest({
      headers: {
        cookie: 'session=abc',
        host: 'evil.example',
        origin: allowedOrigin,
      },
    }),
    response,
    next.next,
  );

  assert.equal(next.wasCalled(), true);
  assert.equal(response.statusCode, undefined);
});

test('rejects cross-origin mutating requests with ambient cookies', () => {
  const middleware = createCsrfProtection({ allowedOrigin });
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

test('rejects mutating requests with ambient cookies and no origin evidence', () => {
  const middleware = createCsrfProtection({ allowedOrigin });
  const response = createResponse();
  const next = createNextSpy();

  middleware(
    createRequest({
      headers: {
        cookie: 'session=abc',
      },
    }),
    response,
    next.next,
  );

  assert.equal(next.wasCalled(), false);
  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { error: 'CSRF validation failed' });
});

test('issues CSRF tokens without storing secrets in cookies', () => {
  const tokens = new Tokens();
  const secret = tokens.secretSync();
  const handler = createCsrfTokenHandler({ tokens, secret });
  const tokenResponse = createResponse();

  handler(createRequest({ method: 'GET' }), tokenResponse);

  assert.deepEqual(tokenResponse.cookies, []);
  assert.equal(tokens.verify(secret, tokenResponse.body.token), true);
});

test('rejects token-bearing mutating requests without origin evidence', () => {
  const tokens = new Tokens();
  const secret = tokens.secretSync();
  const middleware = createCsrfProtection({ allowedOrigin });
  const response = createResponse();
  const next = createNextSpy();
  const token = tokens.create(secret);

  middleware(
    createRequest({
      headers: {
        cookie: 'session=abc',
        'x-csrf-token': token,
      },
    }),
    response,
    next.next,
  );

  assert.equal(next.wasCalled(), false);
  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { error: 'CSRF validation failed' });
});

test('rejects invalid CSRF tokens without origin evidence', () => {
  const middleware = createCsrfProtection({ allowedOrigin });
  const response = createResponse();
  const next = createNextSpy();

  middleware(
    createRequest({
      headers: {
        cookie: 'session=abc',
        'x-csrf-token': 'invalid-token',
      },
    }),
    response,
    next.next,
  );

  assert.equal(next.wasCalled(), false);
  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { error: 'CSRF validation failed' });
});
