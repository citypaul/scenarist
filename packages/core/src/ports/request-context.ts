/**
 * Secondary port for extracting context from HTTP requests.
 * Framework adapters implement this to provide test ID and mock control.
 */
export interface RequestContext {
  /**
   * Extract the test ID from the request.
   * This enables test isolation.
   */
  getTestId(): string;

  /**
   * Determine if mocks should be enabled for this request.
   * Allows per-request control of mocking.
   */
  isMockEnabled(): boolean;

  /**
   * Get all request headers.
   * Useful for debugging and logging.
   */
  getHeaders(): Record<string, string | string[] | undefined>;

  /**
   * Get the request hostname.
   * Used to determine passthrough behavior.
   */
  getHostname(): string;
}
