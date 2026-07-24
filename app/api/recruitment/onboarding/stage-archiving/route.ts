import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

/**
 * POST: Sign off and archive a stage
 */
export async function POST(req: NextRequest) {
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

    const { checklist_id, stage, signed_off_by, notes } = body

    if (!checklist_id || !stage) {
      return NextResponse.json({ error: "checklist_id and stage are required" }, { status: 400 })
    }

    // Fetch current checklist
    const { data: checklist, error: checklistError } = await client
      .from("recruitment_onboarding_checklists")
      .select("id, completed_stages, company_id")
      .eq("id", checklist_id)
      .single()

    if (checklistError || !checklist) {
      return NextResponse.json({ error: "Checklist not found" }, { status: 404 })
    }

    // Fetch tasks for this stage
    const { data: tasks } = await client
      .from("recruitment_onboarding_tasks")
      .select("id, task, status, completed_at")
      .eq("checklist_id", checklist_id)
      .eq("stage", stage)

    // Create stage summary
    const completedStages = Array.isArray(checklist.completed_stages)
      ? [...checklist.completed_stages]
      : []

    const stageSummary = {
      stage,
      signed_off_by: signed_off_by || (user.isDemo ? null : user.id),
      signed_off_at: new Date().toISOString(),
      tasks_count: tasks?.length || 0,
      tasks_completed: tasks?.filter((t: any) => t.status === "completed").length || 0,
      notes,
    }

    completedStages.push(stageSummary)

    // Update checklist with completed stage
    const { error: updateError } = await client
      .from("recruitment_onboarding_checklists")
      .update({
        completed_stages: completedStages,
        is_stage_archived: true,
        archive_reason: `Stage ${stage} signed off at ${new Date().toLocaleString()}`,
      })
      .eq("id", checklist_id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Create completed stages summary record
    const { data: summarRecord, error: summarError } = await client
      .from("recruitment_onboarding_completed_stages_summary")
      .insert({
        company_id: companyId,
        checklist_id,
        stage,
        signed_off_by: signed_off_by || (user.isDemo ? null : user.id),
        signed_off_at: new Date().toISOString(),
        tasks_summary: {
          total: tasks?.length || 0,
          completed: tasks?.filter((t: any) => t.status === "completed").length || 0,
          tasks: tasks || [],
        },
        notes,
      })
      .select()
      .single()

    if (summarError) return NextResponse.json({ error: summarError.message }, { status: 500 })

    return NextResponse.json(
      {
        success: true,
        archived_stage: stageSummary,
        summary_record: summarRecord,
        message: `Stage "${stage}" archived successfully`,
      },
      { status: 201 },
    )
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * GET: Fetch completed stages summary for a checklist
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const checklistId = new URL(req.url).searchParams.get("checklist_id")

    if (!checklistId) {
      return NextResponse.json({ error: "checklist_id required" }, { status: 400 })
    }

    // Fetch completed stages summary
    const { data: summaries, error } = await client
      .from("recruitment_onboarding_completed_stages_summary")
      .select("*, signed_off_by(first_name, last_name)")
      .eq("checklist_id", checklistId)
      .order("signed_off_at", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      completed_stages: summaries || [],
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
