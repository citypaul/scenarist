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

  // Fetch user from Auth0 session
  React.useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/auth/profile");
        if (response.ok) {
          const data = await response.json();
          if (data) {
            // Extract tier from user metadata
            const tier =
              data.app_metadata?.tier || data.user_metadata?.tier || "free";
            setUser({
              id: data.sub,
              email: data.email,
              name: data.name || data.email,
              tier: tier as UserTier,
              picture: data.picture,
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
