/** Default pay-component catalogue inspired by Gusto / TriNet / SAP HCM wage types. */

export type CatalogueSeed = {
  category: "allowance" | "deduction" | "provident_fund" | "bonus" | "backpay"
  code: string
  name: string
  description: string
  calculation_type: "amount" | "percentage" | "rate_x_quantity"
  calculation_basis: "basic_salary" | "gross_pay" | "taxable_pay" | "fixed" | "custom"
  default_amount?: number
  default_percentage?: number
  default_rate?: number
  frequency: "one_time" | "monthly" | "quarterly" | "annual" | "per_payroll"
  tax_treatment: "taxable" | "non_taxable" | "tax_relief" | "post_tax"
  pensionable?: boolean
  proratable?: boolean
  include_in_overtime_base?: boolean
  affects_gross_pay?: boolean
  employer_component?: boolean
  display_order: number
  unit_of_measure?: string
  rounding_rule?: string
  priority?: number
  statutory_code?: string
  jurisdiction_code?: string
  payslip_label?: string
  display_on_payslip?: boolean
  contribution_tier?: string
  eligibility_notes?: string
}

export const DEFAULT_COMPONENT_CATALOGUE: CatalogueSeed[] = [
  // Allowances
  { category: "allowance", code: "TRANS", name: "Transport Allowance", description: "Monthly commute / transport support", calculation_type: "amount", calculation_basis: "fixed", default_amount: 0, frequency: "monthly", tax_treatment: "taxable", proratable: true, display_order: 10, payslip_label: "Transport", priority: 10 },
  { category: "allowance", code: "HOUSING", name: "Housing Allowance", description: "Accommodation / rent support", calculation_type: "amount", calculation_basis: "fixed", default_amount: 0, frequency: "monthly", tax_treatment: "taxable", proratable: true, display_order: 20, payslip_label: "Housing", priority: 20 },
  { category: "allowance", code: "MEAL", name: "Meal Allowance", description: "Meal or canteen support", calculation_type: "amount", calculation_basis: "fixed", default_amount: 0, frequency: "monthly", tax_treatment: "non_taxable", display_order: 30, payslip_label: "Meal", priority: 30 },
  { category: "allowance", code: "COMM", name: "Communication Allowance", description: "Mobile / data / internet", calculation_type: "amount", calculation_basis: "fixed", default_amount: 0, frequency: "monthly", tax_treatment: "taxable", display_order: 40, payslip_label: "Communication", priority: 40 },
  { category: "allowance", code: "RESP", name: "Responsibility Allowance", description: "Role responsibility premium", calculation_type: "percentage", calculation_basis: "basic_salary", default_percentage: 0, frequency: "monthly", tax_treatment: "taxable", pensionable: true, include_in_overtime_base: true, display_order: 50, payslip_label: "Responsibility", priority: 50 },
  { category: "allowance", code: "SHIFT", name: "Shift Differential", description: "Shift premium rate × hours", calculation_type: "rate_x_quantity", calculation_basis: "custom", default_rate: 0, frequency: "per_payroll", tax_treatment: "taxable", unit_of_measure: "hours", display_order: 60, payslip_label: "Shift Diff", priority: 60 },
  { category: "allowance", code: "OT_PREM", name: "Overtime Premium", description: "Approved overtime earnings", calculation_type: "rate_x_quantity", calculation_basis: "custom", default_rate: 0, frequency: "per_payroll", tax_treatment: "taxable", unit_of_measure: "hours", display_order: 70, payslip_label: "Overtime", priority: 70 },
  { category: "allowance", code: "RISK", name: "Risk / Hazard Allowance", description: "Hazardous duty allowance", calculation_type: "amount", calculation_basis: "fixed", frequency: "monthly", tax_treatment: "taxable", display_order: 80, payslip_label: "Risk", priority: 80 },
  { category: "allowance", code: "LEAVE_ENC", name: "Leave Encashment", description: "Unused leave cash-out", calculation_type: "amount", calculation_basis: "fixed", frequency: "one_time", tax_treatment: "taxable", display_order: 90, payslip_label: "Leave Encashment", priority: 90 },

  // Deductions
  { category: "deduction", code: "LOAN", name: "Staff Loan Repayment", description: "Reference only — scheduled loan recovery is managed in the Loans module and posts to the dedicated loan deduction line", calculation_type: "amount", calculation_basis: "fixed", frequency: "monthly", tax_treatment: "post_tax", affects_gross_pay: false, display_order: 10, payslip_label: "Loan", priority: 210 },
  { category: "deduction", code: "ADVANCE", name: "Salary Advance Recovery", description: "Advance recovery", calculation_type: "amount", calculation_basis: "fixed", frequency: "one_time", tax_treatment: "post_tax", affects_gross_pay: false, display_order: 20, payslip_label: "Advance", priority: 220 },
  { category: "deduction", code: "UNION", name: "Union Dues", description: "Trade union subscription", calculation_type: "amount", calculation_basis: "fixed", frequency: "monthly", tax_treatment: "post_tax", affects_gross_pay: false, display_order: 30, payslip_label: "Union Dues", priority: 230 },
  { category: "deduction", code: "WELFARE", name: "Welfare Contribution", description: "Staff welfare deduction", calculation_type: "amount", calculation_basis: "fixed", frequency: "monthly", tax_treatment: "post_tax", affects_gross_pay: false, display_order: 40, payslip_label: "Welfare", priority: 240 },
  { category: "deduction", code: "GARNISH", name: "Court / Garnishment", description: "Court-ordered garnishment", calculation_type: "amount", calculation_basis: "fixed", frequency: "monthly", tax_treatment: "post_tax", affects_gross_pay: false, display_order: 50, payslip_label: "Garnishment", priority: 250, eligibility_notes: "Requires legal reference on the assignment" },
  { category: "deduction", code: "ABSENCE", name: "Unpaid Absence", description: "Deduction for unpaid days", calculation_type: "rate_x_quantity", calculation_basis: "basic_salary", frequency: "per_payroll", tax_treatment: "post_tax", unit_of_measure: "days", affects_gross_pay: false, display_order: 60, payslip_label: "Unpaid Absence", priority: 260 },

  // Provident / pension style
  { category: "provident_fund", code: "PF_EE", name: "Employee Provident Fund", description: "Employee PF contribution", calculation_type: "percentage", calculation_basis: "basic_salary", default_percentage: 5, frequency: "monthly", tax_treatment: "tax_relief", pensionable: true, contribution_tier: "employee", display_order: 10, payslip_label: "PF Employee", priority: 310, statutory_code: "PF-EE" },
  { category: "provident_fund", code: "PF_ER", name: "Employer Provident Fund", description: "Employer PF contribution (memo)", calculation_type: "percentage", calculation_basis: "basic_salary", default_percentage: 5, frequency: "monthly", tax_treatment: "non_taxable", pensionable: true, employer_component: true, contribution_tier: "employer", affects_gross_pay: false, display_order: 20, payslip_label: "PF Employer", priority: 320, statutory_code: "PF-ER" },
  { category: "provident_fund", code: "TIER3", name: "Tier 3 Voluntary Pension", description: "Voluntary third-tier pension", calculation_type: "percentage", calculation_basis: "basic_salary", default_percentage: 0, frequency: "monthly", tax_treatment: "tax_relief", pensionable: true, contribution_tier: "tier3", display_order: 30, payslip_label: "Tier 3", priority: 330, jurisdiction_code: "GH" },

  // Bonus
  { category: "bonus", code: "PERF", name: "Performance Bonus", description: "Discretionary performance award", calculation_type: "amount", calculation_basis: "fixed", frequency: "one_time", tax_treatment: "taxable", display_order: 10, payslip_label: "Performance Bonus", priority: 410 },
  { category: "bonus", code: "ANNUAL", name: "Annual / 13th Month", description: "Annual bonus or 13th month pay", calculation_type: "percentage", calculation_basis: "basic_salary", default_percentage: 100, frequency: "annual", tax_treatment: "taxable", display_order: 20, payslip_label: "13th Month", priority: 420 },
  { category: "bonus", code: "RETENTION", name: "Retention Bonus", description: "Retention / stay bonus", calculation_type: "amount", calculation_basis: "fixed", frequency: "one_time", tax_treatment: "taxable", display_order: 30, payslip_label: "Retention", priority: 430 },
  { category: "bonus", code: "COMMISSION", name: "Sales Commission", description: "Commission earnings", calculation_type: "amount", calculation_basis: "custom", frequency: "per_payroll", tax_treatment: "taxable", display_order: 40, payslip_label: "Commission", priority: 440 },

  // Backpay
  { category: "backpay", code: "BP_SAL", name: "Salary Backpay", description: "Retroactive basic salary correction", calculation_type: "amount", calculation_basis: "fixed", frequency: "one_time", tax_treatment: "taxable", display_order: 10, payslip_label: "Salary Backpay", priority: 510, eligibility_notes: "Set source period and payroll treatment" },
  { category: "backpay", code: "BP_ALLOW", name: "Allowance Backpay", description: "Retroactive allowance correction", calculation_type: "amount", calculation_basis: "fixed", frequency: "one_time", tax_treatment: "taxable", display_order: 20, payslip_label: "Allowance Backpay", priority: 520 },
  { category: "backpay", code: "BP_PROMO", name: "Promotion Backpay", description: "Promotion effective-date catch-up", calculation_type: "amount", calculation_basis: "fixed", frequency: "one_time", tax_treatment: "taxable", display_order: 30, payslip_label: "Promotion Backpay", priority: 530 },
]

