import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import { renderAttendanceAnalyticsPdf } from "@/lib/services/attendance-analytics-pdf"

/**
 * GET /api/attendance/analytics/pdf?from=&to=
 * Returns printable HTML for monthly HR attendance packs (Print → Save as PDF).
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const sp = request.nextUrl.searchParams
    const now = new Date()
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const defaultTo = now.toISOString().slice(0, 10)
    const from = sp.get("from") || defaultFrom
    const to = sp.get("to") || defaultTo

    const html = await renderAttendanceAnalyticsPdf({
      companyId: ctx.companyId,
      from,
      to,
    })

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    return jsonError(err, "Failed to generate analytics PDF")
  }
}
