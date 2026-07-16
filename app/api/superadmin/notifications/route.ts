import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdminToken } from "@/lib/superadmin/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const { data: notifications, error } = await client
      .from("superadmin_notifications")
      .select("*")
      .eq("superadmin_user_id", auth.userId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) throw error

    const unread = notifications?.filter((n) => !n.read_at).length || 0

    return NextResponse.json({ notifications, unread })
  } catch (err: any) {
    console.error("[v0] Notifications GET error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifySuperAdminToken(req)
    if (!auth.valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { recipient_user_id, title, message, type = "info", metadata } = body

    const client = await createClient()
    const { data: notification, error } = await client
      .from("superadmin_notifications")
      .insert({
        superadmin_user_id: recipient_user_id,
        title,
        message,
        type,
        metadata: metadata || null,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single()

    if (error) throw error
    return NextResponse.json({ notification }, { status: 201 })
  } catch (err: any) {
    console.error("[v0] Notifications POST error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
