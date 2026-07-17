import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdminToken } from "@/lib/superadmin/auth"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcrypt"
import { logAudit } from "@/lib/superadmin/audit"

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { email, password, first_name, last_name, role = "user" } = body

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = getDb()
    const password_hash = await bcrypt.hash(password, 12)

    const { data: user, error } = await client
      .from("superadmin_tenant_users")
      .insert({ tenant_id: id, email, password_hash, first_name, last_name, role, status: "active" })
      .select("id, email, first_name, last_name, role, status")
      .single()

    if (error) throw error

    await logAudit({
      userId: auth.userId,
      action: "tenant_user_created",
      resourceType: "tenant_user",
      resourceId: user.id,
      tenantId: id,
      changes: { email, first_name, last_name, role },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (err: any) {
    console.error("[v0] Tenant user POST error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
