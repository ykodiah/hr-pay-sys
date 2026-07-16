import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdminToken } from "@/lib/superadmin/auth"
import { createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/superadmin/audit"

export async function GET(req: NextRequest) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const { data: tenants, error } = await client
      .from("superadmin_tenants")
      .select("id, name, slug, status, plan, subscription_status, company_id, created_at, updated_at")
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ tenants })
  } catch (err: any) {
    console.error("[v0] Tenant GET error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { name, slug, description, plan = "basic" } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug required" }, { status: 400 })
    }

    const client = await createClient()

    // Create tenant
    const { data: tenant, error: tenantErr } = await client
      .from("superadmin_tenants")
      .insert({
        name,
        slug,
        description,
        plan,
        status: "active",
        subscription_status: "active",
        database_schema_name: `schema_${slug.replace(/-/g, "_")}`,
      })
      .select("id")
      .single()

    if (tenantErr) throw tenantErr

    // Log audit
    await logAudit({
      userId: auth.userId,
      action: "tenant_created",
      resourceType: "tenant",
      resourceId: tenant.id,
      changes: { name, slug, plan },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    // Assign default modules to tenant
    const { data: modules } = await client
      .from("superadmin_modules")
      .select("id")
      .eq("is_active", true)

    if (modules && modules.length > 0) {
      await client.from("superadmin_tenant_modules").insert(
        modules.map((m) => ({
          tenant_id: tenant.id,
          module_id: m.id,
          status: "enabled",
          enabled_at: new Date().toISOString(),
        }))
      )
    }

    return NextResponse.json({ tenant }, { status: 201 })
  } catch (err: any) {
    console.error("[v0] Tenant POST error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
