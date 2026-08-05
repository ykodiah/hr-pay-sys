/** Shared dropdown options for employee forms (Add / Update). */

export const GENDER_OPTIONS = ["Male", "Female"] as const

export const MARITAL_STATUS_OPTIONS = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
  "Separated",
] as const

export const EDUCATION_OPTIONS = [
  "Certificate",
  "Diploma",
  "Degree",
  "Masters",
  "Professional",
  "Others",
] as const

export const SPECIAL_ROLE_OPTIONS = [
  "Admin",
  "HR",
  "Manager",
  "Employee",
  "Payroll",
  "Finance",
] as const

export const CONTRACT_TYPE_OPTIONS = [
  "Permanent",
  "Contract",
  "Intern",
  "Consultant",
] as const

export const EMPLOYEE_STATUS_OPTIONS = [
  "Active",
  "Probation",
  "Inactive",
  "Suspended",
  "Terminated",
] as const

export const PROBATION_PERIOD_OPTIONS = [
  { value: "0", label: "None" },
  { value: "1", label: "1 month" },
  { value: "2", label: "2 months" },
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "12", label: "12 months" },
] as const

export const NOTICE_PERIOD_OPTIONS = [
  { value: "0", label: "None" },
  { value: "2 weeks", label: "2 weeks" },
  { value: "1 month", label: "1 month" },
  { value: "2 months", label: "2 months" },
  { value: "3 months", label: "3 months" },
] as const

export const DOCUMENT_TYPE_OPTIONS = [
  "contract",
  "ghana_card",
  "cv",
  "appointment_letter",
  "academic_certificate",
  "ssnit_card",
  "bank_mandate",
  "photo",
  "other",
] as const
