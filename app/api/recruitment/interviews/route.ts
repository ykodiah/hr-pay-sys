import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

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

    const { data, error } = await client
      .from("recruitment_interviews")
      .select(
        `*, application:recruitment_applications(
          id, candidate:recruitment_candidates(candidate_name, email),
          job:recruitment_job_postings(title)
        )`,
      )
      .eq("company_id", companyId)
      .order("scheduled_at", { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const interviews = (data ?? []).map((i: any) => {
      const application = Array.isArray(i.application) ? i.application[0] : i.application
      const candidate = Array.isArray(application?.candidate)
        ? application?.candidate[0]
        : application?.candidate
      const job = Array.isArray(application?.job) ? application?.job[0] : application?.job
      return {
        ...i,
        candidate_name: candidate?.candidate_name,
        candidate_email: candidate?.email,
        job_title: job?.title,
      }
    })

    return NextResponse.json({ success: true, interviews })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

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
    if (!companyId || !body.application_id || !body.scheduled_at) {
      return NextResponse.json(
        { error: "company_id, application_id, and scheduled_at are required" },
        { status: 400 },
      )
    }

    const { data, error } = await client
      .from("recruitment_interviews")
      .insert({
        company_id: companyId,
        application_id: body.application_id,
        interview_type: body.interview_type ?? "video",
        scheduled_at: body.scheduled_at,
        duration_minutes: Number(body.duration_minutes ?? 60),
        interviewer_name: body.interviewer_name ?? null,
        location: body.location ?? null,
        meeting_url: body.meeting_url ?? null,
        status: "scheduled",
        notes: body.notes ?? null,
        created_by: user.isDemo ? null : user.id,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await client
      .from("recruitment_applications")
      .update({ status: "interview", updated_at: new Date().toISOString() })
      .eq("id", body.application_id)

    return NextResponse.json({ success: true, interview: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const client = await createClient()
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of [
      "interview_type",
      "scheduled_at",
      "duration_minutes",
      "interviewer_name",
      "location",
      "meeting_url",
      "status",
      "rating",
      "feedback",
      "notes",
      "applicant_result",
      "result_notified_at",
      "assessment_form",
      "assessment_sent_at",
      "assessment_completed_at",
    ]) {
      if (body[key] !== undefined) patch[key] = body[key]
    }
    if (body.action === "complete") patch.status = "completed"
    if (body.action === "cancel") patch.status = "cancelled"

    const { data, error } = await client
      .from("recruitment_interviews")
      .update(patch)
      .eq("id", body.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, interview: data })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
