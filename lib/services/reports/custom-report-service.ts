/**
 * Custom report definitions + runner.
 * Users design column sets against payroll/employee/loan/banking field catalogs.
 */

import { createClient } from "@/lib/supabase/server"
import { toCSV } from "./csv"
import type { PayrollReportRow, ReportColumn } from "./types"
import { CUSTOM_FIELD_CATALOG, type CustomDataSource } from "./field-catalog"

export type { ReportColumn }
export { CUSTOM_FIELD_CATALOG }
export type { CustomDataSource }

export type CustomCategory = "compliance" | "financial" | "banking" | "payroll" | "custom"

export interface CustomReportDefinition {
  id?: string
  company_id: string
  name: string
  description?: string
  category: CustomCategory
  data_source: CustomDataSource
  columns: ReportColumn[]
  filters?: unknown[]
  is_active?: boolean
}

async function fetchPayrollRows(companyId: string, payPeriod: string): Promise<PayrollReportRow[]> {
  // Reuse engine fetch via generateReport path — call the view/fallback directly
  const { generateReport } = await import("./engine")
  // Generate payroll_summary just to get rows is wasteful; query view/fallback here
  const client = await createClient()
  const { data, error } = await client
    .from("v_payroll_report_summary")
    .select("*")
    .eq("company_id", companyId)
    .eq("pay_period", payPeriod)

  if (!error && data) return data as PayrollReportRow[]

  // Force a lightweight generate to reuse fallback mapping
  try {
    const report = await generateReport({
      company_id: companyId,
      report_type: "payroll_summary",
      pay_period: payPeriod,
    })
    // Map summary rows back — they are already shaped; for custom we need full fields
    // Fall through to empty if that also fails
    void report
  } catch {
    /* continue */
  }

  // Direct payslip fallback
  const { data: payslips } = await client
    .from("payslips")
    .select(
      `*, employee:employees(employee_id, first_name, last_name, department, position, ghana_card_number),
       financial:employee_financial(bank_name, bank_account_number, ssnit_number)`,
    )
    .eq("company_id", companyId)
    .eq("pay_period", payPeriod)

  return (payslips ?? []).map((p: any) => {
    const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee
    const fin = Array.isArray(p.financial) ? p.financial[0] : p.financial
    const totalAllowances =
      Number(p.transport_allowance ?? 0) +
      Number(p.housing_allowance ?? 0) +
      Number(p.medical_allowance ?? 0) +
      Number(p.meal_allowance ?? 0) +
      Number(p.communication_allowance ?? 0) +
      Number(p.other_allowances ?? 0)
    return {
      company_id: companyId,
      payroll_run_id: p.payroll_run_id,
      pay_period: p.pay_period,
      pay_period_start: p.pay_period_start,
      pay_period_end: p.pay_period_end,
      pay_date: p.pay_date,
      employee_id: p.employee_id,
      employee_name: emp ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() : "",
      employee_id_no: emp?.employee_id ?? "",
      position: emp?.position ?? "",
      department: emp?.department ?? "",
      ssnit_number: fin?.ssnit_number ?? "",
      bank_name: fin?.bank_name ?? "",
      account_number: fin?.bank_account_number ?? "",
      company_name: p.snapshot_company_name ?? "",
      ghana_card_number: emp?.ghana_card_number ?? "",
      snapshot_subsidiary: p.snapshot_subsidiary ?? emp?.subsidiary_name ?? null,
      snapshot_division: p.snapshot_division ?? emp?.division ?? null,
      snapshot_location: p.snapshot_location ?? emp?.location ?? null,
      date_of_joining: null,
      contract_type: null,
      basic_salary: Number(p.basic_salary ?? 0),
      transport_allowance: Number(p.transport_allowance ?? 0),
      housing_allowance: Number(p.housing_allowance ?? 0),
      medical_allowance: Number(p.medical_allowance ?? 0),
      meal_allowance: Number(p.meal_allowance ?? 0),
      communication_allowance: Number(p.communication_allowance ?? 0),
      other_allowances: Number(p.other_allowances ?? 0),
      overtime_pay: Number(p.overtime_pay ?? 0),
      bonus_pay: Number(p.bonus_pay ?? 0),
      total_allowances: totalAllowances,
      gross_pay: Number(p.gross_pay ?? 0),
      ssnit_employee: Number(p.ssnit_employee ?? 0),
      ssnit_employer: Number(p.ssnit_employer ?? 0),
      tier2_employee: Number(p.tier2_employee ?? 0),
      tier2_employer: Number(p.tier2_employer ?? 0),
      tier3_employee: Number(p.tier3_employee ?? 0),
      tier3_employer: Number(p.tier3_employer ?? 0),
      paye_taxable_income: Number(p.paye_taxable_income ?? 0),
      tax_relief_total: Number(p.tax_relief_total ?? 0),
      paye_tax: Number(p.paye_tax ?? 0),
      loan_deduction: Number(p.loan_deduction ?? 0),
      advance_deduction: Number(p.advance_deduction ?? 0),
      other_deductions: Number(p.other_deductions ?? 0),
      total_deductions: Number(p.total_deductions ?? 0),
      net_pay: Number(p.net_pay ?? 0),
      total_employer_cost: Number(p.total_employer_cost ?? 0),
      cost_to_company:
        Number(p.gross_pay ?? 0) +
        Number(p.ssnit_employer ?? 0) +
        Number(p.tier2_employer ?? 0) +
        Number(p.tier3_employer ?? 0),
      payslip_status: p.status ?? "draft",
      loan_amount: null,
      current_loan_balance: Number(p.loan_balance ?? 0),
      current_loan_deduction: Number(p.loan_deduction ?? 0),
    } as PayrollReportRow
  })
}

