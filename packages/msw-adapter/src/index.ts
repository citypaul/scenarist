// Public API
// These exports are primarily intended for use by Scenarist adapters
// (e.g., express-adapter, fastify-adapter). End users should use the
// higher-level adapter packages rather than these low-level utilities directly.

export { matchesUrl } from './matching/url-matcher.js';
export type { UrlMatchResult } from './matching/url-matcher.js';

export { findMatchingMock } from './matching/mock-matcher.js';

export { buildResponse } from './conversion/response-builder.js';
