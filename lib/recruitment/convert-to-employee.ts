/**
 * Convert a completed (or in-progress) onboarding hire into an employees row.
 * Preview → confirm. Idempotent. Never invents bank/SSNIT as "Pending" unless asked.
 */

import { normalizeEmployeeStatus } from "@/lib/employees/status"

export type HireDraft = {
  first_name: string
  last_name: string
  other_names?: string | null
  personal_email: string | null
  corporate_email: string | null
  phone: string | null
  position: string | null
  department: string | null
  location: string | null
  date_of_joining: string | null
  contract_type: string
  probation_period: number | null
  notice_period: string | null
  educational_level: string | null
  status: string
  suggested_monthly_salary: number | null
  currency: string
  source: {
    checklist_id: string
    application_id: string | null
    offer_id: string | null
    candidate_id: string | null
  }
}

function splitName(full: string) {
  const parts = String(full || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return { first_name: "New", last_name: "Hire", other_names: null as string | null }
  if (parts.length === 1) return { first_name: parts[0], last_name: parts[0], other_names: null }
  if (parts.length === 2) return { first_name: parts[0], last_name: parts[1], other_names: null }
  return {
    first_name: parts[0],
    last_name: parts[parts.length - 1],
    other_names: parts.slice(1, -1).join(" "),
  }
}

async function allocateEmployeeCode(client: any, companyId: string, prefix = "EMP") {
  const clean = String(prefix || "EMP")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4)
    .padEnd(4, "X")
  const { data: rpcCode } = await client.rpc("next_employee_code", {
    p_company_id: companyId,
    p_prefix: clean,
  })
  if (rpcCode) return String(rpcCode)

  const { data: existing } = await client
    .from("employees")
    .select("employee_id")
    .eq("company_id", companyId)
  let max = 0
  for (const row of existing ?? []) {
    const code = String(row.employee_id || "")
    if (!code.startsWith(clean)) continue
    const n = Number(code.slice(clean.length))
    if (Number.isFinite(n) && n > max) max = n
  }
  return `${clean}${String(max + 1).padStart(4, "0")}`
}

