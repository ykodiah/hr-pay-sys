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
  { key: "employee_id_no", label: "Employee ID", type: "text", source: "payroll" },
  { key: "employee_name", label: "Employee Name", type: "text", source: "payroll" },
  { key: "department", label: "Department", type: "text", source: "payroll" },
  { key: "position", label: "Position", type: "text", source: "payroll" },
  { key: "ghana_card_number", label: "Ghana Card No.", type: "text", source: "payroll" },
  { key: "ssnit_number", label: "SSNIT Number", type: "text", source: "payroll" },
  { key: "basic_salary", label: "Basic Salary (GHS)", type: "currency", source: "payroll" },
  { key: "total_allowances", label: "Total Allowances (GHS)", type: "currency", source: "payroll" },
  { key: "gross_pay", label: "Gross Pay (GHS)", type: "currency", source: "payroll" },
  { key: "ssnit_employee", label: "SSNIT Employee (GHS)", type: "currency", source: "payroll" },
  { key: "ssnit_employer", label: "SSNIT Employer (GHS)", type: "currency", source: "payroll" },
  { key: "tier2_employee", label: "Tier 2 Employee (GHS)", type: "currency", source: "payroll" },
  { key: "tier2_employer", label: "Tier 2 Employer (GHS)", type: "currency", source: "payroll" },
  { key: "tier3_employee", label: "Tier 3 Employee (GHS)", type: "currency", source: "payroll" },
  { key: "paye_taxable_income", label: "Taxable Income (GHS)", type: "currency", source: "payroll" },
  { key: "paye_tax", label: "PAYE Tax (GHS)", type: "currency", source: "payroll" },
  { key: "loan_deduction", label: "Loan Deduction (GHS)", type: "currency", source: "payroll" },
  { key: "advance_deduction", label: "Advance Deduction (GHS)", type: "currency", source: "payroll" },
  { key: "other_deductions", label: "Other Deductions (GHS)", type: "currency", source: "payroll" },
  { key: "total_deductions", label: "Total Deductions (GHS)", type: "currency", source: "payroll" },
  { key: "net_pay", label: "Net Pay (GHS)", type: "currency", source: "payroll" },
  { key: "cost_to_company", label: "Cost to Company (GHS)", type: "currency", source: "banking" },
  { key: "overtime_pay", label: "Overtime Pay (GHS)", type: "currency", source: "payroll" },
  { key: "bonus_pay", label: "Bonus (GHS)", type: "currency", source: "payroll" },
  { key: "bank_name", label: "Bank Name", type: "text", source: "banking" },
  { key: "account_number", label: "Account Number", type: "text", source: "banking" },
  { key: "pay_date", label: "Payment Date", type: "date", source: "banking" },
]
