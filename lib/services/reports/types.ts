/**
 * Compliance Reports — Shared Types
 *
 * All 8 Ghana statutory reports share this type foundation.
 * Row data comes from the v_payroll_report_summary view.
 */

// ─── Report identity ────────────────────────────────────────────────────────

export type ReportType =
  | "paye"
  | "ssnit_tier1"
  | "ssnit_tier2"
  | "bank_advice"
  | "cost_to_company"
  | "loans"
  | "deductions"
  | "allowances"
  | "provident_fund"
  | "payroll_summary"
  | "custom"

export const REPORT_LABELS: Record<ReportType, string> = {
  paye:             "PAYE Tax Report (GRA)",
  ssnit_tier1:      "SSNIT Tier 1 Contributions",
  ssnit_tier2:      "SSNIT Tier 2 Contributions",
  bank_advice:      "Bank Payment Advice",
  cost_to_company:  "Cost to Company (CTC)",
  loans:            "Loans & Advances",
  deductions:       "Other Deductions",
  allowances:       "Allowances Report",
  provident_fund:   "Provident Fund (Tier 3)",
  payroll_summary:  "Monthly Payroll Summary",
  custom:           "Custom Report",
}

export const REPORT_CATEGORIES: Record<ReportType, "compliance" | "payroll" | "finance" | "custom"> = {
  paye:            "compliance",
  ssnit_tier1:     "compliance",
  ssnit_tier2:     "compliance",
  bank_advice:     "finance",
  cost_to_company: "finance",
  loans:           "payroll",
  deductions:      "payroll",
  allowances:      "payroll",
  provident_fund:  "compliance",
  payroll_summary: "payroll",
  custom:          "custom",
}

// ─── Source row from v_payroll_report_summary ────────────────────────────────

export interface PayrollReportRow {
  company_id:            string
  payroll_run_id:        string | null
  pay_period:            string
  pay_period_start:      string
  pay_period_end:        string
  pay_date:              string
  employee_id:           string
  employee_name:         string | null
  employee_id_no:        string | null
  position:              string | null
  department:            string | null
  ssnit_number:          string | null
  bank_name:             string | null
  account_number:        string | null
  company_name:          string | null
  ghana_card_number:     string | null
  first_name:            string | null
  last_name:             string | null
  other_names:           string | null
  snapshot_subsidiary:   string | null
  snapshot_division:     string | null
  snapshot_location:     string | null
  date_of_joining:       string | null
  contract_type:         string | null
  basic_salary:          number
  transport_allowance:   number
  housing_allowance:     number
  medical_allowance:     number
  meal_allowance:        number
  communication_allowance: number
  other_allowances:      number
  overtime_pay:          number
  bonus_pay:             number
  total_allowances:      number
  gross_pay:             number
  ssnit_employee:        number
  ssnit_employer:        number
  tier2_employee:        number
  tier2_employer:        number
  tier3_employee:        number
  tier3_employer:        number
  paye_taxable_income:   number
  tax_relief_total:      number
  paye_tax:              number
  loan_deduction:        number
  advance_deduction:     number
  other_deductions:      number
  total_deductions:      number
  net_pay:               number
  total_employer_cost:   number
  cost_to_company:       number
  payslip_status:        string
  loan_amount:           number | null
  current_loan_balance:  number | null
  current_loan_deduction: number | null
}

// ─── Generated report payload ────────────────────────────────────────────────

export interface GeneratedReport<TRow = Record<string, unknown>> {
  report_type:    ReportType
  report_name:    string
  pay_period:     string
  generated_at:   string
  company_name:   string
  row_count:      number
  columns:        ReportColumn[]
  rows:           TRow[]
  summary:        Record<string, number>
  /** CSV string — ready for download */
  csv:            string
}

export interface ReportColumn {
  key:     string
  label:   string
  type:    "text" | "number" | "currency" | "date" | "percentage"
  width?:  number
}

// ─── DB record ───────────────────────────────────────────────────────────────

export interface ComplianceReportRecord {
  id:              string
  company_id:      string
  payroll_run_id:  string | null
  report_type:     ReportType
  report_name:     string
  pay_period:      string | null
  tax_year:        number | null
  from_date:       string | null
  to_date:         string | null
  generated_by:    string | null
  generated_at:    string
  row_count:       number
  file_path:       string | null
  export_format:   string
  status:          "generated" | "submitted" | "filed" | "voided"
  submitted_at:    string | null
  submission_ref:  string | null
  notes:           string | null
  created_at:      string
  updated_at:      string
}