export async function listCustomDefinitions(companyId: string) {
  const client = await createClient()
  const { data, error } = await client
    .from("custom_report_definitions")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function saveCustomDefinition(def: CustomReportDefinition, userId?: string) {
  const client = await createClient()
  const payload = {
    company_id: def.company_id,
    name: def.name,
    description: def.description ?? null,
    category: def.category,
    data_source: def.data_source,
    columns: def.columns,
    filters: def.filters ?? [],
    is_active: def.is_active ?? true,
    created_by: userId ?? null,
    updated_at: new Date().toISOString(),
  }

  if (def.id) {
    const { data, error } = await client
      .from("custom_report_definitions")
      .update(payload)
      .eq("id", def.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await client
    .from("custom_report_definitions")
    .insert(payload)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function runCustomReport(options: {
  companyId: string
  definitionId?: string
  definition?: CustomReportDefinition
  payPeriod: string
  filters?: Record<string, string | null>
}) {
  const client = await createClient()
  let def = options.definition

  if (!def && options.definitionId) {
    const { data, error } = await client
      .from("custom_report_definitions")
      .select("*")
      .eq("id", options.definitionId)
      .single()
    if (error) throw new Error(error.message)
    def = data as CustomReportDefinition
  }

  if (!def?.columns?.length) {
    throw new Error("Custom report must include at least one column")
  }

  let sourceRows = await fetchPayrollRows(options.companyId, options.payPeriod)

  // Apply any filters passed in (from custom designer or saved definition)
  const filters = (options.filters ?? (def as any)?.filters ?? {}) as Record<string, string | null>
  if (filters.subsidiary) {
    sourceRows = sourceRows.filter((r) => {
      const sub = (r as any).snapshot_subsidiary ?? ""
      return sub === filters.subsidiary
    })
  }
  if (filters.division) {
    sourceRows = sourceRows.filter((r) => {
      const div = (r as any).snapshot_division ?? (r as any).division ?? ""
      return div === filters.division
    })
  }
  if (filters.location) {
    sourceRows = sourceRows.filter((r) => {
      const loc = (r as any).snapshot_location ?? (r as any).location ?? ""
      return loc === filters.location
    })
  }

  const columns = def.columns as ReportColumn[]
  const typedRows = sourceRows.map((row) => {
    const out: Record<string, unknown> = {}
    for (const col of columns) {
      out[col.key] = (row as any)[col.key] ?? ""
    }
    return out
  })

  const csv = toCSV(columns, typedRows, {
    title: def.name,
    company: sourceRows[0]?.company_name ?? undefined,
    period: options.payPeriod,
    generatedAt: new Date().toISOString(),
  })

  // Persist a compliance_reports row for history/download audit
  try {
    await client.from("compliance_reports").insert({
      company_id: options.companyId,
      report_type: "custom",
      report_name: def.name,
      pay_period: options.payPeriod,
      tax_year: Number(options.payPeriod.slice(0, 4)),
      row_count: typedRows.length,
      export_format: "csv",
      status: "generated",
      summary: { total_rows: typedRows.length },
      columns,
    })
  } catch {
    /* non-fatal */
  }

  return {
    report_name: def.name,
    pay_period: options.payPeriod,
    row_count: typedRows.length,
    columns,
    rows: typedRows,
    csv,
    generated_at: new Date().toISOString(),
  }
}
