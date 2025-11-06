"use client"

import { useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"

import { AuthGuard } from "@/components/auth-guard"
import { RoleGuard } from "@/components/role-guard"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  acknowledgeMessage,
  createChannel as createChannelService,
  listChannels,
  listMessages,
  sendMessage as sendMessageService,
  type CommunicationChannel,
  type CommunicationMessage,
} from "@/lib/api/communication-service"

import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCircle,
  CheckSquare,
  FileText,
  FlagTriangleRight,
  Loader2,
  Laptop,
  Lock,
  MessageCircle,
  MessageSquare,
  PenSquare,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  Users,
  Zap,
} from "lucide-react"

type Priority = "normal" | "high" | "critical"

type Attachment = {
  id: string
  name: string
  type: string
}

export default function CommunicationHubPage() {
  const [channels, setChannels] = useState<CommunicationChannel[]>([])
  const [messages, setMessages] = useState<CommunicationMessage[]>([])
  const [channelsLoading, setChannelsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [activeChannelId, setActiveChannelId] = useState<string>("")
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [composer, setComposer] = useState({
    content: "",
    priority: "normal" as Priority,
    requestAck: false,
    attachments: [] as Attachment[],
    tag: "",
  })
  const [filters, setFilters] = useState({
    priority: "all" as "all" | Priority,
    requiresAck: false,
    search: "",
  })

  const pushToast = toast

  useEffect(() => {
    const bootstrap = async () => {
      const data = await listChannels()
      setChannels(data)
      if (data.length > 0) {
        setActiveChannelId(data[0].id)
      }
      setChannelsLoading(false)
    }

    bootstrap()
  }, [])

  useEffect(() => {
    if (!activeChannelId) {
      setMessages([])
      setSelectedMessageId(null)
      return
    }

    const load = async () => {
      setMessagesLoading(true)
      const data = await listMessages(activeChannelId)
      const sorted = [...data].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
      setMessages(sorted)
      setSelectedMessageId((prev) => prev ?? sorted.at(-1)?.id ?? null)
      setMessagesLoading(false)
    }

    load()
  }, [activeChannelId])

  const activeChannel = channels.find((channel) => channel.id === activeChannelId) ?? null

  const filteredMessages = useMemo(() => {
    return messages
      .filter((message) => message.channelId === activeChannelId)
      .filter((message) => (filters.priority === "all" ? true : message.priority === filters.priority))
      .filter((message) => (filters.requiresAck ? message.requiresAck : true))
      .filter((message) =>
        filters.search
          ? `${message.content} ${message.author} ${(message.tags || []).join(" ")}`
              .toLowerCase()
              .includes(filters.search.toLowerCase())
          : true,
      )
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
  }, [activeChannelId, filters.priority, filters.requiresAck, filters.search, messages])

  const selectedMessage = selectedMessageId
    ? messages.find((message) => message.id === selectedMessageId) ?? null
    : null

  const ackCompliance = useMemo(() => {
    const requiringAck = messages.filter((message) => message.requiresAck)
    if (requiringAck.length === 0) return 100
    const acknowledged = requiringAck.filter((message) => message.acknowledgedBy.length > 0)
    return Math.round((acknowledged.length / requiringAck.length) * 100)
  }, [messages])

  const handleSendMessage = async () => {
    if (!activeChannel || !composer.content.trim()) {
      pushToast({
        variant: "destructive",
        title: "Message empty",
        description: "Add context before dispatching a message.",
      })
      return
    }

    const messagePayload: CommunicationMessage = {
      id: `msg-${Date.now()}`,
      channelId: activeChannel.id,
      author: "You",
      authorRole: "HR Systems",
      content: composer.content.trim(),
      priority: composer.priority,
      requiresAck: composer.requestAck,
      acknowledgedBy: composer.requestAck ? [] : ["You"],
      attachments: composer.attachments,
      tags: composer.tag ? [composer.tag] : undefined,
      sentAt: new Date().toISOString(),
    }

    const persisted = await sendMessageService(messagePayload)
    const updated = [...messages, persisted].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
    setMessages(updated)
    setComposer({ content: "", priority: "normal", requestAck: false, attachments: [], tag: "" })
    setSelectedMessageId(persisted.id)

    pushToast({
      title: "Message sent",
      description: `Shared to ${activeChannel.type === "direct" ? "direct chat" : `#${activeChannel.name}`}.`,
    })
  }

  const handleAcknowledge = async (messageId: string) => {
    await acknowledgeMessage(messageId, "You")
    setMessages((previous) =>
      previous.map((message) =>
        message.id === messageId
          ? {
              ...message,
              acknowledgedBy: message.acknowledgedBy.includes("You")
                ? message.acknowledgedBy
                : [...message.acknowledgedBy, "You"],
            }
          : message,
      ),
    )
  }

  const handleAddAttachment = () => {
    const id = `att-${Date.now()}`
    setComposer((previous) => ({
      ...previous,
      attachments: [...previous.attachments, { id, name: `document-${previous.attachments.length + 1}.pdf`, type: "PDF" }],
    }))
  }

  const handleCreateChannel = async () => {
    const id = `channel-${Date.now()}`
    const channel: CommunicationChannel = {
      id,
      name: `new-channel-${channels.length + 1}`,
      type: "private",
      description: "New secure collaboration space",
      unread: 0,
      members: 4,
      retentionPolicy: "standard",
      encryption: "end-to-end",
    }
    const persisted = await createChannelService(channel)
    setChannels((previous) => [persisted, ...previous.filter((item) => item.id !== persisted.id)])
    setActiveChannelId(persisted.id)
    pushToast({ title: "Channel created", description: `#${persisted.name} is ready.` })
  }

  return (
    <AuthGuard>
      <RoleGuard requiredRoles={["hr-admin", "payroll-ops", "communications"]}>
        <div className="space-y-6">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Communication Control Centre</h1>
          <p className="text-sm text-muted-foreground">
            Secure collaboration for payroll, compliance and workforce operations — with audit-ready controls.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={handleCreateChannel}>
            <Plus className="h-4 w-4" /> New channel
          </Button>
          <Button variant="outline" className="gap-2">
            <Laptop className="h-4 w-4" /> Start secure call
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Zap className="h-4 w-4" /> Launch automation
          </Button>
        </div>
          </header>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Active channels"
          value={channels.length}
          description="Spaces monitored for workforce operations"
          icon={<MessageSquare className="h-5 w-5 text-emerald-600" />}
        />
        <MetricCard
          title="Ack compliance"
          value={`${ackCompliance}%`}
          description="Mandatory comms acknowledged"
          icon={<CheckSquare className="h-5 w-5 text-blue-600" />}
        />
        <MetricCard
          title="Open incidents"
          value={messages.filter((message) => message.priority === "critical").length}
          description="Critical alerts awaiting closure"
          icon={<AlertCircle className="h-5 w-5 text-amber-600" />}
        />
      </section>

          <div className="grid gap-4 lg:grid-cols-[260px_1fr_320px]">
        <aside className="flex h-[720px] flex-col rounded-xl border bg-card">
          <ChannelSidebar
            channels={channels}
            activeId={activeChannelId}
            onSelect={setActiveChannelId}
            isLoading={channelsLoading}
          />
        </aside>

        <main className="flex h-[720px] flex-col rounded-xl border bg-card">
          <ConversationHeader
            channel={activeChannel}
            filters={filters}
            onFiltersChange={setFilters}
          />
          <Separator />
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-3 px-4 py-4">
              {filteredMessages.length === 0 ? (
                <div className="h-[420px] flex items-center justify-center text-sm text-muted-foreground">
                  No messages match the current filters.
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    selected={selectedMessageId === message.id}
                    onSelect={setSelectedMessageId}
                    onAcknowledge={handleAcknowledge}
                  />
                ))
              )}
            </div>
          </ScrollArea>
          <Separator />
          <Composer
            value={composer}
            onChange={setComposer}
            onSend={handleSendMessage}
            onAddAttachment={handleAddAttachment}
            disabled={!activeChannel}
          />
        </main>

        <aside className="flex h-[720px] flex-col gap-4">
          <CompliancePanel channel={activeChannel} />
          <MessageInspector message={selectedMessage} onAcknowledge={handleAcknowledge} />
        </aside>
          </div>
        </div>
      </RoleGuard>
    </AuthGuard>
  )
}

