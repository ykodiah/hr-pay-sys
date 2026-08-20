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

const DEFAULT_SETTINGS = {
  configured: false,
  employee_gps_clock_enabled: true,
  require_gps: true,
  allow_web_clock: true,
  biometric_enabled: false,
  attendance_method_label: "GPS and biometric",
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function currentTime() {
  return new Date().toTimeString().slice(0, 5)
}

async function ensureAttendanceSettings(db: any, companyId: string) {
  const { data, error } = await db
    .from("company_attendance_settings")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle()

  if (error) {
    // Missing table / schema lag should not hard-block portal clocking UI.
    if (/does not exist|relation/i.test(error.message || "")) {
      return { ...DEFAULT_SETTINGS, configured: false, schema_missing: true }
    }
    throw new Error(error.message)
  }

  if (data) {
    return {
      ...DEFAULT_SETTINGS,
      ...data,
      configured: true,
      employee_gps_clock_enabled: data.employee_gps_clock_enabled !== false,
      allow_web_clock: data.allow_web_clock !== false,
      require_gps: data.require_gps !== false,
    }
  }

  const seed = {
    company_id: companyId,
    employee_gps_clock_enabled: true,
    require_gps: true,
    allow_web_clock: true,
    biometric_enabled: false,
    attendance_method_label: "GPS and biometric",
    updated_at: new Date().toISOString(),
  }
  const { data: created, error: insertError } = await db
    .from("company_attendance_settings")
    .upsert(seed, { onConflict: "company_id" })
    .select("*")
    .maybeSingle()

  if (insertError) {
    console.warn("[v0] Could not seed company_attendance_settings", insertError.message)
    return { ...DEFAULT_SETTINGS, configured: false }
  }

  return {
    ...DEFAULT_SETTINGS,
    ...(created || seed),
    configured: true,
  }
}

async function loadBiometricDevices(db: any, companyId: string) {
  const primary = await db
    .from("biometric_devices")
    .select("id, name, device_type, type, is_active, last_sync_at, last_sync")
    .eq("company_id", companyId)
    .eq("is_active", true)

  if (!primary.error) {
    return (primary.data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      device_type: row.device_type || row.type || "biometric",
      is_active: row.is_active !== false,
      last_sync_at: row.last_sync_at || row.last_sync || null,
    }))
  }

  // Older schemas only have type / last_sync
  const fallback = await db
    .from("biometric_devices")
    .select("id, name, type, is_active, last_sync")
    .eq("company_id", companyId)
    .eq("is_active", true)

  if (fallback.error) {
    if (/does not exist|relation|column/i.test(fallback.error.message || "")) return []
    throw new Error(fallback.error.message)
  }

  return (fallback.data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    device_type: row.type || "biometric",
    is_active: row.is_active !== false,
    last_sync_at: row.last_sync || null,
  }))
}

export async function GET(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const year = Number(req.nextUrl.searchParams.get("year") || new Date().getFullYear())
    const from = `${year}-01-01`
    const to = `${year}-12-31`

    const [recordsRes, settings, devices] = await Promise.all([
      session.db
        .from("attendance_records")
        .select("*")
        .eq("company_id", session.companyId)
        .eq("employee_id", session.employeeId)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false }),
      ensureAttendanceSettings(session.db, session.companyId),
      loadBiometricDevices(session.db, session.companyId),
    ])

    if (recordsRes.error) {
      if (/does not exist|relation/i.test(recordsRes.error.message || "")) {
        return NextResponse.json({
          records: [],
          current: null,
          summary: { total_hours: 0, overtime_hours: 0 },
          settings: {
            ...settings,
            biometric_enabled: Boolean(devices.length),
            attendance_method_label: devices.length
              ? "Biometric or imported attendance"
              : settings.attendance_method_label,
          },
          devices,
          year,
          warning: "Attendance tables are not installed yet. Run the portal attendance migration.",
        })
      }
      throw new Error(recordsRes.error.message)
    }

    const records = recordsRes.data || []
    const current = records.find((row: any) => row.date === today()) || null

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
      settings: {
        ...settings,
        biometric_enabled: Boolean(settings.biometric_enabled || devices.length),
        attendance_method_label: settings.attendance_method_label ||
          (devices.length ? "GPS and biometric" : "GPS clock"),
      },
      devices,
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

    const settings = await ensureAttendanceSettings(session.db, session.companyId)
    if (settings.schema_missing) {
      return NextResponse.json(
        {
          error:
            "Attendance schema is missing. Run scripts/20260820_payroll_and_attendance_complete.sql in Supabase, then try again.",
        },
        { status: 503 },
      )
    }
    if (settings.employee_gps_clock_enabled !== true || settings.allow_web_clock !== true) {
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
