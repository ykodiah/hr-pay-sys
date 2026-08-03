import { createClient } from "@/lib/supabase/server"
import {
  buildAmortizationForInterestType,
  buildAmortizationPreview,
  calcMonthlyPayment,
  normalizeInterestType,
  type InterestType,
} from "@/lib/services/loan-calculations"

export {
  calcMonthlyPayment,
  buildAmortizationPreview,
  buildAmortizationForInterestType,
  normalizeInterestType,
  interestTypeLabel,
} from "@/lib/services/loan-calculations"
export type { AmortizationPreviewRow, InterestType } from "@/lib/services/loan-calculations"

export type LoanStatus =
  | "pending"
  | "approved"
  | "active"
  | "completed"
  | "rejected"
  | "defaulted"
  | "cancelled"

export interface EmployeeLoan {
  id: string
  company_id: string
  employee_id: string
  loan_type: string
  loan_type_id?: string | null
  purpose: string | null
  principal: number
  interest_rate: number
  interest_type?: InterestType | string | null
  repayment_months: number
  monthly_payment: number
  monthly_installment?: number | null
  amount_paid: number
  remaining_balance: number
  expected_total_payment?: number | null
  total_interest?: number | null
  last_payment_date?: string | null
  last_payment_amount?: number | null
  last_payroll_run_id?: string | null
  start_date: string | null
  end_date: string | null
  disbursed_at: string | null
  status: LoanStatus
  approved_by: string | null
  approved_at: string | null
  rejected_by: string | null
  rejected_at: string | null
  rejection_reason: string | null
  auto_deduct: boolean
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  employee_name?: string | null
  employee_id_no?: string | null
  department?: string | null
}

export interface AmortizationRow {
  id: string
  loan_id: string
  month_number: number
  due_date: string
  payment_amount: number
  principal_portion: number
  interest_portion: number
  balance_remaining: number
  paid_amount: number
  paid_date: string | null
  status: "pending" | "paid" | "overdue" | "skipped"
  payslip_id: string | null
}

export interface CreateLoanInput {
  employee_id: string
  company_id: string
  loan_type: string
  loan_type_id?: string | null
  purpose?: string
  principal: number
  interest_rate?: number
  interest_type?: string | null
  repayment_months: number
  start_date?: string
  auto_deduct?: boolean
  notes?: string
  created_by?: string
  /** When true (admin create), activate immediately so payroll can deduct. */
  activate?: boolean
}

