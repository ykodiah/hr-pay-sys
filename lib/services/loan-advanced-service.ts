import type { Database } from "@/types/supabase"

// Note: Don't create client at module level, create it in each function
// This avoids issues with Next.js build-time evaluation

// ============================================================================
// TYPES
// ============================================================================

export interface LoanType {
  id: string
  company_id: string
  code: string
  name: string
  description?: string
  interest_type: "fixed" | "reducing_balance" | "daily_compound"
  annual_interest_rate: number
  min_amount: number
  max_amount: number
  min_tenure_months: number
  max_tenure_months: number
  default_tenure_months: number
  processing_fee_type?: "fixed" | "percentage"
  processing_fee_amount: number
  insurance_fee_type?: "fixed" | "percentage"
  insurance_fee_amount: number
  admin_fee_type?: "fixed" | "percentage"
  admin_fee_amount: number
  requires_approval: boolean
  auto_approve_max_amount: number
  approval_roles: string[]
  min_service_months: number
  min_monthly_salary: number
  max_loan_multiplier: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmployeeLoan {
  id: string
  company_id: string
  employee_id: string
  loan_type_id: string
  principal_amount: number
  tenure_months: number
  interest_rate: number
  interest_type: string
  monthly_installment: number
  outstanding_balance: number
  total_interest: number
  total_charges: number
  approval_status: "pending" | "approved" | "rejected" | "cancelled"
  status: "draft" | "pending_approval" | "approved" | "disbursed" | "active" | "completed" | "defaulted" | "cancelled"
  disbursement_date?: string
  first_payment_date?: string
  final_payment_date?: string
  initiated_by_role: "employee" | "admin"
  created_at: string
  updated_at: string
}

export interface LoanSchedule {
  id: string
  employee_loan_id: string
  payment_number: number
  due_date: string
  principal_amount: number
  interest_amount: number
  total_payment: number
  paid_amount: number
  payment_status: "pending" | "partially_paid" | "paid" | "overdue" | "waived"
  payment_date?: string
  remaining_principal: number
  remaining_total: number
}

// ============================================================================
// LOAN TYPE SERVICES
// ============================================================================

export async function getLoanTypes(companyId: string): Promise<LoanType[]> {
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )

  const { data, error } = await supabase
    .from("loan_types")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getLoanTypeById(loanTypeId: string): Promise<LoanType | null> {
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )

  const { data, error } = await supabase
    .from("loan_types")
    .select("*")
    .eq("id", loanTypeId)
    .single()

  if (error) throw error
  return data
}

export async function createLoanType(companyId: string, loanType: Omit<LoanType, "id" | "created_at" | "updated_at">): Promise<LoanType> {
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )

  const { data, error } = await supabase
    .from("loan_types")
    .insert([{ company_id: companyId, ...loanType }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLoanType(id: string, updates: Partial<LoanType>): Promise<LoanType> {
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )

  const { data, error } = await supabase
    .from("loan_types")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// LOAN CALCULATIONS - Multiple Interest Methods
// ============================================================================

export interface AmortizationCalculation {
  monthlyPayment: number
  totalInterest: number
  schedule: Array<{
    month: number
    principal: number
    interest: number
    balance: number
  }>
}

/**
 * Calculate fixed interest amortization
 * Interest is calculated on original principal only
 */
export function calculateFixedInterest(
  principal: number,
  annualRate: number,
  months: number
): AmortizationCalculation {
  const monthlyRate = annualRate / 100 / 12
  const totalInterest = principal * monthlyRate * months
  const monthlyPayment = (principal + totalInterest) / months

  const schedule = []
  let remainingBalance = principal

  for (let month = 1; month <= months; month++) {
    const interestPayment = (principal * monthlyRate * months) / months // Fixed
    const principalPayment = principal / months
    remainingBalance -= principalPayment

    schedule.push({
      month,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      balance: Math.round(Math.max(0, remainingBalance) * 100) / 100,
    })
  }

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    schedule,
  }
}

/**
 * Calculate reducing balance interest (standard amortization)
 * Interest is calculated on remaining balance each month
 */
export function calculateReducingBalance(
  principal: number,
  annualRate: number,
  months: number
): AmortizationCalculation {
  const monthlyRate = annualRate / 100 / 12
  
  // Calculate monthly payment using amortization formula
  const monthlyPayment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
    (Math.pow(1 + monthlyRate, months) - 1)

  const schedule = []
  let remainingBalance = principal
  let totalInterest = 0

  for (let month = 1; month <= months; month++) {
    const interestPayment = remainingBalance * monthlyRate
    const principalPayment = monthlyPayment - interestPayment
    remainingBalance -= principalPayment
    totalInterest += interestPayment

    schedule.push({
      month,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      balance: Math.round(Math.max(0, remainingBalance) * 100) / 100,
    })
  }

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    schedule,
  }
}

/**
 * Calculate daily compound interest
 * Interest compounds daily
 */
