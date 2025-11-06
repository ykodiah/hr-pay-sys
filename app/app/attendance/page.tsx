"use client"

import { useEffect, useMemo, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  BarChart3,
  BellRing,
  Camera,
  Clock,
  Clock4,
  Download,
  Fingerprint,
  Globe,
  Link as LinkIcon,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Timer,
  UserCheck,
  Users,
} from "lucide-react"

type AttendanceStatus = "present" | "late" | "absent" | "early-departure"
type AttendanceMethod = "fingerprint" | "facial" | "mobile" | "manual" | "card"
type PredictedTrend = "on-track" | "late-risk" | "absence-risk"

const formatDateByOffset = (offsetDays: number) => {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().split("T")[0]
}

interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  date: string
  clockIn: string
  clockOut: string
  totalHours: number
  overtimeHours: number
  expectedHours: number
  status: AttendanceStatus
  location: string
  department: string
  division: string
  subsidiary: string
  team: string
  shift: string
  method: AttendanceMethod
  workingArrangement: "onsite" | "remote" | "hybrid"
  productivityScore: number
  aiRiskScore: number
  predictedTrend: PredictedTrend
}

interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  breakDuration: number
  employees: string[]
  isActive: boolean
  location: string
  department: string
  notes?: string
}

interface BiometricDevice {
  id: string
  name: string
  type: "fingerprint" | "facial" | "card" | "mobile"
  location: string
  status: "online" | "offline" | "syncing"
  lastSync: string
  integration: "REST" | "SDK" | "CSV"
  provider: string
  reference?: string
}

type OvertimeStatus = "pending" | "approved" | "rejected"

interface OvertimeRequest {
  id: string
  employeeId: string
  employeeName: string
  date: string
  hoursRequested: number
  status: OvertimeStatus
  justification: string
  department: string
}

interface Holiday {
  id: string
  name: string
  date: string
  scope: "company" | "subsidiary" | "department"
  scopeReference: string
  isPaid: boolean
  notes?: string
}

interface GeoCapture {
  coordinates: string
  accuracy?: string
  capturedAt: string
}

interface AlertSettings {
  enabled: boolean
  time: string
  channel: "email" | "sms" | "push"
  escalateToManagers: boolean
  includeContractors: boolean
}

interface AiInsight {
  id: string
  title: string
  description: string
  confidence: number
  tags: string[]
}

interface AiForecast {
  label: string
  value: string
  delta: string
  trend: "up" | "down" | "steady"
}

const initialAttendanceRecords: AttendanceRecord[] = [
  {
    id: "ATT-001",
    employeeId: "EMP-001",
    employeeName: "Kwame Asante",
    date: formatDateByOffset(0),
    clockIn: "08:02",
    clockOut: "17:45",
    totalHours: 8.7,
    overtimeHours: 0.7,
    expectedHours: 8,
    status: "present",
    location: "Accra HQ",
    department: "Finance",
    division: "Corporate Services",
    subsidiary: "Core Group",
    team: "Payroll",
    shift: "Day Shift",
    method: "fingerprint",
    workingArrangement: "onsite",
    productivityScore: 92,
    aiRiskScore: 0.08,
    predictedTrend: "on-track",
  },
  {
    id: "ATT-002",
    employeeId: "EMP-002",
    employeeName: "Ama Osei",
    date: formatDateByOffset(0),
    clockIn: "08:21",
    clockOut: "17:05",
    totalHours: 7.6,
    overtimeHours: 0,
    expectedHours: 8,
    status: "late",
    location: "Accra HQ",
    department: "Finance",
    division: "Corporate Services",
    subsidiary: "Core Group",
    team: "Tax",
    shift: "Day Shift",
    method: "facial",
    workingArrangement: "onsite",
    productivityScore: 84,
    aiRiskScore: 0.34,
    predictedTrend: "late-risk",
  },
  {
    id: "ATT-003",
    employeeId: "EMP-003",
    employeeName: "Kofi Mensah",
    date: formatDateByOffset(0),
    clockIn: "",
    clockOut: "",
    totalHours: 0,
    overtimeHours: 0,
    expectedHours: 8,
    status: "absent",
    location: "",
    department: "Engineering",
    division: "Platform",
    subsidiary: "Digital Ventures",
    team: "DevOps",
    shift: "Day Shift",
    method: "mobile",
    workingArrangement: "remote",
    productivityScore: 0,
    aiRiskScore: 0.73,
    predictedTrend: "absence-risk",
  },
  {
    id: "ATT-004",
    employeeId: "EMP-004",
    employeeName: "Akosua Boateng",
    date: formatDateByOffset(-1),
    clockIn: "19:55",
    clockOut: "06:05",
    totalHours: 9.1,
    overtimeHours: 1.1,
    expectedHours: 9,
    status: "present",
    location: "Tema Plant",
    department: "Operations",
    division: "Manufacturing",
    subsidiary: "Core Group",
    team: "Night Ops",
    shift: "Night Shift",
    method: "card",
    workingArrangement: "onsite",
    productivityScore: 88,
    aiRiskScore: 0.19,
    predictedTrend: "on-track",
  },
  {
    id: "ATT-005",
    employeeId: "EMP-005",
    employeeName: "Yaw Frimpong",
    date: formatDateByOffset(-2),
    clockIn: "08:05",
    clockOut: "17:10",
    totalHours: 8.2,
    overtimeHours: 0.2,
    expectedHours: 8,
    status: "present",
    location: "Kumasi Hub",
    department: "Customer Success",
    division: "Growth",
    subsidiary: "Regional",
    team: "Support",
    shift: "Day Shift",
    method: "mobile",
    workingArrangement: "hybrid",
    productivityScore: 76,
    aiRiskScore: 0.42,
    predictedTrend: "late-risk",
  },
  {
    id: "ATT-006",
    employeeId: "EMP-006",
    employeeName: "Esi Dapaah",
    date: formatDateByOffset(0),
    clockIn: "07:45",
    clockOut: "16:30",
    totalHours: 8,
    overtimeHours: 0,
    expectedHours: 8,
    status: "present",
    location: "Remote",
    department: "People Operations",
    division: "HR",
    subsidiary: "Core Group",
    team: "Talent",
    shift: "Flexible",
    method: "manual",
    workingArrangement: "remote",
    productivityScore: 95,
    aiRiskScore: 0.05,
    predictedTrend: "on-track",
  },
]

