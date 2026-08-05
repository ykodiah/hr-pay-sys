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

function eachDateInclusive(from: string, to: string): string[] {
  const out: string[] = []
  const start = new Date(`${from}T12:00:00`)
  const end = new Date(`${to}T12:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [from]
  // Cap synthetic expansion to 62 days to keep UI responsive
  const maxDays = 62
  let i = 0
  for (let d = new Date(start); d <= end && i < maxDays; d.setDate(d.getDate() + 1), i++) {
    out.push(d.toISOString().slice(0, 10))
  }
  return out.length ? out : [from]
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

  if (input.employeeId) query = query.eq("employee_id", input.employeeId)

  const { data, error } = await query
  if (error && /does not exist/i.test(error.message)) {
    return { records: [], stats: emptyStats(), employees: empList, warning: error.message }
  }
  if (error) throw new Error(error.message)

  // Approved leave overlapping range → status leave when no punch
  const { data: leaves } = await supabase
    .from("leave_requests")
    .select("employee_id, start_date, end_date, status")
    .eq("company_id", input.companyId)
    .eq("status", "approved")
    .lte("start_date", to)
    .gte("end_date", from)

  const onLeave = (employeeId: string, date: string) =>
    (leaves || []).some(
      (l: any) => l.employee_id === employeeId && l.start_date <= date && l.end_date >= date,
    )

  const empMap = new Map<string, any>(empList.map((e: any) => [e.id, e]))
  const byKey = new Map<string, any>()
  for (const r of data || []) {
    const emp = empMap.get(r.employee_id) as any
    const name = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "Employee"
    byKey.set(`${r.employee_id}:${r.date}`, {
      ...r,
      employee_name: name,
      employee_code: emp?.employee_id || null,
      department: emp?.department || null,
      position: emp?.position || null,
      synthetic: false,
    })
  }

  // Fill every active employee × day as absent (or leave) when unmarked
  const dates = eachDateInclusive(from, to)
  const scopedEmps = input.employeeId
    ? empList.filter((e: any) => e.id === input.employeeId)
    : empList

  for (const emp of scopedEmps) {
    for (const date of dates) {
      const key = `${emp.id}:${date}`
      if (byKey.has(key)) continue
      const leave = onLeave(emp.id, date)
      byKey.set(key, {
        id: `synthetic-${emp.id}-${date}`,
        employee_id: emp.id,
        company_id: input.companyId,
        date,
        status: leave ? "leave" : "absent",
        clock_in: null,
        clock_out: null,
        total_hours: 0,
        overtime_hours: 0,
        employee_name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Employee",
        employee_code: emp.employee_id || null,
        department: emp.department || null,
        position: emp.position || null,
        synthetic: true,
        source: leave ? "leave" : "register",
      })
    }
  }

  // If a stored record exists but employee is on leave and marked absent with no clocks, prefer leave
  for (const [key, r] of byKey) {
    if (r.synthetic) continue
    if (!r.clock_in && !r.clock_out && onLeave(r.employee_id, r.date) && r.status !== "leave") {
      byKey.set(key, { ...r, status: "leave" })
    }
  }

  let records = [...byKey.values()].sort((a, b) => {
    if (a.date === b.date) return String(a.employee_name).localeCompare(String(b.employee_name))
    return a.date < b.date ? 1 : -1
  })

  if (input.status && input.status !== "all") {
    const st = input.status.toLowerCase()
    records = records.filter((r: any) => String(r.status || "").toLowerCase() === st)
  }

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
  const base = {
    company_id: companyId,
    name: String(payload.name || "").trim(),
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
  if (!base.name) throw new Error("Shift name is required")

  // Include code when provided; retry without if column missing in schema cache
  const withCode = { ...base, code: payload.code || String(payload.name || "").slice(0, 12).toUpperCase().replace(/\s+/g, "_") }

  async function write(row: Record<string, any>) {
    if (id) {
      return supabase.from("shifts").update(row).eq("id", id).eq("company_id", companyId).select().single()
    }
    return supabase.from("shifts").insert(row).select().single()
  }

  let { data, error } = await write(withCode)
  if (error && /code|schema cache|column/i.test(error.message)) {
    ;({ data, error } = await write(base))
  }
  if (error && /working_days|expected_hours|department|location/i.test(error.message)) {
    const minimal = {
      company_id: companyId,
      name: base.name,
      start_time: base.start_time,
      end_time: base.end_time,
      grace_period_minutes: base.grace_period_minutes,
      break_duration_minutes: base.break_duration_minutes,
      is_active: true,
      updated_at: base.updated_at,
    }
    ;({ data, error } = await write(minimal))
  }
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
  const webhookToken =
    payload.webhook_token ||
    payload.webhookToken ||
    (id ? undefined : `bio_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`)

  const row: Record<string, any> = {
    company_id: companyId,
    name: String(payload.name || "").trim(),
    type: payload.type || "fingerprint",
    location: payload.location || null,
    ip_address: payload.ip_address || payload.ipAddress || null,
    serial_number: payload.serial_number || payload.serialNumber || null,
    status: payload.status || "online",
    is_active: payload.is_active !== false,
    notes: payload.notes || null,
    api_base_url: payload.api_base_url || payload.apiBaseUrl || null,
    api_key: payload.api_key || payload.apiKey || null,
    sync_path: payload.sync_path || payload.syncPath || "/api/punches",
    sync_mode: payload.sync_mode || payload.syncMode || (payload.api_base_url || payload.apiBaseUrl ? "pull" : "webhook"),
    updated_at: new Date().toISOString(),
  }
  if (webhookToken) row.webhook_token = webhookToken
  if (!row.name) throw new Error("Device name is required")

  async function write(data: Record<string, any>) {
    if (id) {
      return supabase.from("biometric_devices").update(data).eq("id", id).eq("company_id", companyId).select().single()
    }
    return supabase.from("biometric_devices").insert(data).select().single()
  }

  let { data, error } = await write(row)
  if (error && /api_base_url|api_key|sync_path|sync_mode|webhook_token|schema cache|column/i.test(error.message)) {
    const minimal = {
      company_id: companyId,
      name: row.name,
      type: row.type,
      location: row.location,
      ip_address: row.ip_address,
      serial_number: row.serial_number,
      status: row.status,
      is_active: row.is_active,
      notes: row.notes,
      updated_at: row.updated_at,
    }
    ;({ data, error } = await write(minimal))
  }
  if (error) throw new Error(error.message)
  return data
}

type NormalizedPunch = {
  employeeKey: string
  punchedAt: Date
  punchType: "in" | "out" | "auto"
  raw: any
}

function normalizeDevicePunches(payload: any): NormalizedPunch[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.punches)
      ? payload.punches
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.records)
          ? payload.records
          : []

  const out: NormalizedPunch[] = []
  for (const p of list) {
    const employeeKey = String(
      p.employee_code || p.employeeCode || p.emp_code || p.pin || p.user_id || p.userId || p.employee_id || p.badge || "",
    ).trim()
    const ts = p.punched_at || p.timestamp || p.time || p.clock_time || p.datetime || p.date_time
    if (!employeeKey || !ts) continue
    const punchedAt = new Date(ts)
    if (Number.isNaN(punchedAt.getTime())) continue
    const typeRaw = String(p.type || p.punch_type || p.punchType || p.state || "auto").toLowerCase()
    const punchType: "in" | "out" | "auto" =
      typeRaw.includes("out") || typeRaw === "0" || typeRaw === "checkout"
        ? "out"
        : typeRaw.includes("in") || typeRaw === "1" || typeRaw === "checkin"
          ? "in"
          : "auto"
    out.push({ employeeKey, punchedAt, punchType, raw: p })
  }
  return out
}

async function enqueuePunches(companyId: string, deviceId: string | null, punches: NormalizedPunch[]) {
  if (!punches.length) return 0
  const supabase = await getDb()
  const rows = punches.map((p) => ({
    company_id: companyId,
    device_id: deviceId,
    employee_code: p.employeeKey,
    punched_at: p.punchedAt.toISOString(),
    punch_type: p.punchType,
    raw: p.raw,
    status: "pending",
  }))
  const { error } = await supabase.from("biometric_punch_queue").insert(rows)
  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      // Fall through — process immediately without queue table
      return -1
    }
    throw new Error(error.message)
  }
  return rows.length
}

async function processPunchQueue(companyId: string, deviceId?: string | null) {
  const supabase = await getDb()
  let query = supabase
    .from("biometric_punch_queue")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "pending")
    .order("punched_at", { ascending: true })
    .limit(500)
  if (deviceId) query = query.eq("device_id", deviceId)

  const { data: pending, error } = await query
  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) return { processed: 0, failed: 0 }
    throw new Error(error.message)
  }
  if (!pending?.length) return { processed: 0, failed: 0 }

  const keys = [
    ...new Set(pending.map((p: any) => String(p.employee_code || "").toLowerCase()).filter(Boolean)),
  ] as string[]
  const resolved = await resolveEmployeesByKeys(companyId, keys)
  const keyMap = new Map(resolved.map((r) => [r.key.toLowerCase(), r.employeeId]))

  // Group by employee+date to build clock in/out pairs
  const byEmpDate = new Map<string, any[]>()
  for (const p of pending) {
    const empId = keyMap.get(String(p.employee_code || "").toLowerCase())
    if (!empId) {
      await supabase
        .from("biometric_punch_queue")
        .update({ status: "failed", error_message: "Employee not found", processed_at: new Date().toISOString() })
        .eq("id", p.id)
      continue
    }
    const day = String(p.punched_at).slice(0, 10)
    const k = `${empId}|${day}`
    const arr = byEmpDate.get(k) || []
    arr.push({ ...p, _empId: empId, _day: day })
    byEmpDate.set(k, arr)
  }

  let processed = 0
  let failed = 0

  for (const [, punches] of byEmpDate) {
    punches.sort((a: any, b: any) => String(a.punched_at).localeCompare(String(b.punched_at)))
    const empId = punches[0]._empId
    const day = punches[0]._day
    const ins = punches.filter((p: any) => p.punch_type === "in")
    const outs = punches.filter((p: any) => p.punch_type === "out")
    const autos = punches.filter((p: any) => p.punch_type === "auto" || !["in", "out"].includes(p.punch_type))

    let clockIn: string | null = null
    let clockOut: string | null = null
    if (ins.length || outs.length) {
      clockIn = ins[0] ? new Date(ins[0].punched_at).toISOString().slice(11, 19) : null
      clockOut = outs.length ? new Date(outs[outs.length - 1].punched_at).toISOString().slice(11, 19) : null
    } else if (autos.length) {
      clockIn = new Date(autos[0].punched_at).toISOString().slice(11, 19)
      if (autos.length > 1) clockOut = new Date(autos[autos.length - 1].punched_at).toISOString().slice(11, 19)
    }

    try {
      const rec = await upsertManualAttendance({
        companyId,
        employeeId: empId,
        date: day,
        status: clockIn ? "present" : "absent",
        clockIn,
        clockOut,
        method: "biometric",
        source: "biometric_sync",
        autoDetectStatus: true,
      })
      for (const p of punches) {
        await supabase
          .from("biometric_punch_queue")
          .update({
            status: "processed",
            employee_id: empId,
            attendance_id: rec?.id || null,
            processed_at: new Date().toISOString(),
          })
          .eq("id", p.id)
      }
      processed += punches.length
    } catch (e: any) {
      failed += punches.length
      for (const p of punches) {
        await supabase
          .from("biometric_punch_queue")
          .update({
            status: "failed",
            error_message: e?.message || "Process failed",
            processed_at: new Date().toISOString(),
          })
          .eq("id", p.id)
      }
    }
  }

  return { processed, failed }
}

/** Live online sync: pull from device API (if configured) + process webhook queue. */
export async function syncBiometricDevice(companyId: string, deviceId: string) {
  const supabase = await getDb()
  const { data: device, error } = await supabase
    .from("biometric_devices")
    .select("*")
    .eq("id", deviceId)
    .eq("company_id", companyId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!device) throw new Error("Device not found")

  await supabase
    .from("biometric_devices")
    .update({ status: "syncing", updated_at: new Date().toISOString() })
    .eq("id", deviceId)

  let pulled = 0
  let pullError: string | null = null
  const since = device.last_sync || new Date(Date.now() - 7 * 86400000).toISOString()

  const baseUrl = String(device.api_base_url || "").trim().replace(/\/$/, "")
  const path = String(device.sync_path || "/api/punches").startsWith("/")
    ? String(device.sync_path || "/api/punches")
    : `/${device.sync_path || "api/punches"}`

  // Pull mode: fetch punches from device cloud / ADMS URL
  if (baseUrl) {
    try {
      const url = new URL(`${baseUrl}${path}`)
      url.searchParams.set("since", since)
      if (device.serial_number) url.searchParams.set("serial", device.serial_number)
      const headers: Record<string, string> = { Accept: "application/json" }
      if (device.api_key) {
        headers.Authorization = `Bearer ${device.api_key}`
        headers["X-API-Key"] = device.api_key
      }
      const res = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error(`Device API ${res.status}`)
      const json = await res.json().catch(() => ([]))
      const punches = normalizeDevicePunches(json)
      const queued = await enqueuePunches(companyId, deviceId, punches)
      if (queued === -1) {
        // Process directly without queue
        const keys = [...new Set(punches.map((p) => p.employeeKey.toLowerCase()))]
        const resolved = await resolveEmployeesByKeys(companyId, keys)
        const keyMap = new Map(resolved.map((r) => [r.key.toLowerCase(), r.employeeId]))
        const rows = punches
          .map((p) => {
            const employeeId = keyMap.get(p.employeeKey.toLowerCase())
            if (!employeeId) return null
            const date = p.punchedAt.toISOString().slice(0, 10)
            const time = p.punchedAt.toISOString().slice(11, 19)
            return {
              employeeId,
              date,
              clockIn: p.punchType !== "out" ? time : undefined,
              clockOut: p.punchType === "out" ? time : undefined,
            }
          })
          .filter(Boolean) as any[]
        if (rows.length) {
          await bulkUpsertAttendance(companyId, rows, {
            source: "biometric_sync",
            method: "biometric",
            deviceId,
          })
        }
        pulled = rows.length
      } else {
        pulled = queued
      }
    } catch (e: any) {
      pullError = e?.message || "Pull failed"
    }
  } else if (device.ip_address) {
    // Best-effort LAN-style pull (works when server can reach the device network)
    try {
      const proto = "http"
      const url = `${proto}://${device.ip_address}${path}?since=${encodeURIComponent(since)}`
      const headers: Record<string, string> = { Accept: "application/json" }
      if (device.api_key) headers["X-API-Key"] = device.api_key
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) })
      if (res.ok) {
        const json = await res.json().catch(() => ([]))
        const punches = normalizeDevicePunches(json)
        const queued = await enqueuePunches(companyId, deviceId, punches)
        pulled = queued === -1 ? punches.length : queued
      } else {
        pullError = `Device at ${device.ip_address} returned ${res.status}`
      }
    } catch {
      pullError =
        "Could not reach device IP from server. Use API base URL (cloud) or push punches to the webhook."
    }
  }

  const queueResult = await processPunchQueue(companyId, deviceId)
  const imported = pulled + queueResult.processed

  const patch: Record<string, any> = {
    last_sync: new Date().toISOString(),
    status: pullError && !imported ? "error" : "online",
    updated_at: new Date().toISOString(),
  }
  try {
    patch.last_sync_count = imported
    patch.last_sync_error = pullError
  } catch {
    /* columns may be missing */
  }

  let { data: updated, error: upErr } = await supabase
    .from("biometric_devices")
    .update(patch)
    .eq("id", deviceId)
    .eq("company_id", companyId)
    .select()
    .single()
  if (upErr && /last_sync_count|last_sync_error|schema cache|column/i.test(upErr.message)) {
    ;({ data: updated, error: upErr } = await supabase
      .from("biometric_devices")
      .update({
        last_sync: patch.last_sync,
        status: patch.status,
        updated_at: patch.updated_at,
      })
      .eq("id", deviceId)
      .eq("company_id", companyId)
      .select()
      .single())
  }
  if (upErr) throw new Error(upErr.message)

  return {
    device: updated,
    imported,
    pulled,
    processed: queueResult.processed,
    failed: queueResult.failed,
    pullError,
    webhookPath: `/api/attendance/devices/webhook?token=${device.webhook_token || device.id}`,
    message: imported
      ? `Synced ${imported} punch(es) into attendance.`
      : pullError
        ? pullError
        : "No new punches. Configure API base URL for pull, or have the device POST to the webhook.",
  }
}

