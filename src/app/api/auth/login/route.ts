import { NextRequest, NextResponse } from "next/server";
import {
  getUserProfileByEmail,
  getOrCreateProfile,
  getUserProfile,
  updateUserProfile,
} from "@/lib/db/service";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  hashPassword,
  isDemoAuthEnabled,
  needsRehash,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const invalidCredentials = () =>
  NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, asDemoRole } = body;

    let targetUserId = "";

    if (asDemoRole === "admin" || asDemoRole === "user") {
      // One-click demo accounts: development only (or explicit ALLOW_DEMO_LOGIN=true).
      if (!isDemoAuthEnabled) {
        return NextResponse.json(
          { success: false, error: "Demo login is disabled" },
          { status: 403 }
        );
      }
      if (asDemoRole === "admin") {
        targetUserId = "user_admin_001";
        await getOrCreateProfile(
          targetUserId,
          "admin@developer.local",
          "Admin Founder",
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
          "admin"
        );
      } else {
        targetUserId = "user_demo_123";
        await getOrCreateProfile(
          targetUserId,
          "demo@developer.local",
          "Demo Developer",
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          "user"
        );
      }
    } else if (typeof email === "string" && email.includes("@")) {
      const normalizedEmail = email.trim().toLowerCase();
      let profile = await getUserProfileByEmail(normalizedEmail);
      const storedHash = profile?.password_hash || profile?.passwordHash || null;

      if (!profile) {
        // Auto-register convenience for local testing only.
        if (!isDemoAuthEnabled) return invalidCredentials();
        profile = await getOrCreateProfile(
          `user_${Date.now()}`,
          normalizedEmail,
          normalizedEmail.split("@")[0],
          null,
          "user"
        );
        if (typeof password === "string" && password) {
          await updateUserProfile(profile.id, { passwordHash: hashPassword(password) });
        }
      } else if (storedHash) {
        if (typeof password !== "string" || !verifyPassword(password, storedHash)) {
          return invalidCredentials();
        }
        if (needsRehash(storedHash)) {
          await updateUserProfile(profile.id, { passwordHash: hashPassword(password) }).catch(() => {});
        }
      } else if (!isDemoAuthEnabled) {
        // Passwordless local accounts (e.g. created via Clerk/admin) cannot sign in here in production.
        return invalidCredentials();
      }

      if (profile.status === "suspended") {
        return NextResponse.json(
          { success: false, error: "Your account has been suspended. Please contact admin." },
          { status: 403 }
        );
      }

      targetUserId = profile.id;
    } else {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const userProfile = await getUserProfile(targetUserId);
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "User account could not be found" },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Successfully signed in",
      user: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role || "user",
        avatarUrl: userProfile.avatar_url || userProfile.avatarUrl,
        creditsBalance: userProfile.credits_balance ?? userProfile.creditsBalance ?? 0,
      },
    });

    response.cookies.set(SESSION_COOKIE, createSessionToken(userProfile.id), {
      ...sessionCookieOptions,
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error: any) {
    console.error("[api/auth/login] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to sign in" },
      { status: 500 }
    );
  }
}
