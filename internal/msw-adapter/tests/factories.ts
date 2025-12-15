import { vi } from "vitest";
import type { Logger, ScenaristMock, ScenaristScenario } from "@scenarist/core";

/**
 * Test data factory for ScenaristMock with sensible defaults.
 *
 * @param overrides - Optional partial ScenaristMock to override defaults
 * @returns Complete ScenaristMock for testing
 */
export const mockDefinition = (
  overrides?: Partial<ScenaristMock>,
): ScenaristMock => ({
  method: "GET",
  url: "https://api.example.com/users",
  response: {
    status: 200,
  },
  ...overrides,
});

/**
 * Test data factory for ScenaristScenario with sensible defaults.
 * Name and description are automatically derived from id.
 *
 * @param overrides - Optional partial ScenaristScenario to override defaults
 * @returns Complete ScenaristScenario for testing
 */
export const mockScenario = (
  overrides?: Partial<ScenaristScenario>,
): ScenaristScenario => {
  const id = overrides?.id ?? "test-scenario";
  return {
    id,
    name: overrides?.name ?? `${id} scenario`,
    description: overrides?.description ?? `Scenario for ${id}`,
    mocks: [],
    ...overrides,
  };
};

/**
 * Test data factory for Logger with vi.fn() mocks.
 * Returns fresh mock functions for each call to ensure test isolation.
 *
 * @returns Complete Logger with mock functions for testing
 */
export const createMockLogger = (): Logger => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
  isEnabled: () => true,
});
