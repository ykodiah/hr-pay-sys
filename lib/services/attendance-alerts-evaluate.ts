import { createServiceClient } from "@/lib/supabase/server"

/**
 * Evaluate active alert rules against recent attendance and create inbox alerts.
 * Tenant-scoped; skips duplicates for same employee+type+date.
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
    .select("id, employee_id, date, status, clock_in, clock_out, overtime_hours, company_id")
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

      if (category.includes("late") && (rec.status === "late" || isLateClockIn(rec.clock_in, threshold))) {
        match = true
        message = `Late arrival on ${rec.date}${rec.clock_in ? ` (in ${rec.clock_in})` : ""} — threshold ${threshold} min.`
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
      } else if (category.includes("early") && isEarlyOut(rec.clock_out, threshold)) {
        match = true
        message = `Early departure on ${rec.date}${rec.clock_out ? ` (out ${rec.clock_out})` : ""}.`
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

      // Dedupe: same employee + type + date already open
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
        },
        status: "pending",
      }

      const { error } = await service.from("attendance_alerts").insert(insert)
      if (error) {
        // Retry without metadata if needed
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

  return { created, scanned: rows.length, from, to, errors, rules: rules.length }
}

function parseMinutes(t?: string | null): number | null {
  if (!t) return null
  const m = String(t).match(/(\d{1,2}):(\d{2})/)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

function isLateClockIn(clockIn?: string | null, graceMinutes = 15): boolean {
  const mins = parseMinutes(clockIn)
  if (mins == null) return false
  // Default shift start 08:00 + grace
  return mins > 8 * 60 + graceMinutes
}

function isEarlyOut(clockOut?: string | null, earlyMinutes = 15): boolean {
  const mins = parseMinutes(clockOut)
  if (mins == null) return false
  // Default shift end 17:00 - early threshold
  return mins < 17 * 60 - earlyMinutes
}
