import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const query = (searchParams.get("q") || "").trim()
    const companyId = searchParams.get("company_id") || undefined

    if (!query || query.length < 2) {
      return NextResponse.json({ data: [] })
    }

    let db = supabase
      .from("employees")
      .select("id, full_name, first_name, last_name, corporate_email, position, department, status")
      .or(`full_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,corporate_email.ilike.%${query}%`)
      .limit(20)

    if (companyId) {
      db = db.eq("company_id", companyId)
    }

    const { data, error } = await db
    if (error) throw error

    const mapped = (data || []).map((e: any) => ({
      id: e.id,
      name: e.full_name || `${e.first_name || ""} ${e.last_name || ""}`.trim(),
      role: e.position || "",
      department: e.department || "",
      status: e.status === "active" ? "online" : "offline",
      lastSeen: null,
    }))

    return NextResponse.json({ data: mapped })
  } catch (error: any) {
    console.error("[users][GET] error", error)
    return NextResponse.json({ error: error.message || "Failed to search users" }, { status: 500 })
  }
}
