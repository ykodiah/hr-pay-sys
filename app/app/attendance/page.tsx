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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  MoreHorizontal,
  Clock,
  Users,
  Fingerprint,
  Camera,
  Edit,
  Download,
  Eye,
  CheckCircle,
  AlertTriangle,
  Timer,
  UserCheck,
  TrendingUp,
  BarChart3,
} from "lucide-react"

// Mock data for demonstration
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
    regularHours: 8,
    overtimeHours: 0.75,
    status: "present",
    method: "biometric",
    location: "Main Office",
    shift: "Day Shift (8:00-17:00)",
    notes: "",
  },
  {
    id: "ATT-002",
    employeeId: "EMP002",
    employeeName: "Ama Osei",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Human Resources",
    date: new Date("2024-02-20"),
    clockIn: "08:45",
    clockOut: "17:00",
    breakTime: 60,
    totalHours: 7.25,
    regularHours: 7.25,
    overtimeHours: 0,
    status: "late",
    method: "manual",
    location: "Main Office",
    shift: "Day Shift (8:00-17:00)",
    notes: "Traffic delay",
  },
  {
    id: "ATT-003",
    employeeId: "EMP003",
    employeeName: "Kofi Mensah",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    department: "Sales",
    date: new Date("2024-02-20"),
    clockIn: "09:00",
    clockOut: "18:00",
    breakTime: 60,
    totalHours: 8,
    regularHours: 8,
    overtimeHours: 0,
    status: "present",
    method: "facial_recognition",
    location: "Branch Office",
    shift: "Flexible (9:00-18:00)",
    notes: "",
  },
]

const mockShifts = [
  {
    id: "SHIFT-001",
    name: "Day Shift",
    startTime: "08:00",
    endTime: "17:00",
    breakDuration: 60,
    employees: 45,
    department: "All Departments",
    isActive: true,
  },
  {
    id: "SHIFT-002",
    name: "Night Shift",
    startTime: "22:00",
    endTime: "06:00",
    breakDuration: 60,
    employees: 12,
    department: "Security & Maintenance",
    isActive: true,
  },
  {
    id: "SHIFT-003",
    name: "Flexible Hours",
    startTime: "09:00",
    endTime: "18:00",
    breakDuration: 60,
    employees: 23,
    department: "Management & Sales",
    isActive: true,
  },
]

const statusColors = {
  present: "bg-green-100 text-green-800",
  late: "bg-yellow-100 text-yellow-800",
  absent: "bg-red-100 text-red-800",
  early_departure: "bg-orange-100 text-orange-800",
  overtime: "bg-blue-100 text-blue-800",
}

