import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

/**
 * GET: Fetch confirmation details for an employee
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const employeeId = new URL(req.url).searchParams.get("employee_id")

    if (!employeeId) {
      return NextResponse.json({ error: "employee_id required" }, { status: 400 })
    }

    // Fetch confirmation decision if exists
    const { data: decision } = await client
      .from("recruitment_confirmation_decisions")
      .select("*")
      .eq("employee_id", employeeId)
      .order("decision_date", { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      success: true,
      confirmation_decision: decision,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * POST: Record confirmation decision from review board
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const body = await req.json()

    let companyId = body.company_id
    if (!companyId) {
      companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId
    }
    if (!companyId) return NextResponse.json({ error: "company_id required" }, { status: 400 })

    const { employee_id, probation_review_id, confirmed, pay_decision, new_salary, notes } = body

    if (
      !employee_id ||
      probation_review_id === undefined ||
      confirmed === undefined ||
      pay_decision === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "employee_id, probation_review_id, confirmed, and pay_decision are required",
        },
        { status: 400 },
      )
    }

    // Verify employee exists and fetch probation info
    const { data: employee, error: empError } = await client
      .from("employees")
      .select("id, probation_start_date, probation_end_date")
      .eq("id", employee_id)
      .eq("company_id", companyId)
      .single()

    if (empError || !employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Calculate confirmation date (6 months from probation start)
    let confirmationDate: Date | null = null
    if (employee.probation_start_date) {
      confirmationDate = new Date(employee.probation_start_date)
      confirmationDate.setMonth(confirmationDate.getMonth() + 6)
    }

    // Create confirmation decision record
    const decisionData: Record<string, any> = {
      company_id: companyId,
      employee_id,
      probation_review_id,
      confirmed,
      pay_decision,
      decided_by: user.isDemo ? null : user.id,
      notes,
    }

    if (confirmed && pay_decision === "pay_increase" && new_salary) {
      decisionData.new_salary = new_salary
    }

    if (confirmationDate) {
      decisionData.confirmation_date = confirmationDate.toISOString().split("T")[0]
    }

    const { data: decision, error: decisionError } = await client
      .from("recruitment_confirmation_decisions")
      .insert(decisionData)
      .select()
      .single()

    if (decisionError) return NextResponse.json({ error: decisionError.message }, { status: 500 })

    // Update employee confirmation status
    const confirmationStatus = confirmed
      ? "confirmed"
      : "not_confirmed"

    const { error: updateError } = await client
      .from("employees")
      .update({
        confirmation_status: confirmationStatus,
        confirmation_decision_date: new Date().toISOString(),
      })
      .eq("id", employee_id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Update probation review status
    const { error: reviewError } = await client
      .from("recruitment_probation_reviews")
      .update({
        review_status: confirmed ? "confirmed" : "not_confirmed",
      })
      .eq("id", probation_review_id)

    // Ignore review update error

    return NextResponse.json(
      {
        success: true,
        decision,
        message: confirmed
          ? `Employee confirmed${pay_decision === "pay_increase" ? " with pay increase" : ""}`
          : "Employee not confirmed - termination proceedings initiated",
        notification_type: confirmed ? "confirmation_congratulations" : "termination_alert",
      },
      { status: 201 },
    )
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * PATCH: Update confirmation decision
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const body = await req.json()

    const { decision_id, confirmed, pay_decision, new_salary, notes } = body

    if (!decision_id) {
      return NextResponse.json({ error: "decision_id required" }, { status: 400 })
    }

    const patch: Record<string, any> = {}

    if (confirmed !== undefined) patch.confirmed = confirmed
    if (pay_decision) patch.pay_decision = pay_decision
    if (new_salary !== undefined) patch.new_salary = new_salary
    if (notes !== undefined) patch.notes = notes

    const { data, error } = await client
      .from("recruitment_confirmation_decisions")
      .update(patch)
      .eq("id", decision_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      decision: data,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
