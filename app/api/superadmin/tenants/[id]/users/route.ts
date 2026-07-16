import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdminToken } from "@/lib/superadmin/auth"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcrypt"
import { logAudit } from "@/lib/superadmin/audit"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { email, password, first_name, last_name, role = "user" } = body

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await createClient()

    // Hash password
    const password_hash = await bcrypt.hash(password, 12)

    // Create tenant user
    const { data: user, error } = await client
      .from("superadmin_tenant_users")
      .insert({
        tenant_id: params.id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        status: "active",
      })
      .select("id, email, first_name, last_name, role, status")
      .single()

    if (error) throw error

    // Log audit
    await logAudit({
      userId: auth.userId,
      action: "tenant_user_created",
      resourceType: "tenant_user",
      resourceId: user.id,
      tenantId: params.id,
      changes: { email, first_name, last_name, role },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (err: any) {
    console.error("[v0] Tenant user POST error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const { error } = await client
      .from("superadmin_tenant_users")
      .delete()
      .eq("id", params.userId)
      .eq("tenant_id", params.id)

    if (error) throw error

    // Log audit
    await logAudit({
      userId: auth.userId,
      action: "tenant_user_deleted",
      resourceType: "tenant_user",
      resourceId: params.userId,
      tenantId: params.id,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[v0] Tenant user DELETE error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
