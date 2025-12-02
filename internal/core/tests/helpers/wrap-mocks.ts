import type {
  ScenaristMock,
  ScenaristMockWithParams,
} from "../../src/types/index.js";

/**
 * Helper to wrap mocks in ScenaristMockWithParams format.
 * The ResponseSelector expects mocks with extracted path params,
 * but tests that don't use path params can use this to wrap with empty params.
 */
export const wrapMocks = (
  mocks: ReadonlyArray<ScenaristMock>,
): ReadonlyArray<ScenaristMockWithParams> => {
  return mocks.map((mock) => ({ mock, params: {} }));
};
