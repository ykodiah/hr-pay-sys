/** Canonical employee status helpers — DB historically uses "Active". */

export const ACTIVE_EMPLOYEE_STATUSES = ["Active", "active", "ACTIVE"] as const

export const EMPLOYEE_STATUS_VALUES = [
  "Active",
  "active",
  "ACTIVE",
  "Inactive",
  "inactive",
  "On Leave",
  "on_leave",
  "Suspended",
  "suspended",
] as const

export function isActiveEmployeeStatus(status: string | null | undefined): boolean {
  return ACTIVE_EMPLOYEE_STATUSES.includes((status ?? "") as (typeof ACTIVE_EMPLOYEE_STATUSES)[number])
}

export function normalizeEmployeeStatus(status: string | null | undefined): string {
  const s = (status ?? "").trim()
  if (!s) return "Active"
  const lower = s.toLowerCase().replace(/\s+/g, "_")
  if (lower === "active") return "Active"
  if (lower === "inactive") return "Inactive"
  if (lower === "on_leave" || lower === "onleave") return "On Leave"
  if (lower === "suspended") return "Suspended"
  return s
}
