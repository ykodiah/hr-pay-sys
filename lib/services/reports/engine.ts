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
import { normalizePayrollCashRow } from "@/lib/payroll/cash-deductions"

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

/**
 * Deduplicate rows by employee_id, keeping only the latest payroll_run_id.
 * Ensures no duplicate employee names appear in reports.
 */
function deduplicateRowsByEmployee(rows: PayrollReportRow[]): PayrollReportRow[] {
  const latestByEmployee: Record<string, PayrollReportRow> = {}

  for (const row of rows) {
    const empId = row.employee_id
    const existing = latestByEmployee[empId]

    // Keep the row with the latest payroll_run_id (if available)
    if (!existing || (row.payroll_run_id && (!existing.payroll_run_id || row.payroll_run_id > existing.payroll_run_id))) {
      latestByEmployee[empId] = row
    }
  }

  return Object.values(latestByEmployee).sort((a, b) => {
    // Sort by employee name to maintain consistent order
    const nameA = a.employee_name ?? ""
    const nameB = b.employee_name ?? ""
    return nameA.localeCompare(nameB)
  })
}

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

  const base = {
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
    first_name: emp?.first_name ?? null,
    last_name: emp?.last_name ?? null,
    other_names: emp?.other_names ?? null,
    snapshot_subsidiary: p.snapshot_subsidiary ?? emp?.subsidiary ?? null,
    snapshot_division: p.snapshot_division ?? emp?.division ?? null,
    snapshot_location: p.snapshot_location ?? emp?.location ?? null,
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
      Number(p.tier3_employer ?? 0),
    payslip_status: p.status ?? "draft",
    loan_amount: fin?.loan_amount ?? null,
    current_loan_balance: Number(p.loan_balance ?? fin?.loan_balance ?? 0),
    current_loan_deduction: Number(p.loan_deduction ?? 0),
  } as PayrollReportRow

  return normalizePayrollCashRow(base) as PayrollReportRow
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
    const rows = (data as PayrollReportRow[]).map((r) =>
      normalizePayrollCashRow(r) as PayrollReportRow,
    )
    const dedupedRows = deduplicateRowsByEmployee(rows)
    return { rows: dedupedRows, source: "view", rowCount: dedupedRows.length }
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
    const mappedRows = (payslips ?? []).map(mapPayslipToReportRow)
    const dedupedRows = deduplicateRowsByEmployee(mappedRows)
    return { 
      rows: dedupedRows,
      source: "payslips",
      rowCount: dedupedRows.length,
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
    runIds = (runs ?? []).map((r: any) => r.id)
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
      first_name: emp?.first_name ?? null,
      last_name: emp?.last_name ?? null,
      other_names: emp?.other_names ?? null,
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
      cost_to_company: Number(it.gross_pay ?? 0) + Number(it.ssnit_employer ?? 0) + Number(it.tier3_employer ?? 0),
      payslip_status: "from_payroll_items",
      current_loan_balance: 0,
      current_loan_deduction: Number(it.loan_deduction ?? 0),
    } as PayrollReportRow
  }).map((r: any) => normalizePayrollCashRow(r) as PayrollReportRow)
  
  const dedupedRows = deduplicateRowsByEmployee(mappedRows)
  return { 
    rows: dedupedRows,
    source: "payroll_items",
    rowCount: dedupedRows.length,
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

  const totals = {
    total_employees:    rows.length,
    total_gross_pay:    typedRows.reduce((s, r) => s + r.gross_pay, 0),
    total_taxable:      typedRows.reduce((s, r) => s + r.paye_taxable_income, 0),
    total_paye_tax:     typedRows.reduce((s, r) => s + r.paye_tax, 0),
  }

  // Append a grand total row so it appears in both the preview table and CSV
  const allRows: Record<string, unknown>[] = [
    ...typedRows,
    {
      employee_id_no:      "GRAND TOTAL",
      employee_name:       `${rows.length} employee(s)`,
      ghana_card_number:   "",
      department:          "",
      position:            "",
      gross_pay:           totals.total_gross_pay,
      paye_taxable_income: totals.total_taxable,
      tax_relief_total:    typedRows.reduce((s, r) => s + r.tax_relief_total, 0),
      paye_tax:            totals.total_paye_tax,
      _is_total_row:       true,
    },
  ]

  return {
    ...meta,
    report_type: "paye",
    report_name: REPORT_LABELS.paye,
    row_count: rows.length,
    columns,
    rows: allRows,
    summary: totals,
    csv: withCsvMeta(columns, allRows, meta, REPORT_LABELS.paye),
  }
}

/** Report 2 — SSNIT Tier 1 Contributions (13.5%)
 *  Exact 10 columns as per Ghana compliance requirements:
 *  S/N, Staff ID, SSNIT Number, NIA Number, Surname, First Name, Other Names,
 *  Basic Salary, Tier 1 (13.5%) (GHS), Code (blank)
 */
