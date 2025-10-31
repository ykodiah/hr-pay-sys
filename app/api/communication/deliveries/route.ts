import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/communication/integrations"
import { fetchActiveIntegration } from "@/lib/communication/delivery"
import { sendThroughProvider } from "@/lib/communication/providers/send"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  let integration: any = null
  try {
    const supabase = await createClient()
    const { companyId } = await getCurrentCompanyId(supabase)
    const body = await request.json()

    const channelType = body.channelType
    const recipients = Array.isArray(body.recipients) ? body.recipients : []
    if (!channelType) {
      return NextResponse.json({ error: "channelType is required" }, { status: 400 })
    }
    if (recipients.length === 0) {
      return NextResponse.json({ error: "recipients array required" }, { status: 400 })
    }

    integration = await fetchActiveIntegration(supabase, companyId, channelType)

    const result = await sendThroughProvider(integration, {
      to: recipients,
      subject: body.subject,
      text: body.text,
      html: body.html,
      metadata: body.metadata,
    })

    await supabase
      .from("communication_provider_integrations")
      .update({ status: "active", validation_error: null })
      .match({ id: integration.id, company_id: companyId })

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error("[communication/deliveries][POST]", error)
    try {
      if (integration) {
        const supabase = await createClient()
        const { companyId } = await getCurrentCompanyId(supabase)
        await supabase
          .from("communication_provider_integrations")
          .update({ status: "error", validation_error: error.message })
          .match({ id: integration.id, company_id: companyId })
      }
    } catch (persistError) {
      console.error("Failed to persist integration error state", persistError)
    }

    return NextResponse.json({ error: error.message || "Delivery failed" }, { status: 500 })
  }
}

