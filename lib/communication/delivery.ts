import { SupabaseClient } from "@supabase/supabase-js"
import { decryptCredentials } from "./credentials"
import { IntegrationChannelType } from "./integrations"
import { HealthCheckResult, HealthEvaluators } from "./providers/health"

export interface ChannelIntegration {
  id: string
  channelType: IntegrationChannelType
  providerName: string
  providerIdentifier?: string | null
  displayLabel?: string | null
  configuration: Record<string, any>
  credentials: Record<string, string>
  status: "pending" | "active" | "error" | "disabled"
  hasCredentials: boolean
}

export async function fetchActiveIntegration(
  supabase: SupabaseClient<any, "public", any>,
  companyId: string,
  channelType: IntegrationChannelType
) {
  const { data, error } = await supabase
    .from("communication_provider_integrations")
    .select("*")
    .match({ company_id: companyId, channel_type: channelType, is_active: true })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new Error(`No active ${channelType} provider configured for this company`)
  }

  const credentials = decryptCredentials(data.encrypted_credentials)

  return {
    id: data.id,
    channelType: data.channel_type as IntegrationChannelType,
    providerName: data.provider_name,
    providerIdentifier: data.provider_identifier,
    displayLabel: data.display_label,
    configuration: data.configuration ?? {},
    credentials,
    status: data.status,
    hasCredentials: Boolean(data.encrypted_credentials),
  } satisfies ChannelIntegration
}

export async function runIntegrationHealthCheck(integration: ChannelIntegration): Promise<HealthCheckResult> {
  const evaluator = HealthEvaluators[integration.channelType]

  if (!evaluator) {
    return { ok: true, message: "No health evaluator implemented for this channel" }
  }

  return evaluator(integration.configuration, integration.credentials)
}

