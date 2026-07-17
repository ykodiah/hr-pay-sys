import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdminToken } from "@/lib/superadmin/auth"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcrypt"
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
    if (!auth.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = getDb()
    const { data: users, error } = await client
      .from("superadmin_users")
      .select("id, email, first_name, last_name, role, status, last_login_at, created_at")
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ users })
  } catch (err: any) {
    console.error("[v0] Users GET error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { email, password, first_name, last_name, role = "admin" } = body

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = getDb()

    // Hash password
    const password_hash = await bcrypt.hash(password, 12)

    // Create user
    const { data: user, error } = await client
      .from("superadmin_users")
      .insert({
        email,
        password_hash,
        first_name,
        last_name,
        role,
        status: "active",
      })
      .select("id, email, first_name, last_name, role, status, created_at")
      .single()

    if (error) throw error

    // Log audit
    await logAudit({
      userId: auth.userId,
      action: "admin_user_created",
      resourceType: "admin_user",
      resourceId: user.id,
      changes: { email, first_name, last_name, role },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (err: any) {
    console.error("[v0] Users POST error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
