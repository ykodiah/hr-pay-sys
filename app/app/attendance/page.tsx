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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import {
  Clock,
  Users,
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
  Filter,
  MapPinned,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import {
  clockIn,
  clockOut,
  getFilteredAttendance,
  getCompanyDetails,
  getOvertimeRequests,
  approveOvertimeRequest,
  rejectOvertimeRequest,
  getShifts,
  createShift,
  updateShift,
  getBiometricDevices,
  syncBiometricDevice,
  updateDeviceStatus,
} from "@/app/actions/attendance"
import { generateAttendancePDF, downloadPDF } from "@/lib/attendance/pdf-generator"

// interface AttendanceRecord {
//   id: string
//   employeeId: string
//   employeeName: string
//   date: string
//   clockIn: string
//   clockOut: string
//   totalHours: number
//   overtimeHours: number
//   status: "present" | "late" | "absent" | "early-departure"
//   location: string
//   method: "biometric" | "manual" | "mobile"
//   aiScore?: number
//   hasMissingPunch?: boolean
// }

// interface Shift {
//   id: string
//   name: string
//   startTime: string
//   endTime: string
//   breakDuration: number
//   employees: string[]
//   isActive: boolean
// }

// interface BiometricDevice {
//   id: string
//   name: string
//   type: "fingerprint" | "facial" | "card"
//   location: string
//   status: "online" | "offline"
//   lastSync: string
//   uptime?: number
// }

// interface OvertimeRequest {
//   id: string
//   employeeId: string
//   employeeName: string
//   hours: number
//   date: string
//   reason: string
//   status: "pending" | "approved" | "rejected"
//   submittedAt: string
// }

export default function AttendancePage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("today")
  const [customStartDate, setCustomStartDate] = useState<Date>()
  const [customEndDate, setCustomEndDate] = useState<Date>()
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [divisionFilter, setDivisionFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [showClockInDialog, setShowClockInDialog] = useState(false)
  const [showShiftDialog, setShowShiftDialog] = useState(false)
  const [showOvertimeDialog, setShowOvertimeDialog] = useState(false)
  const [showDeviceDialog, setShowDeviceDialog] = useState(false)
  const [showCustomDateDialog, setShowCustomDateDialog] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [clockInMethod, setClockInMethod] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [geolocation, setGeolocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [shifts, setShifts] = useState<any[]>([])
  const [biometricDevices, setBiometricDevices] = useState<any[]>([])
  const [overtimeRequests, setOvertimeRequests] = useState<any[]>([])
  const [companyInfo, setCompanyInfo] = useState<any>(null)
  const [departments, setDepartments] = useState<string[]>([])
  const [divisions, setDivisions] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])

  const [selectedRecords, setSelectedRecords] = useState<string[]>([])

  const [newShift, setNewShift] = useState({
    name: "",
    startTime: "",
    endTime: "",
    breakDuration: 60,
    employees: [] as string[],
  })

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Geolocation error:", error)
          setLocationError("Unable to get location. Clock-in will proceed without GPS data.")
        },
      )
    } else {
      setLocationError("Geolocation not supported by browser")
    }
  }, [])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadAttendanceData()
  }, [dateFilter, customStartDate, customEndDate, statusFilter, departmentFilter, divisionFilter, locationFilter])

  useEffect(() => {
    loadOtherData()
  }, [])

  const loadAttendanceData = async () => {
    try {
      setIsLoading(true)

      // Calculate date range based on filter
      let startDate: string | undefined
      let endDate: string | undefined
      const today = new Date()

      if (dateFilter === "today") {
        startDate = endDate = format(today, "yyyy-MM-dd")
      } else if (dateFilter === "yesterday") {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        startDate = endDate = format(yesterday, "yyyy-MM-dd")
      } else if (dateFilter === "this-week") {
        const weekStart = new Date(today)
        weekStart.setDate(today.getDay() === 0 ? today.getDate() - 6 : today.getDate() - today.getDay()) // Adjust for Sunday start
        startDate = format(weekStart, "yyyy-MM-dd")
        endDate = format(today, "yyyy-MM-dd")
      } else if (dateFilter === "this-month") {
        startDate = format(new Date(today.getFullYear(), today.getMonth(), 1), "yyyy-MM-dd")
        endDate = format(today, "yyyy-MM-dd")
      } else if (dateFilter === "custom" && customStartDate && customEndDate) {
        startDate = format(customStartDate, "yyyy-MM-dd")
        endDate = format(customEndDate, "yyyy-MM-dd")
      }

      const data = await getFilteredAttendance({
        startDate,
        endDate,
        status: statusFilter !== "all" ? statusFilter : undefined,
        department: departmentFilter !== "all" ? departmentFilter : undefined,
        division: divisionFilter !== "all" ? divisionFilter : undefined,
        location: locationFilter !== "all" ? locationFilter : undefined,
      })

      setAttendanceRecords(data || [])

      // Extract unique departments, divisions, and locations
      const uniqueDepts = new Set<string>()
      const uniqueDivs = new Set<string>()
      const uniqueLocs = new Set<string>()

      data?.forEach((record: any) => {
        if (record.employee?.department) uniqueDepts.add(record.employee.department)
        if (record.employee?.division) uniqueDivs.add(record.employee.division)
        if (record.employee?.subsidiaries?.location) uniqueLocs.add(record.employee.subsidiaries.location)
      })

      setDepartments(Array.from(uniqueDepts))
      setDivisions(Array.from(uniqueDivs))
      setLocations(Array.from(uniqueLocs))
    } catch (error) {
      console.error("Error loading attendance:", error)
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadOtherData = async () => {
    try {
      const [shiftsData, devicesData, overtimeData, companyData] = await Promise.all([
        getShifts(),
        getBiometricDevices(),
        getOvertimeRequests({ status: undefined }),
        getCompanyDetails(),
      ])

      setShifts(shiftsData || [])
      setBiometricDevices(devicesData || [])
      setOvertimeRequests(overtimeData || [])
      setCompanyInfo(companyData)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const stats = {
    presentToday: attendanceRecords.filter((r) => r.status === "present" || r.status === "late").length,
    lateArrivals: attendanceRecords.filter((r) => r.is_late || r.status === "late").length,
    absent: attendanceRecords.filter((r) => r.status === "absent").length,
    totalOvertimeHours: overtimeRequests
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + (r.hours_requested || 0), 0),
    devicesOnline: biometricDevices.filter((d) => d.is_online).length,
    totalDevices: biometricDevices.length,
    attendanceRate:
      attendanceRecords.length > 0
        ? Math.round(
            (attendanceRecords.filter((r) => r.status === "present" || r.status === "late").length /
              attendanceRecords.length) *
              100,
          )
        : 0,
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
      record.employee?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleBiometricClockIn = async (method: string, isClockOut = false) => {
    if (!selectedEmployee) {
      toast({
        title: "Validation Error",
        description: "Please enter an employee ID",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setClockInMethod(method)

    try {
      if (isClockOut) {
        await clockOut(selectedEmployee, geolocation || undefined)
        toast({
          title: "Clock-out successful",
          description: `Employee clocked out at ${currentTime.toLocaleTimeString("en-GB", { hour12: false })}`,
        })
      } else {
        await clockIn(selectedEmployee, geolocation || undefined)
        toast({
          title: "Clock-in successful",
          description: `${method} authentication completed at ${currentTime.toLocaleTimeString("en-GB", { hour12: false })}${geolocation ? " with GPS location" : ""}`,
        })
      }

      await loadAttendanceData()
      setShowClockInDialog(false)
      setSelectedEmployee("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process clock in/out",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateShift = async () => {
    if (!newShift.name || !newShift.startTime || !newShift.endTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      await createShift({
        shift_name: newShift.name,
        shift_code: newShift.name.toUpperCase().replace(/\s/g, "_"),
        start_time: newShift.startTime,
        end_time: newShift.endTime,
        break_duration_minutes: newShift.breakDuration,
        grace_period_minutes: 15,
        days_of_week: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        is_active: true,
        company_id: "", // This should be fetched or passed
      })

      await loadOtherData()
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
        description: `${newShift.name} has been created successfully`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create shift",
        variant: "destructive",
      })
    }
  }

  const toggleShiftStatus = async (shiftId: string) => {
    try {
      const shift = shifts.find((s) => s.id === shiftId)
      await updateShift(shiftId, { is_active: !shift?.is_active })
      await loadOtherData()

      toast({
        title: shift?.is_active ? "Shift Deactivated" : "Shift Activated",
        description: `${shift?.shift_name} has been ${shift?.is_active ? "deactivated" : "activated"}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update shift",
        variant: "destructive",
      })
    }
  }

  const handleOvertimeAction = async (requestId: string, action: "approved" | "rejected") => {
    try {
      if (action === "approved") {
        await approveOvertimeRequest(requestId)
      } else {
        await rejectOvertimeRequest(requestId, "Not approved by manager") // Consider adding a reason field if needed
      }

      await loadOtherData()

      const request = overtimeRequests.find((r) => r.id === requestId)
      toast({
        title: action === "approved" ? "Overtime Approved" : "Overtime Rejected",
        description: `${request?.employee?.full_name}'s ${request?.hours_requested}h overtime request has been ${action}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process overtime request",
        variant: "destructive",
      })
    }
  }

  const handleDeviceSync = async (deviceId: string) => {
    try {
      await syncBiometricDevice(deviceId)
      await loadOtherData()

      const device = biometricDevices.find((d) => d.id === deviceId)
      toast({
        title: "Device Synced",
        description: `${device?.device_name} has been synchronized`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sync device",
        variant: "destructive",
      })
    }
  }

  const toggleDeviceStatus = async (deviceId: string) => {
    try {
      const device = biometricDevices.find((d) => d.id === deviceId)
      const newStatus = device?.is_online ? "inactive" : "active"
      await updateDeviceStatus(deviceId, newStatus)
      await loadOtherData()

      toast({
        title: "Device Status Updated",
        description: `${device?.device_name} is now ${newStatus}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update device",
        variant: "destructive",
      })
    }
  }

  const handleExportReport = async (reportType: string) => {
    try {
      toast({
        title: "Generating Report",
        description: `${reportType} is being prepared...`,
      })

      // Prepare data for PDF
      const reportData = filteredRecords.map((record) => ({
        employeeName: record.employee?.full_name || "Unknown",
        employeeId: record.employee?.employee_id || "N/A",
        department: record.employee?.department || "N/A",
        division: record.employee?.division || "N/A",
        location: record.employee?.subsidiaries?.location || "N/A",
        date: record.date,
        clockIn: record.clock_in ? format(new Date(record.clock_in), "HH:mm") : "-",
        clockOut: record.clock_out ? format(new Date(record.clock_out), "HH:mm") : "-",
        totalHours: record.total_hours || 0,
        overtimeHours: record.overtime_hours || 0,
        status: record.status,
      }))

      // Generate PDF
      const pdf = await generateAttendancePDF(
        reportType,
        reportData,
        {
          company_name: companyInfo?.company_name || "Company Name",
          address: companyInfo?.address || "",
          subsidiaries: companyInfo?.subsidiaries || [],
        },
        undefined, // Can add more parameters if generateAttendancePDF supports them
        customStartDate && customEndDate
          ? {
              startDate: format(customStartDate, "yyyy-MM-dd"),
              endDate: format(customEndDate, "yyyy-MM-dd"),
            }
          : dateFilter === "today"
            ? { startDate: format(new Date(), "yyyy-MM-dd"), endDate: format(new Date(), "yyyy-MM-dd") }
            : dateFilter === "yesterday"
              ? {
                  startDate: format(new Date(new Date().setDate(new Date().getDate() - 1)), "yyyy-MM-dd"),
                  endDate: format(new Date(new Date().setDate(new Date().getDate() - 1)), "yyyy-MM-dd"),
                }
              : dateFilter === "this-week"
                ? {
                    startDate: format(
                      new Date(new Date().setDate(new Date().getDate() - new Date().getDay())),
                      "yyyy-MM-dd",
                    ),
                    endDate: format(new Date(), "yyyy-MM-dd"),
                  }
                : dateFilter === "this-month"
                  ? {
                      startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
                      endDate: format(new Date(), "yyyy-MM-dd"),
                    }
                  : undefined,
      )

      downloadPDF(pdf, reportType.replace(/\s/g, "_"))

      toast({
        title: "Report Downloaded",
        description: `${reportType} has been downloaded successfully`,
      })
    } catch (error: any) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      })
    }
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
      description: `Attendance reminder sent to ${record?.employee?.full_name}`,
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
                <DialogDescription>
                  Choose your preferred authentication method
                  {geolocation && (
                    <div className="flex items-center mt-2 text-xs text-emerald-600">
                      <MapPinned className="w-3 h-3 mr-1" />
                      GPS location detected
                    </div>
                  )}
                  {locationError && (
                    <div className="flex items-center mt-2 text-xs text-amber-600">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {locationError}
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employee">Employee ID *</Label>
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
                    onClick={() => handleBiometricClockIn("fingerprint", false)}
                    disabled={isProcessing}
                  >
                    <Fingerprint className="w-6 h-6 text-emerald-600" />
                    <span>Clock In - Fingerprint</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center space-y-2 bg-transparent"
                    onClick={() => handleBiometricClockIn("facial", false)}
                    disabled={isProcessing}
                  >
                    <Camera className="w-6 h-6 text-blue-600" />
                    <span>Clock In - Facial Recognition</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center space-y-2 bg-transparent border-orange-300"
                    onClick={() => handleBiometricClockIn("manual", true)} // Assuming manual is for Clock Out
                    disabled={isProcessing}
                  >
                    <Timer className="w-6 h-6 text-orange-600" />
                    <span>Clock Out</span>
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
              {attendanceRecords.length > 0 ? ((stats.absent / attendanceRecords.length) * 100).toFixed(1) : 0}% absence
              rate
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
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
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
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
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
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
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
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-48">
                <MapPin className="w-4 h-4 mr-2" />
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-64 bg-transparent">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {dateFilter === "custom" && customStartDate && customEndDate
                    ? `${format(customStartDate, "MMM dd")} - ${format(customEndDate, "MMM dd")}`
                    : dateFilter === "today"
                      ? "Today"
                      : dateFilter === "yesterday"
                        ? "Yesterday"
                        : dateFilter === "this-week"
                          ? "This Week"
                          : "This Month"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 space-y-2 border-b">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setDateFilter("today")
                      setCustomStartDate(undefined)
                      setCustomEndDate(undefined)
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setDateFilter("yesterday")
                      setCustomStartDate(undefined)
                      setCustomEndDate(undefined)
                    }}
                  >
                    Yesterday
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setDateFilter("this-week")
                      setCustomStartDate(undefined)
                      setCustomEndDate(undefined)
                    }}
                  >
                    This Week
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setDateFilter("this-month")
                      setCustomStartDate(undefined)
                      setCustomEndDate(undefined)
                    }}
                  >
                    This Month
                  </Button>
                </div>
                <div className="p-3">
                  <Label className="text-xs font-medium mb-2 block">Custom Range</Label>
                  <div className="space-y-2">
                    <Calendar
                      mode="range"
                      selected={{
                        from: customStartDate,
                        to: customEndDate,
                      }}
                      onSelect={(range) => {
                        if (range?.from) setCustomStartDate(range.from)
                        if (range?.to) {
                          setCustomEndDate(range.to)
                          setDateFilter("custom")
                        }
                      }}
                      numberOfMonths={2}
                      className="rounded-md border"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
                  <CardTitle>Attendance Records</CardTitle>
                  <CardDescription>Real-time attendance tracking for all employees</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                  {selectedRecords.length === filteredRecords.length ? "Deselect All" : "Select All"} (
                  {filteredRecords.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading attendance records...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No attendance records found</p>
                </div>
              ) : (
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
                          <p className="font-medium">{record.employee?.full_name || "Unknown"}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>ID: {record.employee?.employee_id || "N/A"}</span>
                            <span>•</span>
                            <span>{record.employee?.department || "N/A"}</span>
                            {record.employee?.division && (
                              <>
                                <span>•</span>
                                <span>{record.employee.division}</span>
                              </>
                            )}
                            {record.gps_clock_in && (
                              <Badge variant="outline" className="text-xs">
                                <MapPinned className="w-3 h-3 mr-1" />
                                GPS
                              </Badge>
                            )}
                            {record.ai_anomaly_score && (
                              <Badge variant="outline" className="text-xs">
                                AI Score: {record.ai_anomaly_score}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="font-medium text-gray-600">Clock In</p>
                          <p>{record.clock_in ? format(new Date(record.clock_in), "HH:mm") : "—"}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-gray-600">Clock Out</p>
                          <p>{record.clock_out ? format(new Date(record.clock_out), "HH:mm") : "—"}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-gray-600">Total Hours</p>
                          <p>{record.total_hours?.toFixed(2) || "0.00"}h</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-gray-600">Overtime</p>
                          <p>{record.overtime_hours?.toFixed(2) || "0.00"}h</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={
                              record.status === "present"
                                ? "bg-green-100 text-green-800"
                                : record.status === "late"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : record.status === "absent"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-orange-100 text-orange-800"
                            }
                          >
                            {record.status?.toUpperCase()}
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
              )}
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
                      <CardTitle className="text-lg">{shift.shift_name}</CardTitle>
                      <CardDescription>
                        {shift.start_time} - {shift.end_time} • {shift.break_duration_minutes}min break
                      </CardDescription>
                    </div>
                    <Badge className={shift.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {shift.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Assigned Employees</p>
                      <p className="text-sm">{shift.employees?.length || 0} employees assigned</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit Shift
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleShiftStatus(shift.id)}>
                        {shift.is_active ? "Deactivate" : "Activate"}
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
                      <p className="font-medium">{request.employee?.full_name}</p>
                      <p className="text-sm text-gray-600">
                        {request.hours_requested} hours overtime • {request.date}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Reason: {request.reason}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted: {new Date(request.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getOvertimeStatusColor(request.status)}>{request.status?.toUpperCase()}</Badge>
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
                        <p className="font-medium">{device.device_name}</p>
                        <p className="text-sm text-gray-600">{device.location}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-gray-500">
                            Last sync: {device.last_sync ? new Date(device.last_sync).toLocaleString() : "Never"}
                          </p>
                          {device.uptime_percentage !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              Uptime: {device.uptime_percentage}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getDeviceStatusColor(device.is_online ? "online" : "offline")}>
                        {device.is_online ? "ONLINE" : "OFFLINE"}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => handleDeviceSync(device.id)}>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Sync Data
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleDeviceStatus(device.id)}>
                        <Settings className="w-4 h-4 mr-1" />
                        {device.is_online ? "Disable" : "Enable"}
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
                <CardDescription>Generate comprehensive attendance reports with company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleExportReport("Daily Attendance Report")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Daily Attendance Report (PDF)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleExportReport("Monthly Attendance Summary")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Monthly Attendance Summary (PDF)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleExportReport("Overtime Report")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Overtime Report (PDF)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleExportReport("Late Arrivals Report")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Late Arrivals Report (PDF)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleExportReport("Absenteeism Report")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Absenteeism Report (PDF)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleExportReport("Department Attendance Analysis")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Department Analysis (PDF)
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
                  <p className="text-xs text-emerald-700 mt-1">Based on current filters</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Total Records</p>
                  <p className="text-2xl font-bold text-blue-600">{attendanceRecords.length}</p>
                  <p className="text-xs text-blue-700 mt-1">In selected period</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-orange-800">Pending Overtime</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.totalOvertimeHours.toFixed(1)}h</p>
                  <p className="text-xs text-orange-700 mt-1">
                    {overtimeRequests.filter((r) => r.status === "pending").length} requests pending
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">Device Reliability</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.totalDevices > 0 ? ((stats.devicesOnline / stats.totalDevices) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    {stats.devicesOnline} of {stats.totalDevices} devices online
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
