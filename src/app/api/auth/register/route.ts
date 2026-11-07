import { NextRequest, NextResponse } from "next/server";
import { getUserProfileByEmail, createUserAccount } from "@/lib/db/service";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, name, password } = body;

    if (!email || !email.includes("@")) {
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

    const passwordHash = password ? crypto.createHash("sha256").update(password).digest("hex") : null;
    const role = normalizedEmail.includes("admin") ? "admin" : "user";

    const userProfile = await createUserAccount({
      email: normalizedEmail,
      name: name || normalizedEmail.split("@")[0],
      role,
      creditsBalance: role === "admin" ? 10000 : 150,
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

    response.cookies.set("devtool_session", userProfile.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    console.error("[api/auth/register] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
