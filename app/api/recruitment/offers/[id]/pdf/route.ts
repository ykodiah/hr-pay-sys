/**
 * GET /api/recruitment/offers/[id]/pdf
 * Returns branded printable HTML (Print → Save as PDF).
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { renderOfferLetterHtml } from "@/lib/recruitment/offer-html"
import { asBenefitsList } from "@/lib/recruitment/offer-sync"
import { offerRespondUrl, ensurePersistedOfferCodes } from "@/lib/recruitment/offer-db"
import { getPublicSiteOrigin } from "@/lib/recruitment/public-origin"

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
    const client: any = await db()
    const authClient = await createClient()
    const sp = new URL(req.url).searchParams
    let companyId =
      sp.get("company_id") ||
      (await resolveCompanyId(authClient, user.isDemo ? null : user.id, user))?.companyId ||
      null

    const { data: offer, error } = await client
      .from("recruitment_offers")
      .select(
        `*, application:recruitment_applications(
          candidate:recruitment_candidates(candidate_name, email),
          job:recruitment_job_postings(title, department)
        )`,
      )
      .eq("id", id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    if (!companyId) companyId = offer.company_id
    if (offer.company_id !== companyId) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    const application = Array.isArray(offer.application) ? offer.application[0] : offer.application
    const candidate = Array.isArray(application?.candidate)
      ? application?.candidate[0]
      : application?.candidate
    const job = Array.isArray(application?.job) ? application?.job[0] : application?.job

    const { data: company } = await client
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .maybeSingle()

    const codes = await ensurePersistedOfferCodes(client, offer)
    const publicCode = codes.persisted ? codes.short_code : offer.id

    const candidateName =
      offer.candidate_name_snapshot || candidate?.candidate_name || "Candidate"
    const jobTitle = offer.job_title_snapshot || job?.title || "Role"
    const currency = offer.currency || "GHS"
    const salaryLabel = `${currency} ${Number(offer.salary || 0).toLocaleString("en-GH", {
      minimumFractionDigits: 2,
    })}`

    const html = renderOfferLetterHtml({
      company,
      candidateName,
      jobTitle,
      salaryLabel,
      startDate: offer.start_date,
      deadline: offer.acceptance_deadline,
      status: offer.status,
      letterText: offer.offer_letter_text || "No offer letter text available.",
      benefits: asBenefitsList(offer.benefits),
      respondUrl: offerRespondUrl(
        { id: offer.id, short_code: publicCode !== offer.id ? publicCode : offer.short_code },
        getPublicSiteOrigin(req.nextUrl.origin),
      ),
      autoPrint: sp.get("print") !== "0",
    })

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF failed" },
      { status: 500 },
    )
  }
}
