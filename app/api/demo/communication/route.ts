import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

type CommunicationResource = "channels" | "messages"

function missingConfigResponse() {
  return NextResponse.json({ error: "Supabase service role key is not configured" }, { status: 500 })
}

function getServiceClient() {
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  })
}

async function resolveDemoCompany(client: ReturnType<typeof createClient>) {
  const { data: demoCompany } = await client
    .from("companies")
    .select("*")
    .eq("name", "Akwaaba HR Pay Demo")
    .maybeSingle()

  if (demoCompany) {
    return demoCompany
  }

  const { data } = await client.from("companies").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle()
  return data
}

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams
  const resource = (searchParams.get("resource") as CommunicationResource) || "channels"

  const client = getServiceClient()
  if (!client) return missingConfigResponse()

  try {
    const company = await resolveDemoCompany(client)

    if (!company) {
      return NextResponse.json({ data: [] })
    }

    switch (resource) {
      case "channels": {
        const { data, error } = await client
          .from("communication_channels")
          .select(
            `id, company_id, channel_name, channel_type, description, is_archived, created_at, updated_at, target_filter, metadata,
             channel_members:channel_members(user_id, role, is_starred, notifications_enabled, notification_level, muted_until, last_read_at)`
          )
          .eq("company_id", company.id)
          .eq("is_archived", false)
          .order("channel_name", { ascending: true })

        if (error) {
          return NextResponse.json({ error: error.message || "Failed to load channels" }, { status: 500 })
        }

        return NextResponse.json({ data: data ?? [] })
      }

      case "messages": {
        const channelId = searchParams.get("channelId")
        if (!channelId) {
          return NextResponse.json({ error: "channelId is required" }, { status: 400 })
        }

        const { data, error } = await client
          .from("communication_messages")
          .select(
            `id, company_id, channel_id, thread_id, sender_id, content, rich_content, attachments, metadata, priority, edited_at, deleted_at, sent_at,
             sender:employees!communication_messages_sender_id_fkey(id, display_name, full_name, profile_picture),
             read_receipts:communication_message_read_receipts(user_id, read_at),
             reactions:communication_message_reactions(user_id, emoji, reacted_at)`
          )
          .eq("company_id", company.id)
          .eq("channel_id", channelId)
          .order("sent_at", { ascending: false })
          .limit(200)

        if (error) {
          return NextResponse.json({ error: error.message || "Failed to load messages" }, { status: 500 })
        }

        return NextResponse.json({ data: data ?? [] })
      }

      default:
        return NextResponse.json({ error: "Unsupported resource" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("[demo/communication] Unhandled error", error)
    return NextResponse.json({ error: error.message || "Unexpected error" }, { status: 500 })
  }
}
