// @ts-nocheck
/**
 * GET/POST /api/payroll/tax-reliefs
 *
 * Tenant-isolated employee tax relief assignments (per tax year).
 * Also supports bulk maps for payroll calculation and document vault copies.
 */

import { NextRequest, NextResponse } from "next/server"
import { jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"
import { persistVaultDocument } from "@/lib/employees/persist-vault-document"

function isMissingRelation(error: any) {
  const message = String(error?.message || error || "").toLowerCase()
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
  )
}

function mapCatalogRow(r: any) {
  const annual = Number(r.annual_amount ?? r.amount ?? 0)
  return {
    id: r.id,
    name: r.name || r.relief_name || "Untitled relief",
    description: r.description || "",
    amount: annual,
    annualAmount: annual,
    currency: r.currency || "GHS",
    category: r.category || "Personal",
    graCode: r.gra_code || r.relief_code || r.code || "",
    isActive: r.is_active !== false,
    effectiveDate: r.effective_date || null,
  }
}

function mapAssignment(row: any, relief?: any, employee?: any) {
  const catalog = relief || row.tax_relief || {}
  const annual = Number(
    row.override_amount ?? catalog.annual_amount ?? catalog.amount ?? 0,
  )
  return {
    id: row.id,
    companyId: row.company_id,
    employeeId: row.employee_id,
    taxReliefId: row.tax_relief_id,
    taxYear: Number(row.tax_year),
    overrideAmount: row.override_amount != null ? Number(row.override_amount) : null,
    annualAmount: annual,
    isActive: row.is_active !== false,
    documentUrl: row.document_url || null,
    documentName: row.document_name || null,
    documentFileType: row.document_file_type || null,
    documentSize: Number(row.document_size || 0),
    vaultDocumentId: row.vault_document_id || null,
    notes: row.notes || "",
    reliefName: catalog.name || catalog.relief_name || "",
    reliefCode: catalog.gra_code || catalog.relief_code || catalog.code || "",
    category: catalog.category || "Personal",
    employeeName:
      employee?.full_name ||
      employee?.display_name ||
      [employee?.first_name, employee?.last_name].filter(Boolean).join(" ") ||
      "",
    employeeCode: employee?.employee_id || "",
    department: employee?.department || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Engine shape for payroll calc */
function toEngineItem(row: any, relief?: any) {
  const catalog = relief || row.tax_relief || {}
  return {
    relief_code: catalog.gra_code || catalog.relief_code || catalog.code || catalog.name || "",
    relief_name: catalog.name || catalog.relief_name || "Tax relief",
    annual_amount: Number(row.override_amount ?? catalog.annual_amount ?? catalog.amount ?? 0),
  }
}

async function loadTaxReliefsJsonBackup(service: any, companyId: string): Promise<any[]> {
  try {
    const { data: settings } = await service
      .from("company_settings")
      .select("settings_data")
      .eq("company_id", companyId)
      .maybeSingle()
    if (Array.isArray(settings?.settings_data?.tax_reliefs)) {
      return settings.settings_data.tax_reliefs
    }
  } catch {
    // ignore
  }

  try {
    const { data: byId } = await service
      .from("company_settings")
      .select("settings_data")
      .eq("id", companyId)
      .maybeSingle()
    if (Array.isArray(byId?.settings_data?.tax_reliefs)) {
      return byId.settings_data.tax_reliefs
    }
  } catch {
    // ignore
  }

  try {
    const { data: company } = await service
      .from("companies")
      .select("settings_data")
      .eq("id", companyId)
      .maybeSingle()
    if (Array.isArray(company?.settings_data?.tax_reliefs)) {
      return company.settings_data.tax_reliefs
    }
  } catch {
    // ignore
  }

  return []
}

function mergeCatalogWithBackup(catalogRows: any[], backup: any[]) {
  if (!backup.length) return catalogRows
  const byCode = new Map(
    backup.map((b: any) => [
      String(b.graCode || b.gra_code || b.relief_code || b.code || "")
        .trim()
        .toUpperCase(),
      b,
    ]),
  )
  return catalogRows.map((row) => {
    const code = String(row.gra_code || row.relief_code || row.code || "")
      .trim()
      .toUpperCase()
    const hit = byCode.get(code)
    if (!hit) return row
    return {
      ...row,
      name: hit.name || row.name || row.relief_name,
      relief_name: hit.name || row.relief_name || row.name,
      description: hit.description || row.description,
      category: hit.category || row.category,
      amount: Number(hit.amount ?? row.amount ?? 0),
      annual_amount: Number(hit.amount ?? row.annual_amount ?? row.amount ?? 0),
    }
  })
}

/**
 * Settings → Payroll may persist reliefs only in company_settings.settings_data.tax_reliefs.
 * Materialize those into tax_reliefs so Assign / Bulk Assign get real UUID ids.
 */
async function materializeCatalogFromSettings(service: any, companyId: string): Promise<any[]> {
  const now = new Date().toISOString()
  const backup = await loadTaxReliefsJsonBackup(service, companyId)

  const active = backup.filter((r) => (r?.name || r?.relief_name) && r.isActive !== false)
  if (!active.length) return []

  // Reactivate / update existing inactive rows by code before inserting
  const { data: existing } = await service
    .from("tax_reliefs")
    .select("id, gra_code, relief_code, code, is_active")
    .eq("company_id", companyId)

  const byCode = new Map<string, any>()
  for (const er of existing || []) {
    const key = String(er.gra_code || er.relief_code || er.code || "")
      .trim()
      .toUpperCase()
    if (key && !byCode.has(key)) byCode.set(key, er)
  }

  for (let index = 0; index < active.length; index++) {
    const r = active[index]
    const amount = Number(r.amount ?? r.annualAmount ?? 0)
    const fullName =
      String(r.name || r.relief_name || r.reliefName || "Tax relief").trim() || "Tax relief"
    const reliefName = fullName.slice(0, 20)
    const raw = String(r.graCode || r.gra_code || r.reliefCode || r.relief_code || r.code || "").trim()
    const graCode = (raw || `CUSTOM-${index + 1}`).slice(0, 20)
    const codeKey = graCode.toUpperCase()
    const match = byCode.get(codeKey)
    const cat = String(r.category || "").toLowerCase()
    const reliefType =
      cat.includes("disab") || Number(amount) === 25 && cat.includes("disab")
        ? "percentage"
        : "fixed"

    const payloadVariants = [
      {
        company_id: companyId,
        name: reliefName,
        relief_name: reliefName,
        description: reliefName,
        amount,
        annual_amount: amount,
        currency: String(r.currency || "GHS").slice(0, 10),
        category: String(r.category || "Personal").slice(0, 20),
        relief_type: reliefType,
        gra_code: graCode,
        relief_code: graCode,
        code: graCode,
        is_active: true,
        updated_at: now,
        created_at: now,
      },
      {
        company_id: companyId,
        name: reliefName,
        relief_name: reliefName,
        amount,
        relief_code: graCode,
        gra_code: graCode,
        relief_type: reliefType,
        is_active: true,
        updated_at: now,
      },
      {
        company_id: companyId,
        relief_name: reliefName,
        relief_code: graCode,
        relief_type: "fixed",
        amount,
        is_active: true,
        updated_at: now,
      },
      {
        company_id: companyId,
        relief_name: reliefName,
        relief_code: graCode,
        relief_type: "percentage",
        amount,
        is_active: true,
        updated_at: now,
      },
    ]

    let done = false
    for (const payload of payloadVariants) {
      if (match?.id) {
        const { created_at: _c, ...updatePayload } = payload
        const { error } = await service
          .from("tax_reliefs")
          .update(updatePayload)
          .eq("id", match.id)
          .eq("company_id", companyId)
        if (!error) {
          done = true
          break
        }
        if (isMissingRelation(error)) return []
      } else {
        const { error } = await service.from("tax_reliefs").insert(payload)
        if (!error) {
          done = true
          break
        }
        if (isMissingRelation(error)) return []
        const tooLong = String(error?.message || "").match(/character varying\((\d+)\)/i)
        if (tooLong) {
          const maxLen = Number(tooLong[1])
          const trimmed: Record<string, any> = {}
          for (const [k, v] of Object.entries(payload)) {
            trimmed[k] =
              typeof v === "string" && v.length > maxLen && k !== "company_id" && !k.endsWith("_at")
                ? v.slice(0, maxLen)
                : v
          }
          const { error: retryErr } = await service.from("tax_reliefs").insert(trimmed)
          if (!retryErr) {
            done = true
            break
          }
        }
      }
    }
    if (!done && !match) {
      // continue trying remaining reliefs
    }
  }

  const { data: refreshed } = await service
    .from("tax_reliefs")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)

  return refreshed || []
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const { searchParams } = new URL(req.url)
    const taxYear = parseInt(
      searchParams.get("tax_year") || String(new Date().getFullYear()),
      10,
    )
    const mode = searchParams.get("mode") || "page"
    const employeeId = searchParams.get("employee_id")

    // Catalog — table first; if empty, materialize from Settings JSON backup so Assign works
    let catalogRows: any[] = []
    {
      let { data, error: catalogErr } = await service
        .from("tax_reliefs")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name")

      // Legacy tables may lack `name` — retry without order
      if (catalogErr && !isMissingRelation(catalogErr)) {
        const retry = await service
          .from("tax_reliefs")
          .select("*")
          .eq("company_id", companyId)
          .eq("is_active", true)
        if (retry.error && !isMissingRelation(retry.error)) throw retry.error
        data = retry.data
        catalogErr = retry.error
      }

      if (catalogErr && !isMissingRelation(catalogErr)) throw catalogErr
      catalogRows = data || []
    }

    if (!catalogRows.length) {
      const materialized = await materializeCatalogFromSettings(service, companyId)
      if (materialized.length) {
        catalogRows = materialized
      }
    }

    const backup = await loadTaxReliefsJsonBackup(service, companyId)
    const mergedRows = mergeCatalogWithBackup(catalogRows || [], backup)
    const catalog = mergedRows.map(mapCatalogRow)

    // Assignments for year
    let assignQuery = service
      .from("employee_tax_reliefs")
      .select("*")
      .eq("company_id", companyId)
      .eq("tax_year", taxYear)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (employeeId) assignQuery = assignQuery.eq("employee_id", employeeId)

    const { data: assignRows, error: assignErr } = await assignQuery
    if (assignErr) {
      if (isMissingRelation(assignErr)) {
        return NextResponse.json({
          company_id: companyId,
          tax_year: taxYear,
          catalog,
          assignments: [],
          by_employee: {},
          migration_required: true,
        })
      }
      throw assignErr
    }

    const reliefIds = Array.from(new Set((assignRows || []).map((r) => r.tax_relief_id).filter(Boolean)))
    const empIds = Array.from(new Set((assignRows || []).map((r) => r.employee_id).filter(Boolean)))

    const [{ data: reliefs }, { data: employees }] = await Promise.all([
      reliefIds.length
        ? service.from("tax_reliefs").select("*").in("id", reliefIds)
        : Promise.resolve({ data: [] as any[] }),
      empIds.length
        ? service
            .from("employees")
            .select("id, employee_id, first_name, last_name, full_name, display_name, department, company_id")
            .eq("company_id", companyId)
            .in("id", empIds)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const reliefById = new Map((reliefs || []).map((r) => [r.id, r]))
    const empById = new Map((employees || []).map((e) => [e.id, e]))

    // Drop any assignment whose employee is not in this company (isolation guard)
    const assignments = (assignRows || [])
      .filter((row) => empById.has(row.employee_id) || !empIds.length)
      .map((row) => mapAssignment(row, reliefById.get(row.tax_relief_id), empById.get(row.employee_id)))

    if (mode === "payroll_map") {
      const byEmployee: Record<string, Array<{ relief_code: string; relief_name: string; annual_amount: number }>> =
        {}
      for (const row of assignRows || []) {
        if (!empById.has(row.employee_id)) continue
        const item = toEngineItem(row, reliefById.get(row.tax_relief_id))
        if (!byEmployee[row.employee_id]) byEmployee[row.employee_id] = []
        byEmployee[row.employee_id].push(item)
      }
      return NextResponse.json({
        company_id: companyId,
        tax_year: taxYear,
        by_employee: byEmployee,
      })
    }

    return NextResponse.json({
      company_id: companyId,
      tax_year: taxYear,
      catalog,
      assignments,
      by_employee: undefined,
    })
  } catch (err) {
    return jsonError(err, "Failed to load tax reliefs")
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, userId, service } = ctx
    const action = body.action || "assign"
    const now = new Date().toISOString()

    if (action === "assign" || action === "bulk_assign") {
      const taxYear = parseInt(String(body.tax_year || new Date().getFullYear()), 10)
      const taxReliefIds: string[] = Array.isArray(body.tax_relief_ids)
        ? body.tax_relief_ids.filter(Boolean)
        : body.tax_relief_id
          ? [body.tax_relief_id]
          : []
      const employeeIds: string[] = Array.isArray(body.employee_ids)
        ? body.employee_ids.filter(Boolean)
        : body.employee_id
          ? [body.employee_id]
          : []

      if (!taxYear || !taxReliefIds.length || !employeeIds.length) {
        return NextResponse.json(
          { error: "tax_year, tax_relief_id(s), and employee_id(s) are required" },
          { status: 400 },
        )
      }

      // Isolation: reliefs and employees must belong to this company (active catalog only)
      const [{ data: reliefs }, { data: employees }] = await Promise.all([
        service
          .from("tax_reliefs")
          .select("id")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .in("id", taxReliefIds),
        service
          .from("employees")
          .select("id, first_name, last_name, full_name, employee_id")
          .eq("company_id", companyId)
          .in("id", employeeIds),
      ])

      const validReliefIds = new Set((reliefs || []).map((r) => r.id))
      const validEmployees = employees || []
      if (!validReliefIds.size) {
        return NextResponse.json(
          {
            error:
              "No valid active tax reliefs for this company. Save the catalog in Settings → Payroll first.",
          },
          { status: 400 },
        )
      }
      if (!validEmployees.length) {
        return NextResponse.json({ error: "No valid employees for this company" }, { status: 400 })
      }

      const overrideAmount =
        body.override_amount != null && body.override_amount !== ""
          ? Number(body.override_amount)
          : null

      const rows = []
      for (const emp of validEmployees) {
        for (const reliefId of taxReliefIds) {
          if (!validReliefIds.has(reliefId)) continue
          rows.push({
            company_id: companyId,
            employee_id: emp.id,
            tax_relief_id: reliefId,
            tax_year: taxYear,
            override_amount: Number.isFinite(overrideAmount as number) ? overrideAmount : null,
            is_active: true,
            notes: body.notes || null,
            assigned_by: userId && String(userId).length > 20 ? userId : null,
            updated_at: now,
            created_at: now,
          })
        }
      }

      let upserted: any[] | null = null
      let error: any = null
      ;({ data: upserted, error } = await service
        .from("employee_tax_reliefs")
        .upsert(rows, { onConflict: "company_id,employee_id,tax_relief_id,tax_year" })
        .select("id"))

      // Fallback when unique constraint is missing: update-then-insert per row
      if (error && /no unique|on conflict|conflict target/i.test(String(error.message || ""))) {
        let assigned = 0
        let fallbackErr: any = null
        for (const row of rows) {
          const { data: existing } = await service
            .from("employee_tax_reliefs")
            .select("id")
            .eq("company_id", companyId)
            .eq("employee_id", row.employee_id)
            .eq("tax_relief_id", row.tax_relief_id)
            .eq("tax_year", row.tax_year)
            .maybeSingle()
          if (existing?.id) {
            const { created_at: _c, ...updateRow } = row
            const { error: upErr } = await service
              .from("employee_tax_reliefs")
              .update(updateRow)
              .eq("id", existing.id)
              .eq("company_id", companyId)
            if (upErr) {
              fallbackErr = upErr
              break
            }
            assigned += 1
          } else {
            const { error: inErr } = await service.from("employee_tax_reliefs").insert(row)
            if (inErr) {
              fallbackErr = inErr
              break
            }
            assigned += 1
          }
        }
        if (fallbackErr) {
          if (isMissingRelation(fallbackErr)) {
            return NextResponse.json(
              {
                error:
                  "employee_tax_reliefs table is missing. Run scripts/069_employee_tax_reliefs.sql in Supabase.",
              },
              { status: 503 },
            )
          }
          throw fallbackErr
        }
        return NextResponse.json({
          success: true,
          assigned,
          tax_year: taxYear,
          company_id: companyId,
        })
      }

      if (error) {
        if (isMissingRelation(error)) {
          return NextResponse.json(
            {
              error:
                "employee_tax_reliefs table is missing. Run scripts/069_employee_tax_reliefs.sql in Supabase.",
            },
            { status: 503 },
          )
        }
        throw error
      }

      return NextResponse.json({
        success: true,
        assigned: upserted?.length ?? rows.length,
        tax_year: taxYear,
        company_id: companyId,
      })
    }

    if (action === "unassign" || action === "deactivate") {
      const id = body.assignment_id || body.id
      if (!id) {
        return NextResponse.json({ error: "assignment_id is required" }, { status: 400 })
      }
      const { error } = await service
        .from("employee_tax_reliefs")
        .update({ is_active: false, updated_at: now })
        .eq("id", id)
        .eq("company_id", companyId)
      if (error) throw error
      return NextResponse.json({ success: true, deactivated: id })
    }

    if (action === "attach_document") {
      const assignmentId = body.assignment_id
      const fileUrl = body.file_url
      const fileName = body.file_name || "tax-relief-document"
      const fileType = body.file_type || "application/octet-stream"
      const fileSize = Number(body.file_size || 0)

      if (!assignmentId || !fileUrl) {
        return NextResponse.json(
          { error: "assignment_id and file_url are required" },
          { status: 400 },
        )
      }

      const { data: assignment, error: loadErr } = await service
        .from("employee_tax_reliefs")
        .select("*")
        .eq("id", assignmentId)
        .eq("company_id", companyId)
        .maybeSingle()

      if (loadErr) throw loadErr
      if (!assignment) {
        return NextResponse.json({ error: "Assignment not found for this company" }, { status: 404 })
      }

      const { data: emp } = await service
        .from("employees")
        .select("id, full_name, display_name, first_name, last_name, employee_id")
        .eq("id", assignment.employee_id)
        .eq("company_id", companyId)
        .maybeSingle()

      const employeeName =
        emp?.full_name ||
        emp?.display_name ||
        [emp?.first_name, emp?.last_name].filter(Boolean).join(" ") ||
        "Employee"

      const { data: relief } = await service
        .from("tax_reliefs")
        .select("name")
        .eq("id", assignment.tax_relief_id)
        .eq("company_id", companyId)
        .maybeSingle()

      const vault = await persistVaultDocument(service, {
        employee_id: assignment.employee_id,
        employee_name: employeeName,
        document_type: "tax-relief",
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        file_url: fileUrl,
        uploaded_by: userId,
        status: "approved",
        notes: `Tax relief evidence: ${relief?.name || "Relief"} (${assignment.tax_year})`,
        source: "payroll-tax-reliefs",
        category: "tax-relief",
        company_id: companyId,
      })

      const { error: updErr } = await service
        .from("employee_tax_reliefs")
        .update({
          document_url: fileUrl,
          document_name: fileName,
          document_file_type: fileType,
          document_size: fileSize,
          vault_document_id: vault.id,
          updated_at: now,
        })
        .eq("id", assignmentId)
        .eq("company_id", companyId)

      if (updErr) throw updErr

      return NextResponse.json({
        success: true,
        vault_document_id: vault.id,
        vault_ok: vault.ok,
        vault_error: vault.error,
        document_url: fileUrl,
      })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Failed to update tax reliefs")
  }
}
