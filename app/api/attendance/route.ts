import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import { listAttendance, upsertManualAttendance } from "@/lib/services/attendance-ops-service"

function today() {
  return new Date().toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const sp = request.nextUrl.searchParams
    const result = await listAttendance({
      companyId: ctx.companyId,
      from: sp.get("from") || today(),
      to: sp.get("to") || sp.get("from") || today(),
      status: sp.get("status") || undefined,
      search: sp.get("search") || undefined,
      employeeId: sp.get("employee_id") || undefined,
    })

    return NextResponse.json({ ...result, company_id: ctx.companyId })
  } catch (err) {
    return jsonError(err, "Failed to load attendance")
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    if (!body.employee_id || !body.date) {
      return NextResponse.json({ error: "employee_id and date are required" }, { status: 400 })
    }

    const record = await upsertManualAttendance({
      companyId: ctx.companyId,
      employeeId: body.employee_id,
      date: body.date,
      status: body.status || "present",
      clockIn: body.clock_in ?? body.clockIn ?? null,
      clockOut: body.clock_out ?? body.clockOut ?? null,
      notes: body.notes ?? null,
      source: body.source || "manual",
      method: body.method || "manual",
    })

    return NextResponse.json({ record }, { status: 201 })
  } catch (err) {
    return jsonError(err, "Failed to save attendance")
  }
}
