import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

/**
 * GET: Fetch list of applicants in onboarding queue
 */
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

    // Fetch onboarding checklists in pending or in_progress status
    const { data: checklists, error } = await client
      .from("recruitment_onboarding_checklists")
      .select(
        `id, application_id, status, stage, queue_position, job_title, 
         department, stage_entered_at, completed_stages,
         application:recruitment_applications(
           id, candidate:recruitment_candidates(candidate_name, email)
         )`,
      )
      .eq("company_id", companyId)
      .in("status", ["pending", "in_progress"])
      .order("queue_position", { ascending: true })
      .order("created_at", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const queue = (checklists ?? []).map((item: any) => {
      const application = Array.isArray(item.application)
        ? item.application[0]
        : item.application
      const candidate = Array.isArray(application?.candidate)
        ? application?.candidate[0]
        : application?.candidate

      return {
        id: item.id,
        application_id: item.application_id,
        candidate_name: candidate?.candidate_name || "Unknown Candidate",
        candidate_email: candidate?.email,
        job_title: item.job_title,
        department: item.department,
        status: item.status,
        current_stage: item.stage,
        stage_entered_at: item.stage_entered_at,
        completed_stages: item.completed_stages || [],
        queue_position: item.queue_position,
      }
    })

    return NextResponse.json({ success: true, queue })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * PATCH: Reorder queue positions
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const body = await req.json()

    const { checklist_id, new_position } = body

    if (!checklist_id || new_position === undefined) {
      return NextResponse.json(
        { error: "checklist_id and new_position are required" },
        { status: 400 },
      )
    }

    const { data, error } = await client
      .from("recruitment_onboarding_checklists")
      .update({ queue_position: new_position })
      .eq("id", checklist_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      checklist: data,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