export function definitionRowsForCompany(companyId: string, userId: string | null) {
  return DEFAULT_COMPONENT_CATALOGUE.map((item) => ({
    company_id: companyId,
    category: item.category,
    code: item.code,
    name: item.name,
    description: item.description,
    calculation_type: item.calculation_type,
    calculation_basis: item.calculation_basis,
    default_amount: item.default_amount ?? 0,
    default_percentage: item.default_percentage ?? 0,
    default_rate: item.default_rate ?? 0,
    currency_code: "GHS",
    frequency: item.frequency,
    tax_treatment: item.tax_treatment,
    pensionable: Boolean(item.pensionable),
    proratable: Boolean(item.proratable),
    include_in_overtime_base: Boolean(item.include_in_overtime_base),
    affects_gross_pay: item.affects_gross_pay !== false,
    employer_component: Boolean(item.employer_component),
    display_order: item.display_order,
    unit_of_measure: item.unit_of_measure || "amount",
    rounding_rule: item.rounding_rule || "nearest_0_01",
    priority: item.priority ?? item.display_order,
    statutory_code: item.statutory_code || null,
    jurisdiction_code: item.jurisdiction_code || "GH",
    payslip_label: item.payslip_label || item.name,
    display_on_payslip: item.display_on_payslip !== false,
    contribution_tier: item.contribution_tier || null,
    eligibility_notes: item.eligibility_notes || null,
    active: true,
    created_by: userId,
    updated_at: new Date().toISOString(),
  }))
}
