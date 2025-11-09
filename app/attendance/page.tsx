"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  AlertTriangle,
  TrendingUp,
  Search,
  Download,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  Bell,
  BarChart3,
  UserCheck,
  UserX,
  Clock3,
  Clock4,
  Plus,
  RefreshCw,
  Zap,
  Brain,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  clock_in: string | null
  clock_out: string | null
  break_start: string | null
  break_end: string | null
  total_hours: number
  overtime_hours: number
  status: string
  notes: string | null
}

interface Employee {
  id: string
  employee_id: string
  full_name: string
  department: string
  position: string
  status: string
}

export default function AttendancePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")

  // Dashboard Stats
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    onBreak: 0,
    overtimeToday: 0,
    averageHours: 0,
  })

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0])

  // Attendance Records
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  // Clock In/Out Modal
  const [clockModalOpen, setClockModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [clockAction, setClockAction] = useState<"in" | "out" | "break-start" | "break-end">("in")
  const [clockNotes, setClockNotes] = useState("")
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Overtime Modal
  const [overtimeModalOpen, setOvertimeModalOpen] = useState(false)
  const [overtimeRecord, setOvertimeRecord] = useState<AttendanceRecord | null>(null)
  const [overtimeApproval, setOvertimeApproval] = useState<"approve" | "reject" | null>(null)
  const [overtimeReason, setOvertimeReason] = useState("")

  // AI Insights
  const [aiInsights, setAiInsights] = useState({
    riskEmployees: [] as string[],
    absenteeismTrend: "stable" as "up" | "down" | "stable",
    predictedAbsences: 0,
    fatigueAlerts: 0,
  })

  // Alerts
  const [alerts, setAlerts] = useState<
    Array<{
      id: string
      type: "warning" | "error" | "info"
      message: string
      timestamp: string
    }>
  >([])

  const [aiAnalytics, setAiAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadData()
    loadAIAnalytics()
    getGeolocation()

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadData()
      // Refresh AI analytics as well
      loadAIAnalytics()
    }, 30000)

    return () => clearInterval(interval)
  }, [dateFilter])

  const getGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.log("[v0] Geolocation error:", error)
        },
      )
    }
  }

  const loadAIAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const response = await fetch(`/api/attendance/analytics?days=30&type=all`)
      if (!response.ok) throw new Error("Failed to fetch analytics")

      const data = await response.json()
      setAiAnalytics(data)
    } catch (error) {
      console.error("[v0] Error loading AI analytics:", error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // Load employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active")

      if (employeesError) throw employeesError
      setEmployees(employeesData || [])

      // Load attendance records for today
      const { data: recordsData, error: recordsError } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("date", dateFilter)

      if (recordsError) throw recordsError
      setAttendanceRecords(recordsData || [])

      // Calculate stats
      const present = recordsData?.filter((r) => r.status === "present").length || 0
      const absent = (employeesData?.length || 0) - present
      const late =
        recordsData?.filter((r) => r.clock_in && new Date(`2000-01-01T${r.clock_in}`) > new Date("2000-01-01T09:00:00"))
          .length || 0
      const onBreak = recordsData?.filter((r) => r.break_start && !r.break_end).length || 0
      const totalOvertime = recordsData?.reduce((sum, r) => sum + (r.overtime_hours || 0), 0) || 0
      const avgHours =
        recordsData?.length > 0 ? recordsData.reduce((sum, r) => sum + (r.total_hours || 0), 0) / recordsData.length : 0

      setStats({
        totalPresent: present,
        totalAbsent: absent,
        totalLate: late,
        onBreak,
        overtimeToday: totalOvertime,
        averageHours: avgHours,
      })

      // Generate AI insights
      generateAIInsights(recordsData || [], employeesData || [])

      // Check for alerts
      checkForAlerts(recordsData || [])
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateAIInsights = (records: AttendanceRecord[], emps: Employee[]) => {
    // Simulate AI analysis
    const riskEmployees = records
      .filter((r) => (r.overtime_hours || 0) > 4 || !r.clock_in)
      .map((r) => r.employee_id)
      .slice(0, 5)

    const fatigueCount = records.filter((r) => (r.total_hours || 0) > 10).length

    setAiInsights({
      riskEmployees,
      absenteeismTrend: records.length < emps.length * 0.85 ? "up" : "stable",
      predictedAbsences: Math.floor(emps.length * 0.05),
      fatigueAlerts: fatigueCount,
    })
  }

  const checkForAlerts = (records: AttendanceRecord[]) => {
    const newAlerts = []

    // Check for missing clock-outs
    const missingClockOuts = records.filter((r) => r.clock_in && !r.clock_out)
    if (missingClockOuts.length > 0) {
      newAlerts.push({
        id: `alert-${Date.now()}-1`,
        type: "warning" as const,
        message: `${missingClockOuts.length} employees haven't clocked out yet`,
        timestamp: new Date().toISOString(),
      })
    }

    // Check for excessive overtime
    const excessiveOT = records.filter((r) => (r.overtime_hours || 0) > 4)
    if (excessiveOT.length > 0) {
      newAlerts.push({
        id: `alert-${Date.now()}-2`,
        type: "error" as const,
        message: `${excessiveOT.length} employees have excessive overtime (>4hrs)`,
        timestamp: new Date().toISOString(),
      })
    }

    setAlerts(newAlerts)
  }

  const handleClockAction = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Please select an employee",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const currentTime = new Date().toTimeString().split(" ")[0].slice(0, 5)

      // Check if record exists for today
      const { data: existingRecord, error: fetchError } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("employee_id", selectedEmployee)
        .eq("date", dateFilter)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError
      }

      if (existingRecord) {
        // Update existing record
        const updates: any = { notes: clockNotes }

        if (clockAction === "in") {
          updates.clock_in = currentTime
          updates.status = "present"
        } else if (clockAction === "out") {
          updates.clock_out = currentTime
          // Calculate total hours
          if (existingRecord.clock_in) {
            const clockIn = new Date(`2000-01-01T${existingRecord.clock_in}`)
            const clockOut = new Date(`2000-01-01T${currentTime}`)
            const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
            updates.total_hours = Math.round(hours * 100) / 100

            // Calculate overtime (>8 hours)
            if (hours > 8) {
              updates.overtime_hours = Math.round((hours - 8) * 100) / 100
            }
          }
        } else if (clockAction === "break-start") {
          updates.break_start = currentTime
        } else if (clockAction === "break-end") {
          updates.break_end = currentTime
        }

        const { error: updateError } = await supabase
          .from("attendance_records")
          .update(updates)
          .eq("id", existingRecord.id)

        if (updateError) throw updateError
      } else {
        // Create new record
        const { error: insertError } = await supabase.from("attendance_records").insert({
          employee_id: selectedEmployee,
          date: dateFilter,
          clock_in: clockAction === "in" ? currentTime : null,
          status: clockAction === "in" ? "present" : "absent",
          notes: clockNotes,
        })

        if (insertError) throw insertError
      }

      toast({
        title: "Success",
        description: `Clock ${clockAction} recorded successfully`,
      })

      setClockModalOpen(false)
      setSelectedEmployee("")
      setClockNotes("")
      loadData()
    } catch (error) {
      console.error("[v0] Error recording clock action:", error)
      toast({
        title: "Error",
        description: "Failed to record clock action",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOvertimeAction = async () => {
    if (!overtimeRecord || !overtimeApproval) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("attendance_records")
        .update({
          notes: overtimeReason
            ? `${overtimeRecord.notes || ""}\nOT ${overtimeApproval}d: ${overtimeReason}`
            : overtimeRecord.notes,
        })
        .eq("id", overtimeRecord.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `Overtime ${overtimeApproval}d successfully`,
      })

      setOvertimeModalOpen(false)
      setOvertimeRecord(null)
      setOvertimeApproval(null)
      setOvertimeReason("")
      loadData()
    } catch (error) {
      console.error("[v0] Error processing overtime:", error)
      toast({
        title: "Error",
        description: "Failed to process overtime",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportAttendanceData = () => {
    // Convert records to CSV
    const csv = [
      ["Employee ID", "Date", "Clock In", "Clock Out", "Total Hours", "Overtime", "Status", "Notes"].join(","),
      ...attendanceRecords.map((r) =>
        [
          r.employee_id,
          r.date,
          r.clock_in || "",
          r.clock_out || "",
          r.total_hours || 0,
          r.overtime_hours || 0,
          r.status,
          r.notes || "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-${dateFilter}.csv`
    a.click()

    toast({
      title: "Success",
      description: "Attendance data exported successfully",
    })
  }

  const filteredRecords = attendanceRecords.filter((record) => {
    const employee = employees.find((e) => e.id === record.employee_id)
    if (!employee) return false

    const matchesSearch =
      employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter
    const matchesStatus = statusFilter === "all" || record.status === statusFilter

    return matchesSearch && matchesDepartment && matchesStatus
  })

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">Monitor and manage employee attendance in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Dialog open={clockModalOpen} onOpenChange={setClockModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Quick Clock-In
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Attendance</DialogTitle>
                <DialogDescription>Clock in/out or record break times for employees</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name} ({emp.employee_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Action</Label>
                  <Select value={clockAction} onValueChange={(val: any) => setClockAction(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Clock In</SelectItem>
                      <SelectItem value="out">Clock Out</SelectItem>
                      <SelectItem value="break-start">Break Start</SelectItem>
                      <SelectItem value="break-end">Break End</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {geoLocation && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      Location: {geoLocation.lat.toFixed(4)}, {geoLocation.lng.toFixed(4)}
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any notes..."
                    value={clockNotes}
                    onChange={(e) => setClockNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setClockModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleClockAction} disabled={loading}>
                  {loading ? "Recording..." : "Record"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border",
                alert.type === "error" && "bg-destructive/10 border-destructive",
                alert.type === "warning" && "bg-amber-500/10 border-amber-500",
                alert.type === "info" && "bg-blue-500/10 border-blue-500",
              )}
            >
              <Bell className="h-5 w-5" />
              <div className="flex-1">
                <p className="font-medium">{alert.message}</p>
                <p className="text-sm text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPresent}</div>
            <p className="text-xs text-muted-foreground">
              {employees.length > 0
                ? `${Math.round((stats.totalPresent / employees.length) * 100)}% attendance`
                : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAbsent}</div>
            <p className="text-xs text-muted-foreground">Unaccounted employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock3 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLate}</div>
            <p className="text-xs text-muted-foreground">After 9:00 AM</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">On Break</CardTitle>
            <Clock4 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onBreak}</div>
            <p className="text-xs text-muted-foreground">Currently away</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overtime</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overtimeToday.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Total today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Hours</CardTitle>
            <BarChart3 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Per employee</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="overtime">Overtime</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Overview</CardTitle>
                <CardDescription>Real-time attendance statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Present Rate</span>
                    <span className="text-sm font-medium">
                      {employees.length > 0 ? Math.round((stats.totalPresent / employees.length) * 100) : 0}%
                    </span>
                  </div>
                  <Progress
                    value={employees.length > 0 ? (stats.totalPresent / employees.length) * 100 : 0}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">On-Time Rate</span>
                    <span className="text-sm font-medium">
                      {stats.totalPresent > 0
                        ? Math.round(((stats.totalPresent - stats.totalLate) / stats.totalPresent) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      stats.totalPresent > 0 ? ((stats.totalPresent - stats.totalLate) / stats.totalPresent) * 100 : 0
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest clock-in events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceRecords.slice(0, 5).map((record) => {
                    const employee = employees.find((e) => e.id === record.employee_id)
                    return (
                      <div key={record.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              record.status === "present" ? "bg-green-500" : "bg-red-500",
                            )}
                          />
                          <div>
                            <p className="text-sm font-medium">{employee?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{employee?.department || "N/A"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{record.clock_in || "Not clocked in"}</p>
                          <p className="text-xs text-muted-foreground">
                            {record.total_hours ? `${record.total_hours.toFixed(1)}h` : "In progress"}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Records Tab */}
        <TabsContent value="records" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or ID..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-[150px]">
                  <Label>Date</Label>
                  <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                </div>
                <div className="w-[150px]">
                  <Label>Department</Label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[150px]">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={exportAttendanceData}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                Showing {filteredRecords.length} of {attendanceRecords.length} records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Overtime</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const employee = employees.find((e) => e.id === record.employee_id)
                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{employee?.full_name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{employee?.employee_id || "N/A"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{employee?.department || "N/A"}</TableCell>
                        <TableCell>{record.clock_in || "-"}</TableCell>
                        <TableCell>{record.clock_out || "-"}</TableCell>
                        <TableCell>{record.total_hours ? `${record.total_hours.toFixed(1)}h` : "-"}</TableCell>
                        <TableCell>
                          {record.overtime_hours ? (
                            <Badge variant="secondary">{record.overtime_hours.toFixed(1)}h</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.status === "present"
                                ? "default"
                                : record.status === "late"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overtime Tab */}
        <TabsContent value="overtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overtime Management</CardTitle>
              <CardDescription>Review and approve overtime requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Overtime Hours</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Fatigue Risk</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords
                    .filter((r) => (r.overtime_hours || 0) > 0)
                    .map((record) => {
                      const employee = employees.find((e) => e.id === record.employee_id)
                      const fatigueRisk =
                        (record.total_hours || 0) > 10 ? "high" : (record.total_hours || 0) > 8 ? "medium" : "low"
                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{employee?.full_name || "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">{employee?.employee_id || "N/A"}</p>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{record.overtime_hours?.toFixed(1)}h</Badge>
                          </TableCell>
                          <TableCell>{record.total_hours?.toFixed(1)}h</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                fatigueRisk === "high"
                                  ? "destructive"
                                  : fatigueRisk === "medium"
                                    ? "secondary"
                                    : "default"
                              }
                            >
                              {fatigueRisk}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setOvertimeRecord(record)
                                  setOvertimeApproval("approve")
                                  setOvertimeModalOpen(true)
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setOvertimeRecord(record)
                                  setOvertimeApproval("reject")
                                  setOvertimeModalOpen(true)
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={overtimeModalOpen} onOpenChange={setOvertimeModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{overtimeApproval === "approve" ? "Approve" : "Reject"} Overtime</DialogTitle>
                <DialogDescription>Provide a reason for your decision</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter reason..."
                  value={overtimeReason}
                  onChange={(e) => setOvertimeReason(e.target.value)}
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOvertimeModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleOvertimeAction}
                  disabled={loading}
                  variant={overtimeApproval === "approve" ? "default" : "destructive"}
                >
                  {loading ? "Processing..." : overtimeApproval === "approve" ? "Approve" : "Reject"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-4">
          {analyticsLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="ml-3 text-muted-foreground">Loading AI analytics...</p>
                </div>
              </CardContent>
            </Card>
          ) : aiAnalytics ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      Absenteeism Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Trend</span>
                      <Badge
                        variant={
                          aiAnalytics.absenteeismTrends.trend === "increasing"
                            ? "destructive"
                            : aiAnalytics.absenteeismTrends.trend === "decreasing"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {aiAnalytics.absenteeismTrends.trend}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Weekly Rate</span>
                      <span className="font-bold">{aiAnalytics.absenteeismTrends.weeklyRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly Rate</span>
                      <span className="font-bold">{aiAnalytics.absenteeismTrends.monthlyRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Change</span>
                      <Badge
                        variant={
                          Number.parseFloat(aiAnalytics.absenteeismTrends.change) > 0 ? "destructive" : "default"
                        }
                      >
                        {aiAnalytics.absenteeismTrends.change}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-amber-500" />
                      Predictive Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tomorrow</span>
                      <Badge variant="secondary">{aiAnalytics.predictiveAbsences.tomorrow} absences</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Next Week</span>
                      <Badge variant="secondary">{aiAnalytics.predictiveAbsences.nextWeek} absences</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Confidence</span>
                      <span className="font-bold">{aiAnalytics.predictiveAbsences.confidence.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pattern</span>
                      <Badge>{aiAnalytics.predictiveAbsences.pattern}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Fatigue Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">High Risk</span>
                      <Badge variant="destructive">{aiAnalytics.fatigueAnalysis.highRisk.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Medium Risk</span>
                      <Badge variant="secondary">{aiAnalytics.fatigueAnalysis.mediumRisk.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Low Risk</span>
                      <Badge variant="default">{aiAnalytics.fatigueAnalysis.lowRisk.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total At Risk</span>
                      <span className="font-bold">{aiAnalytics.fatigueAnalysis.totalAtRisk}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Department Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Performance</CardTitle>
                  <CardDescription>Attendance metrics by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead>Attendance Rate</TableHead>
                        <TableHead>Avg Hours</TableHead>
                        <TableHead>Total Overtime</TableHead>
                        <TableHead>Employees</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aiAnalytics.departmentPatterns.map((dept: any) => (
                        <TableRow key={dept.department}>
                          <TableCell className="font-medium">{dept.department}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                Number.parseFloat(dept.attendanceRate) > 90
                                  ? "default"
                                  : Number.parseFloat(dept.attendanceRate) > 80
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {dept.attendanceRate}%
                            </Badge>
                          </TableCell>
                          <TableCell>{dept.avgHours}h</TableCell>
                          <TableCell>{dept.totalOvertime}h</TableCell>
                          <TableCell>{dept.employeeCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Risk Employees */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Employees</CardTitle>
                  <CardDescription>Employees requiring attention based on AI analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiAnalytics.riskEmployees.slice(0, 8).map((risk: any) => {
                      const employee = employees.find((e) => e.id === risk.employeeId)
                      return (
                        <div key={risk.employeeId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{employee?.full_name || "Unknown Employee"}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {risk.reasons.map((reason: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={
                                risk.riskScore > 7 ? "destructive" : risk.riskScore > 4 ? "secondary" : "default"
                              }
                            >
                              Risk: {risk.riskScore}
                            </Badge>
                            <Button variant="outline" size="sm">
                              Contact
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* AI Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Recommendations</CardTitle>
                  <CardDescription>Actionable insights based on attendance patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aiAnalytics.recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Zap
                              className={cn(
                                "h-5 w-5 mt-0.5",
                                rec.priority === "high"
                                  ? "text-red-500"
                                  : rec.priority === "medium"
                                    ? "text-amber-500"
                                    : "text-green-500",
                              )}
                            />
                            <div>
                              <h4 className="font-semibold">{rec.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              rec.priority === "high"
                                ? "destructive"
                                : rec.priority === "medium"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        <div className="ml-8 space-y-1">
                          <p className="text-sm font-medium">Suggested Actions:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {rec.actions.map((action: string, actionIdx: number) => (
                              <li key={actionIdx} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Overtime Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>Overtime Analysis</CardTitle>
                  <CardDescription>Overtime trends and patterns</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Total Overtime</Label>
                      <p className="text-2xl font-bold">{aiAnalytics.overtimePatterns.totalOvertime}h</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Daily Average</Label>
                      <p className="text-2xl font-bold">{aiAnalytics.overtimePatterns.avgDailyOvertime}h</p>
                    </div>
                  </div>
                  <div>
                    <Label>Top Overtime Employees</Label>
                    <div className="mt-2 space-y-2">
                      {aiAnalytics.overtimePatterns.topEmployees.map((emp: any) => {
                        const employee = employees.find((e) => e.id === emp.employeeId)
                        return (
                          <div key={emp.employeeId} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm font-medium">{employee?.full_name || "Unknown"}</span>
                            <div className="flex items-center gap-3 text-sm">
                              <span>{emp.totalOT.toFixed(1)}h total</span>
                              <Badge variant="secondary">{emp.frequency} days</Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
                <p className="text-sm text-muted-foreground mb-4">Load data to generate AI insights</p>
                <Button onClick={loadAIAnalytics}>Generate Analytics</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Shifts Tab */}
        <TabsContent value="shifts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shift Management</CardTitle>
              <CardDescription>Manage employee shifts and schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Shift management coming soon</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create and manage shifts, assign employees, and track coverage
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Shift Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Settings</CardTitle>
              <CardDescription>Configure attendance tracking preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Clock-Out</Label>
                    <p className="text-sm text-muted-foreground">Automatically clock out employees at end of day</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Geolocation Verification</Label>
                    <p className="text-sm text-muted-foreground">Require location verification for clock-in/out</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Break Reminders</Label>
                    <p className="text-sm text-muted-foreground">Send notifications for scheduled breaks</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Overtime Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notify managers when overtime exceeds threshold</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Grace Period (minutes)</Label>
                  <Input type="number" defaultValue="15" />
                  <p className="text-sm text-muted-foreground">Late arrival grace period before marking as late</p>
                </div>
                <div className="space-y-2">
                  <Label>Overtime Threshold (hours)</Label>
                  <Input type="number" defaultValue="8" />
                  <p className="text-sm text-muted-foreground">Hours after which overtime calculation begins</p>
                </div>
                <div className="space-y-2">
                  <Label>Work Week Start</Label>
                  <Select defaultValue="monday">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">Sunday</SelectItem>
                      <SelectItem value="monday">Monday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline">Reset</Button>
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
