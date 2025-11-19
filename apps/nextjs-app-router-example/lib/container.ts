/**
 * Dependency injection container for repository pattern.
 *
 * Uses AsyncLocalStorage to carry the test ID through the async request
 * lifecycle - the same pattern Scenarist uses internally for HTTP mocking.
 *
 * In test mode (NODE_ENV=test), uses in-memory repositories with test ID isolation.
 * In production mode, would use Prisma repositories with real database.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import type { UserRepository } from './repositories/user-repository';
import { InMemoryUserRepository } from './repositories/in-memory-user-repository';

// Global declarations for Next.js module isolation workaround
declare global {
  var __test_id_storage: AsyncLocalStorage<string> | undefined;
  var __user_repository_instance: UserRepository | undefined;
}

// AsyncLocalStorage carries test ID through async request lifecycle
// CRITICAL: Must use global to share across different Next.js code paths
const testIdStorage = global.__test_id_storage ?? (global.__test_id_storage = new AsyncLocalStorage<string>());

/**
 * Get the current test ID from AsyncLocalStorage.
 * Returns 'default-test' if no test ID is set.
 */
export const getTestId = (): string => {
  return testIdStorage.getStore() ?? 'default-test';
};

/**
 * Run a function with a specific test ID in context.
 * The test ID will be available via getTestId() throughout the async call chain.
 */
export const runWithTestId = <T>(testId: string, fn: () => T): T => {
  return testIdStorage.run(testId, fn);
};

/**
 * Get or create the user repository instance.
 *
 * This demonstrates the dependency injection pattern:
 * - In test mode: InMemoryUserRepository with test ID isolation
 * - In production: Would be PrismaUserRepository with real database
 */
export const getUserRepository = (): UserRepository => {
  if (!global.__user_repository_instance) {
    // For this demo, always use in-memory repository
    // In a real app, you'd check NODE_ENV and use Prisma in production
    global.__user_repository_instance = new InMemoryUserRepository(getTestId);
  }
  return global.__user_repository_instance;
};

/**
 * Create all repositories.
 * Convenience function to get all repositories at once.
 */
export const createRepositories = (): { userRepository: UserRepository } => {
  return {
    userRepository: getUserRepository(),
  };
};

/**
 * Clear the repository instance (for testing).
 * This allows resetting state between test runs.
 */
export const clearRepositoryInstance = (): void => {
  global.__user_repository_instance = undefined;
};
