import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

/**
 * PATCH: Set medical requirements for an offer
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const body = await req.json()

    let companyId = body.company_id
    if (!companyId) {
      companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId
    }
    if (!companyId) return NextResponse.json({ error: "company_id required" }, { status: 400 })

    const { offer_id, medical_required, medical_required_before_offer_letter } = body

    if (!offer_id) {
      return NextResponse.json({ error: "offer_id required" }, { status: 400 })
    }

    // Verify offer exists and belongs to company
    const { data: offer, error: offerError } = await client
      .from("recruitment_offers")
      .select("id, application_id, medical_status")
      .eq("id", offer_id)
      .eq("company_id", companyId)
      .single()

    if (offerError || !offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    // Update offer with medical requirements
    const patch: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (medical_required !== undefined) patch.medical_required = medical_required
    if (medical_required_before_offer_letter !== undefined)
      patch.medical_required_before_offer_letter = medical_required_before_offer_letter

    if (medical_required === false) {
      patch.medical_status = "not_required"
    } else if (!offer.medical_status || offer.medical_status === "not_required") {
      patch.medical_status = "pending"
    }

    const { data: updatedOffer, error: updateError } = await client
      .from("recruitment_offers")
      .update(patch)
      .eq("id", offer_id)
      .select()
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      offer: updatedOffer,
      message: medical_required
        ? `Medical required ${
            medical_required_before_offer_letter ? "before" : "after"
          } offer letter`
        : "Medical not required",
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * GET: Retrieve medical requirements and status for an offer
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const offerId = new URL(req.url).searchParams.get("offer_id")

    if (!offerId) {
      return NextResponse.json({ error: "offer_id required" }, { status: 400 })
    }

    const { data: offer, error: offerError } = await client
      .from("recruitment_offers")
      .select(
        `id, company_id, medical_required, medical_required_before_offer_letter, 
         medical_status, medical_submitted_at, application_id`,
      )
      .eq("id", offerId)
      .single()

    if (offerError || !offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    // Fetch medical submissions if any
    const { data: submissions } = await client
      .from("recruitment_applicant_medical_submissions")
      .select("*")
      .eq("offer_id", offerId)
      .order("submitted_at", { ascending: false })

    return NextResponse.json({
      success: true,
      medical_requirements: {
        required: offer.medical_required,
        required_before_offer_letter: offer.medical_required_before_offer_letter,
        status: offer.medical_status,
        submitted_at: offer.medical_submitted_at,
      },
      submissions: submissions || [],
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
