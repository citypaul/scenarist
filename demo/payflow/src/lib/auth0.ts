import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Auth0 client for server-side operations
// Configuration comes from environment variables:
// - AUTH0_SECRET
// - AUTH0_BASE_URL
// - AUTH0_ISSUER_BASE_URL
// - AUTH0_CLIENT_ID
// - AUTH0_CLIENT_SECRET

export const auth0 = new Auth0Client();

// User tier type - stored in Auth0 user metadata
export type UserTier = "free" | "basic" | "pro" | "enterprise";

// Extended user type with tier information
export interface PayFlowUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  tier: UserTier;
}

// Extract tier from Auth0 user metadata
export function getUserTier(user: Record<string, unknown>): UserTier {
  // Check app_metadata first (set by Auth0 rules/actions)
  const appMetadata = user.app_metadata as Record<string, unknown> | undefined;
  if (appMetadata?.tier) {
    const tier = appMetadata.tier as string;
    if (["free", "basic", "pro", "enterprise"].includes(tier)) {
      return tier as UserTier;
    }
  }

  // Check user_metadata (user-editable)
  const userMetadata = user.user_metadata as
    | Record<string, unknown>
    | undefined;
  if (userMetadata?.tier) {
    const tier = userMetadata.tier as string;
    if (["free", "basic", "pro", "enterprise"].includes(tier)) {
      return tier as UserTier;
    }
  }

  // Default to free tier
  return "free";
}

// Convert Auth0 user to PayFlow user
export function toPayFlowUser(user: Record<string, unknown>): PayFlowUser {
  return {
    sub: user.sub as string,
    email: user.email as string,
    name: (user.name as string) || (user.email as string),
    picture: user.picture as string | undefined,
    tier: getUserTier(user),
  };
}
