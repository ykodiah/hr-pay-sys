"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ChannelRecord {
  id: string
  channel_name: string
  channel_type: "public" | "private" | "direct"
  description: string | null
  channel_members: { user_id: string; role: string }[]
}

interface SenderProfile {
  id: string
  display_name?: string | null
  full_name?: string | null
}

interface ReactionRecord {
  user_id: string
  emoji: string
}

interface ReadReceiptRecord {
  user_id: string
  read_at: string
}

interface MessageRecord {
  id: string
  channel_id: string
  thread_id: string | null
  sender_id: string
  content: string | null
  attachments: any[] | null
  metadata: Record<string, any> | null
  priority: string
  sent_at: string
  sender?: SenderProfile | null
  reactions?: ReactionRecord[]
  read_receipts?: ReadReceiptRecord[]
}

const getDisplayName = (profile?: SenderProfile | null) => {
  if (!profile) return "Unknown"
  return profile.display_name || profile.full_name || "Unknown"
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "?"

export default function CommunicationPage() {
  const [channels, setChannels] = useState<ChannelRecord[]>([])
  const [channelsLoading, setChannelsLoading] = useState(true)
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [channelDialogOpen, setChannelDialogOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelDescription, setNewChannelDescription] = useState("")
  const [newChannelType, setNewChannelType] = useState<"public" | "private" | "direct">("public")
  const { toast } = useToast()
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)

  const activeChannel = useMemo(
    () => channels.find((channel) => channel.id === activeChannelId) ?? null,
    [channels, activeChannelId]
  )

  const loadChannels = useCallback(async () => {
    try {
      setChannelsLoading(true)
      const response = await fetch("/api/communication/channels")
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Failed to load channels")
      const data: ChannelRecord[] = payload.data ?? []
      setChannels(data)
      if (!activeChannelId && data.length > 0) {
        setActiveChannelId(data[0].id)
      }
    } catch (error: any) {
      console.error("[channels]", error)
      toast({
        variant: "destructive",
        title: "Unable to load channels",
        description: error.message || "Unexpected error",
      })
    } finally {
      setChannelsLoading(false)
    }
  }, [activeChannelId, toast])

  const loadMessages = useCallback(
    async (channelId: string) => {
      try {
        setMessagesLoading(true)
        const params = new URLSearchParams({ channelId, limit: "50" })
        const response = await fetch(`/api/communication/messages?${params.toString()}`)
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || "Failed to load messages")
        const data: MessageRecord[] = payload.data ?? []
        setMessages([...data].reverse())
      } catch (error: any) {
        console.error("[messages]", error)
        toast({
          variant: "destructive",
          title: "Unable to load messages",
          description: error.message || "Unexpected error",
        })
      } finally {
        setMessagesLoading(false)
      }
    },
    [toast]
  )

  const sendMessage = useCallback(async () => {
    if (!activeChannelId || !draft.trim() || sending) return
    try {
      setSending(true)
      const response = await fetch("/api/communication/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: activeChannelId, content: draft.trim() }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Failed to send message")
      setDraft("")
      setMessages((previous) => [...previous, payload.data])
    } catch (error: any) {
      console.error("[messages/send]", error)
      toast({
        variant: "destructive",
        title: "Unable to send message",
        description: error.message || "Unexpected error",
      })
    } finally {
      setSending(false)
    }
  }, [activeChannelId, draft, sending, toast])

  useEffect(() => {
    loadChannels()
  }, [loadChannels])

  useEffect(() => {
    if (activeChannelId) {
      loadMessages(activeChannelId)
    }
  }, [activeChannelId, loadMessages])

  useEffect(() => {
    if (!messagesContainerRef.current) return
    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages])

  const handleCreateChannel = useCallback(async () => {
    if (!newChannelName.trim()) {
      toast({
        variant: "destructive",
        title: "Channel name required",
        description: "Please choose a name for your new channel",
      })
      return
    }

    try {
      const response = await fetch("/api/communication/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newChannelName.trim(),
          description: newChannelDescription.trim() || null,
          type: newChannelType,
        }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Failed to create channel")

      setChannelDialogOpen(false)
      setNewChannelName("")
      setNewChannelDescription("")
      setNewChannelType("public")
      await loadChannels()
      setActiveChannelId(payload.data?.id ?? null)
      toast({ title: "Channel created", description: `#${payload.data?.channel_name ?? newChannelName} is ready.` })
    } catch (error: any) {
      console.error("[channel/create]", error)
      toast({
        variant: "destructive",
        title: "Unable to create channel",
        description: error.message || "Unexpected error",
      })
    }
  }, [loadChannels, newChannelDescription, newChannelName, newChannelType, toast])

  return (
    <div className="flex h-full min-h-[560px] flex-col gap-4 p-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Communication Hub</h1>
          <p className="text-muted-foreground">
            Real-time collaboration across HR, payroll, and workforce teams.
          </p>
        </div>
      </header>

      <div className="flex flex-1 gap-4 overflow-hidden rounded-xl border bg-card">
        <aside className="hidden w-[260px] flex-col border-r lg:flex">
          <div className="px-4 py-3 text-sm font-semibold">Channels</div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 px-2 pb-4">
              {channelsLoading && (
                <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Loading channels...
                </div>
              )}
              {!channelsLoading && channels.length === 0 && (
                <div className="px-2 py-2 text-sm text-muted-foreground">
                  No channels available yet.
                </div>
              )}
              {channels.map((channel) => {
                const isActive = channel.id === activeChannelId
                return (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannelId(channel.id)}
                    className={cn(
                      "flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted/70",
                      isActive && "bg-muted"
                    )}
                  >
                    <span className="font-medium">
                      {channel.channel_type === "direct" ? "@" : "#"}
                      {channel.channel_name}
                    </span>
                    {channel.description && (
                      <span className="line-clamp-1 text-xs text-muted-foreground">
                        {channel.description}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="border-b px-4 py-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  {activeChannel ? `${activeChannel.channel_type === "direct" ? "@" : "#"}${activeChannel.channel_name}` : "Select a channel"}
                </span>
                {activeChannel && (
                  <Badge variant="outline" className="capitalize">
                    {activeChannel.channel_type}
                  </Badge>
                )}
              </div>
              {activeChannel?.description && (
                <p className="text-sm text-muted-foreground">{activeChannel.description}</p>
              )}
            </div>
          </header>

          <ScrollArea className="flex-1">
            <div ref={messagesContainerRef} className="flex flex-col gap-4 px-4 pb-6 pt-4">
              {messagesLoading && messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading conversation...
                </div>
              )}

              {!messagesLoading && messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Start the conversation with a message.
                </div>
              )}

              {messages.map((message) => {
                const sender = getDisplayName(message.sender)
                const readReceipts = message.read_receipts || []
                return (
                  <div key={message.id} className="flex items-start gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{getInitials(sender)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-sm text-foreground">{sender}</span>
                        <span>{formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })}</span>
                      </div>
                      <div className="rounded-lg border bg-card/60 px-4 py-2 text-sm shadow-sm">
                        {message.content}
                      </div>
                      {readReceipts.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          {readReceipts.length > 1 ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                          <span>{readReceipts.length} acknowledged</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          <Separator />
          <footer className="px-4 py-3">
            <div className="space-y-3">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={activeChannel ? `Message ${activeChannel.channel_type === "direct" ? "@" : "#"}${activeChannel.channel_name}` : "Select a channel to start chatting"}
                rows={3}
              />
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  Messages sync in real time once the full workspace experience ships.
                </div>
                <Button onClick={sendMessage} disabled={!draft.trim() || sending || !activeChannelId} className="gap-2">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </Button>
              </div>
            </div>
          </footer>
        </section>
      </div>

      <Dialog open={channelDialogOpen} onOpenChange={setChannelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create channel</DialogTitle>
            <DialogDescription>
              Launch a new space for HR, payroll, or workforce collaboration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Channel name</label>
              <Input value={newChannelName} onChange={(event) => setNewChannelName(event.target.value)} placeholder="payroll-ops" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Description</label>
              <Input value={newChannelDescription} onChange={(event) => setNewChannelDescription(event.target.value)} placeholder="Purpose of this channel" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Channel type</label>
              <select
                value={newChannelType}
                onChange={(event) => setNewChannelType(event.target.value as "public" | "private" | "direct")}
                className="flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="direct">Direct</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChannelDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateChannel} disabled={!newChannelName.trim()}>
              Create channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