function round2(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

/** Monthly installment from either payroll or advanced column. */
export function loanMonthlyCharge(loan: {
  monthly_payment?: number | null
  monthly_installment?: number | null
}): number {
  return round2(Number(loan.monthly_payment ?? loan.monthly_installment ?? 0))
}

/** Total amount the employee must repay (principal + interest). */
export function loanTotalPayable(loan: {
  expected_total_payment?: number | null
  principal?: number | null
  total_interest?: number | null
}): number {
  const expected = Number(loan.expected_total_payment || 0)
  if (expected > 0) return round2(expected)
  return round2(Number(loan.principal || 0) + Number(loan.total_interest || 0))
}

async function enrichLoansWithEmployees(loans: any[]): Promise<EmployeeLoan[]> {
  if (!loans.length) return []

  const supabase = await createClient()
  const employeeIds = [...new Set(loans.map((l) => l.employee_id).filter(Boolean))]

  const employeeMap = new Map<string, any>()
  if (employeeIds.length) {
    const { data: employees } = await supabase
      .from("employees")
      .select("id, first_name, last_name, employee_id, department")
      .in("id", employeeIds)

    for (const emp of employees ?? []) {
      employeeMap.set(emp.id, emp)
    }
  }

  return loans.map((row) => {
    const emp = row.employees ?? employeeMap.get(row.employee_id) ?? null
    return {
      ...row,
      interest_type: normalizeInterestType(row.interest_type),
      monthly_payment: loanMonthlyCharge(row),
      expected_total_payment: loanTotalPayable(row),
      remaining_balance: round2(
        Number(
          row.remaining_balance ??
            Math.max(0, loanTotalPayable(row) - Number(row.amount_paid || 0)),
        ),
      ),
      employee_name: emp ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() : null,
      employee_id_no: emp?.employee_id ?? null,
      department: emp?.department ?? null,
    } as EmployeeLoan
  })
}

async function persistAmortizationSchedule(loan: {
  id: string
  company_id?: string
  employee_id?: string
  principal: number
  interest_rate: number
  interest_type?: string | null
  repayment_months: number
  start_date: string | null
}): Promise<void> {
  const supabase = await createClient()
  const startDate = loan.start_date ?? new Date().toISOString().split("T")[0]
  const preview = buildAmortizationForInterestType({
    principal: Number(loan.principal),
    annualRatePercent: Number(loan.interest_rate ?? 0),
    tenureMonths: Number(loan.repayment_months),
    interestType: loan.interest_type,
    startDate,
  })

  // Clear any prior schedule rows before regenerating
  await supabase.from("loan_amortization_schedule").delete().eq("loan_id", loan.id)

  const rows = preview.rows.map((row) => ({
    loan_id: loan.id,
    month_number: row.month_number,
    due_date: row.due_date,
    payment_amount: row.payment_amount,
    principal_portion: row.principal_portion,
    interest_portion: row.interest_portion,
    balance_remaining: row.balance_remaining,
    paid_amount: 0,
    paid_date: null,
    status: "pending",
    payslip_id: null,
  }))

  const { error } = await supabase.from("loan_amortization_schedule").insert(rows)
  if (error) {
    console.warn("[loans] Could not persist amortization schedule:", error.message)
  }

  // Keep advanced loan_schedules in sync when that table exists
  if (loan.company_id && loan.employee_id) {
    await supabase.from("loan_schedules").delete().eq("employee_loan_id", loan.id)
    const advancedRows = preview.rows.map((row) => ({
      company_id: loan.company_id,
      employee_loan_id: loan.id,
      employee_id: loan.employee_id,
      payment_number: row.month_number,
      due_date: row.due_date,
      principal_amount: row.principal_portion,
      interest_amount: row.interest_portion,
      total_payment: row.payment_amount,
      remaining_principal: row.balance_remaining,
      remaining_total: row.balance_remaining,
      amount_paid: 0,
      payment_status: "pending",
    }))
    const { error: advErr } = await supabase.from("loan_schedules").insert(advancedRows)
    if (advErr) {
      console.warn("[loans] Could not persist loan_schedules:", advErr.message)
    }
  }
}

/** Create a new loan application (and optionally activate for payroll deduction). */
export async function createLoan(input: CreateLoanInput): Promise<EmployeeLoan> {
  const supabase = await createClient()

  let interestType = normalizeInterestType(input.interest_type)
  let interestRate = Number(input.interest_rate ?? 0)

  // Resolve interest method + rate from loan type when available
  if (input.loan_type_id) {
    const { data: typeRow } = await supabase
      .from("loan_types")
      .select("interest_type, annual_interest_rate")
      .eq("id", input.loan_type_id)
      .maybeSingle()
    if (typeRow) {
      if (!input.interest_type) interestType = normalizeInterestType(typeRow.interest_type)
      if (input.interest_rate == null) interestRate = Number(typeRow.annual_interest_rate ?? 0)
    }
  }

  const startDate = input.start_date ?? new Date().toISOString().split("T")[0]
  const endDate = new Date(
    new Date(startDate).setMonth(new Date(startDate).getMonth() + input.repayment_months),
  )
    .toISOString()
    .split("T")[0]

  const preview = buildAmortizationForInterestType({
    principal: input.principal,
    annualRatePercent: interestRate,
    tenureMonths: input.repayment_months,
    interestType,
    startDate,
  })

  const monthly_payment = preview.monthly_payment
  const expectedTotalPayment = preview.total_payable
  const totalInterest = preview.total_interest

  const activate = Boolean(input.activate)
  const now = new Date().toISOString()

  const insertRow: Record<string, unknown> = {
    company_id: input.company_id,
    employee_id: input.employee_id,
    loan_type: input.loan_type,
    purpose: input.purpose ?? null,
    principal: input.principal,
    principal_amount: input.principal,
    interest_rate: interestRate,
    interest_type: interestType,
    repayment_months: input.repayment_months,
    tenure_months: input.repayment_months,
    monthly_payment,
    monthly_installment: monthly_payment,
    // Remaining tracks total amount still to pay (principal + interest − paid)
    remaining_balance: expectedTotalPayment,
    outstanding_balance: expectedTotalPayment,
    amount_paid: 0,
    expected_total_payment: expectedTotalPayment,
    total_interest: totalInterest,
    start_date: startDate,
    end_date: endDate,
    auto_deduct: input.auto_deduct ?? true,
    notes: input.notes ?? null,
    created_by: input.created_by ?? null,
    status: activate ? "active" : "pending",
    approved_by: activate ? input.created_by ?? null : null,
    approved_at: activate ? now : null,
    disbursed_at: activate ? now : null,
  }
  if (input.loan_type_id) {
    insertRow.loan_type_id = input.loan_type_id
  }

  const { data, error } = await supabase
    .from("employee_loans")
    .insert(insertRow)
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (activate) {
    await persistAmortizationSchedule({
      id: data.id,
      company_id: data.company_id,
      employee_id: data.employee_id,
      principal: data.principal,
      interest_rate: data.interest_rate,
      interest_type: data.interest_type ?? interestType,
      repayment_months: data.repayment_months,
      start_date: data.start_date,
    })
  }

  const [enriched] = await enrichLoansWithEmployees([data])
  return enriched
}

/** List loans for a company (HR view) or employee (self-service). */
export async function listLoans(options: {
  company_id?: string
  employee_id?: string
  status?: LoanStatus
}): Promise<EmployeeLoan[]> {
  const supabase = await createClient()

  let query = supabase.from("employee_loans").select("*").order("created_at", { ascending: false })

  if (options.company_id) query = query.eq("company_id", options.company_id)
  if (options.employee_id) query = query.eq("employee_id", options.employee_id)
  if (options.status) query = query.eq("status", options.status)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return enrichLoansWithEmployees(data ?? [])
}

/** Get a single loan with its amortization schedule. */
export async function getLoanWithSchedule(loanId: string): Promise<{
  loan: EmployeeLoan
  schedule: AmortizationRow[]
}> {
  const supabase = await createClient()

  const { data: loan, error: le } = await supabase
    .from("employee_loans")
    .select("*")
    .eq("id", loanId)
    .single()

  if (le) throw new Error(le.message)

  const [loanMapped] = await enrichLoansWithEmployees([loan])
  const interestType = normalizeInterestType(loan.interest_type)

  let schedule: AmortizationRow[] = []
  const { data: scheduleRows, error: se } = await supabase
    .from("loan_amortization_schedule")
    .select("*")
    .eq("loan_id", loanId)
    .order("month_number")

  if (!se && scheduleRows?.length) {
    schedule = scheduleRows as AmortizationRow[]
  } else {
    // Fall back to advanced loan_schedules table
    const { data: advRows } = await supabase
      .from("loan_schedules")
      .select("*")
      .eq("employee_loan_id", loanId)
      .order("payment_number")

    if (advRows?.length) {
      schedule = advRows.map((row: any) => ({
        id: row.id,
        loan_id: loanId,
        month_number: Number(row.payment_number || 0),
        due_date: row.due_date,
        payment_amount: Number(row.total_payment || 0),
        principal_portion: Number(row.principal_amount || 0),
        interest_portion: Number(row.interest_amount || 0),
        balance_remaining: Number(row.remaining_total ?? row.remaining_principal ?? 0),
        paid_amount: Number(row.amount_paid || 0),
        paid_date: row.paid_date ?? null,
        status:
          String(row.payment_status || "pending") === "paid"
            ? ("paid" as const)
            : ("pending" as const),
        payslip_id: row.payslip_id ?? null,
      }))
    } else {
      // Preview fallback — mark installments paid from loan.amount_paid
      const startDate = loan.start_date ?? new Date().toISOString().split("T")[0]
      let remainingPaid = Number(loan.amount_paid || 0)
      schedule = buildAmortizationForInterestType({
        principal: Number(loan.principal),
        annualRatePercent: Number(loan.interest_rate ?? 0),
        tenureMonths: Number(loan.repayment_months || 1),
        interestType,
        startDate,
      }).rows.map((row, idx) => {
        const due = Number(row.payment_amount || 0)
        const paidHere = Math.min(remainingPaid, due)
        remainingPaid = Math.max(0, remainingPaid - paidHere)
        return {
          id: `preview-${loanId}-${idx + 1}`,
          loan_id: loanId,
          month_number: row.month_number,
          due_date: row.due_date,
          payment_amount: row.payment_amount,
          principal_portion: row.principal_portion,
          interest_portion: row.interest_portion,
          balance_remaining: row.balance_remaining,
          paid_amount: paidHere,
          paid_date: paidHere > 0 ? (loan.last_payment_date ?? startDate) : null,
          status: paidHere + 0.009 >= due ? ("paid" as const) : ("pending" as const),
          payslip_id: null,
        }
      })
    }
  }

  // Rebuild unpaid schedules when stored rows don't match the loan's interest method
  // (fixes loans created before interest_type was wired, e.g. fixed shown as reducing).
  const scheduleHasPayments = schedule.some(
    (r) => Number(r.paid_amount || 0) > 0.009 || String(r.status) === "paid",
  )
  const unpaidLoan = Number(loan.amount_paid || 0) <= 0.009
  if (unpaidLoan && !scheduleHasPayments && ["active", "approved", "pending"].includes(String(loan.status))) {
    const startDate = loan.start_date ?? new Date().toISOString().split("T")[0]
    const recomputed = buildAmortizationForInterestType({
      principal: Number(loan.principal),
      annualRatePercent: Number(loan.interest_rate ?? 0),
      tenureMonths: Number(loan.repayment_months || 1),
      interestType,
      startDate,
    })
    const storedInterest0 = Number(schedule[0]?.interest_portion || 0)
    const expectedInterest0 = Number(recomputed.rows[0]?.interest_portion || 0)
    const totalsMismatch =
      Math.abs(recomputed.total_interest - Number(loan.total_interest || 0)) > 0.05 ||
      Math.abs(recomputed.total_payable - Number(loan.expected_total_payment || 0)) > 0.05 ||
      (schedule.length > 0 && Math.abs(storedInterest0 - expectedInterest0) > 0.05) ||
      schedule.length === 0

    if (totalsMismatch) {
      await persistAmortizationSchedule({
        id: loan.id,
        company_id: loan.company_id,
        employee_id: loan.employee_id,
        principal: Number(loan.principal),
        interest_rate: Number(loan.interest_rate ?? 0),
        interest_type: interestType,
        repayment_months: Number(loan.repayment_months || 1),
        start_date: loan.start_date,
      })
      await supabase
        .from("employee_loans")
        .update({
          interest_type: interestType,
          monthly_payment: recomputed.monthly_payment,
          monthly_installment: recomputed.monthly_payment,
          expected_total_payment: recomputed.total_payable,
          total_interest: recomputed.total_interest,
          remaining_balance: recomputed.total_payable,
          outstanding_balance: recomputed.total_payable,
          updated_at: new Date().toISOString(),
        })
        .eq("id", loanId)

      const { data: rebuilt } = await supabase
        .from("loan_amortization_schedule")
        .select("*")
        .eq("loan_id", loanId)
        .order("month_number")
      if (rebuilt?.length) schedule = rebuilt as AmortizationRow[]

      const [refreshed] = await enrichLoansWithEmployees([
        {
          ...loan,
          interest_type: interestType,
          monthly_payment: recomputed.monthly_payment,
          monthly_installment: recomputed.monthly_payment,
          expected_total_payment: recomputed.total_payable,
          total_interest: recomputed.total_interest,
          remaining_balance: recomputed.total_payable,
        },
      ])
      return { loan: refreshed, schedule }
    }
  }

  // Keep installment paid/status in sync with cumulative amount_paid when schedule rows lag
  if (Number(loan.amount_paid || 0) > 0.009 && schedule.length) {
    const schedulePaid = schedule.reduce((s, r) => s + Number(r.paid_amount || 0), 0)
    if (schedulePaid + 0.05 < Number(loan.amount_paid || 0)) {
      let remainingPaid = Number(loan.amount_paid || 0)
      const synced: AmortizationRow[] = []
      for (const row of schedule) {
        const due = Number(row.payment_amount || 0)
        const paidHere = Math.min(remainingPaid, due)
        remainingPaid = Math.max(0, round2(remainingPaid - paidHere))
        const fullyPaid = paidHere + 0.009 >= due && due > 0
        const next: AmortizationRow = {
          ...row,
          paid_amount: paidHere,
          paid_date: paidHere > 0 ? row.paid_date || loan.last_payment_date || null : null,
          status: fullyPaid ? "paid" : row.status === "overdue" ? "overdue" : "pending",
        }
        synced.push(next)
        if (row.id && !String(row.id).startsWith("preview-")) {
          await supabase
            .from("loan_amortization_schedule")
            .update({
              paid_amount: next.paid_amount,
              paid_date: next.paid_date,
              status: next.status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", row.id)
        }
      }
      schedule = synced
    }
  }

  return { loan: loanMapped, schedule }
}

/** Approve a loan: set status → active, generate amortization schedule. */
export async function approveLoan(loanId: string, approverId: string): Promise<void> {
  const supabase = await createClient()

  const { data: loan, error: fetchError } = await supabase
    .from("employee_loans")
    .select(
      "id, company_id, employee_id, principal, interest_rate, interest_type, repayment_months, start_date, status, expected_total_payment, total_interest",
    )
    .eq("id", loanId)
    .single()

  if (fetchError) throw new Error(fetchError.message)
  if (!loan) throw new Error("Loan not found")
  if (!["pending", "approved"].includes(loan.status)) {
    throw new Error(`Cannot approve loan in status "${loan.status}"`)
  }

  const totalPayable = loanTotalPayable(loan)

  const { error } = await supabase
    .from("employee_loans")
    .update({
      status: "active",
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      disbursed_at: new Date().toISOString(),
      remaining_balance: totalPayable > 0 ? totalPayable : Number(loan.principal || 0),
      updated_at: new Date().toISOString(),
    })
    .eq("id", loanId)

  if (error) throw new Error(error.message)

  await persistAmortizationSchedule(loan)
}

/** Reject a loan application. */
export async function rejectLoan(loanId: string, rejectorId: string, reason: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("employee_loans")
    .update({
      status: "rejected",
      rejected_by: rejectorId,
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", loanId)
  if (error) throw new Error(error.message)
}

/** Cancel a loan (employee-initiated, only allowed when pending). */
export async function cancelLoan(loanId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("employee_loans")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", loanId)
    .eq("status", "pending")
  if (error) throw new Error(error.message)
}

export interface PayrollLoanPaymentResult {
  loan_id: string
  amount: number
  principal_portion: number
  interest_portion: number
  balance_before: number
  balance_after: number
  schedule_id: string | null
  status: LoanStatus
}

/**
 * Apply a payroll deduction to one loan:
 * - marks the next pending amortization row as paid (when present)
 * - updates amount_paid / remaining_balance / status on employee_loans
 * - records payroll_loan_payments for payslip multi-loan summaries
 */
export async function applyLoanPayrollPayment(input: {
  companyId: string
  employeeId: string
  loanId: string
  amount: number
  payrollRunId?: string | null
  payslipId?: string | null
  payPeriod?: string | null
  paymentDate?: string
}): Promise<PayrollLoanPaymentResult | null> {
  const amount = round2(Number(input.amount || 0))
  if (amount <= 0) return null

  const supabase = await createClient()
  const today = input.paymentDate || new Date().toISOString().split("T")[0]

  // Idempotent: skip if this payroll run already posted for the loan
  if (input.payrollRunId) {
    const { data: existing } = await supabase
      .from("payroll_loan_payments")
      .select("id")
      .eq("payroll_run_id", input.payrollRunId)
      .eq("loan_id", input.loanId)
      .maybeSingle()
    if (existing?.id) return null
  }

  const { data: loan, error: loanError } = await supabase
    .from("employee_loans")
    .select(
      "id, amount_paid, remaining_balance, principal, monthly_payment, monthly_installment, expected_total_payment, total_interest, status",
    )
    .eq("id", input.loanId)
    .eq("company_id", input.companyId)
    .single()

  if (loanError || !loan) throw new Error(loanError?.message || "Loan not found")

  const totalPayable = loanTotalPayable(loan)
  const amountPaidBefore = Number(loan.amount_paid ?? 0)
  const balanceBefore = round2(
    Number(
      loan.remaining_balance != null && loan.remaining_balance !== ""
        ? loan.remaining_balance
        : Math.max(0, totalPayable - amountPaidBefore),
    ),
  )
  const pay = Math.min(amount, balanceBefore > 0 ? balanceBefore : amount)
  if (pay <= 0) return null

  // Mark next pending schedule installment (or partial if needed)
  let scheduleId: string | null = null
  let principalPortion = pay
  let interestPortion = 0

  const { data: nextRow } = await supabase
    .from("loan_amortization_schedule")
    .select("id, payment_amount, principal_portion, interest_portion, paid_amount, status, month_number")
    .eq("loan_id", input.loanId)
    .in("status", ["pending", "overdue"])
    .order("month_number", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (nextRow?.id) {
    scheduleId = nextRow.id
    const due = Number(nextRow.payment_amount || pay)
    const prevPaid = Number(nextRow.paid_amount || 0)
    const installmentPay = Math.min(pay, Math.max(0, due - prevPaid))
    const ratio = due > 0 ? installmentPay / due : 1
    principalPortion = round2(Number(nextRow.principal_portion || pay) * ratio)
    interestPortion = round2(Number(nextRow.interest_portion || 0) * ratio)
    const newPaidAmount = round2(prevPaid + installmentPay)
    const fullyPaid = newPaidAmount + 0.009 >= due

    await supabase
      .from("loan_amortization_schedule")
      .update({
        paid_amount: newPaidAmount,
        paid_date: today,
        status: fullyPaid ? "paid" : "pending",
        payslip_id: input.payslipId ?? null,
        payroll_run_id: input.payrollRunId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", nextRow.id)

    // Mirror onto advanced loan_schedules when present
    if (nextRow.month_number != null) {
      await supabase
        .from("loan_schedules")
        .update({
          amount_paid: newPaidAmount,
          paid_date: today,
          payment_status: fullyPaid ? "paid" : "pending",
          payslip_id: input.payslipId ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("employee_loan_id", input.loanId)
        .eq("payment_number", nextRow.month_number)
    }
  } else {
    // Try advanced schedule table if amortization table empty
    const { data: advNext } = await supabase
      .from("loan_schedules")
      .select("id, total_payment, principal_amount, interest_amount, amount_paid, payment_status, payment_number")
      .eq("employee_loan_id", input.loanId)
      .in("payment_status", ["pending", "overdue"])
      .order("payment_number", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (advNext?.id) {
      scheduleId = advNext.id
      const due = Number(advNext.total_payment || pay)
      const prevPaid = Number(advNext.amount_paid || 0)
      const installmentPay = Math.min(pay, Math.max(0, due - prevPaid))
      const ratio = due > 0 ? installmentPay / due : 1
      principalPortion = round2(Number(advNext.principal_amount || pay) * ratio)
      interestPortion = round2(Number(advNext.interest_amount || 0) * ratio)
      const newPaidAmount = round2(prevPaid + installmentPay)
      const fullyPaid = newPaidAmount + 0.009 >= due

      await supabase
        .from("loan_schedules")
        .update({
          amount_paid: newPaidAmount,
          paid_date: today,
          payment_status: fullyPaid ? "paid" : "pending",
          payslip_id: input.payslipId ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", advNext.id)
    }
  }

  const amountPaid = round2(amountPaidBefore + pay)
  // Remaining = total payable − cumulative paid (matches register e − g)
  const balanceAfter = round2(Math.max(0, (totalPayable > 0 ? totalPayable : balanceBefore + amountPaidBefore) - amountPaid))
  const status: LoanStatus = balanceAfter <= 0.009 ? "completed" : "active"

  const { error: updateError } = await supabase
    .from("employee_loans")
    .update({
      amount_paid: amountPaid,
      remaining_balance: balanceAfter,
      outstanding_balance: balanceAfter,
      status,
      last_payment_date: today,
      last_payment_amount: pay,
      last_payroll_run_id: input.payrollRunId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.loanId)
    .eq("company_id", input.companyId)

  if (updateError) throw new Error(updateError.message)

  await supabase.from("payroll_loan_payments").insert({
    company_id: input.companyId,
    payroll_run_id: input.payrollRunId ?? null,
    payslip_id: input.payslipId ?? null,
    employee_id: input.employeeId,
    loan_id: input.loanId,
    schedule_id: scheduleId,
    amount: pay,
    principal_portion: principalPortion,
    interest_portion: interestPortion,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    payment_date: today,
    pay_period: input.payPeriod ?? null,
  })

  return {
    loan_id: input.loanId,
    amount: pay,
    principal_portion: principalPortion,
    interest_portion: interestPortion,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    schedule_id: scheduleId,
    status,
  }
}

/**
 * Allocate a payroll loan_deduction across an employee's active loans.
 * Each loan is paid up to its expected monthly installment / remaining balance.
 */
export async function applyEmployeePayrollLoanDeduction(input: {
  companyId: string
  employeeId: string
  totalDeduction: number
  payrollRunId?: string | null
  payslipId?: string | null
  payPeriod?: string | null
  paymentDate?: string
}): Promise<PayrollLoanPaymentResult[]> {
  const total = round2(Number(input.totalDeduction || 0))
  if (total <= 0) return []

  const supabase = await createClient()
  const { data: loans, error } = await supabase
    .from("employee_loans")
    .select(
      "id, monthly_payment, monthly_installment, remaining_balance, amount_paid, expected_total_payment, total_interest, principal, status, created_at, auto_deduct",
    )
    .eq("company_id", input.companyId)
    .eq("employee_id", input.employeeId)
    .in("status", ["active", "approved"])
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)

  const activeLoans = (loans ?? []).filter((l) => l.auto_deduct !== false)

  let remaining = total
  const results: PayrollLoanPaymentResult[] = []

  // First pass: apply each loan's own monthly charge respectively (never steal another loan's share)
  for (const loan of activeLoans) {
    if (remaining <= 0.009) break
    const charge = loanMonthlyCharge(loan)
    const bal = round2(
      Number(
        loan.remaining_balance ??
          Math.max(0, loanTotalPayable(loan) - Number(loan.amount_paid || 0)),
      ),
    )
    // Skip loans with no configured charge — leftover is handled in the second pass
    if (charge <= 0.009 || bal <= 0.009) continue
    const pay = Math.min(charge, bal, remaining)
    if (pay <= 0.009) continue
    const applied = await applyLoanPayrollPayment({
      companyId: input.companyId,
      employeeId: input.employeeId,
      loanId: loan.id,
      amount: pay,
      payrollRunId: input.payrollRunId,
      payslipId: input.payslipId,
      payPeriod: input.payPeriod,
      paymentDate: input.paymentDate,
    })
    if (applied) {
      results.push(applied)
      remaining = round2(remaining - applied.amount)
    }
  }

  // Second pass: leftover deduction (manual override) FIFO across remaining balances
  if (remaining > 0.009) {
    for (const loan of activeLoans) {
      if (remaining <= 0.009) break
      const already = results.find((r) => r.loan_id === loan.id)
      const bal = already
        ? already.balance_after
        : round2(
            Number(
              loan.remaining_balance ??
                Math.max(0, loanTotalPayable(loan) - Number(loan.amount_paid || 0)),
            ),
          )
      if (bal <= 0.009) continue
      const pay = Math.min(bal, remaining)

      if (!already) {
        const applied = await applyLoanPayrollPayment({
          companyId: input.companyId,
          employeeId: input.employeeId,
          loanId: loan.id,
          amount: pay,
          payrollRunId: input.payrollRunId,
          payslipId: input.payslipId,
          payPeriod: input.payPeriod,
          paymentDate: input.paymentDate,
        })
        if (applied) {
          results.push(applied)
          remaining = round2(remaining - applied.amount)
        }
        continue
      }

      // Same run already recorded — top up loan + next pending schedule row
      const topUp = pay
      const { data: current } = await supabase
        .from("employee_loans")
        .select("amount_paid, remaining_balance, expected_total_payment, total_interest, principal")
        .eq("id", loan.id)
        .single()
      if (!current) continue

      const amountPaid = round2(Number(current.amount_paid || 0) + topUp)
      const totalPayable = loanTotalPayable(current)
      const balanceAfter = round2(Math.max(0, (totalPayable || Number(current.remaining_balance || 0) + topUp) - amountPaid))

      const { data: nextRow } = await supabase
        .from("loan_amortization_schedule")
        .select("id, payment_amount, paid_amount, month_number")
        .eq("loan_id", loan.id)
        .in("status", ["pending", "overdue"])
        .order("month_number", { ascending: true })
        .limit(1)
        .maybeSingle()

      if (nextRow?.id) {
        const due = Number(nextRow.payment_amount || topUp)
        const prevPaid = Number(nextRow.paid_amount || 0)
        const installmentPay = Math.min(topUp, Math.max(0, due - prevPaid))
        const newPaidAmount = round2(prevPaid + installmentPay)
        const fullyPaid = newPaidAmount + 0.009 >= due
        await supabase
          .from("loan_amortization_schedule")
          .update({
            paid_amount: newPaidAmount,
            paid_date: input.paymentDate || new Date().toISOString().split("T")[0],
            status: fullyPaid ? "paid" : "pending",
            payslip_id: input.payslipId ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", nextRow.id)
      }

      await supabase
        .from("employee_loans")
        .update({
          amount_paid: amountPaid,
          remaining_balance: balanceAfter,
          status: balanceAfter <= 0.009 ? "completed" : "active",
          last_payment_amount: round2(Number(already.amount) + topUp),
          updated_at: new Date().toISOString(),
        })
        .eq("id", loan.id)

      already.amount = round2(already.amount + topUp)
      already.balance_after = balanceAfter
      already.status = balanceAfter <= 0.009 ? "completed" : "active"
      remaining = round2(remaining - topUp)
    }
  }

  return results
}

/** Record a monthly payment against the amortization schedule (or loan balance directly). */
export async function recordLoanPayment(
  scheduleId: string,
  amount: number,
  payslipId?: string,
): Promise<void> {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]
  const payAmount = Number(amount)

  // Prefer treating as amortization schedule row id
  if (!scheduleId.startsWith("loan:")) {
    const { data: scheduleRow, error: re } = await supabase
      .from("loan_amortization_schedule")
      .update({
        paid_amount: payAmount,
        paid_date: today,
        status: "paid",
        payslip_id: payslipId ?? null,
      })
      .eq("id", scheduleId)
      .select("loan_id, principal_portion")
      .maybeSingle()

    if (!re && scheduleRow?.loan_id) {
      const { data: loan } = await supabase
        .from("employee_loans")
        .select(
          "id, company_id, employee_id, amount_paid, remaining_balance, principal, expected_total_payment, total_interest",
        )
        .eq("id", scheduleRow.loan_id)
        .single()

      if (loan) {
        await applyLoanPayrollPayment({
          companyId: loan.company_id,
          employeeId: loan.employee_id,
          loanId: loan.id,
          amount: payAmount,
          payslipId,
          paymentDate: today,
        })
      }
      return
    }
  }

  // Fallback: treat as loan id
  const loanId = scheduleId.replace(/^loan:/, "")
  const { data: loan, error: loanError } = await supabase
    .from("employee_loans")
    .select("id, company_id, employee_id, amount_paid, remaining_balance, principal")
    .eq("id", loanId)
    .single()

  if (loanError || !loan) throw new Error(loanError?.message || "Loan not found")

  await applyLoanPayrollPayment({
    companyId: loan.company_id,
    employeeId: loan.employee_id,
    loanId: loan.id,
    amount: payAmount,
    payslipId,
    paymentDate: today,
  })
}
