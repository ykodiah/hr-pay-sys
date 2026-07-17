import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdminToken } from "@/lib/superadmin/auth"
import { createClient } from "@supabase/supabase-js"
import { logAudit } from "@/lib/superadmin/audit"

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const client = getDb()
    const { data: flag, error } = await client
      .from("superadmin_feature_flags")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error

    await logAudit({
      userId: auth.userId,
      action: "feature_flag_updated",
      resourceType: "feature_flag",
      resourceId: id,
      changes: body,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ flag })
  } catch (err: any) {
    console.error("[v0] Feature flag PATCH error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const client = getDb()
    const { error } = await client.from("superadmin_feature_flags").delete().eq("id", id)
    if (error) throw error

    await logAudit({
      userId: auth.userId,
      action: "feature_flag_deleted",
      resourceType: "feature_flag",
      resourceId: id,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[v0] Feature flag DELETE error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
