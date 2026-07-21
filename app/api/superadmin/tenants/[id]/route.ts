import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdminToken } from "@/lib/superadmin/auth"
import { getSuperadminDb } from "@/lib/superadmin/db"
import { logAudit } from "@/lib/superadmin/audit"
import { provisionEmptyCompany } from "@/lib/superadmin/tenant-provision"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const client = getSuperadminDb()

    const { data: tenant, error } = await client.from("superadmin_tenants").select("*").eq("id", id).single()

    if (error) throw error
    if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Repair missing company link with empty company
    if (!tenant.company_id) {
      const { companyId } = await provisionEmptyCompany(client, { name: tenant.name })
      const { data: repaired } = await client
        .from("superadmin_tenants")
        .update({ company_id: companyId, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single()
      if (repaired) Object.assign(tenant, repaired)
    }

    const [{ data: users }, { data: modules }, employeesResult, companyResult] = await Promise.all([
      client
        .from("superadmin_tenant_users")
        .select("id, email, first_name, last_name, role, status, created_at, last_login_at")
        .eq("tenant_id", id)
        .order("created_at", { ascending: false }),
      client
        .from("superadmin_tenant_modules")
        .select("id, module_id, status, enabled_at, superadmin_modules(name, monthly_cost)")
        .eq("tenant_id", id),
      tenant.company_id
        ? client
            .from("employees")
            .select(
              "id, employee_id, first_name, last_name, corporate_email, personal_email, email, position, department, status, company_id, created_at",
            )
            .eq("company_id", tenant.company_id)
            .order("created_at", { ascending: false })
            .limit(500)
        : Promise.resolve({ data: [] as any[] }),
      tenant.company_id
        ? client.from("companies").select("id, name, email_address, industry").eq("id", tenant.company_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    return NextResponse.json({
      tenant,
      users: users ?? [],
      modules: modules ?? [],
      employees: (employeesResult as any)?.data ?? [],
      company: (companyResult as any)?.data ?? null,
    })
  } catch (err: any) {
    console.error("[v0] Tenant detail GET error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const client = getSuperadminDb()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.name !== undefined) updates.name = body.name
    if (body.status !== undefined) updates.status = body.status
    if (body.plan !== undefined) updates.plan = body.plan
    if (body.description !== undefined) updates.description = body.description
    if (body.subscription_status !== undefined) updates.subscription_status = body.subscription_status

    // Assign / reassign company_id
    if (body.company_id !== undefined) {
      if (body.company_id === null || body.company_id === "") {
        updates.company_id = null
      } else {
        const { data: company } = await client
          .from("companies")
          .select("id")
          .eq("id", body.company_id)
          .maybeSingle()
        if (!company?.id) {
          return NextResponse.json({ error: "Unknown company_id" }, { status: 404 })
        }
        updates.company_id = company.id
      }
    }

    // Convenience: deactivate / reactivate
    if (body.action === "deactivate") updates.status = "inactive"
    if (body.action === "activate") updates.status = "active"
    if (body.action === "suspend") updates.status = "suspended"

    const { data: tenant, error } = await client
      .from("superadmin_tenants")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error

    // Keep linked company name roughly in sync
    if (tenant?.company_id && body.name) {
      await client
        .from("companies")
        .update({ name: body.name, updated_at: new Date().toISOString() })
        .eq("id", tenant.company_id)
        .then(() => null)
        .catch(() => null)
    }

    await logAudit({
      userId: auth.userId,
      action: body.action === "deactivate" ? "tenant_deactivated" : "tenant_updated",
      resourceType: "tenant",
      resourceId: id,
      changes: updates,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ tenant })
  } catch (err: any) {
    console.error("[v0] Tenant PATCH error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const client = getSuperadminDb()

    // Soft-delete preferred: deactivate. Hard delete only with ?hard=true
    const hard = new URL(req.url).searchParams.get("hard") === "true"
    if (!hard) {
      const { data: tenant, error } = await client
        .from("superadmin_tenants")
        .update({ status: "inactive", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single()
      if (error) throw error
      await logAudit({
        userId: auth.userId,
        action: "tenant_deactivated",
        resourceType: "tenant",
        resourceId: id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      })
      return NextResponse.json({ tenant, soft_deleted: true })
    }

    const { error } = await client.from("superadmin_tenants").delete().eq("id", id)
    if (error) throw error

    await logAudit({
      userId: auth.userId,
      action: "tenant_deleted",
      resourceType: "tenant",
      resourceId: id,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[v0] Tenant DELETE error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
