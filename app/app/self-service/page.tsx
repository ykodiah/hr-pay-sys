"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileDown,
  Flame,
  GraduationCap,
  HeartPulse,
  Lightbulb,
  NotebookPen,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react"

type QuickAction = "leave" | "payslip" | "feedback"

const leaveTypes = [
  "Annual Leave",
  "Sick Leave",
  "Maternity Leave",
  "Study Leave",
]

const payslipPeriods = [
  "January 2025",
  "December 2024",
  "November 2024",
  "October 2024",
]

const wellbeingMoments = [
  {
    title: "Pulse check due",
    description: "Share how you feel this week so we can keep support personalised.",
    icon: HeartPulse,
    accent: "text-rose-600",
  },
  {
    title: "Focus sprint",
    description: "Block 2 hours this Friday for undisturbed deep work—87% of your peers recommend it.",
    icon: Flame,
    accent: "text-orange-500",
  },
]

const growthMoments = [
  {
    category: "Learning",
    title: "Recommended: Advanced People Analytics",
    meta: "5 lessons • 92% relevance",
    progress: 40,
  },
  {
    category: "Performance",
    title: "Draft quarterly goal refresh",
    meta: "Due in 5 days • manager feedback ready",
    progress: 65,
  },
  {
    category: "Benefits",
    title: "Optimise pension contributions",
    meta: "Simulation shows +₵210/month potential",
    progress: 20,
  },
]

const aiSignals = [
  {
    title: "Attendance risk low",
    detail: "No missed check-ins in 45 days. Geo-card check echoes 97% accuracy.",
    confidence: 0.92,
    recommendation: "Keep auto-reminders active for hybrid days.",
  },
  {
    title: "Learning momentum",
    detail: "You’re ahead of the cohort on the Leadership Catalyst trail.",
    confidence: 0.81,
    recommendation: "Book your coaching slot to unlock capstone badge.",
  },
]

const upcomingEvents = [
  {
    title: "Leadership lab cohort call",
    time: "Today • 15:00",
    location: "Microsoft Teams",
    status: "Join",
  },
  {
    title: "Performance alignment with Nana",
    time: "Fri, 7 Feb • 11:30",
    location: "Room 3B | Hybrid",
    status: "Prep notes",
  },
  {
    title: "Benefit clinic: Tier 3 boosters",
    time: "Mon, 10 Feb • 09:00",
    location: "Cafeteria",
    status: "RSVP",
  },
]