function buildSSNITTier1Report(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const columns: ReportColumn[] = [
    { key: "sn",               label: "S/N",                        type: "text" },
    { key: "employee_id_no",   label: "Staff ID",                   type: "text" },
    { key: "ssnit_number",     label: "SSNIT Number",               type: "text" },
    { key: "ghana_card_number",label: "NIA Number",                 type: "text" },
    { key: "last_name",        label: "Surname",                    type: "text" },
    { key: "first_name",       label: "First Name",                 type: "text" },
    { key: "other_names",      label: "Other Names",                type: "text" },
    { key: "basic_salary",     label: "Basic Salary",               type: "currency" },
    { key: "tier1_contrib",    label: "Tier 1 (13.5%) (GHS)",       type: "currency" },
    { key: "code",             label: "Code",                       type: "text" },
  ]

  const typedRows = rows.map((r, idx) => {
    const basicSalary = ghs(r.basic_salary)
    const tier1Amount = ghs(basicSalary * 0.135)  // 13.5%
    return {
      sn:                String(idx + 1),
      employee_id_no:    r.employee_id_no ?? "",
      ssnit_number:      r.ssnit_number ?? "",
      ghana_card_number: r.ghana_card_number ?? "",
      last_name:         r.last_name ?? "",
      first_name:        r.first_name ?? "",
      other_names:       r.other_names ?? "",
      basic_salary:      basicSalary,
      tier1_contrib:     tier1Amount,
      code:              "",
    }
  })

  const summary = {
    total_employees:   rows.length,
    total_basic_salary: typedRows.reduce((s, r) => s + r.basic_salary, 0),
    total_tier1:       typedRows.reduce((s, r) => s + r.tier1_contrib, 0),
  }

  const allRows: Record<string, unknown>[] = [
    ...typedRows,
    {
      sn:                "",
      employee_id_no:    "GRAND TOTAL",
      ssnit_number:      "",
      ghana_card_number: "",
      last_name:         "",
      first_name:        `${rows.length} employee(s)`,
      other_names:       "",
      basic_salary:      summary.total_basic_salary,
      tier1_contrib:     summary.total_tier1,
      code:              "",
      _is_total_row:     true,
    },
  ]

  return {
    ...meta,
    report_type: "ssnit_tier1",
    report_name: REPORT_LABELS.ssnit_tier1,
    row_count: rows.length,
    columns,
    rows: allRows,
    summary,
    csv: withCsvMeta(columns, allRows, meta, REPORT_LABELS.ssnit_tier1),
  }
}

/** Report 3 — SSNIT Tier 2 (Occupational Pension) Contributions (5%)
 *  Exact 10 columns as per Ghana compliance requirements:
 *  S/N, Staff ID, SSNIT Number, NIA Number, Surname, First Name, Other Names,
 *  Basic Salary, Tier 2 (5%) (GHS), Code (blank)
 */
function buildSSNITTier2Report(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const columns: ReportColumn[] = [
    { key: "sn",               label: "S/N",                        type: "text" },
    { key: "employee_id_no",   label: "Staff ID",                   type: "text" },
    { key: "ssnit_number",     label: "SSNIT Number",               type: "text" },
    { key: "ghana_card_number",label: "NIA Number",                 type: "text" },
    { key: "last_name",        label: "Surname",                    type: "text" },
    { key: "first_name",       label: "First Name",                 type: "text" },
    { key: "other_names",      label: "Other Names",                type: "text" },
    { key: "basic_salary",     label: "Basic Salary",               type: "currency" },
    { key: "tier2_contrib",    label: "Tier 2 (5%) (GHS)",          type: "currency" },
    { key: "code",             label: "Code",                       type: "text" },
  ]

  const typedRows = rows.map((r, idx) => {
    const basicSalary = ghs(r.basic_salary)
    const tier2Amount = ghs(basicSalary * 0.05)  // 5%
    return {
      sn:                String(idx + 1),
      employee_id_no:    r.employee_id_no ?? "",
      ssnit_number:      r.ssnit_number ?? "",
      ghana_card_number: r.ghana_card_number ?? "",
      last_name:         r.last_name ?? "",
      first_name:        r.first_name ?? "",
      other_names:       r.other_names ?? "",
      basic_salary:      basicSalary,
      tier2_contrib:     tier2Amount,
      code:              "",
    }
  })

  const summary = {
    total_employees:   rows.length,
    total_basic_salary: typedRows.reduce((s, r) => s + r.basic_salary, 0),
    total_tier2:       typedRows.reduce((s, r) => s + r.tier2_contrib, 0),
  }

  const allRows: Record<string, unknown>[] = [
    ...typedRows,
    {
      sn:                "",
      employee_id_no:    "GRAND TOTAL",
      ssnit_number:      "",
      ghana_card_number: "",
      last_name:         "",
      first_name:        `${rows.length} employee(s)`,
      other_names:       "",
      basic_salary:      summary.total_basic_salary,
      tier2_contrib:     summary.total_tier2,
      code:              "",
      _is_total_row:     true,
    },
  ]

  return {
    ...meta,
    report_type: "ssnit_tier2",
    report_name: REPORT_LABELS.ssnit_tier2,
    row_count: rows.length,
    columns,
    rows: allRows,
    summary,
    csv: withCsvMeta(columns, allRows, meta, REPORT_LABELS.ssnit_tier2),
  }
}

/** Report 4 — Bank Payment Advice
 *  Rows grouped by bank (alphabetically).
 *  A bank sub-header row is injected before each bank's employees.
 *  A summary section appended showing totals per bank and grand total.
 */
