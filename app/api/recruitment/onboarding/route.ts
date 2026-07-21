/**
 * GET/POST/PATCH /api/recruitment/onboarding
 * Modern staged onboarding checklists + notes.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { ensureOnboardingFromHire } from "@/lib/recruitment/ensure-onboarding"

const STAGES = [
  "welcome",
  "documents",
  "accounts",
  "payroll_setup",
  "orientation",
  "day_one",
  "completed",
] as const

function db() {
  try {
    return createServiceClient()
  } catch {
    return createClient()
  }
}

function sortTasks(tasks: any[] | null | undefined) {
  return [...(tasks || [])].sort((a, b) => {
    const ao = Number(a.sort_order ?? 999)
    const bo = Number(b.sort_order ?? 999)
    if (ao !== bo) return ao - bo
    return String(a.title || "").localeCompare(String(b.title || ""))
  })
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
      .from("recruitment_onboarding_checklists")
      .select(`*, tasks:recruitment_onboarding_tasks(*)`)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const checklists = (data ?? []).map((c: any) => ({
      ...c,
      tasks: sortTasks(c.tasks),
    }))

    return NextResponse.json({ success: true, checklists, stages: STAGES, company_id: companyId })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const client: any = await db()
    const authClient = await createClient()
    const body = await req.json()
    let companyId =
      body.company_id ||
      (await resolveCompanyId(authClient, user.isDemo ? null : user.id, user))?.companyId ||
      null
    if (!companyId || !body.candidate_name) {
      return NextResponse.json({ error: "company_id and candidate_name required" }, { status: 400 })
    }

    const result = await ensureOnboardingFromHire(client, {
      companyId,
      applicationId: body.application_id,
      offerId: body.offer_id,
      candidateId: body.candidate_id,
      candidateName: body.candidate_name,
      jobTitle: body.job_title,
      department: body.department,
      startDate: body.start_date,
      actorId: user.isDemo ? null : user.id,
      autoStarted: Boolean(body.auto_started),
      managerName: body.manager_name,
      buddyName: body.buddy_name,
    })

    return NextResponse.json(
      { success: true, checklist: result.checklist, created: result.created, warning: result.warning },
      { status: result.created ? 201 : 200 },
    )
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const client: any = await db()
    const body = await req.json()
    const actorId = user.isDemo ? null : user.id

    if (body.task_id) {
      const taskPatch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        status: body.status ?? "completed",
      }
      if (taskPatch.status === "completed") taskPatch.completed_at = new Date().toISOString()
      if (taskPatch.status !== "completed") taskPatch.completed_at = null

      const { data: task, error } = await client
        .from("recruitment_onboarding_tasks")
        .update(taskPatch)
        .eq("id", body.task_id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const { data: tasks } = await client
        .from("recruitment_onboarding_tasks")
        .select("status, stage")
        .eq("checklist_id", task.checklist_id)
      const total = tasks?.length ?? 0
      const done = (tasks ?? []).filter((t: any) => t.status === "completed" || t.status === "skipped").length
      const progress = total ? Math.round((done / total) * 100) : 0

      // Advance stage to first incomplete task stage, or completed
      const pending = (tasks ?? []).find((t: any) => t.status !== "completed" && t.status !== "skipped")
      const nextStage = progress >= 100 ? "completed" : pending?.stage || "welcome"

      const checklistPatch: Record<string, unknown> = {
        progress,
        status: progress >= 100 ? "completed" : "in_progress",
        updated_at: new Date().toISOString(),
        stage: nextStage,
        stage_entered_at: new Date().toISOString(),
      }

      await client
        .from("recruitment_onboarding_checklists")
        .update(checklistPatch)
        .eq("id", task.checklist_id)

      const { data: checklist } = await client
        .from("recruitment_onboarding_checklists")
        .select(`*, tasks:recruitment_onboarding_tasks(*)`)
        .eq("id", task.checklist_id)
        .maybeSingle()

      return NextResponse.json({
        success: true,
        task,
        progress,
        checklist: checklist
          ? { ...checklist, tasks: sortTasks(checklist.tasks) }
          : null,
      })
    }

    if (!body.id) return NextResponse.json({ error: "id or task_id required" }, { status: 400 })

    // Add progress note
    if (body.action === "add_note" && body.note) {
      const { data: checklist } = await client
        .from("recruitment_onboarding_checklists")
        .select("id, company_id, stage")
        .eq("id", body.id)
        .maybeSingle()
      if (!checklist) return NextResponse.json({ error: "Checklist not found" }, { status: 404 })

      await client.from("recruitment_onboarding_notes").insert({
        company_id: checklist.company_id,
        checklist_id: checklist.id,
        author_id: actorId,
        author_label: body.author_label || "HR",
        note: String(body.note).trim(),
        stage: body.stage || checklist.stage || null,
      })

      await client
        .from("recruitment_onboarding_checklists")
        .update({
          progress_notes: String(body.note).trim().slice(0, 2000),
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.id)

      const { data: notes } = await client
        .from("recruitment_onboarding_notes")
        .select("*")
        .eq("checklist_id", body.id)
        .order("created_at", { ascending: false })
        .limit(20)

      return NextResponse.json({ success: true, notes: notes ?? [] })
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.status) patch.status = body.status
    if (body.progress !== undefined) patch.progress = body.progress
    if (body.stage) {
      patch.stage = body.stage
      patch.stage_entered_at = new Date().toISOString()
    }
    if (body.manager_name !== undefined) patch.manager_name = body.manager_name
    if (body.buddy_name !== undefined) patch.buddy_name = body.buddy_name
    if (body.progress_notes !== undefined) patch.progress_notes = body.progress_notes
    if (body.action === "complete") {
      patch.status = "completed"
      patch.progress = 100
      patch.stage = "completed"
      patch.stage_entered_at = new Date().toISOString()
    }

    const { data, error } = await client
      .from("recruitment_onboarding_checklists")
      .update(patch)
      .eq("id", body.id)
      .select(`*, tasks:recruitment_onboarding_tasks(*)`)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      checklist: { ...data, tasks: sortTasks(data.tasks) },
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
