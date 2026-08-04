/**
 * Attendance operations — list, manual mark, biometric CSV import,
 * shifts/devices, and overtime generation from worked hours.
 */

export type AttendanceStatus = "present" | "absent" | "late" | "half_day" | "leave" | "holiday" | "weekend"

function parseTimeToMinutes(t: string | null | undefined): number | null {
  if (!t) return null
  const m = String(t).match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

export function computeHours(clockIn: string | null, clockOut: string | null, breakMinutes = 0): {
  totalHours: number
  overtimeHours: number
} {
  const a = parseTimeToMinutes(clockIn)
  const b = parseTimeToMinutes(clockOut)
  if (a == null || b == null || b <= a) return { totalHours: 0, overtimeHours: 0 }
  const mins = Math.max(0, b - a - breakMinutes)
  const totalHours = Math.round((mins / 60) * 100) / 100
  const overtimeHours = Math.max(0, Math.round((totalHours - 8) * 100) / 100)
  return { totalHours, overtimeHours }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

async function getDb() {
  const { createServiceClient } = await import("@/lib/supabase/server")
  return createServiceClient()
}

export async function listAttendance(input: {
  companyId: string
  from?: string
  to?: string
  status?: string
  search?: string
  employeeId?: string
}) {
  const supabase = await getDb()
  const from = input.from || todayIso()
  const to = input.to || from

  const { data: employees } = await supabase
    .from("employees")
    .select("id, first_name, last_name, employee_id, department, position, status")
    .eq("company_id", input.companyId)
    .in("status", ["active", "Active", "ACTIVE", "probation", "Probation"])

  const empList = employees || []
  const empIds = empList.map((e: any) => e.id)
  if (!empIds.length) return { records: [], stats: emptyStats(), employees: [] }

  let query = supabase
    .from("attendance_records")
    .select("*")
    .in("employee_id", empIds.slice(0, 800))
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false })

  if (input.status && input.status !== "all") query = query.eq("status", input.status)
  if (input.employeeId) query = query.eq("employee_id", input.employeeId)

  const { data, error } = await query
  if (error && /does not exist/i.test(error.message)) {
    return { records: [], stats: emptyStats(), employees: empList, warning: error.message }
  }
  if (error) throw new Error(error.message)

  const empMap = new Map(empList.map((e: any) => [e.id, e]))
  let records = (data || []).map((r: any) => {
    const emp = empMap.get(r.employee_id)
    const name = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "Employee"
    return {
      ...r,
      employee_name: name,
      employee_code: emp?.employee_id || null,
      department: emp?.department || null,
      position: emp?.position || null,
    }
  })

  if (input.search) {
    const q = input.search.toLowerCase()
    records = records.filter(
      (r: any) =>
        r.employee_name?.toLowerCase().includes(q) ||
        r.employee_code?.toLowerCase().includes(q) ||
        r.department?.toLowerCase().includes(q),
    )
  }

  return { records, stats: buildStats(records), employees: empList }
}

function emptyStats() {
  return { present: 0, absent: 0, late: 0, leave: 0, half_day: 0, total: 0, avgHours: 0, overtimeHours: 0 }
}

function buildStats(records: any[]) {
  const stats = emptyStats()
  stats.total = records.length
  let hours = 0
  for (const r of records) {
    const s = String(r.status || "").toLowerCase()
    if (s in stats) (stats as any)[s] += 1
    hours += Number(r.total_hours || 0)
    stats.overtimeHours += Number(r.overtime_hours || 0)
  }
  stats.avgHours = records.length ? Math.round((hours / records.length) * 10) / 10 : 0
  stats.overtimeHours = Math.round(stats.overtimeHours * 10) / 10
  return stats
}