function buildBankAdviceReport(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const columns: ReportColumn[] = [
    { key: "employee_id_no", label: "Employee ID",    type: "text" },
    { key: "employee_name",  label: "Employee Name",  type: "text" },
    { key: "bank_name",      label: "Bank",           type: "text" },
    { key: "account_number", label: "Account Number", type: "text" },
    { key: "net_pay",        label: "Net Pay (GHS)",  type: "currency" },
    { key: "pay_date",       label: "Payment Date",   type: "date" },
    { key: "reference",      label: "Reference",      type: "text" },
  ]

  // Group rows by bank name
  const bankMap = new Map<string, PayrollReportRow[]>()
  for (const r of rows) {
    const bank = r.bank_name?.trim() || "Unknown Bank"
    if (!bankMap.has(bank)) bankMap.set(bank, [])
    bankMap.get(bank)!.push(r)
  }

  // Sort banks alphabetically
  const sortedBanks = Array.from(bankMap.keys()).sort()

  // Build typed rows: inject a sub-header row per bank then each employee
  const typedRows: Record<string, unknown>[] = []
  for (const bank of sortedBanks) {
    const bankRows = bankMap.get(bank)!
    // Bank header marker row (used in CSV to visually separate banks)
    typedRows.push({
      employee_id_no: `--- ${bank} ---`,
      employee_name:  "",
      bank_name:      "",
      account_number: "",
      net_pay:        "",
      pay_date:       "",
      reference:      "",
    })
    for (const r of bankRows) {
      typedRows.push({
        employee_id_no: r.employee_id_no ?? "",
        employee_name:  r.employee_name ?? "",
        bank_name:      r.bank_name ?? "",
        account_number: r.account_number ?? "",
        net_pay:        ghs(r.net_pay),
        pay_date:       r.pay_date ?? "",
        reference:      `SAL/${r.pay_period}/${r.employee_id_no ?? r.employee_id.slice(0, 8).toUpperCase()}`,
      })
    }
    // Bank sub-total row
    const bankTotal = bankRows.reduce((s, r) => s + ghs(r.net_pay), 0)
    typedRows.push({
      employee_id_no: `  ${bank} Subtotal`,
      employee_name:  `${bankRows.length} employee(s)`,
      bank_name:      "",
      account_number: "",
      net_pay:        bankTotal,
      pay_date:       "",
      reference:      "",
    })
  }

  // Summary object — per bank totals + grand total
  const summaryEntries: Record<string, number> = { total_employees: rows.length }
  for (const bank of sortedBanks) {
    const bankRows  = bankMap.get(bank)!
    const safeKey   = bank.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()
    summaryEntries[`bank_${safeKey}_employees`] = bankRows.length
    summaryEntries[`bank_${safeKey}_total`]     = bankRows.reduce((s, r) => s + ghs(r.net_pay), 0)
  }
  const grandNetPay = rows.reduce((s, r) => s + ghs(r.net_pay), 0)
  summaryEntries.grand_total_net_pay = grandNetPay

  // Append a clearly-marked grand total row at the very end
  typedRows.push({
    employee_id_no: "GRAND TOTAL",
    employee_name:  `${rows.length} employee(s)`,
    bank_name:      `${sortedBanks.length} bank(s)`,
    account_number: "",
    net_pay:        grandNetPay,
    pay_date:       "",
    reference:      "",
    _is_total_row:  true,
  })

  return {
    ...meta,
    report_type: "bank_advice",
    report_name: REPORT_LABELS.bank_advice,
    row_count: rows.length,
    columns,
    rows: typedRows,
    summary: summaryEntries,
    csv: withCsvMeta(columns, typedRows, meta, REPORT_LABELS.bank_advice),
  }
}

/** Report 5 — Cost to Company (CTC)
 *  SSNIT employer: recomputed as 13% on basic earnings
 *  Tier 2 employer column removed per requirement
 */
function buildCTCReport(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const columns: ReportColumn[] = [
    { key: "employee_id_no",     label: "Employee ID",               type: "text" },
    { key: "employee_name",      label: "Employee Name",             type: "text" },
    { key: "department",         label: "Department",                type: "text" },
    { key: "basic_salary",       label: "Basic Salary (GHS)",        type: "currency" },
    { key: "total_allowances",   label: "Allowances (GHS)",          type: "currency" },
    { key: "gross_pay",          label: "Gross Pay (GHS)",           type: "currency" },
    { key: "ssnit_employer",     label: "SSNIT Employer 13% (GHS)",  type: "currency" },
    { key: "tier3_employer",     label: "Tier 3 Employer (GHS)",     type: "currency" },
    { key: "cost_to_company",    label: "Total CTC (GHS)",           type: "currency" },
  ]

  const typedRows = rows.map((r) => {
    const basic         = ghs(r.basic_salary)
    const ssnitEmployer = ghs(basic * 0.13)      // 13% on basic
    const tier3Empl     = ghs(r.tier3_employer)
    const ctc           = ghs(r.gross_pay) + ssnitEmployer + tier3Empl
    return {
      employee_id_no:   r.employee_id_no ?? "",
      employee_name:    r.employee_name ?? "",
      department:       r.department ?? "",
      basic_salary:     basic,
      total_allowances: ghs(r.total_allowances),
      gross_pay:        ghs(r.gross_pay),
      ssnit_employer:   ssnitEmployer,
      tier3_employer:   tier3Empl,
      cost_to_company:  ctc,
    }
  })

  const summary = {
    total_employees:      rows.length,
    total_basic:          typedRows.reduce((s, r) => s + r.basic_salary, 0),
    total_allowances:     typedRows.reduce((s, r) => s + r.total_allowances, 0),
    total_gross:          typedRows.reduce((s, r) => s + r.gross_pay, 0),
    total_ssnit_employer: typedRows.reduce((s, r) => s + r.ssnit_employer, 0),
    total_tier3_employer: typedRows.reduce((s, r) => s + r.tier3_employer, 0),
    total_ctc:            typedRows.reduce((s, r) => s + r.cost_to_company, 0),
  }

  const allRows: Record<string, unknown>[] = [
    ...typedRows,
    {
      employee_id_no:   "GRAND TOTAL",
      employee_name:    `${rows.length} employee(s)`,
      department:       "",
      basic_salary:     summary.total_basic,
      total_allowances: summary.total_allowances,
      gross_pay:        summary.total_gross,
      ssnit_employer:   summary.total_ssnit_employer,
      tier3_employer:   summary.total_tier3_employer,
      cost_to_company:  summary.total_ctc,
      _is_total_row:    true,
    },
  ]

  return {
    ...meta,
    report_type: "cost_to_company",
    report_name: REPORT_LABELS.cost_to_company,
    row_count: rows.length,
    columns,
    rows: allRows,
    summary,
    csv: withCsvMeta(columns, allRows, meta, REPORT_LABELS.cost_to_company),
  }
}

