import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/communication/integrations"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { companyId, userId } = await getCurrentCompanyId(supabase)
    const searchParams = new URL(request.url).searchParams
    const filterType = searchParams.get("type")
    const includeArchived = searchParams.get("includeArchived") === "true"

    let query = supabase
      .from("communication_channels")
      .select(
        "id, company_id, channel_name, channel_type, description, is_archived, created_at, updated_at, target_filter, metadata, channel_members!inner(user_id, role, is_starred, notifications_enabled, notification_level, muted_until, last_read_at)"
      )
      .eq("company_id", companyId)
      .eq("channel_members.user_id", userId)
      .order("channel_name", { ascending: true })

    if (filterType) {
      query = query.eq("channel_type", filterType)
    }

    if (!includeArchived) {
      query = query.eq("is_archived", false)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data: data ?? [] })
  } catch (error: any) {
    console.error("[channels][GET] error", error)
    return NextResponse.json({ error: error.message || "Failed to load channels" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { companyId, userId } = await getCurrentCompanyId(supabase)
    const body = await request.json()
    const { name, type, description, targetFilter, metadata } = body

    if (!name || !type) {
      return NextResponse.json({ error: "name and type are required" }, { status: 400 })
    }

    const insertPayload = {
      channel_name: name,
      channel_type: type,
      description: description || null,
      company_id: companyId,
      created_by: userId,
      target_filter: targetFilter || {},
      metadata: metadata || {},
    }

    const { data: channel, error } = await supabase
      .from("communication_channels")
      .insert(insertPayload)
      .select("*")
      .single()

    if (error) throw error

    // Ensure creator is admin member
    const { error: memberError } = await supabase.from("channel_members").upsert(
      {
        channel_id: channel.id,
        user_id: userId,
        role: "admin",
        joined_at: new Date().toISOString(),
      },
      { onConflict: "channel_id,user_id" }
    )

    if (memberError) throw memberError

    return NextResponse.json({ data: channel })
  } catch (error: any) {
    console.error("[channels][POST] error", error)
    return NextResponse.json({ error: error.message || "Failed to create channel" }, { status: 500 })
  }
}
