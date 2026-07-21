/**
 * GET /api/recruitment/applications/[id]
 * Full application preview (tenant-scoped).
 * Accepts optional ?company_id= (same pattern as other recruitment routes).
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { resolveResumeTextForScreening } from "@/lib/recruitment/extract-resume-text"

function db() {
  try {
    return createServiceClient()
  } catch {
    return createClient()
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const client: any = await db()
    const authClient = await createClient()
    const sp = new URL(req.url).searchParams

    let companyId =
      sp.get("company_id") ||
      (await resolveCompanyId(authClient, user.isDemo ? null : user.id, user))?.companyId ||
      (await resolveCompanyId(client, user.isDemo ? null : user.id, user))?.companyId ||
      null

    // Fallback: application already carries company_id — use it when resolve fails
    // (common with service-role / demo / multi-company edge cases)
    if (!companyId) {
      const { data: stub } = await client
        .from("recruitment_applications")
        .select("company_id")
        .eq("id", id)
        .maybeSingle()
      companyId = stub?.company_id ?? null
    }

    if (!companyId) {
      return NextResponse.json({ error: "Unable to resolve company" }, { status: 400 })
    }

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

    // Ensure CV text is available for preview + ATS (extract on demand if needed)
    let resumeText = candidate?.resume_text ?? null
    let resumeTextMethod = candidate?.resume_text_method ?? null
    let resumeTextChars = candidate?.resume_text_chars ?? null
    let resumeTextExtractedAt = candidate?.resume_text_extracted_at ?? null
    let resumeExtractWarning: string | null = null

    const needsExtract =
      !String(resumeText || "").trim() ||
      String(resumeText || "").startsWith("data:") ||
      Number(resumeTextChars || 0) < 40

    if (needsExtract && (candidate?.resume_content || data.resume_url || candidate?.resume_url)) {
      try {
        const extracted = await resolveResumeTextForScreening({
          resumeText: candidate?.resume_text,
          resumeContent: candidate?.resume_content,
          resumeUrl: data.resume_url || candidate?.resume_url,
          resumeFilename: data.resume_filename || candidate?.resume_filename,
          resumeMimeType: candidate?.resume_mime_type,
        })
        if (extracted.chars > 0) {
          resumeText = extracted.text
          resumeTextMethod = extracted.method
          resumeTextChars = extracted.chars
          resumeTextExtractedAt = new Date().toISOString()
          if (candidate?.id) {
            const { error: persistErr } = await client
              .from("recruitment_candidates")
              .update({
                resume_text: resumeText,
                resume_text_method: resumeTextMethod,
                resume_text_chars: resumeTextChars,
                resume_text_extracted_at: resumeTextExtractedAt,
                resume_content:
                  candidate.resume_content && !String(candidate.resume_content).startsWith("data:")
                    ? candidate.resume_content
                    : resumeText,
                updated_at: new Date().toISOString(),
              })
              .eq("id", candidate.id)
              .eq("company_id", companyId)
            if (persistErr) {
              console.warn("[application preview] resume_text persist skipped:", persistErr.message)
              // Still return extracted text in the response even if schema 087 is not applied yet
            }
          }
        }
        if (extracted.warning) resumeExtractWarning = extracted.warning
      } catch (err) {
        resumeExtractWarning = err instanceof Error ? err.message : "Resume extract failed"
      }
    }

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

    const resumeUrl = data.resume_url || candidate?.resume_url || null
    const resumeFilename = data.resume_filename || candidate?.resume_filename || null

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
        resume_filename: resumeFilename,
        resume_url: resumeUrl,
        resume_content: candidate?.resume_content,
        resume_text: resumeText,
        resume_text_method: resumeTextMethod,
        resume_text_chars: resumeTextChars,
        resume_text_extracted_at: resumeTextExtractedAt,
        resume_extract_warning: resumeExtractWarning,
        job_title: job?.title,
        department: job?.department,
        location: job?.location || candidate?.location,
        employment_type: job?.employment_type,
        job_description: job?.description,
        job_requirements: job?.requirements,
        company_id: data.company_id || companyId,
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