/** Report 6 — Loans & Advances
 *  Rows sourced from payslips (loan_deduction, advance_deduction) for the period.
 *  Grouped into separate sections per loan type, then a summary page.
 */
function buildLoansReport(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const columns: ReportColumn[] = [
    { key: "employee_id_no",       label: "Employee ID",              type: "text" },
    { key: "employee_name",        label: "Employee Name",            type: "text" },
    { key: "department",           label: "Department",               type: "text" },
    { key: "loan_type",            label: "Loan / Advance Type",      type: "text" },
    { key: "monthly_deduction",    label: "Monthly Deduction (GHS)",  type: "currency" },
    { key: "outstanding_balance",  label: "Outstanding Balance (GHS)", type: "currency" },
  ]

  type LoanRow = { employee_id_no: string; employee_name: string; department: string; loan_type: string; monthly_deduction: number; outstanding_balance: number }
  const loanRows: LoanRow[] = []
  const advanceRows: LoanRow[] = []

  for (const r of rows) {
    const base = { employee_id_no: r.employee_id_no ?? "", employee_name: r.employee_name ?? "", department: r.department ?? "" }
    if (ghs(r.loan_deduction) > 0) {
      loanRows.push({ ...base, loan_type: "Loan", monthly_deduction: ghs(r.loan_deduction), outstanding_balance: ghs(r.current_loan_balance ?? 0) })
    }
    if (ghs(r.advance_deduction) > 0) {
      advanceRows.push({ ...base, loan_type: "Advance", monthly_deduction: ghs(r.advance_deduction), outstanding_balance: 0 })
    }
  }

  const sectionHeader = (title: string) => ({
    employee_id_no: `=== ${title} ===`, employee_name: "", department: "", loan_type: "", monthly_deduction: "" as unknown as number, outstanding_balance: "" as unknown as number,
  })
  const subtotalRow = (label: string, count: number, total: number, balance: number) => ({
    employee_id_no: `  ${label}`, employee_name: `${count} employee(s)`, department: "", loan_type: "SUBTOTAL", monthly_deduction: total, outstanding_balance: balance,
  })
  const blankRow = { employee_id_no: "", employee_name: "", department: "", loan_type: "", monthly_deduction: "" as unknown as number, outstanding_balance: "" as unknown as number }

  const loanDeductTotal    = loanRows.reduce((s, r) => s + r.monthly_deduction, 0)
  const loanBalanceTotal   = loanRows.reduce((s, r) => s + r.outstanding_balance, 0)
  const advanceDeductTotal = advanceRows.reduce((s, r) => s + r.monthly_deduction, 0)
  const grandTotal         = loanDeductTotal + advanceDeductTotal

  const combinedRows: Record<string, unknown>[] = []

  if (loanRows.length > 0) {
    combinedRows.push(sectionHeader("LOANS"), ...loanRows, subtotalRow("Loans Subtotal", loanRows.length, loanDeductTotal, loanBalanceTotal), blankRow)
  }
  if (advanceRows.length > 0) {
    combinedRows.push(sectionHeader("ADVANCES"), ...advanceRows, subtotalRow("Advances Subtotal", advanceRows.length, advanceDeductTotal, 0), blankRow)
  }

  // Summary section
  combinedRows.push(
    sectionHeader("SUMMARY"),
    { employee_id_no: "Type", employee_name: "No. of Employees", department: "", loan_type: "Total Deduction (GHS)", monthly_deduction: "" as unknown as number, outstanding_balance: "" as unknown as number },
    { employee_id_no: "Loans",    employee_name: String(loanRows.length),    department: "", loan_type: "",    monthly_deduction: loanDeductTotal,    outstanding_balance: loanBalanceTotal },
    { employee_id_no: "Advances", employee_name: String(advanceRows.length), department: "", loan_type: "",    monthly_deduction: advanceDeductTotal,  outstanding_balance: 0 },
    { employee_id_no: "GRAND TOTAL", employee_name: String(loanRows.length + advanceRows.length), department: "", loan_type: "", monthly_deduction: grandTotal, outstanding_balance: loanBalanceTotal, _is_total_row: true },
  )

  const allRows = [...loanRows, ...advanceRows]
  const summary = {
    total_employees_with_loans:    new Set(loanRows.map((r) => r.employee_id_no)).size,
    total_employees_with_advances: new Set(advanceRows.map((r) => r.employee_id_no)).size,
    total_loan_deductions:         loanDeductTotal,
    total_advance_deductions:      advanceDeductTotal,
    total_outstanding_balance:     loanBalanceTotal,
    grand_total_deductions:        grandTotal,
  }

  return {
    ...meta,
    report_type: "loans",
    report_name: REPORT_LABELS.loans,
    row_count: allRows.length,
    columns,
    rows: combinedRows,
    summary,
    csv: withCsvMeta(columns, combinedRows, meta, REPORT_LABELS.loans),
  }
}

