/**
 * GET /api/recruitment?company_id=
 * Returns overview metrics + recent items for the recruitment dashboard.
 */

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
      const resolved = await resolveCompanyId(client, user.isDemo ? null : user.id)
      companyId = resolved?.companyId ?? null
    }
    if (!companyId) return NextResponse.json({ error: "company_id required" }, { status: 400 })

    const [jobs, apps, interviews, offers, requisitions, onboarding] = await Promise.all([
      client
        .from("recruitment_job_postings")
        .select(
          "id, company_id, requisition_id, slug, short_code, title, description, public_summary, requirements, benefits, salary_min, salary_max, currency, location, department, employment_type, status, published_at, expires_at, views_count, applications_count, created_at, updated_at",
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      client
        .from("recruitment_applications")
        .select(
          `id, company_id, status, score, source, applied_at, notes, cover_letter, job_posting_id, candidate_id, resume_url, resume_filename, screening_score, screening_summary, screening_status, screened_at,
           candidate:recruitment_candidates(*),
           job:recruitment_job_postings(id, title, department, slug, short_code)`,
        )
        .eq("company_id", companyId)
        .order("applied_at", { ascending: false }),
      client
        .from("recruitment_interviews")
        .select(
          `*, application:recruitment_applications(
             id, candidate:recruitment_candidates(candidate_name, email),
             job:recruitment_job_postings(title)
           )`,
        )
        .eq("company_id", companyId)
        .order("scheduled_at", { ascending: true }),
      client
        .from("recruitment_offers")
        .select(
          `*, application:recruitment_applications(
             id, candidate:recruitment_candidates(candidate_name, email),
             job:recruitment_job_postings(title, department)
           )`,
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      client.from("recruitment_requisitions").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
      client
        .from("recruitment_onboarding_checklists")
        .select(`*, tasks:recruitment_onboarding_tasks(*)`)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
    ])

    const jobRows = jobs.data ?? []
    const appCounts = new Map<string, number>()
    for (const a of apps.data ?? []) {
      if (a.job_posting_id) appCounts.set(a.job_posting_id, (appCounts.get(a.job_posting_id) ?? 0) + 1)
    }

    const appRows = (apps.data ?? []).map((a: any) => {
      const candidate = Array.isArray(a.candidate) ? a.candidate[0] : a.candidate
      const job = Array.isArray(a.job) ? a.job[0] : a.job
      return {
        ...a,
        candidate_name: candidate?.candidate_name ?? "Candidate",
        candidate_email: candidate?.email ?? "",
        candidate_phone: candidate?.phone ?? "",
        skills: candidate?.skills ?? [],
        cover_letter: a.cover_letter ?? null,
        experience_text: candidate?.experience_text ?? null,
        education: candidate?.education ?? null,
        resume_filename: a.resume_filename || candidate?.resume_filename || null,
        resume_url: a.resume_url || candidate?.resume_url || null,
        resume_text: candidate?.resume_text ?? null,
        resume_text_chars: candidate?.resume_text_chars ?? null,
        resume_text_method: candidate?.resume_text_method ?? null,
        previous_company: candidate?.previous_company ?? null,
        linkedin_url: candidate?.linkedin_url ?? null,
        screening_score: a.screening_score ?? null,
        screening_summary: a.screening_summary ?? null,
        screening_status: a.screening_status ?? null,
        screened_at: a.screened_at ?? null,
        job_title: job?.title ?? "Role",
        department: job?.department ?? "",
        job_slug: job?.slug ?? null,
        job_short_code: job?.short_code ?? null,
      }
    })

    const interviewRows = (interviews.data ?? []).map((i: any) => {
      const application = Array.isArray(i.application) ? i.application[0] : i.application
      const candidate = Array.isArray(application?.candidate) ? application?.candidate[0] : application?.candidate
      const job = Array.isArray(application?.job) ? application?.job[0] : application?.job
      return {
        ...i,
        candidate_name: candidate?.candidate_name ?? "Candidate",
        candidate_email: candidate?.email ?? "",
        job_title: job?.title ?? "Role",
      }
    })

    const offerRows = (offers.data ?? []).map((o: any) => {
      const application = Array.isArray(o.application) ? o.application[0] : o.application
      const candidate = Array.isArray(application?.candidate) ? application?.candidate[0] : application?.candidate
      const job = Array.isArray(application?.job) ? application?.job[0] : application?.job
      return {
        ...o,
        candidate_name: candidate?.candidate_name ?? null,
        candidate_email: candidate?.email ?? null,
        job_title: job?.title ?? null,
        department: job?.department ?? null,
      }
    })

    const onboardingRows = (onboarding.data ?? []).map((checklist: any) => ({
      ...checklist,
      tasks: (checklist.tasks ?? []).map((task: any) => ({
        ...task,
        assigned_to: task.assigned_department ?? task.assigned_to ?? null,
        department: task.assigned_department ?? task.department ?? null,
      })),
    }))

    const activeJobs = jobRows.filter((j) => j.status === "published" || j.status === "paused").length
    const scheduledInterviews = interviewRows.filter((i) => i.status === "scheduled").length
    const offersOut = offerRows.filter((o) => o.status === "sent" || o.status === "draft").length

    const byStatus: Record<string, number> = {}
    for (const a of appRows) byStatus[a.status] = (byStatus[a.status] ?? 0) + 1
    const bySource: Record<string, number> = {}
    for (const a of appRows) {
      const s = a.source || "direct"
      bySource[s] = (bySource[s] ?? 0) + 1
    }

    return NextResponse.json({
      success: true,
      company_id: companyId,
      metrics: {
        active_jobs: activeJobs,
        total_applications: appRows.length,
        interviews_scheduled: scheduledInterviews,
        offers_extended: offersOut,
        requisitions: (requisitions.data ?? []).length,
        onboarding_active: onboardingRows.filter((o) => o.status !== "completed").length,
      },
      analytics: {
        funnel: {
          new: byStatus.new ?? 0,
          screening: byStatus.screening ?? 0,
          interview: byStatus.interview ?? 0,
          offer: byStatus.offer ?? 0,
          hired: byStatus.hired ?? 0,
          rejected: byStatus.rejected ?? 0,
        },
        sources: bySource,
      },
      requisitions: requisitions.data ?? [],
      jobs: jobRows.map((j) => ({ ...j, applications_count: appCounts.get(j.id) ?? 0 })),
      applications: appRows,
      interviews: interviewRows,
      offers: offerRows,
      onboarding: onboardingRows,
      meta: { fetched_at: new Date().toISOString() },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load recruitment" },
      { status: 500 },
    )
  }
}