export async function upsertManualAttendance(input: {
  companyId: string
  employeeId: string
  date: string
  status: AttendanceStatus
  clockIn?: string | null
  clockOut?: string | null
  notes?: string | null
  source?: string
  method?: string
  shiftId?: string | null
  gpsLat?: number | null
  gpsLng?: number | null
  geofenceId?: string | null
  autoDetectStatus?: boolean
}) {
  const supabase = await getDb()
  const { data: emp } = await supabase
    .from("employees")
    .select("id, company_id")
    .eq("id", input.employeeId)
    .eq("company_id", input.companyId)
    .maybeSingle()
  if (!emp?.id) throw new Error("Employee not found in your company")

  const { resolveEmployeeShift, detectAttendanceStatus, computeHoursWithShift } = await import(
    "@/lib/services/attendance-geo-shift"
  )

  let shift =
    input.shiftId
      ? (
          await supabase
            .from("shifts")
            .select("*")
            .eq("id", input.shiftId)
            .eq("company_id", input.companyId)
            .maybeSingle()
        ).data
      : await resolveEmployeeShift(supabase, input.companyId, input.employeeId, input.date)

  const { totalHours, overtimeHours } = computeHoursWithShift(
    input.clockIn || null,
    input.clockOut || null,
    shift,
  )

  let status = input.status
  if (input.autoDetectStatus !== false && input.clockIn && (status === "present" || !input.status)) {
    status = detectAttendanceStatus({
      clockIn: input.clockIn,
      clockOut: input.clockOut,
      shift,
      date: input.date,
    }) as AttendanceStatus
  }

  const row: Record<string, any> = {
    company_id: input.companyId,
    employee_id: input.employeeId,
    date: input.date,
    status,
    clock_in: input.clockIn || null,
    clock_out: input.clockOut || null,
    clock_in_method: input.method || "manual",
    clock_out_method: input.clockOut ? input.method || "manual" : null,
    total_hours: totalHours,
    overtime_hours: overtimeHours,
    notes: input.notes || null,
    source: input.source || "manual",
    shift_id: shift?.id || input.shiftId || null,
    updated_at: new Date().toISOString(),
  }
  if (input.gpsLat != null) row.clock_in_gps_lat = input.gpsLat
  if (input.gpsLng != null) row.clock_in_gps_lng = input.gpsLng
  if (input.geofenceId) row.geofence_id = input.geofenceId

  const { data: existing } = await supabase
    .from("attendance_records")
    .select("id")
    .eq("employee_id", input.employeeId)
    .eq("date", input.date)
    .maybeSingle()

  if (existing?.id) {
    const { data, error } = await supabase
      .from("attendance_records")
      .update(row)
      .eq("id", existing.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return { ...data, shift }
  }

  const { data, error } = await supabase.from("attendance_records").insert(row).select().single()
  if (error) throw new Error(error.message)
  return { ...data, shift }
}

export async function bulkUpsertAttendance(
  companyId: string,
  rows: Array<{
    employeeId: string
    date: string
    status?: AttendanceStatus
    clockIn?: string | null
    clockOut?: string | null
    notes?: string | null
  }>,
  opts?: { source?: string; method?: string; batchId?: string; deviceId?: string },
) {
  const results = { imported: 0, skipped: 0, errors: [] as string[] }
  for (const r of rows) {
    try {
      if (!r.employeeId || !r.date) {
        results.skipped += 1
        continue
      }
      const status: AttendanceStatus =
        r.status ||
        (r.clockIn ? "present" : "absent")
      await upsertManualAttendance({
        companyId,
        employeeId: r.employeeId,
        date: r.date,
        status,
        clockIn: r.clockIn,
        clockOut: r.clockOut,
        notes: r.notes,
        source: opts?.source || "biometric_csv",
        method: opts?.method || "biometric",
      })
      // attach batch if possible
      if (opts?.batchId) {
        const supabase = await getDb()
        await supabase
          .from("attendance_records")
          .update({
            import_batch_id: opts.batchId,
            clock_in_device_id: opts.deviceId || null,
          })
          .eq("employee_id", r.employeeId)
          .eq("date", r.date)
      }
      results.imported += 1
    } catch (err) {
      results.errors.push(err instanceof Error ? err.message : "row failed")
      results.skipped += 1
    }
  }
  return results
}

/** Parse CSV: employee_code/email/id, date, clock_in, clock_out, status */
export function parseAttendanceCsv(csvText: string): Array<{
  employeeKey: string
  date: string
  clockIn: string | null
  clockOut: string | null
  status: AttendanceStatus | null
}> {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return []

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, "_"))
  const idx = (names: string[]) => headers.findIndex((h) => names.some((n) => h.includes(n)))

  const empIdx = idx(["employee_code", "employee_id", "emp_code", "staff_id", "badge", "pin", "email", "employee"])
  const dateIdx = idx(["date", "work_date", "attendance_date"])
  const inIdx = idx(["clock_in", "check_in", "time_in", "in_time", "punch_in"])
  const outIdx = idx(["clock_out", "check_out", "time_out", "out_time", "punch_out"])
  const statusIdx = idx(["status", "attendance_status"])

  if (empIdx < 0 || dateIdx < 0) {
    throw new Error("CSV must include employee identifier and date columns")
  }

  const rows = []
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line)
    const employeeKey = cols[empIdx]?.trim()
    const dateRaw = cols[dateIdx]?.trim()
    if (!employeeKey || !dateRaw) continue
    const date = normalizeDate(dateRaw)
    if (!date) continue
    const statusRaw = statusIdx >= 0 ? cols[statusIdx]?.trim().toLowerCase() : ""
    const status = (["present", "absent", "late", "half_day", "leave"].includes(statusRaw)
      ? statusRaw
      : null) as AttendanceStatus | null
    rows.push({
      employeeKey,
      date,
      clockIn: inIdx >= 0 ? normalizeTime(cols[inIdx]) : null,
      clockOut: outIdx >= 0 ? normalizeTime(cols[outIdx]) : null,
      status,
    })
  }
  return rows
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQ = !inQ
      continue
    }
    if (ch === "," && !inQ) {
      out.push(cur.trim())
      cur = ""
      continue
    }
    cur += ch
  }
  out.push(cur.trim())
  return out
}

