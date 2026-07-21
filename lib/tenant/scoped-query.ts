/**
 * Helpers to enforce company_id scoping on API list queries.
 */

export function requireCompanyId(companyId: string | null | undefined): asserts companyId is string {
  if (!companyId || String(companyId).startsWith("demo-")) {
    throw new Error(
      "Unable to resolve company for this user. Open Company settings and save your company first.",
    )
  }
}

/** Apply .eq("company_id") — throws if companyId missing (fail closed). */
export function scopeByCompany<T extends { eq: (col: string, val: string) => T }>(
  query: T,
  companyId: string | null | undefined,
): T {
  requireCompanyId(companyId)
  return query.eq("company_id", companyId)
}
