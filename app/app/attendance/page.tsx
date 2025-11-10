"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Clock,
  Download,
  Filter,
  Users,
  UserX,
  AlertCircle,
  TrendingUp,
  Fingerprint,
  Plus,
  RefreshCw,
  Settings,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  clockIn,
  clockOut,
  getAttendanceRecords,
  getCompanyInfo,
  getOvertimeRequests,
  getBiometricDevices,
  syncBiometricDevice,
  addBiometricDevice,
  getShifts, // Import getShifts
  createShift, // Import createShift
  approveOvertimeRequest, // Import approveOvertimeRequest
  rejectOvertimeRequest, // Import rejectOvertimeRequest
  getEmployeeAttendanceStatus, // Import getEmployeeAttendanceStatus
} from "@/app/actions/attendance"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [companyInfo, setCompanyInfo] = useState<any>(null)
  const { toast } = useToast()

  const [currentTime, setCurrentTime] = useState(new Date())

  // Date filters
  const [dateFilter, setDateFilter] = useState("today")
  const [customStartDate, setCustomStartDate] = useState<Date>()
  const [customEndDate, setCustomEndDate] = useState<Date>()

  // Search filters
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [divisionFilter, setDivisionFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [departments, setDepartments] = useState<string[]>([])
  const [divisions, setDivisions] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])

  const [overtimeRequests, setOvertimeRequests] = useState<any[]>([])
  const [biometricDevices, setBiometricDevices] = useState<any[]>([])
  const [showDeviceDialog, setShowDeviceDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Shift management
  const [shifts, setShifts] = useState<any[]>([])
  const [showShiftDialog, setShowShiftDialog] = useState(false)
  const [editingShift, setEditingShift] = useState<any>(null)

  // Stats
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    overtime: 0,
    totalHours: 0,
    overtimePending: 0,
    devicesOnline: 0,
    devicesTotal: 0,
  })

  // AI Insights
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [aiInsights, setAIInsights] = useState<any>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [selectedEmployeeForAI, setSelectedEmployeeForAI] = useState<string | null>(null)

  const [attendanceStatus, setAttendanceStatus] = useState<"not_clocked_in" | "clocked_in" | "clocked_out">(
    "not_clocked_in",
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadCurrentUser()
    loadCompanyInfo()
    loadAttendanceData()
    loadFilterOptions()
    loadOvertimeRequests()
    loadBiometricDevices()
    loadShifts()
    checkAttendanceStatus()
  }, [])

  useEffect(() => {
    loadAttendanceData()
  }, [dateFilter, customStartDate, customEndDate, departmentFilter, divisionFilter, locationFilter])

  async function loadOvertimeRequests() {
    const result = await getOvertimeRequests()
    if (result.success) {
      setOvertimeRequests(result.data)
    }
  }

  async function loadBiometricDevices() {
    const result = await getBiometricDevices()
    if (result.success) {
      setBiometricDevices(result.data)
    }
  }

  async function loadCurrentUser() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*, employee:employees(*)")
        .eq("id", user.id)
        .single()
      setCurrentUser(profile)
    }
  }

  async function loadCompanyInfo() {
    const info = await getCompanyInfo()
    setCompanyInfo(info)
  }

  async function loadFilterOptions() {
    const supabase = createClient()
    const { data: employees } = await supabase.from("employees").select("department, division, location")

    if (employees) {
      setDepartments([...new Set(employees.map((e) => e.department).filter(Boolean))])
      setDivisions([...new Set(employees.map((e) => e.division).filter(Boolean))])
      setLocations([...new Set(employees.map((e) => e.location).filter(Boolean))])
    }
  }

  async function loadAttendanceData() {
    setLoading(true)

    // Calculate date range
    let startDate, endDate
    const today = new Date()

    switch (dateFilter) {
      case "today":
        startDate = new Date(today.setHours(0, 0, 0, 0)).toISOString()
        endDate = new Date(today.setHours(23, 59, 59, 999)).toISOString()
        break
      case "yesterday":
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        startDate = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString()
        endDate = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString()
        break
      case "week":
        startDate = new Date(today.setDate(today.getDate() - 7)).toISOString()
        endDate = new Date().toISOString()
        break
      case "month":
        startDate = new Date(today.setDate(today.getDate() - 30)).toISOString()
        endDate = new Date().toISOString()
        break
      case "custom":
        if (customStartDate) startDate = customStartDate.toISOString()
        if (customEndDate) endDate = customEndDate.toISOString()
        break
    }

    const result = await getAttendanceRecords({
      startDate,
      endDate,
      department: departmentFilter,
      division: divisionFilter,
      location: locationFilter,
    })

    if (result.success) {
      setRecords(result.data)
      calculateStats(result.data)
    }

    setLoading(false)
  }

  function calculateStats(data: any[]) {
    const present = data.filter((r) => r.status === "present").length
    const absent = data.filter((r) => r.status === "absent").length
    const late = data.filter((r) => r.late_by_minutes && r.late_by_minutes > 0).length
    const totalHours = data.reduce((sum, r) => sum + (r.total_hours || 0), 0)

    // Calculate overtime: hours worked beyond 8 hours per day
    const overtime = data.reduce((sum, r) => {
      if (r.total_hours && r.total_hours > 8) {
        return sum + (r.total_hours - 8)
      }
      return sum
    }, 0)

    const overtimePending = overtimeRequests.filter((r) => r.status === "pending").length
    const devicesOnline = biometricDevices.filter((d) => d.status === "online").length
    const devicesTotal = biometricDevices.length

    setStats({ present, absent, late, overtime, totalHours, overtimePending, devicesOnline, devicesTotal })
  }

  async function handleClockIn() {
    if (!currentUser?.employee) {
      toast({ title: "Error", description: "Employee profile not found", variant: "destructive" })
      return
    }

    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const result = await clockIn(currentUser.employee.id, position.coords.latitude, position.coords.longitude)

          if (result.success) {
            toast({ title: "Success", description: "Clocked in successfully" })
            loadAttendanceData()
          } else {
            toast({ title: "Error", description: result.error, variant: "destructive" })
          }
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Could not get your location. Clocking in without location.",
            variant: "destructive",
          })
          // Clock in without location
          clockIn(currentUser.employee.id).then((result) => {
            if (result.success) {
              toast({ title: "Success", description: "Clocked in successfully" })
              loadAttendanceData()
            }
          })
        },
      )
    } else {
      // Browser doesn't support geolocation
      const result = await clockIn(currentUser.employee.id)
      if (result.success) {
        toast({ title: "Success", description: "Clocked in successfully" })
        loadAttendanceData()
      }
    }
  }

  async function handleClockOut() {
    if (!currentUser?.employee) return

    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const result = await clockOut(currentUser.employee.id, position.coords.latitude, position.coords.longitude)

          if (result.success) {
            toast({ title: "Success", description: "Clocked out successfully" })
            loadAttendanceData()
          } else {
            toast({ title: "Error", description: result.error, variant: "destructive" })
          }
        },
        () => {
          clockOut(currentUser.employee.id).then((result) => {
            if (result.success) {
              toast({ title: "Success", description: "Clocked out successfully" })
              loadAttendanceData()
            }
          })
        },
      )
    } else {
      const result = await clockOut(currentUser.employee.id)
      if (result.success) {
        toast({ title: "Success", description: "Clocked out successfully" })
        loadAttendanceData()
      }
    }
  }

  async function handleSyncDevice(deviceId: string) {
    const result = await syncBiometricDevice(deviceId)
    if (result.success) {
      toast({ title: "Success", description: "Device synced successfully" })
      loadBiometricDevices()
    } else {
      toast({ title: "Error", description: result.error || "Failed to sync device", variant: "destructive" })
    }
  }

  async function handleAddDevice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    // Get the device type from the state or hidden input
    const deviceTypeInput = e.currentTarget.querySelector('[name="type"]') as HTMLInputElement
    const deviceType = deviceTypeInput?.value

    if (!deviceType) {
      toast({ title: "Error", description: "Please select a device type", variant: "destructive" })
      return
    }

    const result = await addBiometricDevice({
      name: formData.get("name") as string,
      type: deviceType,
      location: formData.get("location") as string,
      ip_address: formData.get("ip_address") as string,
      serial_number: formData.get("serial_number") as string,
    })

    if (result.success) {
      toast({ title: "Success", description: "Device added successfully" })
      setShowDeviceDialog(false)
      loadBiometricDevices()
      e.currentTarget.reset()
    } else {
      toast({ title: "Error", description: result.error || "Failed to add device", variant: "destructive" })
    }
  }

  async function handleAddShift(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const workingDays = []
    if (formData.get("monday")) workingDays.push("monday")
    if (formData.get("tuesday")) workingDays.push("tuesday")
    if (formData.get("wednesday")) workingDays.push("wednesday")
    if (formData.get("thursday")) workingDays.push("thursday")
    if (formData.get("friday")) workingDays.push("friday")
    if (formData.get("saturday")) workingDays.push("saturday")
    if (formData.get("sunday")) workingDays.push("sunday")

    const result = await createShift({
      name: formData.get("name") as string,
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      break_duration_minutes: Number.parseInt(formData.get("break_duration") as string) || 0,
      grace_period_minutes: Number.parseInt(formData.get("grace_period") as string) || 0,
      working_days: workingDays,
    })

    if (result.success) {
      toast({ title: "Success", description: "Shift created successfully" })
      setShowShiftDialog(false)
      loadShifts()
      e.currentTarget.reset()
    } else {
      toast({ title: "Error", description: result.error || "Failed to create shift", variant: "destructive" })
    }
  }

  async function handleApproveOvertime(id: string) {
    const request = overtimeRequests.find((r) => r.id === id)
    if (!request) return

    const result = await approveOvertimeRequest(id, request.hours_requested)
    if (result.success) {
      toast({ title: "Success", description: "Overtime approved" })
      loadOvertimeRequests()
      loadAttendanceData()
    } else {
      toast({ title: "Error", description: result.error || "Failed to approve", variant: "destructive" })
    }
  }

  async function handleRejectOvertime(id: string) {
    const result = await rejectOvertimeRequest(id, "Rejected by manager")
    if (result.success) {
      toast({ title: "Success", description: "Overtime rejected" })
      loadOvertimeRequests()
    } else {
      toast({ title: "Error", description: result.error || "Failed to reject", variant: "destructive" })
    }
  }

  async function loadShifts() {
    const result = await getShifts()
    if (result.success) {
      setShifts(result.data)
    }
  }

  async function downloadReport(reportType: string) {
    setLoading(true)
    try {
      const response = await fetch("/api/attendance/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType,
          filters: {
            startDate: customStartDate?.toISOString(),
            endDate: customEndDate?.toISOString(),
            department: departmentFilter,
            division: divisionFilter,
            location: locationFilter,
          },
        }),
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${reportType}-${Date.now()}.pdf`
      a.click()

      toast({ title: "Success", description: "Report downloaded successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to download report", variant: "destructive" })
    }
    setLoading(false)
  }

  async function loadAIInsights(employeeId: string, employeeName: string) {
    setLoadingAI(true)
    setSelectedEmployeeForAI(employeeName)
    setShowAIInsights(true)

    try {
      const response = await fetch("/api/attendance/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      })

      const data = await response.json()
      if (data.success) {
        setAIInsights(data)
      } else {
        toast({ title: "Error", description: "Failed to generate AI insights", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load AI insights", variant: "destructive" })
    }
    setLoadingAI(false)
  }

  async function checkAttendanceStatus() {
    if (!currentUser?.employee) return

    const result = await getEmployeeAttendanceStatus(currentUser.employee.id)
    if (result.success) {
      setAttendanceStatus(result.status)
    }
  }

  async function handleQuickClockInOut() {
    if (!currentUser?.employee) {
      toast({ title: "Error", description: "Employee profile not found", variant: "destructive" })
      return
    }

    // Determine action based on current status
    if (attendanceStatus === "not_clocked_in" || attendanceStatus === "clocked_out") {
      await handleClockIn()
      setAttendanceStatus("clocked_in")
    } else if (attendanceStatus === "clocked_in") {
      await handleClockOut()
      setAttendanceStatus("clocked_out")
    }

    // Refresh status
    checkAttendanceStatus()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Time & Attendance</h1>
          <p className="text-muted-foreground">Manage employee time tracking and attendance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Current Time</div>
            <div className="text-2xl font-bold text-green-600 tabular-nums">
              {currentTime.toLocaleTimeString("en-US", { hour12: false })}
            </div>
          </div>
          <Button
            onClick={handleQuickClockInOut}
            size="lg"
            className={`gap-2 ${attendanceStatus === "clocked_in" ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}`}
          >
            <Clock className="h-5 w-5" />
            {attendanceStatus === "clocked_in" ? "Clock Out" : "Clock In"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Present Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.present}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.present > 0 ? Math.round((stats.present / (stats.present + stats.absent)) * 100) : 0}% attendance
              rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Late Arrivals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.late}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.present > 0 ? ((stats.late / stats.present) * 100).toFixed(1) : 0}% of present employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Absent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.absent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.absent > 0 ? ((stats.absent / (stats.present + stats.absent)) * 100).toFixed(1) : 0}% absence rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overtime Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.overtime.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.overtimePending > 0 ? `${stats.overtimePending} pending approval` : "No pending requests"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Fingerprint className="h-4 w-4" />
              Devices Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.devicesOnline}/{stats.devicesTotal}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.devicesTotal - stats.devicesOnline} device(s) offline
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          onClick={() => setActiveTab("overview")}
          className="rounded-b-none"
        >
          Overview
        </Button>
        <Button
          variant={activeTab === "shift" ? "default" : "ghost"}
          onClick={() => setActiveTab("shift")}
          className="rounded-b-none"
        >
          Shift Management
        </Button>
        <Button
          variant={activeTab === "overtime" ? "default" : "ghost"}
          onClick={() => setActiveTab("overtime")}
          className="rounded-b-none relative"
        >
          Overtime
          {stats.overtimePending > 0 && (
            <Badge className="ml-2 bg-yellow-500 text-white">{stats.overtimePending}</Badge>
          )}
        </Button>
        <Button
          variant={activeTab === "devices" ? "default" : "ghost"}
          onClick={() => setActiveTab("devices")}
          className="rounded-b-none"
        >
          Biometric Devices
        </Button>
        <Button
          variant={activeTab === "reports" ? "default" : "ghost"}
          onClick={() => setActiveTab("reports")}
          className="rounded-b-none"
        >
          Reports
        </Button>
      </div>

      {activeTab === "overview" && (
        <>
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Date Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Department Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Department</label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Division Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Division</label>
                  <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Divisions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Divisions</SelectItem>
                      {divisions.map((div) => (
                        <SelectItem key={div} value={div}>
                          {div}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom Date Range */}
              {dateFilter === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          {customStartDate ? format(customStartDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={customStartDate} onSelect={setCustomStartDate} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          {customEndDate ? format(customEndDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={customEndDate} onSelect={setCustomEndDate} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Employee</th>
                        <th className="text-left p-2">Department</th>
                        <th className="text-left p-2">Division</th>
                        <th className="text-left p-2">Location</th>
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Clock In</th>
                        <th className="text-left p-2">Clock Out</th>
                        <th className="text-left p-2">Hours</th>
                        <th className="text-left p-2">Overtime</th>
                        <th className="text-left p-2">GPS</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">AI Insights</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => {
                        const overtimeHours = record.total_hours > 8 ? record.total_hours - 8 : 0
                        return (
                          <tr key={record.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">{record.employee?.full_name}</td>
                            <td className="p-2">{record.employee?.department || "-"}</td>
                            <td className="p-2">{record.employee?.division || "-"}</td>
                            <td className="p-2">{record.employee?.location || "-"}</td>
                            <td className="p-2">{record.date ? new Date(record.date).toLocaleDateString() : "-"}</td>
                            <td className="p-2">
                              {record.clock_in ? new Date(record.clock_in).toLocaleTimeString() : "-"}
                            </td>
                            <td className="p-2">
                              {record.clock_out ? new Date(record.clock_out).toLocaleTimeString() : "-"}
                            </td>
                            <td className="p-2">{record.total_hours?.toFixed(2) || "-"}</td>
                            <td className="p-2">
                              {record.overtime_hours && record.overtime_hours > 0 ? (
                                <span className="text-orange-600 font-medium">
                                  +{record.overtime_hours.toFixed(2)}h
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="p-2">-</td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  record.status === "present"
                                    ? "bg-green-100 text-green-800"
                                    : record.status === "absent"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {record.status}
                              </span>
                            </td>
                            <td className="p-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                                onClick={() =>
                                  loadAIInsights(record.employee_id, record.employee?.full_name || "Employee")
                                }
                              >
                                <TrendingUp className="h-3 w-3" />
                                Analyze
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "devices" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Biometric Devices</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Monitor and manage biometric attendance devices</p>
            </div>
            <Dialog open={showDeviceDialog} onOpenChange={setShowDeviceDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Device
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Biometric Device</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddDevice} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Device Name</Label>
                    <Input id="name" name="name" required placeholder="e.g., Main Entrance Scanner" />
                  </div>
                  <div>
                    <Label htmlFor="type">Device Type</Label>
                    <Select name="type" required defaultValue="">
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fingerprint">Fingerprint Scanner</SelectItem>
                        <SelectItem value="facial">Facial Recognition</SelectItem>
                        <SelectItem value="card">Card Reader</SelectItem>
                        <SelectItem value="iris">Iris Scanner</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="type" id="type-hidden" />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" required placeholder="e.g., Main Office Entrance" />
                  </div>
                  <div>
                    <Label htmlFor="ip_address">IP Address</Label>
                    <Input id="ip_address" name="ip_address" placeholder="192.168.1.100" />
                  </div>
                  <div>
                    <Label htmlFor="serial_number">Serial Number</Label>
                    <Input id="serial_number" name="serial_number" placeholder="SN-12345" />
                  </div>
                  <Button type="submit" className="w-full">
                    Add Device
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4">
            {biometricDevices.map((device) => (
              <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg ${device.type === "fingerprint" ? "bg-green-100" : device.type === "facial" ? "bg-blue-100" : "bg-orange-100"}`}
                  >
                    <Fingerprint
                      className={`h-6 w-6 ${device.type === "fingerprint" ? "text-green-600" : device.type === "facial" ? "text-blue-600" : "text-orange-600"}`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{device.name}</h3>
                    <p className="text-sm text-muted-foreground">{device.location}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Last sync: {device.last_sync ? new Date(device.last_sync).toLocaleString() : "Never"}
                      </span>
                      <span className="text-xs text-muted-foreground">Uptime: {device.uptime_percentage || 0}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={device.status === "online" ? "bg-green-500" : "bg-red-500"}>
                    {device.status?.toUpperCase() || "OFFLINE"}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => handleSyncDevice(device.id)} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Sync Data
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Settings className="h-4 w-4" />
                    Disable
                  </Button>
                </div>
              </div>
            ))}
            {biometricDevices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No biometric devices configured. Click "Add Device" to get started.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "reports" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => downloadReport("Daily Attendance Report")} variant="outline">
              Daily Report
            </Button>
            <Button onClick={() => downloadReport("Weekly Attendance Summary")} variant="outline">
              Weekly Summary
            </Button>
            <Button onClick={() => downloadReport("Monthly Attendance Analysis")} variant="outline">
              Monthly Analysis
            </Button>
            <Button onClick={() => downloadReport("Department Attendance Report")} variant="outline">
              Department Report
            </Button>
            <Button onClick={() => downloadReport("Overtime Report")} variant="outline">
              Overtime Report
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Shift Management Tab */}
      {activeTab === "shift" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Shift Management</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Create and manage work shifts for employees</p>
            </div>
            <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Shift
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Shift</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddShift} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shift-name">Shift Name</Label>
                      <Input id="shift-name" name="name" required placeholder="e.g., Morning Shift" />
                    </div>
                    <div>
                      <Label htmlFor="grace_period">Grace Period (minutes)</Label>
                      <Input id="grace_period" name="grace_period" type="number" defaultValue="15" placeholder="15" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input id="start_time" name="start_time" type="time" required defaultValue="09:00" />
                    </div>
                    <div>
                      <Label htmlFor="end_time">End Time</Label>
                      <Input id="end_time" name="end_time" type="time" required defaultValue="17:00" />
                    </div>
                    <div>
                      <Label htmlFor="break_duration">Break Duration (min)</Label>
                      <Input
                        id="break_duration"
                        name="break_duration"
                        type="number"
                        defaultValue="60"
                        placeholder="60"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Working Days</Label>
                    <div className="grid grid-cols-7 gap-2 mt-2">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                        <label key={day} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name={day.toLowerCase()}
                            className="rounded"
                            defaultChecked={day !== "Saturday" && day !== "Sunday"}
                          />
                          <span className="text-sm">{day.substring(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Create Shift
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shifts.map((shift) => (
                <div key={shift.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{shift.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {shift.start_time} - {shift.end_time} ({shift.break_duration_minutes}min break)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Grace period: {shift.grace_period_minutes} minutes
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Working days: {shift.working_days?.join(", ") || "Not set"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 bg-transparent">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {shifts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No shifts configured. Click "Add Shift" to create one.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Overtime Tab */}
      {activeTab === "overtime" && (
        <Card>
          <CardHeader>
            <CardTitle>Overtime Management</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>How it works:</strong> Employees work beyond their 8-hour shift, and overtime is automatically
              calculated. They can also submit formal overtime requests which require manager approval before being
              counted.
            </p>
            <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm space-y-1">
              <p>
                <strong className="text-blue-900">• Automatic Overtime:</strong> System automatically tracks hours
                worked beyond 8 hours per day
              </p>
              <p>
                <strong className="text-blue-900">• Request Overtime:</strong> Employees submit requests via their
                portal for planned overtime work
              </p>
              <p>
                <strong className="text-blue-900">• Approval:</strong> Managers/HR review and approve or reject overtime
                requests
              </p>
              <p>
                <strong className="text-blue-900">• Calculation:</strong> Approved overtime is added to payroll
                calculations
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {overtimeRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No overtime requests found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Employee</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Requested Hours</th>
                      <th className="text-left p-2">Reason</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overtimeRequests.map((request) => (
                      <tr key={request.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{request.employee?.full_name || "-"}</td>
                        <td className="p-2">{request.date ? new Date(request.date).toLocaleDateString() : "-"}</td>
                        <td className="p-2">{request.hours_requested?.toFixed(2)}h</td>
                        <td className="p-2">{request.reason}</td>
                        <td className="p-2">
                          <Badge
                            className={
                              request.status === "approved"
                                ? "bg-green-500"
                                : request.status === "pending"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }
                          >
                            {request.status?.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {request.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveOvertime(request.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectOvertime(request.id)}
                                className="text-red-600 border-red-600 hover:bg-red-100"
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Insights Dialog */}
      <Dialog open={showAIInsights} onOpenChange={setShowAIInsights}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              AI Insights: {selectedEmployeeForAI}
            </DialogTitle>
          </DialogHeader>

          {loadingAI ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <span className="ml-3 text-muted-foreground">Analyzing attendance data with AI...</span>
            </div>
          ) : aiInsights ? (
            <div className="space-y-6">
              {/* Performance Score */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Overall Performance</div>
                      <div className="text-3xl font-bold mt-1">{aiInsights.insights.rating}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-purple-600">{aiInsights.insights.score}/100</div>
                      <div className="text-sm text-muted-foreground">AI Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Attendance Rate</div>
                    <div className="text-2xl font-bold">
                      {((aiInsights.stats.presentDays / aiInsights.stats.totalDays) * 100).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Avg Hours/Day</div>
                    <div className="text-2xl font-bold">{aiInsights.stats.avgHours.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Total Overtime</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {aiInsights.stats.totalOvertime.toFixed(1)}h
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Burnout Risk</span>
                    <Badge
                      className={
                        aiInsights.insights.risks.burnout === "High"
                          ? "bg-red-500"
                          : aiInsights.insights.risks.burnout === "Medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }
                    >
                      {aiInsights.insights.risks.burnout}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Absenteeism Risk</span>
                    <Badge
                      className={
                        aiInsights.insights.risks.absenteeism === "High"
                          ? "bg-red-500"
                          : aiInsights.insights.risks.absenteeism === "Medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }
                    >
                      {aiInsights.insights.risks.absenteeism}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Time Theft Risk</span>
                    <Badge
                      className={
                        aiInsights.insights.risks.timeTheft === "High"
                          ? "bg-red-500"
                          : aiInsights.insights.risks.timeTheft === "Medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }
                    >
                      {aiInsights.insights.risks.timeTheft}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detected Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aiInsights.insights.patterns.map((pattern: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                        <span className="text-sm">{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aiInsights.insights.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardContent className="pt-6">
                  <p className="text-sm leading-relaxed">{aiInsights.insights.summary}</p>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
