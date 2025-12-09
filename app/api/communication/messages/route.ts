import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/communication/integrations"

export const runtime = "nodejs"

const PAGE_SIZE_DEFAULT = 50
const PAGE_SIZE_MAX = 200

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { companyId, userId } = await getCurrentCompanyId(supabase)
    const searchParams = new URL(request.url).searchParams
    const channelId = searchParams.get("channelId")
    const threadId = searchParams.get("threadId")
    const cursor = searchParams.get("cursor")
    const pageSizeParam = Number(searchParams.get("limit"))
    const limit = Math.min(Math.max(pageSizeParam || PAGE_SIZE_DEFAULT, 1), PAGE_SIZE_MAX)

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 })
    }

    const { data: membership, error: membershipError } = await supabase
      .from("channel_members")
      .select("id")
      .eq("channel_id", channelId)
      .eq("user_id", userId)
      .maybeSingle()

    if (membershipError) throw membershipError
    if (!membership) {
      return NextResponse.json({ error: "Not a member of channel" }, { status: 403 })
    }

    let query = supabase
      .from("communication_messages")
      .select(
        `id, channel_id, thread_id, sender_id, content, rich_content, attachments, metadata, priority, edited_at, deleted_at, sent_at,
         sender:employees!communication_messages_sender_id_fkey(id, display_name, full_name, profile_picture),
         read_receipts:communication_message_read_receipts!communication_message_read_receipts_message_id_fkey(user_id, read_at),
         reactions:communication_message_reactions!communication_message_reactions_message_id_fkey(user_id, emoji, reacted_at)`
        , { count: "exact" }
      )
      .eq("company_id", companyId)
      .eq("channel_id", channelId)
      .order("sent_at", { ascending: false })
      .limit(limit)

    if (threadId) {
      query = query.eq("thread_id", threadId)
    } else {
      query = query.is("thread_id", null)
    }

    if (cursor) {
      query = query.lt("sent_at", cursor)
    }

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({ data: data ?? [], count, next: data?.length === limit ? data[data.length - 1]?.sent_at : null })
  } catch (error: any) {
    console.error("[communication/messages][GET]", error)
    return NextResponse.json({ error: error.message || "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { companyId, userId } = await getCurrentCompanyId(supabase)
    const body = await request.json()
    const { channelId, threadId, content, richContent, attachments, metadata } = body

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 })
    }

    if (!content && !richContent) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    const { data: membership, error: membershipError } = await supabase
      .from("channel_members")
      .select("id")
      .eq("channel_id", channelId)
      .eq("user_id", userId)
      .maybeSingle()

    if (membershipError) throw membershipError
    if (!membership) {
      return NextResponse.json({ error: "Not a member of channel" }, { status: 403 })
    }

    let threadIdToUse = threadId ?? null

    if (body.parentMessageId && !threadIdToUse) {
      const { data: existingThread } = await supabase
        .from("communication_message_threads")
        .select("id")
        .eq("root_message_id", body.parentMessageId)
        .maybeSingle()

      if (existingThread) {
        threadIdToUse = existingThread.id
      } else {
        const { data: newThread, error: threadError } = await supabase
          .from("communication_message_threads")
          .insert({
            channel_id: channelId,
            root_message_id: body.parentMessageId,
            created_by: userId,
          })
          .select("id")
          .single()

        if (threadError) throw threadError
        threadIdToUse = newThread.id
      }
    }

    const insertPayload = {
      company_id: companyId,
      channel_id: channelId,
      thread_id: threadIdToUse,
      sender_id: userId,
      content: content || null,
      rich_content: richContent || null,
      attachments: Array.isArray(attachments) ? attachments : [],
      metadata: metadata || {},
    }

    const { data: insertedRows, error: insertError } = await supabase
      .from("communication_messages")
      .insert(insertPayload)
      .select(
        `id, channel_id, thread_id, sender_id, content, rich_content, attachments, metadata, priority, edited_at, deleted_at, sent_at,
         sender:employees!communication_messages_sender_id_fkey(id, display_name, full_name, profile_picture),
         read_receipts:communication_message_read_receipts!communication_message_read_receipts_message_id_fkey(user_id, read_at),
         reactions:communication_message_reactions!communication_message_reactions_message_id_fkey(user_id, emoji, reacted_at)`
      )

    if (insertError) throw insertError

    const insertedMessage = insertedRows?.[0]

    if (!insertedMessage) {
      throw new Error("Failed to load inserted message")
    }

    // Mark sender as having read their own message and update member state
    const nowIso = new Date().toISOString()

    await Promise.all([
      supabase.from("communication_message_read_receipts").insert({
        message_id: insertedMessage.id,
        user_id: userId,
        read_at: nowIso,
      }),
      supabase
        .from("channel_members")
        .update({ last_read_message_id: insertedMessage.id, last_read_at: nowIso })
        .eq("channel_id", channelId)
        .eq("user_id", userId),
    ])

    insertedMessage.read_receipts = [...(insertedMessage.read_receipts ?? []), { user_id: userId, read_at: nowIso }]

    return NextResponse.json({ data: insertedMessage })
  } catch (error: any) {
    console.error("[communication/messages][POST]", error)
    return NextResponse.json({ error: error.message || "Failed to create message" }, { status: 500 })
  }
}
