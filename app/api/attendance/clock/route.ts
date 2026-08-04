import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import { upsertManualAttendance } from "@/lib/services/attendance-ops-service"
import {
  findMatchingGeofence,
  resolveEmployeeShift,
  detectAttendanceStatus,
  computeHoursWithShift,
} from "@/lib/services/attendance-geo-shift"

function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * POST /api/attendance/clock
 * Geofenced mobile/web clock-in or clock-out with GPS audit.
 * Body: { action: clock_in|clock_out, employee_id?, latitude, longitude, accuracy?, device_info? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const action = String(body.action || "clock_in").toLowerCase()
    let employeeId = body.employee_id as string | undefined

    // Resolve employee from auth user if not provided
    if (!employeeId && ctx.userId) {
      const { data: me } = await ctx.service
        .from("employees")
        .select("id")
        .eq("company_id", ctx.companyId)
        .or(`id.eq.${ctx.userId},user_id.eq.${ctx.userId}`)
        .limit(1)
        .maybeSingle()
      employeeId = me?.id
      if (!employeeId) {
        const { data: byEmail } = await ctx.service
          .from("employees")
          .select("id")
          .eq("company_id", ctx.companyId)
          .limit(1)
        // Prefer explicit employee_id for admin clocking someone in
      }
    }
    if (!employeeId) {
      return NextResponse.json({ error: "employee_id required" }, { status: 400 })
    }

    const lat = body.latitude != null ? Number(body.latitude) : null
    const lng = body.longitude != null ? Number(body.longitude) : null
    const accuracy = body.accuracy != null ? Number(body.accuracy) : null
    const date = body.date || today()
    const time = body.time || nowTime()

    // Verify employee in company
    const { data: emp } = await ctx.service
      .from("employees")
      .select("id, first_name, last_name, company_id")
      .eq("id", employeeId)
      .eq("company_id", ctx.companyId)
      .maybeSingle()
    if (!emp) return NextResponse.json({ error: "Employee not found" }, { status: 404 })

    let geoMatch: Awaited<ReturnType<typeof findMatchingGeofence>> = null
    if (lat != null && lng != null) {
      geoMatch = await findMatchingGeofence(ctx.service, ctx.companyId, lat, lng)
    }

    // Enforce geofence when configured
    if (geoMatch?.geofence) {
      const enforce =
        action === "clock_out"
          ? geoMatch.geofence.enforce_on_clock_out
          : geoMatch.geofence.enforce_on_clock_in !== false
      if (enforce && !geoMatch.inside) {
        return NextResponse.json(
          {
            error: `Outside geofence "${geoMatch.geofence.name}" (${geoMatch.distance}m away; allowed ${geoMatch.geofence.radius_meters}m)`,
            geofence: geoMatch.geofence,
            distance_meters: geoMatch.distance,
          },
          { status: 403 },
        )
      }
    } else if (lat != null && lng != null) {
      // Check if company requires geofence
      const { data: anyFence } = await ctx.service
        .from("attendance_geofences")
        .select("id")
        .eq("company_id", ctx.companyId)
        .eq("is_active", true)
        .limit(1)
      if (anyFence?.length) {
        return NextResponse.json(
          { error: "No matching geofence — move closer to an approved site" },
          { status: 403 },
        )
      }
    }

    const shift = await resolveEmployeeShift(ctx.service, ctx.companyId, employeeId, date)
    const { data: existing } = await ctx.service
      .from("attendance_records")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("date", date)
      .maybeSingle()

    let record: any
    if (action === "clock_out") {
      if (!existing?.clock_in && !body.allow_out_without_in) {
        return NextResponse.json({ error: "Clock in first before clocking out" }, { status: 400 })
      }
      const clockIn = existing?.clock_in || null
      const hours = computeHoursWithShift(clockIn, time, shift)
      const status = detectAttendanceStatus({
        clockIn,
        clockOut: time,
        shift,
        date,
      })
      const update: Record<string, any> = {
        clock_out: time,
        clock_out_method: body.method || "mobile_gps",
        clock_out_gps_lat: lat,
        clock_out_gps_lng: lng,
        total_hours: hours.totalHours,
        overtime_hours: hours.overtimeHours,
        status: existing?.status === "leave" ? "leave" : status,
        shift_id: shift?.id || existing?.shift_id || null,
        geofence_id: geoMatch?.geofence?.id || existing?.geofence_id || null,
        updated_at: new Date().toISOString(),
      }
      if (existing?.id) {
        const { data, error } = await ctx.service
          .from("attendance_records")
          .update(update)
          .eq("id", existing.id)
          .select()
          .single()
        if (error) throw new Error(error.message)
        record = data
      } else {
        record = await upsertManualAttendance({
          companyId: ctx.companyId,
          employeeId,
          date,
          status,
          clockIn: null,
          clockOut: time,
          source: "mobile",
          method: "mobile_gps",
          shiftId: shift?.id,
          gpsLat: lat,
          gpsLng: lng,
          geofenceId: geoMatch?.geofence?.id,
        })
      }
    } else {
      // clock_in
      const status = detectAttendanceStatus({ clockIn: time, shift, date })
      record = await upsertManualAttendance({
        companyId: ctx.companyId,
        employeeId,
        date,
        status,
        clockIn: time,
        clockOut: existing?.clock_out || null,
        source: "mobile",
        method: body.method || "mobile_gps",
        shiftId: shift?.id,
        gpsLat: lat,
        gpsLng: lng,
        geofenceId: geoMatch?.geofence?.id,
        notes: status === "late" ? `Late vs shift ${shift?.name || "default"}` : null,
        autoDetectStatus: true,
      })
    }

    // GPS audit
    if (lat != null && lng != null) {
      await ctx.service.from("attendance_gps_audit").insert({
        company_id: ctx.companyId,
        employee_id: employeeId,
        attendance_record_id: record?.id || null,
        event_type: action === "clock_out" ? "clock_out" : "clock_in",
        latitude: lat,
        longitude: lng,
        accuracy_meters: accuracy,
        inside_geofence: geoMatch?.inside ?? null,
        geofence_id: geoMatch?.geofence?.id || null,
        distance_meters: geoMatch?.distance ?? null,
        device_info: body.device_info || {},
        notes: body.notes || null,
      })
    }

    return NextResponse.json({
      success: true,
      action,
      record,
      shift,
      geofence: geoMatch
        ? {
            id: geoMatch.geofence.id,
            name: geoMatch.geofence.name,
            inside: geoMatch.inside,
            distance_meters: geoMatch.distance,
            radius_meters: geoMatch.geofence.radius_meters,
          }
        : null,
      status: record?.status,
      late: record?.status === "late",
    })
  } catch (err) {
    return jsonError(err, "Clock action failed")
  }
}
