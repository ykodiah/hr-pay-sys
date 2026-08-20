import { NextRequest, NextResponse } from "next/server"
import { isUnresolvedTenant, resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"

const CATEGORIES = new Set(["allowance", "deduction", "provident_fund", "bonus", "backpay"])
const SCOPES = new Set(["individual", "department", "location", "division", "subsidiary", "csv"])
const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/

async function isClosed(service: any, companyId: string, period: string) {
  const { data } = await service
    .from("payroll_periods")
    .select("status")
    .eq("company_id", companyId)
    .eq("pay_period", period)
    .maybeSingle()
  return data?.status === "closed"
}

function valueForScope(employee: any, scope: string) {
  if (scope === "subsidiary") return employee.subsidiary_id
  return employee[scope]
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    const { companyId, service } = ctx
    const params = new URL(req.url).searchParams
    const period = params.get("pay_period") || new Date().toISOString().slice(0, 7)
    const category = params.get("category")
    if (!PERIOD_RE.test(period)) {
      return NextResponse.json({ error: "pay_period must use YYYY-MM" }, { status: 400 })
    }

    let assignmentsQuery = service
      .from("payroll_component_assignments")
      .select("*, employee:employees(id, employee_id, first_name, last_name, department, location, division, subsidiary_id)")
      .eq("company_id", companyId)
      .lte("effective_period", period)
      .or(`end_period.is.null,end_period.gte.${period}`)
      .order("created_at", { ascending: false })
    if (category && CATEGORIES.has(category)) assignmentsQuery = assignmentsQuery.eq("category", category)

    const [assignmentRes, employeeRes, subsidiaryRes, periodRes] = await Promise.all([
      assignmentsQuery,
      service
        .from("employees")
        .select("id, employee_id, first_name, last_name, department, location, division, subsidiary_id, status")
        .eq("company_id", companyId)
        .in("status", ["Active", "active", "ACTIVE"])
        .order("first_name"),
      service.from("subsidiaries").select("id, name").eq("company_id", companyId).order("name"),
      service
        .from("payroll_periods")
        .select("*")
        .eq("company_id", companyId)
        .eq("pay_period", period)
        .maybeSingle(),
    ])
    if (assignmentRes.error) throw assignmentRes.error
    if (employeeRes.error) throw employeeRes.error

    return NextResponse.json({
      assignments: assignmentRes.data || [],
      employees: employeeRes.data || [],
      subsidiaries: subsidiaryRes.data || [],
      period: periodRes.data || { pay_period: period, status: "open" },
    })
  } catch (error) {
    return jsonError(error, "Failed to load payroll components")
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    const { companyId, userId, service } = ctx

    const category = String(body.category || "")
    const scopeType = String(body.scope_type || "individual")
    const period = String(body.effective_period || "")
    const calculationType = body.calculation_type === "percentage" ? "percentage" : "amount"
    if (!CATEGORIES.has(category) || !SCOPES.has(scopeType)) {
      return NextResponse.json({ error: "Invalid category or assignment scope" }, { status: 400 })
    }
    if (!PERIOD_RE.test(period)) {
      return NextResponse.json({ error: "Effective period must use YYYY-MM" }, { status: 400 })
    }
    if (await isClosed(service, companyId, period)) {
      return NextResponse.json({ error: `${period} is closed. Reopen it before adding entries.` }, { status: 409 })
    }
    const amount = Number(body.amount || 0)
    const percentage = Number(body.percentage || 0)
    if ((calculationType === "amount" && amount <= 0) || (calculationType === "percentage" && percentage <= 0)) {
      return NextResponse.json({ error: "Enter an amount or percentage greater than zero" }, { status: 400 })
    }

    const requestedIds = Array.isArray(body.employee_ids)
      ? body.employee_ids.map(String).filter(Boolean)
      : body.employee_id
        ? [String(body.employee_id)]
        : []
    const { data: employees, error: employeeError } = await service
      .from("employees")
      .select("id, employee_id, department, location, division, subsidiary_id, status")
      .eq("company_id", companyId)
      .in("status", ["Active", "active", "ACTIVE"])
    if (employeeError) throw employeeError

    const scopeValue = String(body.scope_value || "")
    const selected = (employees || []).filter((employee: any) => {
      if (scopeType === "individual" || scopeType === "csv") return requestedIds.includes(employee.id)
      return String(valueForScope(employee, scopeType) || "") === scopeValue
    })
    if (!selected.length) {
      return NextResponse.json({ error: "No active employees matched this assignment" }, { status: 400 })
    }

    const batchId = crypto.randomUUID()
    const payload = selected.map((employee: any) => ({
      company_id: companyId,
      employee_id: employee.id,
      category,
      code: String(body.code || category).trim().toUpperCase(),
      name: String(body.name || body.code || category).trim(),
      calculation_type: calculationType,
      amount: calculationType === "amount" ? amount : 0,
      percentage: calculationType === "percentage" ? percentage : 0,
      taxable: body.taxable !== false,
      recurring: body.recurring !== false,
      effective_period: period,
      end_period: body.recurring === false ? period : body.end_period || null,
      backpay_treatment:
        category === "backpay"
          ? body.backpay_treatment === "separate_run"
            ? "separate_run"
            : "include_in_period"
          : null,
      source_scope_type: scopeType,
      source_scope_value: scopeValue || null,
      source_batch_id: batchId,
      notes: body.notes || null,
      created_by: userId,
    }))
    const { data, error } = await service.from("payroll_component_assignments").insert(payload).select()
    if (error) throw error

    return NextResponse.json({ success: true, assigned: data?.length || 0, batch_id: batchId, assignments: data })
  } catch (error) {
    return jsonError(error, "Failed to create payroll assignment")
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    const { companyId, service } = ctx
    const { data: row } = await service
      .from("payroll_component_assignments")
      .select("effective_period")
      .eq("id", body.id)
      .eq("company_id", companyId)
      .maybeSingle()
    if (!row) return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    if (await isClosed(service, companyId, row.effective_period)) {
      return NextResponse.json({ error: "Assignments in a closed period cannot be changed" }, { status: 409 })
    }
    const { error } = await service
      .from("payroll_component_assignments")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .eq("company_id", companyId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return jsonError(error, "Failed to remove payroll assignment")
  }
}
