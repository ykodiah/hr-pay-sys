"use client"

import { useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"

import { AuthGuard } from "@/components/auth-guard"
import { RoleGuard } from "@/components/role-guard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  listMeetings,
  scheduleMeeting as scheduleMeetingService,
  updateMeeting,
  type MeetingProvider,
  type MeetingRecord,
  type MeetingStatus,
} from "@/lib/api/meetings-service"

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle,
  FileText,
  Link2,
  MicVocal,
  Plus,
  ShieldCheck,
  Users,
  Video,
  Wand2,
} from "lucide-react"

const providerSecurityNotes: Record<MeetingProvider, string> = {
  Zoom: "Waiting room enforced, SOC 2 Type II compliant",
  "Microsoft Teams": "Tenant isolation with Azure AD conditional access",
  "Google Meet": "Workspace enterprise security, DLP hooks available",
  Daily: "HIPAA ready, regional media servers",
  "Cisco Webex": "FedRAMP moderate, dedicated compliance controls",
}

export default function MeetingsWorkspacePage() {
  const [meetings, setMeetings] = useState<MeetingRecord[]>(meetingSeed)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    title: "",
    provider: "Zoom" as MeetingProvider,
    date: "",
    time: "",
    duration: 60,
    agenda: "",
    passcode: true,
    encryption: true,
    recording: true,
  })
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(meetingSeed[0]?.id ?? null)
  const [minutesProcessing, setMinutesProcessing] = useState<{ meetingId: string; step: number } | null>(null)

  const pushToast = toast

  const upcomingMeetings = useMemo(() => {
    return meetings
      .filter((meeting) => meeting.status === "scheduled" || meeting.status === "in-progress")
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  }, [meetings])
  const completedMeetings = useMemo(() => {
    return meetings
      .filter((meeting) => meeting.status === "completed")
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
  }, [meetings])

  const selectedMeeting = selectedMeetingId ? meetings.find((meeting) => meeting.id === selectedMeetingId) ?? null : null

  const handleCreateMeeting = () => {
    if (!form.title.trim() || !form.date || !form.time) {
      pushToast({
        variant: "destructive",
        title: "Missing details",
        description: "Provide title, date and time to schedule a meeting.",
      })
      return
    }

    const startTime = new Date(`${form.date}T${form.time}`)
    const meeting: MeetingRecord = {
      id: `M-${Date.now()}`,
      title: form.title.trim(),
      startTime: startTime.toISOString(),
      durationMinutes: Number(form.duration) || 60,
      provider: form.provider,
      host: "You",
      agenda: form.agenda.split("\n").filter(Boolean),
      participants: 0,
      status: "scheduled",
      passcodeEnforced: form.passcode,
      e2ee: form.encryption,
      recordingEnabled: form.recording,
      minutesStatus: "not-started",
    }

    setMeetings((previous) => [meeting, ...previous])
    setDialogOpen(false)
    setForm({ title: "", provider: "Zoom", date: "", time: "", duration: 60, agenda: "", passcode: true, encryption: true, recording: true })
    setSelectedMeetingId(meeting.id)

    pushToast({
      title: "Meeting scheduled",
      description: `${meeting.title} booked via ${meeting.provider}. Invitations will be triggered shortly.`,
    })
  }

  const handleGenerateMinutes = (meetingId: string) => {
    const meeting = meetings.find((item) => item.id === meetingId)
    if (!meeting) return
    if (meeting.minutesStatus === "ready") {
      pushToast({ title: "Minutes already available", description: "Download the existing summary." })
      return
    }

    setMinutesProcessing({ meetingId, step: 1 })
    setMeetings((previous) =>
      previous.map((record) => (record.id === meetingId ? { ...record, minutesStatus: "processing" } : record)),
    )

    setTimeout(() => setMinutesProcessing({ meetingId, step: 2 }), 800)
    setTimeout(() => setMinutesProcessing({ meetingId, step: 3 }), 1600)
    setTimeout(() => {
      setMeetings((previous) =>
        previous.map((record) =>
          record.id === meetingId
            ? {
                ...record,
                minutesStatus: "ready",
                minutesSummary:
                  "AI summary drafted. Key decisions captured, actions assigned to payroll ops and finance leads. Confidence score: 0.92.",
              }
            : record,
        ),
      )
      setMinutesProcessing(null)
      pushToast({ title: "Minutes ready", description: "Draft minutes and transcript are prepared for review." })
    }, 2400)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Secure Meetings Workspace</h1>
          <p className="text-sm text-muted-foreground">
            Schedule confidential sessions, enforce security controls, and generate AI-powered meeting minutes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <Link2 className="h-4 w-4" /> Provider directory
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Schedule meeting
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <MeetingMetricCard
          icon={<CalendarClock className="h-5 w-5 text-emerald-600" />}
          label="Next session"
          value={upcomingMeetings.length > 0 ? formatDistanceToNow(new Date(upcomingMeetings[0].startTime), { addSuffix: true }) : "None"}
          description={upcomingMeetings[0]?.title ?? "All clear"}
        />
        <MeetingMetricCard
          icon={<ShieldCheck className="h-5 w-5 text-blue-600" />}
          label="Security posture"
          value={`${Math.round((meetings.filter((meeting) => meeting.e2ee).length / meetings.length) * 100)}%`}
          description="Meetings with end-to-end encryption"
        />
        <MeetingMetricCard
          icon={<MicVocal className="h-5 w-5 text-amber-600" />}
          label="Minutes ready"
          value={meetings.filter((meeting) => meeting.minutesStatus === "ready").length}
          description="AI-generated summaries available"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr_320px]">
        <aside className="flex h-[720px] flex-col rounded-xl border bg-card">
          <MeetingList
            label="Upcoming & live"
            meetings={upcomingMeetings}
            selectedId={selectedMeetingId}
            onSelect={setSelectedMeetingId}
          />
          <Separator />
          <MeetingList
            label="Completed"
            meetings={completedMeetings}
            selectedId={selectedMeetingId}
            onSelect={setSelectedMeetingId}
          />
        </aside>

        <main className="flex h-[720px] flex-col gap-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Meeting details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedMeeting ? (
                <MeetingDetails
                  meeting={selectedMeeting}
                  onGenerateMinutes={handleGenerateMinutes}
                  minutesProcessing={minutesProcessing}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Select a meeting to view its profile, security controls and AI minutes.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Provider integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Connected providers use SSO and SCIM provisioning. Payloads are routed via secure webhooks for recordings and transcripts.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(providerSecurityNotes).map(([provider, note]) => (
                  <div key={provider} className="rounded-lg border p-3 text-xs">
                    <p className="font-semibold text-foreground">{provider}</p>
                    <p>{note}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>

        <aside className="flex h-[720px] flex-col gap-4">
          <MinutesPipeline
            meeting={selectedMeeting}
            minutesProcessing={minutesProcessing}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Action items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Auto-synchronise approved action items with Jira and Asana.</p>
              <p>• Meeting recordings stored in encrypted S3 bucket with 90-day retention.</p>
              <p>• Notify compliance when finance stakeholders join external meetings.</p>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule secure meeting</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 text-sm">
            <div className="grid gap-2">
              <Label htmlFor="title">Meeting title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
                placeholder="Payroll steering committee"
              />
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((previous) => ({ ...previous, date: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Start time</Label>
                <Input
                  id="time"
                  type="time"
                  value={form.time}
                  onChange={(event) => setForm((previous) => ({ ...previous, time: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={15}
                  value={form.duration}
                  onChange={(event) => setForm((previous) => ({ ...previous, duration: Number(event.target.value) }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Provider</Label>
              <Select
                value={form.provider}
                onValueChange={(provider) => setForm((previous) => ({ ...previous, provider: provider as MeetingProvider }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Zoom">Zoom</SelectItem>
                  <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                  <SelectItem value="Google Meet">Google Meet</SelectItem>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Cisco Webex">Cisco Webex</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{providerSecurityNotes[form.provider]}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agenda">Agenda (one line per item)</Label>
              <Textarea
                id="agenda"
                rows={3}
                value={form.agenda}
                onChange={(event) => setForm((previous) => ({ ...previous, agenda: event.target.value }))}
              />
            </div>
            <div className="rounded-lg border p-3 text-xs">
              <p className="font-semibold text-foreground">Security controls</p>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <SecuritySwitch
                  label="Require passcode"
                  checked={form.passcode}
                  onChange={(checked) => setForm((previous) => ({ ...previous, passcode: checked }))}
                />
                <SecuritySwitch
                  label="End-to-end encryption"
                  checked={form.encryption}
                  onChange={(checked) => setForm((previous) => ({ ...previous, encryption: checked }))}
                />
                <SecuritySwitch
                  label="Recording enabled"
                  checked={form.recording}
                  onChange={(checked) => setForm((previous) => ({ ...previous, recording: checked }))}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateMeeting}>
              Schedule meeting
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MeetingMetricCard({ icon, label, value, description }: { icon: React.ReactNode; label: string; value: string | number; description: string }) {
  return (
    <Card className="border-emerald-50">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-full bg-emerald-50 p-3 text-emerald-700">{icon}</div>
      </CardContent>
    </Card>
  )
}

function MeetingList({ label, meetings, selectedId, onSelect }: { label: string; meetings: MeetingRecord[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="flex-1">
      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{label}</h2>
        <p className="text-xs text-muted-foreground">{meetings.length} meeting(s)</p>
      </div>
      <ScrollArea className="h-[320px]">
        <div className="space-y-2 px-3 pb-4">
          {meetings.length === 0 && <p className="text-xs text-muted-foreground">None</p>}
          {meetings.map((meeting) => {
            const selected = meeting.id === selectedId
            return (
              <button
                key={meeting.id}
                onClick={() => onSelect(meeting.id)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm transition",
                  selected ? "border-emerald-200 bg-emerald-50" : "border-transparent bg-muted/50 hover:border-muted",
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">{meeting.title}</p>
                  <Badge variant="outline" className="capitalize text-[10px]">
                    {meeting.status.replace("-", " ")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(meeting.startTime), "dd MMM yyyy • HH:mm")}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Video className="h-3 w-3" /> {meeting.provider}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {meeting.participants} participants
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

function MeetingDetails({
  meeting,
  onGenerateMinutes,
  minutesProcessing,
}: {
  meeting: MeetingRecord
  onGenerateMinutes: (meetingId: string) => void
  minutesProcessing: { meetingId: string; step: number } | null
}) {
  const minutesBusy = minutesProcessing && minutesProcessing.meetingId === meeting.id

  return (
    <div className="space-y-4 text-sm text-muted-foreground">
      <div className="grid gap-2 md:grid-cols-2">
        <DataPoint label="Host" value={meeting.host} />
        <DataPoint label="Start" value={format(new Date(meeting.startTime), "dd MMM yyyy HH:mm")} />
        <DataPoint label="Duration" value={`${meeting.durationMinutes} minutes`} />
        <DataPoint label="Provider" value={meeting.provider} />
      </div>
      <div>
        <p className="text-xs uppercase text-muted-foreground">Agenda</p>
        <ul className="mt-1 list-inside list-disc space-y-1 text-foreground">
          {meeting.agenda.map((item, index) => (
            <li key={`${meeting.id}-agenda-${index}`}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <SecurityBadge label="Passcode" enabled={meeting.passcodeEnforced} />
        <SecurityBadge label="E2E encryption" enabled={meeting.e2ee} />
        <SecurityBadge label="Recording" enabled={meeting.recordingEnabled} />
      </div>
      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wand2 className="h-4 w-4 text-purple-600" /> AI minutes pipeline: {meeting.minutesStatus === "ready" ? "Completed" : meeting.minutesStatus === "processing" ? "In progress" : "Not started"}
        </div>
        <Button
          variant="outline"
          className="gap-2"
          disabled={meeting.status === "scheduled" && new Date(meeting.startTime) > new Date()}
          onClick={() => onGenerateMinutes(meeting.id)}
        >
          Generate minutes
        </Button>
      </div>
      {meeting.minutesStatus === "ready" && meeting.minutesSummary && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
          <p className="font-semibold text-emerald-800">Summary</p>
          <p className="mt-1 leading-relaxed">{meeting.minutesSummary}</p>
        </div>
      )}
      {minutesBusy && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
          Processing step {minutesProcessing!.step} of 3: {minutesProcessing!.step === 1 ? "Transcribing audio…" : minutesProcessing!.step === 2 ? "Classifying action items…" : "Drafting minutes…"}
        </div>
      )}
    </div>
  )
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

function SecurityBadge({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-xs",
        enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-muted bg-muted/40",
      )}
    >
      <div className="flex items-center gap-1">
        {enabled ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
        <span>{label}</span>
      </div>
    </div>
  )
}

function MinutesPipeline({ meeting, minutesProcessing }: { meeting: MeetingRecord | null; minutesProcessing: { meetingId: string; step: number } | null }) {
  const stages = [
    { id: 1, label: "Ingest recording", description: "Decrypt and normalise audio streams" },
    { id: 2, label: "Generate transcript", description: "Speaker diarisation and translation" },
    { id: 3, label: "Summarise & actions", description: "AI condensation with finance/legal focus" },
    { id: 4, label: "Publish", description: "Route to HRIS, Slack, and Confluence" },
  ]

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">AI minutes pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {!meeting ? (
          <p>Select a meeting to monitor the AI minutes workflow.</p>
        ) : (
          <div className="space-y-2">
            {stages.map((stage) => {
              const isCompleted =
                meeting.minutesStatus === "ready" ||
                (minutesProcessing && minutesProcessing.meetingId === meeting.id && minutesProcessing.step > stage.id)
              const isActive = minutesProcessing && minutesProcessing.meetingId === meeting.id && minutesProcessing.step === stage.id
              return (
                <div
                  key={stage.id}
                  className={cn(
                    "rounded-lg border px-3 py-2",
                    isCompleted ? "border-emerald-200 bg-emerald-50" : isActive ? "border-blue-200 bg-blue-50" : "border-muted",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{stage.label}</span>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : isActive ? (
                      <Wand2 className="h-4 w-4 text-blue-600 animate-pulse" />
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{stage.description}</p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SecuritySwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
