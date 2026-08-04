import { createServiceClient } from "@/lib/supabase/server"
import {
  getGraLabourRateForYear,
  graHourlyMinimum,
  type GraLabourRate,
} from "@/lib/gra-labour-rates"

/** Standard monthly hours for hourly-rate conversion (Ghana / common HR practice). */
export const STANDARD_MONTHLY_HOURS = 173.33

export type OtPayrollStatus = "pending_payroll" | "synced" | "paid" | "excluded"

function payPeriodFromDate(dateStr: string): string {
  // YYYY-MM from work date
  return String(dateStr || "").slice(0, 7)
}

function periodBounds(period: string): { from: string; to: string } {
  const [y, m] = period.split("-").map(Number)
  const from = `${period}-01`
  const last = new Date(y, m, 0).getDate()
  const to = `${period}-${String(last).padStart(2, "0")}`
  return { from, to }
}

function getDb() {
  return createServiceClient()
}

async function loadGraRate(
  service: ReturnType<typeof createServiceClient>,
  workDate?: string,
): Promise<GraLabourRate> {
  const year = workDate ? Number(String(workDate).slice(0, 4)) : new Date().getFullYear()
  const { data } = await service.from("gra_labour_rates").select("*").eq("year", year).maybeSingle()
  if (data?.daily_minimum_wage != null) {
    return {
      year,
      daily_minimum_wage: Number(data.daily_minimum_wage),
      hours_per_day: Number(data.hours_per_day || 8),
      working_days_per_month: Number(data.working_days_per_month || 27),
      standard_monthly_hours: Number(data.standard_monthly_hours || STANDARD_MONTHLY_HOURS),
      overtime_weekday_multiplier: Number(data.overtime_weekday_multiplier || 1.5),
      overtime_weekend_multiplier: Number(data.overtime_weekend_multiplier || 2.0),
      overtime_holiday_multiplier: Number(data.overtime_holiday_multiplier || 2.0),
      currency: data.currency || "GHS",
      effective_from: data.effective_from || `${year}-01-01`,
      effective_to: data.effective_to || null,
      source: data.source || "gra_labour_rates",
    }
  }
  return getGraLabourRateForYear(year)
}

async function resolveMultiplier(
  service: ReturnType<typeof createServiceClient>,
  companyId: string,
  rateTypeId: string | null | undefined,
  workDate: string,
  employeeRates?: { weekday?: number; weekend?: number },
): Promise<{ multiplier: number; rateType: string }> {
  if (rateTypeId) {
    const { data } = await service
      .from("overtime_rates")
      .select("multiplier, rate_type")
      .eq("id", rateTypeId)
      .eq("company_id", companyId)
      .maybeSingle()
    if (data?.multiplier != null) {
      return { multiplier: Number(data.multiplier), rateType: data.rate_type || "weekday" }
    }
  }

  // Company overtime_rates by type
  const day = new Date(`${workDate}T12:00:00`).getDay()
  const isWeekend = day === 0 || day === 6
  const rateType = isWeekend ? "weekend" : "weekday"
  const { data: companyRate } = await service
    .from("overtime_rates")
    .select("multiplier, rate_type")
    .eq("company_id", companyId)
    .eq("rate_type", rateType)
    .eq("is_active", true)
    .maybeSingle()
  if (companyRate?.multiplier != null) {
    return { multiplier: Number(companyRate.multiplier), rateType }
  }

  // GRA / payroll_configuration fallback
  const gra = await loadGraRate(service, workDate)
  const { data: cfg } = await service
    .from("payroll_configuration")
    .select("overtime_weekday_multiplier, overtime_weekend_multiplier")
    .eq("company_id", companyId)
    .maybeSingle()

  if (isWeekend) {
    return {
      multiplier: Number(
        employeeRates?.weekend ||
          cfg?.overtime_weekend_multiplier ||
          gra.overtime_weekend_multiplier ||
          2.0,
      ),
      rateType: "weekend",
    }
  }
  return {
    multiplier: Number(
      employeeRates?.weekday ||
        cfg?.overtime_weekday_multiplier ||
        gra.overtime_weekday_multiplier ||
        1.5,
    ),
    rateType: "weekday",
  }
}

