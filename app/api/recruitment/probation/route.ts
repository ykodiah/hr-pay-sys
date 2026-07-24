import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

/**
 * GET: Fetch probation details for an employee
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

    const { data: employee, error: empError } = await client
      .from("employees")
      .select(
        `id, first_name, last_name, email, position, department, 
         probation_start_date, probation_end_date, probation_duration_months,
         confirmation_status`,
      )
      .eq("id", employeeId)
      .single()

    if (empError || !employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Fetch associated probation review if exists
    const { data: review } = await client
      .from("recruitment_probation_reviews")
      .select("*")
      .eq("employee_id", employeeId)
      .single()

    return NextResponse.json({
      success: true,
      employee,
      probation_review: review,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * POST: Initialize probation for a new hire
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

    const { employee_id, hire_date, duration_months = 6 } = body

    if (!employee_id || !hire_date) {
      return NextResponse.json({ error: "employee_id and hire_date are required" }, { status: 400 })
    }

    // Verify employee exists
    const { data: employee, error: empError } = await client
      .from("employees")
      .select("id")
      .eq("id", employee_id)
      .eq("company_id", companyId)
      .single()

    if (empError || !employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Calculate probation end date
    const startDate = new Date(hire_date)
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + duration_months)

    // Update employee with probation dates
    const { error: updateError } = await client
      .from("employees")
      .update({
        probation_start_date: startDate.toISOString().split("T")[0],
        probation_end_date: endDate.toISOString().split("T")[0],
        probation_duration_months: duration_months,
        confirmation_status: "pending",
      })
      .eq("id", employee_id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Create probation review record
    const { data: review, error: reviewError } = await client
      .from("recruitment_probation_reviews")
      .insert({
        company_id: companyId,
        employee_id,
        probation_start_date: startDate.toISOString().split("T")[0],
        probation_end_date: endDate.toISOString().split("T")[0],
        review_status: "pending",
      })
      .select()
      .single()

    if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 })

    // Schedule notification for 3 weeks before probation end
    const notificationDate = new Date(endDate)
    notificationDate.setDate(notificationDate.getDate() - 21)

    const { error: notifError } = await client
      .from("recruitment_probation_notifications")
      .insert({
        company_id: companyId,
        employee_id,
        probation_review_id: review.id,
        notification_type: "hr_priority_alert",
        scheduled_for: notificationDate.toISOString(),
        status: "pending",
      })

    // Ignore notification error, continue

    return NextResponse.json(
      {
        success: true,
        probation_review: review,
        message: `Probation initialized for ${duration_months} months until ${endDate.toDateString()}`,
      },
      { status: 201 },
    )
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * PATCH: Update probation status or initiate review board
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const body = await req.json()

    const { probation_review_id, action } = body

    if (!probation_review_id || !action) {
      return NextResponse.json(
        { error: "probation_review_id and action are required" },
        { status: 400 },
      )
    }

    if (action === "initiate_review_board") {
      // Update review status to indicate board has been opened
      const { error } = await client
        .from("recruitment_probation_reviews")
        .update({
          review_board_initiated_at: new Date().toISOString(),
          review_status: "under_review",
        })
        .eq("id", probation_review_id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      return NextResponse.json({
        success: true,
        message: "Review board initiated",
      })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
