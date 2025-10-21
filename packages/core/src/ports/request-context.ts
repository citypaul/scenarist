/**
 * Secondary port for extracting context from HTTP requests.
 * Framework adapters implement this to provide test ID and mock control.
 *
 * **Implementation Pattern:**
 * Implementations should accept ScenaristConfig to determine which headers
 * to read and what defaults to apply.
 *
 * @example
 * ```typescript
 * class ExpressRequestContext implements RequestContext {
 *   constructor(
 *     private readonly req: Request,
 *     private readonly config: ScenaristConfig
 *   ) {}
 *
 *   getTestId(): string {
 *     const header = this.req.headers[this.config.headers.testId];
 *     return typeof header === 'string' ? header : this.config.defaultTestId;
 *   }
 *
 *   isMockEnabled(): boolean {
 *     const header = this.req.headers[this.config.headers.mockEnabled];
 *     return header === 'true';
 *   }
 * }
 * ```
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
