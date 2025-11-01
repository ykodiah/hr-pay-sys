import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentCompanyId, mapIntegrationRow, serializeCredentials } from "@/lib/communication/integrations"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const channelType = searchParams.get("channel_type") || undefined
    const status = searchParams.get("status") || undefined

    let query = supabase.from("communication_integration_summaries").select("*").order("updated_at", { ascending: false })

    if (channelType) {
      query = query.eq("channel_type", channelType)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data: data?.map(mapIntegrationRow) ?? [] })
  } catch (error: any) {
    console.error("[communication/integrations][GET]", error)
    return NextResponse.json({ error: error.message || "Failed to load communication integrations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { companyId, userId } = await getCurrentCompanyId(supabase)

    const body = await request.json()
    const {
      channelType,
      providerName,
      providerIdentifier,
      displayLabel,
      configuration,
      credentials,
      status,
      isActive,
    } = body

    if (!channelType || !providerName) {
      return NextResponse.json({ error: "channelType and providerName are required" }, { status: 400 })
    }

    const sanitizedConfig = configuration && typeof configuration === "object" ? configuration : {}
    const encryptedCredentials = serializeCredentials(credentials)
    const hasCredentials = Boolean(encryptedCredentials)

    if (!hasCredentials && isActive) {
      return NextResponse.json({ error: "Credentials are required before activating an integration" }, { status: 400 })
    }

    const payload = {
      company_id: companyId,
      channel_type: channelType,
      provider_name: providerName,
      provider_identifier: providerIdentifier || null,
      display_label: displayLabel || null,
      configuration: sanitizedConfig,
      encrypted_credentials: encryptedCredentials,
      is_active: Boolean(isActive) && hasCredentials,
      status: status || (Boolean(isActive) && hasCredentials ? "active" : "pending"),
      created_by: userId,
      updated_by: userId,
    }

    const { data, error } = await supabase
      .from("communication_provider_integrations")
      .insert(payload)
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json({ data: mapIntegrationRow({ ...data, has_credentials: hasCredentials }) }, { status: 201 })
  } catch (error: any) {
    console.error("[communication/integrations][POST]", error)
    return NextResponse.json({ error: error.message || "Failed to create integration" }, { status: 500 })
  }
}
