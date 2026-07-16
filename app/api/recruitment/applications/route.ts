import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { buildOfferLetterText, defaultOnboardingTasks } from "@/lib/recruitment/defaults"

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const client = await createClient()
    const sp = new URL(req.url).searchParams
    let companyId = sp.get("company_id")
    if (!companyId) {
      companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId ?? null
    }
    if (!companyId) return NextResponse.json({ error: "company_id required" }, { status: 400 })

    let query = client
      .from("recruitment_applications")
      .select(
        `*, candidate:recruitment_candidates(*), job:recruitment_job_postings(id, title, department, location)`,
      )
      .eq("company_id", companyId)
      .order("applied_at", { ascending: false })

    const status = sp.get("status")
    const jobId = sp.get("job_posting_id")
    if (status && status !== "all") query = query.eq("status", status)
    if (jobId) query = query.eq("job_posting_id", jobId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const applications = (data ?? []).map((a: any) => {
      const candidate = Array.isArray(a.candidate) ? a.candidate[0] : a.candidate
      const job = Array.isArray(a.job) ? a.job[0] : a.job
      return {
        ...a,
        candidate_name: candidate?.candidate_name,
        candidate_email: candidate?.email,
        candidate_phone: candidate?.phone,
        skills: candidate?.skills ?? [],
        resume_filename: candidate?.resume_filename,
        resume_content: candidate?.resume_content,
        job_title: job?.title,
        department: job?.department,
      }
    })

    return NextResponse.json({ success: true, applications })
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
    if (!companyId || !body.candidate_name || !body.job_posting_id) {
      return NextResponse.json(
        { error: "company_id, candidate_name, and job_posting_id are required" },
        { status: 400 },
      )
    }

    const { data: candidate, error: cErr } = await client
      .from("recruitment_candidates")
      .insert({
        company_id: companyId,
        candidate_name: body.candidate_name,
        email: body.email ?? null,
        phone: body.phone ?? null,
        location: body.location ?? null,
        experience_text: body.experience_text ?? null,
        skills: body.skills ?? [],
        education: body.education ?? null,
        previous_company: body.previous_company ?? null,
        source: body.source ?? "direct",
        resume_filename: body.resume_filename ?? null,
        resume_content: body.resume_content ?? null,
        resume_url: body.resume_url ?? null,
      })
      .select()
      .single()
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

    const { data: application, error: aErr } = await client
      .from("recruitment_applications")
      .insert({
        company_id: companyId,
        job_posting_id: body.job_posting_id,
        candidate_id: candidate.id,
        status: body.status ?? "new",
        score: Number(body.score ?? 0),
        source: body.source ?? "direct",
        cover_letter: body.cover_letter ?? null,
        notes: body.notes ?? null,
      })
      .select()
      .single()
    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 })

    await client.from("recruitment_application_history").insert({
      application_id: application.id,
      from_status: null,
      to_status: application.status,
      changed_by: user.isDemo ? null : user.id,
      notes: "Application created",
    })

    return NextResponse.json({ success: true, application, candidate }, { status: 201 })
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

    const { data: current } = await client
      .from("recruitment_applications")
      .select("*, candidate:recruitment_candidates(*), job:recruitment_job_postings(*)")
      .eq("id", body.id)
      .single()
    if (!current) return NextResponse.json({ error: "Application not found" }, { status: 404 })

    const action = body.action as string | undefined
    let nextStatus = body.status as string | undefined
    const extras: Record<string, unknown> = {}

    if (action === "approve" || action === "screen") nextStatus = "screening"
    if (action === "reject") nextStatus = "rejected"
    if (action === "move_interview") nextStatus = "interview"
    if (action === "generate_offer") nextStatus = "offer"
    if (action === "hire" || action === "start_onboarding") nextStatus = "hired"

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (nextStatus) patch.status = nextStatus
    if (body.score !== undefined) patch.score = body.score
    if (body.notes !== undefined) patch.notes = body.notes

    const { data: updated, error } = await client
      .from("recruitment_applications")
      .update(patch)
      .eq("id", body.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (nextStatus && nextStatus !== current.status) {
      await client.from("recruitment_application_history").insert({
        application_id: body.id,
        from_status: current.status,
        to_status: nextStatus,
        changed_by: user.isDemo ? null : user.id,
        notes: body.notes ?? action ?? null,
      })
    }

    const candidate = Array.isArray(current.candidate) ? current.candidate[0] : current.candidate
    const job = Array.isArray(current.job) ? current.job[0] : current.job

    if (action === "generate_offer") {
      const salary = Number(body.salary ?? job?.salary_min ?? job?.salary_max ?? 0)
      const letter = buildOfferLetterText({
        candidateName: candidate?.candidate_name ?? "Candidate",
        jobTitle: job?.title ?? "Role",
        salary,
        currency: job?.currency ?? "GHS",
        startDate: body.start_date,
        companyName: body.company_name,
      })
      const { data: offer, error: oErr } = await client
        .from("recruitment_offers")
        .insert({
          company_id: current.company_id,
          application_id: body.id,
          salary,
          currency: job?.currency ?? "GHS",
          start_date: body.start_date ?? null,
          benefits: body.benefits ?? job?.benefits ?? [],
          terms: body.terms ?? "Standard employment terms under Ghana Labour Act.",
          status: "draft",
          offer_letter_text: letter,
          acceptance_deadline: body.acceptance_deadline ?? null,
          created_by: user.isDemo ? null : user.id,
        })
        .select()
        .single()
      if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 })
      extras.offer = offer
    }

    if (action === "start_onboarding" || action === "hire") {
      const { data: checklist, error: clErr } = await client
        .from("recruitment_onboarding_checklists")
        .insert({
          company_id: current.company_id,
          application_id: body.id,
          candidate_id: current.candidate_id,
          candidate_name: candidate?.candidate_name ?? "Candidate",
          start_date: body.start_date ?? new Date().toISOString().slice(0, 10),
          status: "in_progress",
          progress: 0,
          created_by: user.isDemo ? null : user.id,
        })
        .select()
        .single()
      if (clErr) return NextResponse.json({ error: clErr.message }, { status: 500 })

      const tasks = defaultOnboardingTasks(body.start_date).map((t) => ({
        checklist_id: checklist.id,
        ...t,
        status: "pending",
      }))
      await client.from("recruitment_onboarding_tasks").insert(tasks)
      extras.checklist = checklist
    }

    return NextResponse.json({ success: true, application: updated, ...extras })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
