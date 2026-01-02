const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:3001";

export type UserTier = "free" | "basic" | "pro" | "enterprise";

export type UserData = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly tier: UserTier;
};

/**
 * Headers to propagate to backend service calls.
 * Used for Scenarist test ID propagation.
 */
export type ServiceHeaders = Record<string, string>;

export async function getCurrentUser(
  headers: ServiceHeaders = {},
): Promise<UserData> {
  const response = await fetch(`${USER_SERVICE_URL}/users/current`, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`User service error: ${response.status}`);
  }

  return response.json();
}