/**
 * Hourly OT base:
 * 1) Employee monthly basic ÷ GRA/standard monthly hours
 * 2) Floor at GRA National Daily Minimum Wage ÷ hours/day
 * Never returns 0 when GRA catalog is available.
 */
async function resolveHourlyRate(
  service: ReturnType<typeof createServiceClient>,
  companyId: string,
  employeeId: string,
  workDate?: string,
): Promise<number> {
  const gra = await loadGraRate(service, workDate)
  const monthlyHours = Number(gra.standard_monthly_hours || STANDARD_MONTHLY_HOURS)
  const graFloor = graHourlyMinimum(gra)

  // Company minimum wage override (daily)
  const { data: cfg } = await service
    .from("payroll_configuration")
    .select("minimum_wage")
    .eq("company_id", companyId)
    .maybeSingle()
  const companyDaily = Number(cfg?.minimum_wage || 0)
  const floor = companyDaily > 0 ? companyDaily / (gra.hours_per_day || 8) : graFloor

  const { data: fin } = await service
    .from("employee_financial")
    .select("monthly_salary, basic_salary, weekday_overtime_rate, weekend_overtime_rate")
    .eq("employee_id", employeeId)
    .maybeSingle()

  let monthly = Number(fin?.monthly_salary ?? fin?.basic_salary ?? 0)
  if (!monthly) {
    const { data: emp } = await service
      .from("employees")
      .select("salary, company_id")
      .eq("id", employeeId)
      .eq("company_id", companyId)
      .maybeSingle()
    monthly = Number(emp?.salary ?? 0)
  }

  if (monthly > 0) {
    const fromSalary = monthly / monthlyHours
    // Employee rate, but never below GRA/company statutory floor
    return Math.round(Math.max(fromSalary, floor) * 10000) / 10000
  }

  return Math.round(floor * 10000) / 10000
}

