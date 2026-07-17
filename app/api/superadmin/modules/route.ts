import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdminToken } from "@/lib/superadmin/auth"
import { createClient } from "@supabase/supabase-js"
import { logAudit } from "@/lib/superadmin/audit"

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = getDb()
    const { data: modules, error } = await client
      .from("superadmin_modules")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) throw error
    return NextResponse.json({ modules })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth?.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { name, slug, description, monthly_cost = 0, is_active = true } = body

    if (!name || !slug) return NextResponse.json({ error: "Name and slug required" }, { status: 400 })

    const client = getDb()
    const { data: module, error } = await client
      .from("superadmin_modules")
      .insert({ name, slug, description, monthly_cost, is_active })
      .select("*")
      .single()

    if (error) throw error

    await logAudit({
      userId: auth.userId,
      action: "module_created",
      resourceType: "module",
      resourceId: module.id,
      changes: { name, slug, monthly_cost, is_active },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ module }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
