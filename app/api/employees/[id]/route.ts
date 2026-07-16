/**
 * GET    /api/employees/[id]
 * PATCH  /api/employees/[id]
 * DELETE /api/employees/[id]  — soft deactivate
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { normalizeEmployeeStatus } from "@/lib/employees/status"
import { mapEmployeeRow } from "@/lib/employees/dto"

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
      return NextResponse.json({ success: true, employee: mapEmployeeRow(row, includeFinancial) })
    }

    return NextResponse.json({
      success: true,
      employee: mapEmployeeRow(data, includeFinancial),
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
        "bank_account_number",
        "ssnit_number",
        "tier3_contribution",
      ] as const) {
        if (financial?.[key] !== undefined) finPayload[key] = financial[key]
        else if (body[key] !== undefined) finPayload[key] = body[key]
      }

      const { error: finError } = await client
        .from("employee_financial")
        .upsert(finPayload, { onConflict: "employee_id" })
      if (finError) {
        await client.from("employee_financial").upsert(finPayload)
      }
    }

    return NextResponse.json({
      success: true,
      employee: mapEmployeeRow(updated, false),
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
    const client = await createClient()

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