export function calculateDailyCompound(
  principal: number,
  annualRate: number,
  months: number
): AmortizationCalculation {
  const dailyRate = annualRate / 100 / 365
  const daysInTenure = months * 30 // Approximate
  
  // Simple daily compound calculation
  let balance = principal
  const monthlyPayment = principal / months
  
  const schedule = []
  let totalInterest = 0

  for (let month = 1; month <= months; month++) {
    const daysInMonth = 30
    let monthlyInterest = 0

    for (let day = 0; day < daysInMonth; day++) {
      monthlyInterest += balance * dailyRate
      balance -= monthlyPayment / daysInMonth
    }

    totalInterest += monthlyInterest
    const finalBalance = Math.max(0, balance)

    schedule.push({
      month,
      principal: Math.round(monthlyPayment * 100) / 100,
      interest: Math.round(monthlyInterest * 100) / 100,
      balance: Math.round(finalBalance * 100) / 100,
    })
  }

  return {
    monthlyPayment: Math.round((principal + totalInterest) / months * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    schedule,
  }
}

// ============================================================================
// LOAN CREATION WITH APPROVAL WORKFLOW
// ============================================================================

export interface CreateLoanRequest {
  companyId: string
  employeeId: string
  loanTypeId: string
  principalAmount: number
  tenureMonths: number
  reason?: string
  initiatedByRole: "employee" | "admin"
  initiatedById: string
}

export async function createLoan(request: CreateLoanRequest): Promise<{ loan: EmployeeLoan; schedules: LoanSchedule[] }> {
  // Get loan type
  const loanType = await getLoanTypeById(request.loanTypeId)
  if (!loanType) throw new Error("Loan type not found")

  // Validate amount
  if (request.principalAmount < loanType.min_amount || request.principalAmount > loanType.max_amount) {
    throw new Error(`Loan amount must be between ${loanType.min_amount} and ${loanType.max_amount}`)
  }

  // Validate tenure
  if (request.tenureMonths < loanType.min_tenure_months || request.tenureMonths > loanType.max_tenure_months) {
    throw new Error(`Tenure must be between ${loanType.min_tenure_months} and ${loanType.max_tenure_months} months`)
  }

  // Calculate interest and charges
  let calculation: AmortizationCalculation
  switch (loanType.interest_type) {
    case "fixed":
      calculation = calculateFixedInterest(request.principalAmount, loanType.annual_interest_rate, request.tenureMonths)
      break
    case "reducing_balance":
      calculation = calculateReducingBalance(request.principalAmount, loanType.annual_interest_rate, request.tenureMonths)
      break
    case "daily_compound":
      calculation = calculateDailyCompound(request.principalAmount, loanType.annual_interest_rate, request.tenureMonths)
      break
    default:
      throw new Error("Invalid interest type")
  }

  // Calculate fees
  const processingFee =
    loanType.processing_fee_type === "percentage"
      ? (request.principalAmount * loanType.processing_fee_amount) / 100
      : loanType.processing_fee_amount

  const insuranceFee =
    loanType.insurance_fee_type === "percentage"
      ? (request.principalAmount * loanType.insurance_fee_amount) / 100
      : loanType.insurance_fee_amount

  const adminFee =
    loanType.admin_fee_type === "percentage"
      ? (request.principalAmount * loanType.admin_fee_amount) / 100
      : loanType.admin_fee_amount

  const totalCharges = processingFee + insuranceFee + adminFee

  // Determine approval status
  const requiresApproval = request.principalAmount > loanType.auto_approve_max_amount
  const approvalStatus = requiresApproval ? "pending" : "approved"
  const status = requiresApproval ? "pending_approval" : "approved"

  // Create loan
  const { data: loanData, error: loanError } = await supabase
    .from("employee_loans")
    .insert([
      {
        company_id: request.companyId,
        employee_id: request.employeeId,
        loan_type_id: request.loanTypeId,
        principal_amount: request.principalAmount,
        tenure_months: request.tenureMonths,
        interest_rate: loanType.annual_interest_rate,
        interest_type: loanType.interest_type,
        monthly_installment: calculation.monthlyPayment,
        outstanding_balance: request.principalAmount + calculation.totalInterest,
        total_interest: calculation.totalInterest,
        processing_fee: processingFee,
        insurance_fee: insuranceFee,
        admin_fee: adminFee,
        total_charges: totalCharges,
        approval_status: approvalStatus,
        status,
        initiated_by: request.initiatedById,
        initiated_by_role: request.initiatedByRole,
        created_by: request.initiatedById,
      },
    ])
    .select()
    .single()

  if (loanError) throw loanError

  // Create payment schedules
  const today = new Date()
  const schedules = calculation.schedule.map((item, idx) => {
    const dueDate = new Date(today)
    dueDate.setMonth(dueDate.getMonth() + item.month)

    return {
      company_id: request.companyId,
      employee_loan_id: loanData.id,
      employee_id: request.employeeId,
      payment_number: item.month,
      due_date: dueDate.toISOString().split("T")[0],
      principal_amount: item.principal,
      interest_amount: item.interest,
      total_payment: item.principal + item.interest,
      remaining_principal: item.balance,
      remaining_total: item.balance,
      payment_status: "pending",
    }
  })

  const { data: schedulesData, error: schedulesError } = await supabase
    .from("loan_schedules")
    .insert(schedules)
    .select()

  if (schedulesError) throw schedulesError

  // Record in ledger
  await supabase.from("loan_ledger").insert([
    {
      company_id: request.companyId,
      employee_loan_id: loanData.id,
      employee_id: request.employeeId,
      transaction_type: "disbursement",
      transaction_date: today.toISOString().split("T")[0],
      description: `Loan disbursement for ${loanType.name}`,
      principal_amount: request.principalAmount,
      total_amount: request.principalAmount,
      outstanding_balance_before: 0,
      outstanding_balance_after: request.principalAmount + calculation.totalInterest,
      created_by: request.initiatedById,
    },
  ])

  return {
    loan: loanData,
    schedules: schedulesData || [],
  }
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

export async function approveLoan(loanId: string, approvedById: string, approvalNotes?: string): Promise<EmployeeLoan> {
  const { data, error } = await supabase
    .from("employee_loans")
    .update({
      approval_status: "approved",
      status: "approved",
      approved_by: approvedById,
      approval_date: new Date().toISOString(),
      notes: approvalNotes,
    })
    .eq("id", loanId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function rejectLoan(loanId: string, rejectedById: string, rejectionReason: string): Promise<EmployeeLoan> {
  const { data, error } = await supabase
    .from("employee_loans")
    .update({
      approval_status: "rejected",
      status: "cancelled",
      rejection_reason: rejectionReason,
    })
    .eq("id", loanId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// PAYMENT RECORDING
// ============================================================================

export async function recordLoanPayment(
  scheduleId: string,
  paidAmount: number,
  paymentMethod: string,
  paymentReference?: string
): Promise<LoanSchedule> {
  // Get schedule
  const { data: schedule, error: scheduleError } = await supabase
    .from("loan_schedules")
    .select("*, employee_loans(*)")
    .eq("id", scheduleId)
    .single()

  if (scheduleError) throw scheduleError

  const newPaidAmount = (schedule.paid_amount || 0) + paidAmount
  const paymentStatus = newPaidAmount >= schedule.total_payment ? "paid" : "partially_paid"

  // Update schedule
  const { data: updatedSchedule, error: updateError } = await supabase
    .from("loan_schedules")
    .update({
      paid_amount: newPaidAmount,
      payment_status: paymentStatus,
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: paymentMethod,
      payment_reference: paymentReference,
    })
    .eq("id", scheduleId)
    .select()
    .single()

  if (updateError) throw updateError

  // Update loan outstanding balance
  const { data: allSchedules } = await supabase
    .from("loan_schedules")
    .select("remaining_principal")
    .eq("employee_loan_id", schedule.employee_loan_id)

  const outstandingBalance = allSchedules?.reduce((sum: number, s: any) => sum + s.remaining_principal, 0) || 0

  await supabase
    .from("employee_loans")
    .update({ outstanding_balance: outstandingBalance })
    .eq("id", schedule.employee_loan_id)

  // Record in ledger
  await supabase.from("loan_ledger").insert([
    {
      company_id: schedule.company_id,
      employee_loan_id: schedule.employee_loan_id,
      employee_id: schedule.employee_id,
      transaction_type: "payment",
      transaction_date: new Date().toISOString().split("T")[0],
      description: `Payment for loan schedule #${schedule.payment_number}`,
      principal_amount: schedule.principal_amount <= paidAmount ? schedule.principal_amount : paidAmount,
      total_amount: paidAmount,
      outstanding_balance_before: schedule.employee_loans.outstanding_balance,
      outstanding_balance_after: outstandingBalance,
      reference_id: scheduleId,
      payment_method: paymentMethod,
    },
  ])

  return updatedSchedule
}

// ============================================================================
// LOAN QUERIES
// ============================================================================

export async function getEmployeeActiveLoan(employeeId: string): Promise<EmployeeLoan | null> {
  const { data, error } = await supabase
    .from("employee_loans")
    .select("*")
    .eq("employee_id", employeeId)
    .in("status", ["active", "disbursed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error && error.code === "PGRST116") return null
  if (error) throw error
  return data
}

export async function getEmployeeLoanSchedules(employeeId: string, loanId: string): Promise<LoanSchedule[]> {
  const { data, error } = await supabase
    .from("loan_schedules")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("employee_loan_id", loanId)
    .order("payment_number", { ascending: true })

  if (error) throw error
  return data || []
}

export async function getEmployeeLoanLedger(employeeId: string, loanId: string) {
  const { data, error } = await supabase
    .from("loan_ledger")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("employee_loan_id", loanId)
    .order("transaction_date", { ascending: false })

  if (error) throw error
  return data || []
}
