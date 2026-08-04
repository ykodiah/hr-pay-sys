import { getGraLabourRateForYear, graMonthlyMinimum } from "@/lib/gra-labour-rates"

export function daysBetweenInclusive(start: string, end: string): number {
  const a = new Date(start)
  const b = new Date(end)
  const ms = b.getTime() - a.getTime()
  if (!Number.isFinite(ms) || ms < 0) return 1
  return Math.floor(ms / 86400000) + 1
}

export function workingDaysBetweenInclusive(start: string, end: string): number {
  const cur = new Date(start)
  const last = new Date(end)
  let n = 0
  while (cur <= last) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) n += 1
    cur.setDate(cur.getDate() + 1)
  }
  return Math.max(n, 0)
}

export type LeavePayResult = {
  days: number
  is_paid: boolean
  pay_mode: "full_salary" | "prorate"
  payment_percentage: number
  monthly_basic: number
  working_days_per_month: number
  daily_rate: number
  paid_amount: number
  unpaid_deduction: number
  leave_allowance_amount: number
  leave_allowance_type: string | null
  has_leave_allowance: boolean
  leave_type_name: string | null
  formula: string
}

/**
 * Paid leave + optional one-time leave allowance.
 *
 * pay_mode:
 *  - full_salary: employee keeps full monthly payroll; no prorata deduction for leave days
 *  - prorate: pay leave days at payment%; unpaid portion → payroll deduction
 *
 * leave_allowance (one-time, company-configured):
 *  - fixed: flat GHS amount
 *  - days_of_pay: amount × daily_rate
 *  - percent_monthly: amount% of monthly basic
 */
export async function computeLeavePay(input: {
  service: any
  companyId: string
  employeeId: string
  leaveTypeId?: string | null
  startDate: string
  endDate: string
  daysRequested?: number | null
}): Promise<LeavePayResult> {
  const days =
    Number(input.daysRequested) ||
    workingDaysBetweenInclusive(input.startDate, input.endDate) ||
    daysBetweenInclusive(input.startDate, input.endDate)

  let leaveType: any = null
  if (input.leaveTypeId) {
    const { data } = await input.service
      .from("leave_types")
      .select(
        "id, name, is_paid, payment_percentage, pay_mode, has_leave_allowance, leave_allowance_type, leave_allowance_amount, leave_allowance_once_per_year, entitlement_amount",
      )
      .eq("id", input.leaveTypeId)
      .eq("company_id", input.companyId)
      .maybeSingle()
    leaveType = data
  }

  const isPaid = leaveType ? leaveType.is_paid !== false : true
  const payMode: "full_salary" | "prorate" =
    isPaid && String(leaveType?.pay_mode || "prorate") === "full_salary" ? "full_salary" : "prorate"
  const paymentPct = isPaid ? Number(leaveType?.payment_percentage ?? 100) : 0

  const year = Number(String(input.startDate).slice(0, 4)) || new Date().getFullYear()
  const gra = getGraLabourRateForYear(year)
  const workingDays = gra.working_days_per_month || 27

  const { data: fin } = await input.service
    .from("employee_financial")
    .select("monthly_salary, basic_salary")
    .eq("employee_id", input.employeeId)
    .maybeSingle()

  let monthly = Number(fin?.monthly_salary ?? fin?.basic_salary ?? 0)
  if (!monthly) {
    const { data: emp } = await input.service
      .from("employees")
      .select("salary")
      .eq("id", input.employeeId)
      .eq("company_id", input.companyId)
      .maybeSingle()
    monthly = Number(emp?.salary ?? 0)
  }
  if (!monthly) monthly = graMonthlyMinimum(gra)

  const dailyRate = Math.round((monthly / workingDays) * 100) / 100
  const fullLeaveValue = Math.round(days * dailyRate * 100) / 100

  let paidAmount = 0
  let unpaidDeduction = 0
  let formula = ""

  if (!isPaid) {
    paidAmount = 0
    unpaidDeduction = fullLeaveValue
    formula = `Unpaid: ${days} days × ${dailyRate} = ${unpaidDeduction} deduction`
  } else if (payMode === "full_salary") {
    // Keep full monthly payroll — no day-level deduction
    paidAmount = Math.round(monthly * (paymentPct / 100) * 100) / 100
    unpaidDeduction = 0
    formula = `Full salary mode: monthly payroll retained (${paymentPct}% of ${monthly} = ${paidAmount} reference); no leave-day deduction`
  } else {
    // Prorate
    paidAmount = Math.round(fullLeaveValue * (paymentPct / 100) * 100) / 100
    unpaidDeduction = Math.round((fullLeaveValue - paidAmount) * 100) / 100
    formula = `Prorate: ${days} days × ${dailyRate} × ${paymentPct}% = ${paidAmount} paid` +
      (unpaidDeduction > 0 ? `; ${unpaidDeduction} unpaid deduction` : "")
  }

  // One-time leave allowance
  let leaveAllowance = 0
  let allowanceType: string | null = null
  const hasAllowance = Boolean(leaveType?.has_leave_allowance)
  if (hasAllowance) {
    allowanceType = String(leaveType?.leave_allowance_type || "fixed")
    const raw = Number(leaveType?.leave_allowance_amount || 0)
    if (allowanceType === "days_of_pay") {
      leaveAllowance = Math.round(raw * dailyRate * 100) / 100
    } else if (allowanceType === "percent_monthly") {
      leaveAllowance = Math.round(monthly * (raw / 100) * 100) / 100
    } else {
      leaveAllowance = Math.round(raw * 100) / 100
    }

    // Once-per-year guard
    if (leaveType?.leave_allowance_once_per_year !== false && leaveAllowance > 0) {
      const { data: prior } = await input.service
        .from("leave_allowance_payments")
        .select("id, amount")
        .eq("company_id", input.companyId)
        .eq("employee_id", input.employeeId)
        .eq("leave_type_id", input.leaveTypeId)
        .eq("year", year)
        .limit(1)
      if (prior?.length) {
        leaveAllowance = 0
        formula += `; leave allowance skipped (already paid this year)`
      }
    }
    if (leaveAllowance > 0) {
      formula += `; leave allowance ${leaveAllowance} (${allowanceType})`
    }
  }

  return {
    days,
    is_paid: isPaid,
    pay_mode: payMode,
    payment_percentage: paymentPct,
    monthly_basic: monthly,
    working_days_per_month: workingDays,
    daily_rate: dailyRate,
    paid_amount: paidAmount,
    unpaid_deduction: unpaidDeduction,
    leave_allowance_amount: leaveAllowance,
    leave_allowance_type: allowanceType,
    has_leave_allowance: hasAllowance,
    leave_type_name: leaveType?.name || null,
    formula,
  }
}

