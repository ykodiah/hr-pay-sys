import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/communication/integrations"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { userId } = await getCurrentCompanyId(supabase)
    const { searchParams } = new URL(request.url)
    const rootMessageId = searchParams.get("rootMessageId")
    if (!rootMessageId) {
      return NextResponse.json({ error: "rootMessageId is required" }, { status: 400 })
    }

    const { data: rootMessage, error: rootMessageError } = await supabase
      .from("communication_messages")
      .select("id, channel_id")
      .eq("id", rootMessageId)
      .maybeSingle()

    if (rootMessageError) throw rootMessageError
    if (!rootMessage) {
      return NextResponse.json({ error: "Root message not found" }, { status: 404 })
    }

    const { data: membership } = await supabase
      .from("channel_members")
      .select("id")
      .eq("channel_id", rootMessage.channel_id)
      .eq("user_id", userId)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: "Not a member of channel" }, { status: 403 })
    }

    let { data: thread, error: threadError } = await supabase
      .from("communication_message_threads")
      .select("*")
      .eq("root_message_id", rootMessageId)
      .maybeSingle()

    if (threadError) throw threadError

    if (!thread) {
      const insertResult = await supabase
        .from("communication_message_threads")
        .insert({
          channel_id: rootMessage.channel_id,
          root_message_id: rootMessageId,
          created_by: userId,
        })
        .select("*")
        .single()
      if (insertResult.error) throw insertResult.error
      thread = insertResult.data
    }

    return NextResponse.json({ data: thread })
  } catch (error: any) {
    console.error("[messages/threads][GET] error", error)
    return NextResponse.json({ error: error.message || "Failed to fetch thread" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { userId } = await getCurrentCompanyId(supabase)
    const { threadId, topic, metadata } = await request.json()
    if (!threadId) {
      return NextResponse.json({ error: "threadId is required" }, { status: 400 })
    }

    const { data: thread, error: threadError } = await supabase
      .from("communication_message_threads")
      .select("channel_id, created_by")
      .eq("id", threadId)
      .maybeSingle()

    if (threadError) throw threadError
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    const { data: membership } = await supabase
      .from("channel_members")
      .select("role")
      .eq("channel_id", thread.channel_id)
      .eq("user_id", userId)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: "Not a member of channel" }, { status: 403 })
    }

    const canUpdate = thread.created_by === userId || ["admin", "moderator"].includes(membership.role)
    if (!canUpdate) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const updatePayload: Record<string, unknown> = {}
    if (topic !== undefined) updatePayload.topic = topic
    if (metadata !== undefined) updatePayload.metadata = metadata

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ data: null })
    }

    const { data: updatedThread, error: updateError } = await supabase
      .from("communication_message_threads")
      .update(updatePayload)
      .eq("id", threadId)
      .select("*")
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ data: updatedThread })
  } catch (error: any) {
    console.error("[messages/threads][PATCH] error", error)
    return NextResponse.json({ error: error.message || "Failed to update thread" }, { status: 500 })
  }
}
