// Adapter contracts - Specifications that framework adapters must satisfy
// Note: These are NOT ports! The core does not depend on these.
// They define the shape that adapter implementations must expose to end users.
export type {
  ScenaristAdapter,
  BaseAdapterOptions,
} from './framework-adapter.js';
