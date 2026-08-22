import { NextRequest, NextResponse } from "next/server"
import { isUnresolvedTenant, resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"
import { definitionRowsForCompany } from "@/lib/payroll/component-catalogue"

const CATEGORIES = new Set(["allowance", "deduction", "provident_fund", "bonus", "backpay"])
const SCOPES = new Set([
  "individual",
  "all_employees",
  "job_title",
  "department",
  "location",
  "division",
  "subsidiary",
  "csv",
])
const CALCULATION_TYPES = new Set(["amount", "percentage", "rate_x_quantity"])
const CALCULATION_BASES = new Set(["basic_salary", "gross_pay", "taxable_pay", "fixed", "custom"])
const FREQUENCIES = new Set(["one_time", "monthly", "quarterly", "annual", "per_payroll"])
const TAX_TREATMENTS = new Set(["taxable", "non_taxable", "tax_relief", "post_tax"])
const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/

async function isClosed(service: any, companyId: string, period: string) {
  const { data, error } = await service
    .from("payroll_periods")
    .select("status")
    .eq("company_id", companyId)
    .eq("pay_period", period)
    .maybeSingle()
  if (error) throw new Error(`Payroll period control unavailable: ${error.message}`)
  return data?.status === "closed"
}

function valueForScope(employee: any, scope: string) {
  if (scope === "subsidiary") return employee.subsidiary_id
  if (scope === "job_title") return employee.position || employee.job_title
  return employee[scope]
}

function parseScopeValues(body: any) {
  if (Array.isArray(body.scope_values)) {
    return body.scope_values.map(String).map((value: string) => value.trim()).filter(Boolean)
  }
  const raw = String(body.scope_value || "").trim()
  if (!raw) return [] as string[]
  return raw.split("|").map((value) => value.trim()).filter(Boolean)
}

function bool(value: unknown, fallback = false) {
  if (value == null || value === "") return fallback
  if (typeof value === "boolean") return value
  return ["true", "yes", "1", "y"].includes(String(value).trim().toLowerCase())
}

function number(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function assignmentValue(row: any) {
  if (row.calculation_type === "percentage") return number(row.percentage)
  if (row.calculation_type === "rate_x_quantity") return number(row.rate) * number(row.quantity)
  return number(row.amount)
}

function assignmentPayload(input: any, employeeId: string, context: {
  companyId: string
  userId: string | null
  category: string
  period: string
  scopeType: string
  scopeValue: string
  batchId: string
}) {
  const calculationType = CALCULATION_TYPES.has(String(input.calculation_type))
    ? String(input.calculation_type)
    : "amount"
  const frequency = FREQUENCIES.has(String(input.frequency))
    ? String(input.frequency)
    : bool(input.recurring, true) ? "monthly" : "one_time"
  const recurring = frequency !== "one_time"
  const taxTreatment = TAX_TREATMENTS.has(String(input.tax_treatment))
    ? String(input.tax_treatment)
    : bool(input.taxable, true) ? "taxable" : "non_taxable"
  const paymentMethod = input.payment_method === "separate_run" ? "separate_run" : "with_payroll"
  return {
    company_id: context.companyId,
    employee_id: employeeId,
    component_definition_id: input.component_definition_id || null,
    category: context.category,
    code: String(input.component_code || input.code || context.category).trim().toUpperCase(),
    name: String(input.component_name || input.name || input.code || context.category).trim(),
    description: String(input.description || "").trim() || null,
    calculation_type: calculationType,
    calculation_basis: CALCULATION_BASES.has(String(input.calculation_basis))
      ? String(input.calculation_basis)
      : "basic_salary",
    amount: calculationType === "amount" ? number(input.amount) : 0,
    percentage: calculationType === "percentage" ? number(input.percentage) : 0,
    rate: calculationType === "rate_x_quantity" ? number(input.rate) : 0,
    quantity: calculationType === "rate_x_quantity" ? number(input.quantity) : 1,
    employer_amount: number(input.employer_amount),
    employer_percentage: number(input.employer_percentage),
    min_amount: input.min_amount === "" || input.min_amount == null ? null : number(input.min_amount),
    max_amount: input.max_amount === "" || input.max_amount == null ? null : number(input.max_amount),
    currency_code: String(input.currency_code || "GHS").slice(0, 3).toUpperCase(),
    frequency,
    taxable: taxTreatment === "taxable",
    tax_treatment: taxTreatment,
    pensionable: bool(input.pensionable),
    proratable: bool(input.proratable),
    proration_method: String(input.proration_method || "calendar_days"),
    include_in_overtime_base: bool(input.include_in_overtime_base),
    recurring,
    effective_period: String(input.effective_period || context.period),
    end_period: recurring ? input.end_period || null : String(input.effective_period || context.period),
    source_period: input.source_period || null,
    reason_code: input.reason_code || null,
    payment_method: paymentMethod,
    pay_date: input.pay_date || null,
    backpay_treatment:
      context.category === "backpay"
        ? paymentMethod === "separate_run" ? "separate_run" : "include_in_period"
        : null,
    source_scope_type: context.scopeType,
    source_scope_value: context.scopeValue || null,
    source_scope_values: String(context.scopeValue || "")
      .split("|")
      .map((value) => value.trim())
      .filter(Boolean),
    source_batch_id: context.batchId,
    gl_debit_account: input.gl_debit_account || null,
    gl_credit_account: input.gl_credit_account || null,
    cost_center: input.cost_center || null,
    project_code: input.project_code || null,
    external_reference: input.external_reference || null,
    notes: input.notes || null,
    approval_status: input.approval_status || "approved",
    approved_by: input.approval_status === "approved" || !input.approval_status ? context.userId : null,
    approved_at: input.approval_status === "approved" || !input.approval_status ? new Date().toISOString() : null,
    unit_of_measure: input.unit_of_measure || "amount",
    rounding_rule: input.rounding_rule || "nearest_0_01",
    priority: Number(input.priority || 100),
    statutory_code: input.statutory_code || null,
    jurisdiction_code: input.jurisdiction_code || "GH",
    payslip_label: input.payslip_label || null,
    display_on_payslip: bool(input.display_on_payslip, true),
    ytd_cap: input.ytd_cap === "" || input.ytd_cap == null ? null : number(input.ytd_cap),
    period_cap: input.period_cap === "" || input.period_cap == null ? null : number(input.period_cap),
    contribution_tier: input.contribution_tier || null,
    formula_expression: input.formula_expression || null,
    eligibility_notes: input.eligibility_notes || null,
    arrears_months: Number(input.arrears_months || 0),
    override_reason: input.override_reason || null,
    affects_gross_pay: bool(input.affects_gross_pay, true),
    employer_component: bool(input.employer_component),
    created_by: context.userId,
    updated_at: new Date().toISOString(),
  }
}

async function ensureCatalogue(service: any, companyId: string, userId: string | null) {
  const { count, error } = await service
    .from("payroll_component_definitions")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
  if (error) return { seeded: false, error: error.message, definitions: [] as any[] }
  if ((count || 0) > 0) {
    const { data } = await service
      .from("payroll_component_definitions")
      .select("*")
      .eq("company_id", companyId)
      .eq("active", true)
      .order("display_order")
      .order("name")
    return { seeded: false, error: null as string | null, definitions: data || [] }
  }
  const rows = definitionRowsForCompany(companyId, userId)
  const { error: insertError } = await service.from("payroll_component_definitions").upsert(rows, {
    onConflict: "company_id,category,code",
    ignoreDuplicates: true,
  })
  if (insertError) return { seeded: false, error: insertError.message, definitions: [] as any[] }
  const { data } = await service
    .from("payroll_component_definitions")
    .select("*")
    .eq("company_id", companyId)
    .eq("active", true)
    .order("display_order")
    .order("name")
  return { seeded: true, error: null as string | null, definitions: data || [] }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    const { companyId, userId, service } = ctx
    const params = new URL(req.url).searchParams
    const period = params.get("pay_period") || new Date().toISOString().slice(0, 7)
    const category = params.get("category")
    if (!PERIOD_RE.test(period)) {
      return NextResponse.json({ error: "pay_period must use YYYY-MM" }, { status: 400 })
    }

    // Ensure the period row exists so the UI always reflects DB-backed open/closed state.
    await service.from("payroll_periods").upsert(
      {
        company_id: companyId,
        pay_period: period,
        status: "open",
        opened_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id,pay_period", ignoreDuplicates: true },
    )

    let assignmentsQuery = service
      .from("payroll_component_assignments")
      .select("*, employee:employees(id, employee_id, first_name, last_name, department, location, division, subsidiary_id)")
      .eq("company_id", companyId)
      .eq("status", "active")
      .lte("effective_period", period)
      .or(`end_period.is.null,end_period.gte.${period}`)
      .order("created_at", { ascending: false })
    if (category && CATEGORIES.has(category)) assignmentsQuery = assignmentsQuery.eq("category", category)

    const catalogue = await ensureCatalogue(service, companyId, userId)

    const [assignmentRes, employeeRes, subsidiaryRes, periodRes, importRes, runRes, countRes] = await Promise.all([
      assignmentsQuery,
      service
        .from("employees")
        .select("id, employee_id, first_name, last_name, department, location, division, position, job_title, subsidiary_id, status")
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
      service
        .from("payroll_component_import_batches")
        .select("id, category, pay_period, file_name, status, total_rows, valid_rows, invalid_rows, imported_rows, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(10),
      service
        .from("payroll_runs")
        .select("id, status, run_type, pay_period_start, total_net_pay, employee_count, created_at")
        .eq("company_id", companyId)
        .eq("pay_period_start", `${period}-01`)
        .order("created_at", { ascending: false })
        .limit(5),
      service
        .from("payroll_component_assignments")
        .select("category")
        .eq("company_id", companyId)
        .eq("status", "active")
        .lte("effective_period", period)
        .or(`end_period.is.null,end_period.gte.${period}`),
    ])
    if (assignmentRes.error) {
      const missingSchema = /does not exist|schema cache|relation|payroll_component/i.test(assignmentRes.error.message || "")
      return NextResponse.json(
        {
          error: missingSchema
            ? "Payroll component database migration is not installed. Run scripts/20260820_payroll_and_attendance_complete.sql"
            : assignmentRes.error.message,
          setup_required: missingSchema,
          migration: "20260820164500 through 20260820195000",
        },
        { status: missingSchema ? 503 : 500 },
      )
    }
    if (employeeRes.error) throw employeeRes.error

    const definitions = (catalogue.definitions || []).filter((row: any) => !category || row.category === category)
    const assignments = [...(assignmentRes.data || [])].sort(
      (a: any, b: any) => Number(a.priority || 100) - Number(b.priority || 100),
    )
    const category_counts: Record<string, number> = {
      allowance: 0,
      deduction: 0,
      provident_fund: 0,
      bonus: 0,
      backpay: 0,
    }
    for (const row of countRes.data || []) {
      const key = String(row.category || "")
      if (key in category_counts) category_counts[key] += 1
    }
    return NextResponse.json({
      assignments,
      employees: employeeRes.data || [],
      subsidiaries: subsidiaryRes.data || [],
      definitions,
      imports: importRes.data || [],
      runs: runRes.data || [],
      period: periodRes.data || { pay_period: period, status: "open" },
      category_counts,
      catalogue_seeded: catalogue.seeded,
      database_ready: !catalogue.error && !periodRes.error,
      database_warnings: [
        catalogue.error,
        periodRes.error?.message,
        importRes.error?.message,
        runRes.error?.message,
        countRes.error?.message,
      ].filter(Boolean),
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
    if (body.record_type === "definition") {
      if (!CATEGORIES.has(category)) {
        return NextResponse.json({ error: "Invalid component category" }, { status: 400 })
      }
      const code = String(body.code || "").trim().toUpperCase()
      const name = String(body.name || "").trim()
      if (!code || !name) {
        return NextResponse.json({ error: "Component code and name are required" }, { status: 400 })
      }
      const definition = {
        company_id: companyId,
        category,
        code,
        name,
        description: body.description || null,
        calculation_type: CALCULATION_TYPES.has(String(body.calculation_type)) ? body.calculation_type : "amount",
        calculation_basis: CALCULATION_BASES.has(String(body.calculation_basis)) ? body.calculation_basis : "basic_salary",
        default_amount: number(body.amount),
        default_percentage: number(body.percentage),
        default_rate: number(body.rate),
        currency_code: String(body.currency_code || "GHS").slice(0, 3).toUpperCase(),
        frequency: FREQUENCIES.has(String(body.frequency)) ? body.frequency : "monthly",
        tax_treatment: TAX_TREATMENTS.has(String(body.tax_treatment)) ? body.tax_treatment : "taxable",
        pensionable: bool(body.pensionable),
        proratable: bool(body.proratable),
        include_in_overtime_base: bool(body.include_in_overtime_base),
        affects_gross_pay: body.affects_gross_pay !== false,
        employer_component: bool(body.employer_component),
        min_amount: body.min_amount === "" || body.min_amount == null ? null : number(body.min_amount),
        max_amount: body.max_amount === "" || body.max_amount == null ? null : number(body.max_amount),
        gl_debit_account: body.gl_debit_account || null,
        gl_credit_account: body.gl_credit_account || null,
        cost_center: body.cost_center || null,
        created_by: userId,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await service
        .from("payroll_component_definitions")
        .upsert(definition, { onConflict: "company_id,category,code" })
        .select()
        .single()
      if (error) throw error
      return NextResponse.json({ success: true, definition: data })
    }

    const scopeType = String(body.scope_type || "individual")
    const period = String(body.effective_period || "")
    if (!CATEGORIES.has(category) || !SCOPES.has(scopeType)) {
      return NextResponse.json({ error: "Invalid category or assignment scope" }, { status: 400 })
    }
    if (!PERIOD_RE.test(period)) {
      return NextResponse.json({ error: "Effective period must use YYYY-MM" }, { status: 400 })
    }
    if (await isClosed(service, companyId, period)) {
      return NextResponse.json({ error: `${period} is closed. Reopen it before adding entries.` }, { status: 409 })
    }
    const { error: periodError } = await service.from("payroll_periods").upsert(
      {
        company_id: companyId,
        pay_period: period,
        status: "open",
        opened_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id,pay_period", ignoreDuplicates: true },
    )
    if (periodError) throw periodError
    const requestedIds = Array.from(new Set(
      Array.isArray(body.employee_ids)
        ? body.employee_ids.map(String).map((id: string) => id.trim()).filter(Boolean)
        : body.employee_id
          ? [String(body.employee_id).trim()]
          : [],
    ))
    const { data: employees, error: employeeError } = await service
      .from("employees")
      .select("id, employee_id, department, location, division, position, job_title, subsidiary_id, status")
      .eq("company_id", companyId)
      .in("status", ["Active", "active", "ACTIVE"])
    if (employeeError) throw employeeError

    const scopeValues = parseScopeValues(body)
    const scopeValue = scopeValues.join("|") || String(body.scope_value || "")
    const batchId = crypto.randomUUID()
    const context = { companyId, userId, category, period, scopeType, scopeValue, batchId }
    const csvRows = Array.isArray(body.rows) ? body.rows : []
    if (scopeType === "csv" && csvRows.length) {
      const employeeByCode = new Map(
        (employees || []).map((employee: any) => [String(employee.employee_id || "").trim().toLowerCase(), employee]),
      )
      const errors: Array<{ row: number; employee_id?: string; errors: string[] }> = []
      const payload: any[] = []
      const importRows: any[] = []
      csvRows.forEach((row: any, index: number) => {
        const rowNumber = index + 2
        const code = String(row.employee_id || row.employee_code || "").trim()
        const employee: any = employeeByCode.get(code.toLowerCase())
        const rowErrors: string[] = []
        if (!employee) rowErrors.push(`Employee '${code || "(blank)"}' was not found or is inactive`)
        if (!String(row.component_code || row.code || "").trim()) rowErrors.push("component_code is required")
        if (!String(row.component_name || row.name || "").trim()) rowErrors.push("component_name is required")
        if (!PERIOD_RE.test(String(row.effective_period || period))) rowErrors.push("effective_period must use YYYY-MM")
        const candidate = employee ? assignmentPayload(row, employee.id, { ...context, scopeType: "csv" }) : null
        if (candidate && assignmentValue(candidate) <= 0) {
          rowErrors.push("amount, percentage, or rate × quantity must be greater than zero")
        }
        if (rowErrors.length) errors.push({ row: rowNumber, employee_id: code, errors: rowErrors })
        if (candidate && !rowErrors.length) payload.push(candidate)
        importRows.push({
          batch_id: batchId,
          row_number: rowNumber,
          employee_code: code || null,
          raw_data: row,
          normalized_data: candidate,
          status: rowErrors.length ? "invalid" : "valid",
          errors: rowErrors,
        })
      })

      const fileName = String(body.file_name || `${category}-${period}.csv`)
      const { error: batchError } = await service.from("payroll_component_import_batches").insert({
        id: batchId,
        company_id: companyId,
        category,
        pay_period: period,
        file_name: fileName,
        file_size_bytes: number(body.file_size_bytes),
        status: errors.length ? "failed" : "ready",
        total_rows: csvRows.length,
        valid_rows: payload.length,
        invalid_rows: errors.length,
        source_columns: Object.keys(csvRows[0] || {}),
        validation_errors: errors,
        created_by: userId,
      })
      if (batchError) throw batchError
      const { error: rowsError } = await service.from("payroll_component_import_rows").insert(importRows)
      if (rowsError) throw rowsError
      if (errors.length) {
        return NextResponse.json(
          { error: "CSV validation failed. Correct the listed rows and upload again.", batch_id: batchId, errors },
          { status: 422 },
        )
      }

      const { data, error } = await insertAssignments(service, payload)
      if (error) throw error
      await service
        .from("payroll_component_import_batches")
        .update({
          status: "imported",
          imported_rows: data?.length || 0,
          completed_at: new Date().toISOString(),
        })
        .eq("id", batchId)
        .eq("company_id", companyId)
      return NextResponse.json({
        success: true,
        assigned: data?.length || 0,
        batch_id: batchId,
        assignments: data,
        validation: { total: csvRows.length, valid: payload.length, invalid: 0 },
      })
    }

    const selected = (employees || []).filter((employee: any) => {
      if (scopeType === "individual" || scopeType === "csv") return requestedIds.includes(employee.id)
      if (scopeType === "all_employees") return true
      const employeeValue = String(valueForScope(employee, scopeType) || "")
      if (!scopeValues.length) return false
      return scopeValues.includes(employeeValue)
    })
    if (!selected.length) {
      return NextResponse.json({ error: "No active employees matched this assignment" }, { status: 400 })
    }
    if (["department", "location", "division", "subsidiary", "job_title"].includes(scopeType) && !scopeValues.length) {
      return NextResponse.json({ error: `Select at least one ${scopeType.replaceAll("_", " ")}` }, { status: 400 })
    }

    let componentDefinitionId = body.component_definition_id || null
    if (!componentDefinitionId) {
      const code = String(body.code || category).trim().toUpperCase()
      const { data: definition, error: definitionError } = await service
        .from("payroll_component_definitions")
        .upsert(
          {
            company_id: companyId,
            category,
            code,
            name: String(body.name || code).trim(),
            description: body.description || null,
            calculation_type: CALCULATION_TYPES.has(String(body.calculation_type)) ? body.calculation_type : "amount",
            calculation_basis: CALCULATION_BASES.has(String(body.calculation_basis)) ? body.calculation_basis : "basic_salary",
            default_amount: number(body.amount),
            default_percentage: number(body.percentage),
            default_rate: number(body.rate),
            currency_code: String(body.currency_code || "GHS").slice(0, 3).toUpperCase(),
            frequency: FREQUENCIES.has(String(body.frequency)) ? body.frequency : "monthly",
            tax_treatment: TAX_TREATMENTS.has(String(body.tax_treatment)) ? body.tax_treatment : "taxable",
            pensionable: bool(body.pensionable),
            proratable: bool(body.proratable),
            include_in_overtime_base: bool(body.include_in_overtime_base),
            gl_debit_account: body.gl_debit_account || null,
            gl_credit_account: body.gl_credit_account || null,
            cost_center: body.cost_center || null,
            created_by: userId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "company_id,category,code" },
        )
        .select("id")
        .single()
      if (definitionError) throw definitionError
      componentDefinitionId = definition?.id
    }
    const assignmentInput = { ...body, component_definition_id: componentDefinitionId }
    const payload = selected.map((employee: any) => assignmentPayload(assignmentInput, employee.id, context))
    if (payload.some((row: any) => assignmentValue(row) <= 0)) {
      return NextResponse.json(
        { error: "Amount, percentage, or rate × quantity must be greater than zero" },
        { status: 400 },
      )
    }
    const { data, error } = await insertAssignments(service, payload)
    if (error) throw error

    return NextResponse.json({ success: true, assigned: data?.length || 0, batch_id: batchId, assignments: data })
  } catch (error) {
    return jsonError(error, "Failed to create payroll assignment")
  }
}

async function insertAssignments(service: any, payload: any[]) {
  const first = await service.from("payroll_component_assignments").insert(payload).select()
  if (!first.error) return first
  const message = String(first.error.message || "")
  const columnMatch = message.match(/column ["']?([a-z0-9_]+)["']? .*does not exist/i)
  if (!columnMatch) return first
  const missing = columnMatch[1]
  const trimmed = payload.map((row) => {
    const copy = { ...row }
    delete copy[missing]
    return copy
  })
  return service.from("payroll_component_assignments").insert(trimmed).select()
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