const initialShifts: Shift[] = [
  {
    id: "SHIFT-01",
    name: "Day Shift",
    startTime: "08:00",
    endTime: "17:00",
    breakDuration: 60,
    employees: ["EMP-001", "EMP-002", "EMP-003", "EMP-006"],
    isActive: true,
    location: "Accra HQ",
    department: "Finance",
    notes: "Covers corporate teams with staggered breaks",
  },
  {
    id: "SHIFT-02",
    name: "Night Shift",
    startTime: "20:00",
    endTime: "06:00",
    breakDuration: 45,
    employees: ["EMP-004"],
    isActive: true,
    location: "Tema Plant",
    department: "Operations",
    notes: "Includes production warm-up window",
  },
  {
    id: "SHIFT-03",
    name: "Weekend Support",
    startTime: "10:00",
    endTime: "16:00",
    breakDuration: 30,
    employees: ["EMP-005"],
    isActive: false,
    location: "Hybrid",
    department: "Customer Success",
    notes: "Activates during campaign periods",
  },
]

const initialBiometricDevices: BiometricDevice[] = [
  {
    id: "DEV-001",
    name: "ZKTeco Pro 4G",
    type: "fingerprint",
    location: "Accra HQ - Main Lobby",
    status: "online",
    lastSync: "Today • 08:55",
    integration: "REST",
    provider: "ZKTeco",
    reference: "https://api.hr-suite.dev/integrations/zkteco",
  },
  {
    id: "DEV-002",
    name: "VisionX FaceID",
    type: "facial",
    location: "Accra HQ - Executive Floor",
    status: "syncing",
    lastSync: "Today • 09:10",
    integration: "SDK",
    provider: "VisionX",
  },
  {
    id: "DEV-003",
    name: "RFID Turnstile",
    type: "card",
    location: "Tema Plant - Warehouse",
    status: "offline",
    lastSync: "Yesterday • 18:02",
    integration: "CSV",
    provider: "Gallagher",
  },
]

const initialOvertimeRequests: OvertimeRequest[] = [
  {
    id: "OT-001",
    employeeId: "EMP-001",
    employeeName: "Kwame Asante",
    date: formatDateByOffset(-1),
    hoursRequested: 2.5,
    status: "pending",
    justification: "Quarter-end reconciliations",
    department: "Finance",
  },
  {
    id: "OT-002",
    employeeId: "EMP-004",
    employeeName: "Akosua Boateng",
    date: formatDateByOffset(-2),
    hoursRequested: 1.5,
    status: "approved",
    justification: "Late shift machine reset",
    department: "Operations",
  },
  {
    id: "OT-003",
    employeeId: "EMP-005",
    employeeName: "Yaw Frimpong",
    date: formatDateByOffset(-3),
    hoursRequested: 3,
    status: "pending",
    justification: "Customer migration weekend",
    department: "Customer Success",
  },
]

const initialHolidays: Holiday[] = [
  {
    id: "HOL-001",
    name: "Founder's Day",
    date: formatDateByOffset(12),
    scope: "company",
    scopeReference: "All employees",
    isPaid: true,
    notes: "Company-wide celebration",
  },
  {
    id: "HOL-002",
    name: "Tema Plant Maintenance",
    date: formatDateByOffset(3),
    scope: "subsidiary",
    scopeReference: "Core Group",
    isPaid: false,
    notes: "Operations-only shutdown",
  },
]

