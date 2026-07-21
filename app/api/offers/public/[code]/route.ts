/**
 * Public offer portal API — no auth.
 * GET  /api/offers/public/[code]
 * POST /api/offers/public/[code]  body: { action: accept|reject|withdraw, note?, token? }
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { asBenefitsList, logOfferEvent, syncApplicationForOfferAction } from "@/lib/recruitment/offer-sync"
import { loadOfferForPublic, OFFER_CORE_COLUMNS, isSchemaCacheError } from "@/lib/recruitment/offer-db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function db() {
  try {
    return createServiceClient()
  } catch {
    return createClient()
  }
}

function publicOfferView(offer: any, company: any) {
  return {
    id: offer.id,
    short_code: offer.short_code || offer.id,
    status: offer.status,
    salary: offer.salary,
    currency: offer.currency || "GHS",
    start_date: offer.start_date,
    acceptance_deadline: offer.acceptance_deadline,
    benefits: asBenefitsList(offer.benefits),
    terms: offer.terms,
    working_hours: offer.working_hours,
    probation_months: offer.probation_months,
    notice_months: offer.notice_months,
    offer_letter_text: offer.offer_letter_text,
    remuneration: offer.remuneration,
    job_title: offer.job_title_snapshot,
    department: offer.department,
    candidate_name: offer.candidate_name_snapshot,
    company: company
      ? {
          name: company.name,
          address: [company.address, company.city, company.region, company.country]
            .filter(Boolean)
            .join(", "),
          logo_url: company.logo_url,
        }
      : null,
    can_respond: ["sent", "draft"].includes(String(offer.status || "")),
    responded_at: offer.responded_at,
  }
}

async function safePublicUpdate(client: any, offerId: string, patch: Record<string, unknown>) {
  let { data, error } = await client
    .from("recruitment_offers")
    .update(patch)
    .eq("id", offerId)
    .select("*")
    .single()
  if (!error) return { data, error: null }

  if (!isSchemaCacheError(error.message)) return { data: null, error }

  const legacy: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(patch)) {
    if (OFFER_CORE_COLUMNS.has(k)) legacy[k] = v
  }
  const retry = await client
    .from("recruitment_offers")
    .update(legacy)
    .eq("id", offerId)
    .select("*")
    .single()
  return { data: retry.data, error: retry.error }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params
    const client: any = await db()
    const { offer, error } = await loadOfferForPublic(client, code)
    if (error?.message && !offer) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 })

    // Increment views (best-effort; ignore if column missing)
    await client
      .from("recruitment_offers")
      .update({
        public_views: Number(offer.public_views || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offer.id)

    const { data: company } = await client
      .from("companies")
      .select("id, name, address, city, region, country, logo_url")
      .eq("id", offer.company_id)
      .maybeSingle()

    await logOfferEvent(client, {
      companyId: offer.company_id,
      offerId: offer.id,
      applicationId: offer.application_id,
      eventType: "viewed",
      actorType: "candidate",
      actorLabel: offer.candidate_name_snapshot || "Candidate",
      fromStatus: offer.status,
      toStatus: offer.status,
    })

    // Enrich snapshots from application if missing
    let view = publicOfferView(offer, company)
    if (!view.candidate_name || !view.job_title) {
      const { data: app } = await client
        .from("recruitment_applications")
        .select(
          `candidate:recruitment_candidates(candidate_name, email), job:recruitment_job_postings(title, department)`,
        )
        .eq("id", offer.application_id)
        .maybeSingle()
      const candidate = Array.isArray(app?.candidate) ? app?.candidate[0] : app?.candidate
      const job = Array.isArray(app?.job) ? app?.job[0] : app?.job
      view = {
        ...view,
        candidate_name: view.candidate_name || candidate?.candidate_name || null,
        job_title: view.job_title || job?.title || null,
        department: view.department || job?.department || null,
      }
    }

    return NextResponse.json({ success: true, offer: view })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load offer" },
      { status: 500 },
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params
    const client: any = await db()
    const body = await req.json().catch(() => ({}))
    const action = String(body.action || "").toLowerCase()
    if (!["accept", "reject", "withdraw"].includes(action)) {
      return NextResponse.json(
        { error: "action must be accept, reject, or withdraw" },
        { status: 400 },
      )
    }

    const { offer, error } = await loadOfferForPublic(client, code)
    if (error?.message && !offer) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 })

    if (offer.response_token && body.token && body.token !== offer.response_token) {
      return NextResponse.json({ error: "Invalid response token" }, { status: 403 })
    }

    if (!["sent", "draft"].includes(String(offer.status || ""))) {
      return NextResponse.json(
        {
          error: `This offer is already ${offer.status}. Contact HR if you need help.`,
          offer: publicOfferView(offer, null),
        },
        { status: 409 },
      )
    }

    if (offer.acceptance_deadline) {
      const deadline = new Date(`${offer.acceptance_deadline}T23:59:59.000Z`)
      if (Number.isFinite(deadline.getTime()) && Date.now() > deadline.getTime() && action === "accept") {
        await safePublicUpdate(client, offer.id, {
          status: "expired",
          updated_at: new Date().toISOString(),
        })
        return NextResponse.json(
          { error: "This offer has expired. Please contact HR." },
          { status: 410 },
        )
      }
    }

    const note = String(body.note || body.candidate_response_note || "").trim() || null
    const now = new Date().toISOString()
    const patch: Record<string, unknown> = {
      updated_at: now,
      response_channel: "portal",
      candidate_response_note: note,
    }

    if (action === "accept") {
      patch.status = "accepted"
      patch.responded_at = now
    } else if (action === "reject") {
      patch.status = "rejected"
      patch.responded_at = now
    } else {
      patch.status = "withdrawn"
      patch.withdrawn_at = now
      patch.withdrawn_reason = note || "Withdrawn by candidate via portal"
    }

    const { data: updated, error: updErr } = await safePublicUpdate(client, offer.id, patch)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    await syncApplicationForOfferAction(client, {
      action: action as "accept" | "reject" | "withdraw",
      applicationId: offer.application_id,
      actorId: null,
      notes: `Candidate ${action} via offer portal${note ? `: ${note}` : ""}`,
    })

    await logOfferEvent(client, {
      companyId: offer.company_id,
      offerId: offer.id,
      applicationId: offer.application_id,
      eventType: action === "reject" ? "rejected" : action === "accept" ? "accepted" : "withdrawn",
      actorType: "candidate",
      actorLabel: offer.candidate_name_snapshot || "Candidate",
      fromStatus: offer.status,
      toStatus: updated.status,
      notes: note,
    })

    const { data: company } = await client
      .from("companies")
      .select("id, name, address, city, region, country, logo_url")
      .eq("id", offer.company_id)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      offer: publicOfferView(updated, company),
      message:
        action === "accept"
          ? "Thank you — you have accepted this offer. HR will contact you about onboarding."
          : action === "reject"
            ? "You have declined this offer. Thank you for your time."
            : "You have withdrawn your interest. Thank you for letting us know.",
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Response failed" },
      { status: 500 },
    )
  }
}
