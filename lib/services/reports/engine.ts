/**
 * Compliance Report Engine
 *
 * Queries v_payroll_report_summary (backed by the payslips table) and
 * produces typed, structured report payloads for all 8 Ghana statutory reports.
 * Each generator returns a GeneratedReport<TRow> including a ready-to-download
 * CSV string so the API layer only needs to call one function.
 */

import { createClient } from "@/lib/supabase/server"
import type {
  ReportType,
  PayrollReportRow,
  GeneratedReport,
  ReportColumn,
  ComplianceReportRecord,
} from "./types"
import { REPORT_LABELS } from "./types"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ghs(v: unknown): number {
  return Math.round(Number(v ?? 0) * 100) / 100
}

function toCSV(columns: ReportColumn[], rows: Record<string, unknown>[]): string {
  const header = columns.map((c) => `"${c.label}"`).join(",")
  const body = rows
    .map((r) =>
      columns
        .map((c) => {
          const val = r[c.key]
          if (val === null || val === undefined) return '""'
          if (c.type === "currency" || c.type === "number") return String(ghs(val))
          return `"${String(val).replace(/"/g, '""')}"`
        })
        .join(",")
    )
    .join("\n")
  return `${header}\n${body}`
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchReportRows(
  companyId: string,
  payPeriod?: string,
  payrollRunId?: string
): Promise<PayrollReportRow[]> {
  const client = await createClient()

  let query = client
    .from("v_payroll_report_summary")
    .select("*")
    .eq("company_id", companyId)

  if (payrollRunId) {
    query = query.eq("payroll_run_id", payrollRunId)
  } else if (payPeriod) {
    query = query.eq("pay_period", payPeriod)
  }

  query = query.order("employee_name", { ascending: true })

  const { data, error } = await query
  if (error) throw new Error(`Report data fetch failed: ${error.message}`)
  return (data ?? []) as PayrollReportRow[]
}

// ─── Report generators ────────────────────────────────────────────────────────

/** Report 1 — PAYE Tax Report (for GRA filing) */
function buildPAYEReport(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const columns: ReportColumn[] = [
    { key: "employee_id_no",      label: "Employee ID",          type: "text" },
    { key: "employee_name",       label: "Employee Name",        type: "text" },
    { key: "ghana_card_number",   label: "Ghana Card No.",       type: "text" },
    { key: "department",          label: "Department",           type: "text" },
    { key: "position",            label: "Position",             type: "text" },
    { key: "gross_pay",           label: "Gross Pay (GHS)",      type: "currency" },
    { key: "paye_taxable_income", label: "Taxable Income (GHS)", type: "currency" },
    { key: "tax_relief_total",    label: "Tax Reliefs (GHS)",    type: "currency" },
    { key: "paye_tax",            label: "PAYE Tax (GHS)",       type: "currency" },
  ]

  const typedRows = rows.map((r) => ({
    employee_id_no:      r.employee_id_no ?? "",
    employee_name:       r.employee_name ?? "",
    ghana_card_number:   r.ghana_card_number ?? "",
    department:          r.department ?? "",
    position:            r.position ?? "",
    gross_pay:           ghs(r.gross_pay),
    paye_taxable_income: ghs(r.paye_taxable_income),
    tax_relief_total:    ghs(r.tax_relief_total),
    paye_tax:            ghs(r.paye_tax),
  }))

  const summary = {
    total_employees:    rows.length,
    total_gross_pay:    rows.reduce((s, r) => s + ghs(r.gross_pay), 0),
    total_taxable:      rows.reduce((s, r) => s + ghs(r.paye_taxable_income), 0),
    total_paye_tax:     rows.reduce((s, r) => s + ghs(r.paye_tax), 0),
  }

  return {
    ...meta,
    report_type: "paye",
    report_name: REPORT_LABELS.paye,
    row_count: rows.length,
    columns,
    rows: typedRows,
    summary,
    csv: toCSV(columns, typedRows),
  }
}

/** Report 2 — SSNIT Tier 1 Contributions */
function buildSSNITTier1Report(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const columns: ReportColumn[] = [
    { key: "employee_id_no",    label: "Employee ID",              type: "text" },
    { key: "employee_name",     label: "Employee Name",            type: "text" },
    { key: "ssnit_number",      label: "SSNIT Number",             type: "text" },
    { key: "department",        label: "Department",               type: "text" },
    { key: "insurable_earnings",label: "Insurable Earnings (GHS)", type: "currency" },
    { key: "employee_contrib",  label: "Employee 5.5% (GHS)",      type: "currency" },
    { key: "employer_contrib",  label: "Employer 13% (GHS)",       type: "currency" },
    { key: "total_contrib",     label: "Total Contribution (GHS)", type: "currency" },
  ]

  const typedRows = rows.map((r) => ({
    employee_id_no:     r.employee_id_no ?? "",
    employee_name:      r.employee_name ?? "",
    ssnit_number:       r.ssnit_number ?? "",
    department:         r.department ?? "",
    insurable_earnings: ghs(r.basic_salary), // SSNIT is on basic
    employee_contrib:   ghs(r.ssnit_employee),
    employer_contrib:   ghs(r.ssnit_employer),
    total_contrib:      ghs(r.ssnit_employee) + ghs(r.ssnit_employer),
  }))

  const summary = {
    total_employees:    rows.length,
    total_insurable:    rows.reduce((s, r) => s + ghs(r.basic_salary), 0),
    total_employee:     rows.reduce((s, r) => s + ghs(r.ssnit_employee), 0),
    total_employer:     rows.reduce((s, r) => s + ghs(r.ssnit_employer), 0),
    total_contributions:rows.reduce((s, r) => s + ghs(r.ssnit_employee) + ghs(r.ssnit_employer), 0),
  }

  return {
    ...meta,
    report_type: "ssnit_tier1",
    report_name: REPORT_LABELS.ssnit_tier1,
    row_count: rows.length,
    columns,
    rows: typedRows,
    summary,
    csv: toCSV(columns, typedRows),
  }
}

/** Report 3 — SSNIT Tier 2 (NHIA) Contributions */
function buildSSNITTier2Report(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const columns: ReportColumn[] = [
    { key: "employee_id_no",    label: "Employee ID",              type: "text" },
    { key: "employee_name",     label: "Employee Name",            type: "text" },
    { key: "ssnit_number",      label: "SSNIT Number",             type: "text" },
    { key: "department",        label: "Department",               type: "text" },
    { key: "insurable_earnings",label: "Insurable Earnings (GHS)", type: "currency" },
    { key: "employee_contrib",  label: "Employee 5% (GHS)",        type: "currency" },
    { key: "employer_contrib",  label: "Employer 5% (GHS)",        type: "currency" },
    { key: "total_contrib",     label: "Total Tier 2 (GHS)",       type: "currency" },
  ]

  const typedRows = rows.map((r) => ({
    employee_id_no:     r.employee_id_no ?? "",
    employee_name:      r.employee_name ?? "",
    ssnit_number:       r.ssnit_number ?? "",
    department:         r.department ?? "",
    insurable_earnings: ghs(r.basic_salary),
    employee_contrib:   ghs(r.tier2_employee),
    employer_contrib:   ghs(r.tier2_employer),
    total_contrib:      ghs(r.tier2_employee) + ghs(r.tier2_employer),
  }))

  const summary = {
    total_employees:    rows.length,
    total_insurable:    rows.reduce((s, r) => s + ghs(r.basic_salary), 0),
    total_employee:     rows.reduce((s, r) => s + ghs(r.tier2_employee), 0),
    total_employer:     rows.reduce((s, r) => s + ghs(r.tier2_employer), 0),
    total_contributions:rows.reduce((s, r) => s + ghs(r.tier2_employee) + ghs(r.tier2_employer), 0),
  }

  return {
    ...meta,
    report_type: "ssnit_tier2",
    report_name: REPORT_LABELS.ssnit_tier2,
    row_count: rows.length,
    columns,
    rows: typedRows,
    summary,
    csv: toCSV(columns, typedRows),
  }
}

/** Report 4 — Bank Payment Advice */
function buildBankAdviceReport(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const columns: ReportColumn[] = [
    { key: "employee_id_no", label: "Employee ID",       type: "text" },
    { key: "employee_name",  label: "Employee Name",     type: "text" },
    { key: "bank_name",      label: "Bank",              type: "text" },
    { key: "account_number", label: "Account Number",    type: "text" },
    { key: "net_pay",        label: "Net Pay (GHS)",     type: "currency" },
    { key: "pay_date",       label: "Payment Date",      type: "date" },
    { key: "reference",      label: "Reference",         type: "text" },
  ]

  const typedRows = rows.map((r) => ({
    employee_id_no: r.employee_id_no ?? "",
    employee_name:  r.employee_name ?? "",
    bank_name:      r.bank_name ?? "",
    account_number: r.account_number ?? "",
    net_pay:        ghs(r.net_pay),
    pay_date:       r.pay_date ?? "",
    reference:      `SAL/${r.pay_period}/${r.employee_id_no ?? r.employee_id.slice(0, 8).toUpperCase()}`,
  }))

  const summary = {
    total_employees: rows.length,
    total_net_pay:   rows.reduce((s, r) => s + ghs(r.net_pay), 0),
  }

  return {
    ...meta,
    report_type: "bank_advice",
    report_name: REPORT_LABELS.bank_advice,
    row_count: rows.length,
    columns,
    rows: typedRows,
    summary,
    csv: toCSV(columns, typedRows),
  }
}

/** Report 5 — Cost to Company (CTC) */
function buildCTCReport(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const columns: ReportColumn[] = [
    { key: "employee_id_no",     label: "Employee ID",            type: "text" },
    { key: "employee_name",      label: "Employee Name",          type: "text" },
    { key: "department",         label: "Department",             type: "text" },
    { key: "basic_salary",       label: "Basic Salary (GHS)",     type: "currency" },
    { key: "total_allowances",   label: "Allowances (GHS)",       type: "currency" },
    { key: "gross_pay",          label: "Gross Pay (GHS)",        type: "currency" },
    { key: "ssnit_employer",     label: "SSNIT Employer (GHS)",   type: "currency" },
    { key: "tier2_employer",     label: "Tier 2 Employer (GHS)",  type: "currency" },
    { key: "tier3_employer",     label: "Tier 3 Employer (GHS)",  type: "currency" },
    { key: "cost_to_company",    label: "Total CTC (GHS)",        type: "currency" },
  ]

  const typedRows = rows.map((r) => ({
    employee_id_no:   r.employee_id_no ?? "",
    employee_name:    r.employee_name ?? "",
    department:       r.department ?? "",
    basic_salary:     ghs(r.basic_salary),
    total_allowances: ghs(r.total_allowances),
    gross_pay:        ghs(r.gross_pay),
    ssnit_employer:   ghs(r.ssnit_employer),
    tier2_employer:   ghs(r.tier2_employer),
    tier3_employer:   ghs(r.tier3_employer),
    cost_to_company:  ghs(r.cost_to_company),
  }))

  const summary = {
    total_employees:  rows.length,
    total_gross:      rows.reduce((s, r) => s + ghs(r.gross_pay), 0),
    total_employer_contributions: rows.reduce(
      (s, r) => s + ghs(r.ssnit_employer) + ghs(r.tier2_employer) + ghs(r.tier3_employer), 0
    ),
    total_ctc: rows.reduce((s, r) => s + ghs(r.cost_to_company), 0),
  }

  return {
    ...meta,
    report_type: "cost_to_company",
    report_name: REPORT_LABELS.cost_to_company,
    row_count: rows.length,
    columns,
    rows: typedRows,
    summary,
    csv: toCSV(columns, typedRows),
  }
}

/** Report 6 — Loans & Advances */
function buildLoansReport(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const columns: ReportColumn[] = [
    { key: "employee_id_no",    label: "Employee ID",          type: "text" },
    { key: "employee_name",     label: "Employee Name",        type: "text" },
    { key: "department",        label: "Department",           type: "text" },
    { key: "loan_amount",       label: "Loan Principal (GHS)", type: "currency" },
    { key: "loan_deduction",    label: "Monthly Repayment (GHS)", type: "currency" },
    { key: "advance_deduction", label: "Advance Deduction (GHS)", type: "currency" },
    { key: "current_loan_balance", label: "Outstanding Balance (GHS)", type: "currency" },
  ]

  const withLoans = rows.filter(
    (r) => ghs(r.loan_deduction) > 0 || ghs(r.advance_deduction) > 0
  )

  const typedRows = withLoans.map((r) => ({
    employee_id_no:       r.employee_id_no ?? "",
    employee_name:        r.employee_name ?? "",
    department:           r.department ?? "",
    loan_amount:          ghs(r.loan_amount ?? 0),
    loan_deduction:       ghs(r.loan_deduction),
    advance_deduction:    ghs(r.advance_deduction),
    current_loan_balance: ghs(r.current_loan_balance ?? 0),
  }))

  const summary = {
    total_with_loans:        withLoans.length,
    total_loan_deductions:   withLoans.reduce((s, r) => s + ghs(r.loan_deduction), 0),
    total_advance_deductions:withLoans.reduce((s, r) => s + ghs(r.advance_deduction), 0),
    total_outstanding:       withLoans.reduce((s, r) => s + ghs(r.current_loan_balance ?? 0), 0),
  }

  return {
    ...meta,
    report_type: "loans",
    report_name: REPORT_LABELS.loans,
    row_count: withLoans.length,
    columns,
    rows: typedRows,
    summary,
    csv: toCSV(columns, typedRows),
  }
}

/** Report 7 — Allowances Breakdown */
function buildAllowancesReport(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const columns: ReportColumn[] = [
    { key: "employee_id_no",       label: "Employee ID",               type: "text" },
    { key: "employee_name",        label: "Employee Name",             type: "text" },
    { key: "department",           label: "Department",                type: "text" },
    { key: "transport_allowance",  label: "Transport (GHS)",           type: "currency" },
    { key: "housing_allowance",    label: "Housing (GHS)",             type: "currency" },
    { key: "medical_allowance",    label: "Medical (GHS)",             type: "currency" },
    { key: "meal_allowance",       label: "Meal (GHS)",                type: "currency" },
    { key: "communication_allowance", label: "Communication (GHS)",    type: "currency" },
    { key: "other_allowances",     label: "Other (GHS)",               type: "currency" },
    { key: "total_allowances",     label: "Total Allowances (GHS)",    type: "currency" },
  ]

  const typedRows = rows.map((r) => ({
    employee_id_no:          r.employee_id_no ?? "",
    employee_name:           r.employee_name ?? "",
    department:              r.department ?? "",
    transport_allowance:     ghs(r.transport_allowance),
    housing_allowance:       ghs(r.housing_allowance),
    medical_allowance:       ghs(r.medical_allowance),
    meal_allowance:          ghs(r.meal_allowance),
    communication_allowance: ghs(r.communication_allowance),
    other_allowances:        ghs(r.other_allowances),
    total_allowances:        ghs(r.total_allowances),
  }))

  const summary = {
    total_employees:   rows.length,
    total_transport:   rows.reduce((s, r) => s + ghs(r.transport_allowance), 0),
    total_housing:     rows.reduce((s, r) => s + ghs(r.housing_allowance), 0),
    total_medical:     rows.reduce((s, r) => s + ghs(r.medical_allowance), 0),
    total_allowances:  rows.reduce((s, r) => s + ghs(r.total_allowances), 0),
  }

  return {
    ...meta,
    report_type: "allowances",
    report_name: REPORT_LABELS.allowances,
    row_count: rows.length,
    columns,
    rows: typedRows,
    summary,
    csv: toCSV(columns, typedRows),
  }
}

/** Report 8 — Provident Fund (Tier 3) */
function buildProvidentFundReport(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const columns: ReportColumn[] = [
    { key: "employee_id_no",  label: "Employee ID",          type: "text" },
    { key: "employee_name",   label: "Employee Name",        type: "text" },
    { key: "ssnit_number",    label: "SSNIT Number",         type: "text" },
    { key: "department",      label: "Department",           type: "text" },
    { key: "basic_salary",    label: "Basic Salary (GHS)",   type: "currency" },
    { key: "tier3_employee",  label: "Employee Contrib (GHS)", type: "currency" },
    { key: "tier3_employer",  label: "Employer Contrib (GHS)", type: "currency" },
    { key: "total_tier3",     label: "Total Tier 3 (GHS)",   type: "currency" },
  ]

  const withTier3 = rows.filter(
    (r) => ghs(r.tier3_employee) > 0 || ghs(r.tier3_employer) > 0
  )

  const typedRows = withTier3.map((r) => ({
    employee_id_no: r.employee_id_no ?? "",
    employee_name:  r.employee_name ?? "",
    ssnit_number:   r.ssnit_number ?? "",
    department:     r.department ?? "",
    basic_salary:   ghs(r.basic_salary),
    tier3_employee: ghs(r.tier3_employee),
    tier3_employer: ghs(r.tier3_employer),
    total_tier3:    ghs(r.tier3_employee) + ghs(r.tier3_employer),
  }))

  const summary = {
    total_members:       withTier3.length,
    total_employee:      withTier3.reduce((s, r) => s + ghs(r.tier3_employee), 0),
    total_employer:      withTier3.reduce((s, r) => s + ghs(r.tier3_employer), 0),
    total_contributions: withTier3.reduce((s, r) => s + ghs(r.tier3_employee) + ghs(r.tier3_employer), 0),
  }

  return {
    ...meta,
    report_type: "provident_fund",
    report_name: REPORT_LABELS.provident_fund,
    row_count: withTier3.length,
    columns,
    rows: typedRows,
    summary,
    csv: toCSV(columns, typedRows),
  }
}

/** Report 9 — Full Payroll Summary */
function buildPayrollSummaryReport(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const columns: ReportColumn[] = [
    { key: "employee_id_no",   label: "Employee ID",          type: "text" },
    { key: "employee_name",    label: "Employee Name",        type: "text" },
    { key: "department",       label: "Department",           type: "text" },
    { key: "basic_salary",     label: "Basic (GHS)",          type: "currency" },
    { key: "total_allowances", label: "Allowances (GHS)",     type: "currency" },
    { key: "gross_pay",        label: "Gross Pay (GHS)",      type: "currency" },
    { key: "ssnit_employee",   label: "SSNIT Emp (GHS)",      type: "currency" },
    { key: "tier2_employee",   label: "Tier 2 Emp (GHS)",     type: "currency" },
    { key: "paye_tax",         label: "PAYE Tax (GHS)",       type: "currency" },
    { key: "loan_deduction",   label: "Loan (GHS)",           type: "currency" },
    { key: "total_deductions", label: "Total Deductions (GHS)", type: "currency" },
    { key: "net_pay",          label: "Net Pay (GHS)",        type: "currency" },
  ]

  const typedRows = rows.map((r) => ({
    employee_id_no:   r.employee_id_no ?? "",
    employee_name:    r.employee_name ?? "",
    department:       r.department ?? "",
    basic_salary:     ghs(r.basic_salary),
    total_allowances: ghs(r.total_allowances),
    gross_pay:        ghs(r.gross_pay),
    ssnit_employee:   ghs(r.ssnit_employee),
    tier2_employee:   ghs(r.tier2_employee),
    paye_tax:         ghs(r.paye_tax),
    loan_deduction:   ghs(r.loan_deduction),
    total_deductions: ghs(r.total_deductions),
    net_pay:          ghs(r.net_pay),
  }))

  const summary = {
    total_employees:  rows.length,
    total_gross:      rows.reduce((s, r) => s + ghs(r.gross_pay), 0),
    total_paye:       rows.reduce((s, r) => s + ghs(r.paye_tax), 0),
    total_ssnit:      rows.reduce((s, r) => s + ghs(r.ssnit_employee) + ghs(r.ssnit_employer), 0),
    total_deductions: rows.reduce((s, r) => s + ghs(r.total_deductions), 0),
    total_net_pay:    rows.reduce((s, r) => s + ghs(r.net_pay), 0),
  }

  return {
    ...meta,
    report_type: "payroll_summary",
    report_name: REPORT_LABELS.payroll_summary,
    row_count: rows.length,
    columns,
    rows: typedRows,
    summary,
    csv: toCSV(columns, typedRows),
  }
}

// ─── Meta helper type ─────────────────────────────────────────────────────────

interface ReportMeta {
  pay_period:    string
  generated_at:  string
  company_name:  string
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface GenerateReportInput {
  company_id:       string
  report_type:      ReportType
  pay_period?:      string   // 'YYYY-MM'
  payroll_run_id?:  string
  tax_year?:        number
}

/**
 * Generate a single compliance report and persist its metadata to the DB.
 */
export async function generateReport(
  input: GenerateReportInput,
  generatedBy?: string
): Promise<GeneratedReport> {
  const rows = await fetchReportRows(
    input.company_id,
    input.pay_period,
    input.payroll_run_id
  )

  if (rows.length === 0) {
    throw new Error(
      `No payslip data found for company ${input.company_id}` +
        (input.pay_period ? ` period ${input.pay_period}` : "") +
        (input.payroll_run_id ? ` run ${input.payroll_run_id}` : "")
    )
  }

  const meta: ReportMeta = {
    pay_period:   input.pay_period ?? rows[0].pay_period,
    generated_at: new Date().toISOString(),
    company_name: rows[0].company_name ?? "Company",
  }

  let report: GeneratedReport

  switch (input.report_type) {
    case "paye":            report = buildPAYEReport(rows, meta);           break
    case "ssnit_tier1":     report = buildSSNITTier1Report(rows, meta);     break
    case "ssnit_tier2":     report = buildSSNITTier2Report(rows, meta);     break
    case "bank_advice":     report = buildBankAdviceReport(rows, meta);     break
    case "cost_to_company": report = buildCTCReport(rows, meta);            break
    case "loans":           report = buildLoansReport(rows, meta);          break
    case "allowances":      report = buildAllowancesReport(rows, meta);     break
    case "provident_fund":  report = buildProvidentFundReport(rows, meta);  break
    case "payroll_summary":
    default:                report = buildPayrollSummaryReport(rows, meta); break
  }

  // Persist metadata to DB
  try {
    const client = await createClient()
    const { data: saved } = await client
      .from("compliance_reports")
      .insert({
        company_id:      input.company_id,
        payroll_run_id:  input.payroll_run_id ?? null,
        report_type:     input.report_type,
        report_name:     report.report_name,
        pay_period:      report.pay_period,
        tax_year:        input.tax_year ?? new Date().getFullYear(),
        generated_by:    generatedBy ?? null,
        generated_at:    report.generated_at,
        row_count:       report.row_count,
        export_format:   "csv",
        status:          "generated",
      })
      .select("id")
      .single()

    if (saved?.id) {
      // Audit log
      await client.rpc("log_report_action", {
        p_report_id:  saved.id,
        p_action:     "generated",
        p_actor_id:   generatedBy ?? null,
        p_actor_name: null,
        p_notes:      `Generated ${report.row_count} rows`,
      })
    }
  } catch {
    // Non-fatal — report still returned even if DB persist fails
  }

  return report
}

/**
 * Generate all 10 report types for a period in one call.
 */
export async function generateAllReports(
  companyId: string,
  payPeriod: string,
  payrollRunId?: string,
  generatedBy?: string
): Promise<GeneratedReport[]> {
  const allTypes: ReportType[] = [
    "payroll_summary", "paye", "ssnit_tier1", "ssnit_tier2",
    "bank_advice", "cost_to_company", "loans", "allowances", "provident_fund",
  ]

  const results = await Promise.allSettled(
    allTypes.map((t) =>
      generateReport(
        { company_id: companyId, report_type: t, pay_period: payPeriod, payroll_run_id: payrollRunId },
        generatedBy
      )
    )
  )

  return results
    .filter((r): r is PromiseFulfilledResult<GeneratedReport> => r.status === "fulfilled")
    .map((r) => r.value)
}

/**
 * List previously generated compliance report records from the DB.
 */
export async function listComplianceReports(
  companyId: string,
  options?: { report_type?: ReportType; pay_period?: string; limit?: number }
): Promise<ComplianceReportRecord[]> {
  const client = await createClient()

  let query = client
    .from("compliance_reports")
    .select("*")
    .eq("company_id", companyId)
    .order("generated_at", { ascending: false })
    .limit(options?.limit ?? 50)

  if (options?.report_type) query = query.eq("report_type", options.report_type)
  if (options?.pay_period)  query = query.eq("pay_period",  options.pay_period)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as ComplianceReportRecord[]
}

/**
 * Mark a compliance report as filed with a submission reference.
 */
export async function fileReport(
  reportId: string,
  submissionRef: string,
  actorId?: string
): Promise<void> {
  const client = await createClient()
  await client.rpc("file_compliance_report", {
    p_report_id:      reportId,
    p_submission_ref: submissionRef,
    p_actor_id:       actorId ?? null,
    p_notes:          null,
  })
}
