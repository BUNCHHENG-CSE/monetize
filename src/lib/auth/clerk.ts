import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { getUserProfile, getOrCreateProfile } from "@/lib/db/service";

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
  role?: string;
  status?: string;
}

/**
 * Get current authenticated user session, with cookie-based local auth
 * and Clerk integration when configured.
 */
export async function getAuthSession(): Promise<AuthSessionUser | null> {
  // 1. Check local session cookie first
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("devtool_session")?.value;

    if (!sessionCookie || sessionCookie === "logged_out" || sessionCookie === "none") {
      // Not logged in with local session
      if (!isClerkConfigured) {
        return null;
      }
    } else {
      // Decode user ID if stored as JSON or raw ID
      let userId = sessionCookie;
      try {
        if (sessionCookie.startsWith("{")) {
          const parsed = JSON.parse(sessionCookie);
          userId = parsed.userId || parsed.id || sessionCookie;
        }
      } catch {}

      const profile = await getUserProfile(userId);
      if (profile) {
        return {
          userId: profile.id,
          email: profile.email,
          name: profile.name,
          imageUrl: profile.avatar_url || profile.avatarUrl || null,
          role: profile.role || (profile.email.includes("admin") ? "admin" : "user"),
          status: profile.status || "active",
        };
      }
      return null;
    }
  } catch (cookieError) {
    // Outside request context
  }

  // 2. Check Clerk session if configured
  if (isClerkConfigured) {
    try {
      const session = await auth();
      if (!session || !session.userId) {
        return null;
      }

      const user = await currentUser();
      const primaryEmail = user?.emailAddresses?.[0]?.emailAddress || "user@domain.com";
      const name = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : null;

      const profile = await getOrCreateProfile(session.userId, primaryEmail, name, user?.imageUrl);

      return {
        userId: session.userId,
        email: primaryEmail,
        name: name || profile.name,
        imageUrl: user?.imageUrl || profile.avatar_url || null,
        role: profile.role || (primaryEmail.includes("admin") ? "admin" : "user"),
        status: profile.status || "active",
      };
    } catch (error) {
      console.error("Clerk auth extraction error:", error);
      return null;
    }
  }

  // 3. No active session
  return null;
}
