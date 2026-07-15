import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { calculateEmployeeTax } from "@/lib/ghana-tax/tax-config-service"
import type { EmployeePayInput } from "@/lib/ghana-tax/engine"

/**
 * POST /api/tax/calculate
 *
 * Body:
 *  {
 *    company_id: string
 *    employee_id: string
 *    tax_year?: number
 *    input: EmployeePayInput
 *  }
 *
 * Returns: TaxCalculationResult
 */
export async function POST(request: Request) {
  try {
    const client = await createClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { company_id, employee_id, tax_year, input } = body as {
      company_id: string
      employee_id: string
      tax_year?: number
      input: EmployeePayInput
    }

    if (!company_id || !employee_id || !input) {
      return NextResponse.json(
        { error: "Missing required fields: company_id, employee_id, input" },
        { status: 400 }
      )
    }

    if (!input.monthly_basic || input.monthly_basic < 0) {
      return NextResponse.json(
        { error: "monthly_basic must be a non-negative number" },
        { status: 400 }
      )
    }

    const result = await calculateEmployeeTax(
      input,
      company_id,
      employee_id,
      tax_year
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calculation failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
