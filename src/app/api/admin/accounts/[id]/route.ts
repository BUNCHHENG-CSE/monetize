import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/clerk";
import { updateUserProfile, updateUserPlan, deleteUserProfile, getUserProfile } from "@/lib/db/service";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || (session.role !== "admin" && !session.email.includes("admin"))) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const body = await req.json().catch(() => ({}));
    const { name, avatarUrl, creditsBalance, role, status, planId } = body;

    const existing = await getUserProfile(userId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404 }
      );
    }

    // Update profile attributes
    const updatedProfile = await updateUserProfile(userId, {
      ...(name !== undefined ? { name } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      ...(creditsBalance !== undefined ? { creditsBalance: Number(creditsBalance) } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(status !== undefined ? { status } : {}),
    });

    // Update plan if specified
    if (planId) {
      await updateUserPlan(userId, planId);
    }

    return NextResponse.json({
      success: true,
      message: "Account updated successfully",
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error("[api/admin/accounts/[id]] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update account" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || (session.role !== "admin" && !session.email.includes("admin"))) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // Safety guard: prevent deleting current active admin
    if (session && session.userId === userId) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own active session account" },
        { status: 400 }
      );
    }

    const success = await deleteUserProfile(userId);
    return NextResponse.json({
      success,
      message: success ? "Account deleted successfully" : "Failed to delete account",
    });
  } catch (error: any) {
    console.error("[api/admin/accounts/[id]] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
