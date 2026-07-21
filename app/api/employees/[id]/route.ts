/**
 * GET    /api/employees/[id]
 * PATCH  /api/employees/[id]
 * DELETE /api/employees/[id]  — soft deactivate
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { normalizeEmployeeStatus } from "@/lib/employees/status"
import { mapEmployeeRow } from "@/lib/employees/dto"
import { persistVaultDocument } from "@/lib/employees/persist-vault-document"

async function loadEmployeeExtras(client: any, id: string) {
  const [allowances, deductions, documents] = await Promise.all([
    client.from("employee_allowances").select("*").eq("employee_id", id).eq("is_active", true),
    client.from("employee_deductions").select("*").eq("employee_id", id).eq("is_active", true),
    client.from("employee_documents").select("*").eq("employee_id", id).order("upload_date", { ascending: false }),
  ])
  return {
    allowances: allowances.data ?? [],
    deductions: deductions.data ?? [],
    documents: documents.data ?? [],
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const includeFinancial = new URL(req.url).searchParams.get("include_financial") !== "false"
    const client = await createClient()

    const select = includeFinancial
      ? `*, financial:employee_financial(*), subsidiaries:subsidiary_id(id, name)`
      : `*, subsidiaries:subsidiary_id(id, name)`

    const { data, error } = await client.from("employees").select(select).eq("id", id).single()
    const extras = await loadEmployeeExtras(client, id)

    if (error || !data) {
      const fallback = await client.from("employees").select("*").eq("id", id).single()
      if (fallback.error || !fallback.data) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 })
      }
      let row: any = fallback.data
      if (includeFinancial) {
        const { data: fin } = await client
          .from("employee_financial")
          .select("*")
          .eq("employee_id", id)
          .maybeSingle()
        row = { ...row, financial: fin }
      }
      return NextResponse.json({
        success: true,
        employee: mapEmployeeRow(row, includeFinancial, extras),
      })
    }

    return NextResponse.json({
      success: true,
      employee: mapEmployeeRow(data, includeFinancial, extras),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load employee" },
      { status: 500 },
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const client = await createClient()

    const employeePatch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    const fields = [
      "prefix",
      "first_name",
      "other_names",
      "last_name",
      "full_name",
      "display_name",
      "personal_email",
      "corporate_email",
      "phone",
      "position",
      "department",
      "division",
      "location",
      "special_role",
      "subsidiary_id",
      "contract_type",
      "date_of_joining",
      "date_of_exit",
      "date_of_birth",
      "gender",
      "marital_status",
      "address",
      "ghana_card_number",
      "direct_supervisor",
      "head_of_department",
      "emergency_contact_name",
      "emergency_contact_tel",
      "educational_level",
      "inactive_reason",
      "employee_id",
      "probation_period",
      "confirmation_date",
      "notice_period",
      "profile_picture",
    ] as const

    for (const key of fields) {
      if (body[key] !== undefined) employeePatch[key] = body[key]
    }
    if (body.phone_number !== undefined && body.phone === undefined) {
      employeePatch.phone = body.phone_number
    }
    if (body.status !== undefined) {
      employeePatch.status = normalizeEmployeeStatus(body.status)
    }
    if (body.first_name || body.last_name) {
      employeePatch.full_name =
        body.full_name ||
        body.display_name ||
        `${body.first_name ?? ""} ${body.last_name ?? ""}`.trim()
    }

    const { data: updated, error } = await client
      .from("employees")
      .update(employeePatch)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const financial = body.financial
    if (financial || body.monthly_salary != null || body.salary != null) {
      const monthly = Number(
        financial?.monthly_salary ?? body.monthly_salary ?? body.salary ?? 0,
      )
      const pfRate = Math.min(
        16.5,
        Math.max(0, Number(financial?.provident_fund_rate ?? body.provident_fund_rate ?? 0)),
      )
      const pfEnrolled =
        financial?.provident_fund_enrolled === true ||
        body.provident_fund_enrolled === true ||
        pfRate > 0

      const finPayload: Record<string, unknown> = {
        employee_id: id,
        updated_at: new Date().toISOString(),
      }
      if (financial?.monthly_salary != null || body.monthly_salary != null || body.salary != null) {
        finPayload.monthly_salary = monthly
        finPayload.annual_salary =
          financial?.annual_salary != null ? Number(financial.annual_salary) : monthly * 12
      }
      for (const key of [
        "transport_allowance",
        "housing_allowance",
        "medical_allowance",
        "meal_allowance",
        "communication_allowance",
        "uniform_allowance",
        "other_allowances",
        "bank_name",
        "bank_branch",
        "bank_account_number",
        "ssnit_number",
        "tier3_contribution",
      ] as const) {
        if (financial?.[key] !== undefined) finPayload[key] = financial[key]
        else if (body[key] !== undefined) finPayload[key] = body[key]
      }
      finPayload.provident_fund_enrolled = pfEnrolled
      finPayload.provident_fund_rate = pfEnrolled ? pfRate : 0
      // Keep legacy flag for older payroll readers
      if (pfEnrolled && Number(finPayload.tier3_contribution ?? 0) === 0) {
        finPayload.tier3_contribution = 1
      }
      if (!pfEnrolled) finPayload.tier3_contribution = 0

      const { error: finError } = await client
        .from("employee_financial")
        .upsert(finPayload, { onConflict: "employee_id" })
      if (finError) {
        await client.from("employee_financial").upsert(finPayload)
      }
    }

    if (Array.isArray(body.allowances)) {
      await client.from("employee_allowances").delete().eq("employee_id", id)
      if (body.allowances.length) {
        const rows = body.allowances.map((a: any) => ({
          employee_id: id,
          allowance_id: a.id && String(a.id).length > 20 ? a.id : null,
          code: a.code ?? null,
          description: a.description ?? null,
          taxable: Boolean(a.taxable),
          recurring: a.recurring !== false,
          amount: Number(a.amount ?? 0),
          percentage: Number(a.percentage ?? 0),
          calculation_type: String(a.calculationType || a.calculation_type || "AMOUNT").toUpperCase(),
          effective_date: a.effectiveDate || a.effective_date || new Date().toISOString().slice(0, 10),
          end_date: a.endDate || a.end_date || null,
          is_active: true,
        }))
        await client.from("employee_allowances").insert(rows)
      }
    }

    if (Array.isArray(body.deductions)) {
      await client.from("employee_deductions").delete().eq("employee_id", id)
      if (body.deductions.length) {
        const rows = body.deductions.map((d: any) => ({
          employee_id: id,
          deduction_id: d.id && String(d.id).length > 20 ? d.id : null,
          code: d.code ?? null,
          description: d.description ?? null,
          taxable: Boolean(d.taxable),
          recurring: d.recurring !== false,
          amount: Number(d.amount ?? 0),
          percentage: Number(d.percentage ?? 0),
          calculation_type: String(d.calculationType || d.calculation_type || "AMOUNT").toUpperCase(),
          effective_date: d.effectiveDate || d.effective_date || new Date().toISOString().slice(0, 10),
          end_date: d.endDate || d.end_date || null,
          is_active: true,
        }))
        await client.from("employee_deductions").insert(rows)
      }
    }

    if (Array.isArray(body.documents)) {
      // Replace document set for types present in payload
      for (const doc of body.documents) {
        const documentType = doc.documentType || doc.document_type || doc.type || null
        if (!documentType) continue
        await client.from("employee_documents").delete().eq("employee_id", id).eq("document_type", documentType)
        const fileUrl = doc.fileUrl || doc.file_url || doc.url || doc.path || doc.file_path || null
        const { data: empDoc } = await client
          .from("employee_documents")
          .insert({
            employee_id: id,
            document_type: documentType,
            document_name: doc.fileName || doc.document_name || doc.name || null,
            file_name: doc.fileName || doc.file_name || doc.name || null,
            file_path: fileUrl,
            file_url: fileUrl,
            file_size: doc.fileSize || doc.file_size || doc.size || null,
            mime_type: doc.fileType || doc.mime_type || null,
            file_content: doc.file_content || (typeof fileUrl === "string" && fileUrl.startsWith("data:") ? fileUrl : null),
            vault_document_id: doc.vaultDocumentId || doc.vault_document_id || doc.id || null,
            upload_date: new Date().toISOString(),
            uploaded_by: doc.uploadedBy || "HR Admin",
            notes: doc.notes || null,
          })
          .select()
          .single()

        // Link/update document vault with employee
        const vaultId = doc.vaultDocumentId || doc.vault_document_id
        if (vaultId && String(vaultId).length > 20) {
          const { error: linkErr } = await client
            .from("document_vault")
            .update({
              employee_id: id,
              employee_name: updated.full_name || updated.display_name,
              file_url: fileUrl,
              file_name: doc.fileName || doc.file_name || doc.name,
              company_id: updated.company_id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", vaultId)
          if (linkErr) {
            console.warn("[employees] vault link update failed:", linkErr.message)
          }
          if (empDoc?.id) {
            await client
              .from("employee_documents")
              .update({ vault_document_id: vaultId })
              .eq("id", empDoc.id)
          }
        } else if (fileUrl) {
          const vault = await persistVaultDocument(client, {
            employee_id: id,
            employee_name: updated.full_name || updated.display_name,
            document_type: documentType,
            file_name: doc.fileName || doc.file_name || doc.name || "document",
            file_size: Number(doc.fileSize || doc.file_size || 0),
            file_type: doc.fileType || doc.mime_type || "application/octet-stream",
            file_url: fileUrl,
            source: "employee-onboarding",
            category: "employee-document",
            company_id: updated.company_id,
            notes: `Linked from employee module${empDoc?.id ? ` (${empDoc.id})` : ""}`,
          })
          if (vault.ok && vault.id && empDoc?.id) {
            await client
              .from("employee_documents")
              .update({ vault_document_id: vault.id })
              .eq("id", empDoc.id)
          }
        }
      }
    }

    const { data: fin } = await client
      .from("employee_financial")
      .select("*")
      .eq("employee_id", id)
      .maybeSingle()
    const extras = await loadEmployeeExtras(client, id)

    return NextResponse.json({
      success: true,
      employee: mapEmployeeRow({ ...updated, financial: fin }, true, extras),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update employee" },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: "Employee id is required" }, { status: 400 })

    // Prefer service client so deactivate is not blocked by RLS on the user session
    let client: any
    try {
      client = createServiceClient()
    } catch {
      client = await createClient()
    }

    const { data: existing, error: findErr } = await client
      .from("employees")
      .select("id, company_id, status, full_name, display_name, first_name, last_name")
      .eq("id", id)
      .maybeSingle()

    if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 })
    if (!existing) return NextResponse.json({ error: "Employee not found" }, { status: 404 })

    // Soft-delete: mark Inactive (keeps payroll/history intact)
    const { data, error } = await client
      .from("employees")
      .update({
        status: "Inactive",
        inactive_reason: "Deactivated via employee module",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      employee: mapEmployeeRow(data, false),
      message: "Employee deactivated",
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to deactivate employee" },
      { status: 500 },
    )
  }
}
