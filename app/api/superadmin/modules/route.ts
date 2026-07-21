import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdminToken } from "@/lib/superadmin/auth"
import { getSuperadminDb } from "@/lib/superadmin/db"
import { logAudit } from "@/lib/superadmin/audit"
import { syncAdminPortalModules } from "@/lib/superadmin/tenant-provision"
import { ADMIN_PORTAL_MODULES } from "@/lib/modules/admin-portal-modules"

export async function GET(req: NextRequest) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = getSuperadminDb()
    // Keep catalog aligned with admin portal navigation
    try {
      await syncAdminPortalModules(client)
    } catch (err) {
      console.warn("[v0] Module catalog sync skipped:", err)
    }

    const { data: modules, error } = await client
      .from("superadmin_modules")
      .select("*")
      .order("name", { ascending: true })

    if (error) throw error

    return NextResponse.json({
      modules: modules || [],
      catalog: ADMIN_PORTAL_MODULES,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (body.action === "sync_catalog") {
      const client = getSuperadminDb()
      await syncAdminPortalModules(client)
      const { data: modules } = await client.from("superadmin_modules").select("*").order("name")
      return NextResponse.json({ modules: modules || [], synced: true })
    }

    const { name, slug, code, description, monthly_cost = 0, is_active = true, href, section } = body
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })

    const client = getSuperadminDb()
    const { data: module, error } = await client
      .from("superadmin_modules")
      .insert({
        name,
        slug: slug || code || null,
        code: code || slug || null,
        description,
        monthly_cost,
        is_active,
        href: href || null,
        section: section || null,
      })
      .select("*")
      .single()

    if (error) throw error

    await logAudit({
      userId: auth.userId,
      action: "module_created",
      resourceType: "module",
      resourceId: module.id,
      changes: { name, code, monthly_cost, is_active },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ module }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
