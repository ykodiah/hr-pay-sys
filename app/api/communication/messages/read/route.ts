import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/communication/integrations"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { userId } = await getCurrentCompanyId(supabase)
    const { messageIds, channelId } = await request.json()

    const ids: string[] = Array.isArray(messageIds) ? messageIds : messageIds ? [messageIds] : []
    if (!channelId || ids.length === 0) {
      return NextResponse.json({ error: "channelId and messageIds are required" }, { status: 400 })
    }

    const nowIso = new Date().toISOString()

    const payload = ids.map((id: string) => ({ message_id: id, user_id: userId, read_at: nowIso }))

    const { error: insertError } = await supabase.from("communication_message_read_receipts").upsert(payload, {
      onConflict: "message_id,user_id",
    })

    if (insertError) throw insertError

    await supabase
      .from("channel_members")
      .update({ last_read_message_id: ids[0], last_read_at: nowIso })
      .eq("channel_id", channelId)
      .eq("user_id", userId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[messages/read][POST] error", error)
    return NextResponse.json({ error: error.message || "Failed to mark as read" }, { status: 500 })
  }
}