/** Sync unpaid deduction + one-time leave allowance into payroll_pay_inputs. */
export async function syncLeavePayToPayroll(input: {
  service: any
  companyId: string
  employeeId: string
  leaveRequestId?: string
  leaveTypeId?: string | null
  startDate: string
  unpaidDeduction: number
  leaveAllowance: number
  leaveAllowanceType?: string | null
  notes?: string
}) {
  const period = String(input.startDate).slice(0, 7)
  const year = Number(period.slice(0, 4))
  const { data: existing } = await input.service
    .from("payroll_pay_inputs")
    .select("*")
    .eq("company_id", input.companyId)
    .eq("employee_id", input.employeeId)
    .eq("pay_period", period)
    .maybeSingle()

  const unpaid = Math.round((Number(existing?.unpaid_leave_deduction || 0) + Number(input.unpaidDeduction || 0)) * 100) / 100
  const allowance =
    Math.round((Number(existing?.leave_allowance || 0) + Number(input.leaveAllowance || 0)) * 100) / 100
  // Also fold unpaid into other_deductions for engines that don't read unpaid_leave_deduction yet
  const otherBase = Number(existing?.other_deductions || 0)
  const other = Math.round((otherBase + Number(input.unpaidDeduction || 0)) * 100) / 100

  const upsert: Record<string, any> = {
    company_id: input.companyId,
    employee_id: input.employeeId,
    pay_period: period,
    unpaid_leave_deduction: unpaid,
    leave_allowance: allowance,
    other_deductions: other,
    overtime_amount: Number(existing?.overtime_amount ?? 0),
    bonus_amount: Number(existing?.bonus_amount ?? 0),
    loan_deduction: Number(existing?.loan_deduction ?? 0),
    advance_deduction: Number(existing?.advance_deduction ?? 0),
    status: existing?.status || "draft",
    updated_at: new Date().toISOString(),
  }
  if (existing?.id) upsert.id = existing.id

  const { data, error } = await input.service
    .from("payroll_pay_inputs")
    .upsert(upsert, { onConflict: "company_id,employee_id,pay_period" })
    .select()
    .maybeSingle()

  // Soft-fail if new columns missing
  if (error && /column|does not exist/i.test(error.message)) {
    const minimal = {
      company_id: input.companyId,
      employee_id: input.employeeId,
      pay_period: period,
      other_deductions: other,
      bonus_amount: Math.round((Number(existing?.bonus_amount || 0) + Number(input.leaveAllowance || 0)) * 100) / 100,
      overtime_amount: Number(existing?.overtime_amount ?? 0),
      status: existing?.status || "draft",
      updated_at: new Date().toISOString(),
      ...(existing?.id ? { id: existing.id } : {}),
    }
    const retry = await input.service
      .from("payroll_pay_inputs")
      .upsert(minimal, { onConflict: "company_id,employee_id,pay_period" })
      .select()
      .maybeSingle()
    if (retry.error) throw new Error(retry.error.message)
  } else if (error) {
    throw new Error(error.message)
  }

  if (input.leaveAllowance > 0 && input.leaveRequestId) {
    await input.service.from("leave_allowance_payments").upsert(
      {
        company_id: input.companyId,
        employee_id: input.employeeId,
        leave_request_id: input.leaveRequestId,
        leave_type_id: input.leaveTypeId || null,
        pay_period: period,
        year,
        amount: input.leaveAllowance,
        allowance_type: input.leaveAllowanceType || "fixed",
        notes: input.notes || "Leave allowance on approve",
      },
      { onConflict: "company_id,leave_request_id" },
    )
  }

  return data
}