/** Report 7 — Allowances Breakdown
 *  Split into three sections in the CSV:
 *    Section 1: Taxable Allowances (housing is taxable in Ghana)
 *    Section 2: Non-Taxable Allowances (transport, medical, meal, communication, other)
 *    Section 3: Summary — totals + employee counts per section
 *
 *  Taxable determination (per Ghana tax law defaults):
 *    Taxable: housing_allowance
 *    Non-taxable: transport, medical, meal, communication, other
 *
 *  The employee_allowances table stores individual taxability flags, but
 *  since payslips aggregate amounts into type buckets we apply the statutory defaults here.
 */
function buildAllowancesReport(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const baseColumns: ReportColumn[] = [
    { key: "employee_id_no",       label: "Employee ID",            type: "text" },
    { key: "employee_name",        label: "Employee Name",          type: "text" },
    { key: "department",           label: "Department",             type: "text" },
    { key: "allowance_type",       label: "Allowance Type",         type: "text" },
    { key: "taxable",              label: "Taxable / Non-Taxable",  type: "text" },
    { key: "amount",               label: "Amount (GHS)",           type: "currency" },
  ]

  // Produce one row per allowance type per employee
  type AllowRow = { employee_id_no: string; employee_name: string; department: string; allowance_type: string; taxable: string; amount: number }
  const allAllowRows: AllowRow[] = []

  for (const r of rows) {
    const base = { employee_id_no: r.employee_id_no ?? "", employee_name: r.employee_name ?? "", department: r.department ?? "" }
    const items: { type: string; taxable: string; amount: number }[] = [
      { type: "Transport Allowance",      taxable: "Non-Taxable", amount: ghs(r.transport_allowance) },
      { type: "Housing Allowance",        taxable: "Taxable",     amount: ghs(r.housing_allowance) },
      { type: "Medical Allowance",        taxable: "Non-Taxable", amount: ghs(r.medical_allowance) },
      { type: "Meal Allowance",           taxable: "Non-Taxable", amount: ghs(r.meal_allowance) },
      { type: "Communication Allowance",  taxable: "Non-Taxable", amount: ghs(r.communication_allowance) },
      { type: "Other Allowances",         taxable: "Non-Taxable", amount: ghs(r.other_allowances) },
    ]
    for (const it of items) {
      if (it.amount > 0) {
        allAllowRows.push({ ...base, allowance_type: it.type, taxable: it.taxable, amount: it.amount })
      }
    }
  }

  // Split into taxable and non-taxable
  const taxableRows    = allAllowRows.filter((r) => r.taxable === "Taxable")
  const nonTaxableRows = allAllowRows.filter((r) => r.taxable === "Non-Taxable")

  // Build combined CSV with section headers + summary
  const sectionHeader = (title: string) => ({
    employee_id_no: `=== ${title} ===`,
    employee_name: "", department: "", allowance_type: "", taxable: "", amount: "",
  })
  const subtotalRow = (label: string, count: number, total: number) => ({
    employee_id_no: `  ${label}`, employee_name: `${count} row(s)`,
    department: "", allowance_type: "", taxable: "SUBTOTAL", amount: total,
  })
  const blankRow = { employee_id_no: "", employee_name: "", department: "", allowance_type: "", taxable: "", amount: "" }

  const taxableTotal    = taxableRows.reduce((s, r) => s + r.amount, 0)
  const nonTaxableTotal = nonTaxableRows.reduce((s, r) => s + r.amount, 0)
  const taxableEmpCount = new Set(taxableRows.map((r) => r.employee_id_no)).size
  const nonTaxEmpCount  = new Set(nonTaxableRows.map((r) => r.employee_id_no)).size

  const combinedRows: Record<string, unknown>[] = [
    sectionHeader("TAXABLE ALLOWANCES"),
    ...taxableRows,
    subtotalRow("Taxable Subtotal", taxableRows.length, taxableTotal),
    blankRow,
    sectionHeader("NON-TAXABLE ALLOWANCES"),
    ...nonTaxableRows,
    subtotalRow("Non-Taxable Subtotal", nonTaxableRows.length, nonTaxableTotal),
    blankRow,
    sectionHeader("SUMMARY"),
    { employee_id_no: "Section", employee_name: "No. of Employees", department: "", allowance_type: "No. of Rows", taxable: "", amount: "" as unknown as number },
    { employee_id_no: "Taxable Allowances",     employee_name: String(taxableEmpCount),  department: "", allowance_type: String(taxableRows.length),    taxable: "GHS", amount: taxableTotal },
    { employee_id_no: "Non-Taxable Allowances", employee_name: String(nonTaxEmpCount),   department: "", allowance_type: String(nonTaxableRows.length),  taxable: "GHS", amount: nonTaxableTotal },
    { employee_id_no: "GRAND TOTAL", employee_name: String(rows.length), department: "", allowance_type: String(allAllowRows.length), taxable: "GHS", amount: taxableTotal + nonTaxableTotal, _is_total_row: true },
  ]

  const summary = {
    total_employees:         rows.length,
    taxable_employees:       taxableEmpCount,
    total_taxable:           taxableTotal,
    non_taxable_employees:   nonTaxEmpCount,
    total_non_taxable:       nonTaxableTotal,
    total_all_allowances:    taxableTotal + nonTaxableTotal,
  }

  return {
    ...meta,
    report_type: "allowances",
    report_name: REPORT_LABELS.allowances,
    row_count: allAllowRows.length,
    columns: baseColumns,
    rows: combinedRows,
    summary,
    csv: withCsvMeta(baseColumns, combinedRows, meta, REPORT_LABELS.allowances),
  }
}

