import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdminToken } from "@/lib/superadmin/auth"
import { getSuperadminDb } from "@/lib/superadmin/db"
import { logAudit } from "@/lib/superadmin/audit"
import { createProvisionedTenant, ensureDemoTenantPersisted } from "@/lib/superadmin/tenant-provision"

export async function GET(req: NextRequest) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = getSuperadminDb()

    // Persist demo tenant into the portal so it always appears.
    try {
      await ensureDemoTenantPersisted(client)
    } catch (err) {
      console.warn("[v0] Demo tenant sync skipped:", err)
    }

    const { data: tenants, error } = await client
      .from("superadmin_tenants")
      .select(
        "id, name, slug, status, plan, subscription_status, company_id, description, created_at, updated_at",
      )
      .order("created_at", { ascending: false })

    if (error) throw error

    // Enrich with employee/admin counts
    const enriched = await Promise.all(
      (tenants || []).map(async (t) => {
        let employeeCount = 0
        let adminCount = 0
        try {
          const { count } = await client
            .from("superadmin_tenant_users")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", t.id)
          adminCount = count || 0
        } catch {
          // ignore
        }
        if (t.company_id) {
          try {
            const { count } = await client
              .from("employees")
              .select("id", { count: "exact", head: true })
              .eq("company_id", t.company_id)
            employeeCount = count || 0
          } catch {
            // ignore
          }
        }
        return { ...t, admin_count: adminCount, employee_count: employeeCount }
      }),
    )

    return NextResponse.json({ tenants: enriched })
  } catch (err: any) {
    console.error("[v0] Tenant GET error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const {
      name,
      slug,
      description,
      plan = "basic",
      contact_email,
      admin_email,
      admin_password,
      admin_first_name,
      admin_last_name,
    } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const client = getSuperadminDb()

    // Fresh empty tenant — provisions blank companies + company_settings (no hardcoded data).
    const tenant = await createProvisionedTenant(client, {
      name,
      slug,
      description,
      plan,
      contactEmail: contact_email || admin_email || null,
    })

    let adminResult: any = null
    if (admin_email && admin_password && admin_first_name && admin_last_name) {
      const { createTenantAdminUser } = await import("@/lib/superadmin/tenant-provision")
      adminResult = await createTenantAdminUser(client, {
        tenantId: tenant.id,
        companyId: tenant.company_id,
        email: admin_email,
        password: admin_password,
        firstName: admin_first_name,
        lastName: admin_last_name,
        role: "owner",
        createAuthUser: true,
      })
    }

    await logAudit({
      userId: auth.userId,
      action: "tenant_created",
      resourceType: "tenant",
      resourceId: tenant.id,
      changes: {
        name,
        slug: tenant.slug,
        plan,
        company_id: tenant.company_id,
        fresh: true,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json(
      {
        tenant,
        admin: adminResult?.user || null,
        warning: adminResult?.warning || null,
        message: "Tenant created with an empty company account (no seed data).",
      },
      { status: 201 },
    )
  } catch (err: any) {
    console.error("[v0] Tenant POST error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
