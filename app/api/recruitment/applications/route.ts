import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { buildOfferLetterText, defaultOnboardingTasks } from "@/lib/recruitment/defaults"
import { buildRichOfferLetter } from "@/lib/recruitment/build-offer-letter"
import { ensureOfferCodes, asBenefitsList, logOfferEvent } from "@/lib/recruitment/offer-sync"
import { formatCompanyAddress } from "@/lib/exports/company-branding"

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
        linkedin_url: body.linkedin_url ?? null,
        source: body.source ?? "direct",
        resume_filename: body.resume_filename ?? null,
        resume_content: body.resume_content ?? null,
        resume_url: body.resume_url ?? null,
        resume_text: body.resume_text ?? null,
        resume_text_method: body.resume_text_method ?? null,
        resume_text_chars: body.resume_text_chars != null ? Number(body.resume_text_chars) : null,
        resume_text_extracted_at: body.resume_text ? new Date().toISOString() : null,
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
      const currency = job?.currency ?? body.currency ?? "GHS"
      const benefits = asBenefitsList(body.benefits ?? job?.benefits ?? [])
      const codes = ensureOfferCodes()

      let companyName = body.company_name as string | undefined
      let companyAddress: string | undefined
      try {
        const { data: company } = await client
          .from("companies")
          .select("*")
          .eq("id", current.company_id)
          .maybeSingle()
        companyName = companyName || company?.name
        companyAddress = formatCompanyAddress(company)
      } catch {
        /* optional */
      }

      const letter =
        body.offer_letter_text ||
        buildRichOfferLetter({
          candidateName: candidate?.candidate_name ?? "Candidate",
          jobTitle: job?.title ?? "Role",
          department: job?.department,
          salary,
          currency,
          startDate: body.start_date,
          acceptanceDeadline: body.acceptance_deadline,
          benefits,
          terms: body.terms ?? "Standard employment terms under Ghana Labour Act, 2003 (Act 651).",
          companyName,
          companyAddress,
          workingHours: body.working_hours ?? "08:00 – 17:00",
          probationMonths: body.probation_months ?? 3,
          noticeMonths: body.notice_months ?? 1,
          signatoryName: body.signatory_name,
          signatoryTitle: body.signatory_title,
          remunerationExtras: asBenefitsList(body.remuneration_extras),
        }) ||
        buildOfferLetterText({
          candidateName: candidate?.candidate_name ?? "Candidate",
          jobTitle: job?.title ?? "Role",
          salary,
          currency,
          startDate: body.start_date,
          companyName,
        })

      const offerPayload: Record<string, unknown> = {
        company_id: current.company_id,
        application_id: body.id,
        salary,
        currency,
        start_date: body.start_date ?? null,
        benefits,
        terms: body.terms ?? "Standard employment terms under Ghana Labour Act, 2003 (Act 651).",
        status: "draft",
        offer_letter_text: letter,
        acceptance_deadline: body.acceptance_deadline ?? null,
        short_code: codes.short_code,
        response_token: codes.response_token,
        working_hours: body.working_hours ?? "08:00 – 17:00",
        probation_months: body.probation_months ?? 3,
        notice_months: body.notice_months ?? 1,
        signatory_name: body.signatory_name ?? null,
        signatory_title: body.signatory_title ?? null,
        department: job?.department ?? null,
        job_title_snapshot: job?.title ?? null,
        candidate_name_snapshot: candidate?.candidate_name ?? null,
        candidate_email_snapshot: candidate?.email ?? null,
        remuneration: {
          extras: asBenefitsList(body.remuneration_extras),
          salary,
          currency,
        },
        created_by: user.isDemo ? null : user.id,
      }

      let { data: offer, error: oErr } = await client
        .from("recruitment_offers")
        .insert(offerPayload)
        .select()
        .single()

      // Fallback if migration 088 not applied yet
      if (oErr && /column|schema cache/i.test(oErr.message)) {
        const legacy = {
          company_id: current.company_id,
          application_id: body.id,
          salary,
          currency,
          start_date: body.start_date ?? null,
          benefits,
          terms: body.terms ?? "Standard employment terms under Ghana Labour Act, 2003 (Act 651).",
          status: "draft",
          offer_letter_text: letter,
          acceptance_deadline: body.acceptance_deadline ?? null,
          created_by: user.isDemo ? null : user.id,
        }
        const retry = await client.from("recruitment_offers").insert(legacy).select().single()
        offer = retry.data
        oErr = retry.error
      }
      if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 })
      extras.offer = offer

      await logOfferEvent(client, {
        companyId: current.company_id,
        offerId: offer.id,
        applicationId: body.id,
        eventType: "created",
        actorType: "admin",
        actorId: user.isDemo ? null : user.id,
        toStatus: "draft",
        notes: "Offer draft generated",
      })
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
