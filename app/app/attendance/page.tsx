"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  UserCheck,
  TrendingUp,
  MapPin,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Edit,
  Wifi,
  MapPinned,
  Navigation,
  Smartphone,
  Monitor,
  ArrowUpDown,
  Loader2,
  Filter,
  CreditCard,
  Trash2,
  MoreHorizontal,
  Brain,
  Sparkles,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  getAttendanceRecords,
  getShifts,
  getBiometricDevices,
  getOvertimeRequests,
  getAttendanceStats,
  getClockStatus,
  clockIn,
  clockOut,
  createShift,
  updateShift,
  deleteShift,
  createBiometricDevice,
  syncBiometricDevice,
  toggleDeviceStatus,
  createOvertimeRequest,
  updateOvertimeRequest,
  generateAttendanceReport,
  type AttendanceRecord,
  type Shift,
  type BiometricDevice,
  type OvertimeRequest,
} from "@/app/actions/attendance"

export default function AttendancePage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("today")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [divisionFilter, setDivisionFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // Data states
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [biometricDevices, setBiometricDevices] = useState<BiometricDevice[]>([])
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([])
  const [stats, setStats] = useState({
    presentToday: 0,
    lateArrivals: 0,
    absent: 0,
    totalEmployees: 0,
    devicesOnline: 0,
    totalDevices: 0,
    pendingOvertime: 0,
    attendanceRate: 0,
  })
  const [clockStatus, setClockStatus] = useState({ isClockedIn: false, record: null as AttendanceRecord | null })

  // Dialog states
  const [showClockDialog, setShowClockDialog] = useState(false)
  const [showShiftDialog, setShowShiftDialog] = useState(false)
  const [showDeviceDialog, setShowDeviceDialog] = useState(false)
  const [showOvertimeDialog, setShowOvertimeDialog] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)

  // Form states
  const [newShift, setNewShift] = useState({
    name: "",
    start_time: "09:00",
    end_time: "17:00",
    break_duration_minutes: 60,
    grace_period_minutes: 15,
    working_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    department: "",
    division: "",
    location: "",
  })

  const [newDevice, setNewDevice] = useState({
    name: "",
    type: "fingerprint",
    location: "",
    ip_address: "",
    serial_number: "",
  })

  const [newOvertime, setNewOvertime] = useState({
    date: new Date().toISOString().split("T")[0],
    hours_requested: 2,
    reason: "",
  })

  // GPS state
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [recordsRes, shiftsRes, devicesRes, overtimeRes, statsRes, statusRes] = await Promise.all([
        getAttendanceRecords({
          dateRange: dateFilter,
          department: departmentFilter !== "all" ? departmentFilter : undefined,
          division: divisionFilter !== "all" ? divisionFilter : undefined,
          location: locationFilter !== "all" ? locationFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchTerm || undefined,
        }),
        getShifts(),
        getBiometricDevices(),
        getOvertimeRequests(),
        getAttendanceStats(),
        getClockStatus(),
      ])

      setAttendanceRecords(recordsRes.data || [])
      setShifts(shiftsRes.data || [])
      setBiometricDevices(devicesRes.data || [])
      setOvertimeRequests(overtimeRes.data || [])
      if (statsRes) setStats(statsRes)
      setClockStatus(statusRes)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [dateFilter, departmentFilter, divisionFilter, locationFilter, statusFilter, searchTerm, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Get GPS location
  const getGPSLocation = useCallback(() => {
    setIsGettingLocation(true)
    setGpsError(null)

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser")
      setIsGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setIsGettingLocation(false)
      },
      (error) => {
        setGpsError(error.message)
        setIsGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }, [])

  // Clock In/Out handlers
  const handleClockIn = async (method: string) => {
    setIsProcessing(true)
    try {
      const result = await clockIn({
        method,
        latitude: gpsLocation?.lat,
        longitude: gpsLocation?.lng,
      })

      if (result.success) {
        toast({
          title: "Clocked In Successfully",
          description: `You clocked in at ${result.time} via ${method}${gpsLocation ? " with GPS" : ""}`,
        })
        setShowClockDialog(false)
        loadData()
      } else {
        toast({
          title: "Clock In Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clock in",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClockOut = async (method: string) => {
    setIsProcessing(true)
    try {
      const result = await clockOut({
        method,
        latitude: gpsLocation?.lat,
        longitude: gpsLocation?.lng,
      })

      if (result.success) {
        toast({
          title: "Clocked Out Successfully",
          description: `You clocked out at ${result.time}. Total: ${result.totalHours}h, Overtime: ${result.overtimeHours}h`,
        })
        setShowClockDialog(false)
        loadData()
      } else {
        toast({
          title: "Clock Out Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clock out",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Shift handlers
  const handleCreateShift = async () => {
    if (!newShift.name || !newShift.start_time || !newShift.end_time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const result = await createShift({
        name: newShift.name,
        start_time: newShift.start_time,
        end_time: newShift.end_time,
        break_duration_minutes: newShift.break_duration_minutes,
        grace_period_minutes: newShift.grace_period_minutes,
        working_days: newShift.working_days,
        department: newShift.department || undefined,
        division: newShift.division || undefined,
        location: newShift.location || undefined,
      })

      if (result.success) {
        toast({
          title: "Shift Created",
          description: `${newShift.name} has been created successfully`,
        })
        setShowShiftDialog(false)
        setNewShift({
          name: "",
          start_time: "09:00",
          end_time: "17:00",
          break_duration_minutes: 60,
          grace_period_minutes: 15,
          working_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
          department: "",
          division: "",
          location: "",
        })
        loadData()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleShift = async (shift: Shift) => {
    const result = await updateShift(shift.id, { is_active: !shift.is_active })
    if (result.success) {
      toast({
        title: shift.is_active ? "Shift Deactivated" : "Shift Activated",
        description: `${shift.name} has been ${shift.is_active ? "deactivated" : "activated"}`,
      })
      loadData()
    }
  }

  const handleDeleteShift = async (shift: Shift) => {
    const result = await deleteShift(shift.id)
    if (result.success) {
      toast({
        title: "Shift Deleted",
        description: `${shift.name} has been deleted`,
      })
      loadData()
    }
  }

  // Device handlers
  const handleCreateDevice = async () => {
    if (!newDevice.name || !newDevice.type || !newDevice.location) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const result = await createBiometricDevice({
        name: newDevice.name,
        type: newDevice.type,
        location: newDevice.location,
        ip_address: newDevice.ip_address || undefined,
        serial_number: newDevice.serial_number || undefined,
      })

      if (result.success) {
        toast({
          title: "Device Added",
          description: `${newDevice.name} has been added successfully`,
        })
        setShowDeviceDialog(false)
        setNewDevice({
          name: "",
          type: "fingerprint",
          location: "",
          ip_address: "",
          serial_number: "",
        })
        loadData()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSyncDevice = async (device: BiometricDevice) => {
    const result = await syncBiometricDevice(device.id)
    if (result.success) {
      toast({
        title: "Device Synced",
        description: `${device.name} has been synchronized`,
      })
      loadData()
    }
  }

  const handleToggleDevice = async (device: BiometricDevice) => {
    const newStatus = device.status === "online" ? "offline" : "online"
    const result = await toggleDeviceStatus(device.id, newStatus)
    if (result.success) {
      toast({
        title: "Device Status Updated",
        description: `${device.name} is now ${newStatus}`,
      })
      loadData()
    }
  }

  // Overtime handlers
  const handleCreateOvertime = async () => {
    if (!newOvertime.reason) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for overtime",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const result = await createOvertimeRequest(newOvertime)

      if (result.success) {
        toast({
          title: "Overtime Request Submitted",
          description: `Request for ${newOvertime.hours_requested}h overtime has been submitted`,
        })
        setShowOvertimeDialog(false)
        setNewOvertime({
          date: new Date().toISOString().split("T")[0],
          hours_requested: 2,
          reason: "",
        })
        loadData()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOvertimeAction = async (request: OvertimeRequest, action: "approved" | "rejected") => {
    const result = await updateOvertimeRequest(request.id, action, {
      hours_approved: action === "approved" ? request.hours_requested : undefined,
    })

    if (result.success) {
      toast({
        title: action === "approved" ? "Overtime Approved" : "Overtime Rejected",
        description: `${request.employee?.full_name}'s request has been ${action}`,
      })
      loadData()
    }
  }

  // Report handler
  const handleGenerateReport = async (type: string) => {
    toast({
      title: "Generating Report",
      description: `${type} is being prepared...`,
    })

    const result = await generateAttendanceReport(type.toLowerCase().replace(" ", "-"))

    if (result.success && result.data) {
      // Create CSV content
      const records = result.data.records
      const csvContent = [
        [
          "Employee",
          "Employee ID",
          "Department",
          "Date",
          "Clock In",
          "Clock Out",
          "In Method",
          "Out Method",
          "Hours",
          "Overtime",
          "Status",
        ],
        ...records.map((r: AttendanceRecord) => [
          r.employee?.full_name || "",
          r.employee?.employee_id || "",
          r.employee?.department || "",
          r.date,
          r.clock_in || "",
          r.clock_out || "",
          r.clock_in_method || "",
          r.clock_out_method || "",
          r.total_hours || 0,
          r.overtime_hours || 0,
          r.status,
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n")

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `attendance-${type.toLowerCase()}-${new Date().toISOString().split("T")[0]}.csv`
      a.click()

      toast({
        title: "Report Downloaded",
        description: `${type} has been downloaded successfully`,
      })
    }
  }

  // Sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const sortedRecords = [...attendanceRecords].sort((a, b) => {
    let aVal: string | number | null = null
    let bVal: string | number | null = null

    switch (sortColumn) {
      case "employee":
        aVal = a.employee?.full_name || ""
        bVal = b.employee?.full_name || ""
        break
      case "department":
        aVal = a.employee?.department || ""
        bVal = b.employee?.department || ""
        break
      case "date":
        aVal = a.date
        bVal = b.date
        break
      case "clock_in":
        aVal = a.clock_in || ""
        bVal = b.clock_in || ""
        break
      case "clock_out":
        aVal = a.clock_out || ""
        bVal = b.clock_out || ""
        break
      case "hours":
        aVal = a.total_hours || 0
        bVal = b.total_hours || 0
        break
      case "overtime":
        aVal = a.overtime_hours || 0
        bVal = b.overtime_hours || 0
        break
      case "status":
        aVal = a.status
        bVal = b.status
        break
      default:
        return 0
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal
    }

    return sortDirection === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal))
  })

  // Helper functions
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

  const getMethodIcon = (method: string | null) => {
    switch (method) {
      case "fingerprint":
        return <Fingerprint className="w-4 h-4" />
      case "facial":
        return <Camera className="w-4 h-4" />
      case "card":
        return <CreditCard className="w-4 h-4" />
      case "mobile":
        return <Smartphone className="w-4 h-4" />
      case "web_portal":
        return <Monitor className="w-4 h-4" />
      case "gps":
        return <MapPinned className="w-4 h-4" />
      default:
        return <Timer className="w-4 h-4" />
    }
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "fingerprint":
        return <Fingerprint className="w-6 h-6 text-emerald-600" />
      case "facial":
        return <Camera className="w-6 h-6 text-blue-600" />
      case "card":
        return <CreditCard className="w-6 h-6 text-orange-600" />
      default:
        return <Wifi className="w-6 h-6 text-gray-600" />
    }
  }

  const pendingOvertimeCount = overtimeRequests.filter((r) => r.status === "pending").length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time & Attendance</h1>
          <p className="text-gray-600">Manage employee time tracking and attendance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Time</p>
            <p className="text-2xl font-bold text-emerald-600 font-mono">
              {currentTime.toLocaleTimeString("en-GB", { hour12: false })}
            </p>
          </div>
          <Dialog open={showClockDialog} onOpenChange={setShowClockDialog}>
            <DialogTrigger asChild>
              <Button
                className={
                  clockStatus.isClockedIn ? "bg-orange-600 hover:bg-orange-700" : "bg-emerald-600 hover:bg-emerald-700"
                }
                onClick={() => getGPSLocation()}
              >
                <Clock className="w-4 h-4 mr-2" />
                {clockStatus.isClockedIn ? "Clock Out" : "Clock In"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{clockStatus.isClockedIn ? "Clock Out" : "Clock In"}</DialogTitle>
                <DialogDescription>
                  Choose your authentication method. GPS location is {gpsLocation ? "captured" : "optional"}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* GPS Status */}
                <div className="p-4 rounded-lg bg-gray-50 border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPinned className={`w-5 h-5 ${gpsLocation ? "text-emerald-600" : "text-gray-400"}`} />
                      <span className="font-medium">GPS Location</span>
                    </div>
                    {isGettingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : gpsLocation ? (
                      <Badge className="bg-emerald-100 text-emerald-800">Captured</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={getGPSLocation}>
                        <Navigation className="w-4 h-4 mr-1" />
                        Get Location
                      </Button>
                    )}
                  </div>
                  {gpsLocation && (
                    <p className="text-xs text-gray-500 mt-2">
                      Lat: {gpsLocation.lat.toFixed(6)}, Lng: {gpsLocation.lng.toFixed(6)}
                    </p>
                  )}
                  {gpsError && <p className="text-xs text-red-500 mt-2">{gpsError}</p>}
                </div>

                {/* Clock In/Out Methods */}
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center gap-2 bg-transparent hover:bg-emerald-50"
                    onClick={() =>
                      clockStatus.isClockedIn ? handleClockOut("fingerprint") : handleClockIn("fingerprint")
                    }
                    disabled={isProcessing}
                  >
                    <Fingerprint className="w-6 h-6 text-emerald-600" />
                    <span>Fingerprint Scanner</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center gap-2 bg-transparent hover:bg-blue-50"
                    onClick={() => (clockStatus.isClockedIn ? handleClockOut("facial") : handleClockIn("facial"))}
                    disabled={isProcessing}
                  >
                    <Camera className="w-6 h-6 text-blue-600" />
                    <span>Facial Recognition</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center gap-2 bg-transparent hover:bg-purple-50"
                    onClick={() =>
                      clockStatus.isClockedIn ? handleClockOut("web_portal") : handleClockIn("web_portal")
                    }
                    disabled={isProcessing}
                  >
                    <Monitor className="w-6 h-6 text-purple-600" />
                    <span>Web Portal (Manual)</span>
                  </Button>
                  {gpsLocation && (
                    <Button
                      variant="outline"
                      className="h-16 flex flex-col items-center justify-center gap-2 bg-transparent hover:bg-green-50"
                      onClick={() => (clockStatus.isClockedIn ? handleClockOut("gps") : handleClockIn("gps"))}
                      disabled={isProcessing}
                    >
                      <MapPinned className="w-6 h-6 text-green-600" />
                      <span>GPS Location Based</span>
                    </Button>
                  )}
                </div>

                {isProcessing && (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.presentToday}</div>
            <p className="text-xs text-muted-foreground">{stats.attendanceRate}% attendance rate</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lateArrivals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.presentToday > 0 ? ((stats.lateArrivals / stats.presentToday) * 100).toFixed(1) : 0}% of present
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.absent}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalEmployees > 0 ? ((stats.absent / stats.totalEmployees) * 100).toFixed(1) : 0}% absence rate
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOvertime.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">{pendingOvertimeCount} pending requests</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devices Online</CardTitle>
            <Wifi className="h-4 w-4 text-blue-600" />
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

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shifts">Shift Management</TabsTrigger>
          <TabsTrigger value="overtime" className="relative">
            Overtime
            {pendingOvertimeCount > 0 && (
              <Badge className="ml-2 bg-yellow-500 text-white text-xs px-1.5">{pendingOvertimeCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="devices">Biometric Devices</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <CardTitle className="text-base">Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Date Range</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Department</Label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Division</Label>
                  <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Divisions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Divisions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Location</Label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search employee..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Records Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Attendance Records</CardTitle>
                  <CardDescription>{sortedRecords.length} record(s) found</CardDescription>
                </div>
                <Button variant="outline" onClick={() => handleGenerateReport("Daily Report")}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : sortedRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No attendance records found for the selected filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("employee")}>
                          <div className="flex items-center gap-1">
                            Employee
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("department")}>
                          <div className="flex items-center gap-1">
                            Department
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("date")}>
                          <div className="flex items-center gap-1">
                            Date
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("clock_in")}>
                          <div className="flex items-center gap-1">
                            Clock In
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead>In Method</TableHead>
                        <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("clock_out")}>
                          <div className="flex items-center gap-1">
                            Clock Out
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead>Out Method</TableHead>
                        <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("hours")}>
                          <div className="flex items-center gap-1">
                            Hours
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("overtime")}>
                          <div className="flex items-center gap-1">
                            Overtime
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                        <TableHead>GPS</TableHead>
                        <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("status")}>
                          <div className="flex items-center gap-1">
                            Status
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{record.employee?.full_name}</p>
                              <p className="text-xs text-gray-500">{record.employee?.employee_id}</p>
                            </div>
                          </TableCell>
                          <TableCell>{record.employee?.department || "—"}</TableCell>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>{record.clock_in || "—"}</TableCell>
                          <TableCell>
                            {record.clock_in_method && (
                              <div className="flex items-center gap-1">
                                {getMethodIcon(record.clock_in_method)}
                                <span className="text-xs capitalize">{record.clock_in_method.replace("_", " ")}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{record.clock_out || "—"}</TableCell>
                          <TableCell>
                            {record.clock_out_method && (
                              <div className="flex items-center gap-1">
                                {getMethodIcon(record.clock_out_method)}
                                <span className="text-xs capitalize">{record.clock_out_method.replace("_", " ")}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{record.total_hours?.toFixed(1) || "—"}</TableCell>
                          <TableCell>
                            {record.overtime_hours && record.overtime_hours > 0 ? (
                              <span className="text-orange-600 font-medium">+{record.overtime_hours.toFixed(1)}h</span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            {record.clock_in_gps_lat || record.clock_out_gps_lat ? (
                              <a
                                href={`https://maps.google.com/?q=${record.clock_in_gps_lat || record.clock_out_gps_lat},${record.clock_in_gps_lng || record.clock_out_gps_lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline text-xs"
                              >
                                <MapPin className="w-3 h-3" />
                                View
                              </a>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(record.status)}>
                              {record.status.replace("-", " ").toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shift Management Tab */}
        <TabsContent value="shifts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Shift Management</CardTitle>
                  <CardDescription>Create and manage work shifts for employees</CardDescription>
                </div>
                <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Shift
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create New Shift</DialogTitle>
                      <DialogDescription>Define a new work shift schedule</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label>Shift Name *</Label>
                          <Input
                            placeholder="e.g., Morning Shift"
                            value={newShift.name}
                            onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Start Time *</Label>
                          <Input
                            type="time"
                            value={newShift.start_time}
                            onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>End Time *</Label>
                          <Input
                            type="time"
                            value={newShift.end_time}
                            onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Break Duration (min)</Label>
                          <Input
                            type="number"
                            value={newShift.break_duration_minutes}
                            onChange={(e) =>
                              setNewShift({
                                ...newShift,
                                break_duration_minutes: Number.parseInt(e.target.value) || 60,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Grace Period (min)</Label>
                          <Input
                            type="number"
                            value={newShift.grace_period_minutes}
                            onChange={(e) =>
                              setNewShift({ ...newShift, grace_period_minutes: Number.parseInt(e.target.value) || 15 })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Working Days</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                            <label key={day} className="flex items-center gap-2">
                              <Checkbox
                                checked={newShift.working_days.includes(day)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewShift({ ...newShift, working_days: [...newShift.working_days, day] })
                                  } else {
                                    setNewShift({
                                      ...newShift,
                                      working_days: newShift.working_days.filter((d) => d !== day),
                                    })
                                  }
                                }}
                              />
                              <span className="text-sm">{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Department</Label>
                          <Input
                            placeholder="Optional"
                            value={newShift.department}
                            onChange={(e) => setNewShift({ ...newShift, department: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Division</Label>
                          <Input
                            placeholder="Optional"
                            value={newShift.division}
                            onChange={(e) => setNewShift({ ...newShift, division: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Location</Label>
                          <Input
                            placeholder="Optional"
                            value={newShift.location}
                            onChange={(e) => setNewShift({ ...newShift, location: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowShiftDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleCreateShift}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Create Shift
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">How it works:</span> When employees clock in/out during shift hours,
                  their attendance is automatically matched to their assigned shift. Late arrivals are calculated based
                  on the shift's grace period.
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : shifts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No shifts configured. Click "Add Shift" to create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shifts.map((shift) => (
                    <Card key={shift.id} className={`${!shift.is_active ? "opacity-60" : ""}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{shift.name}</CardTitle>
                            <CardDescription>
                              {shift.start_time} - {shift.end_time}
                            </CardDescription>
                          </div>
                          <Badge
                            className={shift.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >
                            {shift.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Break:</span>
                            <span>{shift.break_duration_minutes} min</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Grace Period:</span>
                            <span>{shift.grace_period_minutes} min</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Working Days:</span>
                            <span>{shift.working_days?.join(", ") || "All"}</span>
                          </div>
                          {shift.department && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Department:</span>
                              <span>{shift.department}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" onClick={() => handleToggleShift(shift)}>
                            {shift.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteShift(shift)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overtime Tab */}
        <TabsContent value="overtime" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Overtime Management</CardTitle>
                  <CardDescription>Review and approve overtime requests</CardDescription>
                </div>
                <Dialog open={showOvertimeDialog} onOpenChange={setShowOvertimeDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Request Overtime
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Overtime Request</DialogTitle>
                      <DialogDescription>Request approval for planned overtime work</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={newOvertime.date}
                          onChange={(e) => setNewOvertime({ ...newOvertime, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Hours Requested</Label>
                        <Input
                          type="number"
                          min="0.5"
                          max="8"
                          step="0.5"
                          value={newOvertime.hours_requested}
                          onChange={(e) =>
                            setNewOvertime({ ...newOvertime, hours_requested: Number.parseFloat(e.target.value) || 2 })
                          }
                        />
                      </div>
                      <div>
                        <Label>Reason</Label>
                        <Textarea
                          placeholder="Explain why overtime is needed..."
                          value={newOvertime.reason}
                          onChange={(e) => setNewOvertime({ ...newOvertime, reason: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowOvertimeDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleCreateOvertime}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Submit Request
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
                <p className="text-sm font-medium text-blue-800">How Overtime Works:</p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>
                    <strong>Automatic Overtime:</strong> System tracks hours worked beyond 8 hours per day
                  </li>
                  <li>
                    <strong>Request Overtime:</strong> Employees submit requests via their portal for planned overtime
                  </li>
                  <li>
                    <strong>Approval:</strong> Managers/HR review and approve or reject overtime requests
                  </li>
                  <li>
                    <strong>Calculation:</strong> Approved overtime is added to payroll calculations
                  </li>
                </ul>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : overtimeRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No overtime requests found.</div>
              ) : (
                <div className="space-y-4">
                  {overtimeRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">{request.employee?.full_name}</p>
                        <p className="text-sm text-gray-600">
                          {request.hours_requested} hours • {request.date}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{request.reason}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Submitted: {new Date(request.requested_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            request.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : request.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {request.status.toUpperCase()}
                        </Badge>
                        {request.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50 bg-transparent"
                              onClick={() => handleOvertimeAction(request, "approved")}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                              onClick={() => handleOvertimeAction(request, "rejected")}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Biometric Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Biometric Devices</CardTitle>
                  <CardDescription>Monitor and manage biometric attendance devices</CardDescription>
                </div>
                <Dialog open={showDeviceDialog} onOpenChange={setShowDeviceDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Device
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Biometric Device</DialogTitle>
                      <DialogDescription>Register a new biometric attendance device</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Device Name *</Label>
                        <Input
                          placeholder="e.g., Main Entrance Scanner"
                          value={newDevice.name}
                          onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Device Type *</Label>
                        <Select
                          value={newDevice.type}
                          onValueChange={(value) => setNewDevice({ ...newDevice, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fingerprint">Fingerprint Scanner</SelectItem>
                            <SelectItem value="facial">Facial Recognition</SelectItem>
                            <SelectItem value="card">Card Reader</SelectItem>
                            <SelectItem value="iris">Iris Scanner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Location *</Label>
                        <Input
                          placeholder="e.g., Main Office Entrance"
                          value={newDevice.location}
                          onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>IP Address</Label>
                        <Input
                          placeholder="e.g., 192.168.1.100"
                          value={newDevice.ip_address}
                          onChange={(e) => setNewDevice({ ...newDevice, ip_address: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Serial Number</Label>
                        <Input
                          placeholder="e.g., SN-1234567"
                          value={newDevice.serial_number}
                          onChange={(e) => setNewDevice({ ...newDevice, serial_number: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDeviceDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleCreateDevice}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Add Device
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : biometricDevices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No biometric devices configured. Click "Add Device" to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {biometricDevices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-100 rounded-lg">{getDeviceIcon(device.type)}</div>
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-gray-600">{device.location}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-gray-500">
                              Last sync: {device.last_sync ? new Date(device.last_sync).toLocaleString() : "Never"}
                            </p>
                            {device.uptime_percentage && (
                              <Badge variant="outline" className="text-xs">
                                Uptime: {device.uptime_percentage}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            device.status === "online" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }
                        >
                          {device.status.toUpperCase()}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => handleSyncDevice(device)}>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Sync Data
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleToggleDevice(device)}>
                          <Settings className="w-4 h-4 mr-1" />
                          {device.status === "online" ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Reports
              </CardTitle>
              <CardDescription>Generate and download attendance reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {["Daily Report", "Weekly Summary", "Monthly Analysis", "Department Report", "Overtime Report"].map(
                  (report) => (
                    <Button
                      key={report}
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 bg-transparent"
                      onClick={() => handleGenerateReport(report)}
                    >
                      <Download className="w-5 h-5" />
                      <span className="text-sm">{report}</span>
                    </Button>
                  ),
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                AI Insights
              </CardTitle>
              <CardDescription>Machine learning powered attendance analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-900">Attendance Patterns</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      AI has detected that Monday mornings have 23% higher late arrivals. Consider flexible start times.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Overtime Trends</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Engineering department has 40% higher overtime than average. May indicate understaffing.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900">Best Performers</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Sales team has the highest attendance rate at 98.5% this month. Great job!
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
