/**
 * GET  /api/employees?company_id=&status=&q=&include_financial=&limit=
 * POST /api/employees  — create employee (+ optional financial)
 */

import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext } from "@/lib/settings/resolve-tenant"
import { ACTIVE_EMPLOYEE_STATUSES, normalizeEmployeeStatus } from "@/lib/employees/status"
import { mapEmployeeRow, toEmployeeOption } from "@/lib/employees/dto"
import { persistVaultDocument } from "@/lib/employees/persist-vault-document"

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service: client } = ctx

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const q = searchParams.get("q")?.trim()
    const includeFinancial = searchParams.get("include_financial") === "true"
    const optionsOnly = searchParams.get("options") === "true"
    const limit = Math.min(Number(searchParams.get("limit") ?? 500), 2000)

    const select = includeFinancial
      ? `*, financial:employee_financial(*), subsidiaries:subsidiary_id(id, name)`
      : `*, subsidiaries:subsidiary_id(id, name)`

    let query = client
      .from("employees")
      .select(select)
      .eq("company_id", companyId)
      .order("first_name", { ascending: true })
      .limit(limit)

    if (status && status !== "all") {
      if (status.toLowerCase() === "active") {
        query = query.in("status", [...ACTIVE_EMPLOYEE_STATUSES])
      } else {
        query = query.eq("status", normalizeEmployeeStatus(status))
      }
    }

    if (q) {
      query = query.or(
        `first_name.ilike.%${q}%,last_name.ilike.%${q}%,employee_id.ilike.%${q}%,corporate_email.ilike.%${q}%,personal_email.ilike.%${q}%,department.ilike.%${q}%`,
      )
    }

    const { data, error } = await query
    if (error) {
      // Fallback without relational embeds
      let fallback = client
        .from("employees")
        .select("*")
        .eq("company_id", companyId)
        .order("first_name", { ascending: true })
        .limit(limit)
      if (status && status.toLowerCase() === "active") {
        fallback = fallback.in("status", [...ACTIVE_EMPLOYEE_STATUSES])
      }
      const fb = await fallback
      if (fb.error) return NextResponse.json({ error: fb.error.message }, { status: 500 })

      let rows = fb.data ?? []
      if (includeFinancial && rows.length) {
        const ids = rows.map((r) => r.id)
        const { data: fins } = await client.from("employee_financial").select("*").in("employee_id", ids)
        const byEmp = new Map((fins ?? []).map((f: any) => [f.employee_id, f]))
        rows = rows.map((r) => ({ ...r, financial: byEmp.get(r.id) ?? null }))
      }

      const employees = rows.map((r) => mapEmployeeRow(r, includeFinancial))
      return NextResponse.json({
        success: true,
        employees: optionsOnly ? employees.map(toEmployeeOption) : employees,
        data: optionsOnly ? employees.map(toEmployeeOption) : employees,
        meta: {
          company_id: companyId,
          count: employees.length,
          fetched_at: new Date().toISOString(),
        },
      })
    }

    const employees = (data ?? []).map((r) => mapEmployeeRow(r, includeFinancial))
    return NextResponse.json({
      success: true,
      employees: optionsOnly ? employees.map(toEmployeeOption) : employees,
      data: optionsOnly ? employees.map(toEmployeeOption) : employees,
      meta: {
        company_id: companyId,
        count: employees.length,
        fetched_at: new Date().toISOString(),
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load employees" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service: client } = ctx

    // Prevent attaching another tenant's subsidiary to this company
    if (body.subsidiary_id) {
      const { data: subsidiary, error: subErr } = await client
        .from("subsidiaries")
        .select("id, company_id")
        .eq("id", body.subsidiary_id)
        .maybeSingle()
      if (subErr) {
        return NextResponse.json({ error: subErr.message }, { status: 500 })
      }
      if (!subsidiary || subsidiary.company_id !== companyId) {
        return NextResponse.json(
          { error: "subsidiary_id does not belong to this company" },
          { status: 400 },
        )
      }
    }

    if (!body.first_name || !body.last_name) {
      return NextResponse.json({ error: "first_name and last_name are required" }, { status: 400 })
    }

    const fullName =
      body.full_name ||
      body.display_name ||
      `${body.first_name} ${body.last_name}`.trim()

    // Ensure sequential employee_id: use provided code if unique, else allocate next
    let employeeCode = body.employee_id ? String(body.employee_id).trim() : ""
    if (employeeCode) {
      const { data: clash } = await client
        .from("employees")
        .select("id")
        .eq("company_id", companyId)
        .eq("employee_id", employeeCode)
        .maybeSingle()
      if (clash) employeeCode = ""
    }
    if (!employeeCode) {
      const prefix = String(body.prefix || employeeCode || "EMP")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 4)
        .padEnd(4, "X")
      const { data: rpcCode } = await client.rpc("next_employee_code", {
        p_company_id: companyId,
        p_prefix: prefix,
      })
      if (rpcCode) {
        employeeCode = String(rpcCode)
      } else {
        const { data: existing } = await client
          .from("employees")
          .select("employee_id")
          .eq("company_id", companyId)
        let max = 0
        for (const row of existing ?? []) {
          const code = String(row.employee_id || "")
          if (!code.startsWith(prefix)) continue
          const n = Number(code.slice(prefix.length))
          if (Number.isFinite(n) && n > max) max = n
        }
        employeeCode = `${prefix}${String(max + 1).padStart(4, "0")}`
      }
    }

    const employeePayload = {
      company_id: companyId,
      employee_id: employeeCode,
      prefix: body.prefix ?? null,
      first_name: body.first_name,
      other_names: body.other_names ?? null,
      last_name: body.last_name,
      full_name: fullName,
      display_name: body.display_name ?? fullName,
      personal_email: body.personal_email ?? null,
      corporate_email: body.corporate_email ?? null,
      phone: body.phone ?? body.phone_number ?? null,
      position: body.position ?? null,
      department: body.department ?? null,
      division: body.division ?? null,
      location: body.location ?? null,
      status: normalizeEmployeeStatus(body.status ?? "Active"),
      special_role: body.special_role ?? null,
      subsidiary_id: body.subsidiary_id ?? null,
      contract_type: body.contract_type ?? "Permanent",
      date_of_joining: body.date_of_joining ?? null,
      date_of_exit: body.date_of_exit ?? null,
      date_of_birth: body.date_of_birth ?? null,
      gender: body.gender ?? null,
      marital_status: body.marital_status ?? null,
      address: body.address ?? null,
      ghana_card_number: body.ghana_card_number ?? null,
      direct_supervisor: body.direct_supervisor ?? null,
      head_of_department: body.head_of_department ?? null,
      emergency_contact_name: body.emergency_contact_name ?? null,
      emergency_contact_tel: body.emergency_contact_tel ?? null,
      educational_level: body.educational_level ?? null,
      inactive_reason: body.inactive_reason ?? null,
      probation_period: body.probation_period != null ? Number(body.probation_period) : null,
      confirmation_date: body.confirmation_date ?? null,
      notice_period: body.notice_period ?? null,
      profile_picture: body.profile_picture ?? null,
      updated_at: new Date().toISOString(),
    }

    const { data: created, error } = await client
      .from("employees")
      .insert(employeePayload)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const financial = body.financial ?? null
    if (financial || body.monthly_salary != null || body.salary != null) {
      const monthly = Number(
        financial?.monthly_salary ?? body.monthly_salary ?? body.salary ?? 0,
      )
      const finPayload = {
        employee_id: created.id,
        monthly_salary: monthly,
        annual_salary:
          financial?.annual_salary != null
            ? Number(financial.annual_salary)
            : monthly > 0
              ? monthly * 12
              : null,
        transport_allowance: Number(financial?.transport_allowance ?? 0),
        housing_allowance: Number(financial?.housing_allowance ?? 0),
        medical_allowance: Number(financial?.medical_allowance ?? 0),
        meal_allowance: Number(financial?.meal_allowance ?? 0),
        communication_allowance: Number(financial?.communication_allowance ?? 0),
        uniform_allowance: Number(financial?.uniform_allowance ?? 0),
        other_allowances: Number(financial?.other_allowances ?? 0),
        bank_name: financial?.bank_name ?? body.bank_name ?? "Pending",
        bank_branch: financial?.bank_branch ?? body.bank_branch ?? null,
        bank_account_number: financial?.bank_account_number ?? body.bank_account_number ?? "Pending",
        ssnit_number: financial?.ssnit_number ?? body.ssnit_number ?? "Pending",
        tier3_contribution: Number(financial?.tier3_contribution ?? 0),
        provident_fund_enrolled: Boolean(
          financial?.provident_fund_enrolled ?? body.provident_fund_enrolled ?? false,
        ),
        provident_fund_rate: Math.min(
          16.5,
          Math.max(0, Number(financial?.provident_fund_rate ?? body.provident_fund_rate ?? 0)),
        ),
        updated_at: new Date().toISOString(),
      }
      if (finPayload.provident_fund_enrolled && Number(finPayload.tier3_contribution) === 0) {
        finPayload.tier3_contribution = 1
      }
      if (!finPayload.provident_fund_enrolled) {
        finPayload.provident_fund_rate = 0
        finPayload.tier3_contribution = 0
      }

      const { error: finError } = await client
        .from("employee_financial")
        .upsert(finPayload, { onConflict: "employee_id" })

      if (finError) {
        // retry plain insert if no unique constraint yet
        await client.from("employee_financial").insert(finPayload)
      }
    }

    // Persist selected payroll allowances / deductions
    if (Array.isArray(body.allowances) && body.allowances.length) {
      const rows = body.allowances.map((a: any) => ({
        employee_id: created.id,
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

    if (Array.isArray(body.deductions) && body.deductions.length) {
      const rows = body.deductions.map((d: any) => ({
        employee_id: created.id,
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

    if (Array.isArray(body.documents) && body.documents.length) {
      for (const doc of body.documents) {
        const documentType = doc.documentType || doc.document_type || doc.type || null
        const fileUrl = doc.fileUrl || doc.file_url || doc.url || doc.path || doc.file_path || null
        const { data: empDoc } = await client
          .from("employee_documents")
          .insert({
            employee_id: created.id,
            document_type: documentType,
            document_name: doc.fileName || doc.document_name || doc.name || null,
            file_name: doc.fileName || doc.file_name || doc.name || null,
            file_path: fileUrl,
            file_url: fileUrl,
            file_size: doc.fileSize || doc.file_size || doc.size || null,
            mime_type: doc.fileType || doc.mime_type || null,
            file_content:
              doc.file_content || (typeof fileUrl === "string" && fileUrl.startsWith("data:") ? fileUrl : null),
            vault_document_id: doc.vaultDocumentId || doc.vault_document_id || null,
            upload_date: new Date().toISOString(),
            uploaded_by: doc.uploadedBy || "HR Admin",
            notes: doc.notes || null,
          })
          .select()
          .single()

        const vaultId = doc.vaultDocumentId || doc.vault_document_id
        if (vaultId && String(vaultId).length > 20) {
          const { error: linkErr } = await client
            .from("document_vault")
            .update({
              employee_id: created.id,
              employee_name: created.full_name || created.display_name,
              company_id: created.company_id,
              file_url: fileUrl,
              file_name: doc.fileName || doc.file_name || doc.name,
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
            employee_id: created.id,
            employee_name: created.full_name || created.display_name,
            document_type: documentType || "other",
            file_name: doc.fileName || doc.file_name || doc.name || "document",
            file_size: Number(doc.fileSize || doc.file_size || 0),
            file_type: doc.fileType || doc.mime_type || "application/octet-stream",
            file_url: fileUrl,
            source: "employee-onboarding",
            category: "employee-document",
            company_id: created.company_id,
            notes: empDoc?.id ? `Employee document ${empDoc.id}` : "Employee onboarding document",
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

    // Return with financial for list consistency
    const { data: fin } = await client
      .from("employee_financial")
      .select("*")
      .eq("employee_id", created.id)
      .maybeSingle()
    const [allowances, deductions, documents] = await Promise.all([
      client.from("employee_allowances").select("*").eq("employee_id", created.id),
      client.from("employee_deductions").select("*").eq("employee_id", created.id),
      client.from("employee_documents").select("*").eq("employee_id", created.id),
    ])

    const mapped = mapEmployeeRow({ ...created, financial: fin }, true, {
      allowances: allowances.data ?? [],
      deductions: deductions.data ?? [],
      documents: documents.data ?? [],
    })
    return NextResponse.json({ success: true, employee: mapped, data: mapped }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create employee" },
      { status: 500 },
    )
  }
}
