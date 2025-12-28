"use client";

import * as React from "react";

export type UserTier = "free" | "basic" | "pro" | "enterprise";

export interface User {
  id: string;
  email: string;
  name: string;
  tier: UserTier;
  picture?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch user from Auth0 session and tier from User Service
  React.useEffect(() => {
    async function fetchTierFromUserService(): Promise<UserTier> {
      try {
        const userResponse = await fetch("/api/user");
        if (userResponse.ok) {
          const userData = await userResponse.json();
          return userData.tier || "free";
        }
      } catch {
        // User service unavailable
      }
      return "free";
    }

    async function loadUser() {
      try {
        // Check Auth0 for authentication
        const authResponse = await fetch("/auth/profile");
        if (authResponse.ok) {
          const authData = await authResponse.json();
          if (authData) {
            // Fetch tier from User Service (server-side call to backend)
            const tier = await fetchTierFromUserService();

            setUser({
              id: authData.sub,
              email: authData.email,
              name: authData.name || authData.email,
              tier,
              picture: authData.picture,
            });
          }
        }
      } catch {
        // Not authenticated or error
      }
      setIsLoading(false);
    }

    loadUser();
  }, []);

  const login = React.useCallback(() => {
    window.location.href = "/auth/login";
  }, []);

  const logout = React.useCallback(() => {
    window.location.href = "/auth/logout";
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
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
