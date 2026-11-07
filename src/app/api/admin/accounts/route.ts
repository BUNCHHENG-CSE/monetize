import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/clerk";
import { getAllProfilesWithDetails, createUserAccount } from "@/lib/db/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || (session.role !== "admin" && !session.email.includes("admin"))) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const accounts = await getAllProfilesWithDetails();
    return NextResponse.json({
      success: true,
      accounts,
      count: accounts.length,
    });
  } catch (error: any) {
    console.error("[api/admin/accounts] GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load accounts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || (session.role !== "admin" && !session.email.includes("admin"))) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, name, role, planId, creditsBalance } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email is required" },
        { status: 400 }
      );
    }

    const newAccount = await createUserAccount({
      email,
      name,
      role: role || "user",
      planId: planId || "free",
      creditsBalance: creditsBalance !== undefined ? Number(creditsBalance) : (role === "admin" ? 10000 : 150),
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      account: newAccount,
    });
  } catch (error: any) {
    console.error("[api/admin/accounts] POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
