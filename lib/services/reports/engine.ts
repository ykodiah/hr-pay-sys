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
import { toCSV } from "./csv"
import { loadCompanyBrand, type CompanyBrandInfo } from "@/lib/exports/company-branding"

export { toCSV }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ghs(v: unknown): number {
  return Math.round(Number(v ?? 0) * 100) / 100
}

interface ReportMeta {
  pay_period: string
  generated_at: string
  company_name: string
  companyInfo?: CompanyBrandInfo | null
}

function withCsvMeta(
  columns: ReportColumn[],
  typedRows: Record<string, unknown>[],
  meta: ReportMeta,
  reportName: string,
): string {
  return toCSV(columns, typedRows, {
    title: reportName,
    company: meta.company_name,
    companyInfo: meta.companyInfo,
    period: meta.pay_period,
    generatedAt: meta.generated_at,
  })
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

function mapPayslipToReportRow(p: any): PayrollReportRow {
  const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee
  const fin = Array.isArray(p.financial) ? p.financial[0] : p.financial
  const company = Array.isArray(p.company) ? p.company[0] : p.company
  const totalAllowances =
    Number(p.transport_allowance ?? 0) +
    Number(p.housing_allowance ?? 0) +
    Number(p.medical_allowance ?? 0) +
    Number(p.meal_allowance ?? 0) +
    Number(p.communication_allowance ?? 0) +
    Number(p.other_allowances ?? 0)

  return {
    company_id: p.company_id,
    payroll_run_id: p.payroll_run_id,
    pay_period: p.pay_period,
    pay_period_start: p.pay_period_start,
    pay_period_end: p.pay_period_end,
    pay_date: p.pay_date,
    employee_id: p.employee_id,
    employee_name:
      p.snapshot_employee_name ||
      (emp ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() : null),
    employee_id_no: p.snapshot_employee_id_no || emp?.employee_id || null,
    position: p.snapshot_position || emp?.position || null,
    department: p.snapshot_department || emp?.department || null,
    ssnit_number: fin?.ssnit_number ?? p.snapshot_ssnit_number ?? null,
    bank_name: fin?.bank_name ?? p.snapshot_bank_name ?? null,
    account_number: fin?.bank_account_number ?? p.snapshot_account_number ?? null,
    company_name: company?.name ?? null,
    ghana_card_number: emp?.ghana_card_number ?? null,
    date_of_joining: emp?.hire_date ?? emp?.date_of_joining ?? null,
    contract_type: emp?.employment_type ?? emp?.contract_type ?? null,
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
    paye_tax: Number(p.paye_tax ?? p.tax_deduction ?? 0),
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
    loan_amount: fin?.loan_amount ?? null,
    current_loan_balance: Number(p.loan_balance ?? fin?.loan_balance ?? 0),
    current_loan_deduction: Number(p.loan_deduction ?? 0),
  } as PayrollReportRow
}

interface FetchRowsResult {
  rows: PayrollReportRow[]
  source: "view" | "payslips" | "payroll_items" | "none"
  rowCount: number
  error?: string
}

async function fetchReportRows(
  companyId: string,
  payPeriod?: string,
  payrollRunId?: string
): Promise<FetchRowsResult> {
  const client = await createClient()

  // Prefer the dedicated view (now handles fallback internally)
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
  if (!error && (data ?? []).length > 0) {
    return { rows: data as PayrollReportRow[], source: "view", rowCount: data.length }
  }

  // Fallback — direct payslips query
  let payslipQuery = client
    .from("payslips")
    .select(
      `*,
       employee:employees(id, employee_id, first_name, last_name, department, position, ghana_card_number, date_of_joining, contract_type),
       company:companies(name),
       financial:employee_financial(bank_name, bank_account_number, ssnit_number)`,
    )
    .eq("company_id", companyId)

  if (payrollRunId) payslipQuery = payslipQuery.eq("payroll_run_id", payrollRunId)
  else if (payPeriod) payslipQuery = payslipQuery.eq("pay_period", payPeriod)

  const { data: payslips, error: payslipError } = await payslipQuery
  if (!payslipError && (payslips ?? []).length > 0) {
    return { 
      rows: (payslips ?? []).map(mapPayslipToReportRow),
      source: "payslips",
      rowCount: payslips.length,
    }
  }

  // Final fallback — payroll_items for the period's run(s)
  let runIds: string[] = []
  if (payrollRunId) {
    runIds = [payrollRunId]
  } else if (payPeriod) {
    const start = `${payPeriod}-01`
    const { data: runs } = await client
      .from("payroll_runs")
      .select("id")
      .eq("company_id", companyId)
      .eq("pay_period_start", start)
    runIds = (runs ?? []).map((r) => r.id)
  }

  if (!runIds.length) {
    const errorMsg = error?.message || payslipError?.message || "No payroll data source available"
    return { 
      rows: [],
      source: "none",
      rowCount: 0,
      error: errorMsg,
    }
  }

  const { data: items, error: itemsError } = await client
    .from("payroll_items")
    .select(
      `*,
       employee:employees(id, employee_id, first_name, last_name, department, position, ghana_card_number, date_of_joining, contract_type),
       financial:employee_financial(bank_name, bank_account_number, ssnit_number)`,
    )
    .in("payroll_run_id", runIds)

  if (itemsError) {
    return { 
      rows: [],
      source: "none",
      rowCount: 0,
      error: `Failed to fetch payroll_items: ${itemsError.message}`,
    }
  }
  
  if (!items || items.length === 0) {
    return { 
      rows: [],
      source: "none",
      rowCount: 0,
      error: "No payroll items found for this period",
    }
  }

  const { data: company } = await client.from("companies").select("name").eq("id", companyId).maybeSingle()

  const mappedRows = (items ?? []).map((it: any) => {
    const emp = Array.isArray(it.employee) ? it.employee[0] : it.employee
    const fin = Array.isArray(it.financial) ? it.financial[0] : it.financial
    const allowancesObj = it.allowances && typeof it.allowances === "object" ? it.allowances : {}
    const totalAllowances = Object.values(allowancesObj).reduce(
      (s: number, v) => s + Number(v || 0),
      0,
    )
    return {
      company_id: companyId,
      payroll_run_id: it.payroll_run_id,
      pay_period: payPeriod || "",
      employee_id: it.employee_id,
      employee_name: emp ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() : null,
      employee_id_no: emp?.employee_id ?? null,
      position: emp?.position ?? null,
      department: emp?.department ?? null,
      ssnit_number: fin?.ssnit_number ?? null,
      bank_name: fin?.bank_name ?? null,
      account_number: fin?.bank_account_number ?? null,
      company_name: company?.name ?? null,
      ghana_card_number: emp?.ghana_card_number ?? null,
      date_of_joining: emp?.date_of_joining ?? null,
      contract_type: emp?.contract_type ?? null,
      basic_salary: Number(it.basic_salary ?? 0),
      transport_allowance: Number(allowancesObj.transport ?? 0),
      housing_allowance: Number(allowancesObj.housing ?? 0),
      medical_allowance: Number(allowancesObj.medical ?? 0),
      meal_allowance: Number(allowancesObj.meal ?? 0),
      communication_allowance: Number(allowancesObj.communication ?? 0),
      other_allowances: Number(allowancesObj.other ?? 0),
      overtime_pay: Number(it.overtime_pay ?? 0),
      bonus_pay: Number(it.bonus_pay ?? 0),
      total_allowances: totalAllowances,
      gross_pay: Number(it.gross_pay ?? 0),
      ssnit_employee: Number(it.ssnit_employee ?? 0),
      ssnit_employer: Number(it.ssnit_employer ?? 0),
      tier2_employee: Number(it.tier2_employee ?? 0),
      tier2_employer: Number(it.tier2_employer ?? 0),
      tier3_employee: Number(it.tier3_employee ?? 0),
      tier3_employer: Number(it.tier3_employer ?? 0),
      paye_taxable_income: Number(it.paye_taxable_income ?? 0),
      tax_relief_total: Number(it.tax_relief_total ?? 0),
      paye_tax: Number(it.tax_deduction ?? it.paye_tax ?? 0),
      loan_deduction: Number(it.loan_deduction ?? 0),
      advance_deduction: Number(it.advance_deduction ?? 0),
      other_deductions: Number(it.other_deductions ?? 0),
      total_deductions: Number(it.total_deductions ?? 0),
      net_pay: Number(it.net_pay ?? 0),
      total_employer_cost: 0,
      cost_to_company: Number(it.gross_pay ?? 0),
      payslip_status: "from_payroll_items",
      current_loan_balance: 0,
      current_loan_deduction: Number(it.loan_deduction ?? 0),
    } as PayrollReportRow
  })
  
  return { 
    rows: mappedRows,
    source: "payroll_items",
    rowCount: mappedRows.length,
  }
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
    csv: withCsvMeta(columns, typedRows, meta, REPORT_LABELS.paye),
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
    { key: "employee_contrib",  label: "Employee Tier 1 0.5% (GHS)", type: "currency" },
    { key: "employer_contrib",  label: "Employer Tier 1 13% (GHS)",  type: "currency" },
    { key: "total_contrib",     label: "Total Tier 1 (GHS)",         type: "currency" },
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
    csv: withCsvMeta(columns, typedRows, meta, REPORT_LABELS.ssnit_tier1),
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
    { key: "employee_contrib",  label: "Employee Tier 2 5% (GHS)", type: "currency" },
    { key: "employer_contrib",  label: "Employer Tier 2 (GHS)",    type: "currency" },
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
    csv: withCsvMeta(columns, typedRows, meta, REPORT_LABELS.ssnit_tier2),
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
    csv: withCsvMeta(columns, typedRows, meta, REPORT_LABELS.bank_advice),
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
    csv: withCsvMeta(columns, typedRows, meta, REPORT_LABELS.cost_to_company),
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
    csv: withCsvMeta(columns, typedRows, meta, REPORT_LABELS.loans),
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
    csv: withCsvMeta(columns, typedRows, meta, REPORT_LABELS.allowances),
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
    csv: withCsvMeta(columns, typedRows, meta, REPORT_LABELS.provident_fund),
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
    csv: withCsvMeta(columns, typedRows, meta, REPORT_LABELS.payroll_summary),
  }
}

