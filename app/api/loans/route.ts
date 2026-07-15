import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createLoan, listLoans } from "@/lib/services/loan-service"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const employee_id = searchParams.get("employee_id") ?? undefined
    const company_id  = searchParams.get("company_id")  ?? undefined
    const status      = searchParams.get("status")      ?? undefined

    const loans = await listLoans({ company_id, employee_id, status: status as any })
    return NextResponse.json({ loans })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { employee_id, company_id, loan_type, purpose, principal, interest_rate, repayment_months, start_date, auto_deduct, notes } = body

    if (!employee_id || !company_id || !principal || !repayment_months) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const loan = await createLoan({
      employee_id, company_id, loan_type: loan_type ?? "Personal Loan",
      purpose, principal: Number(principal), interest_rate: Number(interest_rate ?? 0),
      repayment_months: Number(repayment_months), start_date, auto_deduct,
      notes, created_by: user.id,
    })

    return NextResponse.json({ loan }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
