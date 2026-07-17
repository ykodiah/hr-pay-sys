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

export async function GET(req: NextRequest) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = getDb()
    const { data: flags, error } = await client
      .from("superadmin_feature_flags")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) throw error
    return NextResponse.json({ flags })
  } catch (err: any) {
    console.error("[v0] Feature flags GET error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { flag_key, flag_name, description, enabled, rollout_percentage = 0 } = body

    if (!flag_key || flag_name === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = getDb()
    const { data: flag, error } = await client
      .from("superadmin_feature_flags")
      .insert({
        flag_key,
        flag_name,
        description,
        enabled,
        rollout_percentage,
      })
      .select("*")
      .single()

    if (error) throw error

    await logAudit({
      userId: auth.userId,
      action: "feature_flag_created",
      resourceType: "feature_flag",
      resourceId: flag.id,
      changes: { flag_key, flag_name, enabled, rollout_percentage },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ flag }, { status: 201 })
  } catch (err: any) {
    console.error("[v0] Feature flags POST error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
