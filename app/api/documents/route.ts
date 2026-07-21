/**
 * GET  /api/documents?company_id=&employee_id=&source=
 *
 * Loads the Document Vault from database (document_vault + employee_documents backfill).
 * Strictly tenant-scoped — never falls back to unfiltered rows.
 * Enriches with employee business codes (EMP0001) and dedupes by vault id / URL / type.
 */

import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"
import { mapEmployeeDocumentRow, mapVaultRow } from "@/lib/employees/map-vault-document"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const sp = new URL(req.url).searchParams
    const employeeId = sp.get("employee_id")
    const source = sp.get("source")

    let vaultQuery = service
      .from("document_vault")
      .select("*")
      .eq("company_id", companyId)
      .order("upload_date", { ascending: false })
      .limit(1000)

    if (employeeId) vaultQuery = vaultQuery.eq("employee_id", employeeId)
    if (source && source !== "all") vaultQuery = vaultQuery.eq("source", source)

    const { data: vaultRows, error: vaultError } = await vaultQuery
    if (vaultError) {
      console.warn("[documents] vault query failed:", vaultError.message)
    }

    const { data: companyEmployees } = await service
      .from("employees")
      .select(
        "id, employee_id, full_name, display_name, first_name, last_name, preferred_name, company_id",
      )
      .eq("company_id", companyId)
      .limit(5000)

    const nameById = new Map<string, string>()
    const codeById = new Map<string, string>()
    const companyEmployeeIds = new Set<string>()
    for (const e of companyEmployees ?? []) {
      companyEmployeeIds.add(e.id)
      nameById.set(
        e.id,
        e.full_name ||
          e.display_name ||
          e.preferred_name ||
          `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() ||
          "Employee",
      )
      if (e.employee_id) codeById.set(e.id, String(e.employee_id))
    }

    const docs = (vaultRows ?? []).map((row: any) => {
      const empId = row.employee_id
      const mapped = mapVaultRow(row, empId ? codeById.get(empId) : null)
      // Prefer canonical employee name so filter doesn't duplicate variants
      if (empId && nameById.has(empId)) {
        mapped.employeeName = nameById.get(empId)
      }
      return mapped
    })

    const vaultIds = new Set(docs.map((d) => d.id))
    const vaultUrls = new Set(docs.map((d) => d.fileUrl).filter(Boolean))
    const vaultTypeKeys = new Set(
      docs
        .filter((d) => d.employeeId && d.documentType)
        .map((d) => `${d.employeeId}::${d.documentType}`),
    )

    if (companyEmployeeIds.size) {
      let empDocsQuery = service
        .from("employee_documents")
        .select("*")
        .in("employee_id", [...companyEmployeeIds])
        .order("upload_date", { ascending: false })
        .limit(1000)
      if (employeeId) empDocsQuery = empDocsQuery.eq("employee_id", employeeId)
      const { data: empDocs } = await empDocsQuery

      for (const row of empDocs ?? []) {
        if (!companyEmployeeIds.has(row.employee_id)) continue
        const url = row.file_url || row.file_path || row.file_content
        const typeKey =
          row.employee_id && row.document_type
            ? `${row.employee_id}::${row.document_type}`
            : null
        const already =
          (row.vault_document_id && vaultIds.has(row.vault_document_id)) ||
          (url && vaultUrls.has(url)) ||
          (typeKey && vaultTypeKeys.has(typeKey))
        if (already) continue

        const mapped = mapEmployeeDocumentRow(
          row,
          nameById.get(row.employee_id) || row.employee_name || "Employee",
          codeById.get(row.employee_id),
        )
        docs.push(mapped)
        vaultIds.add(mapped.id)
        if (mapped.fileUrl) vaultUrls.add(mapped.fileUrl)
        if (typeKey) vaultTypeKeys.add(typeKey)
      }
    }

    docs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())

    // Unique employees for filters (one entry per person)
    const employeeMap = new Map<string, { id: string; name: string; code?: string }>()
    for (const d of docs) {
      const key = d.employeeId || `name:${(d.employeeName || "").toLowerCase().trim()}`
      if (!key || key === "name:") continue
      if (!employeeMap.has(key)) {
        employeeMap.set(key, {
          id: d.employeeId || key,
          name: d.employeeName || "Employee",
          code: d.employeeCode,
        })
      }
    }

    return NextResponse.json({
      success: true,
      documents: docs,
      employees: [...employeeMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
      company_id: companyId,
      meta: {
        count: docs.length,
        vault_count: (vaultRows ?? []).length,
        employee_count: employeeMap.size,
      },
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Failed to load documents", 500)
  }
}
