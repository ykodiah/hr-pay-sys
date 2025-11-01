import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/communication/integrations"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { userId } = await getCurrentCompanyId(supabase)
    const { messageId, emoji } = await request.json()

    if (!messageId || !emoji) {
      return NextResponse.json({ error: "messageId and emoji are required" }, { status: 400 })
    }

    const { error } = await supabase.from("communication_message_reactions").upsert(
      {
        message_id: messageId,
        emoji,
        user_id: userId,
      },
      { onConflict: "message_id,user_id,emoji" }
    )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[messages/reactions][POST] error", error)
    return NextResponse.json({ error: error.message || "Failed to add reaction" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { userId } = await getCurrentCompanyId(supabase)
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get("messageId")
    const emoji = searchParams.get("emoji")

    if (!messageId || !emoji) {
      return NextResponse.json({ error: "messageId and emoji are required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("communication_message_reactions")
      .delete()
      .match({ message_id: messageId, user_id: userId, emoji })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[messages/reactions][DELETE] error", error)
    return NextResponse.json({ error: error.message || "Failed to remove reaction" }, { status: 500 })
  }
}
