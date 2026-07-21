import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { ALWAYS_ON_MODULE_CODES, ADMIN_PORTAL_MODULES } from "@/lib/modules/admin-portal-modules"

/**
 * GET enabled modules for the current tenant (admin portal nav filtering).
 */
export async function GET(_req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let db: any
    try {
      db = createServiceClient()
    } catch {
      db = await createClient()
    }

    const resolved = await resolveCompanyId(
      db,
      user.isDemo ? null : user.id,
      user.isDemo ? null : user,
    )
    const companyId = resolved?.companyId
    if (!companyId) {
      // Fail open for nav: show always-on + full catalog codes so Settings remains reachable
      return NextResponse.json({
        company_id: null,
        enabled_codes: ADMIN_PORTAL_MODULES.map((m) => m.code),
        modules: ADMIN_PORTAL_MODULES,
      })
    }

    // Find superadmin tenant linked to this company
    const { data: tenant } = await db
      .from("superadmin_tenants")
      .select("id, status")
      .eq("company_id", companyId)
      .maybeSingle()

    if (!tenant?.id || tenant.status === "inactive") {
      // No portal tenant link — allow full module set for the company admin
      return NextResponse.json({
        company_id: companyId,
        enabled_codes: ADMIN_PORTAL_MODULES.map((m) => m.code),
        modules: ADMIN_PORTAL_MODULES,
      })
    }

    const { data: rows } = await db
      .from("superadmin_tenant_modules")
      .select("status, superadmin_modules(code, name, href, section, is_active)")
      .eq("tenant_id", tenant.id)
      .eq("status", "enabled")

    const enabled = new Set<string>(ALWAYS_ON_MODULE_CODES)
    for (const row of rows || []) {
      const mod = Array.isArray(row.superadmin_modules)
        ? row.superadmin_modules[0]
        : row.superadmin_modules
      if (mod?.code && mod.is_active !== false) enabled.add(mod.code)
    }

    // If catalog has no codes yet (pre-migration), keep full nav
    if (enabled.size <= ALWAYS_ON_MODULE_CODES.size && !(rows || []).length) {
      ADMIN_PORTAL_MODULES.forEach((m) => enabled.add(m.code))
    }

    return NextResponse.json({
      company_id: companyId,
      tenant_id: tenant.id,
      enabled_codes: Array.from(enabled),
      modules: ADMIN_PORTAL_MODULES.filter((m) => enabled.has(m.code)),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