export async function buildHireDraftFromChecklist(
  client: any,
  checklistId: string,
  companyId: string,
): Promise<{
  checklist: any
  draft: HireDraft
  conflicts: { existing_employee?: any; already_converted?: boolean }
  missing_fields: string[]
}> {
  const { data: checklist, error } = await client
    .from("recruitment_onboarding_checklists")
    .select("*")
    .eq("id", checklistId)
    .eq("company_id", companyId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!checklist) throw new Error("Onboarding checklist not found")

  let candidate: any = null
  let offer: any = null
  let application: any = null

  if (checklist.application_id) {
    const { data: app } = await client
      .from("recruitment_applications")
      .select(
        `*, candidate:recruitment_candidates(*), job:recruitment_job_postings(id, title, department, location)`,
      )
      .eq("id", checklist.application_id)
      .maybeSingle()
    application = app
    candidate = Array.isArray(app?.candidate) ? app?.candidate[0] : app?.candidate
  }

  if (checklist.offer_id) {
    const { data: o } = await client
      .from("recruitment_offers")
      .select("*")
      .eq("id", checklist.offer_id)
      .maybeSingle()
    offer = o
  } else if (checklist.application_id) {
    const { data: o } = await client
      .from("recruitment_offers")
      .select("*")
      .eq("application_id", checklist.application_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    offer = o
  }

  if (!candidate && checklist.candidate_id) {
    const { data: c } = await client
      .from("recruitment_candidates")
      .select("*")
      .eq("id", checklist.candidate_id)
      .maybeSingle()
    candidate = c
  }

  const fullName =
    checklist.candidate_name ||
    candidate?.candidate_name ||
    offer?.candidate_name_snapshot ||
    "New Hire"
  const names = splitName(fullName)
  const email = String(candidate?.email || offer?.candidate_email_snapshot || "")
    .trim()
    .toLowerCase() || null
  const job = Array.isArray(application?.job) ? application?.job[0] : application?.job

  const draft: HireDraft = {
    first_name: names.first_name,
    last_name: names.last_name,
    other_names: names.other_names,
    personal_email: email,
    corporate_email: null,
    phone: candidate?.phone || null,
    position: checklist.job_title || offer?.job_title_snapshot || job?.title || null,
    department: checklist.department || offer?.department || job?.department || null,
    location: candidate?.location || job?.location || null,
    date_of_joining: checklist.start_date || offer?.start_date || null,
    contract_type: "Permanent",
    probation_period: offer?.probation_months != null ? Number(offer.probation_months) : 3,
    notice_period: offer?.notice_months != null ? `${offer.notice_months} month(s)` : null,
    educational_level: candidate?.education || null,
    status: "Active",
    suggested_monthly_salary: offer?.salary != null ? Number(offer.salary) : null,
    currency: offer?.currency || "GHS",
    source: {
      checklist_id: checklist.id,
      application_id: checklist.application_id || null,
      offer_id: offer?.id || checklist.offer_id || null,
      candidate_id: checklist.candidate_id || candidate?.id || null,
    },
  }

  const missing_fields: string[] = []
  if (!draft.first_name || !draft.last_name) missing_fields.push("name")
  if (!draft.personal_email && !draft.corporate_email) missing_fields.push("email")
  if (!draft.position) missing_fields.push("position")
  if (!draft.department) missing_fields.push("department")
  if (!draft.date_of_joining) missing_fields.push("start_date")

  const conflicts: { existing_employee?: any; already_converted?: boolean } = {}
  if (checklist.employee_id) {
    conflicts.already_converted = true
    const { data: emp } = await client
      .from("employees")
      .select("id, employee_id, first_name, last_name, personal_email, corporate_email, status")
      .eq("id", checklist.employee_id)
      .maybeSingle()
    if (emp) conflicts.existing_employee = emp
  } else if (email) {
    const { data: byPersonal } = await client
      .from("employees")
      .select("id, employee_id, first_name, last_name, personal_email, corporate_email, status")
      .eq("company_id", companyId)
      .ilike("personal_email", email)
      .limit(1)
      .maybeSingle()
    const { data: byCorporate } = !byPersonal
      ? await client
          .from("employees")
          .select("id, employee_id, first_name, last_name, personal_email, corporate_email, status")
          .eq("company_id", companyId)
          .ilike("corporate_email", email)
          .limit(1)
          .maybeSingle()
      : { data: null }
    conflicts.existing_employee = byPersonal || byCorporate || undefined
  }

  return { checklist, draft, conflicts, missing_fields }
}

export async function convertChecklistToEmployee(
  client: any,
  input: {
    companyId: string
    checklistId: string
    actorId?: string | null
    overrides?: Partial<HireDraft> & { corporate_email?: string | null }
    /** Opt-in only — avoids Pending bank/SSNIT traps */
    include_payroll?: boolean
    link_existing?: boolean
  },
) {
  const preview = await buildHireDraftFromChecklist(client, input.checklistId, input.companyId)
  const { checklist, draft: base, conflicts } = preview

  // Idempotent: already linked
  if (checklist.employee_id) {
    const { data: emp } = await client
      .from("employees")
      .select("*")
      .eq("id", checklist.employee_id)
      .maybeSingle()
    return {
      action: "already_converted" as const,
      employee: emp,
      checklist,
      draft: base,
    }
  }

  const draft = { ...base, ...(input.overrides || {}) }
  if (!draft.first_name || !draft.last_name) {
    throw new Error("first_name and last_name are required to create an employee")
  }

  // Link existing by email (secure default when duplicate found)
  if (conflicts.existing_employee) {
    if (input.link_existing === false) {
      throw new Error(
        `An employee with this email already exists (${conflicts.existing_employee.employee_id}). Link the existing record instead.`,
      )
    }
    const existingId = conflicts.existing_employee.id
    await client
      .from("recruitment_onboarding_checklists")
      .update({
        employee_id: existingId,
        status: "completed",
        progress: 100,
        stage: "completed",
        converted_at: new Date().toISOString(),
        converted_by: input.actorId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", checklist.id)
      .eq("company_id", input.companyId)

    await logConversion(client, {
      companyId: input.companyId,
      checklist,
      employeeId: existingId,
      action: "linked_existing",
      actorId: input.actorId,
      draft,
    })

    await syncOnboardingArtifactsToEmployee(client, {
      companyId: input.companyId,
      checklistId: checklist.id,
      employeeId: existingId,
      employeeName:
        `${conflicts.existing_employee.first_name || ""} ${conflicts.existing_employee.last_name || ""}`.trim() ||
        draft.first_name + " " + draft.last_name,
      actorId: input.actorId,
    })

    const { data: emp } = await client.from("employees").select("*").eq("id", existingId).maybeSingle()
    return { action: "linked_existing" as const, employee: emp, checklist, draft }
  }

  const employeeCode = await allocateEmployeeCode(client, input.companyId)
  const fullName = `${draft.first_name} ${draft.other_names || ""} ${draft.last_name}`
    .replace(/\s+/g, " ")
    .trim()

  const employeePayload = {
    company_id: input.companyId,
    employee_id: employeeCode,
    prefix: "EMP",
    first_name: draft.first_name,
    other_names: draft.other_names || null,
    last_name: draft.last_name,
    full_name: fullName,
    display_name: fullName,
    personal_email: draft.personal_email || null,
    corporate_email: draft.corporate_email || null,
    phone: draft.phone || null,
    position: draft.position || null,
    department: draft.department || null,
    location: draft.location || null,
    status: normalizeEmployeeStatus(draft.status || "Active"),
    contract_type: draft.contract_type || "Permanent",
    date_of_joining: draft.date_of_joining || null,
    probation_period: draft.probation_period,
    notice_period: draft.notice_period || null,
    educational_level: draft.educational_level || null,
    updated_at: new Date().toISOString(),
  }

  const { data: created, error } = await client
    .from("employees")
    .insert(employeePayload)
    .select()
    .single()
  if (error) throw new Error(error.message)

  if (input.include_payroll && draft.suggested_monthly_salary != null && draft.suggested_monthly_salary > 0) {
    const monthly = Number(draft.suggested_monthly_salary)
    await client.from("employee_financial").insert({
      employee_id: created.id,
      monthly_salary: monthly,
      annual_salary: monthly * 12,
      // Do NOT invent Pending bank/SSNIT — leave blank for HR payroll setup
      bank_name: null,
      bank_account_number: null,
      ssnit_number: null,
    })
  }

  await client
    .from("recruitment_onboarding_checklists")
    .update({
      employee_id: created.id,
      status: "completed",
      progress: 100,
      stage: "completed",
      converted_at: new Date().toISOString(),
      converted_by: input.actorId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", checklist.id)
    .eq("company_id", input.companyId)

  await logConversion(client, {
    companyId: input.companyId,
    checklist,
    employeeId: created.id,
    action: "created",
    actorId: input.actorId,
    draft,
  })

  // Attach onboarding vault docs + typed payroll fields to the new employee card
  await syncOnboardingArtifactsToEmployee(client, {
    companyId: input.companyId,
    checklistId: checklist.id,
    employeeId: created.id,
    employeeName: fullName,
    actorId: input.actorId,
  })

  try {
    await client.from("recruitment_onboarding_notes").insert({
      company_id: input.companyId,
      checklist_id: checklist.id,
      author_id: input.actorId || null,
      author_label: "HR",
      note: `Employee record ${employeeCode} created from onboarding.`,
      stage: "completed",
    })
  } catch {
    /* optional */
  }

  return { action: "created" as const, employee: created, checklist, draft }
}

/** Link vault docs collected during onboarding onto the employee record. */
export async function syncOnboardingArtifactsToEmployee(
  client: any,
  input: {
    companyId: string
    checklistId: string
    employeeId: string
    employeeName: string
    actorId?: string | null
  },
) {
  try {
    // Point checklist-linked vault rows at the employee
    await client
      .from("document_vault")
      .update({
        employee_id: input.employeeId,
        employee_name: input.employeeName,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", input.companyId)
      .eq("checklist_id", input.checklistId)

    const { data: tasks } = await client
      .from("recruitment_onboarding_tasks")
      .select("id, title, vault_document_id, document_type, attachment_url, attachment_name, response_data")
      .eq("checklist_id", input.checklistId)

    for (const task of tasks || []) {
      if (task.vault_document_id) {
        await client
          .from("document_vault")
          .update({
            employee_id: input.employeeId,
            employee_name: input.employeeName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", task.vault_document_id)

        try {
          await client.from("employee_documents").upsert(
            {
              employee_id: input.employeeId,
              document_type: task.document_type || "onboarding-document",
              document_name: task.attachment_name || task.title,
              file_name: task.attachment_name || task.title,
              file_path: task.attachment_url,
              file_url: task.attachment_url,
              upload_date: new Date().toISOString(),
              uploaded_by: input.actorId || null,
              notes: `Synced from onboarding: ${task.title}`,
              vault_document_id: task.vault_document_id,
            },
            { onConflict: "employee_id,document_type" },
          )
        } catch {
          /* unique/schema optional */
        }
      }

      const rd = task.response_data || {}
      if (rd.bank_name || rd.account_number || rd.ssnit_number) {
        const { data: existingFin } = await client
          .from("employee_financial")
          .select("id")
          .eq("employee_id", input.employeeId)
          .maybeSingle()
        const finPayload = {
          bank_name: rd.bank_name || null,
          bank_account_number: rd.account_number || null,
          account_name: rd.account_name || null,
          ssnit_number: rd.ssnit_number || null,
        }
        if (existingFin?.id) {
          await client.from("employee_financial").update(finPayload).eq("id", existingFin.id)
        } else {
          await client.from("employee_financial").insert({
            employee_id: input.employeeId,
            ...finPayload,
          })
        }
      }
    }
  } catch (err) {
    console.warn("[hire-convert] artifact sync skipped", err)
  }
}

async function logConversion(
  client: any,
  input: {
    companyId: string
    checklist: any
    employeeId: string
    action: string
    actorId?: string | null
    draft: HireDraft
  },
) {
  try {
    await client.from("recruitment_hire_conversions").insert({
      company_id: input.companyId,
      checklist_id: input.checklist.id,
      application_id: input.checklist.application_id || input.draft.source.application_id,
      offer_id: input.checklist.offer_id || input.draft.source.offer_id,
      candidate_id: input.checklist.candidate_id || input.draft.source.candidate_id,
      employee_id: input.employeeId,
      action: input.action,
      actor_id: input.actorId || null,
      payload: {
        draft: input.draft,
      },
    })
  } catch (err) {
    console.warn("[hire-convert] audit log skipped", err)
  }
}
