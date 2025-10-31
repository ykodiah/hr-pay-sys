import { SupabaseClient } from "@supabase/supabase-js"
import { fetchActiveIntegration } from "./delivery"
import { sendThroughProvider } from "./providers/send"
import type { IntegrationChannelType } from "./integrations"

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

function buildMessageBody(event: CommunicationEventPayload) {
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
  const body = buildMessageBody(event)

  const delivery = await sendThroughProvider(integration, {
    to: recipients,
    subject: body.subject,
    text: body.text,
    html: body.html,
    metadata: event.metadata || event.data,
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
  }
}

