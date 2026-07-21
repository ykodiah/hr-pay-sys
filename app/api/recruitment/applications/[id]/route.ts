/**
 * GET /api/recruitment/applications/[id]
 * Full application preview (tenant-scoped).
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

function db() {
  try {
    return createServiceClient()
  } catch {
    return createClient()
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const client: any = await db()
    const companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId
    if (!companyId) return NextResponse.json({ error: "Unable to resolve company" }, { status: 400 })

    const { data, error } = await client
      .from("recruitment_applications")
      .select(
        `*, candidate:recruitment_candidates(*), job:recruitment_job_postings(*)`,
      )
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "Application not found" }, { status: 404 })

    const candidate = Array.isArray(data.candidate) ? data.candidate[0] : data.candidate
    const job = Array.isArray(data.job) ? data.job[0] : data.job

    const { data: screenings } = await client
      .from("recruitment_application_screenings")
      .select("*")
      .eq("application_id", id)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(5)

    const { data: history } = await client
      .from("recruitment_application_history")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: false })
      .limit(20)

    return NextResponse.json({
      success: true,
      application: {
        ...data,
        candidate_name: candidate?.candidate_name,
        candidate_email: candidate?.email,
        candidate_phone: candidate?.phone,
        skills: candidate?.skills ?? [],
        experience_text: candidate?.experience_text,
        education: candidate?.education,
        previous_company: candidate?.previous_company,
        linkedin_url: candidate?.linkedin_url,
        resume_filename: data.resume_filename || candidate?.resume_filename,
        resume_url: data.resume_url || candidate?.resume_url,
        resume_content: candidate?.resume_content,
        resume_text: candidate?.resume_text ?? null,
        resume_text_method: candidate?.resume_text_method ?? null,
        resume_text_chars: candidate?.resume_text_chars ?? null,
        resume_text_extracted_at: candidate?.resume_text_extracted_at ?? null,
        job_title: job?.title,
        department: job?.department,
        location: job?.location || candidate?.location,
        employment_type: job?.employment_type,
        job_description: job?.description,
        job_requirements: job?.requirements,
        company_id: data.company_id,
      },
      screenings: screenings ?? [],
      history: history ?? [],
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load application" },
      { status: 500 },
    )
  }
}
