import { NextRequest, NextResponse } from "next/server";
import { getUserProfileByEmail, createUserAccount } from "@/lib/db/service";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  hashPassword,
  sessionCookieOptions,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, name, password } = body;

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email address is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await getUserProfileByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Self-registration always creates a regular user; admins are promoted via the admin panel.
    const passwordHash = hashPassword(password);
    const role = "user";

    const userProfile = await createUserAccount({
      email: normalizedEmail,
      name: name || normalizedEmail.split("@")[0],
      role,
      creditsBalance: 150,
      planId: "free",
      passwordHash,
    });

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully",
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
    console.error("[api/auth/register] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create account" },
      { status: 500 }
    );
  }
}
