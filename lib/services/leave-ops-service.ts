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

/**
 * Paid leave computation when leave type `is_paid` is selected.
 *
 * daily_rate = monthly_basic ÷ working_days_per_month (GRA default 27)
 * If is_paid:
 *   paid_amount = days × daily_rate × (payment_percentage / 100)
 *   unpaid_deduction = days × daily_rate × (1 - payment_percentage/100)
 * If unpaid:
 *   paid_amount = 0
 *   unpaid_deduction = days × daily_rate  (salary hold for the leave days)
 */
export async function computeLeavePay(input: {
  service: any
  companyId: string
  employeeId: string
  leaveTypeId?: string | null
  startDate: string
  endDate: string
  daysRequested?: number | null
}) {
  const days =
    Number(input.daysRequested) ||
    workingDaysBetweenInclusive(input.startDate, input.endDate) ||
    daysBetweenInclusive(input.startDate, input.endDate)

  let leaveType: any = null
  if (input.leaveTypeId) {
    const { data } = await input.service
      .from("leave_types")
      .select("id, name, is_paid, payment_percentage, entitlement_amount")
      .eq("id", input.leaveTypeId)
      .eq("company_id", input.companyId)
      .maybeSingle()
    leaveType = data
  }

  const isPaid = leaveType ? leaveType.is_paid !== false : true
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
  const fullValue = Math.round(days * dailyRate * 100) / 100
  const paidAmount = Math.round(fullValue * (paymentPct / 100) * 100) / 100
  const unpaidDeduction = Math.round((fullValue - paidAmount) * 100) / 100

  return {
    days,
    is_paid: isPaid,
    payment_percentage: paymentPct,
    monthly_basic: monthly,
    working_days_per_month: workingDays,
    daily_rate: dailyRate,
    paid_amount: paidAmount,
    unpaid_deduction: unpaidDeduction,
    leave_type_name: leaveType?.name || null,
    formula: isPaid
      ? `${days} days × ${dailyRate} × ${paymentPct}% = ${paidAmount} paid` +
        (unpaidDeduction > 0 ? `; ${unpaidDeduction} unpaid deduction` : "")
      : `${days} days × ${dailyRate} = ${unpaidDeduction} unpaid deduction (leave type unpaid)`,
  }
}

/** Apply unpaid leave deduction into payroll_pay_inputs.other_deductions for the period. */
export async function syncLeaveDeductionToPayroll(input: {
  service: any
  companyId: string
  employeeId: string
  startDate: string
  unpaidDeduction: number
}) {
  if (!input.unpaidDeduction || input.unpaidDeduction <= 0) return null
  const period = String(input.startDate).slice(0, 7)
  const { data: existing } = await input.service
    .from("payroll_pay_inputs")
    .select("*")
    .eq("company_id", input.companyId)
    .eq("employee_id", input.employeeId)
    .eq("pay_period", period)
    .maybeSingle()

  const other = Number(existing?.other_deductions || 0) + Number(input.unpaidDeduction)
  const upsert: Record<string, any> = {
    company_id: input.companyId,
    employee_id: input.employeeId,
    pay_period: period,
    other_deductions: Math.round(other * 100) / 100,
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
  if (error) throw new Error(error.message)
  return data
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