/** Report 8 — Provident Fund (Tier 3)
 *  8-9 columns with conditional employer contribution:
 *  S/N, Employee ID, SSNIT Number, NIA Number (ghana_card_number),
 *  Employee Name, Basic Salary,
 *  [CONDITIONAL] Employer Contribution (only if employer_rate > 0),
 *  Employee Contribution, Total Contribution
 */
function buildProvidentFundReport(
  rows: PayrollReportRow[],
  meta: ReportMeta,
  tier3EmployerRate: number = 0
): GeneratedReport {
  // Determine if employer contribution column should be included
  const hasEmployerContrib = tier3EmployerRate > 0

  // Build columns dynamically based on whether employer rate exists
  const columns: ReportColumn[] = [
    { key: "sn",               label: "S/N",                         type: "text" },
    { key: "employee_id_no",   label: "Employee ID",                 type: "text" },
    { key: "ssnit_number",     label: "SSNIT Number",                type: "text" },
    { key: "ghana_card_number",label: "NIA Number",                  type: "text" },
    { key: "employee_name",    label: "Employee Name",               type: "text" },
    { key: "basic_salary",     label: "Basic Salary (GHS)",          type: "currency" },
  ]

  // Conditionally add employer contribution column
  if (hasEmployerContrib) {
    columns.push({ key: "tier3_employer", label: "Employer Contribution (GHS)", type: "currency" })
  }

  // Add remaining columns
  columns.push(
    { key: "tier3_employee",   label: "Employee Contribution (GHS)", type: "currency" },
    { key: "total_tier3",      label: "Total Contribution (GHS)",    type: "currency" }
  )

  const withTier3 = rows.filter(
    (r) => ghs(r.tier3_employee) > 0 || ghs(r.tier3_employer) > 0
  )

  const typedRows = withTier3.map((r, idx) => {
    const basicSalary = ghs(r.basic_salary)
    const empContrib = ghs(r.tier3_employee)
    const emplrContrib = ghs(r.tier3_employer)
    const totalContrib = empContrib + emplrContrib

    const row: Record<string, any> = {
      sn:                String(idx + 1),
      employee_id_no:    r.employee_id_no ?? "",
      ssnit_number:      r.ssnit_number ?? "",
      ghana_card_number: r.ghana_card_number ?? "",
      employee_name:     r.employee_name ?? "",
      basic_salary:      basicSalary,
    }

    // Include employer contribution only if the column is needed
    if (hasEmployerContrib) {
      row.tier3_employer = emplrContrib
    }

    row.tier3_employee = empContrib
    row.total_tier3 = totalContrib

    return row
  })

  const summary = {
    total_members:       withTier3.length,
    total_basic_salary:  typedRows.reduce((s, r) => s + r.basic_salary, 0),
    total_employee:      typedRows.reduce((s, r) => s + r.tier3_employee, 0),
    total_employer:      hasEmployerContrib ? typedRows.reduce((s, r) => s + (r.tier3_employer ?? 0), 0) : 0,
    total_contributions: typedRows.reduce((s, r) => s + r.total_tier3, 0),
  }

  // Build grand total row
  const totalRow: Record<string, any> = {
    sn:                "",
    employee_id_no:    "GRAND TOTAL",
    ssnit_number:      "",
    ghana_card_number: "",
    employee_name:     `${withTier3.length} member(s)`,
    basic_salary:      summary.total_basic_salary,
  }

  if (hasEmployerContrib) {
    totalRow.tier3_employer = summary.total_employer
  }

  totalRow.tier3_employee = summary.total_employee
  totalRow.total_tier3 = summary.total_contributions
  totalRow._is_total_row = true

  const allRows: Record<string, unknown>[] = [
    ...typedRows,
    totalRow,
  ]

  return {
    ...meta,
    report_type: "provident_fund",
    report_name: REPORT_LABELS.provident_fund,
    row_count: withTier3.length,
    columns,
    rows: allRows,
    summary,
    csv: withCsvMeta(columns, allRows, meta, REPORT_LABELS.provident_fund),
  }
}

