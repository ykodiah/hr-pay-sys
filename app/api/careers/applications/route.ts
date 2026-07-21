/**
 * Public career applications (no auth).
 * POST /api/careers/applications
 * Accepts JSON or multipart/form-data (with resume file).
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/recruitment/job-lookup"
import { storeEmployeeDocumentFile } from "@/lib/employees/document-upload"
import { sendApplicantConfirmationEmail } from "@/lib/recruitment/applicant-confirmation-email"
import { formatCompanyAddress } from "@/lib/exports/company-branding"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function db() {
  try {
    return createServiceClient()
  } catch {
    return createClient()
  }
}

async function parseBody(req: NextRequest) {
  const contentType = req.headers.get("content-type") || ""
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData()
    const resume = form.get("resume") || form.get("cv") || form.get("file")
    const fields: Record<string, any> = {}
    for (const [key, value] of form.entries()) {
      if (key === "resume" || key === "cv" || key === "file") continue
      fields[key] = typeof value === "string" ? value : String(value)
    }
    return { fields, resume: resume instanceof File ? resume : null }
  }
  const json = await req.json()
  return { fields: json, resume: null as File | null }
}

async function findPublishedJob(client: any, jobKey: string) {
  let jobQuery = client
    .from("recruitment_job_postings")
    .select("id, company_id, title, status, short_code, slug, department, location, employment_type")
    .eq("status", "published")

  if (isUuid(jobKey)) jobQuery = jobQuery.eq("id", jobKey)
  else if (/^[A-Z0-9]{6,12}$/i.test(jobKey) && !jobKey.includes("-")) {
    jobQuery = jobQuery.or(`short_code.eq.${jobKey.toUpperCase()},short_code.eq.${jobKey},slug.eq.${jobKey}`)
  } else {
    jobQuery = jobQuery.eq("slug", jobKey)
  }

  let { data: job, error: jobErr } = await jobQuery.limit(1).maybeSingle()
  if ((!job || jobErr) && !isUuid(jobKey)) {
    const retry = await client
      .from("recruitment_job_postings")
      .select("id, company_id, title, status, short_code, slug, department, location, employment_type")
      .eq("status", "published")
      .ilike("short_code", jobKey)
      .maybeSingle()
    job = retry.data
    jobErr = retry.error
  }
  return { job, jobErr }
}

export async function POST(req: NextRequest) {
  try {
    const client: any = await db()
    const { fields: body, resume } = await parseBody(req)

    const jobKey = String(body.job_id || body.job || body.slug || body.code || body.short_code || "").trim()
    const candidateName = String(body.candidate_name || body.name || "").trim()
    const email = String(body.email || "").trim().toLowerCase()

    if (!jobKey || !candidateName || !email) {
      return NextResponse.json(
        { error: "job_id (or short code), candidate_name, and email are required" },
        { status: 400 },
      )
    }

    const { job, jobErr } = await findPublishedJob(client, jobKey)
    if (jobErr) return NextResponse.json({ error: jobErr.message }, { status: 500 })
    if (!job) return NextResponse.json({ error: "Published job not found" }, { status: 404 })

    // Soft duplicate guard: same email + same job still open
    const { data: priorCandidates } = await client
      .from("recruitment_candidates")
      .select("id")
      .eq("company_id", job.company_id)
      .ilike("email", email)
      .limit(20)
    const priorIds = (priorCandidates ?? []).map((c: any) => c.id).filter(Boolean)
    if (priorIds.length) {
      const { data: existingApps } = await client
        .from("recruitment_applications")
        .select("id, status")
        .eq("job_posting_id", job.id)
        .in("candidate_id", priorIds)
        .not("status", "in", '("rejected","withdrawn")')
        .limit(1)
      if (existingApps?.length) {
        return NextResponse.json(
          {
            error: "You have already applied for this role. Our team will be in touch.",
            application_id: existingApps[0].id,
          },
          { status: 409 },
        )
      }
    }

    let resumeUrl: string | null = body.resume_url ?? null
    let resumeFilename: string | null = body.resume_filename ?? null
    let resumeContent: string | null = body.resume_content ?? null
    let resumeMime: string | null = body.resume_mime_type ?? null
    let resumeSize: number | null = body.resume_size != null ? Number(body.resume_size) : null

    if (resume) {
      if (resume.size > 8 * 1024 * 1024) {
        return NextResponse.json({ error: "Resume must be smaller than 8MB" }, { status: 400 })
      }
      const stored = await storeEmployeeDocumentFile(resume, resume.name || "resume.pdf")
      resumeUrl = stored.fileUrl
      resumeContent = stored.fileContent
      resumeFilename = resume.name
      resumeMime = resume.type || "application/octet-stream"
      resumeSize = resume.size
    }

    const skills = Array.isArray(body.skills)
      ? body.skills
      : String(body.skills || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)

    const { data: candidate, error: cErr } = await client
      .from("recruitment_candidates")
      .insert({
        company_id: job.company_id,
        candidate_name: candidateName,
        email,
        phone: body.phone ?? null,
        location: body.location ?? null,
        experience_text: body.experience_text ?? null,
        skills,
        education: body.education ?? null,
        previous_company: body.previous_company ?? null,
        linkedin_url: body.linkedin_url ?? null,
        source: body.source || "careers",
        resume_filename: resumeFilename,
        resume_content: resumeContent,
        resume_url: resumeUrl,
        resume_mime_type: resumeMime,
        resume_size: resumeSize,
        updated_at: new Date().toISOString(),
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
        source: body.source || "public-apply",
        cover_letter: body.cover_letter ?? null,
        notes: body.notes ?? null,
        resume_url: resumeUrl,
        resume_filename: resumeFilename,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 })

    await client.from("recruitment_application_history").insert({
      application_id: application.id,
      from_status: null,
      to_status: "new",
      notes: resumeFilename
        ? `Application submitted via public apply link (resume: ${resumeFilename})`
        : "Application submitted via public apply link",
    })

    // Best-effort confirmation email with a copy of the submitted application
    let emailStatus: string | null = null
    try {
      const { data: company } = await client
        .from("companies")
        .select("*")
        .eq("id", job.company_id)
        .maybeSingle()

      const mail = await sendApplicantConfirmationEmail(client, {
        companyId: job.company_id,
        companyName: company?.name,
        companyAddress: formatCompanyAddress(company),
        applicationId: application.id,
        candidateId: candidate.id,
        candidateName,
        email,
        phone: body.phone ?? null,
        location: body.location ?? null,
        jobTitle: job.title,
        department: job.department ?? null,
        employmentType: (job as any).employment_type ?? null,
        skills: Array.isArray(body.skills)
          ? body.skills
          : String(body.skills || "")
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean),
        experienceText: body.experience_text ?? null,
        education: body.education ?? null,
        previousCompany: body.previous_company ?? null,
        coverLetter: body.cover_letter ?? null,
        resumeFilename,
        resumeUrl,
        linkedinUrl: body.linkedin_url ?? null,
        appliedAt: application.applied_at || application.created_at,
      })
      emailStatus = mail.status
    } catch (err) {
      console.warn("[careers/applications] confirmation email failed", err)
      emailStatus = "failed"
    }

    return NextResponse.json(
      {
        success: true,
        application_id: application.id,
        job_title: job.title,
        email_status: emailStatus,
        message: "Application submitted successfully",
      },
      { status: 201 },
    )
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