export default function AttendancePage() {
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("overview")
  const [attendanceRecords, setAttendanceRecords] = useState(initialAttendanceRecords)
  const [shifts, setShifts] = useState(initialShifts)
  const [biometricDevices, setBiometricDevices] = useState(initialBiometricDevices)
  const [overtimeRequests, setOvertimeRequests] = useState(initialOvertimeRequests)
  const [holidays, setHolidays] = useState(initialHolidays)

  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("today")
  const [filters, setFilters] = useState({
    location: "all",
    department: "all",
    division: "all",
    subsidiary: "all",
    status: "all",
    method: "all",
  })

  const [showClockInDialog, setShowClockInDialog] = useState(false)
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false)
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false)
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false)

  const [currentTime, setCurrentTime] = useState(new Date())
  const [alertTriggeredToday, setAlertTriggeredToday] = useState(false)
  const [insightSeed, setInsightSeed] = useState(() => Date.now())
  const [geoCapture, setGeoCapture] = useState<GeoCapture | null>(null)
  const [isCapturingLocation, setIsCapturingLocation] = useState(false)

  const [shiftForm, setShiftForm] = useState({
    id: "",
    name: "",
    startTime: "08:00",
    endTime: "17:00",
    breakDuration: 60,
    employees: "",
    location: "",
    department: "",
    notes: "",
  })

  const [holidayForm, setHolidayForm] = useState({
    name: "",
    date: formatDateByOffset(1),
    scope: "company" as Holiday["scope"],
    scopeReference: "",
    isPaid: true,
    notes: "",
  })

  const [deviceForm, setDeviceForm] = useState({
    name: "",
    type: "fingerprint" as BiometricDevice["type"],
    location: "",
    integration: "REST" as BiometricDevice["integration"],
    provider: "",
    reference: "",
  })

  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    enabled: true,
    time: "10:30",
    channel: "email",
    escalateToManagers: true,
    includeContractors: false,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const currentDayKey = `${currentTime.getFullYear()}-${currentTime.getMonth()}-${currentTime.getDate()}`

  useEffect(() => {
    setAlertTriggeredToday(false)
  }, [currentDayKey, alertSettings.time])

  useEffect(() => {
    if (!alertSettings.enabled || !alertSettings.time || alertTriggeredToday) {
      return
    }

    const [hours, minutes] = alertSettings.time.split(":").map(Number)
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return
    }

    const alertMoment = new Date(currentTime)
    alertMoment.setHours(hours, minutes, 0, 0)

    if (currentTime >= alertMoment) {
      const missed = attendanceRecords.filter((record) => record.status === "absent" || !record.clockIn)
      if (missed.length > 0) {
        toast({
          title: "Missed attendance alert ready",
          description: `${missed.length} employee${missed.length > 1 ? "s" : ""} have not clocked in. Alert sent via ${alertSettings.channel}.`,
        })
        setAlertTriggeredToday(true)
      }
    }
  }, [alertSettings, alertTriggeredToday, attendanceRecords, currentTime, toast])

  const uniqueValues = useMemo(() => {
    const unique = {
      location: new Set<string>(),
      department: new Set<string>(),
      division: new Set<string>(),
      subsidiary: new Set<string>(),
      method: new Set<string>(),
    }

    attendanceRecords.forEach((record) => {
      if (record.location) unique.location.add(record.location)
      unique.department.add(record.department)
      unique.division.add(record.division)
      unique.subsidiary.add(record.subsidiary)
      unique.method.add(record.method)
    })

    return {
      location: Array.from(unique.location),
      department: Array.from(unique.department),
      division: Array.from(unique.division),
      subsidiary: Array.from(unique.subsidiary),
      method: Array.from(unique.method),
    }
  }, [attendanceRecords])

  const filteredRecords = useMemo(() => {
    const today = new Date()

    const matchesDate = (dateValue: string) => {
      const recordDate = new Date(dateValue)

      switch (dateFilter) {
        case "today":
          return recordDate.toDateString() === today.toDateString()
        case "yesterday": {
          const yesterday = new Date(today)
          yesterday.setDate(today.getDate() - 1)
          return recordDate.toDateString() === yesterday.toDateString()
        }
        case "this-week": {
          const startOfWeek = new Date(today)
          const day = startOfWeek.getDay()
          const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
          startOfWeek.setDate(diff)
          startOfWeek.setHours(0, 0, 0, 0)
          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 6)
          endOfWeek.setHours(23, 59, 59, 999)
          return recordDate >= startOfWeek && recordDate <= endOfWeek
        }
        case "this-month":
          return recordDate.getMonth() === today.getMonth() && recordDate.getFullYear() === today.getFullYear()
        default:
          return true
      }
    }

    return attendanceRecords.filter((record) => {
      const matchesSearch =
        record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employeeId.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilters =
        (filters.location === "all" || record.location === filters.location) &&
        (filters.department === "all" || record.department === filters.department) &&
        (filters.division === "all" || record.division === filters.division) &&
        (filters.subsidiary === "all" || record.subsidiary === filters.subsidiary) &&
        (filters.status === "all" || record.status === filters.status) &&
        (filters.method === "all" || record.method === filters.method)

      return matchesSearch && matchesFilters && matchesDate(record.date)
    })
  }, [attendanceRecords, dateFilter, filters, searchTerm])

  const stats = useMemo(() => {
    const total = attendanceRecords.length || 1
    const presentCount = attendanceRecords.filter((record) => record.status === "present").length
    const lateCount = attendanceRecords.filter((record) => record.status === "late").length
    const absentCount = attendanceRecords.filter((record) => record.status === "absent").length
    const overtimeHours = attendanceRecords.reduce((sum, record) => sum + record.overtimeHours, 0)
    const attendanceRate = ((total - absentCount) / total) * 100
    const devicesOnline = biometricDevices.filter((device) => device.status === "online").length

    return {
      presentCount,
      attendanceRate,
      lateCount,
      absentCount,
      overtimeHours,
      devicesOnline,
      totalDevices: biometricDevices.length,
    }
  }, [attendanceRecords, biometricDevices])

  const aiForecasts: AiForecast[] = useMemo(() => {
    const pendingOvertime = overtimeRequests
      .filter((request) => request.status === "pending")
      .reduce((sum, request) => sum + request.hoursRequested, 0)
    const highRiskEmployees = attendanceRecords.filter((record) => record.aiRiskScore >= 0.6)
    const remoteAttendance = attendanceRecords.filter((record) => record.workingArrangement === "remote")
    const remotePresent = remoteAttendance.filter((record) => record.status === "present").length

    return [
      {
        label: "Projected overtime (72h)",
        value: `${pendingOvertime.toFixed(1)}h`,
        delta: "+12% vs last week",
        trend: "up",
      },
      {
        label: "High-risk absenteeism",
        value: `${highRiskEmployees.length} team${highRiskEmployees.length !== 1 ? "s" : ""}`,
        delta: "Focus: Engineering",
        trend: highRiskEmployees.length > 0 ? "up" : "steady",
      },
      {
        label: "Remote compliance",
        value: remoteAttendance.length
          ? `${Math.round((remotePresent / remoteAttendance.length) * 100)}%`
          : "100%",
        delta: "Confidence 92%",
        trend: "steady",
      },
    ]
  }, [attendanceRecords, overtimeRequests])

  const aiInsights: AiInsight[] = useMemo(() => {
    const riskLeaders = attendanceRecords
      .filter((record) => record.aiRiskScore >= 0.4)
      .slice(0, 3)
      .map((record) => ({
        id: `${record.id}-risk-${insightSeed}`,
        title: `${record.employeeName} requires check-in`,
        description: `${record.department} • Risk ${Math.round(record.aiRiskScore * 100)}% • ${
          record.predictedTrend === "absence-risk" ? "Likely to miss next shift" : "Likely to arrive late"
        }.`,
        confidence: Math.min(0.45 + record.aiRiskScore / 2, 0.95),
        tags: [record.predictedTrend.replace("-", " "), record.department],
      }))

    const overtimeHotspot = overtimeRequests
      .filter((request) => request.status === "pending")
      .sort((a, b) => b.hoursRequested - a.hoursRequested)
      .slice(0, 1)
      .map((request) => ({
        id: `${request.id}-ot-${insightSeed}`,
        title: `${request.department} overtime spike`,
        description: `${request.hoursRequested.toFixed(1)} hours pending approval. Consider redistribution to reduce burnout.`,
        confidence: 0.88,
        tags: ["Overtime", request.department],
      }))

    const hybridTrend = attendanceRecords.filter((record) => record.workingArrangement === "hybrid")
    const hybridInsight: AiInsight | null = hybridTrend.length
      ? {
          id: `hybrid-${insightSeed}`,
          title: "Hybrid team adherence",
          description: `${Math.round(
            (hybridTrend.filter((record) => record.status === "present").length / hybridTrend.length) * 100,
          )}% adherence recorded this week. Keep nudging flexible check-ins by 08:30.`,
          confidence: 0.76,
          tags: ["Hybrid", "Engagement"],
        }
      : null

    return [...riskLeaders, ...overtimeHotspot, ...(hybridInsight ? [hybridInsight] : [])]
  }, [attendanceRecords, overtimeRequests, insightSeed])

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((previous) => ({ ...previous, [key]: value }))
  }

  const handleResetFilters = () => {
    setFilters({ location: "all", department: "all", division: "all", subsidiary: "all", status: "all", method: "all" })
    setDateFilter("today")
    setSearchTerm("")
  }

  const handleBiometricClockIn = (method: AttendanceMethod) => {
    setShowClockInDialog(false)
    toast({
      title: "Clock-in initiated",
      description: `Secure authentication via ${method} in progress...`,
    })

    setTimeout(() => {
      toast({
        title: "Clock-in successful",
        description: `Attendance data stored via ${method} feed.`,
      })
    }, 1600)
  }

  const handleExport = (type: string) => {
    toast({
      title: `${type} ready`,
      description: `Filtered attendance report queued for download (${filteredRecords.length} records).`,
    })
  }

  const handleUpdateAttendanceStatus = (id: string, status: AttendanceStatus) => {
    setAttendanceRecords((previous) =>
      previous.map((record) => (record.id === id ? { ...record, status, clockIn: record.clockIn || "08:30" } : record)),
    )
    toast({
      title: "Attendance updated",
      description: `Status flagged as ${status.replace("-", " ")}.`,
    })
  }

  const handleSendReminder = (record: AttendanceRecord) => {
    toast({
      title: "Reminder queued",
      description: `Notification sent to ${record.employeeName} via AI nudges and ${alertSettings.channel}.`,
    })
  }

  const handleToggleShiftActive = (id: string) => {
    setShifts((previous) => previous.map((shift) => (shift.id === id ? { ...shift, isActive: !shift.isActive } : shift)))
  }

  const resetShiftForm = () => {
    setShiftForm({
      id: "",
      name: "",
      startTime: "08:00",
      endTime: "17:00",
      breakDuration: 60,
      employees: "",
      location: "",
      department: "",
      notes: "",
    })
  }

  const handleOpenNewShiftDialog = () => {
    resetShiftForm()
    setShiftDialogOpen(true)
  }

  const handleEditShift = (shift: Shift) => {
    setShiftForm({
      id: shift.id,
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakDuration: shift.breakDuration,
      employees: shift.employees.join(", "),
      location: shift.location,
      department: shift.department,
      notes: shift.notes ?? "",
    })
    setShiftDialogOpen(true)
  }

  const handleShiftSubmit = () => {
    const employees = shiftForm.employees
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)

    if (!shiftForm.name || !shiftForm.startTime || !shiftForm.endTime) {
      toast({ title: "Missing details", description: "Provide shift name and time window." })
      return
    }

    const payload: Shift = {
      id: shiftForm.id || `SHIFT-${Date.now()}`,
      name: shiftForm.name,
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
      breakDuration: Number(shiftForm.breakDuration) || 0,
      employees,
      isActive: true,
      location: shiftForm.location || "",
      department: shiftForm.department || "",
      notes: shiftForm.notes,
    }

    setShifts((previous) => {
      const exists = previous.some((shift) => shift.id === payload.id)
      if (exists) {
        return previous.map((shift) => (shift.id === payload.id ? payload : shift))
      }
      return [payload, ...previous]
    })

    toast({
      title: shiftForm.id ? "Shift updated" : "Shift created",
      description: `${payload.name} now scheduled with ${payload.employees.length} assignee(s).`,
    })

    setShiftDialogOpen(false)
    resetShiftForm()
  }

  const handleApproveOvertime = (id: string, status: OvertimeStatus) => {
    setOvertimeRequests((previous) => previous.map((request) => (request.id === id ? { ...request, status } : request)))
    toast({ title: `Overtime ${status}`, description: `Request ${id} marked as ${status}.` })
  }

  const handleSyncDevice = (id: string) => {
    setBiometricDevices((previous) =>
      previous.map((device) =>
        device.id === id
          ? { ...device, status: "syncing", lastSync: "Syncing..." }
          : device,
      ),
    )

    setTimeout(() => {
      setBiometricDevices((previous) =>
        previous.map((device) =>
          device.id === id
            ? {
                ...device,
                status: "online",
                lastSync: `Today • ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
              }
            : device,
        ),
      )
      toast({ title: "Device synced", description: "Attendance events imported successfully." })
    }, 1500)
  }

  const handleDeviceStatusToggle = (device: BiometricDevice) => {
    setBiometricDevices((previous) =>
      previous.map((current) =>
        current.id === device.id
          ? { ...current, status: current.status === "online" ? "offline" : "online" }
          : current,
      ),
    )
  }

  const handleAddDevice = () => {
    if (!deviceForm.name || !deviceForm.provider) {
      toast({ title: "Incomplete details", description: "Provide device name and provider." })
      return
    }

    setBiometricDevices((previous) => [
      {
        id: `DEV-${Date.now()}`,
        name: deviceForm.name,
        type: deviceForm.type,
        location: deviceForm.location || "Custom integration",
        status: "online",
        lastSync: "Awaiting first sync",
        integration: deviceForm.integration,
        provider: deviceForm.provider,
        reference: deviceForm.reference,
      },
      ...previous,
    ])

    toast({
      title: "Integration connected",
      description: `${deviceForm.provider} feed active via ${deviceForm.integration}.`,
    })

    setDeviceDialogOpen(false)
    setDeviceForm({ name: "", type: "fingerprint", location: "", integration: "REST", provider: "", reference: "" })
  }

  const handleAddHoliday = () => {
    if (!holidayForm.name || !holidayForm.date) {
      toast({ title: "Missing information", description: "Provide holiday name and date." })
      return
    }

    setHolidays((previous) => [
      {
        id: `HOL-${Date.now()}`,
        name: holidayForm.name,
        date: holidayForm.date,
        scope: holidayForm.scope,
        scopeReference: holidayForm.scopeReference || "",
        isPaid: holidayForm.isPaid,
        notes: holidayForm.notes,
      },
      ...previous,
    ])

    toast({ title: "Holiday scheduled", description: `${holidayForm.name} added to company calendar.` })
    setHolidayDialogOpen(false)
    setHolidayForm({ name: "", date: formatDateByOffset(1), scope: "company", scopeReference: "", isPaid: true, notes: "" })
  }

  const handleRemoveHoliday = (id: string) => {
    setHolidays((previous) => previous.filter((holiday) => holiday.id !== id))
    toast({ title: "Holiday removed", description: "Schedule updated." })
  }

  const handleSaveAlertSettings = () => {
    toast({ title: "Alert preferences saved", description: `Alerts ${alertSettings.enabled ? "enabled" : "disabled"} for ${alertSettings.time}.` })
  }

  const handleRefreshInsights = () => {
    setInsightSeed(Date.now())
    toast({ title: "Insights refreshed", description: "AI models recalibrated using the latest data." })
  }

  const handleCaptureLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast({ title: "Location unavailable", description: "Browser blocked geolocation access." })
      return
    }

    setIsCapturingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setGeoCapture({
          coordinates: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          accuracy: accuracy ? `${Math.round(accuracy)}m` : undefined,
          capturedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        })
        toast({ title: "Location captured", description: "Attendance will be verified against geo-fence." })
        setIsCapturingLocation(false)
      },
      () => {
        toast({ title: "Location denied", description: "Unable to capture device coordinates." })
        setIsCapturingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return "bg-emerald-100 text-emerald-800"
      case "late":
        return "bg-yellow-100 text-yellow-800"
      case "early-departure":
        return "bg-orange-100 text-orange-800"
      case "absent":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const getPredictedTrendColor = (trend: PredictedTrend) => {
    switch (trend) {
      case "on-track":
        return "bg-emerald-50 text-emerald-700"
      case "late-risk":
        return "bg-amber-50 text-amber-700"
      case "absence-risk":
        return "bg-rose-50 text-rose-700"
      default:
        return "bg-slate-50 text-slate-700"
    }
  }

  const getMethodLabel = (method: AttendanceMethod) => {
    switch (method) {
      case "fingerprint":
        return "Fingerprint"
      case "facial":
        return "Facial"
      case "manual":
        return "Manual"
      case "mobile":
        return "Mobile"
      case "card":
        return "RFID Card"
      default:
        return method
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">AI-Driven Time & Attendance</h1>
          <p className="text-sm text-slate-600">
            Unified attendance insights across locations, predictive risk detection, and automated compliance controls.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs uppercase text-slate-500">Current time</p>
            <p className="text-lg font-semibold text-emerald-600">
              {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
            </p>
          </div>
          <Dialog open={showClockInDialog} onOpenChange={setShowClockInDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Clock className="mr-2 h-4 w-4" /> Quick Clock In/Out
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Secure clock in/out</DialogTitle>
                <DialogDescription>Pick a verification channel. AI cross-checks with device health and geo-fence.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <Button variant="outline" className="h-16 justify-start gap-3" onClick={() => handleBiometricClockIn("fingerprint")}>
                  <Fingerprint className="h-5 w-5 text-emerald-600" /> Fingerprint scanner
                </Button>
                <Button variant="outline" className="h-16 justify-start gap-3" onClick={() => handleBiometricClockIn("facial")}>
                  <Camera className="h-5 w-5 text-blue-500" /> Facial recognition kiosk
                </Button>
                <Button variant="outline" className="h-16 justify-start gap-3" onClick={() => handleBiometricClockIn("mobile")}>
                  <Globe className="h-5 w-5 text-violet-500" /> Mobile geo-fence check-in
                </Button>
                <Button variant="outline" className="h-16 justify-start gap-3" onClick={() => handleBiometricClockIn("manual")}>
                  <Timer className="h-5 w-5 text-amber-500" /> Manual override (supervisor)
                </Button>
              </div>
              <p className="text-center text-xs text-slate-500">Last sync • {biometricDevices[0]?.lastSync ?? "No devices"}</p>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-emerald-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Present today</CardTitle>
              <CardDescription>Real-time headcount</CardDescription>
            </div>
            <UserCheck className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.presentCount}</p>
            <p className="text-xs text-slate-500">{stats.attendanceRate.toFixed(1)}% attendance rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Late arrivals</CardTitle>
              <CardDescription>AI monitors over 15 min late</CardDescription>
            </div>
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.lateCount}</p>
            <p className="text-xs text-slate-500">Proactive nudges sent at 09:15</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Absences flagged</CardTitle>
              <CardDescription>Across subsidiaries</CardDescription>
            </div>
            <Users className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.absentCount}</p>
            <p className="text-xs text-slate-500">Escalations at {alertSettings.time}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Total overtime</CardTitle>
              <CardDescription>Awaiting approvals</CardDescription>
            </div>
            <Clock4 className="h-5 w-5 text-sky-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.overtimeHours.toFixed(1)}h</p>
            <p className="text-xs text-slate-500">Aligned with fatigue guardrails</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Devices online</CardTitle>
              <CardDescription>Geo-fenced sites</CardDescription>
            </div>
            <MapPin className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {stats.devicesOnline}/{stats.totalDevices}
            </p>
            <p className="text-xs text-slate-500">Auto heal enabled</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="shifts">Shift Management</TabsTrigger>
          <TabsTrigger value="overtime">Overtime</TabsTrigger>
          <TabsTrigger value="devices">Integrations</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search by employee, ID, or team"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                  <span>Filtered results: {filteredRecords.length}</span>
                  <span>•</span>
                  <span>Date range: {dateFilter.replace("-", " ")}</span>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
                <Select value={filters.location} onValueChange={(value) => handleFilterChange("location", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {uniqueValues.location.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filters.department} onValueChange={(value) => handleFilterChange("department", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {uniqueValues.department.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filters.division} onValueChange={(value) => handleFilterChange("division", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All divisions</SelectItem>
                    {uniqueValues.division.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filters.subsidiary} onValueChange={(value) => handleFilterChange("subsidiary", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Subsidiary" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subsidiaries</SelectItem>
                    {uniqueValues.subsidiary.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="early-departure">Early departure</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.method} onValueChange={(value) => handleFilterChange("method", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All capture methods</SelectItem>
                    {uniqueValues.method.map((value) => (
                      <SelectItem key={value} value={value}>
                        {getMethodLabel(value as AttendanceMethod)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-3">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-fit min-w-[150px]">
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="this-week">This week</SelectItem>
                    <SelectItem value="this-month">This month</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleResetFilters}>
                  Reset filters
                </Button>
                <Button variant="outline" onClick={() => handleExport("Attendance export")}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 xl:flex-row">
                <div className="flex-1 space-y-4">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="rounded-lg border bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-base font-semibold text-slate-900">{record.employeeName}</h3>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                              {record.employeeId}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                            <span>{record.department}</span>
                            <span>•</span>
                            <span>{record.subsidiary}</span>
                            <span>•</span>
                            <span>{record.shift}</span>
                            {record.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {record.location}
                              </span>
                            )}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-4">
                            <div>
                              <p className="text-xs uppercase text-slate-500">Clock in</p>
                              <p className="text-sm font-medium text-slate-800">{record.clockIn || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-slate-500">Clock out</p>
                              <p className="text-sm font-medium text-slate-800">{record.clockOut || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-slate-500">Hours</p>
                              <p className="text-sm font-medium text-slate-800">
                                {record.totalHours.toFixed(1)}h / {record.expectedHours}h
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-slate-500">Overtime</p>
                              <p className="text-sm font-medium text-emerald-600">{record.overtimeHours.toFixed(1)}h</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-start gap-2 text-sm md:items-end">
                          <div className="flex flex-wrap gap-2">
                            <Badge className={getStatusColor(record.status)}>{record.status.replace("-", " ")}</Badge>
                            <Badge className={getPredictedTrendColor(record.predictedTrend)}>
                              Predicted: {record.predictedTrend.replace("-", " ")}
                            </Badge>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                              {getMethodLabel(record.method)}
                            </Badge>
                          </div>
                          <div className="flex w-full flex-col gap-1">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Productivity</span>
                              <span>{record.productivityScore}%</span>
                            </div>
                            <Progress value={record.productivityScore} className="h-2" />
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Risk</span>
                              <span>{Math.round(record.aiRiskScore * 100)}%</span>
                            </div>
                            <Progress value={Math.round(record.aiRiskScore * 100)} className="h-2" />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {record.status !== "present" && (
                              <Button size="sm" onClick={() => handleUpdateAttendanceStatus(record.id, "present")}>
                                Mark present
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleSendReminder(record)}>
                              Send reminder
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!filteredRecords.length && (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-slate-500">
                      No attendance records match the current filters.
                    </div>
                  )}
                </div>
                <div className="w-full space-y-4 xl:w-80">
                  <Card className="bg-slate-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Sparkles className="h-4 w-4 text-purple-500" /> Predictive summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {aiForecasts.map((forecast) => (
                        <div key={forecast.label} className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{forecast.label}</span>
                            <span className="text-slate-400">{forecast.delta}</span>
                          </div>
                          <p className="text-lg font-semibold text-slate-900">{forecast.value}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Globe className="h-4 w-4 text-emerald-500" /> Geolocation check
                      </CardTitle>
                      <CardDescription>Verify location before approving mobile check-ins.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button onClick={handleCaptureLocation} disabled={isCapturingLocation} className="w-full">
                        {isCapturingLocation ? "Capturing..." : "Use current device location"}
                      </Button>
                      {geoCapture ? (
                        <div className="rounded-lg border bg-slate-50 p-3 text-xs text-slate-600">
                          <p>Coordinates: {geoCapture.coordinates}</p>
                          {geoCapture.accuracy && <p>Accuracy: {geoCapture.accuracy}</p>}
                          <p>Captured at: {geoCapture.capturedAt}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Geo-tag unlocks dynamic geo-fence scoring before finalizing attendance.</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <BellRing className="h-4 w-4 text-amber-500" /> Missed check-in alert
                      </CardTitle>
                      <CardDescription>Upcoming alert at {alertSettings.time}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-slate-600">
                      <p>{alertSettings.enabled ? "Alerts enabled" : "Alerts paused"} • Channel {alertSettings.channel.toUpperCase()}</p>
                      <p>{alertTriggeredToday ? "Today's alert already processed." : "System will auto-escalate if absentees remain."}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">AI attendance copilots</h2>
              <p className="text-sm text-slate-500">Machine learning surfaces emerging risk clusters, coverage gaps, and optimization tips.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport("Insights digest")}>
                <Download className="mr-2 h-4 w-4" /> Export digest
              </Button>
              <Button onClick={handleRefreshInsights}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh insights
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {aiInsights.map((insight) => (
              <Card key={insight.id} className="border border-purple-100">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-start gap-2 text-base">
                    <Sparkles className="mt-1 h-4 w-4 text-purple-500" /> {insight.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600">{insight.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {insight.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-purple-50 text-purple-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">Confidence {(insight.confidence * 100).toFixed(0)}%</span>
                </CardContent>
              </Card>
            ))}
            {!aiInsights.length && (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-sm text-slate-500">
                  No insights yet. Refresh after collecting attendance data.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="shifts" className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Shift orchestration</h2>
              <p className="text-sm text-slate-500">Align shifts with demand forecasts. AI suggests resourcing based on overtime signals.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport("Shift roster")}>
                <Download className="mr-2 h-4 w-4" /> Export roster
              </Button>
              <Button onClick={handleOpenNewShiftDialog} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" /> Create shift
              </Button>
            </div>
          </div>

          <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{shiftForm.id ? "Edit shift" : "Create shift"}</DialogTitle>
                <DialogDescription>Configure shift properties, assignments, and AI guardrails.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="shift-name">Shift name</Label>
                    <Input
                      id="shift-name"
                      value={shiftForm.name}
                      onChange={(event) => setShiftForm((previous) => ({ ...previous, name: event.target.value }))}
                      placeholder="e.g., Morning Shift"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shift-department">Department</Label>
                    <Input
                      id="shift-department"
                      value={shiftForm.department}
                      onChange={(event) => setShiftForm((previous) => ({ ...previous, department: event.target.value }))}
                      placeholder="Finance"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="shift-start">Start time</Label>
                    <Input
                      id="shift-start"
                      type="time"
                      value={shiftForm.startTime}
                      onChange={(event) => setShiftForm((previous) => ({ ...previous, startTime: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shift-end">End time</Label>
                    <Input
                      id="shift-end"
                      type="time"
                      value={shiftForm.endTime}
                      onChange={(event) => setShiftForm((previous) => ({ ...previous, endTime: event.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="shift-break">Break (minutes)</Label>
                    <Input
                      id="shift-break"
                      type="number"
                      value={shiftForm.breakDuration}
                      onChange={(event) => setShiftForm((previous) => ({ ...previous, breakDuration: Number(event.target.value) }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="shift-location">Location</Label>
                    <Input
                      id="shift-location"
                      value={shiftForm.location}
                      onChange={(event) => setShiftForm((previous) => ({ ...previous, location: event.target.value }))}
                      placeholder="Accra HQ"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="shift-employees">Employees (IDs)</Label>
                  <Input
                    id="shift-employees"
                    value={shiftForm.employees}
                    onChange={(event) => setShiftForm((previous) => ({ ...previous, employees: event.target.value }))}
                    placeholder="EMP-001, EMP-002"
                  />
                  <p className="mt-1 text-xs text-slate-500">Multiple IDs separated by comma. AI can auto-assign from talent pool.</p>
                </div>
                <div>
                  <Label htmlFor="shift-notes">Notes</Label>
                  <Textarea
                    id="shift-notes"
                    value={shiftForm.notes}
                    onChange={(event) => setShiftForm((previous) => ({ ...previous, notes: event.target.value }))}
                    placeholder="Talent handover, coverage warnings, etc."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShiftDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleShiftSubmit}>{shiftForm.id ? "Update shift" : "Create shift"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shifts.map((shift) => (
              <Card key={shift.id} className="relative">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900">{shift.name}</CardTitle>
                      <CardDescription>
                        {shift.startTime} - {shift.endTime} • {shift.breakDuration} min break
                      </CardDescription>
                    </div>
                    <Badge className={shift.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                      {shift.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{shift.department} • {shift.location || "Location TBD"}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>
                      Assigned employees: <span className="font-medium text-slate-900">{shift.employees.length}</span>
                    </p>
                    {shift.notes && <p className="text-xs text-slate-500">{shift.notes}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => handleEditShift(shift)}>
                      Edit shift
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toast({ title: "Schedule view", description: "Integration with roster builder coming soon." })}>
                      View schedule
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleToggleShiftActive(shift.id)}>
                      {shift.isActive ? "Pause shift" : "Activate shift"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overtime" className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Overtime governance</h2>
              <p className="text-sm text-slate-500">Approve or reroute overtime with AI fatigue guardrails.</p>
            </div>
            <Button variant="outline" onClick={() => handleExport("Overtime ledger")}>
              <Download className="mr-2 h-4 w-4" /> Export overtime
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-sky-500" /> Pending approvals
              </CardTitle>
              <CardDescription>AI highlights risk of burnout by role and department.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {overtimeRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{request.employeeName}</p>
                    <p className="text-xs text-slate-500">
                      {request.department} • {new Date(request.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-600">{request.justification}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <Badge
                      className={
                        request.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : request.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }
                    >
                      {request.status.toUpperCase()}
                    </Badge>
                    <p className="text-sm font-medium text-slate-900">{request.hoursRequested.toFixed(1)} hours</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproveOvertime(request.id, "approved")}
                        disabled={request.status === "approved"}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproveOvertime(request.id, "rejected")}
                        disabled={request.status === "rejected"}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => toast({ title: "Sent to analytics", description: "Detailed timesheet opened in payroll workspace." })}
                      >
                        View details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Biometric & attendance integrations</h2>
              <p className="text-sm text-slate-500">Connect biometric terminals, mobile apps, or third-party attendance APIs in minutes.</p>
            </div>
            <Button onClick={() => setDeviceDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" /> Connect device
            </Button>
          </div>

          <Dialog open={deviceDialogOpen} onOpenChange={setDeviceDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Connect a biometric device or external feed</DialogTitle>
                <DialogDescription>Use vendor SDKs, REST webhooks, or CSV imports. We normalize data for you.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="device-name">Device name</Label>
                    <Input
                      id="device-name"
                      value={deviceForm.name}
                      onChange={(event) => setDeviceForm((previous) => ({ ...previous, name: event.target.value }))}
                      placeholder="e.g., HQ FaceID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="device-provider">Provider / Vendor</Label>
                    <Input
                      id="device-provider"
                      value={deviceForm.provider}
                      onChange={(event) => setDeviceForm((previous) => ({ ...previous, provider: event.target.value }))}
                      placeholder="VisionX"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>Capture type</Label>
                    <Select value={deviceForm.type} onValueChange={(value) => setDeviceForm((previous) => ({ ...previous, type: value as BiometricDevice["type"] }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fingerprint">Fingerprint</SelectItem>
                        <SelectItem value="facial">Facial recognition</SelectItem>
                        <SelectItem value="card">RFID / card</SelectItem>
                        <SelectItem value="mobile">Mobile app</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Integration mode</Label>
                    <Select
                      value={deviceForm.integration}
                      onValueChange={(value) => setDeviceForm((previous) => ({ ...previous, integration: value as BiometricDevice["integration"] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REST">REST webhook</SelectItem>
                        <SelectItem value="SDK">Vendor SDK</SelectItem>
                        <SelectItem value="CSV">CSV / SFTP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="device-location">Location</Label>
                    <Input
                      id="device-location"
                      value={deviceForm.location}
                      onChange={(event) => setDeviceForm((previous) => ({ ...previous, location: event.target.value }))}
                      placeholder="Accra HQ Lobby"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="device-reference">Webhook URL / SDK key</Label>
                  <Input
                    id="device-reference"
                    value={deviceForm.reference}
                    onChange={(event) => setDeviceForm((previous) => ({ ...previous, reference: event.target.value }))}
                    placeholder="https://"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDeviceDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddDevice}>Connect device</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {biometricDevices.map((device) => (
              <Card key={device.id} className="border border-slate-200">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify_between gap-2">
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900">{device.name}</CardTitle>
                      <CardDescription>{device.location}</CardDescription>
                    </div>
                    <Badge
                      className={
                        device.status === "online"
                          ? "bg-emerald-100 text-emerald-700"
                          : device.status === "syncing"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }
                    >
                      {device.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">Last sync: {device.lastSync}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <LinkIcon className="h-3 w-3" /> {device.integration} • {device.provider}
                  </div>
                  {device.reference && <div className="rounded bg-slate-50 p-2 text-xs text-slate-500">{device.reference}</div>}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => toast({ title: "Configure", description: "Device configuration launched." })}>
                      Configure
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSyncDevice(device.id)}>
                      Sync data
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeviceStatusToggle(device)}>
                      {device.status === "online" ? "Mark offline" : "Bring online"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <BellRing className="h-5 w-5 text-amber-500" /> Missed attendee alerts
                </CardTitle>
                <CardDescription>Configure automated nudges when employees miss check-in targets.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Enable alerts</p>
                    <p className="text-xs text-slate-500">Send alert when AI detects missing check-ins.</p>
                  </div>
                  <Switch checked={alertSettings.enabled} onCheckedChange={(checked) => setAlertSettings((previous) => ({ ...previous, enabled: checked }))} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="alert-time">Alert time</Label>
                    <Input
                      id="alert-time"
                      type="time"
                      value={alertSettings.time}
                      onChange={(event) => setAlertSettings((previous) => ({ ...previous, time: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Channel</Label>
                    <Select value={alertSettings.channel} onValueChange={(value) => setAlertSettings((previous) => ({ ...previous, channel: value as AlertSettings["channel"] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email digest</SelectItem>
                        <SelectItem value="sms">SMS text</SelectItem>
                        <SelectItem value="push">Mobile push</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center justify-between rounded border p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">Escalate to managers</p>
                      <p className="text-xs text-slate-500">Notify direct leads</p>
                    </div>
                    <Switch
                      checked={alertSettings.escalateToManagers}
                      onCheckedChange={(checked) => setAlertSettings((previous) => ({ ...previous, escalateToManagers: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded border p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">Include contractors</p>
                      <p className="text-xs text-slate-500">Send alerts to partner staff</p>
                    </div>
                    <Switch
                      checked={alertSettings.includeContractors}
                      onCheckedChange={(checked) => setAlertSettings((previous) => ({ ...previous, includeContractors: checked }))}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveAlertSettings}>Save preferences</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Settings2 className="h-5 w-5 text-indigo-500" /> Holiday & blackout calendar
                </CardTitle>
                <CardDescription>HR can define holidays or location-specific blackout days. Attendance auto-adjusts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Upcoming holidays</p>
                    <p className="text-xs text-slate-500">Synced with payroll & leave management</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setHolidayDialogOpen(true)}>
                    <Plus className="mr-1 h-3 w-3" /> Add
                  </Button>
                </div>
                <div className="space-y-3">
                  {holidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex flex-col gap-2 rounded border border-slate-200 p-3 text-sm text-slate-700 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{holiday.name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(holiday.date).toLocaleDateString()} • {holiday.scope === "company" ? "Company-wide" : holiday.scope === "subsidiary" ? holiday.scopeReference : `${holiday.scopeReference} team`}
                        </p>
                        {holiday.notes && <p className="text-xs text-slate-500">{holiday.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 self-start md:self-end">
                        <Badge className={holiday.isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                          {holiday.isPaid ? "Paid" : "Unpaid"}
                        </Badge>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveHoliday(holiday.id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!holidays.length && <p className="text-xs text-slate-500">No holidays defined yet.</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          <Dialog open={holidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule a holiday / blackout day</DialogTitle>
                <DialogDescription>Employees scheduled on this day receive automatic exemptions.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="holiday-name">Holiday name</Label>
                  <Input
                    id="holiday-name"
                    value={holidayForm.name}
                    onChange={(event) => setHolidayForm((previous) => ({ ...previous, name: event.target.value }))}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="holiday-date">Date</Label>
                    <Input
                      id="holiday-date"
                      type="date"
                      value={holidayForm.date}
                      onChange={(event) => setHolidayForm((previous) => ({ ...previous, date: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Scope</Label>
                    <Select value={holidayForm.scope} onValueChange={(value) => setHolidayForm((previous) => ({ ...previous, scope: value as Holiday["scope"] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">Company-wide</SelectItem>
                        <SelectItem value="subsidiary">Subsidiary</SelectItem>
                        <SelectItem value="department">Department</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="holiday-scope">Reference (optional)</Label>
                  <Input
                    id="holiday-scope"
                    value={holidayForm.scopeReference}
                    onChange={(event) => setHolidayForm((previous) => ({ ...previous, scopeReference: event.target.value }))}
                    placeholder="e.g., Core Group"
                  />
                </div>
                <div className="flex items-center justify-between rounded border p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Paid holiday</p>
                    <p className="text-xs text-slate-500">Exempt from overtime accruals</p>
                  </div>
                  <Switch
                    checked={holidayForm.isPaid}
                    onCheckedChange={(checked) => setHolidayForm((previous) => ({ ...previous, isPaid: checked }))}
                  />
                </div>
                <div>
                  <Label htmlFor="holiday-notes">Notes</Label>
                  <Textarea
                    id="holiday-notes"
                    value={holidayForm.notes}
                    onChange={(event) => setHolidayForm((previous) => ({ ...previous, notes: event.target.value }))}
                    placeholder="Who is exempt and additional guidance"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setHolidayDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddHoliday}>Save holiday</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