/** Report 9 — Full Payroll Summary (Tier 2 excluded — use SSNIT Tier 2 report) */
function buildPayrollSummaryReport(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const formatAllowances = (r: PayrollReportRow) => {
    const parts: string[] = []
    if (r.transport_allowance > 0) parts.push(`Transport ${ghs(r.transport_allowance).toFixed(2)}`)
    if (r.housing_allowance > 0) parts.push(`Housing ${ghs(r.housing_allowance).toFixed(2)}`)
    if (r.medical_allowance > 0) parts.push(`Medical ${ghs(r.medical_allowance).toFixed(2)}`)
    if (r.meal_allowance > 0) parts.push(`Meal ${ghs(r.meal_allowance).toFixed(2)}`)
    if (r.communication_allowance > 0) parts.push(`Comm ${ghs(r.communication_allowance).toFixed(2)}`)
    if (r.other_allowances > 0) parts.push(`Other ${ghs(r.other_allowances).toFixed(2)}`)
    if (r.overtime_pay > 0) parts.push(`OT ${ghs(r.overtime_pay).toFixed(2)}`)
    if (r.bonus_pay > 0) parts.push(`Bonus ${ghs(r.bonus_pay).toFixed(2)}`)
    return parts.length ? parts.join("; ") : "—"
  }

  const formatDeductionTypes = (r: PayrollReportRow) => {
    const parts: string[] = []
    if (r.ssnit_employee > 0) parts.push("SSNIT")
    if (r.tier3_employee > 0) parts.push("Tier3/PF")
    if (r.paye_tax > 0) parts.push("PAYE")
    if (r.loan_deduction > 0) parts.push("Loan")
    if (r.advance_deduction > 0) parts.push("Advance")
    if (r.other_deductions > 0) parts.push("Other")
    return parts.length ? parts.join(", ") : "—"
  }

  const columns: ReportColumn[] = [
    { key: "employee_id_no",   label: "Employee ID",            type: "text" },
    { key: "employee_name",    label: "Employee Name",          type: "text" },
    { key: "department",       label: "Department",             type: "text" },
    { key: "basic_salary",     label: "Basic (GHS)",            type: "currency" },
    { key: "allowance_types",  label: "Allowances (by type)",   type: "text" },
    { key: "total_allowances", label: "Allowances Total (GHS)", type: "currency" },
    { key: "gross_pay",        label: "Gross Pay (GHS)",        type: "currency" },
    { key: "ssnit_employee",   label: "SSNIT Emp (GHS)",        type: "currency" },
    { key: "tier3_employee",   label: "Tier 3 / PF (GHS)",      type: "currency" },
    { key: "tax_relief_total", label: "Tax Relief (GHS)",       type: "currency" },
    { key: "paye_taxable_income", label: "Taxable Income (GHS)", type: "currency" },
    { key: "paye_tax",         label: "PAYE Tax (GHS)",         type: "currency" },
    { key: "loan_deduction",   label: "Loans (GHS)",            type: "currency" },
    { key: "deduction_types",  label: "Deduction Types",        type: "text" },
    { key: "total_deductions", label: "Total Deductions (GHS)", type: "currency" },
    { key: "net_pay",          label: "Net Pay (GHS)",          type: "currency" },
  ]

  const typedRows = rows.map((r) => ({
    employee_id_no:   r.employee_id_no ?? "",
    employee_name:    r.employee_name ?? "",
    department:       r.department ?? "",
    basic_salary:     ghs(r.basic_salary),
    allowance_types:  formatAllowances(r),
    total_allowances: ghs(r.total_allowances),
    gross_pay:        ghs(r.gross_pay),
    ssnit_employee:   ghs(r.ssnit_employee),
    tier3_employee:   ghs(r.tier3_employee),
    tax_relief_total: ghs(r.tax_relief_total),
    paye_taxable_income: ghs(r.paye_taxable_income),
    paye_tax:         ghs(r.paye_tax),
    loan_deduction:   ghs(r.loan_deduction),
    deduction_types:  formatDeductionTypes(r),
    total_deductions: ghs(r.total_deductions),
    net_pay:          ghs(r.net_pay),
  }))

  const summary = {
    total_employees:  rows.length,
    total_gross:      typedRows.reduce((s, r) => s + r.gross_pay, 0),
    total_paye:       typedRows.reduce((s, r) => s + r.paye_tax, 0),
    total_deductions: typedRows.reduce((s, r) => s + r.total_deductions, 0),
    total_net_pay:    typedRows.reduce((s, r) => s + r.net_pay, 0),
  }

  const allRows: Record<string, unknown>[] = [
    ...typedRows,
    {
      employee_id_no:   "GRAND TOTAL",
      employee_name:    `${rows.length} employee(s)`,
      department:       "",
      basic_salary:     typedRows.reduce((s, r) => s + r.basic_salary, 0),
      allowance_types:  "",
      total_allowances: typedRows.reduce((s, r) => s + r.total_allowances, 0),
      gross_pay:        summary.total_gross,
      ssnit_employee:   typedRows.reduce((s, r) => s + r.ssnit_employee, 0),
      tier3_employee:   typedRows.reduce((s, r) => s + r.tier3_employee, 0),
      tax_relief_total: typedRows.reduce((s, r) => s + r.tax_relief_total, 0),
      paye_taxable_income: typedRows.reduce((s, r) => s + r.paye_taxable_income, 0),
      paye_tax:         summary.total_paye,
      loan_deduction:   typedRows.reduce((s, r) => s + r.loan_deduction, 0),
      deduction_types:  "",
      total_deductions: summary.total_deductions,
      net_pay:          summary.total_net_pay,
      _is_total_row:    true,
    },
  ]

  return {
    ...meta,
    report_type: "payroll_summary",
    report_name: REPORT_LABELS.payroll_summary,
    row_count: rows.length,
    columns,
    rows: allRows,
    summary,
    csv: withCsvMeta(columns, typedRows, meta, REPORT_LABELS.payroll_summary),
  }
}

/** Report 10 — Other Deductions
 *  Rows sourced from payslips for the period.
 *  Each deduction type (Loan, Advance, Other) gets its own section, then a summary page.
 */
