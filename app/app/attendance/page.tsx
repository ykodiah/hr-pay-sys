"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Clock,
  Users,
  Calendar,
  AlertCircle,
  Plus,
  Search,
  Download,
  Fingerprint,
  Camera,
  Timer,
  ClockIcon,
  UserCheck,
  TrendingUp,
  MapPin,
  CheckCircle,
  XCircle,
  RefreshCw,
  Bell,
  Settings,
  Eye,
  Edit,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  date: string
  clockIn: string
  clockOut: string
  totalHours: number
  overtimeHours: number
  status: "present" | "late" | "absent" | "early-departure"
  location: string
  method: "biometric" | "manual" | "mobile"
  aiScore?: number
  hasMissingPunch?: boolean
}

interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  breakDuration: number
  employees: string[]
  isActive: boolean
}

interface BiometricDevice {
  id: string
  name: string
  type: "fingerprint" | "facial" | "card"
  location: string
  status: "online" | "offline"
  lastSync: string
  uptime?: number
}

interface OvertimeRequest {
  id: string
  employeeId: string
  employeeName: string
  hours: number
  date: string
  reason: string
  status: "pending" | "approved" | "rejected"
  submittedAt: string
}

export default function AttendancePage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("today")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showClockInDialog, setShowClockInDialog] = useState(false)
  const [showShiftDialog, setShowShiftDialog] = useState(false)
  const [showOvertimeDialog, setShowOvertimeDialog] = useState(false)
  const [showDeviceDialog, setShowDeviceDialog] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [clockInMethod, setClockInMethod] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)

  const [newShift, setNewShift] = useState({
    name: "",
    startTime: "",
    endTime: "",
    breakDuration: 60,
    employees: [] as string[],
  })

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: "ATT001",
      employeeId: "EMP001",
      employeeName: "Kwame Asante",
      date: "2024-02-15",
      clockIn: "08:00",
      clockOut: "17:30",
      totalHours: 8.5,
      overtimeHours: 0.5,
      status: "present",
      location: "Main Office",
      method: "biometric",
      aiScore: 98,
    },
    {
      id: "ATT002",
      employeeId: "EMP002",
      employeeName: "Ama Osei",
      date: "2024-02-15",
      clockIn: "08:15",
      clockOut: "17:00",
      totalHours: 7.75,
      overtimeHours: 0,
      status: "late",
      location: "Main Office",
      method: "biometric",
      aiScore: 85,
    },
    {
      id: "ATT003",
      employeeId: "EMP003",
      employeeName: "Kofi Mensah",
      date: "2024-02-15",
      clockIn: "",
      clockOut: "",
      totalHours: 0,
      overtimeHours: 0,
      status: "absent",
      location: "",
      method: "manual",
      aiScore: 0,
      hasMissingPunch: true,
    },
  ])

  const [shifts, setShifts] = useState<Shift[]>([
    {
      id: "SH001",
      name: "Day Shift",
      startTime: "08:00",
      endTime: "17:00",
      breakDuration: 60,
      employees: ["EMP001", "EMP002", "EMP003"],
      isActive: true,
    },
    {
      id: "SH002",
      name: "Night Shift",
      startTime: "20:00",
      endTime: "06:00",
      breakDuration: 60,
      employees: ["EMP004", "EMP005"],
      isActive: true,
    },
  ])

  const [biometricDevices, setBiometricDevices] = useState<BiometricDevice[]>([
    {
      id: "DEV001",
      name: "Main Entrance Scanner",
      type: "fingerprint",
      location: "Main Office Entrance",
      status: "online",
      lastSync: "2024-02-15 09:30",
      uptime: 99.8,
    },
    {
      id: "DEV002",
      name: "Facial Recognition Camera",
      type: "facial",
      location: "Reception Area",
      status: "online",
      lastSync: "2024-02-15 09:25",
      uptime: 98.5,
    },
    {
      id: "DEV003",
      name: "Card Reader - Floor 2",
      type: "card",
      location: "Second Floor",
      status: "offline",
      lastSync: "2024-02-14 18:00",
      uptime: 75.3,
    },
  ])

  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([
    {
      id: "OT001",
      employeeId: "EMP001",
      employeeName: "Kwame Asante",
      hours: 2.5,
      date: "2024-02-15",
      reason: "Project deadline completion",
      status: "pending",
      submittedAt: "2024-02-15 17:30",
    },
    {
      id: "OT002",
      employeeId: "EMP002",
      employeeName: "Ama Osei",
      hours: 1.5,
      date: "2024-02-14",
      reason: "Emergency client support",
      status: "approved",
      submittedAt: "2024-02-14 17:00",
    },
    {
      id: "OT003",
      employeeId: "EMP004",
      employeeName: "John Doe",
      hours: 4.0,
      date: "2024-02-15",
      reason: "System maintenance",
      status: "pending",
      submittedAt: "2024-02-15 18:00",
    },
  ])

  const [selectedRecords, setSelectedRecords] = useState<string[]>([])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const stats = {
    presentToday: attendanceRecords.filter((r) => r.status === "present" || r.status === "late").length,
    lateArrivals: attendanceRecords.filter((r) => r.status === "late").length,
    absent: attendanceRecords.filter((r) => r.status === "absent").length,
    totalOvertimeHours: overtimeRequests.filter((r) => r.status === "pending").reduce((sum, r) => sum + r.hours, 0),
    devicesOnline: biometricDevices.filter((d) => d.status === "online").length,
    totalDevices: biometricDevices.length,
    attendanceRate: Math.round(
      (attendanceRecords.filter((r) => r.status === "present" || r.status === "late").length /
        attendanceRecords.length) *
        100,
    ),
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800"
      case "late":
        return "bg-yellow-100 text-yellow-800"
      case "absent":
        return "bg-red-100 text-red-800"
      case "early-departure":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDeviceStatusColor = (status: string) => {
    return status === "online" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const getOvertimeStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || record.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleBiometricClockIn = async (method: string) => {
    setIsProcessing(true)
    setClockInMethod(method)

    // Simulate biometric authentication
    setTimeout(() => {
      const newRecord: AttendanceRecord = {
        id: `ATT${Date.now()}`,
        employeeId: selectedEmployee || "EMP999",
        employeeName: "New Employee",
        date: new Date().toISOString().split("T")[0],
        clockIn: currentTime.toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit" }),
        clockOut: "",
        totalHours: 0,
        overtimeHours: 0,
        status: "present",
        location: "Main Office",
        method: method as "biometric" | "manual" | "mobile",
        aiScore: 100,
      }

      setAttendanceRecords((prev) => [newRecord, ...prev])
      setIsProcessing(false)
      setShowClockInDialog(false)

      toast({
        title: "Clock-in successful",
        description: `${method} authentication completed at ${newRecord.clockIn}`,
      })
    }, 2000)
  }

  const handleCreateShift = () => {
    if (!newShift.name || !newShift.startTime || !newShift.endTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const shift: Shift = {
      id: `SH${Date.now()}`,
      name: newShift.name,
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      breakDuration: newShift.breakDuration,
      employees: newShift.employees,
      isActive: true,
    }

    setShifts((prev) => [...prev, shift])
    setShowShiftDialog(false)
    setNewShift({
      name: "",
      startTime: "",
      endTime: "",
      breakDuration: 60,
      employees: [],
    })

    toast({
      title: "Shift Created",
      description: `${shift.name} has been created successfully`,
    })
  }

  const toggleShiftStatus = (shiftId: string) => {
    setShifts((prev) => prev.map((shift) => (shift.id === shiftId ? { ...shift, isActive: !shift.isActive } : shift)))

    const shift = shifts.find((s) => s.id === shiftId)
    toast({
      title: shift?.isActive ? "Shift Deactivated" : "Shift Activated",
      description: `${shift?.name} has been ${shift?.isActive ? "deactivated" : "activated"}`,
    })
  }

  const handleOvertimeAction = (requestId: string, action: "approved" | "rejected") => {
    setOvertimeRequests((prev) =>
      prev.map((request) => (request.id === requestId ? { ...request, status: action } : request)),
    )

    const request = overtimeRequests.find((r) => r.id === requestId)
    toast({
      title: action === "approved" ? "Overtime Approved" : "Overtime Rejected",
      description: `${request?.employeeName}'s ${request?.hours}h overtime request has been ${action}`,
    })
  }

  const handleDeviceSync = (deviceId: string) => {
    setBiometricDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId
          ? {
              ...device,
              lastSync: new Date().toLocaleString("en-GB", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }),
            }
          : device,
      ),
    )

    const device = biometricDevices.find((d) => d.id === deviceId)
    toast({
      title: "Device Synced",
      description: `${device?.name} has been synchronized`,
    })
  }

  const toggleDeviceStatus = (deviceId: string) => {
    setBiometricDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId ? { ...device, status: device.status === "online" ? "offline" : "online" } : device,
      ),
    )

    const device = biometricDevices.find((d) => d.id === deviceId)
    toast({
      title: "Device Status Updated",
      description: `${device?.name} is now ${device?.status === "online" ? "offline" : "online"}`,
    })
  }

  const handleExportReport = (reportType: string) => {
    toast({
      title: "Report Generated",
      description: `${reportType} is being prepared for download`,
    })

    // Simulate download
    setTimeout(() => {
      toast({
        title: "Download Ready",
        description: `${reportType} has been downloaded successfully`,
      })
    }, 2000)
  }

  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecords((prev) => (prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]))
  }

  const toggleSelectAll = () => {
    if (selectedRecords.length === filteredRecords.length) {
      setSelectedRecords([])
    } else {
      setSelectedRecords(filteredRecords.map((r) => r.id))
    }
  }

  const handleBulkAction = (action: string) => {
    toast({
      title: "Bulk Action",
      description: `${action} applied to ${selectedRecords.length} record(s)`,
    })
    setSelectedRecords([])
  }

  const sendAbsentReminder = (recordId: string) => {
    const record = attendanceRecords.find((r) => r.id === recordId)
    toast({
      title: "Reminder Sent",
      description: `Attendance reminder sent to ${record?.employeeName}`,
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time & Attendance</h1>
          <p className="text-gray-600">Manage employee time tracking and attendance</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Current Time</p>
            <p className="text-lg font-bold text-emerald-600">
              {currentTime.toLocaleTimeString("en-GB", { hour12: false })}
            </p>
          </div>
          <Dialog open={showClockInDialog} onOpenChange={setShowClockInDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Clock className="w-4 h-4 mr-2" />
                Quick Clock In/Out
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Employee Clock In/Out</DialogTitle>
                <DialogDescription>Choose your preferred authentication method</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employee">Employee ID (Optional)</Label>
                  <Input
                    id="employee"
                    placeholder="Enter employee ID"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center space-y-2 bg-transparent"
                    onClick={() => handleBiometricClockIn("fingerprint")}
                    disabled={isProcessing}
                  >
                    <Fingerprint className="w-6 h-6 text-emerald-600" />
                    <span>Fingerprint Scanner</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center space-y-2 bg-transparent"
                    onClick={() => handleBiometricClockIn("facial")}
                    disabled={isProcessing}
                  >
                    <Camera className="w-6 h-6 text-blue-600" />
                    <span>Facial Recognition</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center space-y-2 bg-transparent"
                    onClick={() => handleBiometricClockIn("manual")}
                    disabled={isProcessing}
                  >
                    <Timer className="w-6 h-6 text-orange-600" />
                    <span>Manual Entry</span>
                  </Button>
                </div>
                {isProcessing && (
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Processing {clockInMethod} authentication...</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Current Time: {currentTime.toLocaleTimeString("en-GB", { hour12: false })}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.presentToday}</div>
            <p className="text-xs text-muted-foreground">{stats.attendanceRate}% attendance rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lateArrivals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.presentToday > 0 ? ((stats.lateArrivals / stats.presentToday) * 100).toFixed(1) : 0}% of present
              employees
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.absent}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.absent / attendanceRecords.length) * 100).toFixed(1)}% absence rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOvertimeHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devices Online</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.devicesOnline}/{stats.totalDevices}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDevices - stats.devicesOnline} device(s) offline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shifts">Shift Management</TabsTrigger>
          <TabsTrigger value="overtime">
            Overtime
            {overtimeRequests.filter((r) => r.status === "pending").length > 0 && (
              <Badge className="ml-2 bg-yellow-500 text-white">
                {overtimeRequests.filter((r) => r.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="devices">Biometric Devices</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by employee name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="early-departure">Early Departure</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => handleExportReport("Daily Attendance Report")}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedRecords.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-800">{selectedRecords.length} record(s) selected</p>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction("Send Reminder")}>
                      <Bell className="w-4 h-4 mr-2" />
                      Send Reminder
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction("Mark Correction")}>
                      <Edit className="w-4 h-4 mr-2" />
                      Mark Correction
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedRecords([])}>
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attendance Records */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Today's Attendance</CardTitle>
                  <CardDescription>Real-time attendance tracking for all employees</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                  {selectedRecords.length === filteredRecords.length ? "Deselect All" : "Select All"} (
                  {filteredRecords.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      selectedRecords.includes(record.id) ? "bg-blue-50 border-blue-300" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        checked={selectedRecords.includes(record.id)}
                        onCheckedChange={() => toggleRecordSelection(record.id)}
                      />
                      <div>
                        <p className="font-medium">{record.employeeName}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>ID: {record.employeeId}</span>
                          {record.aiScore && (
                            <Badge variant="outline" className="text-xs">
                              AI Score: {record.aiScore}%
                            </Badge>
                          )}
                          {record.hasMissingPunch && (
                            <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                              Missing Punch
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium text-gray-600">Clock In</p>
                        <p>{record.clockIn || "—"}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-600">Clock Out</p>
                        <p>{record.clockOut || "—"}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-600">Total Hours</p>
                        <p>{record.totalHours}h</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-600">Overtime</p>
                        <p>{record.overtimeHours}h</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-600">Method</p>
                        <p className="capitalize">{record.method}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(record.status)}>
                          {record.status.replace("-", " ").toUpperCase()}
                        </Badge>
                        {record.status === "absent" && (
                          <Button size="sm" variant="outline" onClick={() => sendAbsentReminder(record.id)}>
                            <Bell className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Shift Management</h3>
              <p className="text-gray-600">Manage work shifts and employee assignments</p>
            </div>
            <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Shift
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Shift</DialogTitle>
                  <DialogDescription>Set up a new work shift schedule</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shiftName">Shift Name *</Label>
                      <Input
                        id="shiftName"
                        placeholder="e.g., Morning Shift"
                        value={newShift.name}
                        onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="breakDuration">Break Duration (minutes)</Label>
                      <Input
                        id="breakDuration"
                        type="number"
                        placeholder="60"
                        value={newShift.breakDuration}
                        onChange={(e) =>
                          setNewShift({ ...newShift, breakDuration: Number.parseInt(e.target.value) || 60 })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={newShift.startTime}
                        onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={newShift.endTime}
                        onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="employees">Assign Employees</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employees" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emp1">Kwame Asante</SelectItem>
                        <SelectItem value="emp2">Ama Osei</SelectItem>
                        <SelectItem value="emp3">Kofi Mensah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowShiftDialog(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateShift}>
                    Create Shift
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shifts.map((shift) => (
              <Card key={shift.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{shift.name}</CardTitle>
                      <CardDescription>
                        {shift.startTime} - {shift.endTime} • {shift.breakDuration}min break
                      </CardDescription>
                    </div>
                    <Badge className={shift.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {shift.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Assigned Employees</p>
                      <p className="text-sm">{shift.employees.length} employees assigned</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit Shift
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleShiftStatus(shift.id)}>
                        {shift.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        View Schedule
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overtime" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Overtime Management</CardTitle>
              <CardDescription>Review and approve overtime requests with fatigue guardrails</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overtimeRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{request.employeeName}</p>
                      <p className="text-sm text-gray-600">
                        {request.hours} hours overtime • {request.date}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Reason: {request.reason}</p>
                      <p className="text-xs text-gray-400 mt-1">Submitted: {request.submittedAt}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getOvertimeStatusColor(request.status)}>{request.status.toUpperCase()}</Badge>
                      {request.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50 bg-transparent"
                            onClick={() => handleOvertimeAction(request.id, "approved")}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                            onClick={() => handleOvertimeAction(request.id, "rejected")}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {request.status !== "pending" && (
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Biometric Devices</h3>
              <p className="text-gray-600">Monitor and manage biometric attendance devices</p>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {biometricDevices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {device.type === "fingerprint" && <Fingerprint className="w-6 h-6 text-emerald-600" />}
                        {device.type === "facial" && <Camera className="w-6 h-6 text-blue-600" />}
                        {device.type === "card" && <ClockIcon className="w-6 h-6 text-orange-600" />}
                      </div>
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-gray-600">{device.location}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-gray-500">Last sync: {device.lastSync}</p>
                          {device.uptime && (
                            <Badge variant="outline" className="text-xs">
                              Uptime: {device.uptime}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getDeviceStatusColor(device.status)}>{device.status.toUpperCase()}</Badge>
                      <Button size="sm" variant="outline" onClick={() => handleDeviceSync(device.id)}>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Sync Data
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleDeviceStatus(device.id)}>
                        <Settings className="w-4 h-4 mr-1" />
                        {device.status === "online" ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Reports</CardTitle>
                <CardDescription>Generate comprehensive attendance reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleExportReport("Daily Attendance Report")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Daily Attendance Report
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleExportReport("Monthly Attendance Summary")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Monthly Attendance Summary
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleExportReport("Overtime Report")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Overtime Report
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleExportReport("Late Arrivals Report")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Late Arrivals Report
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleExportReport("Absenteeism Report")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Absenteeism Report
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Attendance trends and insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm font-medium text-emerald-800">Average Attendance Rate</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.attendanceRate}%</p>
                  <p className="text-xs text-emerald-700 mt-1">+2.3% from last month</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Average Daily Hours</p>
                  <p className="text-2xl font-bold text-blue-600">8.2h</p>
                  <p className="text-xs text-blue-700 mt-1">Within expected range</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-orange-800">Monthly Overtime</p>
                  <p className="text-2xl font-bold text-orange-600">156h</p>
                  <p className="text-xs text-orange-700 mt-1">12 employees involved</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">Device Reliability</p>
                  <p className="text-2xl font-bold text-purple-600">91.2%</p>
                  <p className="text-xs text-purple-700 mt-1">1 device needs attention</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
