import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const message_id = searchParams.get('message_id')
    if (!message_id) return NextResponse.json({ error: 'message_id is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('message_threads')
      .select('*')
      .eq('parent_message_id', message_id)
      .order('created_at', { ascending: true })
    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[messages/threads][GET] error', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch thread' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { parent_message_id, content } = await request.json()
    if (!parent_message_id || !content) return NextResponse.json({ error: 'parent_message_id and content are required' }, { status: 400 })

    const { data, error } = await supabase
      .from('message_threads')
      .insert({ parent_message_id, content })
      .select('*')
      .single()
    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[messages/threads][POST] error', error)
    return NextResponse.json({ error: error.message || 'Failed to create reply' }, { status: 500 })
  }
}