function buildDeductionsReport(
  rows: PayrollReportRow[],
  meta: ReportMeta
): GeneratedReport {
  const columns: ReportColumn[] = [
    { key: "employee_id_no",   label: "Employee ID",          type: "text" },
    { key: "employee_name",    label: "Employee Name",        type: "text" },
    { key: "department",       label: "Department",           type: "text" },
    { key: "deduction_type",   label: "Deduction Type",       type: "text" },
    { key: "amount",           label: "Amount (GHS)",         type: "currency" },
  ]

  type DedRow = { employee_id_no: string; employee_name: string; department: string; deduction_type: string; amount: number }
  const loanDedRows:    DedRow[] = []
  const advanceDedRows: DedRow[] = []
  const otherDedRows:   DedRow[] = []

  for (const r of rows) {
    const base = { employee_id_no: r.employee_id_no ?? "", employee_name: r.employee_name ?? "", department: r.department ?? "" }
    if (ghs(r.loan_deduction) > 0)    loanDedRows.push({ ...base, deduction_type: "Loan Deduction", amount: ghs(r.loan_deduction) })
    if (ghs(r.advance_deduction) > 0) advanceDedRows.push({ ...base, deduction_type: "Advance Deduction", amount: ghs(r.advance_deduction) })
    if (ghs(r.other_deductions) > 0)  otherDedRows.push({ ...base, deduction_type: "Other Deduction", amount: ghs(r.other_deductions) })
  }

  const sectionHeader = (title: string) => ({
    employee_id_no: `=== ${title} ===`, employee_name: "", department: "", deduction_type: "", amount: "" as unknown as number,
  })
  const subtotalRow = (label: string, count: number, total: number) => ({
    employee_id_no: `  ${label}`, employee_name: `${count} employee(s)`, department: "", deduction_type: "SUBTOTAL", amount: total,
  })
  const blankRow = { employee_id_no: "", employee_name: "", department: "", deduction_type: "", amount: "" as unknown as number }

  const loanTotal    = loanDedRows.reduce((s, r) => s + r.amount, 0)
  const advanceTotal = advanceDedRows.reduce((s, r) => s + r.amount, 0)
  const otherTotal   = otherDedRows.reduce((s, r) => s + r.amount, 0)
  const grandTotal   = loanTotal + advanceTotal + otherTotal

  const combinedRows: Record<string, unknown>[] = []
  if (loanDedRows.length > 0)    combinedRows.push(sectionHeader("LOAN DEDUCTIONS"), ...loanDedRows, subtotalRow("Loans Subtotal", loanDedRows.length, loanTotal), blankRow)
  if (advanceDedRows.length > 0) combinedRows.push(sectionHeader("ADVANCE DEDUCTIONS"), ...advanceDedRows, subtotalRow("Advances Subtotal", advanceDedRows.length, advanceTotal), blankRow)
  if (otherDedRows.length > 0)   combinedRows.push(sectionHeader("OTHER DEDUCTIONS"), ...otherDedRows, subtotalRow("Other Subtotal", otherDedRows.length, otherTotal), blankRow)

  // Summary section
  const allDedRows = [...loanDedRows, ...advanceDedRows, ...otherDedRows]
  combinedRows.push(
    sectionHeader("SUMMARY"),
    { employee_id_no: "Deduction Type", employee_name: "No. of Employees", department: "", deduction_type: "Total Amount (GHS)", amount: "" as unknown as number },
    { employee_id_no: "Loan Deductions",    employee_name: String(new Set(loanDedRows.map((r) => r.employee_id_no)).size),    department: "", deduction_type: "",    amount: loanTotal },
    { employee_id_no: "Advance Deductions", employee_name: String(new Set(advanceDedRows.map((r) => r.employee_id_no)).size), department: "", deduction_type: "",    amount: advanceTotal },
    { employee_id_no: "Other Deductions",   employee_name: String(new Set(otherDedRows.map((r) => r.employee_id_no)).size),   department: "", deduction_type: "",    amount: otherTotal },
    { employee_id_no: "GRAND TOTAL", employee_name: String(new Set(allDedRows.map((r) => r.employee_id_no)).size), department: "", deduction_type: "ALL", amount: grandTotal, _is_total_row: true },
  )

  const summary = {
    total_employees:         rows.length,
    employees_with_loans:    new Set(loanDedRows.map((r) => r.employee_id_no)).size,
    employees_with_advances: new Set(advanceDedRows.map((r) => r.employee_id_no)).size,
    employees_with_others:   new Set(otherDedRows.map((r) => r.employee_id_no)).size,
    total_loans:             loanTotal,
    total_advances:          advanceTotal,
    total_others:            otherTotal,
    grand_total:             grandTotal,
  }

  return {
    ...meta,
    report_type: "deductions",
    report_name: REPORT_LABELS.deductions,
    row_count: allDedRows.length,
    columns,
    rows: combinedRows,
    summary,
    csv: withCsvMeta(columns, combinedRows, meta, REPORT_LABELS.deductions),
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

  // Fetch tier3_rates employer_rate for Provident Fund report (if needed)
  let tier3EmployerRate = 0
  if (input.report_type === "provident_fund") {
    const { data: tier3Rates } = await clientForBrand
      .from("tier3_rates")
      .select("employer_rate")
      .eq("company_id", input.company_id)
      .maybeSingle()
    tier3EmployerRate = tier3Rates?.employer_rate ?? 0
  }

  const meta: ReportMeta = {
    pay_period:   input.pay_period ?? rows[0].pay_period,
    generated_at: new Date().toISOString(),
    company_name: companyInfo?.name || rows[0].company_name || "Company",
    companyInfo,
  }

  let report: GeneratedReport

  switch (input.report_type) {
    case "paye":            report = buildPAYEReport(rows, meta);                           break
    case "ssnit_tier1":     report = buildSSNITTier1Report(rows, meta);                     break
    case "ssnit_tier2":     report = buildSSNITTier2Report(rows, meta);                     break
    case "bank_advice":     report = buildBankAdviceReport(rows, meta);                     break
    case "cost_to_company": report = buildCTCReport(rows, meta);                            break
    case "loans":           report = buildLoansReport(rows, meta);                          break
    case "allowances":      report = buildAllowancesReport(rows, meta);                     break
    case "provident_fund":  report = buildProvidentFundReport(rows, meta, tier3EmployerRate); break
    case "deductions":      report = buildDeductionsReport(rows, meta);                     break
    case "payroll_summary":
    default:                report = buildPayrollSummaryReport(rows, meta);                 break
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
