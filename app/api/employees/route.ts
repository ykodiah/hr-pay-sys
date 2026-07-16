/**
 * GET  /api/employees?company_id=&status=&q=&include_financial=&limit=
 * POST /api/employees  — create employee (+ optional financial)
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { ACTIVE_EMPLOYEE_STATUSES, normalizeEmployeeStatus } from "@/lib/employees/status"
import { mapEmployeeRow, toEmployeeOption } from "@/lib/employees/dto"

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const { searchParams } = new URL(req.url)
    let companyId = searchParams.get("company_id")
    const status = searchParams.get("status")
    const q = searchParams.get("q")?.trim()
    const includeFinancial = searchParams.get("include_financial") === "true"
    const optionsOnly = searchParams.get("options") === "true"
    const limit = Math.min(Number(searchParams.get("limit") ?? 500), 2000)

    if (!companyId) {
      const resolved = await resolveCompanyId(client, user.isDemo ? null : user.id)
      companyId = resolved?.companyId ?? null
    }

    if (!companyId) {
      return NextResponse.json({ error: "company_id is required" }, { status: 400 })
    }

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
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const body = await req.json()

    let companyId = body.company_id as string | undefined
    if (!companyId) {
      const resolved = await resolveCompanyId(client, user.isDemo ? null : user.id)
      companyId = resolved?.companyId
    }
    if (!companyId) {
      return NextResponse.json({ error: "company_id is required" }, { status: 400 })
    }

    if (!body.first_name || !body.last_name) {
      return NextResponse.json({ error: "first_name and last_name are required" }, { status: 400 })
    }

    const fullName =
      body.full_name ||
      body.display_name ||
      `${body.first_name} ${body.last_name}`.trim()

    const employeePayload = {
      company_id: companyId,
      employee_id: body.employee_id ?? null,
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
        bank_account_number: financial?.bank_account_number ?? body.bank_account_number ?? "Pending",
        ssnit_number: financial?.ssnit_number ?? body.ssnit_number ?? "Pending",
        tier3_contribution: Number(financial?.tier3_contribution ?? 0),
        updated_at: new Date().toISOString(),
      }

      const { error: finError } = await client
        .from("employee_financial")
        .upsert(finPayload, { onConflict: "employee_id" })

      if (finError) {
        // retry plain insert if no unique constraint yet
        await client.from("employee_financial").insert(finPayload)
      }
    }

    const mapped = mapEmployeeRow(created, false)
    return NextResponse.json({ success: true, employee: mapped, data: mapped }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create employee" },
      { status: 500 },
    )
  }
}
