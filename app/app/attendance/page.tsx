"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import {
  Clock,
  Fingerprint,
  Camera,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Timer,
  MapPin,
  Smartphone,
  CreditCard,
} from "lucide-react"

interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  department: string
  date: string
  clockIn: string
  clockOut?: string
  breakStart?: string
  breakEnd?: string
  totalHours: number
  regularHours: number
  overtimeHours: number
  status: "present" | "late" | "absent" | "early-departure" | "overtime"
  method: "biometric-fingerprint" | "biometric-face" | "manual" | "mobile-app"
  location: string
  notes?: string
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

interface OvertimeRequest {
  id: string
  employeeId: string
  employeeName: string
  department: string
  date: string
  requestedHours: number
  reason: string
  status: "pending" | "approved" | "rejected"
  approvedBy?: string
  approvedHours?: number
}

interface BiometricDevice {
  id: string
  name: string
  type: "fingerprint" | "facial-recognition" | "card-reader"
  location: string
  status: "online" | "offline" | "maintenance"
  lastSync: string
  employeesEnrolled: number
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState("attendance")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0])
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false)

  // Sample data
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: "ATT001",
      employeeId: "EMP001",
      employeeName: "John Doe",
      department: "Sales",
      date: "2024-03-20",
      clockIn: "08:00",
      clockOut: "17:30",
      breakStart: "12:00",
      breakEnd: "13:00",
      totalHours: 8.5,
      regularHours: 8,
      overtimeHours: 0.5,
      status: "overtime",
      method: "biometric-fingerprint",
      location: "Main Office",
    },
    {
      id: "ATT002",
      employeeId: "EMP002",
      employeeName: "Mary Johnson",
      department: "Finance",
      date: "2024-03-20",
      clockIn: "08:15",
      clockOut: "17:00",
      breakStart: "12:30",
      breakEnd: "13:30",
      totalHours: 7.75,
      regularHours: 7.75,
      overtimeHours: 0,
      status: "late",
      method: "biometric-face",
      location: "Main Office",
      notes: "Traffic delay",
    },
    {
      id: "ATT003",
      employeeId: "EMP003",
      employeeName: "Samuel Osei",
      department: "IT",
      date: "2024-03-20",
      clockIn: "07:45",
      clockOut: "16:45",
      breakStart: "12:00",
      breakEnd: "13:00",
      totalHours: 8,
      regularHours: 8,
      overtimeHours: 0,
      status: "present",
      method: "mobile-app",
      location: "Remote",
    },
  ])

  const [shifts, setShifts] = useState<Shift[]>([
    {
      id: "SHIFT001",
      name: "Day Shift",
      startTime: "08:00",
      endTime: "17:00",
      breakDuration: 60,
      employees: ["EMP001", "EMP002", "EMP003"],
      isActive: true,
    },
    {
      id: "SHIFT002",
      name: "Night Shift",
      startTime: "20:00",
      endTime: "05:00",
      breakDuration: 60,
      employees: ["EMP004", "EMP005"],
      isActive: true,
    },
    {
      id: "SHIFT003",
      name: "Weekend Shift",
      startTime: "09:00",
      endTime: "15:00",
      breakDuration: 30,
      employees: ["EMP006"],
      isActive: false,
    },
  ])

  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([
    {
      id: "OT001",
      employeeId: "EMP001",
      employeeName: "John Doe",
      department: "Sales",
      date: "2024-03-21",
      requestedHours: 2,
      reason: "Complete quarterly sales report",
      status: "pending",
    },
    {
      id: "OT002",
      employeeId: "EMP002",
      employeeName: "Mary Johnson",
      department: "Finance",
      date: "2024-03-20",
      requestedHours: 1.5,
      reason: "Month-end closing activities",
      status: "approved",
      approvedBy: "Finance Manager",
      approvedHours: 1.5,
    },
  ])

  const [biometricDevices, setBiometricDevices] = useState<BiometricDevice[]>([
    {
      id: "BIO001",
      name: "Main Entrance Scanner",
      type: "fingerprint",
      location: "Main Office - Entrance",
      status: "online",
      lastSync: "2024-03-20 08:00:00",
      employeesEnrolled: 45,
    },
    {
      id: "BIO002",
      name: "Face Recognition Terminal",
      type: "facial-recognition",
      location: "Main Office - Reception",
      status: "online",
      lastSync: "2024-03-20 08:05:00",
      employeesEnrolled: 38,
    },
    {
      id: "BIO003",
      name: "Branch Office Scanner",
      type: "fingerprint",
      location: "Branch Office - Kumasi",
      status: "offline",
      lastSync: "2024-03-19 17:30:00",
      employeesEnrolled: 12,
    },
  ])

  const [manualEntry, setManualEntry] = useState({
    employeeId: "",
    date: "",
    clockIn: "",
    clockOut: "",
    breakStart: "",
    breakEnd: "",
    reason: "",
  })

  const [newShift, setNewShift] = useState({
    name: "",
    startTime: "",
    endTime: "",
    breakDuration: 60,
  })

  const handleManualEntry = () => {
    const entryId = `ATT${String(attendanceRecords.length + 1).padStart(3, "0")}`
    const totalHours = calculateHours(
      manualEntry.clockIn,
      manualEntry.clockOut,
      manualEntry.breakStart,
      manualEntry.breakEnd,
    )

    const newRecord: AttendanceRecord = {
      id: entryId,
      employeeId: manualEntry.employeeId,
      employeeName: "Manual Entry", // Would fetch from employee database
      department: "Unknown", // Would fetch from employee database
      date: manualEntry.date,
      clockIn: manualEntry.clockIn,
      clockOut: manualEntry.clockOut,
      breakStart: manualEntry.breakStart,
      breakEnd: manualEntry.breakEnd,
      totalHours,
      regularHours: Math.min(totalHours, 8),
      overtimeHours: Math.max(totalHours - 8, 0),
      status: totalHours > 8 ? "overtime" : "present",
      method: "manual",
      location: "Manual Entry",
      notes: manualEntry.reason,
    }

    setAttendanceRecords([...attendanceRecords, newRecord])
    setIsManualEntryOpen(false)
    setManualEntry({
      employeeId: "",
      date: "",
      clockIn: "",
      clockOut: "",
      breakStart: "",
      breakEnd: "",
      reason: "",
    })
    toast({
      title: "Manual Entry Added",
      description: `Attendance record ${entryId} has been created successfully.`,
    })
  }

  const handleCreateShift = () => {
    const shiftId = `SHIFT${String(shifts.length + 1).padStart(3, "0")}`
    const newShiftData: Shift = {
      id: shiftId,
      ...newShift,
      employees: [],
      isActive: true,
    }

    setShifts([...shifts, newShiftData])
    setIsShiftDialogOpen(false)
    setNewShift({
      name: "",
      startTime: "",
      endTime: "",
      breakDuration: 60,
    })
    toast({
      title: "Shift Created",
      description: `Shift ${shiftId} has been created successfully.`,
    })
  }

  const calculateHours = (clockIn: string, clockOut: string, breakStart?: string, breakEnd?: string) => {
    if (!clockIn || !clockOut) return 0

    const start = new Date(`2024-01-01 ${clockIn}`)
    const end = new Date(`2024-01-01 ${clockOut}`)
    let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60)

    if (breakStart && breakEnd) {
      const breakStartTime = new Date(`2024-01-01 ${breakStart}`)
      const breakEndTime = new Date(`2024-01-01 ${breakEnd}`)
      const breakMinutes = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60)
      totalMinutes -= breakMinutes
    }

    return Math.round((totalMinutes / 60) * 100) / 100
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
      case "overtime":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "biometric-fingerprint":
        return <Fingerprint className="w-4 h-4" />
      case "biometric-face":
        return <Camera className="w-4 h-4" />
      case "mobile-app":
        return <Smartphone className="w-4 h-4" />
      case "manual":
        return <Edit className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800"
      case "offline":
        return "bg-red-100 text-red-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time & Attendance</h1>
          <p className="text-gray-600">
            Comprehensive attendance tracking with biometric integration and shift management
          </p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Manual Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Manual Attendance Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manual-employee-id">Employee ID</Label>
                    <Input
                      id="manual-employee-id"
                      value={manualEntry.employeeId}
                      onChange={(e) => setManualEntry({ ...manualEntry, employeeId: e.target.value })}
                      placeholder="EMP001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manual-date">Date</Label>
                    <Input
                      id="manual-date"
                      type="date"
                      value={manualEntry.date}
                      onChange={(e) => setManualEntry({ ...manualEntry, date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manual-clock-in">Clock In</Label>
                    <Input
                      id="manual-clock-in"
                      type="time"
                      value={manualEntry.clockIn}
                      onChange={(e) => setManualEntry({ ...manualEntry, clockIn: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="manual-clock-out">Clock Out</Label>
                    <Input
                      id="manual-clock-out"
                      type="time"
                      value={manualEntry.clockOut}
                      onChange={(e) => setManualEntry({ ...manualEntry, clockOut: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manual-break-start">Break Start</Label>
                    <Input
                      id="manual-break-start"
                      type="time"
                      value={manualEntry.breakStart}
                      onChange={(e) => setManualEntry({ ...manualEntry, breakStart: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="manual-break-end">Break End</Label>
                    <Input
                      id="manual-break-end"
                      type="time"
                      value={manualEntry.breakEnd}
                      onChange={(e) => setManualEntry({ ...manualEntry, breakEnd: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="manual-reason">Reason for Manual Entry</Label>
                  <Input
                    id="manual-reason"
                    value={manualEntry.reason}
                    onChange={(e) => setManualEntry({ ...manualEntry, reason: e.target.value })}
                    placeholder="Device malfunction, forgot to clock in, etc."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsManualEntryOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleManualEntry}>Add Entry</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Quick Clock In
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Present Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceRecords.filter((r) => r.date === filterDate && r.status !== "absent").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Late Arrivals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceRecords.filter((r) => r.date === filterDate && r.status === "late").length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overtime Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceRecords
                    .filter((r) => r.date === filterDate)
                    .reduce((sum, r) => sum + r.overtimeHours, 0)
                    .toFixed(1)}
                </p>
              </div>
              <Timer className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Devices Online</p>
                <p className="text-2xl font-bold text-gray-900">
                  {biometricDevices.filter((d) => d.status === "online").length}/{biometricDevices.length}
                </p>
              </div>
              <Fingerprint className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="attendance">Daily Attendance</TabsTrigger>
          <TabsTrigger value="shifts">Shift Management</TabsTrigger>
          <TabsTrigger value="overtime">Overtime Requests</TabsTrigger>
          <TabsTrigger value="devices">Biometric Devices</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by employee name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-48" />
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Attendance Records */}
          <div className="space-y-4">
            {attendanceRecords
              .filter((record) => record.date === filterDate)
              .map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{record.employeeName}</h3>
                          <Badge className={getStatusColor(record.status)}>{record.status.replace("-", " ")}</Badge>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            {getMethodIcon(record.method)}
                            <span>{record.method.replace("-", " ")}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Employee ID:</span> {record.employeeId}
                          </div>
                          <div>
                            <span className="font-medium">Department:</span> {record.department}
                          </div>
                          <div>
                            <span className="font-medium">Clock In:</span> {record.clockIn}
                          </div>
                          <div>
                            <span className="font-medium">Clock Out:</span> {record.clockOut || "Not clocked out"}
                          </div>
                          <div>
                            <span className="font-medium">Total Hours:</span> {record.totalHours}h
                          </div>
                          <div>
                            <span className="font-medium">Overtime:</span> {record.overtimeHours}h
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{record.location}</span>
                          </div>
                          {record.breakStart && record.breakEnd && (
                            <div>
                              Break: {record.breakStart} - {record.breakEnd}
                            </div>
                          )}
                          {record.notes && <div>Notes: {record.notes}</div>}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Shift Management</h3>
            <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Shift
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Shift</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="shift-name">Shift Name</Label>
                    <Input
                      id="shift-name"
                      value={newShift.name}
                      onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                      placeholder="Morning Shift"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shift-start">Start Time</Label>
                      <Input
                        id="shift-start"
                        type="time"
                        value={newShift.startTime}
                        onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="shift-end">End Time</Label>
                      <Input
                        id="shift-end"
                        type="time"
                        value={newShift.endTime}
                        onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="shift-break">Break Duration (minutes)</Label>
                    <Input
                      id="shift-break"
                      type="number"
                      value={newShift.breakDuration}
                      onChange={(e) => setNewShift({ ...newShift, breakDuration: Number.parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsShiftDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateShift}>Create Shift</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shifts.map((shift) => (
              <Card key={shift.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">{shift.name}</h4>
                    <Badge className={shift.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {shift.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Start Time:</span>
                      <span className="font-medium">{shift.startTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>End Time:</span>
                      <span className="font-medium">{shift.endTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Break Duration:</span>
                      <span className="font-medium">{shift.breakDuration} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Employees:</span>
                      <span className="font-medium">{shift.employees.length}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Users className="w-4 h-4 mr-1" />
                      Assign
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overtime" className="space-y-6">
          <div className="space-y-4">
            {overtimeRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{request.employeeName}</h3>
                        <Badge
                          className={
                            request.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : request.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Employee ID:</span> {request.employeeId}
                        </div>
                        <div>
                          <span className="font-medium">Department:</span> {request.department}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(request.date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Requested Hours:</span> {request.requestedHours}h
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">
                        <span className="font-medium">Reason:</span> {request.reason}
                      </p>
                      {request.approvedBy && (
                        <p className="text-sm text-green-700">
                          Approved by {request.approvedBy} for {request.approvedHours} hours
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {request.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700 bg-transparent"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 bg-transparent"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {biometricDevices.map((device) => (
              <Card key={device.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {device.type === "fingerprint" && <Fingerprint className="w-8 h-8 text-purple-600" />}
                      {device.type === "facial-recognition" && <Camera className="w-8 h-8 text-blue-600" />}
                      {device.type === "card-reader" && <CreditCard className="w-8 h-8 text-green-600" />}
                      <div>
                        <h4 className="font-semibold text-gray-900">{device.name}</h4>
                        <p className="text-sm text-gray-600">{device.type.replace("-", " ")}</p>
                      </div>
                    </div>
                    <Badge className={getDeviceStatusColor(device.status)}>{device.status}</Badge>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="font-medium">{device.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Sync:</span>
                      <span className="font-medium">{new Date(device.lastSync).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Enrolled Users:</span>
                      <span className="font-medium">{device.employeesEnrolled}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      Sync Now
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">Daily Attendance Report</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Comprehensive daily attendance with clock in/out times and status
                </p>
                <Button className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">Overtime Summary</h4>
                <p className="text-sm text-gray-600 mb-4">Monthly overtime hours and costs by department</p>
                <Button className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">Lateness Analysis</h4>
                <p className="text-sm text-gray-600 mb-4">Track patterns of late arrivals and early departures</p>
                <Button className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">Shift Performance</h4>
                <p className="text-sm text-gray-600 mb-4">Analyze attendance patterns across different shifts</p>
                <Button className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">Device Usage Report</h4>
                <p className="text-sm text-gray-600 mb-4">Biometric device performance and usage statistics</p>
                <Button className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2">Monthly Summary</h4>
                <p className="text-sm text-gray-600 mb-4">Complete monthly attendance summary for payroll</p>
                <Button className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
