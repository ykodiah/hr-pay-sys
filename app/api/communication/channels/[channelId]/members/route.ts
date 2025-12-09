import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/communication/integrations"

export async function GET(_request: NextRequest, { params }: { params: { channelId: string } }) {
  try {
    const supabase = await createClient()
    const { channelId } = params
    const { userId } = await getCurrentCompanyId(supabase)

    const { data: membership } = await supabase
      .from("channel_members")
      .select("role")
      .eq("channel_id", channelId)
      .eq("user_id", userId)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: "Not a member of channel" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("channel_members")
      .select("user_id, role, joined_at, last_read_at, is_starred, notifications_enabled, notification_level")
      .eq("channel_id", channelId)
      .order("joined_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({ data: data ?? [] })
  } catch (error: any) {
    console.error("[channels/members][GET]", error)
    return NextResponse.json({ error: error.message || "Failed to load members" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { channelId: string } }) {
  try {
    const supabase = await createClient()
    const { channelId } = params
    const { userId } = await getCurrentCompanyId(supabase)
    const { memberId, role } = await request.json()

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 })
    }

    const { data: requester } = await supabase
      .from("channel_members")
      .select("role")
      .eq("channel_id", channelId)
      .eq("user_id", userId)
      .maybeSingle()

    if (!requester || !["admin", "moderator"].includes(requester.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const insertPayload = {
      channel_id: channelId,
      user_id: memberId,
      role: role && ["admin", "moderator", "member"].includes(role) ? role : "member",
    }

    const { error } = await supabase.from("channel_members").upsert(insertPayload, {
      onConflict: "channel_id,user_id",
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[channels/members][POST]", error)
    return NextResponse.json({ error: error.message || "Failed to add member" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { channelId: string } }) {
  try {
    const supabase = await createClient()
    const { channelId } = params
    const { userId } = await getCurrentCompanyId(supabase)
    const searchParams = new URL(request.url).searchParams
    const memberId = searchParams.get("memberId")

    if (!memberId) {
      return NextResponse.json({ error: "memberId query param is required" }, { status: 400 })
    }

    const { data: requester } = await supabase
      .from("channel_members")
      .select("role")
      .eq("channel_id", channelId)
      .eq("user_id", userId)
      .maybeSingle()

    if (!requester || requester.role !== "admin") {
      return NextResponse.json({ error: "Only channel admins can remove members" }, { status: 403 })
    }

    const { error } = await supabase
      .from("channel_members")
      .delete()
      .match({ channel_id: channelId, user_id: memberId })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[channels/members][DELETE]", error)
    return NextResponse.json({ error: error.message || "Failed to remove member" }, { status: 500 })
  }
}
