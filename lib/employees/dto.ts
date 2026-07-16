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
  bank_branch: string | null
  bank_account_number: string | null
  ssnit_number: string | null
  tier3_contribution: number
  provident_fund_enrolled: boolean
  provident_fund_rate: number
}

export type EmployeeAllowanceDto = {
  id?: string
  allowance_id?: string | null
  code: string | null
  description: string | null
  taxable: boolean
  recurring: boolean
  amount: number
  percentage: number
  calculationType: "AMOUNT" | "PERCENTAGE"
  effectiveDate: string | null
  endDate: string | null
}

export type EmployeeDeductionDto = {
  id?: string
  deduction_id?: string | null
  code: string | null
  description: string | null
  taxable: boolean
  recurring: boolean
  amount: number
  percentage: number
  calculationType: "AMOUNT" | "PERCENTAGE"
  effectiveDate: string | null
  endDate: string | null
}

export type EmployeeDocumentDto = {
  id: string
  documentType: string | null
  fileName: string | null
  fileSize: number | null
  fileType: string | null
  fileUrl: string | null
  vaultDocumentId?: string | null
  uploadDate: string | null
  uploadedBy?: string | null
  notes?: string | null
}

export type EmployeeDto = {
  id: string
  company_id: string | null
  employee_id: string | null
  prefix?: string | null
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
  date_of_birth?: string | null
  gender?: string | null
  marital_status?: string | null
  address?: string | null
  ghana_card_number?: string | null
  direct_supervisor?: string | null
  head_of_department?: string | null
  emergency_contact_name?: string | null
  emergency_contact_tel?: string | null
  educational_level?: string | null
  inactive_reason?: string | null
  probation_period?: number | string | null
  confirmation_date?: string | null
  notice_period?: string | null
  profile_picture?: string | null
  created_at?: string
  updated_at?: string
  financial?: EmployeeFinancialDto | null
  allowances?: EmployeeAllowanceDto[]
  deductions?: EmployeeDeductionDto[]
  documents?: EmployeeDocumentDto[]
  subsidiaries?: { id: string; name: string } | null
}

export function mapFinancial(raw: any): EmployeeFinancialDto | null {
  if (!raw) return null
  const fin = Array.isArray(raw) ? raw[0] : raw
  if (!fin) return null
  const pfRate = Math.min(16.5, Math.max(0, Number(fin.provident_fund_rate ?? 0)))
  const enrolled =
    fin.provident_fund_enrolled === true ||
    fin.provident_fund_enrolled === "true" ||
    (fin.provident_fund_enrolled == null && pfRate > 0)
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
    bank_branch: fin.bank_branch ?? null,
    bank_account_number: fin.bank_account_number ?? null,
    ssnit_number: fin.ssnit_number ?? null,
    tier3_contribution: Number(fin.tier3_contribution ?? 0),
    provident_fund_enrolled: enrolled,
    provident_fund_rate: pfRate,
  }
}

export function mapAllowanceRow(row: any): EmployeeAllowanceDto {
  return {
    id: row.id,
    allowance_id: row.allowance_id ?? row.id ?? null,
    code: row.code ?? null,
    description: row.description ?? null,
    taxable: Boolean(row.taxable),
    recurring: row.recurring !== false,
    amount: Number(row.amount ?? 0),
    percentage: Number(row.percentage ?? 0),
    calculationType: String(row.calculation_type || row.calculationType || "AMOUNT").toUpperCase() === "PERCENTAGE"
      ? "PERCENTAGE"
      : "AMOUNT",
    effectiveDate: row.effective_date || row.effectiveDate || null,
    endDate: row.end_date || row.endDate || null,
  }
}

export function mapDeductionRow(row: any): EmployeeDeductionDto {
  return {
    id: row.id,
    deduction_id: row.deduction_id ?? row.id ?? null,
    code: row.code ?? null,
    description: row.description ?? null,
    taxable: Boolean(row.taxable),
    recurring: row.recurring !== false,
    amount: Number(row.amount ?? 0),
    percentage: Number(row.percentage ?? 0),
    calculationType: String(row.calculation_type || row.calculationType || "AMOUNT").toUpperCase() === "PERCENTAGE"
      ? "PERCENTAGE"
      : "AMOUNT",
    effectiveDate: row.effective_date || row.effectiveDate || null,
    endDate: row.end_date || row.endDate || null,
  }
}

export function mapDocumentRow(row: any): EmployeeDocumentDto {
  const fileUrl = row.file_url || row.file_path || row.file_content || null
  return {
    id: row.id,
    documentType: row.document_type || row.documentType || null,
    fileName: row.file_name || row.document_name || row.fileName || null,
    fileSize: row.file_size != null ? Number(row.file_size) : null,
    fileType: row.mime_type || row.file_type || row.fileType || null,
    fileUrl,
    vaultDocumentId: row.vault_document_id || null,
    uploadDate: row.upload_date || row.created_at || null,
    uploadedBy: row.uploaded_by || null,
    notes: row.notes || null,
  }
}

export function mapEmployeeRow(
  row: any,
  includeFinancial = false,
  extras?: {
    allowances?: any[]
    deductions?: any[]
    documents?: any[]
  },
): EmployeeDto {
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
    prefix: row.prefix ?? null,
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
    date_of_birth: row.date_of_birth ?? null,
    gender: row.gender ?? null,
    marital_status: row.marital_status ?? null,
    address: row.address ?? null,
    ghana_card_number: row.ghana_card_number ?? null,
    direct_supervisor: row.direct_supervisor ?? null,
    head_of_department: row.head_of_department ?? null,
    emergency_contact_name: row.emergency_contact_name ?? null,
    emergency_contact_tel: row.emergency_contact_tel ?? null,
    educational_level: row.educational_level ?? null,
    inactive_reason: row.inactive_reason ?? null,
    probation_period: row.probation_period ?? null,
    confirmation_date: row.confirmation_date ?? null,
    notice_period: row.notice_period ?? null,
    profile_picture: row.profile_picture ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    subsidiaries: subsidiary ? { id: subsidiary.id, name: subsidiary.name } : null,
    financial: includeFinancial ? mapFinancial(row.financial ?? row.employee_financial) : undefined,
    allowances: (extras?.allowances ?? row.allowances ?? []).map(mapAllowanceRow),
    deductions: (extras?.deductions ?? row.deductions ?? []).map(mapDeductionRow),
    documents: (extras?.documents ?? row.documents ?? []).map(mapDocumentRow),
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
