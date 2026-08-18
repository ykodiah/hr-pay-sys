import { createServiceClient } from "@/lib/supabase/server"
import {
  EMPLOYEE_UPDATE_FIELDS,
  FINANCIAL_UPDATE_FIELDS,
  ORG_TRANSFER_FIELDS,
  ORG_TRANSFER_OPTIONAL_FIELDS,
  buildDiffs,
  canReverseEvent,
  coerceFieldValue,
  coercePatch,
  toEffectiveDate,
  type DiffRow,
} from "@/lib/employees/audit-fields"
import { normalizeEmployeeStatus } from "@/lib/employees/status"

export type AuditActor = {
  userId?: string | null
  name?: string | null
  email?: string | null
  role?: string | null
}

async function resolveActor(
  service: any,
  companyId: string,
  actor: AuditActor,
): Promise<Required<Pick<AuditActor, "userId" | "name" | "email" | "role">>> {
  let name = actor.name || null
  let email = actor.email || null
  let role = actor.role || null

  if (actor.userId) {
    const { data: emp } = await service
      .from("employees")
      .select("id, first_name, last_name, full_name, display_name, special_role, email, corporate_email, personal_email, user_id")
      .eq("company_id", companyId)
      .or(`user_id.eq.${actor.userId},id.eq.${actor.userId}`)
      .limit(1)
      .maybeSingle()

    if (emp) {
      name =
        name ||
        emp.display_name ||
        emp.full_name ||
        `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
      email = email || emp.corporate_email || emp.personal_email || emp.email || null
      role = role || emp.special_role || null
    }
  }

  return {
    userId: actor.userId || null,
    name: name || email || "System",
    email: email || null,
    role: role || null,
  }
}

export async function recordEmployeeAudit(input: {
  companyId: string
  employeeId: string
  eventType: string
  source: string
  reason?: string | null
  summary?: string | null
  actor: AuditActor
  diffs: DiffRow[]
  metadata?: Record<string, any>
  transferId?: string | null
  reversesEventId?: string | null
}) {
  if (!input.diffs.length && input.eventType === "update") {
    return { event: null, skipped: true as const }
  }

  const service = createServiceClient()
  const actor = await resolveActor(service, input.companyId, input.actor)

  const { data: event, error } = await service
    .from("employee_audit_events")
    .insert({
      company_id: input.companyId,
      employee_id: input.employeeId,
      event_type: input.eventType,
      source: input.source,
      reason: input.reason || null,
      actor_user_id: actor.userId,
      actor_name: actor.name,
      actor_email: actor.email,
      actor_role: actor.role,
      summary:
        input.summary ||
        `${input.eventType}: ${input.diffs.length} field change(s)`,
      metadata: input.metadata || {},
      transfer_id: input.transferId || null,
      reverses_event_id: input.reversesEventId || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (input.diffs.length) {
    const rows = input.diffs.map((d) => ({
      event_id: event.id,
      company_id: input.companyId,
      employee_id: input.employeeId,
      entity: d.entity,
      field_name: d.field_name,
      field_label: d.field_label,
      old_value: d.old_value,
      new_value: d.new_value,
      sensitivity: d.sensitivity,
    }))
    const { error: dErr } = await service.from("employee_audit_diffs").insert(rows)
    if (dErr) throw new Error(dErr.message)
  }

  return { event, skipped: false as const }
}

export async function listEmployeeAuditEvents(input: {
  companyId: string
  employeeId?: string | null
  eventType?: string | null
  limit?: number
}) {
  const service = createServiceClient()
  let query = service
    .from("employee_audit_events")
    .select(
      `*, employees!employee_audit_events_employee_id_fkey(id, first_name, last_name, full_name, display_name, employee_id, department)`,
    )
    .eq("company_id", input.companyId)
    .order("created_at", { ascending: false })
    .limit(Math.min(200, input.limit || 50))

  if (input.employeeId) query = query.eq("employee_id", input.employeeId)
  if (input.eventType && input.eventType !== "all") query = query.eq("event_type", input.eventType)

  const { data, error } = await query
  if (error) {
    const fb = await service
      .from("employee_audit_events")
      .select("*")
      .eq("company_id", input.companyId)
      .order("created_at", { ascending: false })
      .limit(Math.min(200, input.limit || 50))
    if (fb.error) throw new Error(fb.error.message)
    let rows: any[] = fb.data || []
    if (input.employeeId) rows = rows.filter((r: any) => r.employee_id === input.employeeId)
    if (input.eventType && input.eventType !== "all") {
      rows = rows.filter((r: any) => r.event_type === input.eventType)
    }
    return rows
  }

  return (data || []).map((r: any) => ({
    ...r,
    employee_name: r.employees
      ? r.employees.display_name ||
        r.employees.full_name ||
        `${r.employees.first_name || ""} ${r.employees.last_name || ""}`.trim()
      : null,
    employee_code: r.employees?.employee_id || null,
  }))
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function resolveDisplayValue(
  service: any,
  companyId: string,
  fieldName: string,
  value: string | null,
): Promise<string | null> {
  if (value == null || value === "") return value
  if (!UUID_RE.test(value)) return value

  if (
    fieldName === "direct_supervisor" ||
    fieldName === "head_of_department" ||
    fieldName === "employee_id"
  ) {
    const { data } = await service
      .from("employees")
      .select("id, first_name, last_name, full_name, display_name, employee_id")
      .eq("company_id", companyId)
      .eq("id", value)
      .maybeSingle()
    if (data) {
      const name =
        data.display_name ||
        data.full_name ||
        `${data.first_name || ""} ${data.last_name || ""}`.trim()
      return data.employee_id ? `${name} (${data.employee_id})` : name
    }
  }

  if (fieldName === "subsidiary_id") {
    const { data } = await service
      .from("subsidiaries")
      .select("id, name")
      .eq("id", value)
      .maybeSingle()
    if (data?.name) return data.name
  }

  return value
}

export async function getEmployeeAuditEvent(companyId: string, eventId: string) {
  const service = createServiceClient()
  const { data: event, error } = await service
    .from("employee_audit_events")
    .select("*")
    .eq("id", eventId)
    .eq("company_id", companyId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!event) return null

  const { data: diffs } = await service
    .from("employee_audit_diffs")
    .select("*")
    .eq("event_id", eventId)
    .order("field_name")

  const { data: emp } = await service
    .from("employees")
    .select("id, first_name, last_name, full_name, display_name, employee_id, department")
    .eq("id", event.employee_id)
    .maybeSingle()

  const resolvedDiffs = []
  for (const d of diffs || []) {
    const old_display = await resolveDisplayValue(service, companyId, d.field_name, d.old_value)
    const new_display = await resolveDisplayValue(service, companyId, d.field_name, d.new_value)
    resolvedDiffs.push({
      ...d,
      old_value: old_display,
      new_value: new_display,
      old_raw: d.old_value,
      new_raw: d.new_value,
    })
  }

  return {
    ...event,
    diffs: resolvedDiffs,
    employee_name: emp
      ? emp.display_name || emp.full_name || `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
      : null,
    employee_code: emp?.employee_id || null,
  }
}

export async function applyGovernedEmployeeUpdate(input: {
  companyId: string
  employeeId: string
  patch: Record<string, any>
  financial?: Record<string, any> | null
  reason: string
  actor: AuditActor
  source?: string
  effectiveDate?: string | null
  allowances?: any[] | null
  documents?: any[] | null
}) {
  if (!input.reason?.trim()) throw new Error("Reason is required for employee data updates")
  const effectiveDate = toEffectiveDate(input.effectiveDate)

  const service = createServiceClient()
  const { data: before, error } = await service
    .from("employees")
    .select("*")
    .eq("id", input.employeeId)
    .eq("company_id", input.companyId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!before) throw new Error("Employee not found")

  const { data: beforeFin } = await service
    .from("employee_financial")
    .select("*")
    .eq("employee_id", input.employeeId)
    .maybeSingle()

  const empPatch: Record<string, any> = { updated_at: new Date().toISOString() }
  for (const key of EMPLOYEE_UPDATE_FIELDS) {
    if (input.patch[key] === undefined) continue
    empPatch[key] =
      key === "status"
        ? normalizeEmployeeStatus(input.patch[key])
        : coerceFieldValue(key, input.patch[key])
  }
  // Block org fields even if someone sneaks them in
  for (const key of ORG_TRANSFER_FIELDS) {
    delete empPatch[key]
  }

  if (input.patch.first_name || input.patch.last_name) {
    empPatch.full_name =
      input.patch.full_name ||
      input.patch.display_name ||
      `${input.patch.first_name ?? before.first_name ?? ""} ${input.patch.last_name ?? before.last_name ?? ""}`.trim()
  }

  const empDiffs = buildDiffs(before, empPatch, EMPLOYEE_UPDATE_FIELDS, "employee")

  let finDiffs: DiffRow[] = []
  const finPayload: Record<string, any> | null = input.financial
    ? { ...input.financial, employee_id: input.employeeId, updated_at: new Date().toISOString() }
    : null

  if (finPayload) {
    const cleaned: Record<string, any> = { employee_id: input.employeeId, updated_at: finPayload.updated_at }
    for (const key of FINANCIAL_UPDATE_FIELDS) {
      if (finPayload[key] !== undefined) cleaned[key] = coerceFieldValue(key, finPayload[key])
    }
    if (cleaned.monthly_salary != null && cleaned.annual_salary == null) {
      cleaned.annual_salary = Number(cleaned.monthly_salary) * 12
    }
    finDiffs = buildDiffs(beforeFin || {}, cleaned, FINANCIAL_UPDATE_FIELDS, "financial")

    if (finDiffs.length) {
      const { error: finErr } = await service
        .from("employee_financial")
        .upsert(cleaned, { onConflict: "employee_id" })
      if (finErr) {
        const retry = await service.from("employee_financial").upsert(cleaned)
        if (retry.error) throw new Error(retry.error.message)
      }
    }
  }

  const allDiffs: DiffRow[] = [...empDiffs, ...finDiffs]
  const hasAllowanceUpdate = Array.isArray(input.allowances)
  const hasDocumentUpdate = Array.isArray(input.documents) && input.documents.some(
    (d: any) => d.documentType || d.document_type || d.type,
  )

  if (!allDiffs.length && !hasAllowanceUpdate && !hasDocumentUpdate) {
    return { employee: before, diffs: [], event: null, message: "No changes detected" }
  }

  const { data: updated, error: upErr } = await service
    .from("employees")
    .update(empPatch)
    .eq("id", input.employeeId)
    .eq("company_id", input.companyId)
    .select()
    .single()
  if (upErr) throw new Error(upErr.message)

  if (input.actor.userId) {
    await service
      .from("employees")
      .update({ updated_by: input.actor.userId })
      .eq("id", input.employeeId)
  }

  // Allowances replace (optional)
  if (hasAllowanceUpdate) {
    await service.from("employee_allowances").delete().eq("employee_id", input.employeeId)
    const rows = (input.allowances || []).map((a: any) => ({
      employee_id: input.employeeId,
      allowance_id: a.id && String(a.id).length > 20 ? a.id : null,
      code: a.code ?? null,
      description: a.description ?? a.name ?? null,
      taxable: Boolean(a.taxable),
      recurring: a.recurring !== false,
      amount: Number(a.amount ?? 0),
      percentage: Number(a.percentage ?? 0),
      calculation_type: String(a.calculationType || a.calculation_type || "amount").toUpperCase(),
      effective_date: a.effectiveDate || a.effective_date || effectiveDate,
      end_date: a.endDate || a.end_date || null,
      is_active: true,
    }))
    if (rows.length) await service.from("employee_allowances").insert(rows)
    allDiffs.push({
      entity: "employee",
      field_name: "allowances",
      field_label: "Allowances",
      old_value: "(previous set)",
      new_value: `${rows.length} allowance(s) from ${effectiveDate}`,
      sensitivity: "hard",
    })
  }

  if (hasDocumentUpdate) {
    let docCount = 0
    for (const doc of input.documents || []) {
      const documentType = doc.documentType || doc.document_type || doc.type || null
      if (!documentType) continue
      docCount += 1
      await service
        .from("employee_documents")
        .delete()
        .eq("employee_id", input.employeeId)
        .eq("document_type", documentType)
      const fileUrl = doc.fileUrl || doc.file_url || doc.url || null
      await service.from("employee_documents").insert({
        employee_id: input.employeeId,
        document_type: documentType,
        document_name: doc.fileName || doc.document_name || doc.name || null,
        file_name: doc.fileName || doc.file_name || doc.name || null,
        file_path: fileUrl,
        file_url: fileUrl,
        upload_date: new Date().toISOString(),
        uploaded_by: input.actor.name || "HR",
        notes: doc.notes || `Updated via Update Employee Data (effective ${effectiveDate})`,
      })
    }
    if (docCount) {
      allDiffs.push({
        entity: "employee",
        field_name: "documents",
        field_label: "Documents",
        old_value: "(previous)",
        new_value: `${docCount} document(s)`,
        sensitivity: "soft",
      })
    }
  }

  const audit = await recordEmployeeAudit({
    companyId: input.companyId,
    employeeId: input.employeeId,
    eventType: "update",
    source: input.source || "hr_update",
    reason: input.reason,
    actor: input.actor,
    diffs: allDiffs,
    summary: `Updated ${allDiffs.length} field(s) effective ${effectiveDate}`,
    metadata: { effective_date: effectiveDate },
  })

  if (audit.event?.id) {
    await service
      .from("employee_audit_events")
      .update({ effective_date: effectiveDate })
      .eq("id", audit.event.id)
  }

  return {
    employee: updated,
    diffs: allDiffs,
    event: audit.event,
    effective_date: effectiveDate,
    message: `Changes apply from ${effectiveDate} forward. Prior payroll periods are unchanged.`,
  }
}

export async function applyEmployeeTransfer(input: {
  companyId: string
  employeeId: string
  effectiveDate: string
  reason: string
  referenceNo?: string | null
  notes?: string | null
  to: {
    subsidiary_id?: string | null
    division?: string | null
    department?: string | null
    location?: string | null
    direct_supervisor?: string | null
    head_of_department?: string | null
  }
  actor: AuditActor
}) {
  if (!input.reason?.trim()) throw new Error("Reason is required for transfers")
  if (!input.effectiveDate) throw new Error("Effective date is required")

  const service = createServiceClient()
  const { data: before, error } = await service
    .from("employees")
    .select("*")
    .eq("id", input.employeeId)
    .eq("company_id", input.companyId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!before) throw new Error("Employee not found")

  const patch: Record<string, any> = { updated_at: new Date().toISOString() }
  const toFields = [
    ...ORG_TRANSFER_FIELDS,
    ...ORG_TRANSFER_OPTIONAL_FIELDS,
  ] as const

  for (const key of toFields) {
    if (input.to[key as keyof typeof input.to] !== undefined) {
      patch[key] = input.to[key as keyof typeof input.to]
    }
  }

  const diffs = buildDiffs(before, patch, toFields, "employee")
  if (!diffs.length) throw new Error("No organisational changes selected")

  const transferRow = {
    company_id: input.companyId,
    employee_id: input.employeeId,
    effective_date: input.effectiveDate,
    reason: input.reason,
    reference_no: input.referenceNo || null,
    notes: input.notes || null,
    status: "applied",
    from_subsidiary_id: before.subsidiary_id,
    to_subsidiary_id: patch.subsidiary_id !== undefined ? patch.subsidiary_id : before.subsidiary_id,
    from_division: before.division,
    to_division: patch.division !== undefined ? patch.division : before.division,
    from_department: before.department,
    to_department: patch.department !== undefined ? patch.department : before.department,
    from_location: before.location,
    to_location: patch.location !== undefined ? patch.location : before.location,
    from_direct_supervisor: before.direct_supervisor,
    to_direct_supervisor:
      patch.direct_supervisor !== undefined ? patch.direct_supervisor : before.direct_supervisor,
    from_head_of_department: before.head_of_department,
    to_head_of_department:
      patch.head_of_department !== undefined ? patch.head_of_department : before.head_of_department,
    actor_user_id: input.actor.userId || null,
    actor_name: input.actor.name || null,
  }

  const { data: transfer, error: tErr } = await service
    .from("employee_transfers")
    .insert(transferRow)
    .select()
    .single()
  if (tErr) throw new Error(tErr.message)

  const { data: updated, error: upErr } = await service
    .from("employees")
    .update(patch)
    .eq("id", input.employeeId)
    .eq("company_id", input.companyId)
    .select()
    .single()
  if (upErr) throw new Error(upErr.message)

  const audit = await recordEmployeeAudit({
    companyId: input.companyId,
    employeeId: input.employeeId,
    eventType: "transfer",
    source: "transfer",
    reason: input.reason,
    actor: input.actor,
    diffs,
    transferId: transfer.id,
    summary: `Transfer effective ${input.effectiveDate}: ${diffs.map((d) => d.field_label).join(", ")}`,
    metadata: { effective_date: input.effectiveDate, reference_no: input.referenceNo || null },
  })

  if (audit.event?.id) {
    await service
      .from("employee_transfers")
      .update({ audit_event_id: audit.event.id, updated_at: new Date().toISOString() })
      .eq("id", transfer.id)
  }

  // Keep current org on employee card; stamp transfer date for display beneath
  await service
    .from("employees")
    .update({
      last_transfer_date: input.effectiveDate,
      last_transfer_id: transfer.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.employeeId)
    .eq("company_id", input.companyId)

  return {
    transfer,
    employee: { ...updated, last_transfer_date: input.effectiveDate, last_transfer_id: transfer.id },
    diffs,
    event: audit.event,
    note: "Current org fields updated. Payroll for months before the effective date should use prior transfer history.",
  }
}

export async function reverseAuditEvent(input: {
  companyId: string
  eventId: string
  reason: string
  actor: AuditActor
}) {
  if (!input.reason?.trim()) throw new Error("Reason is required to reverse a change")

  const service = createServiceClient()
  const detail = await getEmployeeAuditEvent(input.companyId, input.eventId)
  if (!detail) throw new Error("Audit event not found")
  if (detail.reversed_at) throw new Error("This change was already reversed")
  if (detail.event_type === "reverse") throw new Error("Cannot reverse a reversal event")

  const gate = canReverseEvent({
    actorRole: input.actor.role,
    diffs: detail.diffs || [],
  })

  // Enrich actor role from DB if missing
  const actor = await resolveActor(service, input.companyId, input.actor)
  const gate2 = canReverseEvent({
    actorRole: actor.role || input.actor.role,
    diffs: detail.diffs || [],
  })
  if (!gate2.ok) throw new Error(gate2.reason || gate.reason || "Not allowed to reverse")

  const empRevert: Record<string, any> = { updated_at: new Date().toISOString() }
  const finRevert: Record<string, any> = {
    employee_id: detail.employee_id,
    updated_at: new Date().toISOString(),
  }
  let hasFin = false

  for (const d of detail.diffs || []) {
    if (d.entity === "financial") {
      hasFin = true
      finRevert[d.field_name] = d.old_value
      if (d.old_value === "true" || d.old_value === "false") {
        finRevert[d.field_name] = d.old_value === "true"
      } else if (d.old_value != null && !Number.isNaN(Number(d.old_value)) && /salary|rate|contribution/.test(d.field_name)) {
        finRevert[d.field_name] = Number(d.old_value)
      }
    } else {
      empRevert[d.field_name] = d.old_value
    }
  }

  const { data: before } = await service
    .from("employees")
    .select("*")
    .eq("id", detail.employee_id)
    .eq("company_id", input.companyId)
    .maybeSingle()
  if (!before) throw new Error("Employee not found")

  const { data: beforeFin } = await service
    .from("employee_financial")
    .select("*")
    .eq("employee_id", detail.employee_id)
    .maybeSingle()

  const { data: updated, error: upErr } = await service
    .from("employees")
    .update(empRevert)
    .eq("id", detail.employee_id)
    .eq("company_id", input.companyId)
    .select()
    .single()
  if (upErr) throw new Error(upErr.message)

  if (hasFin) {
    await service.from("employee_financial").upsert(finRevert, { onConflict: "employee_id" })
  }

  const reverseDiffs = buildDiffs(
    before,
    empRevert,
    Object.keys(empRevert).filter((k) => k !== "updated_at"),
    "employee",
  )
  if (hasFin) {
    reverseDiffs.push(
      ...buildDiffs(
        beforeFin || {},
        finRevert,
        Object.keys(finRevert).filter((k) => k !== "updated_at" && k !== "employee_id"),
        "financial",
      ),
    )
  }

  const audit = await recordEmployeeAudit({
    companyId: input.companyId,
    employeeId: detail.employee_id,
    eventType: "reverse",
    source: "reverse",
    reason: input.reason,
    actor: { ...input.actor, role: actor.role },
    diffs: reverseDiffs,
    reversesEventId: detail.id,
    summary: `Reversed event ${detail.id.slice(0, 8)}…`,
    metadata: { original_event_type: detail.event_type },
  })

  await service
    .from("employee_audit_events")
    .update({
      reversed_at: new Date().toISOString(),
      reversed_by_event_id: audit.event?.id || null,
    })
    .eq("id", detail.id)

  if (detail.transfer_id) {
    await service
      .from("employee_transfers")
      .update({
        status: "reversed",
        reversed_at: new Date().toISOString(),
        reversed_by: actor.userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", detail.transfer_id)
  }

  return { employee: updated, event: audit.event, original: detail }
}

export async function listEmployeeTransfers(companyId: string, employeeId?: string | null) {
  const service = createServiceClient()
  let query = service
    .from("employee_transfers")
    .select("*")
    .eq("company_id", companyId)
    .order("effective_date", { ascending: false })
    .limit(100)
  if (employeeId) query = query.eq("employee_id", employeeId)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}
