import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"

/** GET /api/attendance/gps-audit — recent GPS clock events */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const sp = request.nextUrl.searchParams
    const employeeId = sp.get("employee_id")
    const limit = Math.min(200, Math.max(10, Number(sp.get("limit") || 50)))

    let query = ctx.service
      .from("attendance_gps_audit")
      .select(
        `*, employees!attendance_gps_audit_employee_id_fkey(id, first_name, last_name, employee_id),
         attendance_geofences(name)`,
      )
      .eq("company_id", ctx.companyId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (employeeId) query = query.eq("employee_id", employeeId)

    const { data, error } = await query
    if (error) {
      const fb = await ctx.service
        .from("attendance_gps_audit")
        .select("*")
        .eq("company_id", ctx.companyId)
        .order("created_at", { ascending: false })
        .limit(limit)
      if (fb.error) throw new Error(fb.error.message)
      return NextResponse.json({ audits: fb.data || [] })
    }

    const audits = (data || []).map((r: any) => ({
      ...r,
      employee_name: r.employees
        ? `${r.employees.first_name || ""} ${r.employees.last_name || ""}`.trim()
        : null,
      geofence_name: r.attendance_geofences?.name || null,
    }))

    return NextResponse.json({ audits })
  } catch (err) {
    return jsonError(err, "Failed to load GPS audit")
  }
}
