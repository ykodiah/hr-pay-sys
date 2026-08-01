// Note: Don't create client at module level — resolve per call (demo + RLS aware).

async function getDb() {
  const { createServiceClient } = await import("@/lib/supabase/server")
  return createServiceClient()
}

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

const LOAN_TYPE_COLUMNS = [
  "code",
  "name",
  "description",
  "interest_type",
  "annual_interest_rate",
  "min_amount",
  "max_amount",
  "min_tenure_months",
  "max_tenure_months",
  "default_tenure_months",
  "processing_fee_type",
  "processing_fee_amount",
  "insurance_fee_type",
  "insurance_fee_amount",
  "admin_fee_type",
  "admin_fee_amount",
  "requires_approval",
  "auto_approve_max_amount",
  "approval_roles",
  "min_service_months",
  "min_monthly_salary",
  "max_loan_multiplier",
  "is_active",
] as const

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  )
}

function sanitizeLoanTypePayload(input: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const key of LOAN_TYPE_COLUMNS) {
    if (input[key] !== undefined) out[key] = input[key]
  }

  out.code = String(out.code || "")
    .trim()
    .toUpperCase()
  out.name = String(out.name || "").trim()
  if (!out.code) throw new Error("Loan code is required")
  if (!out.name) throw new Error("Loan name is required")

  const interestType = String(out.interest_type || "reducing_balance")
  if (!["fixed", "reducing_balance", "daily_compound"].includes(interestType)) {
    throw new Error("Invalid interest type")
  }
  out.interest_type = interestType

  const num = (v: unknown, fallback = 0) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }

  out.annual_interest_rate = num(out.annual_interest_rate, 0)
  out.min_amount = num(out.min_amount, 0)
  out.max_amount = num(out.max_amount, 1000000)
  out.min_tenure_months = Math.max(1, Math.floor(num(out.min_tenure_months, 3)))
  out.max_tenure_months = Math.max(out.min_tenure_months, Math.floor(num(out.max_tenure_months, 60)))
  out.default_tenure_months = Math.min(
    out.max_tenure_months,
    Math.max(out.min_tenure_months, Math.floor(num(out.default_tenure_months, 12))),
  )

  for (const fee of ["processing", "insurance", "admin"] as const) {
    const typeKey = `${fee}_fee_type`
    const amountKey = `${fee}_fee_amount`
    const feeType = out[typeKey] == null || out[typeKey] === "" ? "fixed" : String(out[typeKey])
    if (!["fixed", "percentage"].includes(feeType)) {
      throw new Error(`Invalid ${fee} fee type`)
    }
    out[typeKey] = feeType
    out[amountKey] = num(out[amountKey], 0)
  }

  out.requires_approval = out.requires_approval !== false
  out.auto_approve_max_amount = num(out.auto_approve_max_amount, 0)
  out.min_service_months = Math.max(0, Math.floor(num(out.min_service_months, 0)))
  out.min_monthly_salary = num(out.min_monthly_salary, 0)
  out.max_loan_multiplier = num(out.max_loan_multiplier, 3)
  out.is_active = out.is_active !== false
  out.approval_roles = Array.isArray(out.approval_roles)
    ? out.approval_roles
    : ["admin", "finance_manager"]
  out.description = out.description != null ? String(out.description) : null

  return out
}

function mapLoanTypeDbError(error: any): Error {
  const message = String(error?.message || "Failed to save loan type")
  if (/relation .*loan_types.* does not exist/i.test(message)) {
    return new Error(
      "loan_types table is missing. Run scripts/090_comprehensive_loan_module.sql and scripts/092_loan_types_hardening.sql",
    )
  }
  if (/duplicate key|unique/i.test(message)) {
    return new Error("A loan type with this code already exists for your company")
  }
  if (/foreign key|created_by/i.test(message)) {
    return new Error(
      "Could not save loan type (created_by constraint). Run scripts/092_loan_types_hardening.sql",
    )
  }
  return new Error(message)
}

export async function getLoanTypes(companyId: string): Promise<LoanType[]> {
  const supabase = await getDb()

  const { data, error } = await supabase
    .from("loan_types")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    if (/relation .*loan_types.* does not exist/i.test(error.message)) return []
    throw mapLoanTypeDbError(error)
  }
  return data || []
}

export async function getLoanTypeById(loanTypeId: string): Promise<LoanType | null> {
  const supabase = await getDb()

  const { data, error } = await supabase
    .from("loan_types")
    .select("*")
    .eq("id", loanTypeId)
    .maybeSingle()

  if (error) throw mapLoanTypeDbError(error)
  return data
}

export async function createLoanType(
  companyId: string,
  loanType: Omit<LoanType, "id" | "created_at" | "updated_at"> & { created_by?: string },
): Promise<LoanType> {
  const supabase = await getDb()
  const payload = sanitizeLoanTypePayload(loanType as any)

  // Enforce unique (company_id, code) even in demo memory-db
  const { data: existing } = await supabase
    .from("loan_types")
    .select("id")
    .eq("company_id", companyId)
    .eq("code", payload.code)
    .limit(1)
    .maybeSingle()
  if (existing?.id) {
    throw new Error("A loan type with this code already exists for your company")
  }

  const row: Record<string, any> = {
    ...payload,
    company_id: companyId,
    is_active: true,
    updated_at: new Date().toISOString(),
  }

  // Only persist created_by when it is a real UUID (avoids auth.users FK failures)
  if (isUuid((loanType as any).created_by)) {
    row.created_by = (loanType as any).created_by
  }

  const { data, error } = await supabase.from("loan_types").insert([row]).select().single()

  if (error) throw mapLoanTypeDbError(error)
  return data
}

