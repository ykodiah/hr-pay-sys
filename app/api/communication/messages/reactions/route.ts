import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { message_id, emoji } = await request.json()
    if (!message_id || !emoji) return NextResponse.json({ error: "message_id and emoji are required" }, { status: 400 })

    // Try RPC function if exists
    const { error: rpcError } = await supabase.rpc('add_message_reaction', {
      p_message_id: message_id,
      p_emoji: emoji,
    })

    if (rpcError) {
      // Fallback to table insert
      const { error: insertError } = await supabase.from('message_reactions').insert({
        message_id,
        emoji,
      })
      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[messages/reactions][POST] error', error)
    return NextResponse.json({ error: error.message || 'Failed to add reaction' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const message_id = searchParams.get('message_id')
    const emoji = searchParams.get('emoji')
    if (!message_id || !emoji) return NextResponse.json({ error: "message_id and emoji are required" }, { status: 400 })

    const { error } = await supabase.from('message_reactions').delete().match({ message_id, emoji })
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[messages/reactions][DELETE] error', error)
    return NextResponse.json({ error: error.message || 'Failed to remove reaction' }, { status: 500 })
  }
}
