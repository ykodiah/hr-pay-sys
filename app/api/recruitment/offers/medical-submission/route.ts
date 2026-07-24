import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

/**
 * POST: Submit medical documents/form for an applicant
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser()
    const client = await createClient()

    // Accept both authenticated users and unauthenticated applicants
    const body = await req.json()

    let companyId = body.company_id
    if (!companyId && user) {
      companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId
    }
    if (!companyId) return NextResponse.json({ error: "company_id required" }, { status: 400 })

    const { offer_id, applicant_name, applicant_email, medical_file_path } = body

    if (!offer_id || !applicant_name || !applicant_email || !medical_file_path) {
      return NextResponse.json(
        { error: "offer_id, applicant_name, applicant_email, and medical_file_path are required" },
        { status: 400 },
      )
    }

    // Verify offer exists
    const { data: offer, error: offerError } = await client
      .from("recruitment_offers")
      .select("id, company_id, application_id, medical_required_before_offer_letter")
      .eq("id", offer_id)
      .eq("company_id", companyId)
      .single()

    if (offerError || !offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    // Get application if available
    let applicationId = offer.application_id
    let candidateId: string | null = null

    if (applicationId) {
      const { data: app } = await client
        .from("recruitment_applications")
        .select("candidate_id")
        .eq("id", applicationId)
        .single()
      candidateId = app?.candidate_id || null
    }

    // Create medical submission record
    const { data: submission, error: submissionError } = await client
      .from("recruitment_applicant_medical_submissions")
      .insert({
        company_id: companyId,
        offer_id,
        application_id: applicationId,
        candidate_id: candidateId,
        applicant_name,
        applicant_email,
        medical_file_path,
        status: "pending",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (submissionError) {
      return NextResponse.json({ error: submissionError.message }, { status: 500 })
    }

    // Update offer with medical submission status
    const { error: updateError } = await client
      .from("recruitment_offers")
      .update({
        medical_status: "submitted",
        medical_submitted_at: new Date().toISOString(),
        medical_file_path,
      })
      .eq("id", offer_id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // If medical not required before offer letter, auto-add to onboarding checklist
    if (!offer.medical_required_before_offer_letter && applicationId) {
      const { data: onboarding } = await client
        .from("recruitment_onboarding_checklists")
        .select("id")
        .eq("application_id", applicationId)
        .eq("status", "in_progress")
        .single()

      if (onboarding) {
        // Add task to onboarding if needed
        const { error: taskError } = await client
          .from("recruitment_onboarding_tasks")
          .insert({
            checklist_id: onboarding.id,
            company_id: companyId,
            task: "Submit Medical Documents",
            stage: "medical",
            status: "completed",
            completed_at: new Date().toISOString(),
            sort_order: 20,
          })
          .single()
        // Ignore errors if task already exists
      }
    }

    return NextResponse.json(
      {
        success: true,
        submission,
        message: "Medical documents submitted successfully",
      },
      { status: 201 },
    )
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * GET: Fetch medical submissions for an offer
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

    const { data: submissions, error } = await client
      .from("recruitment_applicant_medical_submissions")
      .select("*, verified_by(first_name, last_name)")
      .eq("offer_id", offerId)
      .order("submitted_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * PATCH: Update medical submission status (approve/reject)
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const body = await req.json()

    const { submission_id, status, verification_notes } = body

    if (!submission_id || !status) {
      return NextResponse.json({ error: "submission_id and status are required" }, { status: 400 })
    }

    if (!["pending", "approved", "rejected", "resubmit_required"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    const patch: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
      verified_by: user.isDemo ? null : user.id,
    }

    if (verification_notes) patch.verification_notes = verification_notes

    const { data, error } = await client
      .from("recruitment_applicant_medical_submissions")
      .update(patch)
      .eq("id", submission_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      submission: data,
      message: `Medical submission marked as ${status}`,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
