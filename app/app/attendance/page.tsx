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
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  MoreHorizontal,
  Clock,
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Download,
  Fingerprint,
  Camera,
  Timer,
  UserCheck,
  UserX,
  ClockIcon,
  CalendarDays,
  Zap,
} from "lucide-react"

// Mock data for demonstration
const mockAttendanceRecords = [
  {
    id: "ATT001",
    employeeId: "EMP001",
    employeeName: "Kwame Asante",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Technology",
    date: new Date("2024-02-20"),
    clockIn: "08:15",
    clockOut: "17:30",
    breakTime: 60,
    totalHours: 8.75,
    regularHours: 8,
    overtimeHours: 0.75,
    status: "present",
    clockInMethod: "biometric",
    clockOutMethod: "biometric",
    location: "Main Office",
    shift: "Day Shift",
    notes: "",
  },
  {
    id: "ATT002",
    employeeId: "EMP002",
    employeeName: "Ama Osei",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Human Resources",
    date: new Date("2024-02-20"),
    clockIn: "09:30",
    clockOut: "18:00",
    breakTime: 60,
    totalHours: 7.5,
    regularHours: 7.5,
    overtimeHours: 0,
    status: "late",
    clockInMethod: "manual",
    clockOutMethod: "biometric",
    location: "Main Office",
    shift: "Day Shift",
    notes: "Traffic delay",
  },
  {
    id: "ATT003",
    employeeId: "EMP003",
    employeeName: "Kofi Mensah",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Sales",
    date: new Date("2024-02-20"),
    clockIn: null,
    clockOut: null,
    breakTime: 0,
    totalHours: 0,
    regularHours: 0,
    overtimeHours: 0,
    status: "absent",
    clockInMethod: null,
    clockOutMethod: null,
    location: null,
    shift: "Day Shift",
    notes: "Sick leave",
  },
]

const mockShifts = [
  {
    id: "SHIFT001",
    name: "Day Shift",
    startTime: "08:00",
    endTime: "17:00",
    breakDuration: 60,
    employees: 45,
    active: true,
  },
  {
    id: "SHIFT002",
    name: "Night Shift",
    startTime: "20:00",
    endTime: "05:00",
    breakDuration: 60,
    employees: 12,
    active: true,
  },
  {
    id: "SHIFT003",
    name: "Weekend Shift",
    startTime: "09:00",
    endTime: "15:00",
    breakDuration: 30,
    employees: 8,
    active: true,
  },
]

const mockBiometricDevices = [
  {
    id: "BIO001",
    name: "Main Entrance",
    type: "fingerprint",
    location: "Ground Floor - Main Entrance",
    status: "online",
    lastSync: new Date("2024-02-20T10:30:00"),
    employeesRegistered: 150,
  },
  {
    id: "BIO002",
    name: "Office Floor 1",
    type: "facial",
    location: "First Floor - Office Area",
    status: "online",
    lastSync: new Date("2024-02-20T10:25:00"),
    employeesRegistered: 85,
  },
  {
    id: "BIO003",
    name: "Warehouse Entry",
    type: "fingerprint",
    location: "Warehouse - Side Entrance",
    status: "offline",
    lastSync: new Date("2024-02-19T16:45:00"),
    employeesRegistered: 25,
  },
]

