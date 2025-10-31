import { createHmac } from "crypto"
import { JWT } from "google-auth-library"
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

async function sendViaSlack(integration: ChannelIntegration, payload: OutboundMessagePayload): Promise<ProviderDeliveryResult> {
  const botToken = integration.credentials.botToken
  if (!botToken) {
    throw new Error("Slack bot token missing")
  }

  const channel = (payload.metadata?.channel as string | undefined) || integration.configuration.defaultChannel
  if (!channel) {
    throw new Error("Slack defaultChannel not configured and no channel provided in metadata")
  }

  const text = payload.text || payload.html || ""
  if (!text) {
    throw new Error("Slack message requires text content")
  }

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel,
      text,
      blocks: payload.metadata?.blocks,
      thread_ts: payload.metadata?.threadTs,
    }),
  })

  const json = await response.json()
  if (!response.ok || !json.ok) {
    throw new Error(`Slack delivery failed: ${json.error || response.statusText}`)
  }

  return {
    externalId: json.ts,
    providerResponse: json,
  }
}

async function sendViaTeams(integration: ChannelIntegration, payload: OutboundMessagePayload): Promise<ProviderDeliveryResult> {
  const webhook = integration.configuration.defaultChannelWebhook as string | undefined
  if (!webhook) {
    throw new Error("Teams defaultChannelWebhook not configured")
  }

  const text = payload.text || payload.html || ""
  if (!text) {
    throw new Error("Teams notification requires text content")
  }

  const body = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          type: "AdaptiveCard",
          version: "1.4",
          msteams: {
            width: "Full",
          },
          body: [
            payload.subject
              ? {
                  type: "TextBlock",
                  size: "Medium",
                  weight: "Bolder",
                  text: payload.subject,
                }
              : null,
            {
              type: "TextBlock",
              text,
              wrap: true,
            },
          ].filter(Boolean),
          actions: payload.metadata?.actions || [],
        },
      },
    ],
  }

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Teams webhook returned ${response.status}: ${message}`)
  }

  return {
    externalId: response.headers.get("request-id"),
  }
}

async function sendViaPush(integration: ChannelIntegration, payload: OutboundMessagePayload): Promise<ProviderDeliveryResult> {
  const rawServiceAccount = integration.credentials.serviceAccount
  if (!rawServiceAccount) {
    throw new Error("Push notifications require serviceAccount credential")
  }

  let serviceAccount: any
  try {
    serviceAccount = typeof rawServiceAccount === "string" ? JSON.parse(rawServiceAccount) : rawServiceAccount
  } catch (error: any) {
    throw new Error(`Invalid service account JSON: ${error.message}`)
  }

  const projectId = serviceAccount.project_id
  const clientEmail = serviceAccount.client_email
  const privateKey = (serviceAccount.private_key as string | undefined)?.replace(/\\n/g, "\n")

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Service account JSON missing project_id, client_email, or private_key")
  }

  const tokens = payload.to
  if (!Array.isArray(tokens) || tokens.length === 0) {
    throw new Error("Push notifications require at least one device token")
  }

  const jwtClient = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  })

  const { access_token } = await jwtClient.authorize()
  if (!access_token) {
    throw new Error("Failed to authorize Firebase messaging request")
  }

  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`
  const metadata = payload.metadata || {}
  const metadataData = metadata && typeof metadata === "object" && metadata.data && typeof metadata.data === "object"
    ? (metadata.data as Record<string, unknown>)
    : {}
  let lastResponse: any = null

  for (const token of tokens) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title: payload.subject || metadata.title || "Notification",
            body: payload.text || payload.html || metadata.body || "",
          },
          data: Object.fromEntries(
            Object.entries(metadataData).map(([key, value]) => [key, String(value)])
          ),
        },
      }),
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(`FCM send failure (${response.status}): ${message}`)
    }

    lastResponse = await response.json()
  }

  return {
    externalId: lastResponse?.name,
    providerResponse: lastResponse,
  }
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
    case "push":
      return sendViaPush(integration, payload)
    case "teams":
      return sendViaTeams(integration, payload)
    case "slack":
      return sendViaSlack(integration, payload)
    case "webhook":
      return sendWebhook(integration, payload)
    default:
      throw new Error(`Channel ${integration.channelType} delivery not yet implemented`)
  }
}

