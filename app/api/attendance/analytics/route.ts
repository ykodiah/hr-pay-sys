import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import { getAttendanceAnalytics } from "@/lib/services/attendance-analytics-service"

function today() {
  return new Date().toISOString().slice(0, 10)
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

/** GET /api/attendance/analytics?from=&to= — company-scoped attendance analytics */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const sp = request.nextUrl.searchParams
    const from = sp.get("from") || daysAgo(30)
    const to = sp.get("to") || today()

    const analytics = await getAttendanceAnalytics({
      companyId: ctx.companyId,
      from,
      to,
    })

    return NextResponse.json({ success: true, ...analytics })
  } catch (err) {
    return jsonError(err, "Failed to load attendance analytics")
  }
}
