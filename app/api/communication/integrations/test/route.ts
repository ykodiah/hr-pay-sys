import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/communication/integrations"
import { decryptCredentials } from "@/lib/communication/credentials"
import { HealthEvaluators } from "@/lib/communication/providers/health"

type ChannelType = "email" | "sms" | "whatsapp" | "push" | "teams" | "slack" | "webhook"

const VALIDATION_RULES: Record<ChannelType, { config?: string[]; credentials?: string[] }> = {
  email: { config: ["fromEmail"], credentials: ["apiKey"] },
  sms: { credentials: ["accountSid", "authToken"] },
  whatsapp: { config: ["phoneNumber"], credentials: ["businessAccountId", "accessToken"] },
  push: { credentials: ["serviceAccount"] },
  teams: { credentials: ["clientId", "clientSecret", "tenantId"] },
  slack: { credentials: ["botToken", "signingSecret"] },
  webhook: { config: ["endpoint"], credentials: ["secret"] },
}

function normalizeObject(input: any) {
  if (!input || typeof input !== "object") return {}
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { companyId } = await getCurrentCompanyId(supabase)
    const body = await request.json()

    const channelType = body.channelType as ChannelType | undefined
    if (!channelType || !(channelType in VALIDATION_RULES)) {
      return NextResponse.json({ error: "Unsupported channel type" }, { status: 400 })
    }

    const providerName = (body.providerName as string | undefined)?.trim()
    if (!providerName) {
      return NextResponse.json({ error: "Provider name is required" }, { status: 400 })
    }

    const incomingConfig = normalizeObject(body.configuration)
    const incomingCredentials = normalizeObject(body.credentials)
    const rules = VALIDATION_RULES[channelType]

    let hasStoredCredentials = false
    let combinedConfig = { ...incomingConfig }
    let storedCredentials: Record<string, string> = {}

    if (body.integrationId) {
      const { data, error } = await supabase
        .from("communication_provider_integrations")
        .select("configuration, encrypted_credentials")
        .match({ id: body.integrationId, company_id: companyId })
        .single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      if (data) {
        combinedConfig = { ...(data.configuration ?? {}), ...incomingConfig }
        if (data.encrypted_credentials) {
          hasStoredCredentials = true
          storedCredentials = decryptCredentials(data.encrypted_credentials)
        }
      }
    }

    const missingConfig = (rules.config ?? []).filter((key) => !combinedConfig[key])
    if (missingConfig.length > 0) {
      if (body.integrationId) {
        await supabase
          .from("communication_provider_integrations")
          .update({ validation_error: `Missing configuration: ${missingConfig.join(", ")}` })
          .match({ id: body.integrationId, company_id: companyId })
      }
      return NextResponse.json(
        { error: `Missing required configuration: ${missingConfig.join(", ")}` },
        { status: 400 }
      )
    }

    const hasCredentialInput = Object.values(incomingCredentials).some((value) => Boolean(value))
    const missingCredentialKeys = !hasStoredCredentials && !hasCredentialInput
      ? (rules.credentials ?? []).filter((key) => !incomingCredentials[key])
      : []

    if (missingCredentialKeys.length > 0) {
      if (body.integrationId) {
        await supabase
          .from("communication_provider_integrations")
          .update({ validation_error: `Missing credentials: ${missingCredentialKeys.join(", ")}` })
          .match({ id: body.integrationId, company_id: companyId })
      }
      return NextResponse.json(
        { error: `Provide credential values for: ${missingCredentialKeys.join(", ")}` },
        { status: 400 }
      )
    }

    const evaluator = HealthEvaluators[channelType]
    const effectiveCredentials = (hasCredentialInput ? incomingCredentials : storedCredentials) as Record<string, string>

    let message = "Configuration looks healthy"

    if (evaluator) {
      const result = evaluator(combinedConfig, effectiveCredentials)
      if (!result.ok) {
        if (body.integrationId) {
          await supabase
            .from("communication_provider_integrations")
            .update({ validation_error: result.message })
            .match({ id: body.integrationId, company_id: companyId })
        }
        return NextResponse.json({ error: result.message }, { status: 400 })
      }
      message = result.message
    }

    if (body.integrationId) {
      await supabase
        .from("communication_provider_integrations")
        .update({ last_validated_at: new Date().toISOString(), validation_error: null })
        .match({ id: body.integrationId, company_id: companyId })
    }

    return NextResponse.json({ success: true, message })
  } catch (error: any) {
    console.error("[communication/integrations/test]", error)
    return NextResponse.json({ error: error.message || "Unable to validate integration" }, { status: 500 })
  }
}
