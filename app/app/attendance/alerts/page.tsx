"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock3,
  Filter,
  RefreshCw,
  Search,
  Send,
  Settings2,
  XCircle,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type AlertRow = {
  id: string
  alert_type: string
  severity: string
  title: string
  message: string
  status: string
  created_at: string
  employee?: {
    id: string
    first_name: string
    last_name: string
    employee_id?: string
    employee_number?: string
  } | null
}

type RuleRow = {
  id: string
  rule_name: string
  alert_category?: string
  rule_type?: string
  is_active: boolean
  severity: string
  notification_channels?: string[]
  trigger_condition?: { threshold_minutes?: number; alert_type?: string } | null
}

const SEVERITY_STYLES: Record<string, string> = {
  low: "border-sky-200 bg-sky-50 text-sky-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  medium: "border-amber-200 bg-amber-50 text-amber-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  high: "border-orange-200 bg-orange-50 text-orange-900",
  critical: "border-rose-200 bg-rose-50 text-rose-900",
}

export default function AttendanceAlertsPage() {
  const [tab, setTab] = useState("inbox")
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [alerts, setAlerts] = useState<AlertRow[]>([])
  const [rules, setRules] = useState<RuleRow[]>([])
  const [statusFilter, setStatusFilter] = useState("open")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<AlertRow | null>(null)
  const [note, setNote] = useState("")
  const [ruleForm, setRuleForm] = useState({
    name: "",
    alert_type: "late_arrival",
    severity: "medium",
    threshold_minutes: "15",
    notify_manager: true,
    notify_hr: true,
  })

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      else setSyncing(true)
      try {
        const qs = new URLSearchParams({ limit: "100" })
        if (statusFilter !== "all") qs.set("status", statusFilter)
        if (severityFilter !== "all") qs.set("severity", severityFilter)
        const [aRes, rRes] = await Promise.all([
          fetch(`/api/attendance/alerts?${qs}`, { cache: "no-store", credentials: "include" }),
          fetch("/api/attendance/alerts/rules", { cache: "no-store", credentials: "include" }),
        ])
        const aJson = await aRes.json().catch(() => ({}))
        const rJson = await rRes.json().catch(() => ({}))
        if (!aRes.ok) throw new Error(aJson.error || "Failed to load alerts")
        if (!rRes.ok) throw new Error(rJson.error || "Failed to load rules")
        setAlerts(aJson.data || [])
        setRules(rJson.data || [])
      } catch (e: any) {
        toast({ title: "Load failed", description: e.message || "Failed to load alerts", variant: "destructive" })
      } finally {
        setLoading(false)
        setSyncing(false)
      }
    },
    [severityFilter, statusFilter],
  )

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return alerts
    return alerts.filter((a) =>
      [a.title, a.message, a.alert_type, a.employee?.first_name, a.employee?.last_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
  }, [alerts, search])

  const openCount = alerts.filter((a) => a.status === "pending" || a.status === "open" || a.status === "sent").length
  const criticalCount = alerts.filter(
    (a) => a.severity === "critical" && (a.status === "pending" || a.status === "open" || a.status === "sent"),
  ).length

  async function updateAlert(id: string, action: string) {
    try {
      const res = await fetch("/api/attendance/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          alert_id: id,
          action,
          resolution_note: note || undefined,
          response_note: note || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Update failed")
      toast({ title: `Alert ${action}d`, description: "Status saved to the database." })
      setNote("")
      setSelected(null)
      await load(true)
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message || "Update failed", variant: "destructive" })
    }
  }

  async function saveRule() {
    try {
      const res = await fetch("/api/attendance/alerts/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rule_name: ruleForm.name,
          alert_type: ruleForm.alert_type,
          alert_category: ruleForm.alert_type,
          severity: ruleForm.severity,
          threshold_minutes: Number(ruleForm.threshold_minutes) || null,
          notify_manager: ruleForm.notify_manager,
          notify_hr: ruleForm.notify_hr,
          notification_channels: ["in_app"],
          is_active: true,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to save rule")
      toast({ title: "Alert rule saved" })
      setRuleForm((p) => ({ ...p, name: "" }))
      await load(true)
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message || "Failed to save rule", variant: "destructive" })
    }
  }

  async function toggleRule(rule: RuleRow) {
    try {
      const res = await fetch("/api/attendance/alerts/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rule_id: rule.id, is_active: !rule.is_active }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to update rule")
      await load(true)
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message || "Failed to update rule", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-muted-foreground">
            <Link href="/app/attendance">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Attendance
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Alerts & Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Monitor late arrivals, absences, and overtime exceptions — then resolve from one inbox.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void load(true)} disabled={syncing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", syncing && "animate-spin")} />
            Sync
          </Button>
          <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700">
            <Link href="/app/attendance">Attendance Register</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open alerts</p>
              <p className="text-xl font-semibold">{openCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-rose-50 p-2 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Critical open</p>
              <p className="text-xl font-semibold">{criticalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
              <Settings2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active rules</p>
              <p className="text-xl font-semibold">{rules.filter((r) => r.is_active).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="rules">Notification Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Alert inbox</CardTitle>
              <CardDescription>Filter, review, acknowledge, or resolve attendance exceptions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search alerts or employees…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="mr-2 h-3.5 w-3.5" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All severities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Loading alerts…</p>
              ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed py-12 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                  <p className="font-medium">No alerts in this view</p>
                  <p className="text-sm text-muted-foreground">Attendance exceptions will appear here when rules fire.</p>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="divide-y rounded-xl border">
                    {filtered.map((alert) => (
                      <button
                        key={alert.id}
                        type="button"
                        onClick={() => setSelected(alert)}
                        className={cn(
                          "w-full px-4 py-3 text-left transition hover:bg-muted/40",
                          selected?.id === alert.id && "bg-muted/50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{alert.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{alert.message}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {alert.employee
                                ? `${alert.employee.first_name} ${alert.employee.last_name} · ${
                                    alert.employee.employee_id || alert.employee.employee_number || ""
                                  }`
                                : alert.alert_type.replace(/_/g, " ")}
                              {" · "}
                              {format(new Date(alert.created_at), "dd MMM yyyy HH:mm")}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("shrink-0 capitalize", SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium)}
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>

                  <Card className="border-border/70 shadow-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Alert detail</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!selected ? (
                        <p className="text-sm text-muted-foreground">Select an alert to review and take action.</p>
                      ) : (
                        <>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn("capitalize", SEVERITY_STYLES[selected.severity] || SEVERITY_STYLES.medium)}
                              >
                                {selected.severity}
                              </Badge>
                              <Badge variant="secondary" className="capitalize">
                                {selected.status}
                              </Badge>
                            </div>
                            <h3 className="font-semibold">{selected.title}</h3>
                            <p className="text-sm text-muted-foreground">{selected.message}</p>
                          </div>
                          <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
                            <p className="flex items-center gap-1.5">
                              <Clock3 className="h-3.5 w-3.5" />
                              {format(new Date(selected.created_at), "dd MMM yyyy · HH:mm")}
                            </p>
                            <p className="mt-1 capitalize">Type: {selected.alert_type.replace(/_/g, " ")}</p>
                            {selected.employee && (
                              <p className="mt-1">
                                Employee: {selected.employee.first_name} {selected.employee.last_name} (
                                {selected.employee.employee_id || selected.employee.employee_number})
                              </p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label>Resolution note</Label>
                            <Textarea
                              rows={3}
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder="Optional note for audit trail…"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(selected.status === "pending" || selected.status === "open" || selected.status === "sent") && (
                              <Button size="sm" variant="outline" onClick={() => void updateAlert(selected.id, "acknowledge")}>
                                Acknowledge
                              </Button>
                            )}
                            {selected.status !== "resolved" && (
                              <Button
                                size="sm"
                                className="bg-teal-600 hover:bg-teal-700"
                                onClick={() => void updateAlert(selected.id, "resolve")}
                              >
                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                Resolve
                              </Button>
                            )}
                            {selected.status !== "dismissed" && (
                              <Button size="sm" variant="ghost" onClick={() => void updateAlert(selected.id, "dismiss")}>
                                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                Dismiss
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Create notification rule</CardTitle>
                <CardDescription>Define when HR and managers are notified of attendance exceptions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Rule name</Label>
                  <Input
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Late arrival > 15 min"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Alert type</Label>
                    <Select value={ruleForm.alert_type} onValueChange={(v) => setRuleForm((p) => ({ ...p, alert_type: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="late_arrival">Late arrival</SelectItem>
                        <SelectItem value="early_departure">Early departure</SelectItem>
                        <SelectItem value="absence">Absence</SelectItem>
                        <SelectItem value="missed_checkout">Missed checkout</SelectItem>
                        <SelectItem value="overtime_threshold">Overtime threshold</SelectItem>
                        <SelectItem value="biometric_mismatch">Biometric mismatch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Severity</Label>
                    <Select value={ruleForm.severity} onValueChange={(v) => setRuleForm((p) => ({ ...p, severity: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Threshold (minutes)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={ruleForm.threshold_minutes}
                    onChange={(e) => setRuleForm((p) => ({ ...p, threshold_minutes: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <Label>Notify manager</Label>
                    <Switch
                      checked={ruleForm.notify_manager}
                      onCheckedChange={(v) => setRuleForm((p) => ({ ...p, notify_manager: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Notify HR</Label>
                    <Switch checked={ruleForm.notify_hr} onCheckedChange={(v) => setRuleForm((p) => ({ ...p, notify_hr: v }))} />
                  </div>
                </div>
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => void saveRule()} disabled={!ruleForm.name.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  Save rule
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Configured rules</CardTitle>
                <CardDescription>Toggle rules on or off without deleting them.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {rules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No rules yet. Create one to start monitoring exceptions.</p>
                ) : (
                  rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{rule.rule_name}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {(rule.alert_category || rule.rule_type || "attendance").replace(/_/g, " ")} · {rule.severity}
                          {rule.trigger_condition?.threshold_minutes != null
                            ? ` · ${rule.trigger_condition.threshold_minutes} min`
                            : ""}
                        </p>
                      </div>
                      <Switch checked={rule.is_active} onCheckedChange={() => void toggleRule(rule)} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
