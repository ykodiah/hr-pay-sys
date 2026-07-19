import { NextRequest, NextResponse } from "next/server"
import { hashPassword, verifyPassword, verifySuperAdminToken } from "@/lib/superadmin/auth"
import { getSuperadminDb } from "@/lib/superadmin/db"
import { logAudit } from "@/lib/superadmin/audit"

export async function POST(req: NextRequest) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const currentPassword = String(body.current_password || "")
    const newPassword = String(body.new_password || "")
    const confirmPassword = String(body.confirm_password || newPassword)

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password are required" }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New password confirmation does not match" }, { status: 400 })
    }

    const client = getSuperadminDb()
    const { data: user, error } = await client
      .from("superadmin_users")
      .select("id, email, password_hash, status")
      .eq("id", auth.userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const ok = await verifyPassword(currentPassword, user.password_hash)
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    const password_hash = await hashPassword(newPassword)
    const { error: updateError } = await client
      .from("superadmin_users")
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq("id", user.id)

    if (updateError) throw updateError

    await logAudit({
      userId: auth.userId,
      action: "superadmin_password_changed",
      resourceType: "superadmin_user",
      resourceId: user.id,
      changes: { email: user.email },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ success: true, message: "Password updated successfully." })
  } catch (err: any) {
    console.error("[v0] Change password error:", err)
    return NextResponse.json({ error: err.message || "Failed to change password" }, { status: 500 })
  }
}
