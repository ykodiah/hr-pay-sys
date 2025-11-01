import { SupabaseClient } from "@supabase/supabase-js"
import { decryptCredentials, encryptCredentials, hasStoredCredentials } from "./credentials"

export type IntegrationChannelType = "email" | "sms" | "whatsapp" | "push" | "teams" | "slack" | "webhook"

export interface IntegrationUpsertRequest {
  id?: string
  channelType: IntegrationChannelType
  providerName: string
  providerIdentifier?: string
  displayLabel?: string
  configuration?: Record<string, unknown>
  credentials?: Record<string, string>
  status?: "pending" | "active" | "error" | "disabled"
  isActive?: boolean
}

export interface IntegrationSummary {
  id: string
  channel_type: IntegrationChannelType
  provider_name: string
  provider_identifier: string | null
  display_label: string | null
  configuration: Record<string, unknown>
  has_credentials: boolean
  is_active: boolean
  status: "pending" | "active" | "error" | "disabled"
  last_validated_at: string | null
  validation_error: string | null
  created_at: string
  updated_at: string
}

export async function getCurrentCompanyId(supabase: SupabaseClient<any, "public", any>) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error("Unauthorized: no active session")

  const { data, error } = await supabase
    .from("employees")
    .select("company_id")
    .eq("id", user.id)
    .limit(1)
    .single()

  if (error) throw error
  if (!data?.company_id) {
    throw new Error("Failed to resolve company context for current user")
  }

  return { companyId: data.company_id as string, userId: user.id }
}

export function serializeCredentials(credentials?: Record<string, string>) {
  if (!credentials) {
    return null
  }

  const sanitized = Object.fromEntries(
    Object.entries(credentials).filter(([, value]) => value !== undefined && value !== "")
  )

  if (Object.keys(sanitized).length === 0) {
    return null
  }

  return encryptCredentials(sanitized)
}

export function mapIntegrationRow(row: any): IntegrationSummary {
  return {
    id: row.id,
    channel_type: row.channel_type,
    provider_name: row.provider_name,
    provider_identifier: row.provider_identifier ?? null,
    display_label: row.display_label ?? null,
    configuration: row.configuration ?? {},
    has_credentials: Boolean(row.has_credentials ?? hasStoredCredentials(row.encrypted_credentials)),
    is_active: row.is_active,
    status: row.status,
    last_validated_at: row.last_validated_at ?? null,
    validation_error: row.validation_error ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function redactStoredCredentials(payload: string | null) {
  if (!payload) return {}
  return decryptCredentials(payload)
}
