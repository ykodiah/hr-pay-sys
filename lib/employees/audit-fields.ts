/**
 * Employee field audit helpers — sensitivity tiers, labels, diffing, reverse rules.
 */

export type FieldSensitivity = "soft" | "hard" | "org"

export const ORG_TRANSFER_FIELDS = [
  "subsidiary_id",
  "division",
  "department",
  "location",
] as const

export const ORG_TRANSFER_OPTIONAL_FIELDS = [
  "direct_supervisor",
  "head_of_department",
] as const

/** Fields allowed on Update Employee Data (never org transfer fields). */
export const EMPLOYEE_UPDATE_FIELDS = [
  "prefix",
  "first_name",
  "other_names",
  "last_name",
  "full_name",
  "display_name",
  "personal_email",
  "corporate_email",
  "phone",
  "position",
  "special_role",
  "contract_type",
  "date_of_joining",
  "date_of_exit",
  "date_of_birth",
  "gender",
  "marital_status",
  "address",
  "ghana_card_number",
  "direct_supervisor",
  "head_of_department",
  "emergency_contact_name",
  "emergency_contact_tel",
  "educational_level",
  "inactive_reason",
  "employee_id",
  "probation_period",
  "confirmation_date",
  "notice_period",
  "status",
  "profile_picture",
] as const

export const FINANCIAL_UPDATE_FIELDS = [
  "monthly_salary",
  "annual_salary",
  "bank_name",
  "bank_branch",
  "bank_account_number",
  "ssnit_number",
  "provident_fund_enrolled",
  "provident_fund_rate",
  "tier3_contribution",
] as const

const HARD_FIELDS = new Set([
  "monthly_salary",
  "annual_salary",
  "bank_name",
  "bank_branch",
  "bank_account_number",
  "ssnit_number",
  "status",
  "special_role",
  "employee_id",
  "date_of_joining",
  "date_of_exit",
  "ghana_card_number",
])

const ORG_FIELDS = new Set<string>([
  ...ORG_TRANSFER_FIELDS,
  ...ORG_TRANSFER_OPTIONAL_FIELDS,
])

const LABELS: Record<string, string> = {
  prefix: "Prefix",
  first_name: "First name",
  other_names: "Other names",
  last_name: "Last name",
  full_name: "Full name",
  display_name: "Display name",
  personal_email: "Personal email",
  corporate_email: "Corporate email",
  phone: "Phone",
  position: "Position",
  special_role: "Special role",
  contract_type: "Contract type",
  date_of_joining: "Date of joining",
  date_of_exit: "Date of exit",
  date_of_birth: "Date of birth",
  gender: "Gender",
  marital_status: "Marital status",
  address: "Address",
  ghana_card_number: "Ghana Card",
  direct_supervisor: "Direct supervisor",
  head_of_department: "Head of department",
  emergency_contact_name: "Emergency contact",
  emergency_contact_tel: "Emergency phone",
  educational_level: "Education",
  inactive_reason: "Inactive reason",
  employee_id: "Employee code",
  probation_period: "Probation period",
  confirmation_date: "Confirmation date",
  notice_period: "Notice period",
  status: "Status",
  profile_picture: "Profile picture",
  subsidiary_id: "Subsidiary",
  division: "Division",
  department: "Department",
  location: "Location",
  monthly_salary: "Monthly salary",
  annual_salary: "Annual salary",
  bank_name: "Bank name",
  bank_branch: "Bank branch",
  bank_account_number: "Bank account",
  ssnit_number: "SSNIT number",
  provident_fund_enrolled: "Provident fund enrolled",
  provident_fund_rate: "Provident fund rate",
  tier3_contribution: "Tier 3 flag",
}

export function fieldLabel(field: string) {
  return LABELS[field] || field.replace(/_/g, " ")
}

export function fieldSensitivity(field: string): FieldSensitivity {
  if (ORG_FIELDS.has(field)) return "org"
  if (HARD_FIELDS.has(field)) return "hard"
  return "soft"
}

export function normalizeComparable(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null
  if (typeof value === "boolean") return value ? "true" : "false"
  if (typeof value === "number") return String(value)
  return String(value).trim()
}

export type DiffRow = {
  entity: "employee" | "financial"
  field_name: string
  field_label: string
  old_value: string | null
  new_value: string | null
  sensitivity: FieldSensitivity
}

export function buildDiffs(
  before: Record<string, any>,
  after: Record<string, any>,
  fields: readonly string[],
  entity: "employee" | "financial" = "employee",
): DiffRow[] {
  const diffs: DiffRow[] = []
  for (const field of fields) {
    if (!(field in after) && after[field] === undefined) continue
    if (after[field] === undefined) continue
    const oldV = normalizeComparable(before?.[field])
    const newV = normalizeComparable(after[field])
    if (oldV === newV) continue
    diffs.push({
      entity,
      field_name: field,
      field_label: fieldLabel(field),
      old_value: oldV,
      new_value: newV,
      sensitivity: fieldSensitivity(field),
    })
  }
  return diffs
}

export function hasOrgFieldsInBody(body: Record<string, any>): string[] {
  return [...ORG_TRANSFER_FIELDS].filter((f) => body[f] !== undefined)
}

export function canReverseEvent(input: {
  actorRole?: string | null
  diffs: Array<{ sensitivity: string }>
}): { ok: boolean; reason?: string } {
  const role = String(input.actorRole || "").toLowerCase()
  const isAdmin = role === "admin" || role.includes("admin")
  const isHr = role === "hr" || role.includes("hr")
  const hasHard = input.diffs.some((d) => d.sensitivity === "hard" || d.sensitivity === "org")
  if (hasHard && !isAdmin) {
    return { ok: false, reason: "Only Admin can reverse hard or organisational changes." }
  }
  if (!isAdmin && !isHr) {
    return { ok: false, reason: "HR or Admin role required to reverse changes." }
  }
  return { ok: true }
}
