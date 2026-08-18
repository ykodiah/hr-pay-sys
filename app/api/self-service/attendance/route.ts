import { NextRequest, NextResponse } from "next/server"
import {
  isPortalError,
  logPortalActivity,
  portalJsonError,
  requirePortalSession,
} from "@/lib/self-service/portal-session"
import { upsertManualAttendance } from "@/lib/services/attendance-ops-service"
import {
  computeHoursWithShift,
  detectAttendanceStatus,
  findMatchingGeofence,
  resolveEmployeeShift,
} from "@/lib/services/attendance-geo-shift"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function today() {
  return new Date().toISOString().slice(0, 10)
}

function currentTime() {
  return new Date().toTimeString().slice(0, 5)
}

export async function GET(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const year = Number(req.nextUrl.searchParams.get("year") || new Date().getFullYear())
    const from = `${year}-01-01`
    const to = `${year}-12-31`

    const [recordsRes, settingsRes, devicesRes] = await Promise.all([
      session.db
        .from("attendance_records")
        .select("*")
        .eq("company_id", session.companyId)
        .eq("employee_id", session.employeeId)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false }),
      session.db
        .from("company_attendance_settings")
        .select("*")
        .eq("company_id", session.companyId)
        .maybeSingle(),
      session.db
        .from("biometric_devices")
        .select("id, name, device_type, is_active, last_sync_at")
        .eq("company_id", session.companyId)
        .eq("is_active", true),
    ])

    if (recordsRes.error) throw new Error(recordsRes.error.message)
    const records = recordsRes.data || []
    const current = records.find((row: any) => row.date === today()) || null
    const settings = settingsRes.data || {
      employee_gps_clock_enabled: true,
      require_gps: true,
      allow_web_clock: true,
      biometric_enabled: Boolean(devicesRes.data?.length),
      attendance_method_label: devicesRes.data?.length ? "GPS and biometric" : "GPS clock",
    }

    const summary = records.reduce(
      (acc: Record<string, number>, row: any) => {
        const status = String(row.status || "unknown").toLowerCase()
        acc[status] = (acc[status] || 0) + 1
        acc.total_hours += Number(row.total_hours || 0)
        acc.overtime_hours += Number(row.overtime_hours || 0)
        return acc
      },
      { total_hours: 0, overtime_hours: 0 },
    )

    return NextResponse.json({
      records,
      current,
      summary,
      settings,
      devices: devicesRes.data || [],
      year,
    })
  } catch (err) {
    return portalJsonError(err, "Failed to load attendance")
  }
}

export async function POST(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body.action || "").toLowerCase()
    if (!["clock_in", "clock_out"].includes(action)) {
      return NextResponse.json({ error: "Choose clock in or clock out" }, { status: 400 })
    }

    const { data: settings } = await session.db
      .from("company_attendance_settings")
      .select("*")
      .eq("company_id", session.companyId)
      .maybeSingle()
    if (settings && (settings.employee_gps_clock_enabled === false || settings.allow_web_clock === false)) {
      return NextResponse.json(
        { error: "Portal clocking is disabled. Your biometric or imported attendance will still appear here." },
        { status: 403 },
      )
    }

    const latitude = body.latitude == null ? null : Number(body.latitude)
    const longitude = body.longitude == null ? null : Number(body.longitude)
    const accuracy = body.accuracy == null ? null : Number(body.accuracy)
    if ((settings?.require_gps ?? true) && (!Number.isFinite(latitude) || !Number.isFinite(longitude))) {
      return NextResponse.json({ error: "Allow location access to mark attendance" }, { status: 400 })
    }

    const date = today()
    const time = currentTime()
    const shift = await resolveEmployeeShift(session.db, session.companyId, session.employeeId, date)
    const { data: existing } = await session.db
      .from("attendance_records")
      .select("*")
      .eq("company_id", session.companyId)
      .eq("employee_id", session.employeeId)
      .eq("date", date)
      .maybeSingle()

    const geo =
      latitude != null && longitude != null
        ? await findMatchingGeofence(session.db, session.companyId, latitude, longitude)
        : null
    if (geo?.geofence) {
      const enforce =
        action === "clock_out"
          ? geo.geofence.enforce_on_clock_out
          : geo.geofence.enforce_on_clock_in !== false
      if (enforce && !geo.inside) {
        return NextResponse.json(
          {
            error: `You are outside ${geo.geofence.name}. Move within ${geo.geofence.radius_meters} metres to clock.`,
            distance_meters: geo.distance,
          },
          { status: 403 },
        )
      }
    }

    if (action === "clock_in" && existing?.clock_in) {
      return NextResponse.json({ error: "You have already clocked in today" }, { status: 409 })
    }
    if (action === "clock_out" && !existing?.clock_in) {
      return NextResponse.json({ error: "Clock in before clocking out" }, { status: 400 })
    }
    if (action === "clock_out" && existing?.clock_out) {
      return NextResponse.json({ error: "You have already clocked out today" }, { status: 409 })
    }

    let record: any
    if (action === "clock_in") {
      const status = detectAttendanceStatus({ clockIn: time, shift, date })
      record = await upsertManualAttendance({
        companyId: session.companyId,
        employeeId: session.employeeId,
        date,
        status,
        clockIn: time,
        clockOut: existing?.clock_out || null,
        source: "employee_portal",
        method: "portal_gps",
        shiftId: shift?.id,
        gpsLat: latitude,
        gpsLng: longitude,
        geofenceId: geo?.geofence?.id,
        autoDetectStatus: true,
      })
    } else {
      const hours = computeHoursWithShift(existing.clock_in, time, shift)
      const status = detectAttendanceStatus({ clockIn: existing.clock_in, clockOut: time, shift, date })
      const { data, error } = await session.db
        .from("attendance_records")
        .update({
          clock_out: time,
          clock_out_method: "portal_gps",
          clock_out_gps_lat: latitude,
          clock_out_gps_lng: longitude,
          total_hours: hours.totalHours,
          overtime_hours: hours.overtimeHours,
          status,
          geofence_id: geo?.geofence?.id || existing.geofence_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .eq("employee_id", session.employeeId)
        .eq("company_id", session.companyId)
        .select("*")
        .single()
      if (error) throw new Error(error.message)
      record = data
    }

    if (latitude != null && longitude != null) {
      // GPS auditing is supplementary; an audit-table issue must not make a
      // successfully saved attendance event look like it failed.
      await session.db.from("attendance_gps_audit").insert({
        company_id: session.companyId,
        employee_id: session.employeeId,
        attendance_record_id: record?.id || null,
        event_type: action,
        latitude,
        longitude,
        accuracy_meters: accuracy,
        inside_geofence: geo?.inside ?? null,
        geofence_id: geo?.geofence?.id || null,
        distance_meters: geo?.distance ?? null,
        device_info: body.device_info || {},
      }).then(() => undefined, () => undefined)
    }

    await logPortalActivity(session, action, `${date} ${time}`, { attendance_record_id: record?.id })
    return NextResponse.json({ success: true, record, shift, geofence: geo })
  } catch (err) {
    return portalJsonError(err, "Could not mark attendance")
  }
}
