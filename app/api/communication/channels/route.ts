import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("company_id") || undefined

    let query = supabase.from("communication_channels").select("*").order("created_at", { ascending: false })
    if (companyId) {
      query = query.eq("company_id", companyId)
    }
    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("[channels][GET] error", error)
    return NextResponse.json({ error: error.message || "Failed to load channels" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { name, description, type, company_id, created_by } = body

    if (!name || !type) {
      return NextResponse.json({ error: "name and type are required" }, { status: 400 })
    }

    const payload: any = {
      name,
      description: description || null,
      type,
      company_id: company_id || null,
      created_by: created_by || null,
    }

    const { data, error } = await supabase.from("communication_channels").insert(payload).select("*").single()
    if (error) throw error
    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("[channels][POST] error", error)
    return NextResponse.json({ error: error.message || "Failed to create channel" }, { status: 500 })
  }
}
