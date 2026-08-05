"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Fingerprint,
  Loader2,
  MapPinned,
  Plus,
  RefreshCw,
  Search,
  Timer,
  Trash2,
  Upload,
  UserCheck,
  Users,
  Wifi,
  XCircle,
} from "lucide-react"
import { AttendanceClockPanel } from "@/components/attendance/clock-panel"
import { GeofencePanel } from "@/components/attendance/geofence-panel"
import { ShiftAssignPanel } from "@/components/attendance/shift-assign-panel"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

type AttendanceRecord = {
  id: string
  employee_id: string
  employee_name?: string
  employee_code?: string
  department?: string
  date: string
  clock_in?: string | null
  clock_out?: string | null
  total_hours?: number
  overtime_hours?: number
  status: string
  source?: string
  notes?: string | null
}

type Employee = {
  id: string
  first_name?: string
  last_name?: string
  employee_id?: string
  department?: string
}

const STATUS_COLORS: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-800",
  late: "bg-amber-100 text-amber-900",
  absent: "bg-red-100 text-red-800",
  half_day: "bg-sky-100 text-sky-800",
  leave: "bg-violet-100 text-violet-800",
}

const CHART_COLORS = ["#0d9488", "#f59e0b", "#ef4444", "#38bdf8", "#8b5cf6"]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function empName(e: Employee) {
  return `${e.first_name || ""} ${e.last_name || ""}`.trim() || e.employee_id || "Employee"
}

