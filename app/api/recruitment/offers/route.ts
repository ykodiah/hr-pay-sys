/**
 * GET /api/recruitment/offers — list
 * PATCH /api/recruitment/offers — update letter/remuneration + actions
 *   actions: send | accept | reject | withdraw | regenerate_letter | polish_letter
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { buildRichOfferLetter, polishOfferLetterWithAi } from "@/lib/recruitment/build-offer-letter"
import { sendOfferDecisionEmail } from "@/lib/recruitment/offer-email"
import {
  asBenefitsList,
  ensureOfferCodes,
  logOfferEvent,
  syncApplicationForOfferAction,
} from "@/lib/recruitment/offer-sync"
import { buildOfferRespondUrl, getPublicSiteOrigin } from "@/lib/recruitment/public-origin"
import { formatCompanyAddress } from "@/lib/exports/company-branding"

function db() {
  try {
    return createServiceClient()
  } catch {
    return createClient()
  }
}

function flattenOffer(o: any) {
  const application = Array.isArray(o.application) ? o.application[0] : o.application
  const candidate = Array.isArray(application?.candidate)
    ? application?.candidate[0]
    : application?.candidate
  const job = Array.isArray(application?.job) ? application?.job[0] : application?.job
  return {
    ...o,
    candidate_name: o.candidate_name_snapshot || candidate?.candidate_name,
    candidate_email: o.candidate_email_snapshot || candidate?.email,
    job_title: o.job_title_snapshot || job?.title,
    department: o.department || job?.department,
    respond_url: o.short_code ? buildOfferRespondUrl(o.short_code) : null,
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const client: any = await db()
    const authClient = await createClient()
    let companyId =
      new URL(req.url).searchParams.get("company_id") ||
      (await resolveCompanyId(authClient, user.isDemo ? null : user.id, user))?.companyId ||
      null
    if (!companyId) return NextResponse.json({ error: "company_id required" }, { status: 400 })

    const { data, error } = await client
      .from("recruitment_offers")
      .select(
        `*, application:recruitment_applications(
          id, status, candidate:recruitment_candidates(id, candidate_name, email),
          job:recruitment_job_postings(id, title, department)
        )`,
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      offers: (data ?? []).map(flattenOffer),
      company_id: companyId,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const client: any = await db()
    const authClient = await createClient()
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })

    let companyId =
      body.company_id ||
      (await resolveCompanyId(authClient, user.isDemo ? null : user.id, user))?.companyId ||
      null

    const { data: current, error: findErr } = await client
      .from("recruitment_offers")
      .select(
        `*, application:recruitment_applications(
          id, status, candidate_id,
          candidate:recruitment_candidates(id, candidate_name, email),
          job:recruitment_job_postings(id, title, department, location)
        )`,
      )
      .eq("id", body.id)
      .maybeSingle()
    if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 })
    if (!current) return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    if (!companyId) companyId = current.company_id
    if (current.company_id !== companyId) {
      return NextResponse.json({ error: "Offer not found for this company" }, { status: 404 })
    }

    const application = Array.isArray(current.application) ? current.application[0] : current.application
    const candidate = Array.isArray(application?.candidate)
      ? application?.candidate[0]
      : application?.candidate
    const job = Array.isArray(application?.job) ? application?.job[0] : application?.job

    const codes = ensureOfferCodes(current)
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      short_code: codes.short_code,
      response_token: codes.response_token,
    }

    const fieldKeys = [
      "salary",
      "currency",
      "start_date",
      "terms",
      "status",
      "offer_letter_text",
      "acceptance_deadline",
      "working_hours",
      "probation_months",
      "notice_months",
      "signatory_name",
      "signatory_title",
      "department",
      "job_title_snapshot",
      "candidate_name_snapshot",
      "candidate_email_snapshot",
      "candidate_response_note",
      "withdrawn_reason",
      "ai_letter_notes",
      "remuneration",
    ] as const

    for (const key of fieldKeys) {
      if (body[key] !== undefined) patch[key] = body[key]
    }

    if (body.benefits !== undefined) {
      patch.benefits = asBenefitsList(body.benefits)
    }

    // Remuneration extras can arrive as array/string under remuneration_extras
    if (body.remuneration_extras !== undefined) {
      const extras = asBenefitsList(body.remuneration_extras)
      const existing =
        body.remuneration && typeof body.remuneration === "object"
          ? body.remuneration
          : current.remuneration && typeof current.remuneration === "object"
            ? current.remuneration
            : {}
      patch.remuneration = { ...existing, extras }
    }

    let emailResult: { ok: boolean; status: string; error?: string } | null = null
    const actorId = user.isDemo ? null : user.id
    const fromStatus = current.status

    if (body.action === "regenerate_letter" || body.action === "polish_letter") {
      const { data: company } = await client
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .maybeSingle()

      const salary = Number(body.salary ?? patch.salary ?? current.salary ?? 0)
      const currency = String(body.currency ?? patch.currency ?? current.currency ?? "GHS")
      const benefits = asBenefitsList(body.benefits ?? patch.benefits ?? current.benefits)
      const rem =
        (patch.remuneration as any) ||
        (typeof current.remuneration === "object" ? current.remuneration : {}) ||
        {}
      const extras = asBenefitsList(body.remuneration_extras ?? rem.extras)

      let letter = buildRichOfferLetter({
        candidateName:
          body.candidate_name_snapshot ||
          current.candidate_name_snapshot ||
          candidate?.candidate_name ||
          "Candidate",
        jobTitle: body.job_title_snapshot || current.job_title_snapshot || job?.title || "Role",
        department: body.department || current.department || job?.department,
        salary,
        currency,
        startDate: (body.start_date ?? patch.start_date ?? current.start_date) as string | null,
        acceptanceDeadline: (body.acceptance_deadline ??
          patch.acceptance_deadline ??
          current.acceptance_deadline) as string | null,
        benefits,
        terms: (body.terms ?? patch.terms ?? current.terms) as string | null,
        workingHours: (body.working_hours ?? patch.working_hours ?? current.working_hours) as string | null,
        probationMonths: Number(body.probation_months ?? patch.probation_months ?? current.probation_months ?? 3),
        noticeMonths: Number(body.notice_months ?? patch.notice_months ?? current.notice_months ?? 1),
        companyName: company?.name,
        companyAddress: formatCompanyAddress(company),
        signatoryName: (body.signatory_name ?? patch.signatory_name ?? current.signatory_name) as string | null,
        signatoryTitle: (body.signatory_title ?? patch.signatory_title ?? current.signatory_title) as string | null,
        remunerationExtras: extras,
      })

      if (body.action === "polish_letter" || body.polish) {
        const polished = await polishOfferLetterWithAi(letter, {
          candidateName: candidate?.candidate_name || "Candidate",
          jobTitle: job?.title || "Role",
          companyName: company?.name,
        })
        letter = polished.text
        patch.ai_letter_notes = polished.notes || polished.model
      }

      patch.offer_letter_text = letter
      patch.offer_letter_version = Number(current.offer_letter_version || 1) + 1
    }

    if (body.action === "send") {
      patch.status = "sent"
      patch.sent_at = new Date().toISOString()
      if (current.acceptance_deadline) {
        patch.expires_at = new Date(`${current.acceptance_deadline}T23:59:59.000Z`).toISOString()
      }

      const { data: company } = await client
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .maybeSingle()

      const respondUrl = buildOfferRespondUrl(
        codes.short_code,
        getPublicSiteOrigin(req.nextUrl.origin),
      )
      const toEmail =
        current.candidate_email_snapshot ||
        candidate?.email ||
        body.to_email ||
        ""
      const salary = Number(patch.salary ?? current.salary ?? 0)
      const currency = String(patch.currency ?? current.currency ?? "GHS")

      emailResult = await sendOfferDecisionEmail(client, {
        companyId,
        companyName: company?.name,
        offerId: current.id,
        applicationId: current.application_id,
        candidateId: application?.candidate_id || candidate?.id,
        candidateName:
          current.candidate_name_snapshot || candidate?.candidate_name || "Candidate",
        email: toEmail,
        jobTitle: current.job_title_snapshot || job?.title || "Role",
        salaryLabel: `${currency} ${salary.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`,
        startDate: (patch.start_date as string) || current.start_date,
        deadline: (patch.acceptance_deadline as string) || current.acceptance_deadline,
        respondUrl,
        letterExcerpt: String(patch.offer_letter_text || current.offer_letter_text || "").slice(0, 600),
      })

      patch.email_status = emailResult.status
      patch.last_email_at = new Date().toISOString()
    }

    if (body.action === "accept") {
      patch.status = "accepted"
      patch.responded_at = new Date().toISOString()
      patch.response_channel = "admin"
    }
    if (body.action === "reject") {
      patch.status = "rejected"
      patch.responded_at = new Date().toISOString()
      patch.response_channel = "admin"
    }
    if (body.action === "withdraw") {
      patch.status = "withdrawn"
      patch.withdrawn_at = new Date().toISOString()
      patch.withdrawn_reason = body.withdrawn_reason || body.notes || "Withdrawn by admin"
      patch.response_channel = "admin"
    }

    // Manual status override
    if (body.action === "set_status" && body.status) {
      patch.status = body.status
      patch.response_channel = "admin"
      if (["accepted", "rejected"].includes(body.status)) {
        patch.responded_at = new Date().toISOString()
      }
      if (body.status === "withdrawn") {
        patch.withdrawn_at = new Date().toISOString()
      }
    }

    const { data, error } = await client
      .from("recruitment_offers")
      .update(patch)
      .eq("id", body.id)
      .eq("company_id", companyId)
      .select(
        `*, application:recruitment_applications(
          id, status, candidate:recruitment_candidates(candidate_name, email),
          job:recruitment_job_postings(title, department)
        )`,
      )
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const action = body.action as string | undefined
    if (action === "send" || action === "accept" || action === "reject" || action === "withdraw") {
      await syncApplicationForOfferAction(client, {
        action,
        applicationId: data.application_id,
        actorId,
        notes:
          action === "send"
            ? `Offer sent to candidate${emailResult?.status ? ` (email: ${emailResult.status})` : ""}`
            : action === "accept"
              ? "Offer accepted (admin)"
              : action === "reject"
                ? "Offer rejected (admin)"
                : "Offer withdrawn (admin)",
      })
    }

    if (action === "set_status" && ["accepted", "rejected", "withdrawn", "sent"].includes(String(body.status))) {
      const mapped =
        body.status === "accepted"
          ? "accept"
          : body.status === "rejected"
            ? "reject"
            : body.status === "withdrawn"
              ? "withdraw"
              : "send"
      await syncApplicationForOfferAction(client, {
        action: mapped,
        applicationId: data.application_id,
        actorId,
        notes: `Offer status set to ${body.status} (admin)`,
      })
    }

    await logOfferEvent(client, {
      companyId,
      offerId: data.id,
      applicationId: data.application_id,
      eventType: action || "updated",
      actorType: action === "polish_letter" || action === "regenerate_letter" ? "ai" : "admin",
      actorId,
      fromStatus,
      toStatus: data.status,
      notes: body.notes || null,
      payload: {
        fields: Object.keys(patch),
        email_status: emailResult?.status,
      },
    })

    return NextResponse.json({
      success: true,
      offer: flattenOffer(data),
      email: emailResult,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
