"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isConfigured = Boolean(
  clerkPublishableKey && !clerkPublishableKey.includes("sample_clerk_key")
);

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
        {children}
      </ClerkProvider>
    );
  }

  // Graceful fallback for local development preview without live Clerk keys
  return <>{children}</>;
}
