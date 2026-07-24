import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { sendInterviewResultEmail } from "@/lib/recruitment/interview-result-email"

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const body = await req.json()
    const { interview_id } = body

    if (!interview_id) {
      return NextResponse.json({ error: "interview_id is required" }, { status: 400 })
    }

    let companyId = body.company_id
    if (!companyId) {
      companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId
    }
    if (!companyId) return NextResponse.json({ error: "company_id required" }, { status: 400 })

    // Fetch interview with application + candidate + job details
    const { data: interview, error: iError } = await client
      .from("recruitment_interviews")
      .select(`
        *,
        application:recruitment_applications(
          id,
          candidate:recruitment_candidates(candidate_name, email),
          job:recruitment_job_postings(title)
        )
      `)
      .eq("id", interview_id)
      .eq("company_id", companyId)
      .single()

    if (iError || !interview) {
      return NextResponse.json({ error: iError?.message || "Interview not found" }, { status: 404 })
    }

    if (!interview.applicant_result) {
      return NextResponse.json({ error: "No result set. Set pass/fail/on_hold before notifying." }, { status: 400 })
    }

    const application = Array.isArray(interview.application) ? interview.application[0] : interview.application
    const candidate = Array.isArray(application?.candidate) ? application.candidate[0] : application?.candidate
    const job = Array.isArray(application?.job) ? application.job[0] : application?.job

    const candidateName: string = candidate?.candidate_name || interview.candidate_name || "Candidate"
    const email: string = candidate?.email || interview.candidate_email || ""
    const jobTitle: string = job?.title || interview.job_title || "Position"

    if (!email) {
      return NextResponse.json({ error: "Candidate email not found on this interview record" }, { status: 422 })
    }

    // Fetch company name
    const { data: company } = await client
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single()

    const emailResult = await sendInterviewResultEmail(client, {
      companyId,
      companyName: company?.name ?? null,
      candidateName,
      email,
      jobTitle,
      result: interview.applicant_result as "pass" | "fail" | "on_hold",
      notes: interview.rating ? `Overall rating: ${interview.rating}/5` : null,
      nextStepUrl: null,
    })

    if (!emailResult.ok) {
      return NextResponse.json({
        success: false,
        email: emailResult,
        message: "Failed to send notification email: " + emailResult.error,
      }, { status: 422 })
    }

    // Mark notification as sent
    await client
      .from("recruitment_interviews")
      .update({ result_notified_at: new Date().toISOString() })
      .eq("id", interview_id)

    return NextResponse.json({
      success: true,
      email: emailResult,
      message: `Result notification sent to ${email}`,
    })
  } catch (err) {
    console.error("[notify-result]", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
