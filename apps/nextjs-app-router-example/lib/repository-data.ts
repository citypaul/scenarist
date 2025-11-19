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
    users?: ReadonlyArray<CreateUserInput & { id: string }>;
  }
> = {
  // Premium user scenario - seeds a premium tier user
  premiumUser: {
    users: [
      {
        id: 'user-1',
        email: 'premium@example.com',
        name: 'Premium User',
        tier: 'premium',
      },
    ],
  },

  // Default scenario - seeds a standard tier user
  default: {
    users: [
      {
        id: 'user-1',
        email: 'standard@example.com',
        name: 'Standard User',
        tier: 'standard',
      },
    ],
  },

  // Add more scenario data mappings as needed
};
