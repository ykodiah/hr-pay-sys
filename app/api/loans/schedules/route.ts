import { NextRequest, NextResponse } from "next/server"
import { getEmployeeLoanSchedules, recordLoanPayment, getEmployeeLoanLedger } from "@/lib/services/loan-advanced-service"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employee_id")
    const loanId = searchParams.get("loan_id")

    if (!employeeId || !loanId) {
      return NextResponse.json({ error: "employee_id and loan_id required" }, { status: 400 })
    }

    const schedules = await getEmployeeLoanSchedules(employeeId, loanId)
    return NextResponse.json(schedules)
  } catch (error) {
    console.error("[v0] Get schedules error:", error)
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    if (body.action === "record_payment") {
      const schedule = await recordLoanPayment(
        body.schedule_id,
        body.paid_amount,
        body.payment_method,
        body.payment_reference
      )
      return NextResponse.json({ status: "success", schedule })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Record payment error:", error)
    return NextResponse.json({ error: error.message || "Failed to record payment" }, { status: 500 })
  }
}
