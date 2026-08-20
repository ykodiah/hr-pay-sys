/**
 * Shared attendance helpers: shift resolution, late detection, haversine geofence.
 */

export function parseTimeToMinutes(t: string | null | undefined): number | null {
  if (!t) return null
  const m = String(t).match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = Math.round(mins % 60)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** Haversine distance in meters */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100
}

export type ShiftLike = {
  id?: string
  start_time?: string
  end_time?: string
  grace_period_minutes?: number
  break_duration_minutes?: number
  expected_hours?: number
  working_days?: string[] | null
  name?: string
}

const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

export function isWorkingDay(shift: ShiftLike | null | undefined, dateIso: string): boolean {
  const days = shift?.working_days
  if (!days || !days.length) {
    const d = new Date(`${dateIso}T12:00:00`).getDay()
    return d !== 0 && d !== 6
  }
  const key = DOW[new Date(`${dateIso}T12:00:00`).getDay()]
  return days.map((x) => String(x).toLowerCase().slice(0, 3)).includes(key)
}

/**
 * Shift-aware status from clock-in time.
 * late if clock_in > start + grace; half_day heuristics left to caller.
 */
export function detectAttendanceStatus(input: {
  clockIn?: string | null
  clockOut?: string | null
  shift?: ShiftLike | null
  date?: string
}): "present" | "late" | "absent" | "half_day" {
  const shift = input.shift
  const grace = Number(shift?.grace_period_minutes ?? 15)
  const start = parseTimeToMinutes(shift?.start_time || "08:00") ?? 8 * 60
  const end = parseTimeToMinutes(shift?.end_time || "17:00") ?? 17 * 60
  const cin = parseTimeToMinutes(input.clockIn)
  const cout = parseTimeToMinutes(input.clockOut)

  if (cin == null && cout == null) return "absent"
  if (cin == null) return "absent"

  if (input.date && shift && !isWorkingDay(shift, input.date)) {
    return "present"
  }

  if (cin > start + grace) {
    // Very late → half day if after midday of shift
    const mid = start + (end - start) / 2
    if (cin >= mid) return "half_day"
    return "late"
  }
  return "present"
}

export function computeHoursWithShift(
  clockIn: string | null,
  clockOut: string | null,
  shift?: ShiftLike | null,
): { totalHours: number; overtimeHours: number } {
  const a = parseTimeToMinutes(clockIn)
  const b = parseTimeToMinutes(clockOut)
  if (a == null || b == null || b <= a) return { totalHours: 0, overtimeHours: 0 }
  const breakMins = Number(shift?.break_duration_minutes ?? 0)
  const mins = Math.max(0, b - a - breakMins)
  const totalHours = Math.round((mins / 60) * 100) / 100
  const expected = Number(shift?.expected_hours ?? 8)
  const overtimeHours = Math.max(0, Math.round((totalHours - expected) * 100) / 100)
  return { totalHours, overtimeHours }
}

/** Resolve employee's primary shift for a date (service client). */
export async function resolveEmployeeShift(
  service: any,
  companyId: string,
  employeeId: string,
  dateIso: string,
): Promise<ShiftLike | null> {
  try {
    const { data: assign, error: assignError } = await service
      .from("employee_shift_assignments")
      .select("shift_id, effective_from, effective_to, is_primary")
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .lte("effective_from", dateIso)
      .order("is_primary", { ascending: false })
      .order("effective_from", { ascending: false })
      .limit(10)

    if (!assignError) {
      const row = (assign || []).find(
        (a: any) => !a.effective_to || a.effective_to >= dateIso,
      )
      if (row?.shift_id) {
        const { data: shift } = await service
          .from("shifts")
          .select("*")
          .eq("id", row.shift_id)
          .eq("company_id", companyId)
          .maybeSingle()
        if (shift) return shift
      }
    }

    // Fallback: company default active shift
    const { data: fallback, error: shiftError } = await service
      .from("shifts")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (shiftError && /does not exist|relation/i.test(shiftError.message || "")) return null
    return fallback || null
  } catch {
    return null
  }
}

export async function findMatchingGeofence(
  service: any,
  companyId: string,
  lat: number,
  lng: number,
): Promise<{ geofence: any; distance: number; inside: boolean } | null> {
  const { data: fences, error } = await service
    .from("attendance_geofences")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)

  if (error || !fences?.length) return null

  let best: { geofence: any; distance: number; inside: boolean } | null = null
  for (const g of fences) {
    const dist = haversineMeters(lat, lng, Number(g.latitude), Number(g.longitude))
    const inside = dist <= Number(g.radius_meters || 150)
    if (!best || dist < best.distance) {
      best = { geofence: g, distance: dist, inside }
    }
  }
  return best
}
