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

/**
 * Typed columns that Postgres rejects when given an empty string.
 * HTML inputs post "" for cleared fields, so every write path must coerce.
 */
export const DATE_COLUMNS = new Set([
  "date_of_birth",
  "date_of_joining",
  "date_of_exit",
  "confirmation_date",
  "probation_start_date",
  "probation_end_date",
  "last_transfer_date",
  "loan_start_date",
  "loan_end_date",
  "effective_date",
  "end_date",
])

export const NUMERIC_COLUMNS = new Set([
  "probation_period",
  "probation_duration_months",
  "monthly_salary",
  "annual_salary",
  "tier3_contribution",
  "provident_fund_rate",
  "tier2_employee_contribution",
  "tier2_employer_contribution",
  "weekday_overtime_rate",
  "weekend_overtime_rate",
  "transport_allowance",
  "housing_allowance",
  "medical_allowance",
  "meal_allowance",
  "uniform_allowance",
  "communication_allowance",
  "other_allowances",
  "tax_deduction",
  "loan_deduction",
  "advance_deduction",
  "other_deductions",
  "loan_amount",
  "loan_balance",
  "loan_installment",
])

export const UUID_COLUMNS = new Set([
  "direct_supervisor",
  "head_of_department",
  "subsidiary_id",
  "last_transfer_id",
  "company_id",
  "user_id",
])

export const BOOLEAN_COLUMNS = new Set([
  "provident_fund_enrolled",
  "is_date_of_birth_mandatory",
])

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Coerce a single form value into something Postgres accepts for that column. */
export function coerceFieldValue(field: string, value: unknown): unknown {
  if (value === undefined) return undefined

  const isBlank =
    value === null ||
    value === "" ||
    (typeof value === "string" && value.trim() === "")

  if (DATE_COLUMNS.has(field)) {
    if (isBlank) return null
    const raw = String(value).trim()
    // Accept both ISO (yyyy-mm-dd) and full timestamps; reject anything unparseable.
    const iso = /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : null
    if (iso) return iso
    const parsed = new Date(raw)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
  }

  if (NUMERIC_COLUMNS.has(field)) {
    if (isBlank) return null
    const num = Number(String(value).replace(/,/g, "").trim())
    return Number.isFinite(num) ? num : null
  }

  if (UUID_COLUMNS.has(field)) {
    if (isBlank) return null
    const raw = String(value).trim()
    return UUID_PATTERN.test(raw) ? raw : null
  }

  if (BOOLEAN_COLUMNS.has(field)) {
    if (isBlank) return null
    if (typeof value === "boolean") return value
    const raw = String(value).trim().toLowerCase()
    return raw === "true" || raw === "yes" || raw === "1"
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed === "" ? null : trimmed
  }

  return value
}

/** Coerce every key of a patch object. Safe for employees + employee_financial. */
export function coercePatch<T extends Record<string, any>>(patch: T): T {
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(patch || {})) {
    const coerced = coerceFieldValue(key, value)
    if (coerced !== undefined) out[key] = coerced
  }
  return out as T
}

/** Normalise a date-ish input to `yyyy-mm-dd`, falling back to today. */
export function toEffectiveDate(value: unknown): string {
  const coerced = coerceFieldValue("effective_date", value)
  return typeof coerced === "string" ? coerced : new Date().toISOString().slice(0, 10)
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