function MetricCard({ title, value, description, icon }: { title: string; value: string | number; description: string; icon: React.ReactNode }) {
  return (
    <Card className="border-2 border-emerald-50">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-full bg-emerald-50 p-3 text-emerald-700">{icon}</div>
      </CardContent>
    </Card>
  )
}

function ChannelSidebar({
  channels,
  activeId,
  onSelect,
  isLoading,
}: {
  channels: CommunicationChannel[]
  activeId: string
  onSelect: (id: string) => void
  isLoading: boolean
}) {
  return (
    <>
      <div className="px-4 pb-3 pt-4">
        <h2 className="text-sm font-semibold text-foreground">Secure channels</h2>
        <p className="text-xs text-muted-foreground">All activity archived with finance & HR retention policies.</p>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="space-y-1 px-2 py-3">
          {isLoading && (
            <div className="px-2 py-2 text-sm text-muted-foreground">Loading channels…</div>
          )}
          {!isLoading && channels.length === 0 && (
            <div className="px-2 py-2 text-sm text-muted-foreground">No channels available yet.</div>
          )}
          {channels.map((channel) => {
            const isActive = channel.id === activeId
            return (
              <button
                key={channel.id}
                onClick={() => onSelect(channel.id)}
                className={cn(
                  "flex w-full flex-col gap-1 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted/70",
                  isActive && "bg-muted",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {channel.type === "direct" ? "@" : "#"}
                    {channel.name}
                  </span>
                  {channel.unread > 0 && (
                    <Badge className="bg-emerald-100 text-emerald-700">{channel.unread}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{channel.description}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {channel.members}
                  </span>
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3" /> {channel.encryption}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" /> {channel.retentionPolicy}
                  </span>
                  {channel.externalGuests && (
                    <Badge variant="outline" className="text-[9px] text-amber-600">
                      External guest
                    </Badge>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </>
  )
}

function ConversationHeader({
  channel,
  filters,
  onFiltersChange,
}: {
  channel: CommunicationChannel | null
  filters: { priority: "all" | Priority; requiresAck: boolean; search: string }
  onFiltersChange: (filters: { priority: "all" | Priority; requiresAck: boolean; search: string }) => void
}) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {channel ? `${channel.type === "direct" ? "@" : "#"}${channel.name}` : "Select a channel"}
          </h2>
          {channel && <p className="text-xs text-muted-foreground">{channel.description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="gap-1 text-[10px]">
            <ShieldCheck className="h-3 w-3" /> {channel?.encryption ?? "Secured"}
          </Badge>
          <Badge variant="outline" className="gap-1 text-[10px]">
            <FileText className="h-3 w-3" /> {channel?.retentionPolicy ?? "policy"}
          </Badge>
          <Badge variant="outline" className="gap-1 text-[10px]">
            <Bell className="h-3 w-3" /> Escalation window: 15m
          </Badge>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <SlidersHorizontal className="h-3 w-3" /> Filters
        </div>
        <Select
          value={filters.priority}
          onValueChange={(value) => onFiltersChange({ ...filters, priority: value as any })}
        >
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 text-xs">
          <Switch
            checked={filters.requiresAck}
            onCheckedChange={(checked) => onFiltersChange({ ...filters, requiresAck: checked })}
            id="requires-ack"
          />
          <label htmlFor="requires-ack" className="text-xs text-muted-foreground">
            Requires acknowledgement
          </label>
        </div>
        <Input
          value={filters.search}
          onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
          placeholder="Search within conversation"
          className="h-8 w-full max-w-xs"
        />
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  selected,
  onSelect,
  onAcknowledge,
}: {
  message: CommunicationMessage
  selected: boolean
  onSelect: (id: string) => void
  onAcknowledge: (id: string) => void
}) {
  const priorityConfig: Record<Priority, { label: string; className: string }> = {
    normal: { label: "Normal", className: "bg-muted text-muted-foreground" },
    high: { label: "High", className: "bg-orange-100 text-orange-700" },
    critical: { label: "Critical", className: "bg-red-100 text-red-700" },
  }
  const config = priorityConfig[message.priority]

  return (
    <div
      className={cn(
        "flex cursor-pointer gap-3 rounded-lg border px-3 py-3 transition",
        selected ? "border-emerald-200 bg-emerald-50" : "border-transparent bg-muted/40 hover:border-muted",
      )}
      onClick={() => onSelect(message.id)}
    >
      <Avatar className="h-10 w-10">
        <AvatarFallback>{getInitials(message.author)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold text-foreground">{message.author}</div>
          <span className="text-xs text-muted-foreground">{message.authorRole}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
          </span>
          <Badge className={cn("h-5", config.className)}>{config.label}</Badge>
          {message.requiresAck && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <AlertTriangle className="h-3 w-3" /> Acknowledgement required
            </Badge>
          )}
        </div>
        <div className="rounded-lg bg-background px-3 py-2 text-sm text-foreground shadow-sm">
          {message.content}
        </div>
        {message.tags && (
          <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
            {message.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {message.attachments.map((attachment) => (
              <Badge key={attachment.id} variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" /> {attachment.name}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {message.requiresAck && (
            <Button
              size="xs"
              variant="outline"
              className="gap-1"
              onClick={(event) => {
                event.stopPropagation()
                onAcknowledge(message.id)
              }}
            >
              <Check className="h-3 w-3" /> Acknowledge
            </Button>
          )}
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" /> {message.acknowledgedBy.length} acknowledgements
          </span>
          {message.incidentTicket && (
            <Badge variant="outline" className="gap-1 text-[10px] text-red-600">
              <FlagTriangleRight className="h-3 w-3" /> {message.incidentTicket}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

function Composer({
  value,
  onChange,
  onSend,
  onAddAttachment,
  disabled,
}: {
  value: { content: string; priority: Priority; requestAck: boolean; attachments: Attachment[]; tag: string }
  onChange: (value: { content: string; priority: Priority; requestAck: boolean; attachments: Attachment[]; tag: string }) => void
  onSend: () => void
  onAddAttachment: () => void
  disabled: boolean
}) {
  return (
    <div className="space-y-3 px-4 py-3">
      <Textarea
        value={value.content}
        onChange={(event) => onChange({ ...value, content: event.target.value })}
        rows={3}
        placeholder={disabled ? "Select a channel to begin" : "Draft a message, update or alert"}
        disabled={disabled}
      />
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <Select value={value.priority} onValueChange={(priority) => onChange({ ...value, priority: priority as Priority })}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch
            checked={value.requestAck}
            onCheckedChange={(requestAck) => onChange({ ...value, requestAck })}
            id="request-ack"
          />
          <label htmlFor="request-ack" className="text-xs text-muted-foreground">
            Require acknowledgement
          </label>
        </div>
        <Input
          value={value.tag}
          onChange={(event) => onChange({ ...value, tag: event.target.value })}
          placeholder="Add tag"
          className="h-8 w-[140px]"
        />
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onAddAttachment} disabled={disabled}>
          <Upload className="h-4 w-4" /> Attach
        </Button>
        {value.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {value.attachments.map((attachment) => (
              <Badge key={attachment.id} variant="outline">
                {attachment.name}
              </Badge>
            ))}
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-2" disabled={disabled}>
            <PenSquare className="h-4 w-4" /> Save draft
          </Button>
          <Button type="button" size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={onSend} disabled={disabled}>
            <SendIcon priority={value.priority} />
            Dispatch
          </Button>
        </div>
      </div>
    </div>
  )
}

function CompliancePanel({ channel }: { channel: CommunicationChannel | null }) {
  return (
    <Card className="flex-1 border-emerald-50">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Compliance controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        {channel ? (
          <>
            <ComplianceRow
              label="Encryption"
              value={channel.encryption === "end-to-end" ? "End-to-end" : "In transit"}
              icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
            />
            <ComplianceRow
              label="Retention"
              value={`${channel.retentionPolicy.toUpperCase()} policy`}
              icon={<FileText className="h-4 w-4 text-blue-600" />}
            />
            <ComplianceRow
              label="External participants"
              value={channel.externalGuests ? "Enabled" : "Internal only"}
              icon={<Users className="h-4 w-4 text-amber-600" />}
            />
            <ComplianceRow
              label="Escalation SLA"
              value="15 minutes"
              icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
            />
            <p className="text-xs leading-relaxed">
              All channel messages are archived with digital signatures. Financial and legal teams have read-only oversight.
            </p>
          </>
        ) : (
          <p>Select a channel to inspect its compliance posture.</p>
        )}
      </CardContent>
    </Card>
  )
}

function ComplianceRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">{icon}</div>
      <div>
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  )
}

function MessageInspector({
  message,
  onAcknowledge,
}: {
  message: CommunicationMessage | null
  onAcknowledge: (id: string) => void
}) {
  if (!message) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Message inspector</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Select a message to view metadata, attachments and acknowledgement trail.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Message inspector</CardTitle>
        <p className="text-xs text-muted-foreground">Audit-ready view for compliance and payroll approvals.</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{message.author}</p>
            <p className="text-xs text-muted-foreground">{message.authorRole}</p>
          </div>
          <Badge variant="outline">{format(new Date(message.sentAt), "dd MMM yyyy HH:mm")}</Badge>
        </div>
        <Separator />
        <div>
          <p className="text-xs uppercase text-muted-foreground">Message</p>
          <p className="leading-relaxed text-foreground">{message.content}</p>
        </div>
        <div className="grid gap-2">
          <MetadataRow label="Priority" value={message.priority.toUpperCase()} />
          <MetadataRow label="Requires acknowledgement" value={message.requiresAck ? "Yes" : "No"} />
          {message.incidentTicket && <MetadataRow label="Incident" value={message.incidentTicket} />}
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div>
            <p className="text-xs uppercase text-muted-foreground">Attachments</p>
            <div className="mt-1 space-y-1 text-xs text-muted-foreground">
              {message.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2">
                  <FileText className="h-3 w-3" /> {attachment.name}
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="text-xs uppercase text-muted-foreground">Acknowledgements</p>
          <div className="mt-1 space-y-1 text-xs text-muted-foreground">
            {message.acknowledgedBy.length === 0 && <p>No acknowledgements recorded yet.</p>}
            {message.acknowledgedBy.map((person) => (
              <div key={person} className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-600" /> {person}
              </div>
            ))}
          </div>
        </div>
        {message.requiresAck && (
          <Button
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => onAcknowledge(message.id)}
          >
            <Check className="h-4 w-4" /> Acknowledge
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

function SendIcon({ priority }: { priority: Priority }) {
  if (priority === "critical") {
    return <AlertTriangle className="h-4 w-4" />
  }
  if (priority === "high") {
    return <FlagTriangleRight className="h-4 w-4" />
  }
  return <PenSquare className="h-4 w-4" />
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "?"
  )
}