/** Report 10 — Other Deductions */
function buildDeductionsReport(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const columns: ReportColumn[] = [
    { key: "employee_id_no",    label: "Employee ID",              type: "text" },
    { key: "employee_name",     label: "Employee Name",            type: "text" },
    { key: "department",        label: "Department",               type: "text" },
    { key: "loan_deduction",    label: "Loan Deduction (GHS)",     type: "currency" },
    { key: "advance_deduction", label: "Advance Deduction (GHS)",  type: "currency" },
    { key: "other_deductions",  label: "Other Deductions (GHS)",   type: "currency" },
    { key: "total_other",       label: "Total Non-Tax Ded. (GHS)", type: "currency" },
    { key: "net_pay",           label: "Net Pay (GHS)",            type: "currency" },
  ]

  const typedRows = rows.map((r) => ({
    employee_id_no:    r.employee_id_no ?? "",
    employee_name:     r.employee_name ?? "",
    department:        r.department ?? "",
    loan_deduction:    ghs(r.loan_deduction),
    advance_deduction: ghs(r.advance_deduction),
    other_deductions:  ghs(r.other_deductions),
    total_other:       ghs(r.loan_deduction) + ghs(r.advance_deduction) + ghs(r.other_deductions),
    net_pay:           ghs(r.net_pay),
  }))

  const summary = {
    total_employees: rows.length,
    total_loans:     rows.reduce((s, r) => s + ghs(r.loan_deduction), 0),
    total_advances:  rows.reduce((s, r) => s + ghs(r.advance_deduction), 0),
    total_other:     rows.reduce((s, r) => s + ghs(r.other_deductions), 0),
  }

  return {
    ...meta,
    report_type: "deductions",
    report_name: REPORT_LABELS.deductions,
    row_count: rows.length,
    columns,
    rows: typedRows,
    summary,
    csv: withCsvMeta(columns, typedRows, meta, REPORT_LABELS.deductions),
  }
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
  const fetchResult = await fetchReportRows(
    input.company_id,
    input.pay_period,
    input.payroll_run_id
  )

  if (fetchResult.rows.length === 0) {
    const errorMsg = fetchResult.error || 
      `No payroll data found for this company` +
      (input.pay_period ? ` / period ${input.pay_period}` : "") +
      (input.payroll_run_id ? ` / run ${input.payroll_run_id}` : "") +
      `. Process & approve payroll first so payslips / payroll_items exist.`
    
    throw new Error(errorMsg)
  }

  const rows = fetchResult.rows
  const clientForBrand = await createClient()
  const companyInfo = await loadCompanyBrand(clientForBrand, input.company_id)

  const meta: ReportMeta = {
    pay_period:   input.pay_period ?? rows[0].pay_period,
    generated_at: new Date().toISOString(),
    company_name: companyInfo?.name || rows[0].company_name || "Company",
    companyInfo,
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
    case "deductions":      report = buildDeductionsReport(rows, meta);     break
    case "payroll_summary":
    default:                report = buildPayrollSummaryReport(rows, meta); break
  }

  // Persist metadata to DB with data source tracking
  try {
    const client = await createClient()
    const { data: saved } = await client
      .from("compliance_reports")
      .insert({
        company_id:         input.company_id,
        payroll_run_id:     input.payroll_run_id ?? null,
        report_type:        input.report_type,
        report_name:        report.report_name,
        pay_period:         report.pay_period,
        tax_year:           input.tax_year ?? new Date().getFullYear(),
        generated_by:       generatedBy ?? null,
        generated_at:       report.generated_at,
        row_count:          report.row_count,
        export_format:      "csv",
        status:             "generated",
        data_source:        fetchResult.source,
        validation_status:  "validated",
      })
      .select("id")
      .single()

    if (saved?.id) {
      // Audit log with data source info
      await client.rpc("log_report_action", {
        p_report_id:  saved.id,
        p_action:     "generated",
        p_actor_id:   generatedBy ?? null,
        p_actor_name: null,
        p_notes:      `Generated ${report.row_count} rows from ${fetchResult.source}`,
      })
    }
  } catch (e) {
    // Non-fatal — report still returned even if DB persist fails
    console.log("[v0] Report DB persist error:", e instanceof Error ? e.message : "unknown")
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
    "bank_advice", "cost_to_company", "loans", "allowances", "provident_fund", "deductions",
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
