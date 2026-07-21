/**
 * Ensure an onboarding checklist exists after an offer is accepted.
 * Idempotent — returns existing active checklist when present.
 */

import { defaultOnboardingTasks } from "@/lib/recruitment/defaults"

export type EnsureOnboardingInput = {
  companyId: string
  applicationId?: string | null
  offerId?: string | null
  candidateId?: string | null
  candidateName: string
  jobTitle?: string | null
  department?: string | null
  startDate?: string | null
  actorId?: string | null
  autoStarted?: boolean
  managerName?: string | null
  buddyName?: string | null
}

export async function ensureOnboardingFromHire(
  client: any,
  input: EnsureOnboardingInput,
): Promise<{ checklist: any; created: boolean; warning?: string }> {
  if (input.applicationId) {
    const { data: existing } = await client
      .from("recruitment_onboarding_checklists")
      .select(`*, tasks:recruitment_onboarding_tasks(*)`)
      .eq("application_id", input.applicationId)
      .in("status", ["pending", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (existing) return { checklist: existing, created: false }
  }

  const startDate = input.startDate || new Date().toISOString().slice(0, 10)
  const payload: Record<string, unknown> = {
    company_id: input.companyId,
    application_id: input.applicationId || null,
    candidate_id: input.candidateId || null,
    candidate_name: input.candidateName,
    start_date: startDate,
    status: "in_progress",
    progress: 0,
    created_by: input.actorId || null,
    offer_id: input.offerId || null,
    job_title: input.jobTitle || null,
    department: input.department || null,
    stage: "welcome",
    stage_entered_at: new Date().toISOString(),
    auto_started: Boolean(input.autoStarted),
    hired_at: new Date().toISOString(),
    manager_name: input.managerName || null,
    buddy_name: input.buddyName || null,
    updated_at: new Date().toISOString(),
  }

  let { data: checklist, error } = await client
    .from("recruitment_onboarding_checklists")
    .insert(payload)
    .select()
    .single()

  // Fallback if 089 columns missing
  if (error && /column|schema cache|does not exist/i.test(error.message)) {
    const legacy = {
      company_id: input.companyId,
      application_id: input.applicationId || null,
      candidate_id: input.candidateId || null,
      candidate_name: input.candidateName,
      start_date: startDate,
      status: "in_progress",
      progress: 0,
      created_by: input.actorId || null,
      updated_at: new Date().toISOString(),
    }
    const retry = await client.from("recruitment_onboarding_checklists").insert(legacy).select().single()
    checklist = retry.data
    error = retry.error
    if (!error && checklist) {
      const tasks = defaultOnboardingTasks(startDate).map((t, i) => ({
        checklist_id: checklist.id,
        ...t,
        status: "pending",
        sort_order: i + 1,
      }))
      await client.from("recruitment_onboarding_tasks").insert(
        tasks.map(({ sort_order, stage, ...rest }: any) => rest),
      )
      return {
        checklist,
        created: true,
        warning: "Onboarding started (run scripts/089 for stages/notes enrichment)",
      }
    }
  }

  if (error) {
    // Unique index collision — fetch existing
    if (input.applicationId && /duplicate|unique/i.test(error.message)) {
      const { data: existing } = await client
        .from("recruitment_onboarding_checklists")
        .select(`*, tasks:recruitment_onboarding_tasks(*)`)
        .eq("application_id", input.applicationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (existing) return { checklist: existing, created: false }
    }
    throw new Error(error.message)
  }

  const tasks = defaultOnboardingTasks(startDate).map((t, i) => ({
    checklist_id: checklist.id,
    ...t,
    status: "pending",
    sort_order: i + 1,
  }))

  const { error: taskErr } = await client.from("recruitment_onboarding_tasks").insert(tasks)
  if (taskErr && /column|schema cache|sort_order|stage/i.test(taskErr.message)) {
    await client.from("recruitment_onboarding_tasks").insert(
      tasks.map(({ sort_order, stage, ...rest }: any) => rest),
    )
  } else if (taskErr) {
    console.warn("[onboarding] task insert:", taskErr.message)
  }

  try {
    await client.from("recruitment_onboarding_notes").insert({
      company_id: input.companyId,
      checklist_id: checklist.id,
      author_id: input.actorId || null,
      author_label: input.autoStarted ? "System" : "HR",
      note: input.autoStarted
        ? "Onboarding started automatically after offer acceptance."
        : "Onboarding checklist created.",
      stage: "welcome",
    })
  } catch {
    /* optional until 089 */
  }

  const { data: full } = await client
    .from("recruitment_onboarding_checklists")
    .select(`*, tasks:recruitment_onboarding_tasks(*)`)
    .eq("id", checklist.id)
    .maybeSingle()

  return { checklist: full || checklist, created: true }
}
