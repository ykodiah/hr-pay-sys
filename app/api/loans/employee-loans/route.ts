import { NextRequest, NextResponse } from "next/server"
import { createLoan } from "@/lib/services/loan-advanced-service"
import { createClient as createServiceClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const serverClient = await createServiceClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employee_id")
    const companyId = searchParams.get("company_id")

    if (!employeeId || !companyId) {
      return NextResponse.json({ error: "employee_id and company_id required" }, { status: 400 })
    }

    const { data, error } = await serverClient
      .from("employee_loans")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Get employee loans error:", error)
    return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const serverClient = await createServiceClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const result = await createLoan({
      companyId: body.company_id,
      employeeId: body.employee_id,
      loanTypeId: body.loan_type_id,
      principalAmount: body.principal_amount,
      tenureMonths: body.tenure_months,
      reason: body.reason,
      initiatedByRole: body.initiated_by_role || "employee",
      initiatedById: user.id,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Create loan error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create loan" },
      { status: 500 }
    )
  }
}
