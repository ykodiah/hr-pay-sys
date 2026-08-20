import { NextRequest, NextResponse } from "next/server"
import { isUnresolvedTenant, resolveTenantContext } from "@/lib/settings/resolve-tenant"

const CATEGORIES = new Set(["allowance", "deduction", "provident_fund", "bonus", "backpay"])

const HEADERS = [
  "employee_id",
  "component_code",
  "component_name",
  "description",
  "calculation_type",
  "calculation_basis",
  "amount",
  "percentage",
  "rate",
  "quantity",
  "employer_amount",
  "employer_percentage",
  "currency_code",
  "frequency",
  "tax_treatment",
  "pensionable",
  "proratable",
  "include_in_overtime_base",
  "effective_period",
  "end_period",
  "source_period",
  "reason_code",
  "payment_method",
  "pay_date",
  "gl_debit_account",
  "gl_credit_account",
  "cost_center",
  "project_code",
  "external_reference",
  "notes",
]

function cell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`
}

export async function GET(req: NextRequest) {
  const ctx = await resolveTenantContext(req)
  if (ctx instanceof NextResponse) return ctx
  if (isUnresolvedTenant(ctx)) return NextResponse.json({ error: "Company not resolved" }, { status: 400 })

  const params = new URL(req.url).searchParams
  const category = params.get("category") || "allowance"
  const period = params.get("pay_period") || new Date().toISOString().slice(0, 7)
  if (!CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Invalid component category" }, { status: 400 })
  }

  const { data: employees } = await ctx.service
    .from("employees")
    .select("employee_id, first_name, last_name")
    .eq("company_id", ctx.companyId)
    .in("status", ["Active", "active", "ACTIVE"])
    .order("employee_id")

  const defaults: Record<string, string> = {
    calculation_type: "amount",
    calculation_basis: "basic_salary",
    currency_code: "GHS",
    frequency: category === "bonus" || category === "backpay" ? "one_time" : "monthly",
    tax_treatment: category === "deduction" ? "post_tax" : "taxable",
    pensionable: "false",
    proratable: "false",
    include_in_overtime_base: "false",
    effective_period: period,
    source_period: category === "backpay" ? period : "",
    reason_code: category === "backpay" ? "PAY_CORRECTION" : "",
    payment_method: "with_payroll",
  }

  const rows = (employees || []).map((employee: any) => {
    const row: Record<string, unknown> = { ...defaults, employee_id: employee.employee_id }
    return HEADERS.map((header) => cell(row[header])).join(",")
  })
  const instructions = [
    "# Keep the header row unchanged. Delete employees who should not receive this component.",
    "# Required: employee_id, component_code, component_name, calculation_type and effective_period.",
    "# calculation_type: amount | percentage | rate_x_quantity. Dates: YYYY-MM or YYYY-MM-DD as indicated.",
  ]
  const csv = [...instructions, HEADERS.map(cell).join(","), ...rows].join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${period}-${category}-pay-components-template.csv\"`,
      "Cache-Control": "no-store",
    },
  })
}
