import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, isUnresolvedTenant, jsonError } from "@/lib/settings/resolve-tenant"
import {
  provisionPortalAccess,
  setPortalAccountStatus,
  pickLoginEmail,
  employeeDisplayName,
} from "@/lib/self-service/portal-access"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET — roster of employees with their portal-access state for this tenant. */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const search = (searchParams.get("q") || "").trim()
    const limit = Math.min(500, Number(searchParams.get("limit") || 200))

    let query = ctx.service
      .from("employees")
      .select(
        "id, employee_id, first_name, last_name, full_name, display_name, corporate_email, personal_email, department, position, status",
      )
      .eq("company_id", ctx.companyId)
      .order("employee_id", { ascending: true })
      .limit(limit)

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,employee_id.ilike.%${search}%,corporate_email.ilike.%${search}%`,
      )
    }

    const { data: employees, error } = await query
    if (error) throw new Error(error.message)

    const { data: accounts } = await ctx.service
      .from("employee_portal_accounts")
      .select("*")
      .eq("company_id", ctx.companyId)

    const byEmployee = new Map((accounts || []).map((a: any) => [a.employee_id, a]))

    const rows = (employees || []).map((e: any) => {
      const account = byEmployee.get(e.id) || null
      return {
        employee_id: e.id,
        employee_code: e.employee_id,
        name: employeeDisplayName(e),
        department: e.department,
        position: e.position,
        employment_status: e.status,
        suggested_email: pickLoginEmail(e) || null,
        portal: account
          ? {
              status: account.status,
              login_email: account.login_email,
              must_change_password: account.must_change_password,
              invite_method: account.invite_method,
              invite_sent_at: account.invite_sent_at,
              last_login_at: account.last_login_at,
              login_count: account.login_count,
              activated_at: account.activated_at,
            }
          : null,
      }
    })

    return NextResponse.json({
      company_id: ctx.companyId,
      total: rows.length,
      enabled: rows.filter((r) => r.portal).length,
      active: rows.filter((r) => r.portal?.status === "active").length,
      employees: rows,
    })
  } catch (err) {
    return jsonError(err, "Could not load portal access")
  }
}

/**
 * POST — enable / re-invite / reset / suspend / restore portal access.
 * Body: { action, employee_id, employee_ids?, method?, login_email?, reason? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const action = String(body.action || "enable")
    const origin = new URL(request.url).origin
    const ids: string[] = Array.isArray(body.employee_ids)
      ? body.employee_ids.filter(Boolean)
      : body.employee_id
        ? [body.employee_id]
        : []

    if (!ids.length) {
      return NextResponse.json({ error: "employee_id is required" }, { status: 400 })
    }

    if (action === "suspend" || action === "restore" || action === "disable") {
      const status = action === "restore" ? "active" : action === "disable" ? "disabled" : "suspended"
      const updated = []
      for (const id of ids) {
        updated.push(
          await setPortalAccountStatus({
            db: ctx.service,
            companyId: ctx.companyId,
            employeeId: id,
            status,
            reason: body.reason || null,
          }),
        )
      }
      return NextResponse.json({ success: true, action, accounts: updated })
    }

    const method = body.method === "email" ? "email" : "temp_password"
    const results: any[] = []
    const failures: any[] = []

    for (const id of ids) {
      const { data: employee } = await ctx.service
        .from("employees")
        .select("*")
        .eq("id", id)
        .eq("company_id", ctx.companyId)
        .maybeSingle()

      if (!employee) {
        failures.push({ employee_id: id, error: "Employee not found in this organisation" })
        continue
      }

      try {
        const result = await provisionPortalAccess({
          db: ctx.service,
          companyId: ctx.companyId,
          employee,
          method,
          loginEmail: ids.length === 1 ? body.login_email : null,
          invitedBy: ctx.userId,
          origin,
        })
        results.push({
          employee_id: id,
          name: employeeDisplayName(employee),
          login_email: result.loginEmail,
          temp_password: result.tempPassword || null,
          invite_link: result.inviteLink || null,
          status: result.account.status,
        })
      } catch (err: any) {
        failures.push({ employee_id: id, error: err?.message || "Failed" })
      }
    }

    return NextResponse.json({
      success: failures.length === 0,
      action,
      method,
      provisioned: results,
      failures,
    })
  } catch (err) {
    return jsonError(err, "Portal access update failed")
  }
}
