/**
 * GET  /api/documents?company_id=&employee_id=&source=
 *
 * Loads the Document Vault from database (document_vault + employee_documents backfill).
 * Strictly tenant-scoped — never falls back to unfiltered rows.
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

    const docs = (vaultRows ?? []).map(mapVaultRow)
    const vaultIds = new Set(docs.map((d) => d.id))
    const vaultUrls = new Set(docs.map((d) => d.fileUrl).filter(Boolean))

    // Only backfill employee_documents for employees in THIS company
    const { data: companyEmployees } = await service
      .from("employees")
      .select("id, full_name, display_name, first_name, last_name, preferred_name, company_id")
      .eq("company_id", companyId)
      .limit(5000)

    const nameById = new Map<string, string>()
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
    }

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
        const already =
          (row.vault_document_id && vaultIds.has(row.vault_document_id)) ||
          (url && vaultUrls.has(url))
        if (already) continue

        const mapped = mapEmployeeDocumentRow(
          row,
          nameById.get(row.employee_id) || row.employee_name || "Employee",
        )
        docs.push(mapped)
        vaultIds.add(mapped.id)
        if (mapped.fileUrl) vaultUrls.add(mapped.fileUrl)
      }
    }

    docs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())

    return NextResponse.json({
      success: true,
      documents: docs,
      company_id: companyId,
      meta: {
        count: docs.length,
        vault_count: (vaultRows ?? []).length,
        fetched_at: new Date().toISOString(),
      },
    })
  } catch (err) {
    return jsonError(err, "Failed to load documents")
  }
}
