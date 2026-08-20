import { NextRequest, NextResponse } from "next/server"
import { isUnresolvedTenant, resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/
const COMPONENT_CATEGORIES = ["allowance", "deduction", "provident_fund", "bonus", "backpay"] as const
const CLOSEABLE_RUN_STATUSES = [
  "pending",
  "processed",
  "calculated",
  "submitted",
  "approved",
  "completed",
  "paid",
]

function csvCell(value: unknown) {
  const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function flattenSnapshotRow(row: Record<string, unknown>) {
  const employee = (Array.isArray(row.employee) ? row.employee[0] : row.employee) as any
  return {
    assignment_id: row.id,
    employee_code: employee?.employee_id || "",
    employee_name: `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim(),
    department: employee?.department || "",
    location: employee?.location || "",
    division: employee?.division || "",
    category: row.category,
    code: row.code,
    name: row.name,
    calculation_type: row.calculation_type,
    calculation_basis: row.calculation_basis,
    amount: row.amount,
    percentage: row.percentage,
    rate: row.rate,
    quantity: row.quantity,
    applied_amount: row.applied_amount,
    currency_code: row.currency_code,
    tax_treatment: row.tax_treatment,
    frequency: row.frequency,
    payment_method: row.payment_method,
    backpay_treatment: row.backpay_treatment,
    source_period: row.source_period,
    effective_period: row.effective_period,
    end_period: row.end_period,
    approval_status: row.approval_status,
    gl_debit_account: row.gl_debit_account,
    gl_credit_account: row.gl_credit_account,
    cost_center: row.cost_center,
    notes: row.notes,
  }
}

function rowsToCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "No data\n"
  const flat: Record<string, unknown>[] = rows.map((row) =>
    row.employee || row.applied_amount != null ? flattenSnapshotRow(row) : row,
  )
  const columns = [...new Set(flat.flatMap((row) => Object.keys(row)))]
  return [columns.map(csvCell).join(","), ...flat.map((row) => columns.map((key) => csvCell(row[key])).join(","))].join("\n")
}

async function finalizeWithoutRpc(
  service: any,
  input: {
    companyId: string
    period: string
    runId: string | null
    userId: string | null
    notes: string | null
    snapshots: any[]
  },
) {
  const { data: periodRow, error: upsertError } = await service
    .from("payroll_periods")
    .upsert(
      {
        company_id: input.companyId,
        pay_period: input.period,
        status: "open",
        payroll_run_id: input.runId,
        opened_by: input.userId,
        close_notes: input.notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id,pay_period" },
    )
    .select("*")
    .single()
  if (upsertError) throw upsertError
  if (periodRow.status === "closed") throw new Error(`Payroll period ${input.period} is already closed`)

  for (const snapshot of input.snapshots) {
    const { error } = await service.from("payroll_period_snapshots").upsert(
      {
        company_id: input.companyId,
        payroll_period_id: periodRow.id,
        pay_period: input.period,
        category: snapshot.category,
        row_count: snapshot.row_count,
        total_amount: snapshot.total_amount,
        data: snapshot.data,
        schema_version: 2,
        generated_by: input.userId,
      },
      { onConflict: "payroll_period_id,category" },
    )
    if (error) throw error
  }

  const { data: closed, error: closeError } = await service
    .from("payroll_periods")
    .update({
      status: "closed",
      payroll_run_id: input.runId,
      closed_at: new Date().toISOString(),
      closed_by: input.userId,
      close_notes: input.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", periodRow.id)
    .select("*")
    .single()
  if (closeError) throw closeError

  await service.from("payroll_period_audit").insert({
    company_id: input.companyId,
    payroll_period_id: periodRow.id,
    pay_period: input.period,
    action: "closed",
    actor_id: input.userId,
    reason: input.notes,
    metadata: { payroll_run_id: input.runId },
  })

  return closed
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    const { companyId, service } = ctx
    const params = new URL(req.url).searchParams
    const period = params.get("pay_period") || ""
    const category = params.get("category") || "payroll"
    if (!PERIOD_RE.test(period)) {
      return NextResponse.json({ error: "pay_period must use YYYY-MM" }, { status: 400 })
    }
    const { data: payrollPeriod } = await service
      .from("payroll_periods")
      .select("*")
      .eq("company_id", companyId)
      .eq("pay_period", period)
      .maybeSingle()

    if (params.get("download") === "csv") {
      if (payrollPeriod?.status !== "closed") {
        return NextResponse.json({ error: "Close the period before downloading its audit snapshot" }, { status: 409 })
      }
      const { data: snapshot } = await service
        .from("payroll_period_snapshots")
        .select("data")
        .eq("payroll_period_id", payrollPeriod.id)
        .eq("category", category)
        .maybeSingle()
      const rows = Array.isArray(snapshot?.data) ? snapshot.data : []
      return new NextResponse(rowsToCsv(rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${period}-${category}.csv"`,
        },
      })
    }

    const { data: periods, error } = await service
      .from("payroll_periods")
      .select("*")
      .eq("company_id", companyId)
      .order("pay_period", { ascending: false })
      .limit(36)
    if (error) throw error
    return NextResponse.json({ period: payrollPeriod || { pay_period: period, status: "open" }, periods: periods || [] })
  } catch (error) {
    return jsonError(error, "Failed to load payroll periods")
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    const { companyId, userId, service } = ctx
    const period = String(body.pay_period || "")
    const action = String(body.action || "")
    if (!PERIOD_RE.test(period) || !["close", "reopen"].includes(action)) {
      return NextResponse.json({ error: "Valid pay_period and action are required" }, { status: 400 })
    }

    if (action === "reopen") {
      if (!String(body.notes || "").trim()) {
        return NextResponse.json({ error: "A reason is required to reopen a closed period" }, { status: 400 })
      }
      const { error } = await service.rpc("reopen_payroll_period", {
        p_company_id: companyId,
        p_pay_period: period,
        p_actor_id: userId,
        p_reason: String(body.notes).trim(),
      })
      if (error) {
        // Fallback when RPC is missing
        const { data, error: updateError } = await service
          .from("payroll_periods")
          .update({
            status: "open",
            reopened_at: new Date().toISOString(),
            reopened_by: userId,
            reopen_reason: String(body.notes).trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("company_id", companyId)
          .eq("pay_period", period)
          .eq("status", "closed")
          .select("*")
          .maybeSingle()
        if (updateError) throw updateError
        if (!data) return NextResponse.json({ error: `Closed payroll period ${period} was not found` }, { status: 404 })
        await service.from("payroll_period_audit").insert({
          company_id: companyId,
          payroll_period_id: data.id,
          pay_period: period,
          action: "reopened",
          actor_id: userId,
          reason: String(body.notes).trim(),
        })
        return NextResponse.json({ success: true, period: data })
      }
      const { data } = await service
        .from("payroll_periods")
        .select("*")
        .eq("company_id", companyId)
        .eq("pay_period", period)
        .single()
      return NextResponse.json({ success: true, period: data })
    }

    const start = `${period}-01`
    const { data: run, error: runError } = await service
      .from("payroll_runs")
      .select("id, status, run_type")
      .eq("company_id", companyId)
      .eq("pay_period_start", start)
      .in("status", CLOSEABLE_RUN_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (runError) throw runError

    const [componentResult, itemResult] = await Promise.all([
      service
        .from("payroll_component_assignments")
        .select("*, employee:employees(employee_id, first_name, last_name, department, location, division, subsidiary_id, employee_financial(monthly_salary))")
        .eq("company_id", companyId)
        .eq("status", "active")
        .lte("effective_period", period)
        .or(`end_period.is.null,end_period.gte.${period}`),
      run
        ? service.from("payroll_items").select("*").eq("company_id", companyId).eq("payroll_run_id", run.id)
        : Promise.resolve({ data: [], error: null }),
    ])
    if (componentResult.error) throw componentResult.error
    if (itemResult.error) throw itemResult.error
    const components = componentResult.data
    const items = itemResult.data || []
    const itemByEmployee = new Map<string, any>(items.map((item: any) => [item.employee_id, item]))

    const snapshots = COMPONENT_CATEGORIES.map((category) => {
      const rows = (components || [])
        .filter((row: any) => row.category === category)
        .map((row: any) => {
          const employee = Array.isArray(row.employee) ? row.employee[0] : row.employee
          const financial = Array.isArray(employee?.employee_financial)
            ? employee.employee_financial[0]
            : employee?.employee_financial
          const basic = Number(itemByEmployee.get(row.employee_id)?.basic_salary ?? financial?.monthly_salary ?? 0)
          const appliedAmount =
            row.calculation_type === "percentage"
              ? Math.round(((basic * Number(row.percentage || 0)) / 100) * 100) / 100
              : row.calculation_type === "rate_x_quantity"
                ? Math.round(Number(row.rate || 0) * Number(row.quantity || 0) * 100) / 100
                : Number(row.amount || 0)
          return { ...row, applied_amount: appliedAmount }
        })
      return {
        category,
        row_count: rows.length,
        total_amount: rows.reduce((sum: number, row: any) => sum + Number(row.applied_amount || 0), 0),
        data: rows.map(flattenSnapshotRow),
      }
    })
    snapshots.push({
      category: "payroll" as any,
      row_count: items.length,
      total_amount: items.reduce((sum: number, row: any) => sum + Number(row.net_pay || 0), 0),
      data: items,
    })

    const { error: finalizeError } = await service.rpc("finalize_payroll_period", {
      p_company_id: companyId,
      p_pay_period: period,
      p_payroll_run_id: run?.id || null,
      p_actor_id: userId,
      p_notes: body.notes || null,
      p_snapshots: snapshots,
    })

    let payrollPeriod
    if (finalizeError) {
      payrollPeriod = await finalizeWithoutRpc(service, {
        companyId,
        period,
        runId: run?.id || null,
        userId,
        notes: body.notes || null,
        snapshots,
      })
    } else {
      const { data, error: periodError } = await service
        .from("payroll_periods")
        .select("*")
        .eq("company_id", companyId)
        .eq("pay_period", period)
        .single()
      if (periodError) throw periodError
      payrollPeriod = data
    }

    return NextResponse.json({
      success: true,
      period: payrollPeriod,
      snapshots: snapshots.length,
      run_id: run?.id || null,
      message: run
        ? `Period closed using payroll run ${run.status}`
        : "Period closed with component snapshots (no payroll run found for this month)",
    })
  } catch (error) {
    return jsonError(error, "Failed to update payroll period")
  }
}
