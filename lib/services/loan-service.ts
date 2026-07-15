import { createClient } from "@/lib/supabase/server"

export type LoanStatus = "pending" | "approved" | "active" | "completed" | "rejected" | "defaulted" | "cancelled"

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
  employee_name?: string
  employee_id_no?: string
  department?: string
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
  purpose?: string
  principal: number
  interest_rate?: number
  repayment_months: number
  start_date?: string
  auto_deduct?: boolean
  notes?: string
  created_by?: string
}

/** Calculate monthly payment using reducing-balance (PMT formula). */
export function calcMonthlyPayment(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return Math.round((principal / months) * 100) / 100
  const r = annualRate / 100 / 12
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1) * 100) / 100
}

/** Generate a client-side amortization preview (no DB write). */
export function buildAmortizationPreview(
  principal: number,
  annualRate: number,
  months: number,
  startDate: string,
): Omit<AmortizationRow, "id" | "loan_id" | "paid_amount" | "paid_date" | "status" | "payslip_id">[] {
  const monthlyRate = annualRate / 100 / 12
  const payment = calcMonthlyPayment(principal, annualRate, months)
  let balance = principal
  const rows = []
  let due = new Date(startDate)

  for (let i = 1; i <= months; i++) {
    const interest = Math.round(balance * monthlyRate * 100) / 100
    let principalPortion = Math.round((payment - interest) * 100) / 100
    let actualPayment = payment

    if (i === months) {
      principalPortion = balance
      actualPayment = balance + interest
    }

    balance = Math.max(0, Math.round((balance - principalPortion) * 100) / 100)

    rows.push({
      month_number: i,
      due_date: due.toISOString().split("T")[0],
      payment_amount: Math.round(actualPayment * 100) / 100,
      principal_portion: principalPortion,
      interest_portion: interest,
      balance_remaining: balance,
    })

    due = new Date(due.getFullYear(), due.getMonth() + 1, due.getDate())
  }

  return rows
}

/** Create a new loan application and generate its amortization schedule. */
export async function createLoan(input: CreateLoanInput): Promise<EmployeeLoan> {
  const supabase = await createClient()

  const monthly_payment = calcMonthlyPayment(
    input.principal,
    input.interest_rate ?? 0,
    input.repayment_months,
  )

  const startDate = input.start_date ?? new Date().toISOString().split("T")[0]
  const endDate = new Date(
    new Date(startDate).setMonth(new Date(startDate).getMonth() + input.repayment_months)
  ).toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("employee_loans")
    .insert({
      company_id:       input.company_id,
      employee_id:      input.employee_id,
      loan_type:        input.loan_type,
      purpose:          input.purpose ?? null,
      principal:        input.principal,
      interest_rate:    input.interest_rate ?? 0,
      repayment_months: input.repayment_months,
      monthly_payment,
      remaining_balance: input.principal,
      amount_paid:      0,
      start_date:       startDate,
      end_date:         endDate,
      auto_deduct:      input.auto_deduct ?? true,
      notes:            input.notes ?? null,
      created_by:       input.created_by ?? null,
      status:           "pending",
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as EmployeeLoan
}

/** List loans for a company (HR view) or employee (self-service). */
export async function listLoans(options: {
  company_id?: string
  employee_id?: string
  status?: LoanStatus
}): Promise<EmployeeLoan[]> {
  const supabase = await createClient()

  let query = supabase
    .from("employee_loans")
    .select(`
      *,
      employees!employee_loans_employee_id_fkey(
        first_name, last_name, employee_id, department
      )
    `)
    .order("created_at", { ascending: false })

  if (options.company_id) query = query.eq("company_id", options.company_id)
  if (options.employee_id) query = query.eq("employee_id", options.employee_id)
  if (options.status)      query = query.eq("status", options.status)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data ?? []).map((row: any) => ({
    ...row,
    employee_name: row.employees
      ? `${row.employees.first_name} ${row.employees.last_name}`
      : null,
    employee_id_no: row.employees?.employee_id ?? null,
    department:     row.employees?.department  ?? null,
  }))
}

/** Get a single loan with its amortization schedule. */
export async function getLoanWithSchedule(loanId: string): Promise<{
  loan: EmployeeLoan
  schedule: AmortizationRow[]
}> {
  const supabase = await createClient()

  const { data: loan, error: le } = await supabase
    .from("employee_loans")
    .select(`*, employees!employee_loans_employee_id_fkey(first_name,last_name,employee_id,department)`)
    .eq("id", loanId)
    .single()

  if (le) throw new Error(le.message)

  const { data: schedule, error: se } = await supabase
    .from("loan_amortization_schedule")
    .select("*")
    .eq("loan_id", loanId)
    .order("month_number")

  if (se) throw new Error(se.message)

  const loanMapped: EmployeeLoan = {
    ...loan,
    employee_name: loan.employees
      ? `${loan.employees.first_name} ${loan.employees.last_name}`
      : null,
    employee_id_no: loan.employees?.employee_id ?? null,
    department:     loan.employees?.department  ?? null,
  }

  return { loan: loanMapped, schedule: (schedule ?? []) as AmortizationRow[] }
}

/** Approve a loan: set status → active, generate amortization schedule. */
export async function approveLoan(loanId: string, approverId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("employee_loans")
    .update({
      status:      "active",
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      disbursed_at: new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    })
    .eq("id", loanId)

  if (error) throw new Error(error.message)

  // Generate amortization schedule via DB function
  const { error: fnError } = await supabase.rpc("generate_amortization_schedule", { p_loan_id: loanId })
  if (fnError) throw new Error(fnError.message)
}

/** Reject a loan application. */
export async function rejectLoan(loanId: string, rejectorId: string, reason: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("employee_loans")
    .update({
      status:           "rejected",
      rejected_by:      rejectorId,
      rejected_at:      new Date().toISOString(),
      rejection_reason: reason,
      updated_at:       new Date().toISOString(),
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

/** Record a monthly payment against the amortization schedule. */
export async function recordLoanPayment(
  scheduleId: string,
  amount: number,
  payslipId?: string,
): Promise<void> {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const { data: row, error: re } = await supabase
    .from("loan_amortization_schedule")
    .update({
      paid_amount: amount,
      paid_date:   today,
      status:      "paid",
      payslip_id:  payslipId ?? null,
    })
    .eq("id", scheduleId)
    .select("loan_id, principal_portion")
    .single()

  if (re) throw new Error(re.message)

  // Update loan amount_paid and remaining_balance
  const { data: loan } = await supabase
    .from("employee_loans")
    .select("amount_paid, remaining_balance, principal")
    .eq("id", row.loan_id)
    .single()

  if (loan) {
    const newPaid    = (loan.amount_paid    ?? 0) + amount
    const newBalance = Math.max(0, (loan.remaining_balance ?? loan.principal) - (row.principal_portion ?? amount))

    await supabase
      .from("employee_loans")
      .update({
        amount_paid:       newPaid,
        remaining_balance: newBalance,
        status:            newBalance <= 0 ? "completed" : "active",
        updated_at:        new Date().toISOString(),
      })
      .eq("id", row.loan_id)
  }
}
