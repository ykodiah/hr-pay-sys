/**
 * POST /api/recruitment/applications/screen
 * Run AI/heuristic ATS screening for one application (tenant-scoped).
 * Body: { application_id, final_score?, override_reason?, save_only? }
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { screenApplicationAgainstJob } from "@/lib/recruitment/ai-screen-application"
import { resolveResumeTextForScreening } from "@/lib/recruitment/extract-resume-text"

function db() {
  try {
    return createServiceClient()
  } catch {
    return createClient()
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client: any = await db()
    const body = await req.json()
    const applicationId = String(body.application_id || body.id || "").trim()
    if (!applicationId) {
      return NextResponse.json({ error: "application_id is required" }, { status: 400 })
    }

    const authClient = await createClient()
    let companyId =
      (body.company_id as string | undefined) ||
      (await resolveCompanyId(authClient, user.isDemo ? null : user.id, user))?.companyId ||
      (await resolveCompanyId(client, user.isDemo ? null : user.id, user))?.companyId ||
      null

    // Fallback from the application row itself when tenant resolve is flaky
    if (!companyId) {
      const { data: stub } = await client
        .from("recruitment_applications")
        .select("company_id")
        .eq("id", applicationId)
        .maybeSingle()
      companyId = stub?.company_id ?? null
    }

    if (!companyId) {
      return NextResponse.json({ error: "Unable to resolve company" }, { status: 400 })
    }

    const { data: application, error: findErr } = await client
      .from("recruitment_applications")
      .select(
        `*, candidate:recruitment_candidates(*), job:recruitment_job_postings(*)`,
      )
      .eq("id", applicationId)
      .eq("company_id", companyId)
      .maybeSingle()

    if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 })
    if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 })

    const candidate = Array.isArray(application.candidate)
      ? application.candidate[0]
      : application.candidate
    const job = Array.isArray(application.job) ? application.job[0] : application.job

    // Manual override-only save (no new AI run)
    if (body.save_only && body.final_score != null) {
      const finalScore = Math.max(0, Math.min(100, Number(body.final_score)))
      const { data: screening, error: sErr } = await client
        .from("recruitment_application_screenings")
        .insert({
          company_id: companyId,
          application_id: applicationId,
          job_posting_id: application.job_posting_id,
          candidate_id: application.candidate_id,
          ai_score: application.screening_score ?? application.score ?? null,
          final_score: finalScore,
          recommendation: null,
          strengths: [],
          gaps: [],
          summary: body.summary || application.screening_summary || "Manual score override",
          is_manual_override: true,
          override_reason: body.override_reason || "Manual override by recruiter",
          override_by: user.isDemo ? null : user.id,
          status: "overridden",
          created_by: user.isDemo ? null : user.id,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })

      const { data: updated } = await client
        .from("recruitment_applications")
        .update({
          status: "screening",
          score: finalScore,
          screening_score: finalScore,
          screening_summary: body.summary || screening.summary,
          screening_status: "overridden",
          screened_at: new Date().toISOString(),
          screened_by: user.isDemo ? null : user.id,
          notes: body.notes ?? application.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId)
        .eq("company_id", companyId)
        .select()
        .single()

      await client.from("recruitment_application_history").insert({
        application_id: applicationId,
        from_status: application.status,
        to_status: "screening",
        changed_by: user.isDemo ? null : user.id,
        notes: `Manual screening score set to ${finalScore}`,
      })

      return NextResponse.json({ success: true, screening, application: updated })
    }

    // Mark running
    await client
      .from("recruitment_applications")
      .update({
        status: "screening",
        screening_status: "running",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .eq("company_id", companyId)

    // Ensure CV text is readable for ATS (extract from PDF/DOCX/URL if needed)
    const resumeResolved = await resolveResumeTextForScreening({
      resumeText: candidate?.resume_text,
      resumeContent: candidate?.resume_content,
      resumeUrl: application.resume_url || candidate?.resume_url,
      resumeFilename: candidate?.resume_filename || application.resume_filename,
      resumeMimeType: candidate?.resume_mime_type,
    })

    if (candidate?.id && resumeResolved.chars > 40) {
      const needsPersist =
        !String(candidate.resume_text || "").trim() ||
        Number(candidate.resume_text_chars || 0) < resumeResolved.chars
      if (needsPersist) {
        await client
          .from("recruitment_candidates")
          .update({
            resume_text: resumeResolved.text,
            resume_text_method: resumeResolved.method,
            resume_text_chars: resumeResolved.chars,
            resume_text_extracted_at: new Date().toISOString(),
            // Keep a readable copy for legacy paths when content was binary
            resume_content:
              candidate.resume_content && !String(candidate.resume_content).startsWith("data:")
                ? candidate.resume_content
                : resumeResolved.text,
            updated_at: new Date().toISOString(),
          })
          .eq("id", candidate.id)
          .eq("company_id", companyId)
      }
    }

    const result = await screenApplicationAgainstJob({
      jobTitle: job?.title || "Role",
      jobDescription: job?.description,
      requirements: job?.requirements,
      department: job?.department,
      candidateName: candidate?.candidate_name || "Candidate",
      skills: candidate?.skills,
      experienceText: candidate?.experience_text,
      education: candidate?.education,
      previousCompany: candidate?.previous_company,
      linkedinUrl: candidate?.linkedin_url,
      coverLetter: application.cover_letter,
      resumeFilename: candidate?.resume_filename || application.resume_filename,
      resumeText: resumeResolved.text || candidate?.resume_text,
      resumeContent: candidate?.resume_content,
    })

    const finalScore =
      body.final_score != null
        ? Math.max(0, Math.min(100, Number(body.final_score)))
        : result.ai_score
    const isOverride = body.final_score != null && Number(body.final_score) !== result.ai_score

    const { data: screening, error: insertErr } = await client
      .from("recruitment_application_screenings")
      .insert({
        company_id: companyId,
        application_id: applicationId,
        job_posting_id: application.job_posting_id,
        candidate_id: application.candidate_id,
        ai_score: result.ai_score,
        final_score: finalScore,
        recommendation: result.recommendation,
        strengths: result.strengths,
        gaps: result.gaps,
        criteria_scores: result.criteria_scores,
        summary: result.summary,
        model_used: result.model_used,
        resume_excerpt: result.resume_excerpt,
        cover_letter_excerpt: result.cover_letter_excerpt,
        job_requirements_snapshot: result.job_requirements_snapshot,
        is_manual_override: isOverride,
        override_reason: isOverride ? body.override_reason || "Recruiter adjusted AI score" : null,
        override_by: isOverride && !user.isDemo ? user.id : null,
        status: isOverride ? "overridden" : "completed",
        created_by: user.isDemo ? null : user.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertErr) {
      await client
        .from("recruitment_applications")
        .update({ screening_status: "failed", updated_at: new Date().toISOString() })
        .eq("id", applicationId)
      return NextResponse.json({ error: insertErr.message, screening_preview: result }, { status: 500 })
    }

    const { data: updated } = await client
      .from("recruitment_applications")
      .update({
        status: "screening",
        score: finalScore,
        screening_score: result.ai_score,
        screening_summary: result.summary,
        screening_status: isOverride ? "overridden" : "completed",
        screened_at: new Date().toISOString(),
        screened_by: user.isDemo ? null : user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .eq("company_id", companyId)
      .select()
      .single()

    if (application.status !== "screening") {
      await client.from("recruitment_application_history").insert({
        application_id: applicationId,
        from_status: application.status,
        to_status: "screening",
        changed_by: user.isDemo ? null : user.id,
        notes: `ATS screen completed (AI ${result.ai_score}, final ${finalScore}) via ${result.model_used}`,
      })
    }

    return NextResponse.json({
      success: true,
      screening,
      application: updated,
      result,
      resume_extract: {
        chars: resumeResolved.chars,
        method: resumeResolved.method,
        warning: resumeResolved.warning || null,
        groq_configured: Boolean(process.env.GROQ_API_KEY),
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Screening failed" },
      { status: 500 },
    )
  }
}
