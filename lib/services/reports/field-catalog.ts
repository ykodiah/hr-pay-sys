import type { ReportColumn } from "./types"

export type CustomDataSource = "payroll" | "employees" | "loans" | "banking"

export interface CustomFieldDef {
  key: string
  label: string
  type: ReportColumn["type"]
  source: CustomDataSource
}

/** Field catalog users can pick from when designing a report (client-safe). */
export const CUSTOM_FIELD_CATALOG: CustomFieldDef[] = [
  // ── Employee identity ────────────────────────────────────────────────────
  { key: "employee_id_no",        label: "Employee ID",              type: "text",     source: "employees" },
  { key: "employee_name",         label: "Employee Name",            type: "text",     source: "employees" },
  { key: "department",            label: "Department",               type: "text",     source: "employees" },
  { key: "position",              label: "Position",                 type: "text",     source: "employees" },
  { key: "ghana_card_number",     label: "Ghana Card No.",           type: "text",     source: "employees" },
  { key: "ssnit_number",          label: "SSNIT Number",             type: "text",     source: "employees" },
  { key: "company_name",          label: "Company",                  type: "text",     source: "employees" },
  { key: "snapshot_subsidiary",   label: "Subsidiary",               type: "text",     source: "employees" },
  { key: "snapshot_division",     label: "Division",                 type: "text",     source: "employees" },
  { key: "snapshot_location",     label: "Location",                 type: "text",     source: "employees" },
  // ── Pay ─────────────────────────────────────────────────────────────────
  { key: "basic_salary",          label: "Basic Salary (GHS)",       type: "currency", source: "payroll" },
  { key: "total_allowances",      label: "Total Allowances (GHS)",   type: "currency", source: "payroll" },
  { key: "gross_pay",             label: "Gross Pay (GHS)",          type: "currency", source: "payroll" },
  { key: "overtime_pay",          label: "Overtime Pay (GHS)",       type: "currency", source: "payroll" },
  { key: "bonus_pay",             label: "Bonus (GHS)",              type: "currency", source: "payroll" },
  // ── Statutory ───────────────────────────────────────────────────────────
  { key: "ssnit_employee",        label: "SSNIT Employee (GHS)",     type: "currency", source: "payroll" },
  { key: "ssnit_employer",        label: "SSNIT Employer (GHS)",     type: "currency", source: "payroll" },
  { key: "tier2_employee",        label: "Tier 2 Employee (GHS)",    type: "currency", source: "payroll" },
  { key: "tier3_employee",        label: "Tier 3 Employee (GHS)",    type: "currency", source: "payroll" },
  { key: "paye_taxable_income",   label: "Taxable Income (GHS)",     type: "currency", source: "payroll" },
  { key: "paye_tax",              label: "PAYE Tax (GHS)",           type: "currency", source: "payroll" },
  // ── Deductions ───────────────────────────────────────────────────────────
  { key: "loan_deduction",        label: "Loan Deduction (GHS)",     type: "currency", source: "payroll" },
  { key: "advance_deduction",     label: "Advance Deduction (GHS)",  type: "currency", source: "payroll" },
  { key: "other_deductions",      label: "Other Deductions (GHS)",   type: "currency", source: "payroll" },
  { key: "total_deductions",      label: "Total Deductions (GHS)",   type: "currency", source: "payroll" },
  // ── Net & CTC ────────────────────────────────────────────────────────────
  { key: "net_pay",               label: "Net Pay (GHS)",            type: "currency", source: "payroll" },
  { key: "cost_to_company",       label: "Cost to Company (GHS)",    type: "currency", source: "payroll" },
  // ── Banking ─────────────────────────────────────────────────────────────
  { key: "bank_name",             label: "Bank Name",                type: "text",     source: "banking" },
  { key: "account_number",        label: "Account Number",           type: "text",     source: "banking" },
  { key: "pay_date",              label: "Payment Date",             type: "date",     source: "banking" },
]