export default function AttendancePage() {
  const [tab, setTab] = useState("overview")
  const [from, setFrom] = useState(today())
  const [to, setTo] = useState(today())
  const [status, setStatus] = useState("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<any>({})
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [busy, setBusy] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Manual mark dialog
  const [markOpen, setMarkOpen] = useState(false)
  const [markForm, setMarkForm] = useState({
    employee_id: "",
    date: today(),
    clock_in: "08:00",
    clock_out: "17:00",
    notes: "",
  })

  // Import
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importDeviceId, setImportDeviceId] = useState<string>("none")

  // Shift / device dialogs
  const [shiftOpen, setShiftOpen] = useState(false)
  const [shiftForm, setShiftForm] = useState({
    name: "",
    start_time: "08:00",
    end_time: "17:00",
    grace_period_minutes: 15,
    break_duration_minutes: 60,
  })
  const [deviceOpen, setDeviceOpen] = useState(false)
  const [deviceForm, setDeviceForm] = useState({
    name: "",
    type: "fingerprint",
    location: "",
    serial_number: "",
    ip_address: "",
    api_base_url: "",
    api_key: "",
    sync_path: "/api/punches",
  })

  const loadAttendance = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ from, to, status, search })
      const res = await fetch(`/api/attendance?${qs}`, { credentials: "include", cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to load attendance")
      setRecords(data.records || [])
      setStats(data.stats || {})
      setEmployees(data.employees || [])
    } catch (err) {
      toast({
        title: "Attendance load failed",
        description: err instanceof Error ? err.message : "Could not load records",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [from, to, status, search])

  const loadMeta = useCallback(async () => {
    try {
      const [sRes, dRes] = await Promise.all([
        fetch("/api/attendance/shifts", { credentials: "include", cache: "no-store" }),
        fetch("/api/attendance/devices", { credentials: "include", cache: "no-store" }),
      ])
      const sData = await sRes.json().catch(() => ({}))
      const dData = await dRes.json().catch(() => ({}))
      setShifts(sData.shifts || [])
      setDevices(dData.devices || [])
    } catch {
      /* optional */
    }
  }, [])

  useEffect(() => {
    void loadAttendance()
  }, [loadAttendance])

  useEffect(() => {
    void loadMeta()
  }, [loadMeta])

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const qs = new URLSearchParams({ from, to })
      const res = await fetch(`/api/attendance/analytics?${qs}`, {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to load analytics")
      setAnalytics(data)
    } catch (err) {
      toast({
        title: "Analytics failed",
        description: err instanceof Error ? err.message : "Could not load",
        variant: "destructive",
      })
    } finally {
      setAnalyticsLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    if (tab === "analytics") void loadAnalytics()
  }, [tab, loadAnalytics])

  const chartData = useMemo(
    () => [
      { name: "Present", value: Number(stats.present || 0) },
      { name: "Late", value: Number(stats.late || 0) },
      { name: "Absent", value: Number(stats.absent || 0) },
      { name: "Half day", value: Number(stats.half_day || 0) },
      { name: "Leave", value: Number(stats.leave || 0) },
    ],
    [stats],
  )

  const hoursByDept = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of records) {
      const dept = r.department || "General"
      map.set(dept, (map.get(dept) || 0) + Number(r.total_hours || 0))
    }
    return [...map.entries()].map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
  }, [records])

  const saveManual = async () => {
    if (!markForm.employee_id) {
      toast({ title: "Select an employee", variant: "destructive" })
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...markForm,
          // Status is auto-detected from assigned shift + grace (present / late / half_day)
          auto_detect_status: true,
          status: markForm.clock_in ? "present" : "absent",
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Save failed")
      const st = data.record?.status || data.status || "saved"
      toast({
        title: "Attendance saved",
        description: `Status set to ${st} from shift late rules.`,
      })
      setMarkOpen(false)
      await loadAttendance()
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Could not save",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const runImport = async () => {
    if (!importFile) {
      toast({ title: "Choose a CSV file", variant: "destructive" })
      return
    }
    setBusy(true)
    try {
      const form = new FormData()
      form.append("file", importFile)
      if (importDeviceId && importDeviceId !== "none") form.append("device_id", importDeviceId)
      const res = await fetch("/api/attendance/import", {
        method: "POST",
        credentials: "include",
        body: form,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Import failed")
      toast({
        title: "Import complete",
        description: `Imported ${data.imported || 0} of ${data.totalParsed || 0} rows.`,
      })
      setImportFile(null)
      await loadAttendance()
      await loadMeta()
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Could not import",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const saveShift = async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/attendance/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(shiftForm),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed")
      toast({ title: "Shift saved" })
      setShiftOpen(false)
      setShiftForm({
        name: "",
        start_time: "08:00",
        end_time: "17:00",
        grace_period_minutes: 15,
        break_duration_minutes: 60,
      })
      await loadMeta()
    } catch (err) {
      toast({
        title: "Shift save failed",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const saveDevice = async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/attendance/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(deviceForm),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed")
      toast({
        title: "Device registered",
        description: data.webhookPath
          ? `Online sync ready. Webhook: ${data.webhookPath}`
          : "Device saved. Add an API base URL for pull sync.",
      })
      setDeviceOpen(false)
      setDeviceForm({
        name: "",
        type: "fingerprint",
        location: "",
        serial_number: "",
        ip_address: "",
        api_base_url: "",
        api_key: "",
        sync_path: "/api/punches",
      })
      await loadMeta()
    } catch (err) {
      toast({
        title: "Device save failed",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const syncDevice = async (id: string) => {
    setBusy(true)
    try {
      const res = await fetch("/api/attendance/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "sync", id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Sync failed")
      toast({
        title: data.imported ? `Synced ${data.imported} punch(es)` : "Sync finished",
        description:
          data.message ||
          (data.imported
            ? "Attendance updated from device."
            : "No new punches. Set API base URL for pull sync, or POST punches to the device webhook."),
      })
      await loadMeta()
    } catch (err) {
      toast({
        title: "Sync failed",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const deactivateShift = async (id: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/attendance/shifts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to deactivate shift")
      toast({ title: "Shift deactivated" })
      await loadMeta()
    } catch (err) {
      toast({
        title: "Deactivate failed",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const deactivateDevice = async (id: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/attendance/devices?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to deactivate device")
      toast({ title: "Device deactivated" })
      await loadMeta()
    } catch (err) {
      toast({
        title: "Deactivate failed",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const generateOt = async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/attendance/generate-overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ from, to }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed")
      toast({
        title: "Overtime generated",
        description: `Created ${data.created || 0} request(s); skipped ${data.skipped || 0}.`,
      })
    } catch (err) {
      toast({
        title: "Overtime generation failed",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const exportCsv = () => {
    const headers = [
      "Employee",
      "Code",
      "Department",
      "Date",
      "Clock In",
      "Clock Out",
      "Hours",
      "OT",
      "Status",
      "Source",
    ]
    const rows = records.map((r) => [
      r.employee_name,
      r.employee_code,
      r.department,
      r.date,
      r.clock_in,
      r.clock_out,
      r.total_hours,
      r.overtime_hours,
      r.status,
      r.source,
    ])
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c ?? "")}"`).join(",")).join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = `attendance-${from}-${to}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Modern time tracking — manual marks, biometric CSV import, shifts, and overtime from worked hours.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/app/manager">
              <Users className="mr-2 h-4 w-4" />
              Manager approvals
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/attendance/alerts">
              <Bell className="mr-2 h-4 w-4" />
              Alerts
            </Link>
          </Button>
          <Button variant="outline" onClick={() => void loadAttendance()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setMarkOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Mark attendance
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Present", value: stats.present || 0, icon: UserCheck, tone: "text-emerald-600 bg-emerald-50" },
          { label: "Late", value: stats.late || 0, icon: Clock3, tone: "text-amber-600 bg-amber-50" },
          { label: "Absent", value: stats.absent || 0, icon: XCircle, tone: "text-red-600 bg-red-50" },
          { label: "On leave", value: stats.leave || 0, icon: CalendarDays, tone: "text-violet-600 bg-violet-50" },
          { label: "OT hours", value: stats.overtimeHours || 0, icon: Timer, tone: "text-teal-700 bg-teal-50" },
        ].map((k) => {
          const Icon = k.icon
          return (
            <Card key={k.label} className="shadow-sm">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-2xl font-bold">{k.value}</p>
                </div>
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${k.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="shadow-sm">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="half_day">Half day</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search employee or department"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clock">GPS clock</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="import">Biometric import</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="assign">Assign shifts</TabsTrigger>
          <TabsTrigger value="geofences">Geofences</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Attendance mix</CardTitle>
                <CardDescription>Status distribution for the selected period</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                      {chartData.map((entry, idx) => (
                        <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Hours by department</CardTitle>
                <CardDescription>Total worked hours in period</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                {hoursByDept.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hoursByDept}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#0d9488" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No hours recorded yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Overtime from attendance</CardTitle>
                <CardDescription>
                  Create overtime approval requests from recorded OT hours in this date range.
                </CardDescription>
              </div>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => void generateOt()} disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Timer className="mr-2 h-4 w-4" />}
                Generate OT requests
              </Button>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="clock" className="space-y-4">
          <AttendanceClockPanel employees={employees} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">Attendance analytics</h2>
              <p className="text-sm text-muted-foreground">
                Punctuality, absenteeism, department mix, and OT leaders for the selected period.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => void loadAnalytics()} disabled={analyticsLoading}>
                {analyticsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh analytics
              </Button>
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => {
                  const qs = new URLSearchParams({ from, to })
                  window.open(`/api/attendance/analytics/pdf?${qs}`, "_blank", "noopener,noreferrer")
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export HR PDF pack
              </Button>
            </div>
          </div>

          {analyticsLoading && !analytics ? (
            <div className="flex items-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading analytics…
            </div>
          ) : analytics ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Attendance rate", value: `${analytics.kpis?.attendance_rate ?? 0}%` },
                  { label: "Punctuality", value: `${analytics.kpis?.punctuality_rate ?? 0}%` },
                  { label: "Absenteeism", value: `${analytics.kpis?.absenteeism_rate ?? 0}%` },
                  { label: "OT hours", value: analytics.kpis?.overtime_hours ?? 0 },
                ].map((k) => (
                  <Card key={k.label} className="shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">{k.label}</p>
                      <p className="text-2xl font-bold">{k.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Daily trend</CardTitle>
                    <CardDescription>Present / late / absent over the period</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    {analytics.trend?.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.trend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="present" stackId="a" fill="#0d9488" />
                          <Bar dataKey="late" stackId="a" fill="#f59e0b" />
                          <Bar dataKey="absent" stackId="a" fill="#ef4444" />
                          <Bar dataKey="leave" stackId="a" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No trend data
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">By department</CardTitle>
                    <CardDescription>Hours and punctuality</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    {analytics.departments?.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.departments}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="hours" fill="#0d9488" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="overtime" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No department data
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Most late</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(analytics.top_late || []).length === 0 && (
                      <p className="text-sm text-muted-foreground">No late marks in period.</p>
                    )}
                    {(analytics.top_late || []).map((e: any) => (
                      <div key={e.employee_id} className="flex justify-between text-sm">
                        <span className="truncate">{e.employee_name}</span>
                        <span className="font-medium text-amber-700">{e.late}×</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Top overtime</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(analytics.top_overtime || []).length === 0 && (
                      <p className="text-sm text-muted-foreground">No OT hours in period.</p>
                    )}
                    {(analytics.top_overtime || []).map((e: any) => (
                      <div key={e.employee_id} className="flex justify-between text-sm">
                        <span className="truncate">{e.employee_name}</span>
                        <span className="font-medium text-teal-700">{e.overtime}h</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Most absent</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(analytics.top_absent || []).length === 0 && (
                      <p className="text-sm text-muted-foreground">No absences in period.</p>
                    )}
                    {(analytics.top_absent || []).map((e: any) => (
                      <div key={e.employee_id} className="flex justify-between text-sm">
                        <span className="truncate">{e.employee_name}</span>
                        <span className="font-medium text-red-700">{e.absent}×</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Select a date range and refresh to load analytics.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="records">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Attendance register</CardTitle>
              <CardDescription>Database-backed punches and status marks</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : records.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>In</TableHead>
                        <TableHead>Out</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>OT</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div className="font-medium">{r.employee_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {r.employee_code} · {r.department || "—"}
                            </div>
                          </TableCell>
                          <TableCell>{r.date}</TableCell>
                          <TableCell>{r.clock_in || "—"}</TableCell>
                          <TableCell>{r.clock_out || "—"}</TableCell>
                          <TableCell>{r.total_hours ?? "—"}</TableCell>
                          <TableCell>{r.overtime_hours ?? "—"}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[r.status] || "bg-slate-100 text-slate-700"}>
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize text-xs">{r.source || "manual"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No attendance rows for this period. Mark attendance or import a biometric CSV.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Fingerprint className="h-4 w-4 text-teal-700" />
                Biometric / manual CSV upload
              </CardTitle>
              <CardDescription>
                Upload marked attendance from your biometric device export or a manual spreadsheet. Columns:
                employee_code (or email), date, clock_in, clock_out, status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>CSV file</Label>
                  <Input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div>
                  <Label>Link to device (optional)</Label>
                  <Select value={importDeviceId} onValueChange={setImportDeviceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {devices.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => void runImport()} disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload & sync to database
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assign" className="space-y-4">
          <ShiftAssignPanel employees={employees} shifts={shifts} />
        </TabsContent>

        <TabsContent value="geofences" className="space-y-4">
          <GeofencePanel />
        </TabsContent>

        <TabsContent value="shifts" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPinned className="h-3.5 w-3.5" />
              Shift start + grace drives late detection once assigned to employees.
            </p>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setShiftOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New shift
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shifts.filter((s) => s.is_active !== false).map((s) => (
              <Card key={s.id} className="shadow-sm">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{s.name}</p>
                    <Badge variant="outline">{s.is_active === false ? "Inactive" : "Active"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {String(s.start_time).slice(0, 5)} – {String(s.end_time).slice(0, 5)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Grace {s.grace_period_minutes ?? 15} min · Break {s.break_duration_minutes ?? 60} min
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700"
                    disabled={busy}
                    onClick={() => void deactivateShift(s.id)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Deactivate
                  </Button>
                </CardContent>
              </Card>
            ))}
            {!shifts.length ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No shifts yet. Create day/night shifts for late detection.
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground max-w-2xl">
              Register devices with an <strong>API base URL</strong> for online pull, or use the webhook token to push
              punches in real time. CSV import remains available as a fallback.
            </p>
            <Button className="bg-teal-600 hover:bg-teal-700 shrink-0" onClick={() => setDeviceOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Register device
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {devices.filter((d) => d.is_active !== false).map((d) => (
              <Card key={d.id} className="shadow-sm">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {d.type} · {d.location || "No location"}
                      </p>
                    </div>
                    <Badge className={d.status === "online" ? "bg-emerald-100 text-emerald-800" : d.status === "error" ? "bg-rose-100 text-rose-800" : "bg-slate-100"}>
                      <Wifi className="mr-1 h-3 w-3" />
                      {d.status || "online"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Last sync: {d.last_sync ? new Date(d.last_sync).toLocaleString() : "Never"}
                    {d.last_sync_count != null ? ` · ${d.last_sync_count} punches` : ""}
                  </p>
                  {d.api_base_url ? (
                    <p className="truncate text-[11px] text-teal-800">Pull: {d.api_base_url}</p>
                  ) : d.webhook_token ? (
                    <p className="truncate text-[11px] text-slate-600">
                      Webhook: /api/attendance/devices/webhook?token=…{String(d.webhook_token).slice(-6)}
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-800">Add API URL for online pull, or re-save to mint a webhook token.</p>
                  )}
                  {d.last_sync_error ? (
                    <p className="text-[11px] text-rose-700 line-clamp-2">{d.last_sync_error}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => void syncDevice(d.id)} disabled={busy}>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Sync now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700"
                      onClick={() => void deactivateDevice(d.id)}
                      disabled={busy}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Deactivate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!devices.length ? (
              <Card className="md:col-span-2 xl:col-span-3">
                <CardContent className="py-10 text-center text-sm text-muted-foreground space-y-2">
                  <p>Register fingerprint, face, or card devices for online sync.</p>
                  <p className="text-xs">
                    Prefer <strong>API base URL</strong> (cloud/ADMS) for Sync now pull, or configure the vendor to{" "}
                    <strong>POST punches</strong> to the device webhook. CSV via <strong>Biometric import</strong> still works offline.
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>

      {/* Manual mark */}
      <Dialog open={markOpen} onOpenChange={setMarkOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Mark attendance</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Employee</Label>
              <Select
                value={markForm.employee_id}
                onValueChange={(v) => setMarkForm((f) => ({ ...f, employee_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {empName(e)} {e.employee_id ? `(${e.employee_id})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={markForm.date}
                  onChange={(e) => setMarkForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="rounded-md border border-teal-100 bg-teal-50/50 px-3 py-2 text-xs text-teal-900">
                Status is automatic: <strong>Present</strong> if on time vs assigned shift,{" "}
                <strong>Late</strong> after grace, <strong>Leave</strong> when on approved leave.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Clock in</Label>
                <Input
                  type="time"
                  value={markForm.clock_in}
                  onChange={(e) => setMarkForm((f) => ({ ...f, clock_in: e.target.value }))}
                />
              </div>
              <div>
                <Label>Clock out</Label>
                <Input
                  type="time"
                  value={markForm.clock_out}
                  onChange={(e) => setMarkForm((f) => ({ ...f, clock_out: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={markForm.notes}
                onChange={(e) => setMarkForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => void saveManual()} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Save to database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shift dialog */}
      <Dialog open={shiftOpen} onOpenChange={setShiftOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create shift</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Name</Label>
              <Input value={shiftForm.name} onChange={(e) => setShiftForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start</Label>
                <Input
                  type="time"
                  value={shiftForm.start_time}
                  onChange={(e) => setShiftForm((f) => ({ ...f, start_time: e.target.value }))}
                />
              </div>
              <div>
                <Label>End</Label>
                <Input
                  type="time"
                  value={shiftForm.end_time}
                  onChange={(e) => setShiftForm((f) => ({ ...f, end_time: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShiftOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => void saveShift()} disabled={busy}>
              Save shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Device dialog */}
      <Dialog open={deviceOpen} onOpenChange={setDeviceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register biometric device</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Name</Label>
              <Input value={deviceForm.name} onChange={(e) => setDeviceForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={deviceForm.type} onValueChange={(v) => setDeviceForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fingerprint">Fingerprint</SelectItem>
                  <SelectItem value="face">Face</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="web">Web clock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={deviceForm.location}
                onChange={(e) => setDeviceForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Serial</Label>
                <Input
                  value={deviceForm.serial_number}
                  onChange={(e) => setDeviceForm((f) => ({ ...f, serial_number: e.target.value }))}
                />
              </div>
              <div>
                <Label>IP (optional LAN)</Label>
                <Input
                  value={deviceForm.ip_address}
                  onChange={(e) => setDeviceForm((f) => ({ ...f, ip_address: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>API base URL (online pull)</Label>
              <Input
                placeholder="https://device-cloud.example.com"
                value={deviceForm.api_base_url}
                onChange={(e) => setDeviceForm((f) => ({ ...f, api_base_url: e.target.value }))}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Sync now will GET {"{base}"}
                {deviceForm.sync_path || "/api/punches"}?since=…
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>API key</Label>
                <Input
                  value={deviceForm.api_key}
                  onChange={(e) => setDeviceForm((f) => ({ ...f, api_key: e.target.value }))}
                  placeholder="Bearer / X-API-Key"
                />
              </div>
              <div>
                <Label>Sync path</Label>
                <Input
                  value={deviceForm.sync_path}
                  onChange={(e) => setDeviceForm((f) => ({ ...f, sync_path: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeviceOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => void saveDevice()} disabled={busy}>
              Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
