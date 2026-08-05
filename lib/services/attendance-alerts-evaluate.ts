import { createServiceClient } from "@/lib/supabase/server"
import {
  detectAttendanceStatus,
  parseTimeToMinutes,
  resolveEmployeeShift,
  type ShiftLike,
} from "@/lib/services/attendance-geo-shift"

/**
 * Evaluate active alert rules against recent attendance and create inbox alerts.
 * Late/early detection is shift-aware per employee assignment (not hardcoded 08:00).
 */
export async function evaluateAttendanceAlerts(input: {
  companyId: string
  from?: string
  to?: string
}) {
  const service = createServiceClient()
  const to = input.to || new Date().toISOString().slice(0, 10)
  const from =
    input.from ||
    (() => {
      const d = new Date(to)
      d.setDate(d.getDate() - 7)
      return d.toISOString().slice(0, 10)
    })()

  const { data: rules, error: rulesErr } = await service
    .from("attendance_alert_rules")
    .select("*")
    .eq("company_id", input.companyId)
    .eq("is_active", true)

  if (rulesErr) throw new Error(rulesErr.message)
  if (!rules?.length) {
    return { created: 0, scanned: 0, message: "No active rules — create a notification rule first." }
  }

  const { data: records, error: recErr } = await service
    .from("attendance_records")
    .select("id, employee_id, date, status, clock_in, clock_out, overtime_hours, company_id, shift_id")
    .eq("company_id", input.companyId)
    .gte("date", from)
    .lte("date", to)

  if (recErr) throw new Error(recErr.message)
  const rows = records || []

  const { data: emps } = await service
    .from("employees")
    .select("id, first_name, last_name, employee_id")
    .eq("company_id", input.companyId)
  const empMap = new Map((emps || []).map((e: any) => [e.id, e]))

  // Cache shifts per employee+date
  const shiftCache = new Map<string, ShiftLike | null>()
  async function shiftFor(employeeId: string, date: string, shiftId?: string | null) {
    const key = `${employeeId}:${date}`
    if (shiftCache.has(key)) return shiftCache.get(key) || null
    if (shiftId) {
      const { data: s } = await service
        .from("shifts")
        .select("*")
        .eq("id", shiftId)
        .eq("company_id", input.companyId)
        .maybeSingle()
      if (s) {
        shiftCache.set(key, s)
        return s
      }
    }
    const resolved = await resolveEmployeeShift(service, input.companyId, employeeId, date)
    shiftCache.set(key, resolved)
    return resolved
  }

  let created = 0
  const errors: string[] = []

  for (const rule of rules) {
    const category = String(rule.alert_category || rule.trigger_condition?.alert_type || "").toLowerCase()
    const threshold = Number(
      rule.trigger_condition?.threshold_minutes ??
        rule.trigger_condition?.threshold ??
        15,
    )

    for (const rec of rows) {
      let match = false
      let title = rule.rule_name
      let message = ""
      const shift = await shiftFor(rec.employee_id, rec.date, rec.shift_id)
      const shiftLabel = shift?.name || shift?.start_time || "default shift"

      if (category.includes("late")) {
        const late =
          rec.status === "late" ||
          isLateVsShift(rec.clock_in, shift, threshold) ||
          detectAttendanceStatus({ clockIn: rec.clock_in, shift, date: rec.date }) === "late"
        if (late) {
          match = true
          message = `Late arrival on ${rec.date}${rec.clock_in ? ` (in ${rec.clock_in})` : ""} vs ${shiftLabel} (grace ${threshold} / shift ${shift?.grace_period_minutes ?? 15} min).`
        }
      } else if (category.includes("absent") && rec.status === "absent") {
        match = true
        message = `Absence recorded on ${rec.date}.`
      } else if (
        (category.includes("missed") || category.includes("checkout")) &&
        rec.clock_in &&
        !rec.clock_out &&
        rec.status !== "leave"
      ) {
        match = true
        message = `Missed checkout on ${rec.date} (clocked in ${rec.clock_in}).`
      } else if (category.includes("early") && isEarlyVsShift(rec.clock_out, shift, threshold)) {
        match = true
        message = `Early departure on ${rec.date}${rec.clock_out ? ` (out ${rec.clock_out})` : ""} vs ${shiftLabel}.`
      } else if (category.includes("overtime") && Number(rec.overtime_hours || 0) > 0) {
        const otThreshold = Number(rule.trigger_condition?.threshold_hours ?? threshold)
        if (Number(rec.overtime_hours) >= otThreshold || category.includes("threshold")) {
          match = true
          message = `Overtime ${rec.overtime_hours}h on ${rec.date}.`
        }
      }

      if (!match) continue

      const emp = empMap.get(rec.employee_id)
      const empName = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "Employee"

      const { data: recent } = await service
        .from("attendance_alerts")
        .select("id, metadata, message, title")
        .eq("company_id", input.companyId)
        .eq("employee_id", rec.employee_id)
        .eq("alert_type", category || rule.alert_category || "general")
        .in("status", ["pending", "sent", "acknowledged"])
        .limit(30)
      const skip = (recent || []).some(
        (a: any) =>
          a.metadata?.date === rec.date ||
          String(a.message || "").includes(rec.date) ||
          String(a.title || "").includes(rec.date),
      )
      if (skip) continue

      const insert = {
        company_id: input.companyId,
        rule_id: rule.id,
        employee_id: rec.employee_id,
        alert_type: category || rule.alert_category || "general",
        severity: rule.severity || "medium",
        title: `${title}: ${empName}`,
        message,
        metadata: {
          date: rec.date,
          attendance_record_id: rec.id,
          threshold_minutes: threshold,
          shift_id: shift?.id || null,
          shift_name: shift?.name || null,
        },
        status: "pending",
      }

      const { error } = await service.from("attendance_alerts").insert(insert)
      if (error) {
        if (/column|metadata|does not exist/i.test(error.message)) {
          const { error: e2 } = await service.from("attendance_alerts").insert({
            company_id: input.companyId,
            employee_id: rec.employee_id,
            alert_type: insert.alert_type,
            severity: insert.severity,
            title: insert.title,
            message: insert.message,
            status: "pending",
          })
          if (e2) errors.push(e2.message)
          else created += 1
        } else {
          errors.push(error.message)
        }
      } else {
        created += 1
      }
    }
  }

  return {
    created,
    scanned: rows.length,
    from,
    to,
    errors,
    rules: rules.length,
    message: `Created ${created} alert(s) from ${rows.length} attendance row(s)`,
  }
}

function isLateVsShift(
  clockIn?: string | null,
  shift?: ShiftLike | null,
  graceOverride?: number,
): boolean {
  const mins = parseTimeToMinutes(clockIn)
  if (mins == null) return false
  const start = parseTimeToMinutes(shift?.start_time || "08:00") ?? 8 * 60
  const grace = Number(graceOverride ?? shift?.grace_period_minutes ?? 15)
  return mins > start + grace
}

function isEarlyVsShift(
  clockOut?: string | null,
  shift?: ShiftLike | null,
  earlyMinutes = 15,
): boolean {
  const mins = parseTimeToMinutes(clockOut)
  if (mins == null) return false
  const end = parseTimeToMinutes(shift?.end_time || "17:00") ?? 17 * 60
  return mins < end - earlyMinutes
}
