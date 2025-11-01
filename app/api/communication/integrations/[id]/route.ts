import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getCurrentCompanyId,
  mapIntegrationRow,
  serializeCredentials,
} from "@/lib/communication/integrations"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("communication_integration_summaries")
      .select("*")
      .eq("id", params.id)
      .limit(1)
      .single()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 })
    }

    return NextResponse.json({ data: mapIntegrationRow(data) })
  } catch (error: any) {
    console.error(`[communication/integrations/${params.id}][GET]`, error)
    return NextResponse.json({ error: error.message || "Failed to load integration" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const updatePayload: Record<string, unknown> = {
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }

    if (channelType) updatePayload.channel_type = channelType
    if (providerName) updatePayload.provider_name = providerName
    if (providerIdentifier !== undefined) updatePayload.provider_identifier = providerIdentifier || null
    if (displayLabel !== undefined) updatePayload.display_label = displayLabel || null
    if (configuration && typeof configuration === "object") updatePayload.configuration = configuration
    if (status) updatePayload.status = status
    if (typeof isActive === "boolean") updatePayload.is_active = isActive

    const encryptedCredentials = serializeCredentials(credentials)
    if (encryptedCredentials) {
      updatePayload.encrypted_credentials = encryptedCredentials
      if (typeof isActive === "boolean") {
        updatePayload.is_active = isActive
      } else if (updatePayload.is_active === undefined) {
        updatePayload.is_active = true
      }
      if (!status) {
        updatePayload.status = "active"
      }
    } else if (credentials) {
      // credentials object provided but empty -> treat as reset
      updatePayload.encrypted_credentials = null
      updatePayload.is_active = false
      updatePayload.status = "pending"
    }

    const { data, error } = await supabase
      .from("communication_provider_integrations")
      .update(updatePayload)
      .match({ id: params.id, company_id: companyId })
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json({ data: mapIntegrationRow({ ...data, has_credentials: Boolean(data.encrypted_credentials) }) })
  } catch (error: any) {
    console.error(`[communication/integrations/${params.id}][PATCH]`, error)
    return NextResponse.json({ error: error.message || "Failed to update integration" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { companyId } = await getCurrentCompanyId(supabase)

    const { error } = await supabase
      .from("communication_provider_integrations")
      .delete()
      .match({ id: params.id, company_id: companyId })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(`[communication/integrations/${params.id}][DELETE]`, error)
    return NextResponse.json({ error: error.message || "Failed to delete integration" }, { status: 500 })
  }
}
