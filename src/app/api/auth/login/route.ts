import { NextRequest, NextResponse } from "next/server";
import { getUserProfileByEmail, getOrCreateProfile, getUserProfile } from "@/lib/db/service";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, asDemoRole } = body;

    let targetUserId = "";

    // Quick demo switch
    if (asDemoRole === "admin") {
      targetUserId = "user_admin_001";
      await getOrCreateProfile(
        targetUserId,
        "admin@developer.local",
        "Admin Founder",
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
        "admin"
      );
    } else if (asDemoRole === "user") {
      targetUserId = "user_demo_123";
      await getOrCreateProfile(
        targetUserId,
        "demo@developer.local",
        "Demo Developer",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        "user"
      );
    } else if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      let profile = await getUserProfileByEmail(normalizedEmail);

      if (!profile) {
        // Auto-register convenience for testing
        const role = normalizedEmail.includes("admin") ? "admin" : "user";
        const passwordHash = password ? crypto.createHash("sha256").update(password).digest("hex") : null;
        profile = await getOrCreateProfile(
          `user_${Date.now()}`,
          normalizedEmail,
          normalizedEmail.split("@")[0],
          null,
          role
        );
      } else if (profile.password_hash || (profile as any).passwordHash) {
        // Verify password if set
        const hash = (profile.password_hash || (profile as any).passwordHash);
        const inputHash = password ? crypto.createHash("sha256").update(password).digest("hex") : "";
        if (hash && hash !== inputHash) {
          return NextResponse.json(
            { success: false, error: "Invalid email or password" },
            { status: 401 }
          );
        }
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
        { success: false, error: "Email or demo role is required" },
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

    // Set HTTP-only session cookie
    response.cookies.set("devtool_session", userProfile.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error("[api/auth/login] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sign in" },
      { status: 500 }
    );
  }
}
