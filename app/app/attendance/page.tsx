"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  MoreHorizontal,
  Users,
  TrendingUp,
  Download,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Fingerprint,
  Camera,
  Timer,
  CalendarDays,
  UserCheck,
  ClockIcon,
} from "lucide-react"

// Mock data for attendance records
const mockAttendanceRecords = [
  {
    id: "ATT-001",
    employeeId: "EMP001",
    employeeName: "Kwame Asante",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Technology",
    date: new Date("2024-02-20"),
    clockIn: "08:15",
    clockOut: "17:30",
    breakTime: 60,
    totalHours: 8.75,
    overtimeHours: 0.75,
    status: "present",
    method: "biometric",
    location: "Main Office",
    shift: "Day Shift (8:00-17:00)",
    lateMinutes: 15,
    earlyDeparture: 0,
  },
  {
    id: "ATT-002",
    employeeId: "EMP002",
    employeeName: "Ama Osei",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Human Resources",
    date: new Date("2024-02-20"),
    clockIn: "07:45",
    clockOut: "16:45",
    breakTime: 60,
    totalHours: 8.0,
    overtimeHours: 0,
    status: "present",
    method: "manual",
    location: "Main Office",
    shift: "Day Shift (8:00-17:00)",
    lateMinutes: 0,
    earlyDeparture: 15,
  },
  {
    id: "ATT-003",
    employeeId: "EMP003",
    employeeName: "Kofi Mensah",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Finance",
    date: new Date("2024-02-20"),
    clockIn: null,
    clockOut: null,
    breakTime: 0,
    totalHours: 0,
    overtimeHours: 0,
    status: "absent",
    method: null,
    location: null,
    shift: "Day Shift (8:00-17:00)",
    lateMinutes: 0,
    earlyDeparture: 0,
  },
]

// Mock shift data
const mockShifts = [
  {
    id: "SHIFT-001",
    name: "Day Shift",
    startTime: "08:00",
    endTime: "17:00",
    breakDuration: 60,
    employees: ["EMP001", "EMP002", "EMP003"],
    isActive: true,
  },
  {
    id: "SHIFT-002",
    name: "Night Shift",
    startTime: "20:00",
    endTime: "05:00",
    breakDuration: 60,
    employees: ["EMP004", "EMP005"],
    isActive: true,
  },
  {
    id: "SHIFT-003",
    name: "Weekend Shift",
    startTime: "09:00",
    endTime: "15:00",
    breakDuration: 30,
    employees: ["EMP006"],
    isActive: false,
  },
]

// Mock overtime requests
const mockOvertimeRequests = [
  {
    id: "OT-001",
    employeeId: "EMP001",
    employeeName: "Kwame Asante",
    date: new Date("2024-02-21"),
    requestedHours: 3,
    reason: "Project deadline completion",
    status: "pending",
    requestedBy: "Kwame Asante",
    approver: "John Manager",
    submittedDate: new Date("2024-02-20"),
  },
  {
    id: "OT-002",
    employeeId: "EMP002",
    employeeName: "Ama Osei",
    date: new Date("2024-02-19"),
    requestedHours: 2,
    reason: "Monthly report preparation",
    status: "approved",
    requestedBy: "Ama Osei",
    approver: "Sarah Director",
    submittedDate: new Date("2024-02-18"),
    approvedDate: new Date("2024-02-19"),
  },
]

const statusColors = {
  present: "bg-green-100 text-green-800",
  absent: "bg-red-100 text-red-800",
  late: "bg-yellow-100 text-yellow-800",
  half_day: "bg-blue-100 text-blue-800",
}

const overtimeStatusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState(mockAttendanceRecords)
  const [shifts, setShifts] = useState(mockShifts)
  const [overtimeRequests, setOvertimeRequests] = useState(mockOvertimeRequests)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
  const [isShiftManagementOpen, setIsShiftManagementOpen] = useState(false)
  const [isOvertimeRequestOpen, setIsOvertimeRequestOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("attendance")

  const [manualEntryForm, setManualEntryForm] = useState({
    employeeId: "",
    date: "",
    clockIn: "",
    clockOut: "",
    breakTime: "60",
    reason: "",
  })

  const [overtimeForm, setOvertimeForm] = useState({
    employeeId: "",
    date: "",
    hours: "",
    reason: "",
  })

  const filteredRecords = attendanceRecords.filter(
    (record) =>
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const todayRecords = filteredRecords.filter(
    (record) => record.date.toDateString() === new Date(selectedDate).toDateString(),
  )

  const handleManualEntry = () => {
    const newRecord = {
      id: `ATT-${String(attendanceRecords.length + 1).padStart(3, "0")}`,
      employeeId: manualEntryForm.employeeId,
      employeeName: "Selected Employee", // Would fetch from employee data
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Department", // Would fetch from employee data
      date: new Date(manualEntryForm.date),
      clockIn: manualEntryForm.clockIn,
      clockOut: manualEntryForm.clockOut,
      breakTime: Number.parseInt(manualEntryForm.breakTime),
      totalHours: calculateTotalHours(
        manualEntryForm.clockIn,
        manualEntryForm.clockOut,
        Number.parseInt(manualEntryForm.breakTime),
      ),
      overtimeHours: 0,
      status: "present",
      method: "manual",
      location: "Manual Entry",
      shift: "Day Shift (8:00-17:00)",
      lateMinutes: 0,
      earlyDeparture: 0,
    }

    setAttendanceRecords([...attendanceRecords, newRecord])
    setIsManualEntryOpen(false)
    setManualEntryForm({
      employeeId: "",
      date: "",
      clockIn: "",
      clockOut: "",
      breakTime: "60",
      reason: "",
    })
    toast({
      title: "Manual Entry Added",
      description: `Attendance record ${newRecord.id} has been created successfully.`,
    })
  }

  const handleOvertimeRequest = () => {
    const newRequest = {
      id: `OT-${String(overtimeRequests.length + 1).padStart(3, "0")}`,
      employeeId: overtimeForm.employeeId,
      employeeName: "Selected Employee", // Would fetch from employee data
      date: new Date(overtimeForm.date),
      requestedHours: Number.parseInt(overtimeForm.hours),
      reason: overtimeForm.reason,
      status: "pending",
      requestedBy: "Current User",
      approver: "Manager",
      submittedDate: new Date(),
    }

    setOvertimeRequests([...overtimeRequests, newRequest])
    setIsOvertimeRequestOpen(false)
    setOvertimeForm({
      employeeId: "",
      date: "",
      hours: "",
      reason: "",
    })
    toast({
      title: "Overtime Request Submitted",
      description: `Overtime request ${newRequest.id} has been submitted for approval.`,
    })
  }

  const calculateTotalHours = (clockIn: string, clockOut: string, breakTime: number) => {
    if (!clockIn || !clockOut) return 0
    const [inHour, inMinute] = clockIn.split(":").map(Number)
    const [outHour, outMinute] = clockOut.split(":").map(Number)
    const inMinutes = inHour * 60 + inMinute
    const outMinutes = outHour * 60 + outMinute
    const totalMinutes = outMinutes - inMinutes - breakTime
    return Math.round((totalMinutes / 60) * 100) / 100
  }

  const getAttendanceStats = () => {
    const today = new Date().toDateString()
    const todayAttendance = attendanceRecords.filter((record) => record.date.toDateString() === today)
    const present = todayAttendance.filter((record) => record.status === "present").length
    const absent = todayAttendance.filter((record) => record.status === "absent").length
    const late = todayAttendance.filter((record) => record.lateMinutes > 0).length
    const totalEmployees = todayAttendance.length
    const attendanceRate = totalEmployees > 0 ? Math.round((present / totalEmployees) * 100) : 0

    return { present, absent, late, attendanceRate }
  }

  const stats = getAttendanceStats()

  const approveOvertimeRequest = (requestId: string) => {
    setOvertimeRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status: "approved", approvedDate: new Date() } : request,
      ),
    )
    toast({
      title: "Overtime Approved",
      description: "Overtime request has been approved successfully.",
    })
  }

  const rejectOvertimeRequest = (requestId: string) => {
    setOvertimeRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status: "rejected", rejectedDate: new Date() } : request,
      ),
    )
    toast({
      title: "Overtime Rejected",
      description: "Overtime request has been rejected.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time & Attendance</h1>
          <p className="text-gray-600">Track employee attendance, manage shifts, and process overtime</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
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
                    <Label htmlFor="employee">Employee</Label>
                    <Select
                      value={manualEntryForm.employeeId}
                      onValueChange={(value) => setManualEntryForm({ ...manualEntryForm, employeeId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMP001">Kwame Asante - Technology</SelectItem>
                        <SelectItem value="EMP002">Ama Osei - Human Resources</SelectItem>
                        <SelectItem value="EMP003">Kofi Mensah - Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      type="date"
                      value={manualEntryForm.date}
                      onChange={(e) => setManualEntryForm({ ...manualEntryForm, date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="clockIn">Clock In</Label>
                    <Input
                      type="time"
                      value={manualEntryForm.clockIn}
                      onChange={(e) => setManualEntryForm({ ...manualEntryForm, clockIn: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="clockOut">Clock Out</Label>
                    <Input
                      type="time"
                      value={manualEntryForm.clockOut}
                      onChange={(e) => setManualEntryForm({ ...manualEntryForm, clockOut: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="breakTime">Break Time (minutes)</Label>
                    <Input
                      type="number"
                      value={manualEntryForm.breakTime}
                      onChange={(e) => setManualEntryForm({ ...manualEntryForm, breakTime: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reason">Reason for Manual Entry</Label>
                  <Input
                    placeholder="e.g., Biometric system malfunction"
                    value={manualEntryForm.reason}
                    onChange={(e) => setManualEntryForm({ ...manualEntryForm, reason: e.target.value })}
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
          <Dialog open={isOvertimeRequestOpen} onOpenChange={setIsOvertimeRequestOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Timer className="w-4 h-4 mr-2" />
                Request Overtime
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Overtime Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee">Employee</Label>
                    <Select
                      value={overtimeForm.employeeId}
                      onValueChange={(value) => setOvertimeForm({ ...overtimeForm, employeeId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMP001">Kwame Asante - Technology</SelectItem>
                        <SelectItem value="EMP002">Ama Osei - Human Resources</SelectItem>
                        <SelectItem value="EMP003">Kofi Mensah - Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      type="date"
                      value={overtimeForm.date}
                      onChange={(e) => setOvertimeForm({ ...overtimeForm, date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hours">Overtime Hours</Label>
                    <Input
                      type="number"
                      min="1"
                      max="8"
                      placeholder="3"
                      value={overtimeForm.hours}
                      onChange={(e) => setOvertimeForm({ ...overtimeForm, hours: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reason">Reason for Overtime</Label>
                  <Input
                    placeholder="e.g., Project deadline, urgent client request"
                    value={overtimeForm.reason}
                    onChange={(e) => setOvertimeForm({ ...overtimeForm, reason: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsOvertimeRequestOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleOvertimeRequest}>Submit Request</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button>
            <CalendarDays className="w-4 h-4 mr-2" />
            Manage Shifts
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                <p className="text-sm text-gray-600">Present Today</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                <p className="text-sm text-gray-600">Absent Today</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
                <p className="text-sm text-gray-600">Late Arrivals</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Date Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by employee name, ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance">Daily Attendance</TabsTrigger>
          <TabsTrigger value="overtime">Overtime Requests</TabsTrigger>
          <TabsTrigger value="shifts">Shift Management</TabsTrigger>
          <TabsTrigger value="biometric">Biometric Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={record.employeeAvatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {record.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{record.employeeName}</h3>
                          <Badge className={statusColors[record.status as keyof typeof statusColors]}>
                            {record.status.toUpperCase()}
                          </Badge>
                          {record.method && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              {record.method === "biometric" ? (
                                <Fingerprint className="w-3 h-3" />
                              ) : (
                                <ClockIcon className="w-3 h-3" />
                              )}
                              {record.method}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600">
                            {record.employeeId} • {record.department}
                          </span>
                          {record.clockIn && (
                            <>
                              <span className="text-sm text-gray-500">In: {record.clockIn}</span>
                              <span className="text-sm text-gray-500">Out: {record.clockOut || "Not clocked out"}</span>
                              <span className="text-sm text-gray-500">Hours: {record.totalHours}h</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          {record.lateMinutes > 0 && (
                            <span className="text-sm text-yellow-600">Late: {record.lateMinutes} min</span>
                          )}
                          {record.earlyDeparture > 0 && (
                            <span className="text-sm text-orange-600">Early: {record.earlyDeparture} min</span>
                          )}
                          {record.overtimeHours > 0 && (
                            <span className="text-sm text-blue-600">OT: {record.overtimeHours}h</span>
                          )}
                          <span className="text-sm text-gray-500">{record.shift}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedRecord(record)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Record
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Timer className="w-4 h-4 mr-2" />
                            Add Overtime
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overtime Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overtimeRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{request.employeeName}</h3>
                        <Badge className={overtimeStatusColors[request.status as keyof typeof overtimeStatusColors]}>
                          {request.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600">{request.id}</span>
                        <span className="text-sm text-gray-500">Date: {request.date.toLocaleDateString()}</span>
                        <span className="text-sm text-gray-500">Hours: {request.requestedHours}</span>
                        <span className="text-sm text-gray-500">
                          Submitted: {request.submittedDate.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {request.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => approveOvertimeRequest(request.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => rejectOvertimeRequest(request.id)}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Download Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shift Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{shift.name}</h3>
                        <Badge className={shift.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {shift.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600">
                          Time: {shift.startTime} - {shift.endTime}
                        </span>
                        <span className="text-sm text-gray-500">Break: {shift.breakDuration} min</span>
                        <span className="text-sm text-gray-500">Employees: {shift.employees.length}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Users className="w-4 h-4 mr-1" />
                        Assign
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biometric" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Biometric Device Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Fingerprint className="w-5 h-5" />
                    Fingerprint Devices
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">Main Entrance - Device 001</p>
                        <p className="text-sm text-gray-600">ZKTeco F18 - IP: 192.168.1.100</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">Office Floor 2 - Device 002</p>
                        <p className="text-sm text-gray-600">ZKTeco F18 - IP: 192.168.1.101</p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">Offline</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Facial Recognition
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">Reception Area - Camera 001</p>
                        <p className="text-sm text-gray-600">Hikvision DS-K1T341A</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">Cafeteria - Camera 002</p>
                        <p className="text-sm text-gray-600">Hikvision DS-K1T341A</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Fingerprint className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Biometric Integration Features</h4>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Real-time synchronization with attendance records</li>
                      <li>• Support for multiple biometric devices (fingerprint, facial recognition)</li>
                      <li>• Anti-passback and buddy punching prevention</li>
                      <li>• Automatic backup to manual entry on device failure</li>
                      <li>• Integration with popular Ghana market devices (ZKTeco, Hikvision)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Record Details Modal */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attendance Details - {selectedRecord?.id}</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Employee Information</h4>
                  <div className="space-y-1">
                    <p>
                      <span className="text-gray-600">Name:</span> {selectedRecord.employeeName}
                    </p>
                    <p>
                      <span className="text-gray-600">ID:</span> {selectedRecord.employeeId}
                    </p>
                    <p>
                      <span className="text-gray-600">Department:</span> {selectedRecord.department}
                    </p>
                    <p>
                      <span className="text-gray-600">Shift:</span> {selectedRecord.shift}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Attendance Details</h4>
                  <div className="space-y-1">
                    <p>
                      <span className="text-gray-600">Date:</span> {selectedRecord.date.toLocaleDateString()}
                    </p>
                    <p>
                      <span className="text-gray-600">Clock In:</span> {selectedRecord.clockIn || "N/A"}
                    </p>
                    <p>
                      <span className="text-gray-600">Clock Out:</span> {selectedRecord.clockOut || "N/A"}
                    </p>
                    <p>
                      <span className="text-gray-600">Total Hours:</span> {selectedRecord.totalHours}h
                    </p>
                    <p>
                      <span className="text-gray-600">Method:</span> {selectedRecord.method || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              {(selectedRecord.lateMinutes > 0 ||
                selectedRecord.earlyDeparture > 0 ||
                selectedRecord.overtimeHours > 0) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Additional Information</h4>
                  <div className="space-y-1">
                    {selectedRecord.lateMinutes > 0 && (
                      <p className="text-yellow-600">Late Arrival: {selectedRecord.lateMinutes} minutes</p>
                    )}
                    {selectedRecord.earlyDeparture > 0 && (
                      <p className="text-orange-600">Early Departure: {selectedRecord.earlyDeparture} minutes</p>
                    )}
                    {selectedRecord.overtimeHours > 0 && (
                      <p className="text-blue-600">Overtime: {selectedRecord.overtimeHours} hours</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                  Close
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
                <Button>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Record
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