function normalizeDate(raw: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const dmy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`
  }
  const dt = new Date(raw)
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10)
  return null
}

function normalizeTime(raw?: string): string | null {
  if (!raw) return null
  const t = raw.trim()
  const m = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return null
  return `${m[1].padStart(2, "0")}:${m[2]}`
}

export async function resolveEmployeesByKeys(companyId: string, keys: string[]) {
  const supabase = await getDb()
  const unique = [...new Set(keys.map((k) => k.trim()).filter(Boolean))]
  const { data } = await supabase
    .from("employees")
    .select("id, employee_id, email, first_name, last_name")
    .eq("company_id", companyId)

  const map = new Map<string, string>()
  for (const e of data || []) {
    if (e.employee_id) map.set(String(e.employee_id).toLowerCase(), e.id)
    if (e.email) map.set(String(e.email).toLowerCase(), e.id)
    map.set(String(e.id).toLowerCase(), e.id)
    const name = `${e.first_name || ""} ${e.last_name || ""}`.trim().toLowerCase()
    if (name) map.set(name, e.id)
  }

  return unique.map((k) => ({ key: k, employeeId: map.get(k.toLowerCase()) || null }))
}

export async function importAttendanceCsv(input: {
  companyId: string
  csvText: string
  deviceId?: string | null
  uploadedBy?: string | null
  filename?: string
}) {
  const parsed = parseAttendanceCsv(input.csvText)
  const resolved = await resolveEmployeesByKeys(
    input.companyId,
    parsed.map((p) => p.employeeKey),
  )
  const keyToId = new Map(resolved.map((r) => [r.key, r.employeeId]))

  const supabase = await getDb()
  const { data: batch, error: bErr } = await supabase
    .from("attendance_import_batches")
    .insert({
      company_id: input.companyId,
      device_id: input.deviceId || null,
      source: "csv",
      filename: input.filename || "upload.csv",
      total_rows: parsed.length,
      status: "processing",
      uploaded_by: input.uploadedBy || null,
    })
    .select("id")
    .single()

  if (bErr) {
    // Still import without batch if table missing
    console.warn("[attendance-import] batch create:", bErr.message)
  }

  const rows = parsed
    .map((p) => {
      const employeeId = keyToId.get(p.employeeKey)
      if (!employeeId) return null
      return {
        employeeId,
        date: p.date,
        clockIn: p.clockIn,
        clockOut: p.clockOut,
        status: p.status || undefined,
      }
    })
    .filter(Boolean) as any[]

  const result = await bulkUpsertAttendance(input.companyId, rows, {
    source: "biometric_csv",
    method: "biometric",
    batchId: batch?.id,
    deviceId: input.deviceId || undefined,
  })

  if (batch?.id) {
    await supabase
      .from("attendance_import_batches")
      .update({
        imported_rows: result.imported,
        skipped_rows: result.skipped,
        error_rows: result.errors.length,
        errors: result.errors.slice(0, 50),
        status: "completed",
      })
      .eq("id", batch.id)

    if (input.deviceId) {
      await supabase
        .from("biometric_devices")
        .update({ last_sync: new Date().toISOString(), status: "online", updated_at: new Date().toISOString() })
        .eq("id", input.deviceId)
    }
  }

  return { ...result, batchId: batch?.id || null, totalParsed: parsed.length }
}

export async function listShifts(companyId: string) {
  const supabase = await getDb()
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("company_id", companyId)
    .order("name")
  if (error) {
    if (/does not exist/i.test(error.message)) return []
    throw new Error(error.message)
  }
  return data || []
}

export async function saveShift(companyId: string, payload: any, id?: string) {
  const supabase = await getDb()
  const row = {
    company_id: companyId,
    name: String(payload.name || "").trim(),
    code: payload.code || null,
    start_time: payload.start_time || "08:00",
    end_time: payload.end_time || "17:00",
    break_duration_minutes: Number(payload.break_duration_minutes ?? 60),
    grace_period_minutes: Number(payload.grace_period_minutes ?? 15),
    working_days: Array.isArray(payload.working_days)
      ? payload.working_days
      : ["monday", "tuesday", "wednesday", "thursday", "friday"],
    expected_hours: Number(payload.expected_hours ?? 8),
    department: payload.department || null,
    location: payload.location || null,
    is_active: payload.is_active !== false,
    updated_at: new Date().toISOString(),
  }
  if (!row.name) throw new Error("Shift name is required")

  if (id) {
    const { data, error } = await supabase.from("shifts").update(row).eq("id", id).eq("company_id", companyId).select().single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await supabase.from("shifts").insert(row).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function listDevices(companyId: string) {
  const supabase = await getDb()
  const { data, error } = await supabase
    .from("biometric_devices")
    .select("*")
    .eq("company_id", companyId)
    .order("name")
  if (error) {
    if (/does not exist/i.test(error.message)) return []
    throw new Error(error.message)
  }
  return data || []
}

export async function saveDevice(companyId: string, payload: any, id?: string) {
  const supabase = await getDb()
  const row = {
    company_id: companyId,
    name: String(payload.name || "").trim(),
    type: payload.type || "fingerprint",
    location: payload.location || null,
    ip_address: payload.ip_address || null,
    serial_number: payload.serial_number || null,
    status: payload.status || "online",
    is_active: payload.is_active !== false,
    notes: payload.notes || null,
    updated_at: new Date().toISOString(),
  }
  if (!row.name) throw new Error("Device name is required")
  if (id) {
    const { data, error } = await supabase
      .from("biometric_devices")
      .update(row)
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await supabase.from("biometric_devices").insert(row).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function generateOvertimeFromAttendance(input: {
  companyId: string
  from: string
  to: string
  minHours?: number
}) {
  const supabase = await getDb()
  const minHours = input.minHours ?? 0.5
  const listed = await listAttendance({
    companyId: input.companyId,
    from: input.from,
    to: input.to,
  })

  const created: any[] = []
  const skipped: string[] = []

  for (const rec of listed.records) {
    const ot = Number(rec.overtime_hours || 0)
    if (ot < minHours) continue

    const { data: existing } = await supabase
      .from("overtime_requests")
      .select("id")
      .eq("company_id", input.companyId)
      .eq("employee_id", rec.employee_id)
      .eq("date", rec.date)
      .maybeSingle()

    if (existing?.id) {
      skipped.push(`${rec.employee_name} ${rec.date}`)
      continue
    }

    const { data, error } = await supabase
      .from("overtime_requests")
      .insert({
        company_id: input.companyId,
        employee_id: rec.employee_id,
        date: rec.date,
        hours_requested: ot,
        reason: `Auto-generated from attendance (${rec.total_hours || 0}h worked)`,
        status: "pending",
        source: "attendance",
        attendance_record_id: rec.id,
        requested_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      skipped.push(`${rec.employee_name}: ${error.message}`)
      continue
    }
    created.push(data)
  }

  return { created: created.length, skipped: skipped.length, requests: created, notes: skipped.slice(0, 20) }
}
