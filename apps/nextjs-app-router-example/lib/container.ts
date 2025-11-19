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

// AsyncLocalStorage carries test ID through async request lifecycle
const testIdStorage = new AsyncLocalStorage<string>();

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

// Singleton instances for repositories
// In test mode, use in-memory repository with test ID isolation
// Note: In a real app, you'd also have production instances with Prisma
let userRepositoryInstance: UserRepository | null = null;

/**
 * Get or create the user repository instance.
 *
 * This demonstrates the dependency injection pattern:
 * - In test mode: InMemoryUserRepository with test ID isolation
 * - In production: Would be PrismaUserRepository with real database
 */
export const getUserRepository = (): UserRepository => {
  if (!userRepositoryInstance) {
    // For this demo, always use in-memory repository
    // In a real app, you'd check NODE_ENV and use Prisma in production
    userRepositoryInstance = new InMemoryUserRepository(getTestId);
  }
  return userRepositoryInstance;
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
  userRepositoryInstance = null;
};
