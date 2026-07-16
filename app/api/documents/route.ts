/**
 * GET  /api/documents?company_id=&employee_id=&source=
 *
 * Loads the Document Vault from database (document_vault + employee_documents backfill).
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { mapEmployeeDocumentRow, mapVaultRow } from "@/lib/employees/map-vault-document"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const sp = new URL(req.url).searchParams
    let companyId = sp.get("company_id")
    if (!companyId) {
      companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId ?? null
    }

    const employeeId = sp.get("employee_id")
    const source = sp.get("source")

    // Prefer company-scoped rows, but always include null-company uploads from employee module
    let vaultQuery = client
      .from("document_vault")
      .select("*")
      .order("upload_date", { ascending: false })
      .limit(1000)

    if (companyId) {
      vaultQuery = vaultQuery.or(`company_id.eq.${companyId},company_id.is.null`)
    }
    if (employeeId) vaultQuery = vaultQuery.eq("employee_id", employeeId)
    if (source && source !== "all") vaultQuery = vaultQuery.eq("source", source)

    let { data: vaultRows, error: vaultError } = await vaultQuery

    if (vaultError) {
      console.warn("[documents] vault query failed, retrying unfiltered:", vaultError.message)
      let fallback = client
        .from("document_vault")
        .select("*")
        .order("upload_date", { ascending: false })
        .limit(1000)
      if (employeeId) fallback = fallback.eq("employee_id", employeeId)
      const fb = await fallback
      if (!fb.error) {
        vaultRows = fb.data
        vaultError = null
      }
    }

    // If company OR filter returned nothing, try all rows (legacy / schema drift)
    if (!vaultError && companyId && !(vaultRows ?? []).length) {
      let fallback = client
        .from("document_vault")
        .select("*")
        .order("upload_date", { ascending: false })
        .limit(1000)
      if (employeeId) fallback = fallback.eq("employee_id", employeeId)
      const fb = await fallback
      if (!fb.error && (fb.data ?? []).length) {
        vaultRows = fb.data
      }
    }

    if (vaultError) {
      console.warn("[documents] vault unavailable:", vaultError.message)
      vaultRows = []
    }

    const docs = (vaultRows ?? []).map(mapVaultRow)
    const vaultIds = new Set(docs.map((d) => d.id))
    const vaultUrls = new Set(docs.map((d) => d.fileUrl).filter(Boolean))

    let empDocsQuery = client
      .from("employee_documents")
      .select("*")
      .order("upload_date", { ascending: false })
      .limit(1000)
    if (employeeId) empDocsQuery = empDocsQuery.eq("employee_id", employeeId)
    const { data: empDocs } = await empDocsQuery

    const employeeIds = Array.from(
      new Set((empDocs ?? []).map((d) => d.employee_id).filter(Boolean)),
    ) as string[]

    const nameById = new Map<string, string>()
    const companyByEmployee = new Map<string, string | null>()
    if (employeeIds.length) {
      const { data: emps } = await client
        .from("employees")
        .select("id, full_name, display_name, first_name, last_name, preferred_name, company_id")
        .in("id", employeeIds)
      for (const e of emps ?? []) {
        companyByEmployee.set(e.id, e.company_id ?? null)
        nameById.set(
          e.id,
          e.full_name ||
            e.display_name ||
            e.preferred_name ||
            `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() ||
            "Employee",
        )
      }
    }

    for (const row of empDocs ?? []) {
      const url = row.file_url || row.file_path || row.file_content
      const already =
        (row.vault_document_id && vaultIds.has(row.vault_document_id)) ||
        (url && vaultUrls.has(url))
      if (already) continue

      if (companyId && row.employee_id) {
        const empCompany = companyByEmployee.get(row.employee_id)
        // Skip only when we know the employee belongs to another company
        if (empCompany && empCompany !== companyId) continue
      }

      const mapped = mapEmployeeDocumentRow(
        row,
        nameById.get(row.employee_id) || row.employee_name || "Employee",
      )
      docs.push(mapped)
      vaultIds.add(mapped.id)
      if (mapped.fileUrl) vaultUrls.add(mapped.fileUrl)
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load documents" },
      { status: 500 },
    )
  }
}
