import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const client = await createClient()
    let companyId = new URL(req.url).searchParams.get("company_id")
    if (!companyId) {
      companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId ?? null
    }
    if (!companyId) return NextResponse.json({ error: "company_id required" }, { status: 400 })

    const { data, error } = await client
      .from("recruitment_offers")
      .select(
        `*, application:recruitment_applications(
          id, candidate:recruitment_candidates(candidate_name, email),
          job:recruitment_job_postings(title, department)
        )`,
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const offers = (data ?? []).map((o: any) => {
      const application = Array.isArray(o.application) ? o.application[0] : o.application
      const candidate = Array.isArray(application?.candidate)
        ? application?.candidate[0]
        : application?.candidate
      const job = Array.isArray(application?.job) ? application?.job[0] : application?.job
      return {
        ...o,
        candidate_name: candidate?.candidate_name,
        candidate_email: candidate?.email,
        job_title: job?.title,
        department: job?.department,
      }
    })

    return NextResponse.json({ success: true, offers })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const client = await createClient()
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of ["salary", "currency", "start_date", "benefits", "terms", "status", "offer_letter_text", "acceptance_deadline"]) {
      if (body[key] !== undefined) patch[key] = body[key]
    }

    if (body.action === "send") {
      patch.status = "sent"
      patch.sent_at = new Date().toISOString()
    }
    if (body.action === "accept") {
      patch.status = "accepted"
      patch.responded_at = new Date().toISOString()
    }
    if (body.action === "reject") {
      patch.status = "rejected"
      patch.responded_at = new Date().toISOString()
    }
    if (body.action === "withdraw") patch.status = "withdrawn"

    const { data, error } = await client
      .from("recruitment_offers")
      .update(patch)
      .eq("id", body.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (body.action === "accept" && data.application_id) {
      await client
        .from("recruitment_applications")
        .update({ status: "offer", updated_at: new Date().toISOString() })
        .eq("id", data.application_id)
    }

    return NextResponse.json({ success: true, offer: data })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
