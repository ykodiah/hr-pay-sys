import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdminToken } from "@/lib/superadmin/auth"
import { createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/superadmin/audit"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const { data: tenant, error } = await client
      .from("superadmin_tenants")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) throw error
    if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Get tenant users
    const { data: users } = await client
      .from("superadmin_tenant_users")
      .select("id, email, first_name, last_name, role, status, created_at")
      .eq("tenant_id", params.id)

    // Get tenant modules
    const { data: modules } = await client
      .from("superadmin_tenant_modules")
      .select("id, module_id, status, enabled_at, superadmin_modules(name, monthly_cost)")
      .eq("tenant_id", params.id)

    return NextResponse.json({ tenant, users, modules })
  } catch (err: any) {
    console.error("[v0] Tenant detail GET error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { name, status, plan } = body

    const client = await createClient()
    const { data: tenant, error } = await client
      .from("superadmin_tenants")
      .update({ name, status, plan, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select("*")
      .single()

    if (error) throw error

    // Log audit
    await logAudit({
      userId: auth.userId,
      action: "tenant_updated",
      resourceType: "tenant",
      resourceId: params.id,
      changes: { name, status, plan },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ tenant })
  } catch (err: any) {
    console.error("[v0] Tenant PATCH error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const { error } = await client.from("superadmin_tenants").delete().eq("id", params.id)

    if (error) throw error

    // Log audit
    await logAudit({
      userId: auth.userId,
      action: "tenant_deleted",
      resourceType: "tenant",
      resourceId: params.id,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[v0] Tenant DELETE error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