const attendanceStatus = {
  present: { label: "Present", color: "bg-green-100 text-green-800", icon: CheckCircle },
  late: { label: "Late", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
  absent: { label: "Absent", color: "bg-red-100 text-red-800", icon: UserX },
  "early-departure": { label: "Early Departure", color: "bg-orange-100 text-orange-800", icon: Clock },
  overtime: { label: "Overtime", color: "bg-blue-100 text-blue-800", icon: TrendingUp },
}

const deviceTypes = {
  fingerprint: { label: "Fingerprint", icon: Fingerprint },
  facial: { label: "Facial Recognition", icon: Camera },
  card: { label: "Access Card", icon: UserCheck },
}

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState(mockAttendanceRecords)
  const [shifts, setShifts] = useState(mockShifts)
  const [biometricDevices, setBiometricDevices] = useState(mockBiometricDevices)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("attendance")

  const [manualEntry, setManualEntry] = useState({
    employeeId: "",
    date: "",
    clockIn: "",
    clockOut: "",
    breakTime: "",
    notes: "",
  })

  const [newShift, setNewShift] = useState({
    name: "",
    startTime: "",
    endTime: "",
    breakDuration: "",
  })

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = record.date.toISOString().split("T")[0] === selectedDate
    const matchesDepartment = selectedDepartment === "all" || record.department === selectedDepartment
    const matchesStatus = selectedStatus === "all" || record.status === selectedStatus

    return matchesSearch && matchesDate && matchesDepartment && matchesStatus
  })

  const getAttendanceStats = () => {
    const todayRecords = attendanceRecords.filter(
      (record) => record.date.toISOString().split("T")[0] === new Date().toISOString().split("T")[0],
    )
    const present = todayRecords.filter((r) => r.status === "present").length
    const late = todayRecords.filter((r) => r.status === "late").length
    const absent = todayRecords.filter((r) => r.status === "absent").length
    const overtime = todayRecords.filter((r) => r.overtimeHours > 0).length
    const totalEmployees = 150 // Would come from employee count
    const attendanceRate = Math.round(((present + late) / totalEmployees) * 100)

    return { present, late, absent, overtime, attendanceRate, totalEmployees }
  }

  const stats = getAttendanceStats()

  const handleManualEntry = () => {
    if (!manualEntry.employeeId || !manualEntry.date || !manualEntry.clockIn) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const clockInTime = new Date(`${manualEntry.date}T${manualEntry.clockIn}`)
    const clockOutTime = manualEntry.clockOut ? new Date(`${manualEntry.date}T${manualEntry.clockOut}`) : null
    const breakTime = Number.parseInt(manualEntry.breakTime) || 0
    const totalHours = clockOutTime
      ? (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60) - breakTime / 60
      : 0
    const regularHours = Math.min(totalHours, 8)
    const overtimeHours = Math.max(totalHours - 8, 0)

    const record = {
      id: `ATT${String(attendanceRecords.length + 1).padStart(3, "0")}`,
      employeeId: manualEntry.employeeId,
      employeeName: "Employee Name", // Would fetch from employee data
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Department",
      date: new Date(manualEntry.date),
      clockIn: manualEntry.clockIn,
      clockOut: manualEntry.clockOut || null,
      breakTime,
      totalHours,
      regularHours,
      overtimeHours,
      status: "present",
      clockInMethod: "manual",
      clockOutMethod: manualEntry.clockOut ? "manual" : null,
      location: "Manual Entry",
      shift: "Day Shift",
      notes: manualEntry.notes,
    }

    setAttendanceRecords([...attendanceRecords, record])
    setManualEntry({
      employeeId: "",
      date: "",
      clockIn: "",
      clockOut: "",
      breakTime: "",
      notes: "",
    })
    setIsManualEntryOpen(false)

    toast({
      title: "Manual Entry Added",
      description: `Attendance record for ${record.employeeName} has been created.`,
    })
  }

  const handleCreateShift = () => {
    if (!newShift.name || !newShift.startTime || !newShift.endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const shift = {
      id: `SHIFT${String(shifts.length + 1).padStart(3, "0")}`,
      name: newShift.name,
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      breakDuration: Number.parseInt(newShift.breakDuration) || 60,
      employees: 0,
      active: true,
    }

    setShifts([...shifts, shift])
    setNewShift({
      name: "",
      startTime: "",
      endTime: "",
      breakDuration: "",
    })
    setIsShiftDialogOpen(false)

    toast({
      title: "Shift Created",
      description: `${shift.name} has been created successfully.`,
    })
  }

  const syncBiometricDevice = (deviceId: string) => {
    setBiometricDevices((prev) =>
      prev.map((device) => (device.id === deviceId ? { ...device, lastSync: new Date(), status: "online" } : device)),
    )

    toast({
      title: "Device Synced",
      description: "Biometric device has been synchronized successfully.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time & Attendance</h1>
          <p className="text-gray-600">Manage employee attendance with biometric integration and shift scheduling</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
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
                    <Label htmlFor="employee">Employee *</Label>
                    <Select
                      value={manualEntry.employeeId}
                      onValueChange={(value) => setManualEntry({ ...manualEntry, employeeId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMP001">Kwame Asante</SelectItem>
                        <SelectItem value="EMP002">Ama Osei</SelectItem>
                        <SelectItem value="EMP003">Kofi Mensah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={manualEntry.date}
                      onChange={(e) => setManualEntry({ ...manualEntry, date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="clockIn">Clock In *</Label>
                    <Input
                      id="clockIn"
                      type="time"
                      value={manualEntry.clockIn}
                      onChange={(e) => setManualEntry({ ...manualEntry, clockIn: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="clockOut">Clock Out</Label>
                    <Input
                      id="clockOut"
                      type="time"
                      value={manualEntry.clockOut}
                      onChange={(e) => setManualEntry({ ...manualEntry, clockOut: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="breakTime">Break Time (minutes)</Label>
                    <Input
                      id="breakTime"
                      type="number"
                      value={manualEntry.breakTime}
                      onChange={(e) => setManualEntry({ ...manualEntry, breakTime: e.target.value })}
                      placeholder="60"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={manualEntry.notes}
                    onChange={(e) => setManualEntry({ ...manualEntry, notes: e.target.value })}
                    placeholder="Reason for manual entry..."
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
            Clock In/Out
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                <p className="text-sm text-gray-600">Present</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
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
                <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                <p className="text-sm text-gray-600">Absent</p>
              </div>
              <UserX className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.overtime}</div>
                <p className="text-sm text-gray-600">Overtime</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by employee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full lg:w-48"
            />
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Human Resources">Human Resources</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(attendanceStatus).map(([key, status]) => (
                  <SelectItem key={key} value={key}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance">Daily Attendance ({filteredRecords.length})</TabsTrigger>
          <TabsTrigger value="shifts">Shift Management ({shifts.length})</TabsTrigger>
          <TabsTrigger value="biometric">Biometric Devices ({biometricDevices.length})</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => {
                    const StatusIcon = attendanceStatus[record.status as keyof typeof attendanceStatus].icon
                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                            <StatusIcon className="w-6 h-6 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{record.employeeName}</h3>
                              <Badge className={attendanceStatus[record.status as keyof typeof attendanceStatus].color}>
                                {attendanceStatus[record.status as keyof typeof attendanceStatus].label}
                              </Badge>
                              {record.overtimeHours > 0 && (
                                <Badge className="bg-blue-100 text-blue-800">+{record.overtimeHours}h OT</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Avatar className="w-5 h-5 mr-2">
                                  <AvatarImage src={record.employeeAvatar || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    {record.employeeName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                {record.employeeId} • {record.department}
                              </div>
                              {record.clockIn && (
                                <div className="flex items-center">
                                  <ClockIcon className="w-4 h-4 mr-1 text-green-600" />
                                  In: {record.clockIn}
                                </div>
                              )}
                              {record.clockOut && (
                                <div className="flex items-center">
                                  <ClockIcon className="w-4 h-4 mr-1 text-red-600" />
                                  Out: {record.clockOut}
                                </div>
                              )}
                              <div className="flex items-center">
                                <Timer className="w-4 h-4 mr-1" />
                                {record.totalHours}h total
                              </div>
                              <div className="flex items-center">
                                <CalendarDays className="w-4 h-4 mr-1" />
                                {record.shift}
                              </div>
                              {record.clockInMethod && (
                                <div className="flex items-center">
                                  {record.clockInMethod === "biometric" ? (
                                    <Fingerprint className="w-4 h-4 mr-1 text-blue-600" />
                                  ) : (
                                    <Edit className="w-4 h-4 mr-1 text-orange-600" />
                                  )}
                                  {record.clockInMethod}
                                </div>
                              )}
                            </div>
                            {record.notes && <p className="text-sm text-gray-600 mt-1 italic">Note: {record.notes}</p>}
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
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Record
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Zap className="w-4 h-4 mr-2" />
                                Request Overtime Approval
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Export Timesheet
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria or date selection.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Shift Management</CardTitle>
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
                        <Label htmlFor="shiftName">Shift Name *</Label>
                        <Input
                          id="shiftName"
                          value={newShift.name}
                          onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                          placeholder="e.g., Morning Shift"
                        />
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
                        <Label htmlFor="breakDuration">Break Duration (minutes)</Label>
                        <Input
                          id="breakDuration"
                          type="number"
                          value={newShift.breakDuration}
                          onChange={(e) => setNewShift({ ...newShift, breakDuration: e.target.value })}
                          placeholder="60"
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
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shifts.map((shift) => (
                  <Card key={shift.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{shift.name}</h3>
                        <Badge className={shift.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {shift.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span className="font-medium">
                            {shift.startTime} - {shift.endTime}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Break:</span>
                          <span className="font-medium">{shift.breakDuration} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Employees:</span>
                          <span className="font-medium">{shift.employees}</span>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Shift
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="w-4 h-4 mr-2" />
                              Assign Employees
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="w-4 h-4 mr-2" />
                              View Schedule
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biometric" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Biometric Device Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {biometricDevices.map((device) => {
                  const DeviceIcon = deviceTypes[device.type as keyof typeof deviceTypes].icon
                  return (
                    <Card key={device.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <DeviceIcon className="w-5 h-5 text-gray-600" />
                            <h3 className="font-semibold text-gray-900">{device.name}</h3>
                          </div>
                          <Badge
                            className={
                              device.status === "online" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }
                          >
                            {device.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Type:</span>{" "}
                            {deviceTypes[device.type as keyof typeof deviceTypes].label}
                          </div>
                          <div>
                            <span className="font-medium">Location:</span> {device.location}
                          </div>
                          <div>
                            <span className="font-medium">Registered:</span> {device.employeesRegistered} employees
                          </div>
                          <div>
                            <span className="font-medium">Last Sync:</span> {device.lastSync.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex justify-between mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => syncBiometricDevice(device.id)}
                            disabled={device.status === "offline"}
                          >
                            Sync Now
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Configure Device
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Users className="w-4 h-4 mr-2" />
                                Manage Registrations
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Download Logs
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Daily Attendance</span>
                    <span className="font-semibold">92%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Late Arrivals (This Month)</span>
                    <span className="font-semibold">8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Overtime Hours (This Month)</span>
                    <span className="font-semibold">245h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Absenteeism Rate</span>
                    <span className="font-semibold">3.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Technology</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={95} className="w-20" />
                      <span className="font-semibold text-sm">95%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Human Resources</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={88} className="w-20" />
                      <span className="font-semibold text-sm">88%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sales</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={91} className="w-20" />
                      <span className="font-semibold text-sm">91%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Finance</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={94} className="w-20" />
                      <span className="font-semibold text-sm">94%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
