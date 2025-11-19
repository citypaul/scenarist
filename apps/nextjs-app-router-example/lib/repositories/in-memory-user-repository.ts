/**
 * Test implementation of UserRepository with test ID isolation.
 *
 * This provides the same isolation model as Scenarist's HTTP mocking:
 * - Each test ID gets its own isolated data store
 * - Parallel tests don't interfere with each other
 * - Fast in-memory execution (no database round-trips)
 */

import type { UserRepository, User, CreateUserInput } from './user-repository';

export class InMemoryUserRepository implements UserRepository {
  // Map<testId, Map<userId, User>>
  // Outer map partitions by test ID for isolation
  // Inner map stores users by their ID
  private readonly store = new Map<string, Map<string, User>>();
  private readonly idCounter = new Map<string, number>();

  constructor(private readonly getTestId: () => string) {}

  /**
   * Get the data store for the current test ID.
   * Creates a new store if one doesn't exist.
   */
  private getTestStore(): Map<string, User> {
    const testId = this.getTestId();
    if (!this.store.has(testId)) {
      this.store.set(testId, new Map());
      this.idCounter.set(testId, 0);
    }
    return this.store.get(testId)!;
  }

  /**
   * Generate a unique ID within the current test's namespace.
   */
  private generateId(): string {
    const testId = this.getTestId();
    const counter = (this.idCounter.get(testId) ?? 0) + 1;
    this.idCounter.set(testId, counter);
    return `user-${counter}`;
  }

  async findById(id: string): Promise<User | null> {
    return this.getTestStore().get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.getTestStore().values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findAll(): Promise<ReadonlyArray<User>> {
    return Array.from(this.getTestStore().values());
  }

  async create(data: CreateUserInput): Promise<User> {
    const user: User = {
      id: this.generateId(),
      ...data,
    };
    this.getTestStore().set(user.id, user);
    return user;
  }

  /**
   * Clear all data for a specific test ID.
   * Useful for test cleanup.
   */
  clearTestData(testId: string): void {
    this.store.delete(testId);
    this.idCounter.delete(testId);
  }

  /**
   * Clear all data across all test IDs.
   * Useful for global test cleanup.
   */
  clearAll(): void {
    this.store.clear();
    this.idCounter.clear();
  }
}
