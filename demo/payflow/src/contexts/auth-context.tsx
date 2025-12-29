"use client";

import * as React from "react";

export type UserTier = "free" | "basic" | "pro" | "enterprise";

export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly tier: UserTier;
}

interface AuthContextValue {
  readonly user: User | null;
  readonly isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch user from User Service (server-side call to backend)
  React.useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          const userData = await response.json();
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            tier: userData.tier || "free",
          });
        }
      } catch {
        // User service unavailable - use default user
        setUser({
          id: "demo",
          email: "demo@payflow.com",
          name: "Demo User",
          tier: "free",
        });
      }
      setIsLoading(false);
    }

    loadUser();
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      isLoading,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