export async function updateLoanType(id: string, updates: Partial<LoanType>): Promise<LoanType> {
  const supabase = await getDb()
  const existing = await getLoanTypeById(id)
  if (!existing) throw new Error("Loan type not found")

  const payload = sanitizeLoanTypePayload({ ...existing, ...updates } as any)

  const { data, error } = await supabase
    .from("loan_types")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw mapLoanTypeDbError(error)
  return data
}

export async function deleteLoanType(id: string): Promise<void> {
  const supabase = await getDb()
  // Soft-delete so existing loans keep a historical loan_type_id reference
  const { error } = await supabase
    .from("loan_types")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) throw mapLoanTypeDbError(error)
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
  const supabase = await getDb()

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

  // Determine approval status — use payroll-compatible status values
  // (pending | approved | active | completed | rejected | defaulted | cancelled)
  const requiresApproval =
    loanType.requires_approval !== false &&
    request.principalAmount > Number(loanType.auto_approve_max_amount || 0)
  const approvalStatus = requiresApproval ? "pending" : "approved"
  const status = requiresApproval ? "pending" : "active"
  const outstanding = request.principalAmount // principal-only outstanding for payroll deductions

  // Create loan (write both advanced + payroll columns for sync compatibility)
  const { data: loanData, error: loanError } = await supabase
    .from("employee_loans")
    .insert([
      {
        company_id: request.companyId,
        employee_id: request.employeeId,
        loan_type_id: request.loanTypeId,
        loan_type: loanType.name,
        purpose: request.reason ?? null,
        principal_amount: request.principalAmount,
        principal: request.principalAmount,
        tenure_months: request.tenureMonths,
        repayment_months: request.tenureMonths,
        interest_rate: loanType.annual_interest_rate,
        interest_type: loanType.interest_type,
        monthly_installment: calculation.monthlyPayment,
        monthly_payment: calculation.monthlyPayment,
        outstanding_balance: outstanding,
        remaining_balance: outstanding,
        amount_paid: 0,
        total_interest: calculation.totalInterest,
        processing_fee: processingFee,
        insurance_fee: insuranceFee,
        admin_fee: adminFee,
        total_charges: totalCharges,
        approval_status: approvalStatus,
        status,
        auto_deduct: true,
        initiated_by: request.initiatedById,
        initiated_by_role: request.initiatedByRole,
        created_by: request.initiatedById,
        approved_by: requiresApproval ? null : request.initiatedById,
        approved_at: requiresApproval ? null : new Date().toISOString(),
        disbursed_at: requiresApproval ? null : new Date().toISOString(),
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
  const supabase = await getDb()
  const { data, error } = await supabase
    .from("employee_loans")
    .update({
      approval_status: "approved",
      status: "active",
      approved_by: approvedById,
      approval_date: new Date().toISOString(),
      approved_at: new Date().toISOString(),
      disbursed_at: new Date().toISOString(),
      notes: approvalNotes,
    })
    .eq("id", loanId)
    .select()
    .single()

  if (error) throw error

  // Sync payroll-compatible fields when advanced schema columns are present
  if (data) {
    const sync: Record<string, unknown> = { status: "active" }
    if (data.monthly_installment != null) sync.monthly_payment = data.monthly_installment
    if (data.outstanding_balance != null) sync.remaining_balance = data.outstanding_balance
    else if (data.principal_amount != null) sync.remaining_balance = data.principal_amount
    if (data.principal_amount != null && data.principal == null) sync.principal = data.principal_amount
    if (data.tenure_months != null && data.repayment_months == null) sync.repayment_months = data.tenure_months
    await supabase.from("employee_loans").update(sync).eq("id", loanId)
  }

  return data
}

export async function rejectLoan(loanId: string, rejectedById: string, rejectionReason: string): Promise<EmployeeLoan> {
  const supabase = await getDb()
  const { data, error } = await supabase
    .from("employee_loans")
    .update({
      approval_status: "rejected",
      status: "rejected",
      rejected_by: rejectedById,
      rejected_at: new Date().toISOString(),
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
  const supabase = await getDb()

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
    .update({
      outstanding_balance: outstandingBalance,
      remaining_balance: outstandingBalance,
      amount_paid: Number(schedule.employee_loans?.amount_paid ?? 0) + paidAmount,
      status: outstandingBalance <= 0 ? "completed" : "active",
    })
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
  const supabase = await getDb()
  const { data, error } = await supabase
    .from("employee_loans")
    .select("*")
    .eq("employee_id", employeeId)
    .in("status", ["active", "disbursed", "approved"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getEmployeeLoanSchedules(employeeId: string, loanId: string): Promise<LoanSchedule[]> {
  const supabase = await getDb()
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
  const supabase = await getDb()
  const { data, error } = await supabase
    .from("loan_ledger")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("employee_loan_id", loanId)
    .order("transaction_date", { ascending: false })

  if (error) throw error
  return data || []
}