/** Ingest punches pushed by a device/cloud connector. */
export async function ingestBiometricPunches(input: {
  companyId?: string
  deviceId?: string
  token?: string
  punches: any
}) {
  const supabase = await getDb()
  let device: any = null
  if (input.token) {
    const { data } = await supabase
      .from("biometric_devices")
      .select("*")
      .eq("webhook_token", input.token)
      .eq("is_active", true)
      .maybeSingle()
    device = data
  }
  if (!device && input.deviceId) {
    const { data } = await supabase
      .from("biometric_devices")
      .select("*")
      .eq("id", input.deviceId)
      .eq("is_active", true)
      .maybeSingle()
    device = data
  }
  if (!device) throw new Error("Device not found for webhook token")

  const companyId = input.companyId || device.company_id
  const punches = normalizeDevicePunches(input.punches)
  if (!punches.length) throw new Error("No valid punches in payload")

  const queued = await enqueuePunches(companyId, device.id, punches)
  if (queued === -1) {
    // Direct process
    const keys = [...new Set(punches.map((p) => p.employeeKey.toLowerCase()))]
    const resolved = await resolveEmployeesByKeys(companyId, keys)
    const keyMap = new Map(resolved.map((r) => [r.key.toLowerCase(), r.employeeId]))
    const byDay = new Map<string, NormalizedPunch[]>()
    for (const p of punches) {
      const empId = keyMap.get(p.employeeKey.toLowerCase())
      if (!empId) continue
      const day = p.punchedAt.toISOString().slice(0, 10)
      const k = `${empId}|${day}`
      const arr = byDay.get(k) || []
      arr.push(p)
      byDay.set(k, arr)
    }
    const rows: any[] = []
    for (const [k, list] of byDay) {
      const [employeeId, date] = k.split("|")
      list.sort((a, b) => a.punchedAt.getTime() - b.punchedAt.getTime())
      const first = list[0]
      const last = list[list.length - 1]
      rows.push({
        employeeId,
        date,
        clockIn: first.punchedAt.toISOString().slice(11, 19),
        clockOut: list.length > 1 ? last.punchedAt.toISOString().slice(11, 19) : undefined,
      })
    }
    const result = await bulkUpsertAttendance(companyId, rows, {
      source: "biometric_webhook",
      method: "biometric",
      deviceId: device.id,
    })
    await supabase
      .from("biometric_devices")
      .update({ last_sync: new Date().toISOString(), status: "online", updated_at: new Date().toISOString() })
      .eq("id", device.id)
    return { imported: result.imported, deviceId: device.id }
  }

  const processed = await processPunchQueue(companyId, device.id)
  await supabase
    .from("biometric_devices")
    .update({
      last_sync: new Date().toISOString(),
      status: "online",
      updated_at: new Date().toISOString(),
    })
    .eq("id", device.id)

  return {
    queued,
    processed: processed.processed,
    failed: processed.failed,
    deviceId: device.id,
  }
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
