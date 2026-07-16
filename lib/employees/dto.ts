/** Shared employee DTO used by API + modules. */

export type EmployeeFinancialDto = {
  monthly_salary: number
  annual_salary: number | null
  transport_allowance: number
  housing_allowance: number
  medical_allowance: number
  meal_allowance: number
  communication_allowance: number
  uniform_allowance: number
  other_allowances: number
  bank_name: string | null
  bank_account_number: string | null
  ssnit_number: string | null
  tier3_contribution: number
}

export type EmployeeDto = {
  id: string
  company_id: string | null
  employee_id: string | null
  first_name: string | null
  last_name: string | null
  other_names?: string | null
  full_name: string
  display_name?: string | null
  personal_email?: string | null
  corporate_email?: string | null
  phone?: string | null
  position?: string | null
  department?: string | null
  division?: string | null
  location?: string | null
  status: string
  special_role?: string | null
  subsidiary_id?: string | null
  contract_type?: string | null
  date_of_joining?: string | null
  date_of_exit?: string | null
  ghana_card_number?: string | null
  direct_supervisor?: string | null
  head_of_department?: string | null
  created_at?: string
  updated_at?: string
  financial?: EmployeeFinancialDto | null
  subsidiaries?: { id: string; name: string } | null
}

export function mapFinancial(raw: any): EmployeeFinancialDto | null {
  if (!raw) return null
  const fin = Array.isArray(raw) ? raw[0] : raw
  if (!fin) return null
  return {
    monthly_salary: Number(fin.monthly_salary ?? fin.basic_salary ?? 0),
    annual_salary: fin.annual_salary != null ? Number(fin.annual_salary) : null,
    transport_allowance: Number(fin.transport_allowance ?? 0),
    housing_allowance: Number(fin.housing_allowance ?? 0),
    medical_allowance: Number(fin.medical_allowance ?? 0),
    meal_allowance: Number(fin.meal_allowance ?? 0),
    communication_allowance: Number(fin.communication_allowance ?? 0),
    uniform_allowance: Number(fin.uniform_allowance ?? 0),
    other_allowances: Number(fin.other_allowances ?? 0),
    bank_name: fin.bank_name ?? null,
    bank_account_number: fin.bank_account_number ?? null,
    ssnit_number: fin.ssnit_number ?? null,
    tier3_contribution: Number(fin.tier3_contribution ?? 0),
  }
}

export function mapEmployeeRow(row: any, includeFinancial = false): EmployeeDto {
  const subsidiary = Array.isArray(row.subsidiaries) ? row.subsidiaries[0] : row.subsidiaries
  const fullName =
    row.full_name ||
    row.display_name ||
    `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() ||
    row.employee_id ||
    "Employee"

  return {
    id: row.id,
    company_id: row.company_id ?? null,
    employee_id: row.employee_id ?? null,
    first_name: row.first_name ?? null,
    last_name: row.last_name ?? null,
    other_names: row.other_names ?? null,
    full_name: fullName,
    display_name: row.display_name ?? fullName,
    personal_email: row.personal_email ?? null,
    corporate_email: row.corporate_email ?? null,
    phone: row.phone ?? row.phone_number ?? null,
    position: row.position ?? null,
    department: row.department ?? null,
    division: row.division ?? null,
    location: row.location ?? null,
    status: row.status ?? "Active",
    special_role: row.special_role ?? null,
    subsidiary_id: row.subsidiary_id ?? null,
    contract_type: row.contract_type ?? null,
    date_of_joining: row.date_of_joining ?? row.hire_date ?? null,
    date_of_exit: row.date_of_exit ?? null,
    ghana_card_number: row.ghana_card_number ?? null,
    direct_supervisor: row.direct_supervisor ?? null,
    head_of_department: row.head_of_department ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    subsidiaries: subsidiary ? { id: subsidiary.id, name: subsidiary.name } : null,
    financial: includeFinancial ? mapFinancial(row.financial ?? row.employee_financial) : undefined,
  }
}

/** Compact option for selects in loans/promotions/disciplinary. */
export function toEmployeeOption(emp: EmployeeDto) {
  return {
    id: emp.id,
    employee_id: emp.employee_id,
    first_name: emp.first_name,
    last_name: emp.last_name,
    full_name: emp.full_name,
    department: emp.department,
    position: emp.position,
    status: emp.status,
  }
}
