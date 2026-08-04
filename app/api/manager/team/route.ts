import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import {
  getTeamEmployeeIds,
  listTeamMembers,
  resolveCurrentEmployee,
} from "@/lib/services/manager-team-service"

/** GET /api/manager/team — employees reporting to current user (or ?manager_id=) */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const sp = request.nextUrl.searchParams
    let managerId = sp.get("manager_id")
    const me = await resolveCurrentEmployee(ctx.service, ctx.companyId, ctx.userId)

    if (!managerId) {
      managerId = me?.id || sp.get("as_employee_id") || ""
    }
    if (!managerId) {
      // Admin fallback: list employees who have direct reports
      const { data: all } = await ctx.service
        .from("employees")
        .select("id, first_name, last_name, employee_id, department, position, status, direct_supervisor")
        .eq("company_id", ctx.companyId)
        .in("status", ["active", "Active", "ACTIVE", "probation"])
        .order("first_name")
        .limit(500)
      return NextResponse.json({
        team: all || [],
        mode: "admin_all",
        manager: null,
        company_id: ctx.companyId,
      })
    }

    const team = await listTeamMembers(ctx.service, ctx.companyId, managerId)
    const ids = await getTeamEmployeeIds(ctx.service, ctx.companyId, managerId)
    return NextResponse.json({
      team,
      team_ids: ids,
      manager: me,
      mode: "manager",
      company_id: ctx.companyId,
    })
  } catch (err) {
    return jsonError(err, "Failed to load team")
  }
}
