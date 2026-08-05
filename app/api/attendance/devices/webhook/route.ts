import { NextRequest, NextResponse } from "next/server"
import { ingestBiometricPunches } from "@/lib/services/attendance-ops-service"

/**
 * Device/cloud connector push endpoint.
 * POST /api/attendance/devices/webhook?token=<webhook_token>
 * body: { punches: [{ employee_code, timestamp, type }] } or a raw array
 */
export async function POST(request: NextRequest) {
  try {
    const token =
      request.nextUrl.searchParams.get("token") ||
      request.headers.get("x-device-token") ||
      ""
    const body = await request.json().catch(() => ({}))
    if (!token && !body.device_id && !body.deviceId) {
      return NextResponse.json({ error: "token or device_id required" }, { status: 400 })
    }

    const result = await ingestBiometricPunches({
      token: token || undefined,
      deviceId: body.device_id || body.deviceId,
      companyId: body.company_id,
      punches: body.punches ?? body.data ?? body,
    })
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook ingest failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
