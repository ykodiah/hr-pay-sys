import { httpRequest, isApiError } from "./http-client"

export type CommunicationChannel = {
  id: string
  name: string
  type: "public" | "private" | "direct"
  description: string
  unread: number
  members: number
  retentionPolicy: "standard" | "finance" | "legal"
  externalGuests?: boolean
  encryption: "in-transit" | "end-to-end"
}

export type CommunicationMessage = {
  id: string
  channelId: string
  author: string
  authorRole: string
  content: string
  sentAt: string
  priority: "normal" | "high" | "critical"
  requiresAck: boolean
  acknowledgedBy: string[]
  attachments?: { id: string; name: string; type: string }[]
  tags?: string[]
  incidentTicket?: string
}

let channelCache: CommunicationChannel[] = buildSeedChannels()
let messageCache: CommunicationMessage[] = buildSeedMessages()

export async function listChannels(): Promise<CommunicationChannel[]> {
  try {
    const payload = await httpRequest<{ data: CommunicationChannel[] }>("/communication/channels", { method: "GET" })
    if (Array.isArray(payload?.data)) {
      channelCache = payload.data
    }
    return structuredClone(channelCache)
  } catch (error) {
    if (!isApiError(error)) {
      console.warn("Channel API fallback", error)
    }
    return structuredClone(channelCache)
  }
}

export async function listMessages(channelId: string): Promise<CommunicationMessage[]> {
  try {
    const payload = await httpRequest<{ data: CommunicationMessage[] }>(`/communication/messages?channelId=${channelId}`, {
      method: "GET",
    })
    if (Array.isArray(payload?.data)) {
      messageCache = [...messageCache.filter((msg) => msg.channelId !== channelId), ...payload.data]
      return payload.data
    }
  } catch (error) {
    if (!isApiError(error)) {
      console.warn("Message API fallback", error)
    }
  }

  return structuredClone(messageCache.filter((message) => message.channelId === channelId))
}

export async function sendMessage(message: CommunicationMessage): Promise<CommunicationMessage> {
  try {
    const payload = await httpRequest<{ data: CommunicationMessage }>("/communication/messages", {
      method: "POST",
      body: JSON.stringify(message),
    })
    if (payload?.data) {
      messageCache = [...messageCache, payload.data]
      return payload.data
    }
  } catch (error) {
    if (!isApiError(error)) {
      console.warn("Message send fallback", error)
    }
  }

  messageCache = [...messageCache, message]
  return message
}

export async function acknowledgeMessage(messageId: string, actor: string) {
  try {
    await httpRequest(`/communication/messages/${messageId}/acknowledge`, {
      method: "POST",
      body: JSON.stringify({ actor }),
    })
  } catch (error) {
    if (!isApiError(error)) {
      console.warn("Message acknowledge fallback", error)
    }
  } finally {
    messageCache = messageCache.map((message) =>
      message.id === messageId && !message.acknowledgedBy.includes(actor)
        ? { ...message, acknowledgedBy: [...message.acknowledgedBy, actor] }
        : message,
    )
  }
}

export async function createChannel(channel: CommunicationChannel): Promise<CommunicationChannel> {
  try {
    const payload = await httpRequest<{ data: CommunicationChannel }>("/communication/channels", {
      method: "POST",
      body: JSON.stringify(channel),
    })
    if (payload?.data) {
      channelCache = [payload.data, ...channelCache.filter((entry) => entry.id !== payload.data.id)]
      return payload.data
    }
  } catch (error) {
    if (!isApiError(error)) {
      console.warn("Channel create fallback", error)
    }
  }

  channelCache = [channel, ...channelCache]
  return channel
}

function buildSeedChannels(): CommunicationChannel[] {
  return [
    {
      id: "channel-ops",
      name: "payroll-ops",
      type: "public",
      description: "Daily payroll operations, pay cycle approvals, exceptions",
      unread: 4,
      members: 18,
      retentionPolicy: "finance",
      encryption: "end-to-end",
    },
    {
      id: "channel-compliance",
      name: "compliance-alerts",
      type: "private",
      description: "Regulatory, tax and statutory incident communication",
      unread: 0,
      members: 9,
      retentionPolicy: "legal",
      encryption: "end-to-end",
      externalGuests: true,
    },
    {
      id: "channel-people",
      name: "people-experience",
      type: "public",
      description: "HR operations, onboarding and employee escalations",
      unread: 1,
      members: 23,
      retentionPolicy: "standard",
      encryption: "in-transit",
    },
    {
      id: "channel-direct",
      name: "@cfo",
      type: "direct",
      description: "Financial Controller",
      unread: 0,
      members: 2,
      retentionPolicy: "finance",
      encryption: "end-to-end",
    },
  ]
}

function buildSeedMessages(): CommunicationMessage[] {
  const now = Date.now()
  return [
    {
      id: "msg-1",
      channelId: "channel-ops",
      author: "Abena Owusu",
      authorRole: "Head of Payroll",
      content:
        "Reminder: submit final approvals for the March multi-company payroll bundle before 15:00. Please flag any variance above 5%.",
      sentAt: new Date(now - 1000 * 60 * 45).toISOString(),
      priority: "high",
      requiresAck: true,
      acknowledgedBy: ["Kofi Mensah", "Selorm Adjei"],
      attachments: [{ id: "att-1", name: "march-payroll-exceptions.xlsx", type: "Excel" }],
      tags: ["payroll", "deadline"],
    },
    {
      id: "msg-2",
      channelId: "channel-ops",
      author: "Kojo Tetteh",
      authorRole: "Payroll Analyst",
      content: "Variance alert triggered for Accra subsidiary. Overtime spend up 9%. Proposed to run anomaly triage at 16:00.",
      sentAt: new Date(now - 1000 * 60 * 20).toISOString(),
      priority: "normal",
      requiresAck: false,
      acknowledgedBy: ["Abena Owusu"],
      tags: ["analytics"],
    },
    {
      id: "msg-3",
      channelId: "channel-compliance",
      author: "Regina Appiah",
      authorRole: "Compliance Lead",
      content: "GRA compliance window closes Friday. Upload final PAYE withholding schedules tonight. Finance partners looped in.",
      sentAt: new Date(now - 1000 * 60 * 70).toISOString(),
      priority: "critical",
      requiresAck: true,
      acknowledgedBy: ["Ama Osei"],
      attachments: [{ id: "att-2", name: "withholding-template.csv", type: "CSV" }],
      incidentTicket: "INC-9042",
    },
    {
      id: "msg-4",
      channelId: "channel-direct",
      author: "Kwabena Agyeman",
      authorRole: "CFO",
      content: "Please draft talking points for tomorrow's board update on payroll harmonisation.",
      sentAt: new Date(now - 1000 * 60 * 5).toISOString(),
      priority: "normal",
      requiresAck: false,
      acknowledgedBy: [],
    },
  ]
}
