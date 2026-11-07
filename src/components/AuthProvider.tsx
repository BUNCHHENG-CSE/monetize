"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ClerkProvider } from "@clerk/nextjs";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isConfigured = Boolean(
  clerkPublishableKey && !clerkPublishableKey.includes("sample_clerk_key")
);

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  avatarUrl: string | null;
  creditsBalance: number;
  plan: string;
  planName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  isClerkConfigured: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (role: "admin" | "user") => Promise<{ success: boolean; error?: string }>;
  register: (email: string, name?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  isClerkConfigured: false,
  login: async () => ({ success: false }),
  loginAsDemo: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function AuthStateProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      console.warn("Failed to fetch auth session:", e);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        await refreshUser();
        return { success: true };
      }
      return { success: false, error: data.error || "Login failed" };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error" };
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async (role: "admin" | "user") => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asDemoRole: role }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        await refreshUser();
        return { success: true };
      }
      return { success: false, error: data.error || "Demo switch failed" };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error" };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, name?: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        await refreshUser();
        return { success: true };
      }
      return { success: false, error: data.error || "Registration failed" };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      // If clerk is active, Clerk handles its own signOut if invoked
    } catch (e) {
      console.warn("Logout error:", e);
      setUser(null);
    } finally {
      setIsLoading(false);
      window.location.href = "/";
    }
  };

  const isAuthenticated = Boolean(user && user.id);
  const isAdmin = Boolean(
    user && (user.role === "admin" || user.email.toLowerCase().includes("admin"))
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isLoading,
        isClerkConfigured: isConfigured,
        login,
        loginAsDemo,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (isConfigured) {
    return (
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        appearance={{
          baseTheme: undefined,
          variables: {
            colorPrimary: "#3b82f6",
            colorBackground: "#121215",
            colorText: "#fafafa",
            colorTextSecondary: "#a1a1aa",
            colorInputBackground: "#18181b",
            colorInputText: "#fafafa",
          },
        }}
      >
        <AuthStateProvider>{children}</AuthStateProvider>
      </ClerkProvider>
    );
  }

  return <AuthStateProvider>{children}</AuthStateProvider>;
}
