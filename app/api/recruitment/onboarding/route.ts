import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { defaultOnboardingTasks } from "@/lib/recruitment/defaults"

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
      .from("recruitment_onboarding_checklists")
      .select(`*, tasks:recruitment_onboarding_tasks(*)`)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, checklists: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

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
    if (!companyId || !body.candidate_name) {
      return NextResponse.json({ error: "company_id and candidate_name required" }, { status: 400 })
    }

    const { data: checklist, error } = await client
      .from("recruitment_onboarding_checklists")
      .insert({
        company_id: companyId,
        application_id: body.application_id ?? null,
        candidate_id: body.candidate_id ?? null,
        candidate_name: body.candidate_name,
        start_date: body.start_date ?? new Date().toISOString().slice(0, 10),
        status: "in_progress",
        progress: 0,
        created_by: user.isDemo ? null : user.id,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const tasks = defaultOnboardingTasks(body.start_date).map((t) => ({
      checklist_id: checklist.id,
      ...t,
      status: "pending",
    }))
    await client.from("recruitment_onboarding_tasks").insert(tasks)

    return NextResponse.json({ success: true, checklist }, { status: 201 })
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

    if (body.task_id) {
      const taskPatch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        status: body.status ?? "completed",
      }
      if (taskPatch.status === "completed") taskPatch.completed_at = new Date().toISOString()

      const { data: task, error } = await client
        .from("recruitment_onboarding_tasks")
        .update(taskPatch)
        .eq("id", body.task_id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const { data: tasks } = await client
        .from("recruitment_onboarding_tasks")
        .select("status")
        .eq("checklist_id", task.checklist_id)
      const total = tasks?.length ?? 0
      const done = (tasks ?? []).filter((t) => t.status === "completed" || t.status === "skipped").length
      const progress = total ? Math.round((done / total) * 100) : 0
      await client
        .from("recruitment_onboarding_checklists")
        .update({
          progress,
          status: progress >= 100 ? "completed" : "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.checklist_id)

      return NextResponse.json({ success: true, task, progress })
    }

    if (!body.id) return NextResponse.json({ error: "id or task_id required" }, { status: 400 })
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.status) patch.status = body.status
    if (body.progress !== undefined) patch.progress = body.progress
    if (body.action === "complete") {
      patch.status = "completed"
      patch.progress = 100
    }

    const { data, error } = await client
      .from("recruitment_onboarding_checklists")
      .update(patch)
      .eq("id", body.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, checklist: data })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
