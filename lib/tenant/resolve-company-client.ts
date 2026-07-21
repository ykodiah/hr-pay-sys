/**
 * Client-side helper to resolve the authenticated user's company_id.
 * Never uses companies.limit(1) — that leaks/cross-picks tenants.
 */

export async function resolveClientCompanyId(): Promise<string> {
  const metaRes = await fetch("/api/employees/meta", {
    cache: "no-store",
    credentials: "include",
  })
  const meta = await metaRes.json().catch(() => ({}))
  if (metaRes.ok && meta.company_id) return String(meta.company_id)

  const companyRes = await fetch("/api/settings/company", {
    cache: "no-store",
    credentials: "include",
  })
  const companyJson = await companyRes.json().catch(() => ({}))
  if (companyRes.ok && companyJson.company?.id) return String(companyJson.company.id)

  throw new Error(
    meta.error ||
      companyJson.error ||
      "Unable to resolve company for this user. Open Company settings and save your company first.",
  )
}
