import { NextRequest, NextResponse } from "next/server"
import {
  requirePortalSession,
  isPortalError,
  portalJsonError,
  logPortalActivity,
} from "@/lib/self-service/portal-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function monthlyInstalment(principal: number, annualRate: number, months: number, type: string) {
  if (months <= 0) return 0
  if (!annualRate) return principal / months
  if (String(type).toLowerCase() === "reducing") {
    const r = annualRate / 100 / 12
    if (r === 0) return principal / months
    return (principal * r) / (1 - Math.pow(1 + r, -months))
  }
  const totalInterest = principal * (annualRate / 100) * (months / 12)
  return (principal + totalInterest) / months
}

export async function GET() {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const [loansRes, typesRes, financialRes] = await Promise.all([
      session.db
        .from("employee_loans")
        .select("*")
        .eq("employee_id", session.employeeId)
        .eq("company_id", session.companyId)
        .order("created_at", { ascending: false })
        .limit(50),
      session.db
        .from("loan_types")
        .select(
          "id, code, name, description, interest_type, annual_interest_rate, min_amount, max_amount, min_tenure_months, max_tenure_months, default_tenure_months, max_loan_multiplier, min_service_months, is_active",
        )
        .eq("company_id", session.companyId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true, nullsFirst: false }),
      session.db
        .from("employee_financial")
        .select("monthly_salary")
        .eq("employee_id", session.employeeId)
        .maybeSingle(),
    ])

    const loans = loansRes.data || []
    const loanIds = loans.map((l: any) => l.id)
    let schedule: any[] = []
    if (loanIds.length) {
      const { data } = await session.db
        .from("loan_amortization_schedule")
        .select("*")
        .in("loan_id", loanIds)
        .order("month_number", { ascending: true })
      schedule = data || []
    }

    const outstanding = loans
      .filter((l: any) => ["active", "disbursed", "approved"].includes(String(l.status).toLowerCase()))
      .reduce((s: number, l: any) => s + Number(l.outstanding_balance ?? l.remaining_balance ?? 0), 0)

    return NextResponse.json({
      loans,
      schedule,
      loan_types: typesRes.data || [],
      monthly_salary: Number(financialRes.data?.monthly_salary || 0),
      summary: {
        total_outstanding: outstanding,
        active_count: loans.filter((l: any) =>
          ["active", "disbursed"].includes(String(l.status).toLowerCase()),
        ).length,
        pending_count: loans.filter((l: any) =>
          String(l.status).toLowerCase() === "pending",
        ).length,
      },
    })
  } catch (err) {
    return portalJsonError(err, "Failed to load loans")
  }
}

