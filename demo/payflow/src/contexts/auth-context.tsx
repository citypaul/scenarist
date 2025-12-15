"use client";

import * as React from "react";

export type UserTier = "free" | "basic" | "pro" | "enterprise";

export interface User {
  id: string;
  email: string;
  name: string;
  tier: UserTier;
  avatar?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined,
);

// Mock users for different tiers - will be controlled by Scenarist scenarios
const MOCK_USERS: Record<string, User> = {
  "free@example.com": {
    id: "user-1",
    email: "free@example.com",
    name: "Free User",
    tier: "free",
  },
  "basic@example.com": {
    id: "user-2",
    email: "basic@example.com",
    name: "Basic User",
    tier: "basic",
  },
  "pro@example.com": {
    id: "user-3",
    email: "pro@example.com",
    name: "Pro User",
    tier: "pro",
  },
  "enterprise@example.com": {
    id: "user-4",
    email: "enterprise@example.com",
    name: "Enterprise User",
    tier: "enterprise",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Check for existing session on mount
  React.useEffect(() => {
    const storedUser = localStorage.getItem("payflow_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = React.useCallback(async (email: string, _password: string) => {
    setIsLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (mockUser) {
      setUser(mockUser);
      localStorage.setItem("payflow_user", JSON.stringify(mockUser));
    } else {
      // Default to free user for any email
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: email.toLowerCase(),
        name: email.split("@")[0],
        tier: "free",
      };
      setUser(newUser);
      localStorage.setItem("payflow_user", JSON.stringify(newUser));
    }

    setIsLoading(false);
  }, []);

  const logout = React.useCallback(async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setUser(null);
    localStorage.removeItem("payflow_user");
    setIsLoading(false);
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
