import { SupabaseClient } from "@supabase/supabase-js"
import { fetchActiveIntegration } from "./delivery"
import { sendThroughProvider } from "./providers/send"
import type { IntegrationChannelType } from "./integrations"
import { renderTemplate, TemplateRenderResult, TemplateVersionPayload } from "./templates"

export type CommunicationEventType =
  | "PAYROLL.COMPLETED"
  | "PAYROLL.VARIANCE_DETECTED"
  | "LEAVE.APPROVED"
  | "LEAVE.REJECTED"
  | "HR.DOC_EXPIRING"

interface CommunicationEventPayload {
  type: CommunicationEventType
  channelType?: IntegrationChannelType
  subject?: string
  message?: string
  html?: string
  metadata?: Record<string, unknown>
  employeeIds?: string[]
  recipients?: string[]
  data?: Record<string, unknown>
  templateKey?: string
  templateVariables?: Record<string, unknown>
  templateScopes?: Record<string, Record<string, unknown>>
  allowTemplateFallback?: boolean
}

type ResolvedAudience = {
  emails: string[]
  phones: string[]
}

async function resolveAudience(
  supabase: SupabaseClient<any, "public", any>,
  companyId: string,
  event: CommunicationEventPayload
): Promise<ResolvedAudience> {
  const uniqueEmails = new Set<string>()
  const uniquePhones = new Set<string>()

  if (Array.isArray(event.recipients)) {
    for (const recipient of event.recipients) {
      if (recipient.includes("@")) {
        uniqueEmails.add(recipient)
      } else {
        uniquePhones.add(recipient)
      }
    }
  }

  if (event.employeeIds && event.employeeIds.length > 0) {
    const { data, error } = await supabase
      .from("employees")
      .select("id, personal_email, corporate_email, phone")
      .in("id", event.employeeIds)
      .eq("company_id", companyId)

    if (error) {
      throw error
    }

    data?.forEach((employee) => {
      if (employee.corporate_email) uniqueEmails.add(employee.corporate_email)
      else if (employee.personal_email) uniqueEmails.add(employee.personal_email)
      if (employee.phone) uniquePhones.add(employee.phone)
    })
  }

  return {
    emails: Array.from(uniqueEmails),
    phones: Array.from(uniquePhones),
  }
}

type TemplateResolution = {
  key: string
  versionId: string
  result: TemplateRenderResult
}

function buildMessageBody(event: CommunicationEventPayload, template?: TemplateResolution) {
  if (template) {
    const subject = event.subject ?? template.result.subject ?? inferSubject(event)
    const text = event.message ?? template.result.text ?? inferMessage(event)
    const html = event.html ?? template.result.html ?? undefined
    return { subject, text, html }
  }

  const subject = event.subject || inferSubject(event)
  const text = event.message || inferMessage(event)
  const html = event.html || undefined

  return { subject, text, html }
}

function inferSubject(event: CommunicationEventPayload) {
  switch (event.type) {
    case "PAYROLL.COMPLETED":
      return "Your payslip is ready"
    case "PAYROLL.VARIANCE_DETECTED":
      return "Payroll variance detected"
    case "LEAVE.APPROVED":
      return "Leave request approved"
    case "LEAVE.REJECTED":
      return "Leave request update"
    case "HR.DOC_EXPIRING":
      return "Reminder: HR document expiring"
    default:
      return "HR/Payroll notification"
  }
}

function inferMessage(event: CommunicationEventPayload) {
  switch (event.type) {
    case "PAYROLL.COMPLETED":
      return "Your payslip is now available in the HR portal."
    case "PAYROLL.VARIANCE_DETECTED":
      return "We spotted a change in your payroll amount. Please review the explanation provided."
    case "LEAVE.APPROVED":
      return "Great news! Your leave request has been approved."
    case "LEAVE.REJECTED":
      return "Your leave request has been updated. Please log in for details."
    case "HR.DOC_EXPIRING":
      return "One of your mandatory documents is about to expire. Please update it as soon as possible."
    default:
      return "You have a new update in the HR portal."
  }
}

function inferChannelType(event: CommunicationEventPayload): IntegrationChannelType {
  if (event.channelType) return event.channelType
  switch (event.type) {
    case "PAYROLL.VARIANCE_DETECTED":
      return "email"
    case "HR.DOC_EXPIRING":
      return "sms"
    default:
      return "email"
  }
}

