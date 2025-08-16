"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Clock,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Eye,
  Timer,
  Smartphone,
  Monitor,
  Fingerprint,
  BarChart3,
  Settings,
  PlayCircle,
  PauseCircle,
  StopCircle,
} from "lucide-react"

interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  employeeAvatar: string
  department: string
  date: string
  clockIn: string | null
  clockOut: string | null
  breakStart: string | null
  breakEnd: string | null
  totalHours: number
  overtimeHours: number
  status: "present" | "absent" | "late" | "half-day" | "on-leave"
  location: string
  device: "web" | "mobile" | "biometric" | "kiosk"
  notes: string
}

interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  breakDuration: number
  isActive: boolean
  employees: string[]
  overtimeThreshold: number
}

interface TimeEntry {
  id: string
  employeeId: string
  employeeName: string
  project: string
  task: string
  startTime: string
  endTime: string | null
  duration: number
  billable: boolean
  status: "active" | "paused" | "completed"
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState("attendance")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")

  const [attendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: "1",
      employeeId: "EMP001",
      employeeName: "Kwame Asante",
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Technology",
      date: "2025-01-15",
      clockIn: "08:30:00",
      clockOut: "17:45:00",
      breakStart: "12:00:00",
      breakEnd: "13:00:00",
      totalHours: 8.25,
      overtimeHours: 0.25,
      status: "present",
      location: "Office - Accra",
      device: "biometric",
      notes: "",
    },
    {
      id: "2",
      employeeId: "EMP002",
      employeeName: "Ama Osei",
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Human Resources",
      date: "2025-01-15",
      clockIn: "09:15:00",
      clockOut: "18:00:00",
      breakStart: "12:30:00",
      breakEnd: "13:30:00",
      totalHours: 7.75,
      overtimeHours: 0,
      status: "late",
      location: "Office - Accra",
      device: "web",
      notes: "Traffic delay",
    },
    {
      id: "3",
      employeeId: "EMP003",
      employeeName: "Kofi Mensah",
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Marketing",
      date: "2025-01-15",
      clockIn: null,
      clockOut: null,
      breakStart: null,
      breakEnd: null,
      totalHours: 0,
      overtimeHours: 0,
      status: "on-leave",
      location: "",
      device: "web",
      notes: "Sick leave approved",
    },
    {
      id: "4",
      employeeId: "EMP004",
      employeeName: "Akosua Boateng",
      employeeAvatar: "/placeholder.svg?height=40&width=40",
      department: "Finance",
      date: "2025-01-15",
      clockIn: "08:00:00",
      clockOut: "12:00:00",
      breakStart: null,
      breakEnd: null,
      totalHours: 4,
      overtimeHours: 0,
      status: "half-day",
      location: "Remote",
      device: "mobile",
      notes: "Half day - personal appointment",
    },
  ])

  const [shifts] = useState<Shift[]>([
    {
      id: "1",
      name: "Day Shift",
      startTime: "08:00",
      endTime: "17:00",
      breakDuration: 60,
      isActive: true,
      employees: ["EMP001", "EMP002", "EMP004"],
      overtimeThreshold: 8,
    },
    {
      id: "2",
      name: "Night Shift",
      startTime: "22:00",
      endTime: "06:00",
      breakDuration: 60,
      isActive: true,
      employees: ["EMP005", "EMP006"],
      overtimeThreshold: 8,
    },
    {
      id: "3",
      name: "Flexible Hours",
      startTime: "09:00",
      endTime: "18:00",
      breakDuration: 60,
      isActive: true,
      employees: ["EMP003", "EMP007"],
      overtimeThreshold: 8,
    },
  ])

  const [timeEntries] = useState<TimeEntry[]>([
    {
      id: "1",
      employeeId: "EMP001",
      employeeName: "Kwame Asante",
      project: "AkwaabaHRPay Development",
      task: "Frontend Development",
      startTime: "09:00:00",
      endTime: "12:00:00",
      duration: 3,
      billable: true,
      status: "completed",
    },
    {
      id: "2",
      employeeId: "EMP001",
      employeeName: "Kwame Asante",
      project: "Client Portal",
      task: "Bug Fixes",
      startTime: "14:00:00",
      endTime: null,
      duration: 2.5,
      billable: true,
      status: "active",
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-700"
      case "absent":
        return "bg-red-100 text-red-700"
      case "late":
        return "bg-yellow-100 text-yellow-700"
      case "half-day":
        return "bg-blue-100 text-blue-700"
      case "on-leave":
        return "bg-purple-100 text-purple-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case "web":
        return <Monitor className="w-4 h-4" />
      case "mobile":
        return <Smartphone className="w-4 h-4" />
      case "biometric":
        return <Fingerprint className="w-4 h-4" />
      case "kiosk":
        return <Monitor className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || record.status === statusFilter
    const matchesDepartment = departmentFilter === "all" || record.department === departmentFilter
    return matchesSearch && matchesStatus && matchesDepartment
  })

  const attendanceStats = {
    present: attendanceRecords.filter((r) => r.status === "present").length,
    absent: attendanceRecords.filter((r) => r.status === "absent").length,
    late: attendanceRecords.filter((r) => r.status === "late").length,
    onLeave: attendanceRecords.filter((r) => r.status === "on-leave").length,
    totalHours: attendanceRecords.reduce((sum, r) => sum + r.totalHours, 0),
    overtimeHours: attendanceRecords.reduce((sum, r) => sum + r.overtimeHours, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time & Attendance</h1>
          <p className="text-gray-600">Monitor employee attendance, shifts, and time tracking.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Manual Entry
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
                <p className="text-sm text-gray-600">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
                <p className="text-sm text-gray-600">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</div>
                <p className="text-sm text-gray-600">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{attendanceStats.onLeave}</div>
                <p className="text-sm text-gray-600">On Leave</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{attendanceStats.totalHours.toFixed(1)}</div>
                <p className="text-sm text-gray-600">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{attendanceStats.overtimeHours.toFixed(1)}</div>
                <p className="text-sm text-gray-600">Overtime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="attendance">Daily Attendance</TabsTrigger>
          <TabsTrigger value="shifts">Shift Management</TabsTrigger>
          <TabsTrigger value="timetracking">Time Tracking</TabsTrigger>
          <TabsTrigger value="overtime">Overtime</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="half-day">Half Day</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="bg-transparent">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>

          {/* Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Daily Attendance - {new Date(selectedDate).toLocaleDateString()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Break</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Overtime</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={record.employeeAvatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {record.employeeName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{record.employeeName}</p>
                            <p className="text-sm text-gray-500">{record.department}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{record.clockIn || "-"}</TableCell>
                      <TableCell className="font-mono">{record.clockOut || "-"}</TableCell>
                      <TableCell className="font-mono">
                        {record.breakStart && record.breakEnd ? `${record.breakStart} - ${record.breakEnd}` : "-"}
                      </TableCell>
                      <TableCell className="font-medium">{record.totalHours.toFixed(2)}h</TableCell>
                      <TableCell className="font-medium">
                        {record.overtimeHours > 0 ? (
                          <span className="text-orange-600">{record.overtimeHours.toFixed(2)}h</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>{record.status.replace("-", " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{record.location || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getDeviceIcon(record.device)}
                          <span className="text-sm capitalize">{record.device}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Shift Management</h2>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Shift
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {shifts.map((shift) => (
              <Card key={shift.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Timer className="w-5 h-5 text-emerald-600" />
                      <span>{shift.name}</span>
                    </CardTitle>
                    <Badge className={shift.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {shift.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Start Time</Label>
                      <p className="font-medium">{shift.startTime}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">End Time</Label>
                      <p className="font-medium">{shift.endTime}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Break Duration</Label>
                      <p className="font-medium">{shift.breakDuration} minutes</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Overtime Threshold</Label>
                      <p className="font-medium">{shift.overtimeThreshold} hours</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Assigned Employees</Label>
                    <p className="font-medium">{shift.employees.length} employees</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="w-3 h-3 mr-1" />
                      Assign
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-3 h-3 mr-1" />
                      Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timetracking" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Time Tracking & Project Costing</h2>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <PlayCircle className="w-4 h-4 mr-2" />
              Start Timer
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active Time Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Billable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.employeeName}</TableCell>
                      <TableCell>{entry.project}</TableCell>
                      <TableCell>{entry.task}</TableCell>
                      <TableCell className="font-mono">{entry.startTime}</TableCell>
                      <TableCell className="font-medium">{entry.duration.toFixed(1)}h</TableCell>
                      <TableCell>
                        <Badge className={entry.billable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                          {entry.billable ? "Billable" : "Non-billable"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            entry.status === "active"
                              ? "bg-green-100 text-green-700"
                              : entry.status === "paused"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                          }
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {entry.status === "active" ? (
                            <Button variant="outline" size="sm">
                              <PauseCircle className="w-3 h-3" />
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm">
                              <PlayCircle className="w-3 h-3" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <StopCircle className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overtime" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Overtime Management</h2>
            <Button variant="outline" className="bg-transparent">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overtime Report
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Overtime</p>
                    <p className="text-2xl font-bold text-orange-600">{attendanceStats.overtimeHours.toFixed(1)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employees with OT</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {attendanceRecords.filter((r) => r.overtimeHours > 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg OT per Employee</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {(
                        attendanceStats.overtimeHours /
                        Math.max(attendanceRecords.filter((r) => r.overtimeHours > 0).length, 1)
                      ).toFixed(1)}
                      h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Overtime Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Regular Hours</TableHead>
                    <TableHead>Overtime Hours</TableHead>
                    <TableHead>OT Rate</TableHead>
                    <TableHead>OT Pay</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords
                    .filter((r) => r.overtimeHours > 0)
                    .map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.employeeName}</TableCell>
                        <TableCell>{record.department}</TableCell>
                        <TableCell>{(record.totalHours - record.overtimeHours).toFixed(2)}h</TableCell>
                        <TableCell className="font-medium text-orange-600">
                          {record.overtimeHours.toFixed(2)}h
                        </TableCell>
                        <TableCell>1.5x</TableCell>
                        <TableCell className="font-medium">
                          GHS {(record.overtimeHours * 25 * 1.5).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700">Approved</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Attendance Reports</h2>
            <Button variant="outline" className="bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Daily Attendance Summary
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Clock className="w-4 h-4 mr-2" />
                  Weekly Timesheet Report
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Monthly Overtime Report
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Users className="w-4 h-4 mr-2" />
                  Department Attendance
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Late Arrivals Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Report Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attendance">Attendance Summary</SelectItem>
                      <SelectItem value="timesheet">Timesheet Details</SelectItem>
                      <SelectItem value="overtime">Overtime Analysis</SelectItem>
                      <SelectItem value="productivity">Productivity Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Generate Report</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
