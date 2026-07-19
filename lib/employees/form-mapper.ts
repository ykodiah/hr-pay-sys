/** Map employee add/edit form (camelCase) ↔ API / DTO (snake_case). */

import type { EmployeeDto } from "@/lib/employees/dto"

export function parseOrgList(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((s) => s.trim()).filter(Boolean)
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.map(String).map((s) => s.trim()).filter(Boolean)
      }
    } catch {
      return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }
  return [...fallback]
}

/**
 * Extract org lists from the tenant company / company_settings only.
 * No hardcoded Accra/demo fallbacks — empty means configure in Company Settings.
 */
export function extractOrgOptions(source: any, settingsData?: any, options?: { allowDemoFallback?: boolean }) {
  const merged = {
    divisions: settingsData?.divisions ?? source?.divisions,
    departments: settingsData?.departments ?? source?.departments,
    locations: settingsData?.locations ?? source?.locations,
  }
  const demoFallback = options?.allowDemoFallback === true
  return {
    divisions: parseOrgList(
      merged.divisions,
      demoFallback ? ["Head Office", "Regional Office"] : [],
    ),
    departments: parseOrgList(
      merged.departments,
      demoFallback
        ? ["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"]
        : [],
    ),
    locations: parseOrgList(
      merged.locations,
      demoFallback ? ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"] : [],
    ),
  }
}

export function employeeToFormData(employee: EmployeeDto | any) {
  const fin = employee?.financial || {}
  const monthly = fin.monthly_salary ?? employee?.salary ?? ""
  const annual =
    fin.annual_salary ??
    employee?.annual_salary ??
    (monthly !== "" && monthly != null && Number(monthly) > 0 ? Number(monthly) * 12 : "")

  return {
    employeeId: employee?.employee_id || employee?.employeeId || "",
    prefix: employee?.prefix || "",
    firstName: employee?.first_name || "",
    otherNames: employee?.other_names || "",
    lastName: employee?.last_name || "",
    maritalStatus: employee?.marital_status || "",
    corporateEmail: employee?.corporate_email || "",
    personalEmail: employee?.personal_email || "",
    phone: employee?.phone || employee?.phone_number || "",
    position: employee?.position || "",
    specialRole: employee?.special_role || "No Role",
    hasSubsidiary: employee?.subsidiary_id ? "Yes" : "No",
    subsidiary: employee?.subsidiary_id || "",
    division: employee?.division || "",
    department: employee?.department || "",
    location: employee?.location || "",
    contractType: employee?.contract_type || "Permanent",
    dateOfJoining: employee?.date_of_joining || "",
    dateOfExit: employee?.date_of_exit || "",
    status: employee?.status || "Active",
    inactiveReason: employee?.inactive_reason || "",
    probationPeriod: employee?.probation_period != null ? String(employee.probation_period) : "6",
    confirmationDate: employee?.confirmation_date || "",
    noticePeriod: employee?.notice_period || employee?.noticePeriod || "",
    directSupervisor: employee?.direct_supervisor || "",
    headOfDepartment: employee?.head_of_department || "",
    annualSalary: annual !== "" && annual != null ? String(annual) : "",
    salary: monthly !== "" && monthly != null ? String(monthly) : "",
    transportAllowance: fin.transport_allowance != null ? String(fin.transport_allowance) : "",
    housingAllowance: fin.housing_allowance != null ? String(fin.housing_allowance) : "",
    medicalAllowance: fin.medical_allowance != null ? String(fin.medical_allowance) : "",
    mealAllowance: fin.meal_allowance != null ? String(fin.meal_allowance) : "",
    uniformAllowance: fin.uniform_allowance != null ? String(fin.uniform_allowance) : "",
    communicationAllowance: fin.communication_allowance != null ? String(fin.communication_allowance) : "",
    otherAllowances: fin.other_allowances != null ? String(fin.other_allowances) : "",
    taxDeduction: "",
    ssnit: fin.ssnit_number || employee?.ssnit_number || "",
    tier3: fin.tier3_contribution != null ? String(fin.tier3_contribution) : "",
    providentFundEnrolled: fin.provident_fund_enrolled ? "Yes" : "No",
    providentFundRate:
      fin.provident_fund_rate != null && Number(fin.provident_fund_rate) > 0
        ? String(fin.provident_fund_rate)
        : "",
    loanDeduction: "",
    advanceDeduction: "",
    otherDeductions: "",
    startDate: employee?.date_of_joining || "",
    dateOfBirth: employee?.date_of_birth || "",
    address: employee?.address || "",
    emergencyContactName: employee?.emergency_contact_name || "",
    emergencyContactTel: employee?.emergency_contact_tel || "",
    educationalLevel: employee?.educational_level || "",
    gender: employee?.gender || "",
    bankName: fin.bank_name || "",
    bankBranch: fin.bank_branch || "",
    bankAccount: fin.bank_account_number || "",
    ghanaCard: employee?.ghana_card_number || "",
    documents: employee?.documents || [],
    profilePicture: employee?.profile_picture || "",
    profilePictureFile: null,
  }
}

/** Map API allowance/deduction rows into AddEmployeeForm selected* state. */
export function toSelectedFinancialRows(rows: any[] | undefined | null) {
  if (!Array.isArray(rows)) return []
  return rows.map((row) => ({
    id: row.allowance_id || row.deduction_id || row.id || row.code,
    code: row.code || "",
    description: row.description || "",
    taxable: Boolean(row.taxable),
    recurring: row.recurring !== false,
    amount: String(row.amount ?? 0),
    percentage: String(row.percentage ?? 0),
    calculationType: (String(row.calculationType || row.calculation_type || "AMOUNT").toUpperCase() ===
    "PERCENTAGE"
      ? "PERCENTAGE"
      : "AMOUNT") as "AMOUNT" | "PERCENTAGE",
    effectiveDate: row.effectiveDate || row.effective_date || new Date().toISOString().slice(0, 10),
    endDate: row.endDate || row.end_date || undefined,
  }))
}