/** POST — employee applies for a loan. Always lands as pending for HR approval. */
export async function POST(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    const principal = Number(body.principal)
    const months = Number(body.tenure_months)

    if (!body.loan_type_id) {
      return NextResponse.json({ error: "Select a loan type" }, { status: 400 })
    }
    if (!Number.isFinite(principal) || principal <= 0) {
      return NextResponse.json({ error: "Enter a valid loan amount" }, { status: 400 })
    }
    if (!Number.isInteger(months) || months <= 0) {
      return NextResponse.json({ error: "Enter a valid repayment period in months" }, { status: 400 })
    }

    const { data: loanType } = await session.db
      .from("loan_types")
      .select("*")
      .eq("id", body.loan_type_id)
      .eq("company_id", session.companyId)
      .eq("is_active", true)
      .maybeSingle()

    if (!loanType) {
      return NextResponse.json({ error: "That loan type is not available" }, { status: 400 })
    }

    // Server-side policy enforcement — never trust client-side validation.
    if (loanType.min_amount && principal < Number(loanType.min_amount)) {
      return NextResponse.json(
        { error: `Minimum for ${loanType.name} is ${Number(loanType.min_amount).toLocaleString()}` },
        { status: 400 },
      )
    }
    if (loanType.max_amount && principal > Number(loanType.max_amount)) {
      return NextResponse.json(
        { error: `Maximum for ${loanType.name} is ${Number(loanType.max_amount).toLocaleString()}` },
        { status: 400 },
      )
    }
    if (loanType.min_tenure_months && months < Number(loanType.min_tenure_months)) {
      return NextResponse.json(
        { error: `Minimum tenure is ${loanType.min_tenure_months} months` },
        { status: 400 },
      )
    }
    if (loanType.max_tenure_months && months > Number(loanType.max_tenure_months)) {
      return NextResponse.json(
        { error: `Maximum tenure is ${loanType.max_tenure_months} months` },
        { status: 400 },
      )
    }

    const { data: financial } = await session.db
      .from("employee_financial")
      .select("monthly_salary")
      .eq("employee_id", session.employeeId)
      .maybeSingle()

    const salary = Number(financial?.monthly_salary || 0)
    if (loanType.max_loan_multiplier && salary > 0) {
      const cap = salary * Number(loanType.max_loan_multiplier)
      if (principal > cap) {
        return NextResponse.json(
          { error: `This loan is capped at ${Number(loanType.max_loan_multiplier)}x your monthly salary (${cap.toLocaleString()})` },
          { status: 400 },
        )
      }
    }

    const { data: openLoan } = await session.db
      .from("employee_loans")
      .select("id, status")
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .in("status", ["pending", "Pending"])
      .limit(1)

    if (openLoan && openLoan.length) {
      return NextResponse.json(
        { error: "You already have a loan application awaiting a decision" },
        { status: 409 },
      )
    }

    const rate = Number(loanType.annual_interest_rate || 0)
    const instalment = monthlyInstalment(principal, rate, months, loanType.interest_type || "flat")
    const totalPayable = instalment * months

    const { data, error } = await session.db
      .from("employee_loans")
      .insert({
        company_id: session.companyId,
        employee_id: session.employeeId,
        loan_type_id: loanType.id,
        loan_type: loanType.name,
        purpose: String(body.purpose || "").trim() || null,
        principal,
        principal_amount: principal,
        interest_rate: rate,
        interest_type: loanType.interest_type || "flat",
        repayment_months: months,
        tenure_months: months,
        monthly_payment: Number(instalment.toFixed(2)),
        monthly_installment: Number(instalment.toFixed(2)),
        expected_total_payment: Number(totalPayable.toFixed(2)),
        total_interest: Number((totalPayable - principal).toFixed(2)),
        outstanding_balance: principal,
        remaining_balance: principal,
        amount_paid: 0,
        status: "pending",
        approval_status: "pending",
        auto_deduct: true,
        initiated_by: session.user.id,
        initiated_by_role: "employee",
        created_by: session.user.id,
      })
      .select("*")
      .single()

    if (error) throw new Error(error.message)

    await logPortalActivity(session, "loan_application", `${loanType.name} ${principal}`, {
      loan_id: data.id,
    })

    await session.db.from("employee_notifications").insert({
      company_id: session.companyId,
      employee_id: session.employeeId,
      category: "loan",
      title: "Loan application submitted",
      message: `Your ${loanType.name} application for ${principal.toLocaleString()} is pending approval.`,
      severity: "info",
      action_url: "/self-service/loans",
    })

    return NextResponse.json({ success: true, loan: data })
  } catch (err) {
    return portalJsonError(err, "Failed to submit loan application")
  }
}

/** PATCH — withdraw a pending application. */
export async function PATCH(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    if (!body.id) return NextResponse.json({ error: "Loan id is required" }, { status: 400 })

    const { data: existing } = await session.db
      .from("employee_loans")
      .select("id, status")
      .eq("id", body.id)
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .maybeSingle()

    if (!existing) return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    if (String(existing.status).toLowerCase() !== "pending") {
      return NextResponse.json({ error: "Only pending applications can be withdrawn" }, { status: 400 })
    }

    const { data, error } = await session.db
      .from("employee_loans")
      .update({
        status: "withdrawn",
        approval_status: "withdrawn",
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("employee_id", session.employeeId)
      .select("*")
      .single()

    if (error) throw new Error(error.message)
    await logPortalActivity(session, "loan_withdraw", body.id)
    return NextResponse.json({ success: true, loan: data })
  } catch (err) {
    return portalJsonError(err, "Failed to withdraw application")
  }
}
