import { createClient } from "@/lib/supabase/server"
import { buildAmortizationPreview, calcMonthlyPayment } from "@/lib/services/loan-calculations"

export { calcMonthlyPayment, buildAmortizationPreview } from "@/lib/services/loan-calculations"
export type { AmortizationPreviewRow } from "@/lib/services/loan-calculations"

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
  purpose: string | null
  principal: number
  interest_rate: number
  repayment_months: number
  monthly_payment: number
  amount_paid: number
  remaining_balance: number
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
  repayment_months: number
  start_date?: string
  auto_deduct?: boolean
  notes?: string
  created_by?: string
  /** When true (admin create), activate immediately so payroll can deduct. */
  activate?: boolean
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
      employee_name: emp ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() : null,
      employee_id_no: emp?.employee_id ?? null,
      department: emp?.department ?? null,
    } as EmployeeLoan
  })
}

async function persistAmortizationSchedule(loan: {
  id: string
  principal: number
  interest_rate: number
  repayment_months: number
  start_date: string | null
}): Promise<void> {
  const supabase = await createClient()
  const startDate = loan.start_date ?? new Date().toISOString().split("T")[0]
  const preview = buildAmortizationPreview(
    Number(loan.principal),
    Number(loan.interest_rate ?? 0),
    Number(loan.repayment_months),
    startDate,
  )

  const rows = preview.map((row) => ({
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

  // Prefer loan_amortization_schedule (legacy service name); fall back to loan_schedules shape.
  const { error } = await supabase.from("loan_amortization_schedule").insert(rows)
  if (!error) return

  // Soft-fail when schedule table is missing — loan itself is still usable for payroll.
  console.warn("[loans] Could not persist amortization schedule:", error.message)
}

/** Create a new loan application (and optionally activate for payroll deduction). */
export async function createLoan(input: CreateLoanInput): Promise<EmployeeLoan> {
  const supabase = await createClient()

  const monthly_payment = calcMonthlyPayment(
    input.principal,
    input.interest_rate ?? 0,
    input.repayment_months,
  )

  const startDate = input.start_date ?? new Date().toISOString().split("T")[0]
  const endDate = new Date(
    new Date(startDate).setMonth(new Date(startDate).getMonth() + input.repayment_months),
  )
    .toISOString()
    .split("T")[0]

  const activate = Boolean(input.activate)
  const now = new Date().toISOString()

  const insertRow: Record<string, unknown> = {
    company_id: input.company_id,
    employee_id: input.employee_id,
    loan_type: input.loan_type,
    purpose: input.purpose ?? null,
    principal: input.principal,
    interest_rate: input.interest_rate ?? 0,
    repayment_months: input.repayment_months,
    monthly_payment,
    remaining_balance: input.principal,
    amount_paid: 0,
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
    await persistAmortizationSchedule(data)
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

  let schedule: AmortizationRow[] = []
  const { data: scheduleRows, error: se } = await supabase
    .from("loan_amortization_schedule")
    .select("*")
    .eq("loan_id", loanId)
    .order("month_number")

  if (!se && scheduleRows?.length) {
    schedule = scheduleRows as AmortizationRow[]
  } else {
    // Fallback preview when schedule table is empty/missing
    const startDate = loan.start_date ?? new Date().toISOString().split("T")[0]
    schedule = buildAmortizationPreview(
      Number(loan.principal),
      Number(loan.interest_rate ?? 0),
      Number(loan.repayment_months || 1),
      startDate,
    ).map((row, idx) => ({
      id: `preview-${loanId}-${idx + 1}`,
      loan_id: loanId,
      month_number: row.month_number,
      due_date: row.due_date,
      payment_amount: row.payment_amount,
      principal_portion: row.principal_portion,
      interest_portion: row.interest_portion,
      balance_remaining: row.balance_remaining,
      paid_amount: 0,
      paid_date: null,
      status: "pending" as const,
      payslip_id: null,
    }))
  }

  return { loan: loanMapped, schedule }
}

/** Approve a loan: set status → active, generate amortization schedule. */
export async function approveLoan(loanId: string, approverId: string): Promise<void> {
  const supabase = await createClient()

  const { data: loan, error: fetchError } = await supabase
    .from("employee_loans")
    .select("id, principal, interest_rate, repayment_months, start_date, status")
    .eq("id", loanId)
    .single()

  if (fetchError) throw new Error(fetchError.message)
  if (!loan) throw new Error("Loan not found")
  if (!["pending", "approved"].includes(loan.status)) {
    throw new Error(`Cannot approve loan in status "${loan.status}"`)
  }

  const { error } = await supabase
    .from("employee_loans")
    .update({
      status: "active",
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      disbursed_at: new Date().toISOString(),
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

/** Record a monthly payment against the amortization schedule (or loan balance directly). */
export async function recordLoanPayment(
  scheduleId: string,
  amount: number,
  payslipId?: string,
): Promise<void> {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  // Direct loan balance payment when schedule id is actually a loan id (admin shortcut)
  if (scheduleId.startsWith("loan:") || scheduleId.length > 0) {
    const { data: scheduleRow, error: re } = await supabase
      .from("loan_amortization_schedule")
      .update({
        paid_amount: amount,
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
        .select("amount_paid, remaining_balance, principal")
        .eq("id", scheduleRow.loan_id)
        .single()

      if (loan) {
        const newPaid = (loan.amount_paid ?? 0) + amount
        const newBalance = Math.max(
          0,
          (loan.remaining_balance ?? loan.principal) - (scheduleRow.principal_portion ?? amount),
        )

        await supabase
          .from("employee_loans")
          .update({
            amount_paid: newPaid,
            remaining_balance: newBalance,
            status: newBalance <= 0 ? "completed" : "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", scheduleRow.loan_id)
      }
      return
    }
  }

  // Fallback: treat scheduleId as loan_id and post a direct payment
  const loanId = scheduleId.replace(/^loan:/, "")
  const { data: loan, error: loanError } = await supabase
    .from("employee_loans")
    .select("id, amount_paid, remaining_balance, principal")
    .eq("id", loanId)
    .single()

  if (loanError || !loan) throw new Error(loanError?.message || "Loan not found")

  const newPaid = Number(loan.amount_paid ?? 0) + amount
  const newBalance = Math.max(0, Number(loan.remaining_balance ?? loan.principal) - amount)

  const { error: updateError } = await supabase
    .from("employee_loans")
    .update({
      amount_paid: newPaid,
      remaining_balance: newBalance,
      status: newBalance <= 0 ? "completed" : "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", loanId)

  if (updateError) throw new Error(updateError.message)
}
