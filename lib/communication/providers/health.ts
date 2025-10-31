export interface HealthCheckResult {
  ok: boolean
  message: string
  details?: Record<string, unknown>
}

function success(message: string, details?: Record<string, unknown>): HealthCheckResult {
  return { ok: true, message, details }
}

function failure(message: string, details?: Record<string, unknown>): HealthCheckResult {
  return { ok: false, message, details }
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function evaluateEmailHealth(configuration: Record<string, any>, credentials: Record<string, string>): HealthCheckResult {
  const fromEmail = configuration.fromEmail as string | undefined
  if (!fromEmail || !emailPattern.test(fromEmail)) {
    return failure("Email configuration must include a valid fromEmail address")
  }

  const apiKey = credentials.apiKey
  if (!apiKey || apiKey.length < 20) {
    return failure("Email provider API key appears invalid or missing")
  }

  return success("Email channel ready: API key and sender address look valid", {
    fromEmail,
    provider: configuration.provider ?? "generic",
  })
}

export function evaluateSmsHealth(configuration: Record<string, any>, credentials: Record<string, string>): HealthCheckResult {
  const accountSid = credentials.accountSid
  const authToken = credentials.authToken

  if (!accountSid || !/^AC[0-9a-fA-F]{32}$/.test(accountSid)) {
    return failure("SMS account SID is missing or malformed")
  }

  if (!authToken || authToken.length < 16) {
    return failure("SMS auth token looks too short")
  }

  return success("SMS channel ready: credentials shaped correctly", {
    senderId: configuration.senderId ?? null,
  })
}

export function evaluateWhatsappHealth(configuration: Record<string, any>, credentials: Record<string, string>): HealthCheckResult {
  if (!configuration.phoneNumber) {
    return failure("WhatsApp Business registration requires a phoneNumber")
  }

  if (!credentials.businessAccountId) {
    return failure("WhatsApp Business Account ID missing")
  }

  if (!credentials.accessToken || credentials.accessToken.length < 24) {
    return failure("WhatsApp access token appears invalid")
  }

  return success("WhatsApp channel ready: account and token present", {
    phoneNumber: configuration.phoneNumber,
  })
}

export function evaluatePushHealth(configuration: Record<string, any>, credentials: Record<string, string>): HealthCheckResult {
  const raw = credentials.serviceAccount
  if (!raw) {
    return failure("Push notifications require a service account JSON")
  }

  try {
    const parsed = JSON.parse(raw)
    if (!parsed.project_id || !parsed.client_email) {
      return failure("Service account JSON missing project_id or client_email")
    }
    return success("FCM service account parsed correctly", {
      projectId: parsed.project_id,
    })
  } catch (error: any) {
    return failure("Service account JSON could not be parsed", { error: error.message })
  }
}

export function evaluateTeamsHealth(configuration: Record<string, any>, credentials: Record<string, string>): HealthCheckResult {
  const required = ["clientId", "clientSecret", "tenantId"] as const
  for (const key of required) {
    if (!credentials[key]) {
      return failure(`Microsoft Teams credential ${key} missing`)
    }
  }

  return success("Teams channel ready: OAuth credentials provided", {
    webhook: configuration.defaultChannelWebhook ?? null,
  })
}

export function evaluateSlackHealth(configuration: Record<string, any>, credentials: Record<string, string>): HealthCheckResult {
  if (!credentials.botToken || !credentials.botToken.startsWith("xoxb-")) {
    return failure("Slack bot token must start with xoxb-")
  }

  if (!credentials.signingSecret || credentials.signingSecret.length < 16) {
    return failure("Slack signing secret too short")
  }

  return success("Slack channel ready: token and signing secret look valid", {
    defaultChannel: configuration.defaultChannel ?? null,
  })
}

export function evaluateWebhookHealth(configuration: Record<string, any>, credentials: Record<string, string>): HealthCheckResult {
  const endpoint = configuration.endpoint as string | undefined
  if (!endpoint) {
    return failure("Webhook endpoint URL missing")
  }

  try {
    const url = new URL(endpoint)
    if (!url.protocol.startsWith("http")) {
      return failure("Webhook endpoint must be HTTP/HTTPS")
    }
  } catch (error: any) {
    return failure("Webhook endpoint URL invalid", { error: error.message })
  }

  if (!credentials.secret || credentials.secret.length < 12) {
    return failure("Webhook signing secret too short")
  }

  return success("Webhook channel ready: endpoint and secret look good", {
    endpoint,
    method: configuration.httpMethod ?? "POST",
  })
}

export const HealthEvaluators: Record<string, (configuration: Record<string, any>, credentials: Record<string, string>) => HealthCheckResult> = {
  email: evaluateEmailHealth,
  sms: evaluateSmsHealth,
  whatsapp: evaluateWhatsappHealth,
  push: evaluatePushHealth,
  teams: evaluateTeamsHealth,
  slack: evaluateSlackHealth,
  webhook: evaluateWebhookHealth,
}

