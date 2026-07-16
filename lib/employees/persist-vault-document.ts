import type { SupabaseClient } from "@supabase/supabase-js"

export type VaultInsertPayload = {
  employee_id?: string | null
  employee_name?: string | null
  document_type: string
  file_name: string
  file_size: number
  file_type: string
  file_url: string
  upload_date?: string
  uploaded_by?: string | null
  status?: string
  notes?: string | null
  source?: string
  category?: string
  company_id?: string | null
  access_level?: string
  signature_status?: string
}

function isUuid(value: string | null | undefined): boolean {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

/**
 * Insert into document_vault with progressive fallbacks for schema drift / FK issues.
 * Returns { ok, id, data, error }.
 */
export async function persistVaultDocument(
  client: SupabaseClient,
  payload: VaultInsertPayload,
): Promise<{ ok: boolean; id: string | null; data: any | null; error: string | null }> {
  const now = new Date().toISOString()
  const employeeId = isUuid(payload.employee_id) ? payload.employee_id : null
  const uploadedBy = isUuid(payload.uploaded_by) ? payload.uploaded_by : null

  const full: Record<string, unknown> = {
    employee_id: employeeId,
    employee_name: payload.employee_name || null,
    document_type: payload.document_type,
    file_name: payload.file_name,
    file_size: payload.file_size || 0,
    file_type: payload.file_type || "application/octet-stream",
    file_url: payload.file_url,
    upload_date: payload.upload_date || now,
    uploaded_by: uploadedBy,
    status: payload.status || "pending",
    notes: payload.notes || null,
    source: payload.source || "employee-onboarding",
    category: payload.category || "employee-document",
    company_id: isUuid(payload.company_id) ? payload.company_id : null,
    updated_at: now,
  }

  const attempts: Record<string, unknown>[] = [
    full,
    {
      employee_id: full.employee_id,
      employee_name: full.employee_name,
      document_type: full.document_type,
      file_name: full.file_name,
      file_size: full.file_size,
      file_type: full.file_type,
      file_url: full.file_url,
      upload_date: full.upload_date,
      status: full.status,
      notes: full.notes,
      source: full.source,
      category: full.category,
      company_id: full.company_id,
    },
    {
      document_type: full.document_type,
      file_name: full.file_name,
      file_size: full.file_size,
      file_type: full.file_type,
      file_url: full.file_url,
      employee_name: full.employee_name,
      status: "pending",
      source: full.source,
      category: full.category,
      notes: full.notes,
    },
  ]

  let lastError: string | null = null
  for (const attempt of attempts) {
    const { data, error } = await client.from("document_vault").insert(attempt).select().single()
    if (!error && data) {
      return { ok: true, id: data.id, data, error: null }
    }
    lastError = error?.message || "insert failed"

    // FK failure on employee_id — retry without it
    if (lastError.toLowerCase().includes("employee_id") && "employee_id" in attempt) {
      const { employee_id: _drop, ...rest } = attempt
      const retry = await client.from("document_vault").insert(rest).select().single()
      if (!retry.error && retry.data) {
        return { ok: true, id: retry.data.id, data: retry.data, error: null }
      }
      lastError = retry.error?.message || lastError
    }

    // FK / type failure on company_id
    if (lastError.toLowerCase().includes("company_id") && "company_id" in attempt) {
      const { company_id: _drop, ...rest } = attempt
      const retry = await client.from("document_vault").insert(rest).select().single()
      if (!retry.error && retry.data) {
        return { ok: true, id: retry.data.id, data: retry.data, error: null }
      }
      lastError = retry.error?.message || lastError
    }
  }

  return { ok: false, id: null, data: null, error: lastError }
}