async function resolvePublishedTemplate(
  supabase: SupabaseClient<any, "public", any>,
  companyId: string,
  key: string,
  channelType: IntegrationChannelType
): Promise<{ summary: any; version: TemplateVersionPayload } | null> {
  let { data: summary, error: summaryError } = await supabase
    .from("communication_template_summaries")
    .select("id, template_key, channel_type, version_id, version_number, status")
    .match({ company_id: companyId, template_key: key, status: "published" })
    .eq("channel_type", channelType)
    .maybeSingle()

  if (summaryError) throw summaryError
  if (!summary?.version_id) {
    const fallbackQuery = await supabase
      .from("communication_template_summaries")
      .select("id, template_key, channel_type, version_id, version_number, status")
      .match({ company_id: companyId, template_key: key, status: "published" })
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fallbackQuery.error) throw fallbackQuery.error
    summary = fallbackQuery.data
    if (!summary?.version_id) {
      return null
    }
  }

  const { data: version, error: versionError } = await supabase
    .from("communication_template_versions")
    .select("*")
    .eq("id", summary.version_id)
    .maybeSingle()

  if (versionError) throw versionError
  if (!version) {
    return null
  }

  return { summary, version }
}

function buildTemplateScopes(event: CommunicationEventPayload) {
  const variables = {
    ...(event.templateVariables ?? {}),
    ...(event.data ?? {}),
    ...(event.metadata ?? {}),
  }

  const scopes: Record<string, Record<string, unknown>> = {
    event: event as unknown as Record<string, unknown>,
    data: event.data ?? {},
    metadata: event.metadata ?? {},
  }

  const customScopeOrder: string[] = []

  if (event.templateScopes) {
    for (const [scopeKey, scopeValue] of Object.entries(event.templateScopes)) {
      scopes[scopeKey] = scopeValue
      customScopeOrder.push(scopeKey)
    }
  }

  return {
    variables,
    scopes,
    fallbackScopeOrder: ["data", "metadata", ...customScopeOrder, "event"],
  }
}

export async function handleCommunicationEvent(
  supabase: SupabaseClient<any, "public", any>,
  companyId: string,
  event: CommunicationEventPayload
) {
  const channelType = inferChannelType(event)
  const { emails, phones } = await resolveAudience(supabase, companyId, event)

  const recipients = channelType === "sms" || channelType === "whatsapp" ? phones : emails

  if (!recipients || recipients.length === 0) {
    throw new Error("No recipients resolved for automation event")
  }

  const integration = await fetchActiveIntegration(supabase, companyId, channelType)
  let templateResolution: TemplateResolution | undefined

  const effectiveTemplateKey = event.templateKey ?? event.type

  if (effectiveTemplateKey) {
    const template = await resolvePublishedTemplate(supabase, companyId, effectiveTemplateKey, channelType)

    if (template) {
      const scopes = buildTemplateScopes(event)
      const render = renderTemplate(template.version as TemplateVersionPayload, scopes)

      const hasBlockingMissing = render.missingRequired.length > 0 && event.allowTemplateFallback !== true

      if (!hasBlockingMissing) {
        templateResolution = {
          key: effectiveTemplateKey,
          versionId: template.version.id as string,
          result: render,
        }
      }
    }
  }

  const body = buildMessageBody(event, templateResolution)

  const metadata = {
    ...(event.metadata ?? {}),
    ...(event.data ?? {}),
    template: templateResolution
      ? {
          key: templateResolution.key,
          versionId: templateResolution.versionId,
          missingRequired: templateResolution.result.missingRequired,
          missingOptional: templateResolution.result.missingOptional,
          referencedVariables: templateResolution.result.referencedVariables,
        }
      : undefined,
  }

  const delivery = await sendThroughProvider(integration, {
    to: recipients,
    subject: body.subject,
    text: body.text,
    html: body.html,
    metadata,
  })

  await supabase
    .from("communication_provider_integrations")
    .update({ status: "active", validation_error: null, last_validated_at: new Date().toISOString() })
    .match({ id: integration.id, company_id: companyId })

  return {
    success: true,
    deliveredTo: recipients.length,
    channelType,
    externalId: delivery.externalId,
    templateWarnings: templateResolution
      ? {
          missingRequired: templateResolution.result.missingRequired,
          missingOptional: templateResolution.result.missingOptional,
          unusedSuppliedKeys: templateResolution.result.unusedSuppliedKeys,
        }
      : undefined,
  }
}