/** @deprecated use syncLeavePayToPayroll */
export async function syncLeaveDeductionToPayroll(input: {
  service: any
  companyId: string
  employeeId: string
  startDate: string
  unpaidDeduction: number
}) {
  return syncLeavePayToPayroll({
    ...input,
    leaveAllowance: 0,
  })
}

export async function markAttendanceLeave(
  service: any,
  companyId: string,
  employeeId: string,
  start: string,
  end: string,
) {
  const cur = new Date(start)
  const last = new Date(end)
  while (cur <= last) {
    const date = cur.toISOString().slice(0, 10)
    const day = cur.getDay()
    if (day !== 0 && day !== 6) {
      const { data: existing } = await service
        .from("attendance_records")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("date", date)
        .maybeSingle()
      const row = {
        company_id: companyId,
        employee_id: employeeId,
        date,
        status: "leave",
        source: "leave",
        notes: "Marked from approved leave",
        updated_at: new Date().toISOString(),
      }
      if (existing?.id) {
        await service.from("attendance_records").update(row).eq("id", existing.id)
      } else {
        await service.from("attendance_records").insert(row)
      }
    }
    cur.setDate(cur.getDate() + 1)
  }
}

export async function debitLeaveBalance(
  service: any,
  companyId: string,
  employeeId: string,
  leaveTypeId: string | null | undefined,
  days: number,
) {
  if (!leaveTypeId || !days) return
  const year = new Date().getFullYear()
  const { data: bal } = await service
    .from("leave_balances")
    .select("id, used_days, remaining_days, entitled_days")
    .eq("employee_id", employeeId)
    .eq("leave_type_id", leaveTypeId)
    .eq("year", year)
    .maybeSingle()

  if (bal?.id) {
    const used = Number(bal.used_days || 0) + days
    const entitled = Number(bal.entitled_days || 0)
    await service
      .from("leave_balances")
      .update({
        used_days: used,
        remaining_days: Math.max(0, entitled - used),
        updated_at: new Date().toISOString(),
      })
      .eq("id", bal.id)
  } else {
    const { data: lt } = await service
      .from("leave_types")
      .select("entitlement_amount")
      .eq("id", leaveTypeId)
      .maybeSingle()
    const entitled = Number(lt?.entitlement_amount || 0)
    await service.from("leave_balances").insert({
      company_id: companyId,
      employee_id: employeeId,
      leave_type_id: leaveTypeId,
      year,
      entitled_days: entitled,
      used_days: days,
      remaining_days: Math.max(0, entitled - days),
    })
  }
}