export function toUploadedDocumentsState(docs: any[] | undefined | null) {
  if (!Array.isArray(docs)) return []
  return docs.map((doc) => ({
    id: doc.id || doc.vaultDocumentId || `doc-${doc.documentType || doc.document_type}`,
    documentType: doc.documentType || doc.document_type,
    fileName: doc.fileName || doc.file_name || doc.document_name || "Document",
    fileSize: Number(doc.fileSize ?? doc.file_size ?? 0),
    fileType: doc.fileType || doc.mime_type || doc.file_type || "application/octet-stream",
    fileUrl: doc.fileUrl || doc.file_url || doc.file_path || doc.file_content || null,
    vaultDocumentId: doc.vaultDocumentId || doc.vault_document_id || null,
    uploadDate: doc.uploadDate || doc.upload_date ? new Date(doc.uploadDate || doc.upload_date) : new Date(),
    uploadedBy: doc.uploadedBy || doc.uploaded_by || "HR Admin",
  }))
}

function numOrNull(value: unknown) {
  if (value === "" || value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function numOrZero(value: unknown) {
  const n = numOrNull(value)
  return n == null ? 0 : n
}

/** Build POST/PATCH body for /api/employees from the add/edit form. */
export function formToApiPayload(form: any, companyId?: string | null) {
  const monthly = numOrZero(form.salary)
  const annual = numOrNull(form.annualSalary) ?? (monthly > 0 ? monthly * 12 : null)
  const fullName =
    form.fullName ||
    `${form.firstName || ""} ${form.otherNames || ""} ${form.lastName || ""}`.replace(/\s+/g, " ").trim()
  const displayName = form.displayName || `${form.firstName || ""} ${form.lastName || ""}`.trim()

  return {
    company_id: companyId || undefined,
    employee_id: form.employeeId || form.employee_id || null,
    prefix: form.prefix || null,
    first_name: form.firstName,
    other_names: form.otherNames || null,
    last_name: form.lastName,
    full_name: fullName,
    display_name: displayName,
    personal_email: form.personalEmail || null,
    corporate_email: form.corporateEmail || null,
    phone: form.phone || null,
    position: form.position || null,
    department: form.department || null,
    division: form.division || null,
    location: form.location || null,
    status: form.status || "Active",
    special_role: form.specialRole || null,
    subsidiary_id: form.hasSubsidiary === "Yes" ? form.subsidiary || null : null,
    contract_type: form.contractType || "Permanent",
    date_of_joining: form.dateOfJoining || null,
    date_of_exit: form.dateOfExit || null,
    date_of_birth: form.dateOfBirth || null,
    gender: form.gender || null,
    marital_status: form.maritalStatus || null,
    address: form.address || null,
    ghana_card_number: form.ghanaCard || null,
    direct_supervisor: form.directSupervisor || null,
    head_of_department: form.headOfDepartment || null,
    emergency_contact_name: form.emergencyContactName || null,
    emergency_contact_tel: form.emergencyContactTel || null,
    educational_level: form.educationalLevel || null,
    inactive_reason: form.inactiveReason || null,
    probation_period: form.probationPeriod ? Number.parseInt(String(form.probationPeriod), 10) : null,
    confirmation_date: form.confirmationDate || null,
    notice_period: form.noticePeriod || null,
    profile_picture: form.profilePicture || null,
    financial: {
      monthly_salary: monthly,
      annual_salary: annual,
      transport_allowance: numOrZero(form.transportAllowance),
      housing_allowance: numOrZero(form.housingAllowance),
      medical_allowance: numOrZero(form.medicalAllowance),
      meal_allowance: numOrZero(form.mealAllowance),
      communication_allowance: numOrZero(form.communicationAllowance),
      uniform_allowance: numOrZero(form.uniformAllowance),
      other_allowances: numOrZero(form.otherAllowances),
      bank_name: form.bankName || "Pending",
      bank_branch: form.bankBranch || null,
      bank_account_number: form.bankAccount || "Pending",
      ssnit_number: form.ssnit || "Pending",
      tier3_contribution: numOrZero(form.tier3),
      provident_fund_enrolled: form.providentFundEnrolled === "Yes" || form.providentFundEnrolled === true,
      provident_fund_rate: Math.min(
        16.5,
        Math.max(0, numOrZero(form.providentFundRate)),
      ),
    },
    allowances: Array.isArray(form.selectedAllowances) ? form.selectedAllowances : [],
    deductions: Array.isArray(form.selectedDeductions) ? form.selectedDeductions : [],
    documents: Array.isArray(form.documents)
      ? form.documents
      : Array.isArray(form.uploadedDocuments)
        ? form.uploadedDocuments
        : [],
  }
}

export function listMonthlySalary(employee: any) {
  return Number(
    employee?.financial?.monthly_salary ??
      employee?.monthly_salary ??
      employee?.salary ??
      0,
  )
}

export function listEmployeeCode(employee: any) {
  return employee?.employee_id || employee?.employeeId || "—"
}

export function listDisplayName(employee: any) {
  return (
    employee?.display_name ||
    employee?.full_name ||
    `${employee?.first_name ?? ""} ${employee?.last_name ?? ""}`.trim() ||
    listEmployeeCode(employee)
  )
}
