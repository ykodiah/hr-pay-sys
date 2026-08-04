import { NextRequest, NextResponse } from "next/server"
import { runDueAlertSchedules } from "@/lib/services/attendance-alert-schedule-service"

/**
 * GET/POST /api/attendance/alerts/cron
 * External cron / Vercel cron style runner.
 * Auth: Authorization: Bearer <CRON_SECRET> or ?secret=
 * Optional: company_id, force=1, schedule_id
 */
async function handle(request: NextRequest) {
  try {
    const secret =
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      request.nextUrl.searchParams.get("secret") ||
      ""
    const expected = process.env.CRON_SECRET || process.env.ATTENDANCE_CRON_SECRET || ""

    // Allow unauthenticated in dev when no secret configured; require in production if set
    if (expected && secret !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body =
      request.method === "POST" ? await request.json().catch(() => ({})) : {}
    const companyId =
      body.company_id || request.nextUrl.searchParams.get("company_id") || undefined
    const scheduleId =
      body.schedule_id || request.nextUrl.searchParams.get("schedule_id") || undefined
    const force =
      body.force === true ||
      request.nextUrl.searchParams.get("force") === "1" ||
      request.nextUrl.searchParams.get("force") === "true"

    const result = await runDueAlertSchedules({
      companyId: companyId || undefined,
      scheduleId: scheduleId || undefined,
      force,
    })

    return NextResponse.json({
      success: true,
      ...result,
      hint: "Schedule next_run_at advances after each successful run. Configure CRON_SECRET for production.",
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Cron run failed" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
