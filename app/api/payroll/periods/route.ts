import { NextRequest, NextResponse } from "next/server"
import { isUnresolvedTenant, resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/
const COMPONENT_CATEGORIES = ["allowance", "deduction", "provident_fund", "bonus", "backpay"] as const

function csvCell(value: unknown) {
  const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function rowsToCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "No data\n"
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  return [columns.map(csvCell).join(","), ...rows.map((row) => columns.map((key) => csvCell(row[key])).join(","))].join("\n")
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
      const { data, error } = await service
        .from("payroll_periods")
        .update({
          status: "open",
          closed_at: null,
          closed_by: null,
          close_notes: body.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("company_id", companyId)
        .eq("pay_period", period)
        .select()
        .maybeSingle()
      if (error) throw error
      return NextResponse.json({ success: true, period: data || { pay_period: period, status: "open" } })
    }

    const start = `${period}-01`
    const { data: run, error: runError } = await service
      .from("payroll_runs")
      .select("id, status")
      .eq("company_id", companyId)
      .eq("pay_period_start", start)
      .in("status", ["approved", "completed", "paid"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (runError) throw runError
    if (!run) {
      return NextResponse.json(
        { error: "Approve the payroll run for this period before closing it" },
        { status: 409 },
      )
    }

    const now = new Date().toISOString()
    const { data: payrollPeriod, error: periodError } = await service
      .from("payroll_periods")
      .upsert(
        {
          company_id: companyId,
          pay_period: period,
          status: "closed",
          payroll_run_id: run.id,
          closed_at: now,
          closed_by: userId,
          close_notes: body.notes || null,
          updated_at: now,
        },
        { onConflict: "company_id,pay_period" },
      )
      .select()
      .single()
    if (periodError) throw periodError

    const [componentResult, itemResult] = await Promise.all([
      service
        .from("payroll_component_assignments")
        .select("*, employee:employees(employee_id, first_name, last_name, department, location, division, subsidiary_id, employee_financial(monthly_salary))")
        .eq("company_id", companyId)
        .eq("status", "active")
        .lte("effective_period", period)
        .or(`end_period.is.null,end_period.gte.${period}`),
      service
        .from("payroll_items")
        .select("*")
        .eq("company_id", companyId)
        .eq("payroll_run_id", run.id),
    ])
    if (componentResult.error) throw componentResult.error
    if (itemResult.error) throw itemResult.error
    const components = componentResult.data
    const items = itemResult.data

    const snapshots = COMPONENT_CATEGORIES.map((category) => {
      const rows = (components || [])
        .filter((row: any) => row.category === category)
        .map((row: any) => {
          const employee = Array.isArray(row.employee) ? row.employee[0] : row.employee
          const financial = Array.isArray(employee?.employee_financial)
            ? employee.employee_financial[0]
            : employee?.employee_financial
          const basic = Number(financial?.monthly_salary || 0)
          const appliedAmount =
            row.calculation_type === "percentage"
              ? Math.round((basic * Number(row.percentage || 0)) / 100 * 100) / 100
              : row.calculation_type === "rate_x_quantity"
                ? Math.round(Number(row.rate || 0) * Number(row.quantity || 0) * 100) / 100
                : Number(row.amount || 0)
          return { ...row, applied_amount: appliedAmount }
        })
      return {
        company_id: companyId,
        payroll_period_id: payrollPeriod.id,
        pay_period: period,
        category,
        row_count: rows.length,
        total_amount: rows.reduce((sum: number, row: any) => sum + Number(row.applied_amount || 0), 0),
        data: rows,
        generated_by: userId,
      }
    })
    snapshots.push({
      company_id: companyId,
      payroll_period_id: payrollPeriod.id,
      pay_period: period,
      category: "payroll" as any,
      row_count: items?.length || 0,
      total_amount: (items || []).reduce((sum: number, row: any) => sum + Number(row.net_pay || 0), 0),
      data: items || [],
      generated_by: userId,
    })
    const { error: snapshotError } = await service
      .from("payroll_period_snapshots")
      .upsert(snapshots, { onConflict: "payroll_period_id,category" })
    if (snapshotError) throw snapshotError

    return NextResponse.json({ success: true, period: payrollPeriod, snapshots: snapshots.length })
  } catch (error) {
    return jsonError(error, "Failed to update payroll period")
  }
}
