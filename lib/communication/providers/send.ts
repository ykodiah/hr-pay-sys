import { createHmac } from "crypto"
import type { ChannelIntegration } from "../delivery"

export interface OutboundMessagePayload {
  to: string[]
  subject?: string
  text?: string
  html?: string
  metadata?: Record<string, any>
}

export interface ProviderDeliveryResult {
  externalId?: string | null
  providerResponse?: any
}

async function sendViaSendGrid(integration: ChannelIntegration, payload: OutboundMessagePayload): Promise<ProviderDeliveryResult> {
  const apiKey = integration.credentials.apiKey
  const fromEmail = integration.configuration.fromEmail
  if (!apiKey) throw new Error("SendGrid API key missing")
  if (!fromEmail) throw new Error("SendGrid requires a fromEmail configuration value")

  const body = {
    personalizations: payload.to.map((recipient) => ({ to: [{ email: recipient }] })),
    from: {
      email: fromEmail,
      name: integration.configuration.fromName || integration.displayLabel || undefined,
    },
    subject: payload.subject ?? "",
    content: [
      payload.html ? { type: "text/html", value: payload.html } : null,
      payload.text ? { type: "text/plain", value: payload.text } : null,
    ].filter(Boolean),
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`SendGrid rejected message (${response.status}): ${text}`)
  }

  return {
    externalId: response.headers.get("x-message-id"),
  }
}

async function sendViaTwilio(integration: ChannelIntegration, payload: OutboundMessagePayload, whatsapp = false) {
  const accountSid = integration.credentials.accountSid
  const authToken = integration.credentials.authToken
  if (!accountSid || !authToken) {
    throw new Error("Twilio requires accountSid and authToken credentials")
  }

  const fromValue = whatsapp
    ? `whatsapp:${integration.configuration.phoneNumber ?? integration.configuration.senderId}`
    : integration.configuration.senderId || integration.configuration.phoneNumber

  if (!fromValue) {
    throw new Error("Twilio senderId or phoneNumber configuration missing")
  }

  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64")
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const results = [] as ProviderDeliveryResult[]

  for (const recipient of payload.to) {
    const form = new URLSearchParams()
    form.set("To", whatsapp ? `whatsapp:${recipient}` : recipient)
    form.set("From", fromValue)
    form.set("Body", payload.text ?? payload.html ?? "")

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Twilio send failure (${response.status}): ${text}`)
    }

    const json = await response.json()
    results.push({ externalId: json.sid, providerResponse: json })
  }

  return results.pop() ?? { externalId: undefined }
}

async function sendWebhook(integration: ChannelIntegration, payload: OutboundMessagePayload) {
  const endpoint = integration.configuration.endpoint
  if (!endpoint) throw new Error("Webhook endpoint missing")

  const secret = integration.credentials.secret
  const method = integration.configuration.httpMethod || "POST"

  const body = {
    integration: {
      id: integration.id,
      provider: integration.providerName,
      channel: integration.channelType,
    },
    message: payload,
    timestamp: new Date().toISOString(),
  }

  const serialized = JSON.stringify(body)
  const signature = secret
    ? createHmac("sha256", secret).update(serialized).digest("hex")
    : undefined

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (signature) {
    headers["X-Comm-Signature"] = signature
  }

  const response = await fetch(endpoint, {
    method,
    headers,
    body: serialized,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Webhook endpoint responded ${response.status}: ${text}`)
  }

  return {
    externalId: response.headers.get("x-request-id"),
  }
}

export async function sendThroughProvider(
  integration: ChannelIntegration,
  payload: OutboundMessagePayload
): Promise<ProviderDeliveryResult> {
  switch (integration.channelType) {
    case "email":
      return sendViaSendGrid(integration, payload)
    case "sms":
      return sendViaTwilio(integration, payload, false)
    case "whatsapp":
      return sendViaTwilio(integration, payload, true)
    case "webhook":
      return sendWebhook(integration, payload)
    default:
      throw new Error(`Channel ${integration.channelType} delivery not yet implemented`)
  }
}

