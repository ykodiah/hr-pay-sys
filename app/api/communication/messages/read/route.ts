import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { message_id, user_id } = await request.json()

    if (!message_id) return NextResponse.json({ error: "message_id is required" }, { status: 400 })

    // Prefer RPC if available
    const { error: rpcError } = await supabase.rpc('mark_message_as_read', {
      p_message_id: message_id,
      p_user_id: user_id || null,
    })

    if (rpcError) {
      // Fallback: insert directly into message_read_receipts
      const { error: insertError } = await supabase.from('message_read_receipts').insert({
        message_id,
        user_id: user_id || null,
      })
      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[messages/read][POST] error", error)
    return NextResponse.json({ error: error.message || "Failed to mark as read" }, { status: 500 })
  }
}
