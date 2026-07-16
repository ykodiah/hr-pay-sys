/**
 * Public career applications (no auth).
 * POST /api/careers/applications
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/recruitment/job-lookup"

export async function POST(req: NextRequest) {
  try {
    const client = await createClient()
    const body = await req.json()

    const jobKey = String(body.job_id || body.job || body.slug || "").trim()
    const candidateName = String(body.candidate_name || body.name || "").trim()
    const email = String(body.email || "").trim()

    if (!jobKey || !candidateName || !email) {
      return NextResponse.json(
        { error: "job_id (or slug), candidate_name, and email are required" },
        { status: 400 },
      )
    }

    let jobQuery = client
      .from("recruitment_job_postings")
      .select("id, company_id, title, status")
      .eq("status", "published")
    if (isUuid(jobKey)) jobQuery = jobQuery.eq("id", jobKey)
    else jobQuery = jobQuery.eq("slug", jobKey)

    const { data: job, error: jobErr } = await jobQuery.limit(1).maybeSingle()

    if (jobErr) return NextResponse.json({ error: jobErr.message }, { status: 500 })
    if (!job) return NextResponse.json({ error: "Published job not found" }, { status: 404 })

    const { data: candidate, error: cErr } = await client
      .from("recruitment_candidates")
      .insert({
        company_id: job.company_id,
        candidate_name: candidateName,
        email,
        phone: body.phone ?? null,
        location: body.location ?? null,
        experience_text: body.experience_text ?? null,
        skills: Array.isArray(body.skills)
          ? body.skills
          : String(body.skills || "")
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean),
        education: body.education ?? null,
        previous_company: body.previous_company ?? null,
        source: body.source || "careers",
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
        company_id: job.company_id,
        job_posting_id: job.id,
        candidate_id: candidate.id,
        status: "new",
        score: 0,
        source: body.source || "careers",
        cover_letter: body.cover_letter ?? null,
        notes: body.notes ?? null,
      })
      .select()
      .single()
    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 })

    await client.from("recruitment_application_history").insert({
      application_id: application.id,
      from_status: null,
      to_status: "new",
      notes: "Application submitted via careers page",
    })

    return NextResponse.json(
      {
        success: true,
        application_id: application.id,
        job_title: job.title,
        message: "Application submitted successfully",
      },
      { status: 201 },
    )
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