const methodLabels = {
  biometric: "Biometric (Fingerprint)",
  facial_recognition: "Facial Recognition",
  manual: "Manual Entry",
  card_swipe: "ID Card Swipe",
}

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState(mockAttendanceRecords)
  const [shifts, setShifts] = useState(mockShifts)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("attendance")

  const [manualEntry, setManualEntry] = useState({
    employeeId: "",
    date: new Date().toISOString().split("T")[0],
    clockIn: "",
    clockOut: "",
    breakTime: 60,
    notes: "",
  })

  const [newShift, setNewShift] = useState({
    name: "",
    startTime: "",
    endTime: "",
    breakDuration: 60,
    department: "",
  })

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = record.date.toISOString().split("T")[0] === selectedDate
    const matchesDepartment = selectedDepartment === "all" || record.department === selectedDepartment

    return matchesSearch && matchesDate && matchesDepartment
  })

  const getAttendanceStats = () => {
    const todayRecords = attendanceRecords.filter(
      (r) => r.date.toISOString().split("T")[0] === new Date().toISOString().split("T")[0],
    )
    const present = todayRecords.filter((r) => r.status === "present").length
    const late = todayRecords.filter((r) => r.status === "late").length
    const absent = todayRecords.filter((r) => r.status === "absent").length
    const totalEmployees = 150 // Mock total
    const attendanceRate = ((present + late) / totalEmployees) * 100

    return { present, late, absent, attendanceRate, totalEmployees }
  }

  const stats = getAttendanceStats()

  const handleManualEntry = () => {
    const clockInTime = new Date(`${manualEntry.date}T${manualEntry.clockIn}`)
    const clockOutTime = new Date(`${manualEntry.date}T${manualEntry.clockOut}`)
    const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60) - manualEntry.breakTime / 60

    const newRecord = {
      id: `ATT-${String(attendanceRecords.length + 1).padStart(3, "0")}`,
      employeeId: manualEntry.employeeId,
      employeeName: "Selected Employee", // In real app, would fetch from employee ID
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Department",
      date: new Date(manualEntry.date),
      clockIn: manualEntry.clockIn,
      clockOut: manualEntry.clockOut,
      breakTime: manualEntry.breakTime,
      totalHours: Math.round(totalHours * 100) / 100,
      regularHours: Math.min(totalHours, 8),
      overtimeHours: Math.max(totalHours - 8, 0),
      status: "present",
      method: "manual",
      location: "Main Office",
      shift: "Day Shift (8:00-17:00)",
      notes: manualEntry.notes,
    }

    setAttendanceRecords([newRecord, ...attendanceRecords])
    setManualEntry({
      employeeId: "",
      date: new Date().toISOString().split("T")[0],
      clockIn: "",
      clockOut: "",
      breakTime: 60,
      notes: "",
    })
    setIsManualEntryOpen(false)
    toast({
      title: "Manual Entry Added",
      description: `Attendance record for ${manualEntry.employeeId} has been created.`,
    })
  }

  const handleCreateShift = () => {
    const shiftId = `SHIFT-${String(shifts.length + 1).padStart(3, "0")}`
    const newShiftData = {
      ...newShift,
      id: shiftId,
      employees: 0,
      isActive: true,
    }

    setShifts([...shifts, newShiftData])
    setNewShift({
      name: "",
      startTime: "",
      endTime: "",
      breakDuration: 60,
      department: "",
    })
    setIsShiftDialogOpen(false)
    toast({
      title: "Shift Created",
      description: `New shift "${newShift.name}" has been created.`,
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "late":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "absent":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "biometric":
        return <Fingerprint className="w-4 h-4 text-blue-600" />
      case "facial_recognition":
        return <Camera className="w-4 h-4 text-purple-600" />
      case "manual":
        return <Edit className="w-4 h-4 text-gray-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
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
        <div className="flex gap-2">
          <Button variant="outline">
            <Fingerprint className="w-4 h-4 mr-2" />
            Biometric Setup
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
            <DialogTrigger asChild>
              <Button>
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
                      value={manualEntry.employeeId}
                      onValueChange={(value) => setManualEntry({ ...manualEntry, employeeId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMP001">Kwame Asante (EMP001)</SelectItem>
                        <SelectItem value="EMP002">Ama Osei (EMP002)</SelectItem>
                        <SelectItem value="EMP003">Kofi Mensah (EMP003)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      type="date"
                      value={manualEntry.date}
                      onChange={(e) => setManualEntry({ ...manualEntry, date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="clockIn">Clock In Time</Label>
                    <Input
                      type="time"
                      value={manualEntry.clockIn}
                      onChange={(e) => setManualEntry({ ...manualEntry, clockIn: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="clockOut">Clock Out Time</Label>
                    <Input
                      type="time"
                      value={manualEntry.clockOut}
                      onChange={(e) => setManualEntry({ ...manualEntry, clockOut: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="breakTime">Break Time (minutes)</Label>
                    <Input
                      type="number"
                      value={manualEntry.breakTime}
                      onChange={(e) => setManualEntry({ ...manualEntry, breakTime: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    value={manualEntry.notes}
                    onChange={(e) => setManualEntry({ ...manualEntry, notes: e.target.value })}
                    placeholder="Add any relevant notes about this attendance entry"
                    rows={3}
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
                <p className="text-sm text-gray-600">Late Arrivals</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
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
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.attendanceRate.toFixed(1)}%</div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</div>
                <p className="text-sm text-gray-600">Total Employees</p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance">Daily Attendance</TabsTrigger>
          <TabsTrigger value="shifts">Shift Management</TabsTrigger>
          <TabsTrigger value="overtime">Overtime Tracking</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
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
              </div>
            </CardContent>
          </Card>

          {/* Attendance Records */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records ({filteredRecords.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
                              {record.status.replace("_", " ").toUpperCase()}
                            </Badge>
                            <div className="flex items-center text-sm text-gray-500">
                              {getMethodIcon(record.method)}
                              <span className="ml-1">{methodLabels[record.method as keyof typeof methodLabels]}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6 mt-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              In: {record.clockIn} | Out: {record.clockOut}
                            </div>
                            <div>Total: {record.totalHours}h</div>
                            <div>Regular: {record.regularHours}h</div>
                            {record.overtimeHours > 0 && (
                              <div className="text-blue-600">OT: {record.overtimeHours}h</div>
                            )}
                            <div>{record.department}</div>
                          </div>
                          {record.notes && <p className="text-sm text-gray-500 mt-1">Note: {record.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(record.status)}
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
                              <Download className="w-4 h-4 mr-2" />
                              Export Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria or date filter.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Shift Management</h3>
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
                    <Label htmlFor="shiftName">Shift Name</Label>
                    <Input
                      value={newShift.name}
                      onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                      placeholder="e.g., Morning Shift"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        type="time"
                        value={newShift.startTime}
                        onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        type="time"
                        value={newShift.endTime}
                        onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="breakDuration">Break Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={newShift.breakDuration}
                        onChange={(e) => setNewShift({ ...newShift, breakDuration: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input
                        value={newShift.department}
                        onChange={(e) => setNewShift({ ...newShift, department: e.target.value })}
                        placeholder="e.g., All Departments"
                      />
                    </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shifts.map((shift) => (
              <Card key={shift.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{shift.name}</CardTitle>
                    <Badge variant={shift.isActive ? "default" : "secondary"}>
                      {shift.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">
                        {shift.startTime} - {shift.endTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Break:</span>
                      <span>{shift.breakDuration} minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Employees:</span>
                      <span className="font-medium">{shift.employees}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="text-sm">{shift.department}</span>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Users className="w-4 h-4 mr-1" />
                        Assign
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overtime Tracking & Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Timer className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Overtime Management</h3>
                <p className="text-gray-500">Track and approve overtime hours with automated calculations</p>
                <Button className="mt-4 bg-transparent" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Configure Overtime Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Reports & Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics</h3>
                <p className="text-gray-500">Generate comprehensive attendance reports and insights</p>
                <div className="flex justify-center space-x-2 mt-4">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Monthly Report
                  </Button>
                  <Button variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Record Details Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attendance Record Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedRecord.employeeAvatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {selectedRecord.employeeName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedRecord.employeeName}</h3>
                  <p className="text-gray-600">
                    {selectedRecord.employeeId} • {selectedRecord.department}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span>{selectedRecord.date.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clock In:</span>
                    <span>{selectedRecord.clockIn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clock Out:</span>
                    <span>{selectedRecord.clockOut}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Break Time:</span>
                    <span>{selectedRecord.breakTime} minutes</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Hours:</span>
                    <span className="font-medium">{selectedRecord.totalHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Regular Hours:</span>
                    <span>{selectedRecord.regularHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Overtime:</span>
                    <span className="text-blue-600">{selectedRecord.overtimeHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method:</span>
                    <div className="flex items-center">
                      {getMethodIcon(selectedRecord.method)}
                      <span className="ml-1 text-sm">
                        {methodLabels[selectedRecord.method as keyof typeof methodLabels]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={statusColors[selectedRecord.status as keyof typeof statusColors]}>
                    {selectedRecord.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span>{selectedRecord.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shift:</span>
                  <span>{selectedRecord.shift}</span>
                </div>
              </div>

              {selectedRecord.notes && (
                <div>
                  <span className="text-gray-600">Notes:</span>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-lg mt-1">{selectedRecord.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                  Close
                </Button>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Record
                </Button>
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