/** Recalculate amount_earned for approved OT in a period (fixes GH₵0 rows). */
export async function recalculateApprovedOvertime(input: {
  companyId: string
  period: string
}) {
  const service = getDb()
  const { from, to } = periodBounds(input.period)
  const { data: rows, error } = await service
    .from("overtime_requests")
    .select("*")
    .eq("company_id", input.companyId)
    .eq("status", "approved")
    .gte("date", from)
    .lte("date", to)

  if (error) throw new Error(error.message)

  let updated = 0
  for (const r of rows || []) {
    const hours = Number(r.hours_approved ?? r.hours_requested ?? 0)
    if (!hours) continue
    const { data: fin } = await service
      .from("employee_financial")
      .select("weekday_overtime_rate, weekend_overtime_rate")
      .eq("employee_id", r.employee_id)
      .maybeSingle()
    const hourly = await resolveHourlyRate(service, input.companyId, r.employee_id, r.date)
    const { multiplier, rateType } = await resolveMultiplier(
      service,
      input.companyId,
      r.rate_type_id,
      r.date,
      {
        weekday: Number(fin?.weekday_overtime_rate || 0) || undefined,
        weekend: Number(fin?.weekend_overtime_rate || 0) || undefined,
      },
    )
    const amount = Math.round(hours * hourly * multiplier * 100) / 100
    const { error: updErr } = await service
      .from("overtime_requests")
      .update({
        amount_earned: amount,
        hourly_rate_used: hourly,
        multiplier_used: multiplier,
        rate_label: rateType,
        pay_period: input.period,
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id)
      .eq("company_id", input.companyId)
    if (!updErr) updated += 1
  }

  return { period: input.period, updated, total: (rows || []).length }
}

/**
 * After approval: compute earned amount and queue for month-end payroll.
 * Tenant-scoped via companyId on every query.
 */
export async function finalizeApprovedOvertime(input: {
  companyId: string
  requestId: string
  hoursApproved: number
  userId?: string | null
}) {
  const service = getDb()
  const { data: existing, error } = await service
    .from("overtime_requests")
    .select("*")
    .eq("id", input.requestId)
    .eq("company_id", input.companyId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!existing) throw new Error("Overtime request not found")

  const { data: fin } = await service
    .from("employee_financial")
    .select("weekday_overtime_rate, weekend_overtime_rate, monthly_salary, basic_salary")
    .eq("employee_id", existing.employee_id)
    .maybeSingle()

  const hourly = await resolveHourlyRate(service, input.companyId, existing.employee_id, existing.date)
  const { multiplier, rateType } = await resolveMultiplier(
    service,
    input.companyId,
    existing.rate_type_id,
    existing.date,
    {
      weekday: Number(fin?.weekday_overtime_rate || 0) || undefined,
      weekend: Number(fin?.weekend_overtime_rate || 0) || undefined,
    },
  )

  const hours = Number(input.hoursApproved || 0)
  const amount = Math.round(hours * hourly * multiplier * 100) / 100
  const payPeriod = payPeriodFromDate(existing.date)

  const update: Record<string, any> = {
    status: "approved",
    hours_approved: hours,
    amount_earned: amount,
    hourly_rate_used: hourly,
    multiplier_used: multiplier,
    rate_label: rateType,
    pay_period: payPeriod,
    payroll_status: "pending_payroll",
    approved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  if (input.userId && !String(input.userId).startsWith("demo-")) {
    update.approved_by = input.userId
  }

  let { data, error: updErr } = await service
    .from("overtime_requests")
    .update(update)
    .eq("id", input.requestId)
    .eq("company_id", input.companyId)
    .select()
    .single()

  if (updErr && /foreign key|approved_by/i.test(updErr.message)) {
    delete update.approved_by
    const retry = await service
      .from("overtime_requests")
      .update(update)
      .eq("id", input.requestId)
      .eq("company_id", input.companyId)
      .select()
      .single()
    data = retry.data
    updErr = retry.error
  }

  // Fallback if new columns not migrated yet
  if (updErr && /column|does not exist/i.test(updErr.message)) {
    const minimal = {
      status: "approved",
      hours_approved: hours,
      approved_at: update.approved_at,
      updated_at: update.updated_at,
      ...(update.approved_by ? { approved_by: update.approved_by } : {}),
    }
    const retry = await service
      .from("overtime_requests")
      .update(minimal)
      .eq("id", input.requestId)
      .eq("company_id", input.companyId)
      .select()
      .single()
    if (retry.error) throw new Error(retry.error.message)
    return {
      request: retry.data,
      earnings: { hours, hourly, multiplier, amount, payPeriod, rateType },
      warning: "OT earnings columns missing — run script 101. Amount computed in memory only.",
    }
  }

  if (updErr) throw new Error(updErr.message)
  return {
    request: data,
    earnings: { hours, hourly, multiplier, amount, payPeriod, rateType },
  }
}

/**
 * Month-end: roll approved OT into payroll_pay_inputs.overtime_amount per employee.
 * Isolated by company_id + pay_period.
 */
export async function syncOvertimeToPayroll(input: {
  companyId: string
  period: string // YYYY-MM
  overwriteManual?: boolean
}) {
  const service = getDb()
  const period = input.period
  if (!/^\d{4}-\d{2}$/.test(period)) throw new Error("period must be YYYY-MM")

  const { from, to } = periodBounds(period)

  let { data: rows, error } = await service
    .from("overtime_requests")
    .select("*")
    .eq("company_id", input.companyId)
    .eq("status", "approved")
    .gte("date", from)
    .lte("date", to)

  if (error) throw new Error(error.message)
  rows = rows || []

  // Prefer pay_period column when present
  const periodRows = rows.filter((r: any) => !r.pay_period || r.pay_period === period)

  // Recompute amount if missing
  const byEmployee = new Map<
    string,
    { hours: number; amount: number; requestIds: string[]; lines: any[] }
  >()

  for (const r of periodRows) {
    let amount = Number(r.amount_earned ?? 0)
    let hours = Number(r.hours_approved ?? r.hours_requested ?? 0)
    if (!amount && hours > 0) {
      const hourly =
        Number(r.hourly_rate_used) ||
        (await resolveHourlyRate(service, input.companyId, r.employee_id, r.date))
      const multiplier = Number(r.multiplier_used) || 1.5
      amount = Math.round(hours * hourly * multiplier * 100) / 100
      // Persist when columns exist
      await service
        .from("overtime_requests")
        .update({
          amount_earned: amount,
          hourly_rate_used: hourly,
          multiplier_used: multiplier,
          pay_period: period,
          payroll_status: r.payroll_status || "pending_payroll",
          updated_at: new Date().toISOString(),
        })
        .eq("id", r.id)
        .eq("company_id", input.companyId)
    }

    const cur = byEmployee.get(r.employee_id) || { hours: 0, amount: 0, requestIds: [], lines: [] }
    cur.hours += hours
    cur.amount += amount
    cur.requestIds.push(r.id)
    cur.lines.push(r)
    byEmployee.set(r.employee_id, cur)
  }

  const synced: Array<{ employee_id: string; overtime_amount: number; hours: number; requests: number }> = []
  const errors: string[] = []

  for (const [employeeId, agg] of byEmployee) {
    const amount = Math.round(agg.amount * 100) / 100
    try {
      // Load existing input so we don't wipe other fields
      const { data: existing } = await service
        .from("payroll_pay_inputs")
        .select("*")
        .eq("company_id", input.companyId)
        .eq("employee_id", employeeId)
        .eq("pay_period", period)
        .maybeSingle()

      if (existing && !input.overwriteManual && Number(existing.overtime_amount || 0) > 0) {
        // If already has OT and requests already synced, skip unless overwrite
        const allSynced = agg.lines.every((l: any) => l.payroll_status === "synced" || l.payroll_status === "paid")
        if (allSynced) {
          synced.push({
            employee_id: employeeId,
            overtime_amount: Number(existing.overtime_amount),
            hours: agg.hours,
            requests: agg.requestIds.length,
          })
          continue
        }
      }

      // Preserve existing pay-input fields; only refresh overtime_amount + period bounds
      const upsert: Record<string, any> = {
        company_id: input.companyId,
        employee_id: employeeId,
        pay_period: period,
        pay_period_start: existing?.pay_period_start || from,
        pay_period_end: existing?.pay_period_end || to,
        basic_salary: existing?.basic_salary ?? null,
        transport_allowance: existing?.transport_allowance ?? null,
        housing_allowance: existing?.housing_allowance ?? null,
        medical_allowance: existing?.medical_allowance ?? null,
        meal_allowance: existing?.meal_allowance ?? null,
        communication_allowance: existing?.communication_allowance ?? null,
        uniform_allowance: existing?.uniform_allowance ?? null,
        other_allowances: existing?.other_allowances ?? null,
        overtime_amount: amount,
        bonus_amount: Number(existing?.bonus_amount ?? 0),
        loan_deduction: Number(existing?.loan_deduction ?? 0),
        advance_deduction: Number(existing?.advance_deduction ?? 0),
        other_deductions: Number(existing?.other_deductions ?? 0),
        tier2_applicable: existing?.tier2_applicable !== false,
        tier3_applicable: Boolean(existing?.tier3_applicable),
        tier3_employee_rate: Number(existing?.tier3_employee_rate ?? 0),
        apply_to_master: Boolean(existing?.apply_to_master),
        notes: existing?.notes ?? null,
        status: existing?.status || "draft",
        updated_at: new Date().toISOString(),
      }
      if (existing?.id) upsert.id = existing.id

      const { error: upErr } = await service
        .from("payroll_pay_inputs")
        .upsert(upsert, { onConflict: "company_id,employee_id,pay_period" })

      if (upErr) throw new Error(upErr.message)

      await service
        .from("overtime_requests")
        .update({
          payroll_status: "synced",
          payroll_synced_at: new Date().toISOString(),
          pay_period: period,
          updated_at: new Date().toISOString(),
        })
        .in("id", agg.requestIds)
        .eq("company_id", input.companyId)

      synced.push({
        employee_id: employeeId,
        overtime_amount: amount,
        hours: Math.round(agg.hours * 100) / 100,
        requests: agg.requestIds.length,
      })
    } catch (e: any) {
      errors.push(`${employeeId}: ${e.message}`)
    }
  }

  return {
    period,
    company_id: input.companyId,
    employees_synced: synced.length,
    total_amount: Math.round(synced.reduce((s, r) => s + r.overtime_amount, 0) * 100) / 100,
    total_hours: Math.round(synced.reduce((s, r) => s + r.hours, 0) * 100) / 100,
    rows: synced,
    errors,
  }
}

/**
 * Monthly OT statement: each employee with all approved OT lines for the period.
 */
export async function getMonthlyOvertimeReport(input: {
  companyId: string
  period: string
  employeeId?: string | null
}) {
  const service = getDb()
  const period = input.period
  if (!/^\d{4}-\d{2}$/.test(period)) throw new Error("period must be YYYY-MM")
  const { from, to } = periodBounds(period)

  let query = service
    .from("overtime_requests")
    .select(
      `
      *,
      employees!overtime_requests_employee_id_fkey(
        id, first_name, last_name, employee_id, department, position, company_id
      )
    `,
    )
    .eq("company_id", input.companyId)
    .eq("status", "approved")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true })

  if (input.employeeId) query = query.eq("employee_id", input.employeeId)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = (data || []).filter((r: any) => !r.pay_period || r.pay_period === period)

  const byEmployee = new Map<string, any>()
  for (const r of rows) {
    const emp = r.employees
    if (emp?.company_id && emp.company_id !== input.companyId) continue
    const key = r.employee_id
    if (!byEmployee.has(key)) {
      byEmployee.set(key, {
        employee_id: key,
        employee_name: emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "Employee",
        employee_code: emp?.employee_id || null,
        department: emp?.department || null,
        position: emp?.position || null,
        period,
        total_hours: 0,
        total_amount: 0,
        pending_payroll_hours: 0,
        pending_payroll_amount: 0,
        synced_amount: 0,
        lines: [] as any[],
      })
    }
    const bucket = byEmployee.get(key)
    const hours = Number(r.hours_approved ?? r.hours_requested ?? 0)
    const amount = Number(r.amount_earned ?? 0)
    bucket.total_hours += hours
    bucket.total_amount += amount
    if (r.payroll_status === "synced" || r.payroll_status === "paid") {
      bucket.synced_amount += amount
    } else {
      bucket.pending_payroll_hours += hours
      bucket.pending_payroll_amount += amount
    }
    bucket.lines.push({
      id: r.id,
      date: r.date,
      hours,
      amount_earned: amount,
      hourly_rate_used: Number(r.hourly_rate_used ?? 0),
      multiplier_used: Number(r.multiplier_used ?? 0),
      rate_label: r.rate_label || r.source || null,
      reason: r.reason,
      source: r.source,
      payroll_status: r.payroll_status || "pending_payroll",
      approved_at: r.approved_at,
    })
  }

  const employees = [...byEmployee.values()].map((e) => ({
    ...e,
    total_hours: Math.round(e.total_hours * 100) / 100,
    total_amount: Math.round(e.total_amount * 100) / 100,
    pending_payroll_hours: Math.round(e.pending_payroll_hours * 100) / 100,
    pending_payroll_amount: Math.round(e.pending_payroll_amount * 100) / 100,
    synced_amount: Math.round(e.synced_amount * 100) / 100,
  }))

  employees.sort((a, b) => a.employee_name.localeCompare(b.employee_name))

  return {
    company_id: input.companyId,
    period,
    from,
    to,
    employee_count: employees.length,
    total_hours: Math.round(employees.reduce((s, e) => s + e.total_hours, 0) * 100) / 100,
    total_amount: Math.round(employees.reduce((s, e) => s + e.total_amount, 0) * 100) / 100,
    employees,
  }
}
