import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

/**
 * GET: Fetch list of staff/employees for interview tagging
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    let companyId = new URL(req.url).searchParams.get("company_id")
    if (!companyId) {
      companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId ?? null
    }
    if (!companyId) return NextResponse.json({ error: "company_id required" }, { status: 400 })

    // Fetch active employees from the company
    const { data: employees, error } = await client
      .from("employees")
      .select("id, first_name, last_name, department, position, email, phone")
      .eq("company_id", companyId)
      .eq("status", "active")
      .order("first_name", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const staffList = (employees ?? []).map((emp: any) => ({
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      department: emp.department,
      position: emp.position,
      email: emp.email,
      phone: emp.phone,
    }))

    return NextResponse.json({ success: true, staff: staffList })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * POST: Tag staff members to an interview and send notifications
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

    const { interview_id, staff_ids, interview_summary, notification_type } = body

    if (!interview_id || !staff_ids || !Array.isArray(staff_ids) || staff_ids.length === 0) {
      return NextResponse.json(
        { error: "interview_id, staff_ids (array), and interview_summary are required" },
        { status: 400 },
      )
    }

    // Fetch interview details for notifications
    const { data: interview, error: interviewError } = await client
      .from("recruitment_interviews")
      .select(
        `*, application:recruitment_applications(
          candidate:recruitment_candidates(candidate_name, email),
          job:recruitment_job_postings(title)
        )`,
      )
      .eq("id", interview_id)
      .eq("company_id", companyId)
      .single()

    if (interviewError || !interview)
      return NextResponse.json({ error: "Interview not found" }, { status: 404 })

    // Prepare staff tagging records
    const taggingRecords = staff_ids.map((staffId: string) => ({
      company_id: companyId,
      interview_id,
      staff_id: staffId,
      notification_type: notification_type || "all",
      email_status: "pending",
      sms_status: "pending",
      notification_status: "pending",
    }))

    // Insert staff tagging records
    const { data: taggedStaff, error: tagError } = await client
      .from("recruitment_interview_staff_tagging")
      .upsert(taggingRecords, { onConflict: "interview_id,staff_id" })
      .select()

    if (tagError) return NextResponse.json({ error: tagError.message }, { status: 500 })

    // Update interview with summary if provided
    if (interview_summary) {
      await client
        .from("recruitment_interviews")
        .update({ interview_summary })
        .eq("id", interview_id)
    }

    // Trigger notifications (in production, this would be a background job)
    // For now, just return success and prepare notification payload
    const application = Array.isArray(interview.application)
      ? interview.application[0]
      : interview.application
    const candidate = Array.isArray(application?.candidate)
      ? application?.candidate[0]
      : application?.candidate
    const job = Array.isArray(application?.job) ? application?.job[0] : application?.job

    const notificationPayload = {
      interview_id,
      interview_type: interview.interview_type,
      scheduled_at: interview.scheduled_at,
      location: interview.location,
      meeting_url: interview.meeting_url,
      candidate_name: candidate?.candidate_name,
      candidate_email: candidate?.email,
      job_title: job?.title,
      interview_summary,
      duration_minutes: interview.duration_minutes,
    }

    return NextResponse.json(
      {
        success: true,
        tagged_staff: taggedStaff,
        notification_payload: notificationPayload,
        message: `Successfully tagged ${staff_ids.length} staff member(s) to interview`,
      },
      { status: 201 },
    )
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * PATCH: Update notification status for tagged staff
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const body = await req.json()

    const { tagging_id, email_status, sms_status, notification_status, notification_sent_at } =
      body

    if (!tagging_id) {
      return NextResponse.json({ error: "tagging_id required" }, { status: 400 })
    }

    const patch: Record<string, any> = {}
    if (email_status) patch.email_status = email_status
    if (sms_status) patch.sms_status = sms_status
    if (notification_status) patch.notification_status = notification_status
    if (notification_sent_at) patch.notification_sent_at = notification_sent_at

    const { data, error } = await client
      .from("recruitment_interview_staff_tagging")
      .update(patch)
      .eq("id", tagging_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, updated: data })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
