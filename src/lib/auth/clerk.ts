import { auth, currentUser } from "@clerk/nextjs/server";

export const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("sample_clerk_key") &&
  process.env.CLERK_SECRET_KEY &&
  !process.env.CLERK_SECRET_KEY.includes("sample_clerk_secret")
);

export interface AuthSessionUser {
  userId: string;
  email: string;
  name: string | null;
  imageUrl?: string | null;
}

/**
 * Get current authenticated user session, with transparent fallback to demo developer in simulation mode
 */
export async function getAuthSession(): Promise<AuthSessionUser | null> {
  if (!isClerkConfigured) {
    // Return demo user for instant zero-friction local exploration
    return {
      userId: "user_demo_123",
      email: "demo@developer.local",
      name: "Demo Developer",
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    };
  }

  try {
    const session = await auth();
    if (!session || !session.userId) {
      return null;
    }

    const user = await currentUser();
    const primaryEmail = user?.emailAddresses?.[0]?.emailAddress || "user@domain.com";

    return {
      userId: session.userId,
      email: primaryEmail,
      name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : null,
      imageUrl: user?.imageUrl || null,
    };
  } catch (error) {
    console.error("Clerk auth extraction error:", error);
    return null;
  }
}
