import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

function dbClient() {
  try {
    return createServiceClient()
  } catch {
    return createClient()
  }
}

/**
 * GET persisted expand/collapse state for the collapsible nav tree.
 */
export async function GET(_req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db: any = await dbClient()
    const resolved = await resolveCompanyId(
      db,
      user.isDemo ? null : user.id,
      user.isDemo ? null : user,
    )
    const companyId = resolved?.companyId || null
    const userId = user.isDemo ? null : user.id

    if (!userId) {
      return NextResponse.json({ expanded_codes: [], company_id: companyId })
    }

    let query = db
      .from("app_nav_user_state")
      .select("expanded_codes, collapsed_sidebar")
      .eq("user_id", userId)

    if (companyId) query = query.eq("company_id", companyId)
    else query = query.is("company_id", null)

    const { data, error } = await query.maybeSingle()
    if (error) {
      // Table may not exist yet (pre-083) — fail soft
      return NextResponse.json({ expanded_codes: [], company_id: companyId })
    }

    return NextResponse.json({
      company_id: companyId,
      expanded_codes: Array.isArray(data?.expanded_codes) ? data.expanded_codes : [],
      collapsed_sidebar: Boolean(data?.collapsed_sidebar),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * PUT / upsert expand/collapse state for the current user.
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (user.isDemo) {
      return NextResponse.json({ ok: true, demo: true })
    }

    const body = await req.json().catch(() => ({}))
    const expanded = Array.isArray(body?.expanded_codes)
      ? body.expanded_codes.filter((c: unknown) => typeof c === "string").slice(0, 500)
      : []
    const collapsedSidebar =
      typeof body?.collapsed_sidebar === "boolean" ? body.collapsed_sidebar : undefined

    const db: any = await dbClient()
    const resolved = await resolveCompanyId(db, user.id, user)
    const companyId = resolved?.companyId || null

    const row: Record<string, unknown> = {
      company_id: companyId,
      user_id: user.id,
      expanded_codes: expanded,
      updated_at: new Date().toISOString(),
    }
    if (collapsedSidebar !== undefined) row.collapsed_sidebar = collapsedSidebar

    const { error } = await db.from("app_nav_user_state").upsert(row, {
      onConflict: "company_id,user_id",
    })

    if (error) {
      // Soft-fail when schema not applied yet
      return NextResponse.json({ ok: false, skipped: true, error: error.message })
    }

    return NextResponse.json({ ok: true, expanded_codes: expanded })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
