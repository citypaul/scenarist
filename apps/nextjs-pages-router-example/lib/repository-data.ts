/**
 * Repository data for each scenario.
 *
 * NOTE: This is NOT a Scenarist feature. This demonstrates how to seed database
 * state alongside Scenarist's HTTP mocking, keeping the same test ID isolation.
 *
 * When a scenario is switched, both HTTP mocks (Scenarist) and database state
 * (this seeding) are set up together, maintaining the pattern: switch -> navigate -> assert.
 *
 * Learn more: https://scenarist.io/guides/testing-database-apps/repository-pattern
 */

import type { CreateUserInput } from './repositories';

/**
 * Maps scenario IDs to repository seed data.
 * When a scenario is switched, the corresponding data is seeded into the repository.
 */
export const scenarioRepositoryData: Record<
  string,
  {
    users?: ReadonlyArray<CreateUserInput>;
  }
> = {
  premiumUser: {
    users: [
      {
        email: 'premium@example.com',
        name: 'Premium User',
        tier: 'premium',
      },
    ],
  },

  default: {
    users: [
      {
        email: 'standard@example.com',
        name: 'Standard User',
        tier: 'standard',
      },
    ],
  },
};
