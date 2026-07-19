import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdminToken } from "@/lib/superadmin/auth"
import { getSuperadminDb } from "@/lib/superadmin/db"
import { logAudit } from "@/lib/superadmin/audit"
import { provisionEmptyCompany } from "@/lib/superadmin/tenant-provision"

async function resolveTenantCompany(client: ReturnType<typeof getSuperadminDb>, tenantId: string) {
  const { data: tenant } = await client
    .from("superadmin_tenants")
    .select("id, name, company_id, status")
    .eq("id", tenantId)
    .maybeSingle()

  if (!tenant) return { error: "Tenant not found" as const, tenant: null, companyId: null }

  let companyId = tenant.company_id as string | null
  if (!companyId) {
    const provisioned = await provisionEmptyCompany(client, { name: tenant.name })
    companyId = provisioned.companyId
    await client
      .from("superadmin_tenants")
      .update({ company_id: companyId, updated_at: new Date().toISOString() })
      .eq("id", tenantId)
  }

  return { error: null, tenant, companyId }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const client = getSuperadminDb()
    const resolved = await resolveTenantCompany(client, id)
    if (resolved.error || !resolved.companyId) {
      return NextResponse.json({ error: resolved.error || "No company" }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const unassigned = searchParams.get("unassigned") === "true"

    if (unassigned) {
      // Employees with null company_id — available to assign
      const { data, error } = await client
        .from("employees")
        .select(
          "id, employee_id, first_name, last_name, corporate_email, personal_email, email, position, department, status, company_id",
        )
        .is("company_id", null)
        .order("created_at", { ascending: false })
        .limit(200)
      if (error) throw error
      return NextResponse.json({ employees: data || [], company_id: resolved.companyId })
    }

    const { data, error } = await client
      .from("employees")
      .select(
        "id, employee_id, first_name, last_name, corporate_email, personal_email, email, position, department, status, company_id, created_at",
      )
      .eq("company_id", resolved.companyId)
      .order("created_at", { ascending: false })
      .limit(500)

    if (error) throw error
    return NextResponse.json({ employees: data || [], company_id: resolved.companyId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const client = getSuperadminDb()
    const resolved = await resolveTenantCompany(client, id)
    if (resolved.error || !resolved.companyId) {
      return NextResponse.json({ error: resolved.error || "No company" }, { status: 404 })
    }
    if (resolved.tenant?.status === "inactive") {
      return NextResponse.json({ error: "Cannot modify employees on a deactivated tenant" }, { status: 400 })
    }

    const action = body.action || "create"
    const companyId = resolved.companyId
    const now = new Date().toISOString()

    // Assign existing employee(s) to this tenant's company
    if (action === "assign") {
      const employeeIds: string[] = Array.isArray(body.employee_ids)
        ? body.employee_ids
        : body.employee_id
          ? [body.employee_id]
          : []
      if (!employeeIds.length) {
        return NextResponse.json({ error: "employee_id or employee_ids required" }, { status: 400 })
      }

      const { data, error } = await client
        .from("employees")
        .update({ company_id: companyId, updated_at: now })
        .in("id", employeeIds)
        .select("id, first_name, last_name, company_id")

      if (error) throw error

      await logAudit({
        userId: auth.userId,
        action: "employees_assigned_to_tenant",
        resourceType: "tenant",
        resourceId: id,
        tenantId: id,
        changes: { employee_ids: employeeIds, company_id: companyId },
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      })

      return NextResponse.json({ employees: data || [], company_id: companyId })
    }

    if (action === "unassign") {
      const employeeId = body.employee_id
      if (!employeeId) return NextResponse.json({ error: "employee_id required" }, { status: 400 })
      const { data, error } = await client
        .from("employees")
        .update({ company_id: null, updated_at: now })
        .eq("id", employeeId)
        .eq("company_id", companyId)
        .select("id")
        .maybeSingle()
      if (error) throw error
      return NextResponse.json({ employee: data, unassigned: true })
    }

    // Create a fresh employee under this tenant (no demo seed fields)
    const firstName = String(body.first_name || "").trim()
    const lastName = String(body.last_name || "").trim()
    if (!firstName || !lastName) {
      return NextResponse.json({ error: "first_name and last_name are required" }, { status: 400 })
    }

    const employeeCode =
      String(body.employee_id || "").trim() ||
      `EMP-${Date.now().toString(36).toUpperCase().slice(-6)}`

    const payload: Record<string, unknown> = {
      company_id: companyId,
      employee_id: employeeCode,
      first_name: firstName,
      last_name: lastName,
      corporate_email: body.corporate_email || body.email || null,
      personal_email: body.personal_email || null,
      position: body.position || null,
      department: body.department || null,
      status: body.status || "active",
      created_at: now,
      updated_at: now,
    }

    let created: any = null
    let createError: any = null
    ;({ data: created, error: createError } = await client
      .from("employees")
      .insert(payload)
      .select("*")
      .single())

    if (createError) {
      // Retry without optional columns
      const minimal = {
        company_id: companyId,
        first_name: firstName,
        last_name: lastName,
        created_at: now,
        updated_at: now,
      }
      ;({ data: created, error: createError } = await client
        .from("employees")
        .insert(minimal)
        .select("*")
        .single())
    }

    if (createError || !created) {
      return NextResponse.json(
        { error: createError?.message || "Failed to create employee" },
        { status: 500 },
      )
    }

    await logAudit({
      userId: auth.userId,
      action: "employee_created_for_tenant",
      resourceType: "employee",
      resourceId: created.id,
      tenantId: id,
      changes: { company_id: companyId, first_name: firstName, last_name: lastName },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ employee: created, company_id: companyId }, { status: 201 })
  } catch (err: any) {
    console.error("[v0] Tenant employees POST error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