export default function EmployeePortalPage() {
  const { toast } = useToast()

  const [activeDialog, setActiveDialog] = useState<QuickAction | null>(null)
  const [leaveForm, setLeaveForm] = useState({
    type: leaveTypes[0],
    start: "",
    end: "",
    reason: "",
  })
  const [selectedPayslip, setSelectedPayslip] = useState(payslipPeriods[0])
  const [feedbackInput, setFeedbackInput] = useState("")
  const [acknowledgedSignals, setAcknowledgedSignals] = useState<string[]>([])

  const highlightCards = useMemo(
    () => [
      {
        title: "Leave balance",
        value: "18 days",
        delta: "+2 days credited",
        tone: "text-emerald-600",
        action: () => setActiveDialog("leave"),
        actionLabel: "Request leave",
      },
      {
        title: "Latest payslip",
        value: "Jan 2025",
        delta: "Available now",
        tone: "text-blue-600",
        action: () => setActiveDialog("payslip"),
        actionLabel: "Download",
      },
      {
        title: "Attendance streak",
        value: "45 days",
        delta: "100% on-time",
        tone: "text-purple-600",
        action: () => toast({
          title: "Attendance summary prepared",
          description: "A snapshot has been sent to your inbox.",
        }),
        actionLabel: "View summary",
      },
      {
        title: "Well-being index",
        value: "8.6 / 10",
        delta: "Healthy",
        tone: "text-orange-600",
        action: () => setActiveDialog("feedback"),
        actionLabel: "Share feedback",
      },
    ],
    [toast],
  )

  const openAction = (action: QuickAction) => setActiveDialog(action)

  const submitLeave = () => {
    if (!leaveForm.start || !leaveForm.end || !leaveForm.reason.trim()) {
      toast({
        variant: "destructive",
        title: "Missing details",
        description: "Select dates and add a brief reason before submitting.",
      })
      return
    }

    toast({
      title: "Leave request sent",
      description: `${leaveForm.type} from ${leaveForm.start} to ${leaveForm.end} is with your manager.`,
    })
    setActiveDialog(null)
    setLeaveForm({ type: leaveTypes[0], start: "", end: "", reason: "" })
  }

  const downloadPayslip = () => {
    toast({
      title: "Payslip ready",
      description: `${selectedPayslip} payslip is downloading. A copy is saved in Documents → Payslips.`,
    })
    setActiveDialog(null)
  }

  const submitFeedback = () => {
    if (!feedbackInput.trim()) {
      toast({
        variant: "destructive",
        title: "Add a quick note",
        description: "Let us know how your experience is going.",
      })
      return
    }

    toast({
      title: "Feedback received",
      description: "Thanks for sharing. We’ll respond within 24 hours.",
    })
    setFeedbackInput("")
    setActiveDialog(null)
  }

  const acknowledgeSignal = (title: string) => {
    toast({
      title: "Insight saved",
      description: "We’ll refine future nudges based on your acknowledgement.",
    })
    setAcknowledgedSignals((previous) => [...previous, title])
  }

      return (
        <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Badge variant="outline" className="w-fit border-emerald-200 text-emerald-700">
              Employee Portal
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Good afternoon, Ama 👋🏾</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Here’s a snapshot of your workday, benefits and growth signals. The assistant keeps learning from
              your patterns to surface what matters most.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2" onClick={() => openAction("leave")}>
              <CalendarCheck2 className="h-4 w-4" /> Quick leave request
            </Button>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => openAction("payslip")}>
              <FileDown className="h-4 w-4" /> Download payslip
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlightCards.map((card) => (
            <Card key={card.title} className="shadow-sm border-slate-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className={`text-2xl font-semibold ${card.tone}`}>{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.delta}</p>
                </div>
                <Button variant="outline" size="sm" className="w-full justify-between" onClick={card.action}>
                  {card.actionLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="border-slate-100">
            <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold">AI-powered nudges</CardTitle>
                <CardDescription>Personalised signals based on attendance, productivity and learning graphs.</CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Sparkles className="h-3 w-3" /> Adaptive
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiSignals.map((signal) => (
                <div
                  key={signal.title}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{signal.title}</p>
                    <p className="text-xs text-muted-foreground">{signal.detail}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={signal.confidence * 100} className="h-1.5 w-32" />
                      <span className="text-xs text-slate-500">Confidence {(signal.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 bg-white"
                            onClick={() =>
                              toast({
                                title: "Applied recommendation",
                                description: signal.recommendation,
                              })
                            }
                          >
                            <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Apply tip
                          </Button>
                          <span className="hidden text-[10px] text-muted-foreground sm:inline">
                            Sends to your task list and assistant
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => acknowledgeSignal(signal.title)}
                            disabled={acknowledgedSignals.includes(signal.title)}
                          >
                            {acknowledgedSignals.includes(signal.title) ? "Saved" : "Acknowledge"}
                          </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-emerald-600" /> Upcoming schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.title} className="rounded-lg border border-slate-100 p-3 bg-white/80">
                    <p className="text-sm font-medium text-slate-900">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.time}</p>
                    <p className="text-xs text-muted-foreground">{event.location}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 text-xs gap-1"
                      onClick={() => toast({ title: `${event.status} action triggered`, description: event.title })}
                    >
                      {event.status}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-sky-500" /> Well-being signals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {wellbeingMoments.map((item) => (
                  <div key={item.title} className="rounded-lg border border-slate-100 p-3 bg-slate-50">
                    <div className="flex items-start gap-2">
                      <item.icon className={`h-4 w-4 ${item.accent}`} />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-7 gap-1"
                      onClick={() => toast({ title: "Scheduled", description: `${item.title} added to your calendar.` })}
                    >
                      Schedule
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="border-slate-100">
            <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Growth cockpit</CardTitle>
                <CardDescription>Programs, goals, and benefits the assistant prioritises for you.</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs gap-1">
                <TrendingUp className="h-3 w-3" /> Personalised
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {growthMoments.map((moment) => (
                <div key={moment.title} className="rounded-xl border border-slate-100 p-4 bg-white/90">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{moment.category}</p>
                      <p className="text-sm font-semibold text-slate-900">{moment.title}</p>
                      <p className="text-xs text-muted-foreground">{moment.meta}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      <Trophy className="mr-1 h-3 w-3" /> {moment.progress}%
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={moment.progress} className="h-2" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() =>
                        toast({
                          title: "Added to planner",
                          description: `${moment.title} slotted into your agenda.`,
                        })
                      }
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-indigo-600" /> Quick actions & history
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="actions" className="space-y-3">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="actions">Shortcuts</TabsTrigger>
                  <TabsTrigger value="history">Recent</TabsTrigger>
                </TabsList>
                <TabsContent value="actions" className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => openAction("leave")}>
                    <CalendarCheck2 className="h-4 w-4 text-emerald-600" /> Submit leave request
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => toast({
                    title: "Course assigned",
                    description: "Learning & Development will email you shortly.",
                  })}>
                    <GraduationCap className="h-4 w-4 text-purple-600" /> Request new course
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveDialog("feedback")}> 
                    <NotebookPen className="h-4 w-4 text-sky-600" /> Share feedback with HR
                  </Button>
                </TabsContent>
                <TabsContent value="history" className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <div>
                      Payslip downloaded for December 2024
                      <p className="text-[11px] text-slate-400">Completed 5 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <div>
                      Completed “Culture Champion” recognition survey
                      <p className="text-[11px] text-slate-400">Completed 8 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <div>
                      Submitted annual goals for review
                      <p className="text-[11px] text-slate-400">Completed 2 weeks ago</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        <Dialog open={activeDialog === "leave"} onOpenChange={(open) => setActiveDialog(open ? "leave" : null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarCheck2 className="h-4 w-4 text-emerald-600" /> Request time off
              </DialogTitle>
              <DialogDescription>
                Smart leave assistant pre-fills details from your past patterns and manager availability.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="leave-type">Leave type</Label>
                <select
                  id="leave-type"
                  className="h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  value={leaveForm.type}
                  onChange={(event) => setLeaveForm((prev) => ({ ...prev, type: event.target.value }))}
                >
                  {leaveTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="leave-start">Start date</Label>
                  <Input
                    id="leave-start"
                    type="date"
                    value={leaveForm.start}
                    onChange={(event) => setLeaveForm((prev) => ({ ...prev, start: event.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="leave-end">End date</Label>
                  <Input
                    id="leave-end"
                    type="date"
                    value={leaveForm.end}
                    onChange={(event) => setLeaveForm((prev) => ({ ...prev, end: event.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="leave-reason">Reason / additional context</Label>
                <Textarea
                  id="leave-reason"
                  placeholder="e.g., Family event in Kumasi"
                  value={leaveForm.reason}
                  onChange={(event) => setLeaveForm((prev) => ({ ...prev, reason: event.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setActiveDialog(null)}>
                Cancel
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={submitLeave}>
                Submit request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={activeDialog === "payslip"} onOpenChange={(open) => setActiveDialog(open ? "payslip" : null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileDown className="h-4 w-4 text-blue-600" /> Download payslip
              </DialogTitle>
              <DialogDescription>Select a period and we’ll stream the encrypted PDF to your device.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="payslip-period">Period</Label>
                <select
                  id="payslip-period"
                  className="h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  value={selectedPayslip}
                  onChange={(event) => setSelectedPayslip(event.target.value)}
                >
                  {payslipPeriods.map((period) => (
                    <option key={period}>{period}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: The assistant can automatically summarise net pay changes and tax deductions for the last three months.
              </p>
            </div>
            <DialogFooter className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setActiveDialog(null)}>
                Close
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={downloadPayslip}>
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={activeDialog === "feedback"} onOpenChange={(open) => setActiveDialog(open ? "feedback" : null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <NotebookPen className="h-4 w-4 text-sky-600" /> Share quick feedback
              </DialogTitle>
              <DialogDescription>
                Help People Operations improve your experience. Insights feed directly into the HR assistant’s roadmap.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <Label htmlFor="feedback-text">How’s the portal working for you?</Label>
              <Textarea
                id="feedback-text"
                placeholder="I’d love to track my benefits in one place..."
                value={feedbackInput}
                onChange={(event) => setFeedbackInput(event.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setActiveDialog(null)}>
                Skip for now
              </Button>
              <Button className="bg-sky-600 hover:bg-sky-700" onClick={submitFeedback}>
                Send feedback
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
