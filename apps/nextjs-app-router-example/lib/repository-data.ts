/**
 * Repository data for each scenario.
 *
 * When a scenario is switched, the repository is seeded with this data.
 * This keeps the Scenarist pattern intact: switch scenario, navigate, assert.
 * No direct API calls needed for test setup.
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
