/**
 * Decide whether an authenticated user should land in the admin (/app)
 * or employee (/self-service) portal.
 */
export function isTenantAdminRole(role: unknown): boolean {
  const r = String(role || "")
    .trim()
    .toLowerCase()
  return r === "owner" || r === "admin" || r === "administrator" || r === "hr" || r === "hr_manager"
}

export function isHrSpecialRole(specialRole: unknown): boolean {
  const r = String(specialRole || "")
    .trim()
    .toLowerCase()
  if (!r || r === "no role" || r === "no special role" || r === "employee") return false
  return (
    r.includes("admin") ||
    r === "hr" ||
    r.includes("hr_") ||
    r.includes("hr manager") ||
    r.includes("payroll") ||
    r.includes("finance")
  )
}

export function resolvePostLoginPath(opts: {
  userMetadata?: Record<string, unknown> | null
  appMetadata?: Record<string, unknown> | null
  employee?: {
    position?: string | null
    department?: string | null
    special_role?: string | null
  } | null
}): "/app" | "/self-service" {
  const metaRole =
    opts.userMetadata?.role ||
    opts.appMetadata?.role ||
    opts.appMetadata?.portal_role ||
    opts.userMetadata?.portal_role

  if (isTenantAdminRole(metaRole)) return "/app"

  const portal =
    opts.appMetadata?.portal ||
    opts.userMetadata?.portal ||
    opts.appMetadata?.default_portal ||
    opts.userMetadata?.default_portal
  if (String(portal || "").toLowerCase() === "admin") return "/app"
  if (String(portal || "").toLowerCase() === "employee") return "/self-service"

  if (opts.employee && isHrSpecialRole(opts.employee.special_role)) return "/app"

  if (
    opts.employee &&
    (opts.employee.position?.toLowerCase().includes("administrator") ||
      opts.employee.department?.toLowerCase().includes("administration"))
  ) {
    return "/app"
  }

  return "/self-service"
}
