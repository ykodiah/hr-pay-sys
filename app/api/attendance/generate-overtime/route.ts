import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import { generateOvertimeFromAttendance } from "@/lib/services/attendance-ops-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const from = body.from || new Date().toISOString().slice(0, 10)
    const to = body.to || from
    const result = await generateOvertimeFromAttendance({
      companyId: ctx.companyId,
      from,
      to,
      minHours: Number(body.min_hours ?? 0.5),
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return jsonError(err, "Failed to generate overtime from attendance")
  }
}
