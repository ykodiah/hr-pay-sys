import { NextRequest, NextResponse } from "next/server"
import { syncBiometricDevicesDue } from "@/lib/services/attendance-ops-service"

/**
 * GET/POST /api/attendance/devices/cron
 * Auto-pulls punches from devices with API URLs and drains webhook queues.
 * Schedule every 5 minutes (Vercel cron / external scheduler).
 * Auth: Authorization: Bearer <CRON_SECRET> or ?secret=
 */
async function handle(request: NextRequest) {
  try {
    const secret =
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      request.nextUrl.searchParams.get("secret") ||
      ""
    const expected = process.env.CRON_SECRET || process.env.ATTENDANCE_CRON_SECRET || ""
    if (expected && secret !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = request.method === "POST" ? await request.json().catch(() => ({})) : {}
    const companyId =
      body.company_id || request.nextUrl.searchParams.get("company_id") || undefined
    const deviceId =
      body.device_id || request.nextUrl.searchParams.get("device_id") || undefined
    const force =
      body.force === true ||
      request.nextUrl.searchParams.get("force") === "1" ||
      request.nextUrl.searchParams.get("force") === "true"

    const result = await syncBiometricDevicesDue({
      companyId: companyId || undefined,
      deviceId: deviceId || undefined,
      force,
    })

    return NextResponse.json({
      success: true,
      ...result,
      scheduleHint:
        "Point a 5-minute cron at this endpoint. Webhook-configured devices already push without Sync now.",
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Device cron failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
