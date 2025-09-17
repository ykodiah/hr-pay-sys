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
} from "lucide-react"

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
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("today")
  const [showClockInDialog, setShowClockInDialog] = useState(false)
  const [showShiftDialog, setShowShiftDialog] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Mock data
  const attendanceRecords: AttendanceRecord[] = [
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
      method: "fingerprint",
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
    },
  ]

  const shifts: Shift[] = [
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
  ]

  const biometricDevices: BiometricDevice[] = [
    {
      id: "DEV001",
      name: "Main Entrance Scanner",
      type: "fingerprint",
      location: "Main Office Entrance",
      status: "online",
      lastSync: "2024-02-15 09:30",
    },
    {
      id: "DEV002",
      name: "Facial Recognition Camera",
      type: "facial",
      location: "Reception Area",
      status: "online",
      lastSync: "2024-02-15 09:25",
    },
    {
      id: "DEV003",
      name: "Card Reader - Floor 2",
      type: "card",
      location: "Second Floor",
      status: "offline",
      lastSync: "2024-02-14 18:00",
    },
  ]

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

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleBiometricClockIn = (method: string) => {
    console.log(`[v0] Biometric clock-in initiated with method: ${method}`)
    // Simulate biometric authentication
    setTimeout(() => {
      alert(`Clock-in successful using ${method}!`)
      setShowClockInDialog(false)
    }, 2000)
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
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center space-y-2 bg-transparent"
                    onClick={() => handleBiometricClockIn("fingerprint")}
                  >
                    <Fingerprint className="w-6 h-6 text-emerald-600" />
                    <span>Fingerprint Scanner</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center space-y-2 bg-transparent"
                    onClick={() => handleBiometricClockIn("facial")}
                  >
                    <Camera className="w-6 h-6 text-blue-600" />
                    <span>Facial Recognition</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center space-y-2 bg-transparent"
                    onClick={() => handleBiometricClockIn("manual")}
                  >
                    <Timer className="w-6 h-6 text-orange-600" />
                    <span>Manual Entry</span>
                  </Button>
                </div>
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
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">94.7% attendance rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">5.3% of present employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">5.3% absence rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5</div>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devices Online</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2/3</div>
            <p className="text-xs text-muted-foreground">1 device offline</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shifts">Shift Management</TabsTrigger>
          <TabsTrigger value="overtime">Overtime</TabsTrigger>
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
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Attendance Records */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
              <CardDescription>Real-time attendance tracking for all employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{record.employeeName}</p>
                        <p className="text-sm text-gray-600">ID: {record.employeeId}</p>
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
                      <Badge className={getStatusColor(record.status)}>
                        {record.status.replace("-", " ").toUpperCase()}
                      </Badge>
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
                      <Label htmlFor="shiftName">Shift Name</Label>
                      <Input placeholder="e.g., Morning Shift" />
                    </div>
                    <div>
                      <Label htmlFor="breakDuration">Break Duration (minutes)</Label>
                      <Input type="number" placeholder="60" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input type="time" />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input type="time" />
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
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowShiftDialog(false)}>
                      Cancel
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">Create Shift</Button>
                  </div>
                </div>
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
                        Edit Shift
                      </Button>
                      <Button variant="outline" size="sm">
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
              <CardDescription>Review and approve overtime requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Kwame Asante</p>
                    <p className="text-sm text-gray-600">2.5 hours overtime • Feb 15, 2024</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>
                    <Button size="sm" variant="outline">
                      Approve
                    </Button>
                    <Button size="sm" variant="outline">
                      Reject
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Ama Osei</p>
                    <p className="text-sm text-gray-600">1.5 hours overtime • Feb 14, 2024</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">Approved</Badge>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Biometric Devices</CardTitle>
              <CardDescription>Monitor and manage biometric attendance devices</CardDescription>
            </CardHeader>
            <CardContent>
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
                        <p className="text-sm text-gray-600">
                          {device.location} • Last sync: {device.lastSync}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getDeviceStatusColor(device.status)}>{device.status.toUpperCase()}</Badge>
                      <Button size="sm" variant="outline">
                        Configure
                      </Button>
                      <Button size="sm" variant="outline">
                        Sync Data
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
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  Daily Attendance Report
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  Monthly Attendance Summary
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  Overtime Report
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  Late Arrivals Report
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
                  <p className="text-2xl font-bold text-emerald-600">94.7%</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Average Daily Hours</p>
                  <p className="text-2xl font-bold text-blue-600">8.2h</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-orange-800">Monthly Overtime</p>
                  <p className="text-2xl font-bold text-orange-600">156h</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
