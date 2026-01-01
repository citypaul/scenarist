const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:3001";

export type UserTier = "free" | "basic" | "pro" | "enterprise";

export type UserData = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly tier: UserTier;
};

export async function getCurrentUser(): Promise<UserData> {
  const response = await fetch(`${USER_SERVICE_URL}/users/current`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`User service error: ${response.status}`);
  }

  return response.json();
}
