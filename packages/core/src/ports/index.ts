// Driving ports (primary/input) - How external actors use the core
export type { ScenarioManager } from './driving/scenario-manager.js';

// Driven ports (secondary/output) - How core uses external services
export type { ScenarioRegistry } from './driven/scenario-registry.js';
export type { ScenarioStore } from './driven/scenario-store.js';
export type { RequestContext } from './driven/request-context.js';
export type { ResponseSelector } from './driven/response-selector.js';
export type { SequenceTracker, SequencePosition } from './driven/sequence-tracker.js';
export type { StateManager } from './driven/state-manager.js';
