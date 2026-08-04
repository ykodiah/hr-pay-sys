import { createServiceClient } from "@/lib/supabase/server"
import { evaluateAttendanceAlerts } from "@/lib/services/attendance-alerts-evaluate"

function computeNextRunAt(input: {
  frequency: string
  runHour: number
  from?: Date
}): string {
  const now = input.from || new Date()
  const next = new Date(now)
  const hour = Math.min(23, Math.max(0, Number(input.runHour ?? 9)))
  const freq = String(input.frequency || "daily").toLowerCase()

  if (freq === "hourly") {
    next.setMinutes(0, 0, 0)
    next.setHours(next.getHours() + 1)
    return next.toISOString()
  }

  // daily / weekdays — next occurrence of runHour
  next.setSeconds(0, 0)
  next.setMinutes(0)
  if (next.getHours() >= hour) {
    next.setDate(next.getDate() + 1)
  }
  next.setHours(hour)

  if (freq === "weekdays") {
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1)
    }
  }
  return next.toISOString()
}

export async function listAlertSchedules(companyId: string) {
  const service = createServiceClient()
  const { data, error } = await service
    .from("attendance_alert_schedules")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function upsertAlertSchedule(input: {
  companyId: string
  id?: string
  name?: string
  frequency?: string
  run_hour?: number
  lookback_days?: number
  is_active?: boolean
}) {
  const service = createServiceClient()
  const frequency = String(input.frequency || "daily")
  const runHour = Number(input.run_hour ?? 9)
  const row = {
    company_id: input.companyId,
    name: (input.name || "Daily attendance scan").trim(),
    frequency,
    run_hour: runHour,
    lookback_days: Math.max(1, Number(input.lookback_days ?? 1)),
    is_active: input.is_active !== false,
    next_run_at: computeNextRunAt({ frequency, runHour }),
    updated_at: new Date().toISOString(),
  }

  if (input.id) {
    const { data, error } = await service
      .from("attendance_alert_schedules")
      .update(row)
      .eq("id", input.id)
      .eq("company_id", input.companyId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await service
    .from("attendance_alert_schedules")
    .insert(row)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function runDueAlertSchedules(opts?: {
  companyId?: string
  force?: boolean
  scheduleId?: string
}) {
  const service = createServiceClient()
  const nowIso = new Date().toISOString()

  let query = service
    .from("attendance_alert_schedules")
    .select("*")
    .eq("is_active", true)

  if (opts?.companyId) query = query.eq("company_id", opts.companyId)
  if (opts?.scheduleId) query = query.eq("id", opts.scheduleId)
  else if (!opts?.force) query = query.lte("next_run_at", nowIso)

  const { data: schedules, error } = await query
  if (error) throw new Error(error.message)

  const results: any[] = []
  for (const sch of schedules || []) {
    const lookback = Math.max(1, Number(sch.lookback_days || 1))
    const to = new Date().toISOString().slice(0, 10)
    const fromDate = new Date(to)
    fromDate.setDate(fromDate.getDate() - lookback)
    const from = fromDate.toISOString().slice(0, 10)

    try {
      const evalResult = await evaluateAttendanceAlerts({
        companyId: sch.company_id,
        from,
        to,
      })
      const nextRun = computeNextRunAt({
        frequency: sch.frequency,
        runHour: Number(sch.run_hour ?? 9),
        from: new Date(),
      })
      await service
        .from("attendance_alert_schedules")
        .update({
          last_run_at: nowIso,
          last_run_status: "success",
          last_run_message: evalResult.message || `Created ${evalResult.created} alert(s)`,
          last_created_count: evalResult.created,
          next_run_at: nextRun,
          updated_at: nowIso,
        })
        .eq("id", sch.id)

      results.push({
        schedule_id: sch.id,
        company_id: sch.company_id,
        status: "success",
        ...evalResult,
        next_run_at: nextRun,
      })
    } catch (e: any) {
      const nextRun = computeNextRunAt({
        frequency: sch.frequency,
        runHour: Number(sch.run_hour ?? 9),
        from: new Date(),
      })
      await service
        .from("attendance_alert_schedules")
        .update({
          last_run_at: nowIso,
          last_run_status: "error",
          last_run_message: e?.message || "Schedule run failed",
          next_run_at: nextRun,
          updated_at: nowIso,
        })
        .eq("id", sch.id)
      results.push({
        schedule_id: sch.id,
        company_id: sch.company_id,
        status: "error",
        error: e?.message || "failed",
      })
    }
  }

  return {
    ran: results.length,
    results,
    at: nowIso,
  }
}
