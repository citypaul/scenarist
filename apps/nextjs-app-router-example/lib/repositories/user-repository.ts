/**
 * User domain type and repository interface.
 *
 * The repository pattern abstracts database access behind interfaces,
 * enabling different implementations for production (Prisma) and tests
 * (in-memory with test ID isolation).
 */

export type User = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly tier: 'standard' | 'premium';
};

export type CreateUserInput = {
  readonly email: string;
  readonly name: string;
  readonly tier: 'standard' | 'premium';
};

/**
 * Repository interface for user data access.
 *
 * This is a behavior contract (interface, not type) that can be
 * implemented by different persistence strategies:
 * - PrismaUserRepository: Production implementation with real database
 * - InMemoryUserRepository: Test implementation with test ID isolation
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<ReadonlyArray<User>>;
  create(data: CreateUserInput): Promise<User>;
}
