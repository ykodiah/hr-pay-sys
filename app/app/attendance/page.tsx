"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  listChannels as listCommunicationChannels,
  sendMessage as sendCommunicationMessage,
  type CommunicationChannel,
  type CommunicationMessage,
} from "@/lib/api/communication-service"
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
  Activity,
  AlertTriangle,
  MapPin,
  Plus,
  Radar,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Timer,
  UserCheck,
  Users,
} from "lucide-react"

type AttendanceStatus = "present" | "late" | "absent" | "early-departure"
type AttendanceMethod = "fingerprint" | "facial" | "mobile" | "manual" | "card"
type PredictedTrend = "on-track" | "late-risk" | "absence-risk"

const getInitialDemoMode = () => {
  if (typeof window === "undefined") {
    return false
  }

  try {
    if (window.localStorage?.getItem("demo_mode") === "true") {
      return true
    }
  } catch {
    // Ignore localStorage access errors (e.g., privacy mode)
  }

  if (typeof document !== "undefined") {
    const cookies = document.cookie?.split(";") ?? []
    const demoSessionCookie = cookies.find((cookie) => cookie.trim().startsWith("demo-session="))
    if (demoSessionCookie && demoSessionCookie.includes("active")) {
      return true
    }
  }

  return false
}

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
  deliveryChannel: "email" | "sms" | "push"
  escalateToManagers: boolean
  includeContractors: boolean
  communicationChannelId: string | null
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

type DeviceComplianceHealth = "healthy" | "warning" | "critical"

interface ComplianceDevice {
  id: string
  name: string
  provider: string
  location: string
  status: BiometricDevice["status"]
  lastSync: string
  minutesSinceSync: number
  health: DeviceComplianceHealth
}

interface GeoAnomaly {
  id: string
  employeeId: string
  employeeName: string
  reason: string
  detail: string
}

interface AttendancePolicy {
  id: string
  name: string
  policy_type: string
  scope_type: string
  scope_reference: string | null
  grace_minutes: number | null
  rounding_increment: number | null
  rounding_mode: string | null
  penalty_type: string | null
  penalty_value: number | null
  auto_escalate: boolean
  escalation_minutes: number | null
  escalation_channel: string | null
  payroll_action: string | null
  effective_from: string
  effective_to: string | null
  is_active: boolean
}

interface AttendancePolicyForm {
  id?: string
  name: string
  policy_type: string
  scope_type: string
  scope_reference: string
  grace_minutes: number
  rounding_increment: number
  rounding_mode: string
  penalty_type: string
  penalty_value: string
  auto_escalate: boolean
  escalation_minutes: string
  escalation_channel: string
  payroll_action: string
  effective_from: string
  effective_to: string
  is_active: boolean
}

type SupabaseAttendanceRecord = {
  id: string
  employee_id: string
  date: string
  clock_in: string | null
  clock_out: string | null
  break_start: string | null
  break_end: string | null
  total_hours: number | null
  overtime_hours: number | null
  status: string | null
  notes: string | null
}

type SupabaseEmployee = {
  id: string
  employee_id: string | null
  full_name: string | null
  department: string | null
  division: string | null
  location: string | null
  subsidiary_id: string | null
}

type SupabaseSubsidiary = {
  id: string
  name: string | null
}

const formatTimeFragment = (value: string | null) => {
  if (!value) {
    return ""
  }

  // Supabase returns HH:MM:SS – keep HH:MM
  return value.slice(0, 5)
}

const calculateHoursFromTimes = (clockIn: string | null, clockOut: string | null) => {
  if (!clockIn || !clockOut) {
    return 0
  }

  const [inHour, inMinute] = clockIn.split(":").map(Number)
  const [outHour, outMinute] = clockOut.split(":").map(Number)

  if (Number.isNaN(inHour) || Number.isNaN(inMinute) || Number.isNaN(outHour) || Number.isNaN(outMinute)) {
    return 0
  }

  const inMinutesTotal = inHour * 60 + inMinute
  let outMinutesTotal = outHour * 60 + outMinute

  // Handle overnight shifts (clock-out past midnight)
  if (outMinutesTotal < inMinutesTotal) {
    outMinutesTotal += 24 * 60
  }

  const diffInMinutes = Math.max(outMinutesTotal - inMinutesTotal, 0)
  return Number((diffInMinutes / 60).toFixed(2))
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const mapStatusFromSupabase = (status: string | null): AttendanceStatus => {
  switch (status) {
    case "present":
      return "present"
    case "late":
      return "late"
    case "half_day":
      return "early-departure"
    case "leave":
    case "absent":
      return "absent"
    default:
      return "present"
  }
}

const resolveShiftLabel = (clockIn: string | null, clockOut: string | null) => {
  if (!clockIn) {
    return "Flexible Shift"
  }

  const [hour] = clockIn.split(":").map(Number)
  if (Number.isNaN(hour)) {
    return "Flexible Shift"
  }

  if (hour >= 18 || (clockOut && clockOut < clockIn)) {
    return "Night Shift"
  }

  if (hour < 10) {
    return "Day Shift"
  }

  if (hour < 14) {
    return "Midday Shift"
  }

  return "Afternoon Shift"
}

const detectAttendanceMethod = (notes: string | null): AttendanceMethod => {
  const safeNotes = notes?.toLowerCase() ?? ""
  if (safeNotes.includes("mobile") || safeNotes.includes("geo")) {
    return "mobile"
  }
  if (safeNotes.includes("face") || safeNotes.includes("facial")) {
    return "facial"
  }
  if (safeNotes.includes("card") || safeNotes.includes("rfid")) {
    return "card"
  }
  if (safeNotes.includes("manual") || safeNotes.includes("override")) {
    return "manual"
  }
  return "fingerprint"
}

const detectWorkingArrangement = (employee: SupabaseEmployee | undefined, notes: string | null): AttendanceRecord["workingArrangement"] => {
  const lookupSource = `${employee?.location ?? ""} ${notes ?? ""}`.toLowerCase()
  if (lookupSource.includes("remote") || lookupSource.includes("home")) {
    return "remote"
  }
  if (lookupSource.includes("hybrid") || lookupSource.includes("flex")) {
    return "hybrid"
  }
  return "onsite"
}

const normalizeAttendanceRecord = (
  record: SupabaseAttendanceRecord,
  employees: Map<string, SupabaseEmployee>,
  subsidiaries: Map<string, SupabaseSubsidiary>,
): AttendanceRecord => {
  const employee = employees.get(record.employee_id)
  const subsidiaryName =
    employee?.subsidiary_id && subsidiaries.get(employee.subsidiary_id)
      ? subsidiaries.get(employee.subsidiary_id)?.name ?? "Subsidiary"
      : "Head Office"

  const expectedHours = 8
  const totalHours =
    typeof record.total_hours === "number" && !Number.isNaN(record.total_hours)
      ? Number(record.total_hours)
      : calculateHoursFromTimes(record.clock_in, record.clock_out)

  const overtimeHours =
    typeof record.overtime_hours === "number" && !Number.isNaN(record.overtime_hours)
      ? Number(record.overtime_hours)
      : Math.max(totalHours - expectedHours, 0)

  const status = mapStatusFromSupabase(record.status)
  const productivityScore = totalHours ? clamp(Math.round((totalHours / expectedHours) * 100), 0, 100) : 0

  const baseRisk =
    status === "absent" ? 0.75 : status === "late" ? 0.45 : status === "early-departure" ? 0.35 : 0.12
  const overtimeRiskBoost = overtimeHours > 2 ? 0.1 : overtimeHours > 0 ? 0.05 : 0
  const aiRiskScore = clamp(baseRisk + overtimeRiskBoost, 0, 0.95)

  const predictedTrend: PredictedTrend =
    aiRiskScore >= 0.6 ? "absence-risk" : aiRiskScore >= 0.35 ? "late-risk" : "on-track"

  return {
    id: record.id,
    employeeId: employee?.employee_id ?? record.employee_id,
    employeeName: employee?.full_name ?? "Unknown employee",
    date: record.date ? new Date(record.date).toISOString().split("T")[0] : formatDateByOffset(0),
    clockIn: formatTimeFragment(record.clock_in),
    clockOut: formatTimeFragment(record.clock_out),
    totalHours,
    overtimeHours,
    expectedHours,
    status,
    location: employee?.location ?? "Not specified",
    department: employee?.department ?? "General",
    division: employee?.division ?? employee?.department ?? "Operations",
    subsidiary: subsidiaryName,
    team: employee?.division ?? employee?.department ?? "Core Team",
    shift: resolveShiftLabel(formatTimeFragment(record.clock_in), formatTimeFragment(record.clock_out)),
    method: detectAttendanceMethod(record.notes),
    workingArrangement: detectWorkingArrangement(employee, record.notes),
    productivityScore,
    aiRiskScore,
    predictedTrend,
  }
}

const parseLastSyncMinutes = (input?: string): number => {
  if (!input) {
    return 999
  }

  const trimmed = input.trim()
  if (!trimmed) {
    return 999
  }

  const directTimestamp = Date.parse(trimmed)
  if (!Number.isNaN(directTimestamp)) {
    return Math.max(0, Math.round((Date.now() - directTimestamp) / 60000))
  }

  try {
    const now = new Date()
    const reference = new Date(now)
    const lower = trimmed.toLowerCase()

    if (lower.includes("yesterday")) {
      reference.setDate(reference.getDate() - 1)
    } else if (lower.includes("last sync")) {
      // leave reference at now
    }

    const timeMatch = trimmed.match(/(\d{1,2}):(\d{2})/)
    if (timeMatch) {
      const hours = Number(timeMatch[1])
      const minutes = Number(timeMatch[2])
      reference.setHours(hours, minutes, 0, 0)
      return Math.max(0, Math.round((now.getTime() - reference.getTime()) / 60000))
    }
  } catch {
    // Ignore parsing errors
  }

  return 999
}

const GHANA_BOUNDS = {
  minLat: 4.5,
  maxLat: 11.5,
  minLon: -3.5,
  maxLon: 1.5,
}

const locationCoordinateLookup: Record<string, { lat: number; lon: number }> = {
  "Accra HQ": { lat: 5.6037, lon: -0.187 },
  "Accra HQ - Main Lobby": { lat: 5.6037, lon: -0.187 },
  "Accra HQ - Executive Floor": { lat: 5.6043, lon: -0.186 },
  "Accra HQ - Logistics Dock": { lat: 5.6021, lon: -0.189 },
  "Tema Plant": { lat: 5.667, lon: -0.016 },
  "Tema Plant - Security": { lat: 5.6668, lon: -0.0165 },
  "Tema Plant - Shipping": { lat: 5.6681, lon: -0.0156 },
  "Kumasi Hub": { lat: 6.6885, lon: -1.6244 },
  "Kumasi Hub - Front Desk": { lat: 6.6892, lon: -1.6239 },
  "Takoradi Depot": { lat: 4.9049, lon: -1.7569 },
  "Tamale Warehouse": { lat: 9.4071, lon: -0.8393 },
  "Sunyani Branch": { lat: 7.3393, lon: -2.3268 },
  "Cape Coast Service": { lat: 5.1053, lon: -1.2466 },
  Remote: { lat: 5.6145, lon: -0.2055 },
}

const resolveGeoCoordinate = (rawLocation: string | null | undefined) => {
  if (!rawLocation) return null
  const trimmed = rawLocation.trim()
  if (!trimmed) return null

  if (locationCoordinateLookup[trimmed]) {
    return locationCoordinateLookup[trimmed]
  }

  const base = trimmed.split(" - ")[0]
  if (locationCoordinateLookup[base]) {
    return locationCoordinateLookup[base]
  }

  return null
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

  const demoModeRef = useRef<boolean>(getInitialDemoMode())

  const [isDemoData, setIsDemoData] = useState(demoModeRef.current)
  const [isLoadingData, setIsLoadingData] = useState(!demoModeRef.current)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState("overview")
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(
    demoModeRef.current ? initialAttendanceRecords : [],
  )
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

  const createPolicyDefaults = useCallback(
    (): AttendancePolicyForm => ({
      name: "",
      policy_type: "grace",
      scope_type: "company",
      scope_reference: "",
      grace_minutes: 10,
      rounding_increment: 0,
      rounding_mode: "nearest",
      penalty_type: "",
      penalty_value: "",
      auto_escalate: false,
      escalation_minutes: "",
      escalation_channel: "email",
      payroll_action: "",
      effective_from: formatDateByOffset(0),
      effective_to: "",
      is_active: true,
    }),
    [],
  )

  const [policies, setPolicies] = useState<AttendancePolicy[]>([])
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false)
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false)
  const [isSavingPolicy, setIsSavingPolicy] = useState(false)
  const [policyForm, setPolicyForm] = useState<AttendancePolicyForm>(() => createPolicyDefaults())
  const [runningPolicyFor, setRunningPolicyFor] = useState<string | null>(null)
  const handleRunPolicies = async (recordId: string) => {
    try {
      setRunningPolicyFor(recordId)
      const response = await fetch("/functions/v1/apply-attendance-policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId }),
      })

      if (!response.ok) {
        throw new Error("Failed to run policies")
      }

      toast({
        title: "Policy evaluation triggered",
        description: "Attendance policies are being applied to this record.",
      })
    } catch (error) {
      console.error("[attendance] handleRunPolicies error", error)
      toast({
        title: "Unable to run policies",
        description: "Policy evaluation failed to start.",
        variant: "destructive",
      })
    } finally {
      setRunningPolicyFor(null)
    }
  }

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
    deliveryChannel: "email",
    escalateToManagers: true,
    includeContractors: false,
    communicationChannelId: "channel-ops",
  })

  const [communicationChannels, setCommunicationChannels] = useState<CommunicationChannel[]>([])
  const [subsidiaryOptions, setSubsidiaryOptions] = useState<SupabaseSubsidiary[]>([])
  const offlineAlertedDevicesRef = useRef<Set<string>>(new Set())

  const formatDeliveryChannel = useCallback((channel: AlertSettings["deliveryChannel"]) => {
    if (channel === "sms") return "SMS"
    if (channel === "push") return "Push"
    return "Email"
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadAttendanceData = async () => {
      if (demoModeRef.current) {
        setIsLoadingData(false)
        setIsDemoData(true)
        setAttendanceRecords(initialAttendanceRecords)
        setLoadError(null)
        return
      }

      setIsLoadingData(true)
      setLoadError(null)

      try {
        const supabase: any = createClient()

        if (supabase?.__isMock) {
          if (!isMounted) return
          demoModeRef.current = true
          setIsDemoData(true)
          setAttendanceRecords(initialAttendanceRecords)
          setIsLoadingData(false)
          setLoadError("Supabase credentials missing. Showing sample attendance data.")
          toast({
            title: "Demo data in use",
            description: "Supabase credentials missing. Showing sample attendance records.",
          })
          return
        }

        const [attendanceResponse, employeesResponse, subsidiariesResponse] = await Promise.all([
          supabase
            .from("attendance_records")
            .select(
              "id, employee_id, date, clock_in, clock_out, break_start, break_end, total_hours, overtime_hours, status, notes",
            )
            .order("date", { ascending: false })
            .limit(200),
          supabase.from("employees").select("id, employee_id, full_name, department, division, location, subsidiary_id"),
          supabase.from("subsidiaries").select("id, name"),
        ])

        if (!isMounted) return

        const errors = [attendanceResponse.error, employeesResponse.error, subsidiariesResponse.error].filter(Boolean)
        if (errors.length) {
          throw new Error(errors.map((err) => err?.message ?? "Unknown error").join(" • "))
        }

        const employeesMap = new Map<string, SupabaseEmployee>()
        ;(employeesResponse.data ?? []).forEach((employee: SupabaseEmployee) => {
          if (employee?.id) {
            employeesMap.set(employee.id, employee)
          }
        })

        const subsidiariesMap = new Map<string, SupabaseSubsidiary>()
        ;(subsidiariesResponse.data ?? []).forEach((subsidiary: SupabaseSubsidiary) => {
          if (subsidiary?.id) {
            subsidiariesMap.set(subsidiary.id, subsidiary)
          }
        })

        const normalizedRecords = (attendanceResponse.data ?? []).map((record: SupabaseAttendanceRecord) =>
          normalizeAttendanceRecord(record, employeesMap, subsidiariesMap),
        )

        setAttendanceRecords(normalizedRecords)
        setSubsidiaryOptions(Array.from(subsidiariesMap.values()))
        setIsDemoData(false)
        setIsLoadingData(false)

        if (normalizedRecords.length === 0) {
          setLoadError("No attendance records found. Add entries from capture devices or import attendance logs.")
        }
      } catch (error) {
        if (!isMounted) return
        console.error("[attendance] Failed to load attendance data", error)
        setLoadError(error instanceof Error ? error.message : "Failed to load attendance data.")
        demoModeRef.current = true
        setIsDemoData(true)
        setAttendanceRecords(initialAttendanceRecords)
        setIsLoadingData(false)
        toast({
          title: "Using sample attendance data",
          description: "We could not reach Supabase attendance records. Showing demo content instead.",
          variant: "destructive",
        })
      }
    }

    loadAttendanceData()

    return () => {
      isMounted = false
    }
  }, [toast])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const loadAttendancePolicies = useCallback(async () => {
    try {
      setIsLoadingPolicies(true)
      const response = await fetch("/api/policies/attendance")
      if (!response.ok) {
        throw new Error("Failed to load attendance policies")
      }
      const payload = await response.json()
      setPolicies(payload.data ?? [])
    } catch (error) {
      console.error("[attendance] loadAttendancePolicies error", error)
      toast({
        title: "Unable to load policies",
        description: "Attendance policy automations could not be retrieved.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPolicies(false)
    }
  }, [toast])

  useEffect(() => {
    loadAttendancePolicies()
  }, [loadAttendancePolicies])

  const currentDayKey = `${currentTime.getFullYear()}-${currentTime.getMonth()}-${currentTime.getDate()}`

  useEffect(() => {
    let mounted = true

    const loadCommunicationChannels = async () => {
      try {
        const data = await listCommunicationChannels()
        if (!mounted) return
        setCommunicationChannels(data)
        if (data.length > 0) {
          setAlertSettings((previous) =>
            previous.communicationChannelId ? previous : { ...previous, communicationChannelId: data[0].id },
          )
        }
      } catch (error) {
        console.error("[attendance] loadCommunicationChannels error", error)
      }
    }

    loadCommunicationChannels()

    return () => {
      mounted = false
    }
  }, [])

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
        const deliveryLabelText = formatDeliveryChannel(alertSettings.deliveryChannel)
        toast({
          title: "Missed attendance alert ready",
          description: `${missed.length} employee${missed.length > 1 ? "s" : ""} have not clocked in. Alert sent via ${deliveryLabelText}.`,
        })
        missed.forEach((record) => {
          void sendAttendanceAlert(record, { kind: "reminder" })
        })
        setAlertTriggeredToday(true)
      }
    }
  }, [alertSettings, alertTriggeredToday, attendanceRecords, currentTime, formatDeliveryChannel, sendAttendanceAlert, toast])

  const uniqueValues = useMemo(() => {
    const unique = {
      location: new Set<string>(),
      department: new Set<string>(),
      division: new Set<string>(),
      subsidiary: new Set<string>(),
      method: new Set<string>(),
      team: new Set<string>(),
    }

    attendanceRecords.forEach((record) => {
      if (record.location) unique.location.add(record.location)
      unique.department.add(record.department)
      unique.division.add(record.division)
      unique.subsidiary.add(record.subsidiary)
      unique.method.add(record.method)
      if (record.team) unique.team.add(record.team)
    })

    return {
      location: Array.from(unique.location),
      department: Array.from(unique.department),
      division: Array.from(unique.division),
      subsidiary: Array.from(unique.subsidiary),
      method: Array.from(unique.method),
      team: Array.from(unique.team),
    }
  }, [attendanceRecords])

  const departmentOptions = uniqueValues.department
  const teamOptions = uniqueValues.team

  const scopeReferenceOptions = useMemo(
    () => {
      switch (policyForm.scope_type) {
        case "subsidiary":
          return subsidiaryOptions
            .filter((subsidiary) => subsidiary.id)
            .map((subsidiary) => ({
              value: subsidiary.id as string,
              label: subsidiary.name ?? "Unnamed subsidiary",
            }))
        case "department":
          return departmentOptions.filter(Boolean).map((department) => ({
            value: department,
            label: department,
          }))
        case "team":
          return teamOptions.filter(Boolean).map((team) => ({
            value: team,
            label: team,
          }))
        default:
          return []
      }
    },
    [departmentOptions, policyForm.scope_type, subsidiaryOptions, teamOptions],
  )

  const geoHeatmap = useMemo(() => {
    const pointsMap = new Map<
      string,
      {
        location: string
        count: number
        lat: number
        lon: number
        latestDate: string
      }
    >()

    attendanceRecords.forEach((record) => {
      const coordinate = resolveGeoCoordinate(record.location)
      if (!coordinate) {
        return
      }

      const key = `${coordinate.lat.toFixed(4)}-${coordinate.lon.toFixed(4)}`
      const existing = pointsMap.get(key)
      if (existing) {
        existing.count += 1
        if (record.date > existing.latestDate) {
          existing.latestDate = record.date
        }
      } else {
        pointsMap.set(key, {
          location: record.location || "Unknown location",
          count: 1,
          lat: coordinate.lat,
          lon: coordinate.lon,
          latestDate: record.date,
        })
      }
    })

    const total = Array.from(pointsMap.values()).reduce((acc, entry) => acc + entry.count, 0)
    const points = Array.from(pointsMap.values()).map((entry, index) => {
      const lonRange = GHANA_BOUNDS.maxLon - GHANA_BOUNDS.minLon
      const latRange = GHANA_BOUNDS.maxLat - GHANA_BOUNDS.minLat
      const xRatio = lonRange > 0 ? (entry.lon - GHANA_BOUNDS.minLon) / lonRange : 0.5
      const yRatio = latRange > 0 ? (entry.lat - GHANA_BOUNDS.minLat) / latRange : 0.5
      const size = Math.min(42, Math.max(12, 16 + entry.count * 4))

      return {
        id: `${entry.location}-${index}`,
        location: entry.location,
        count: entry.count,
        latestDate: entry.latestDate,
        leftPercent: Math.min(95, Math.max(5, xRatio * 100)),
        topPercent: Math.min(95, Math.max(5, (1 - yRatio) * 100)),
        size,
      }
    })

    return {
      total,
      points,
    }
  }, [attendanceRecords])

  useEffect(() => {
    if (policyForm.scope_type === "company") {
      if (policyForm.scope_reference !== "") {
        setPolicyForm((previous) => ({ ...previous, scope_reference: "" }))
      }
      return
    }

    if (!scopeReferenceOptions.length) {
      return
    }

    const hasMatch = scopeReferenceOptions.some((option) => option.value === policyForm.scope_reference)
    if (!hasMatch) {
      setPolicyForm((previous) => ({ ...previous, scope_reference: scopeReferenceOptions[0].value }))
    }
  }, [policyForm.scope_reference, policyForm.scope_type, scopeReferenceOptions])

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

  const defaultCommunicationChannelId = "channel-ops"

  const sendAttendanceAlert = useCallback(
    async (record: AttendanceRecord, context: { kind: "reminder" | "status"; status?: AttendanceStatus }) => {
      try {
        const id =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `attendance-msg-${Date.now()}-${Math.random().toString(16).slice(2)}`

        const targetChannelId = alertSettings.communicationChannelId ?? defaultCommunicationChannelId
        const channelInfo = communicationChannels.find((channel) => channel.id === targetChannelId)
        const requiresAck = context.kind === "reminder" ? alertSettings.escalateToManagers : context.status === "absent"
        const priority = context.kind === "reminder" || context.status === "absent" ? "high" : "normal"
        const deliveryLabelText = formatDeliveryChannel(alertSettings.deliveryChannel)
        const destinationLabel = channelInfo?.name ?? targetChannelId

        const baseContent =
          context.kind === "reminder"
            ? `Attendance reminder: ${record.employeeName} has not clocked in for ${record.shift} (${record.date}).`
            : `Attendance status update: ${record.employeeName} is marked ${context.status ?? record.status} for ${record.date}.`

        const content = `${baseContent} Delivery via ${deliveryLabelText} and posted to ${destinationLabel}${
          alertSettings.escalateToManagers ? " with manager escalation" : ""
        }.`

        const message: CommunicationMessage = {
          id,
          channelId: targetChannelId,
          author: "Attendance Automation",
          authorRole: "Virtual Attendance Assistant",
          content,
          sentAt: new Date().toISOString(),
          priority,
          requiresAck,
          acknowledgedBy: [],
          tags: ["attendance", context.kind === "reminder" ? "missed-clock-in" : "status-update"],
        }

        await sendCommunicationMessage(message)
      } catch (error) {
        console.error("[attendance] sendAttendanceAlert error", error)
      }
    },
    [
      alertSettings.communicationChannelId,
      alertSettings.deliveryChannel,
      alertSettings.escalateToManagers,
      communicationChannels,
      formatDeliveryChannel,
    ],
  )

  const sendDeviceAlert = useCallback(
    async (device: ComplianceDevice, context: { reason: "offline" | "latency" }) => {
      try {
        const id =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `device-alert-${Date.now()}-${Math.random().toString(16).slice(2)}`

        const targetChannelId = alertSettings.communicationChannelId ?? defaultCommunicationChannelId
        const channelInfo = communicationChannels.find((channel) => channel.id === targetChannelId)
        const deliveryLabelText = formatDeliveryChannel(alertSettings.deliveryChannel)
        const destinationLabel = channelInfo?.name ?? targetChannelId

        const baseContent =
          context.reason === "offline"
            ? `Device offline: ${device.name} at ${device.location || "Unknown site"} has been offline for ${
                device.minutesSinceSync >= 999 ? "an extended period" : `${device.minutesSinceSync} minutes`
              }.`
            : `Device latency: ${device.name} sync delay of ${device.minutesSinceSync} minutes exceeds SLA threshold.`

        const content = `${baseContent} Delivery via ${deliveryLabelText} and posted to ${destinationLabel}.`

        const message: CommunicationMessage = {
          id,
          channelId: targetChannelId,
          author: "Attendance Automation",
          authorRole: "Device Monitoring",
          content,
          sentAt: new Date().toISOString(),
          priority: context.reason === "offline" ? "critical" : "high",
          requiresAck: true,
          acknowledgedBy: [],
          tags: ["attendance", "device-alert", context.reason === "offline" ? "offline" : "latency"],
        }

        await sendCommunicationMessage(message)
      } catch (error) {
        console.error("[attendance] sendDeviceAlert error", error)
      }
    },
    [alertSettings.communicationChannelId, alertSettings.deliveryChannel, communicationChannels, formatDeliveryChannel],
  )

  const handleUpdateAttendanceStatus = (id: string, status: AttendanceStatus) => {
    const targetRecord = attendanceRecords.find((record) => record.id === id)

    setAttendanceRecords((previous) =>
      previous.map((record) => (record.id === id ? { ...record, status, clockIn: record.clockIn || "08:30" } : record)),
    )

    toast({
      title: "Attendance updated",
      description: `Status flagged as ${status.replace("-", " ")}.`,
    })

    if (targetRecord) {
      void sendAttendanceAlert({ ...targetRecord, status }, { kind: "status", status })
    }
  }

  const handleSendReminder = (record: AttendanceRecord) => {
    toast({
      title: "Reminder queued",
      description: `Notification sent to ${record.employeeName} via AI nudges and ${formatDeliveryChannel(alertSettings.deliveryChannel)}.`,
    })

    void sendAttendanceAlert(record, { kind: "reminder" })
  }

  const handleEscalateDevice = (device: ComplianceDevice) => {
    toast({
      title: "Device escalation queued",
      description: `${device.name} notification dispatched to compliance channel.`,
    })

    void sendDeviceAlert(device, { reason: device.health === "critical" ? "offline" : "latency" })
  }

  const handleExportGeoHeatmap = () => {
    toast({
      title: "Heatmap export queued",
      description: geoHeatmap.total
        ? `${geoHeatmap.total} geo-tagged events packaged for compliance review.`
        : "No geo-tagged events available yet.",
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

  const handleOpenNewPolicyDialog = () => {
    setPolicyForm(createPolicyDefaults())
    setPolicyDialogOpen(true)
  }

  const handleEditPolicy = (policy: AttendancePolicy) => {
    setPolicyForm({
      id: policy.id,
      name: policy.name,
      policy_type: policy.policy_type ?? "grace",
      scope_type: policy.scope_type ?? "company",
      scope_reference: policy.scope_reference ?? "",
      grace_minutes: policy.grace_minutes ?? 0,
      rounding_increment: policy.rounding_increment ?? 0,
      rounding_mode: policy.rounding_mode ?? "nearest",
      penalty_type: policy.penalty_type ?? "",
      penalty_value: policy.penalty_value !== null && policy.penalty_value !== undefined ? String(policy.penalty_value) : "",
      auto_escalate: policy.auto_escalate ?? false,
      escalation_minutes:
        policy.escalation_minutes !== null && policy.escalation_minutes !== undefined ? String(policy.escalation_minutes) : "",
      escalation_channel: policy.escalation_channel ?? "email",
      payroll_action: policy.payroll_action ?? "",
      effective_from: policy.effective_from ?? formatDateByOffset(0),
      effective_to: policy.effective_to ?? "",
      is_active: policy.is_active ?? true,
    })
    setPolicyDialogOpen(true)
  }

  const handlePolicyFormChange = (field: keyof AttendancePolicyForm, value: string | number | boolean) => {
    if (field === "scope_type") {
      const nextScopeType = value as AttendancePolicyForm["scope_type"]
      let defaultReference = ""
      if (nextScopeType === "subsidiary") {
        defaultReference = subsidiaryOptions[0]?.id ?? ""
      } else if (nextScopeType === "department") {
        defaultReference = departmentOptions[0] ?? ""
      } else if (nextScopeType === "team") {
        defaultReference = teamOptions[0] ?? ""
      }

      setPolicyForm((previous) => ({
        ...previous,
        scope_type: nextScopeType,
        scope_reference: defaultReference,
      }))
      return
    }

    setPolicyForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const handleSavePolicy = async () => {
    if (!policyForm.name.trim()) {
      toast({ title: "Policy name required", description: "Provide a name for the attendance policy." })
      return
    }

    if (policyForm.policy_type === "grace" && policyForm.grace_minutes < 0) {
      toast({ title: "Invalid grace minutes", description: "Grace minutes must be zero or positive." })
      return
    }

    setIsSavingPolicy(true)

    try {
      const payload = {
        id: policyForm.id,
        name: policyForm.name.trim(),
        policy_type: policyForm.policy_type,
        scope_type: policyForm.scope_type,
        scope_reference: policyForm.scope_reference || null,
        grace_minutes: Number.isFinite(policyForm.grace_minutes) ? Number(policyForm.grace_minutes) : 0,
        rounding_increment: Number(policyForm.rounding_increment) || 0,
        rounding_mode: policyForm.rounding_mode,
        penalty_type: policyForm.penalty_type || null,
        penalty_value: policyForm.penalty_value ? Number(policyForm.penalty_value) : null,
        auto_escalate: policyForm.auto_escalate,
        escalation_minutes: policyForm.escalation_minutes ? Number(policyForm.escalation_minutes) : null,
        escalation_channel: policyForm.escalation_channel,
        payroll_action: policyForm.payroll_action || null,
        effective_from: policyForm.effective_from || formatDateByOffset(0),
        effective_to: policyForm.effective_to || null,
        is_active: policyForm.is_active,
      }

      const response = await fetch("/api/policies/attendance", {
        method: policyForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to save policy")
      }

      toast({
        title: policyForm.id ? "Policy updated" : "Policy created",
        description: policyForm.id
          ? "Attendance policy updated successfully."
          : "Attendance policy created and ready for automation.",
      })
      setPolicyDialogOpen(false)
      setPolicyForm(createPolicyDefaults())
      loadAttendancePolicies()
    } catch (error) {
      console.error("[attendance] handleSavePolicy error", error)
      toast({
        title: "Unable to save policy",
        description: "There was a problem saving the attendance policy.",
        variant: "destructive",
      })
    } finally {
      setIsSavingPolicy(false)
    }
  }

  const handleTogglePolicyActive = async (policy: AttendancePolicy) => {
    try {
      const response = await fetch("/api/policies/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: policy.id, is_active: !policy.is_active }),
      })

      if (!response.ok) {
        throw new Error("Failed to update policy state")
      }

      toast({
        title: "Policy updated",
        description: `${policy.name} ${policy.is_active ? "disabled" : "activated"}.`,
      })
      loadAttendancePolicies()
    } catch (error) {
      console.error("[attendance] handleTogglePolicyActive error", error)
      toast({
        title: "Unable to update policy",
        description: "We couldn't change the policy state. Try again later.",
        variant: "destructive",
      })
    }
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

  const timesheetSummaries = useMemo(() => {
    const groups = new Map<
      string,
      {
        employeeId: string
        employeeName: string
        records: AttendanceRecord[]
        totalHours: number
        expectedHours: number
        overtimeHours: number
        latenessCount: number
        missingClockIns: number
        missingClockOuts: number
        overnightShifts: number
      }
    >()

    filteredRecords.forEach((record) => {
      const key = record.employeeId
      if (!groups.has(key)) {
        groups.set(key, {
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          records: [],
          totalHours: 0,
          expectedHours: 0,
          overtimeHours: 0,
          latenessCount: 0,
          missingClockIns: 0,
          missingClockOuts: 0,
          overnightShifts: 0,
        })
      }

      const group = groups.get(key)!
      group.records.push(record)
      group.totalHours += record.totalHours
      group.expectedHours += record.expectedHours
      group.overtimeHours += record.overtimeHours

      if (record.status === "late") {
        group.latenessCount += 1
      }

      if (!record.clockIn) {
        group.missingClockIns += 1
      }

      if (!record.clockOut) {
        group.missingClockOuts += 1
      }

      if (record.shift.toLowerCase().includes("night") || (record.clockOut && record.clockIn && record.clockOut < record.clockIn)) {
        group.overnightShifts += 1
      }
    })

    const summaries = Array.from(groups.values()).map((group) => {
      const variance = group.totalHours - group.expectedHours
      const hasMissingPunches = group.missingClockIns > 0 || group.missingClockOuts > 0
      const fatigueRisk = group.overtimeHours > 4 || group.overnightShifts > 2
      const latenessStreak = group.latenessCount >= 3

      const alerts: string[] = []
      if (hasMissingPunches) alerts.push("Missing punches")
      if (latenessStreak) alerts.push("Lateness streak")
      if (fatigueRisk) alerts.push("Fatigue risk")
      if (variance > 4) alerts.push("Significant overtime")
      if (variance < -4) alerts.push("Under hours")

      return {
        ...group,
        variance,
        alerts,
      }
    })

    summaries.sort((a, b) => b.alerts.length - a.alerts.length || b.totalHours - a.totalHours)
    return summaries
  }, [filteredRecords])

  const timesheetExceptions = useMemo(() => {
    return timesheetSummaries
      .flatMap((summary) => {
        const items: {
          employeeId: string
          employeeName: string
          type: string
          severity: "low" | "medium" | "high"
          description: string
        }[] = []

        if (summary.missingClockIns > 0 || summary.missingClockOuts > 0) {
          items.push({
            employeeId: summary.employeeId,
            employeeName: summary.employeeName,
            type: "Missing punches",
            severity: "high",
            description: `${summary.missingClockIns} missing clock-in(s), ${summary.missingClockOuts} missing clock-out(s).`,
          })
        }

        if (summary.latenessCount >= 3) {
          items.push({
            employeeId: summary.employeeId,
            employeeName: summary.employeeName,
            type: "Lateness streak",
            severity: "medium",
            description: `${summary.latenessCount} late arrivals in current range.`,
          })
        }

        if (summary.overtimeHours > 4) {
          items.push({
            employeeId: summary.employeeId,
            employeeName: summary.employeeName,
            type: "Overtime review",
            severity: "medium",
            description: `${summary.overtimeHours.toFixed(1)} overtime hours logged.`,
          })
        }

        if (summary.variance < -4) {
          items.push({
            employeeId: summary.employeeId,
            employeeName: summary.employeeName,
            type: "Under hours",
            severity: "low",
            description: `Variance of ${summary.variance.toFixed(1)} hours below expected.`,
          })
        }

        return items
      })
      .slice(0, 6)
  }, [timesheetSummaries])

  const complianceDevices = useMemo<ComplianceDevice[]>(() => {
    if (!biometricDevices.length) {
      return []
    }

    return biometricDevices.map((device) => {
      const minutesSinceSync = parseLastSyncMinutes(device.lastSync)
      let health: DeviceComplianceHealth = "healthy"

      if (device.status === "offline" || minutesSinceSync > 60) {
        health = "critical"
      } else if (device.status === "syncing" || minutesSinceSync > 15) {
        health = "warning"
      }

      return {
        id: device.id,
        name: device.name,
        provider: device.provider,
        location: device.location,
        status: device.status,
        lastSync: device.lastSync,
        minutesSinceSync,
        health,
      }
    })
  }, [biometricDevices])

  const deviceCompliance = useMemo(() => {
    if (!complianceDevices.length) {
      return {
        uptimePercent: 100,
        healthy: 0,
        warning: 0,
        critical: 0,
        devices: [] as ComplianceDevice[],
      }
    }

    const healthy = complianceDevices.filter((device) => device.health === "healthy").length
    const warning = complianceDevices.filter((device) => device.health === "warning").length
    const critical = complianceDevices.filter((device) => device.health === "critical").length
    const total = complianceDevices.length
    const uptimePercent = total ? Math.max(0, Math.round((healthy / total) * 100)) : 100

    return {
      uptimePercent,
      healthy,
      warning,
      critical,
      devices: complianceDevices,
    }
  }, [complianceDevices])

  const slaBreaches = useMemo(() => {
    return complianceDevices.filter((device) => device.minutesSinceSync > 30 || device.status === "offline")
  }, [complianceDevices])

  useEffect(() => {
    complianceDevices
      .filter((device) => device.health === "critical")
      .forEach((device) => {
        if (offlineAlertedDevicesRef.current.has(device.id)) {
          return
        }
        offlineAlertedDevicesRef.current.add(device.id)
        void sendDeviceAlert(device, { reason: "offline" })
      })
  }, [complianceDevices, sendDeviceAlert])

  const geoCompliance = useMemo(() => {
    const mobileRecords = attendanceRecords.filter(
      (record) => record.method === "mobile" || record.workingArrangement !== "onsite",
    )
    const withLocation = mobileRecords.filter((record) => Boolean(record.location))
    const withoutLocation = mobileRecords.filter((record) => !record.location)

    const locationBuckets = new Map<string, AttendanceRecord[]>()
    mobileRecords.forEach((record) => {
      const key = `${record.date}-${record.location || "unknown"}`
      const bucket = locationBuckets.get(key) ?? []
      bucket.push(record)
      locationBuckets.set(key, bucket)
    })

    const duplicateGroups = Array.from(locationBuckets.values()).filter(
      (group) => group.length >= 4 && group[0].location && group[0].location !== "Unknown",
    )

    const anomalies: GeoAnomaly[] = []
    withoutLocation.slice(0, 6).forEach((record) => {
      anomalies.push({
        id: `${record.id}-missing-location`,
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        reason: "Missing location",
        detail: `${record.employeeName} • ${record.method.toUpperCase()} check-in on ${record.date} lacks geo tag.`,
      })
    })

    duplicateGroups.slice(0, 6).forEach((group, index) => {
      const sample = group[0]
      anomalies.push({
        id: `${sample.id}-dup-${index}`,
        employeeId: sample.employeeId,
        employeeName: sample.employeeName,
        reason: "Repeated coordinates",
        detail: `${group.length} mobile check-ins at ${sample.location} on ${sample.date}.`,
      })
    })

    const rate = mobileRecords.length ? (withLocation.length / mobileRecords.length) * 100 : 100

    return {
      totalMobile: mobileRecords.length,
      complianceRate: Math.max(0, Math.min(100, rate)),
      missingCount: withoutLocation.length,
      duplicateHotspots: duplicateGroups.length,
      anomalies,
    }
  }, [attendanceRecords])

  const tamperAlerts = useMemo(() => {
    const alerts: { id: string; title: string; description: string; severity: "medium" | "high" }[] = []

    complianceDevices
      .filter((device) => device.health === "critical")
      .slice(0, 4)
      .forEach((device) => {
        alerts.push({
          id: `${device.id}-critical`,
          title: `${device.name} offline`,
          description: `${device.location || "Unknown location"} • Last sync ${device.lastSync || "n/a"}`,
          severity: "high",
        })
      })

    geoCompliance.anomalies.slice(0, 4).forEach((anomaly) => {
      alerts.push({
        id: `${anomaly.id}-geo`,
        title: anomaly.reason,
        description: anomaly.detail,
        severity: anomaly.reason === "Missing location" ? "medium" : "high",
      })
    })

    return alerts
  }, [complianceDevices, geoCompliance])

  const policyAppliedLookup = useMemo(() => {
    const result = new Map<string, AttendancePolicy>()

    filteredRecords.forEach((record) => {
      const matching = policies.find((policy) => {
        if (!policy.is_active) {
          return false
        }
        return policy.policy_type === "grace" && policy.grace_minutes && record.status === "late"
      })

      if (matching) {
        result.set(record.id, matching)
      }
    })

    return result
  }, [filteredRecords, policies])

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">AI-Driven Time & Attendance</h1>
          <p className="text-sm text-slate-600">
            Unified attendance insights across locations, predictive risk detection, and automated compliance controls.
          </p>
          {isDemoData && (
            <p className="mt-1 flex items-center gap-2 text-xs text-amber-600">
              <Sparkles className="h-3 w-3" />
              Sample records shown while real attendance data is unavailable.
            </p>
          )}
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="shifts">Shift Management</TabsTrigger>
          <TabsTrigger value="overtime">Overtime</TabsTrigger>
          <TabsTrigger value="devices">Integrations</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
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
                {loadError && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    {loadError}
                  </div>
                )}
                <div className="flex flex-col gap-4 xl:flex-row">
                  <div className="flex-1 space-y-4">
                    {isLoadingData && !attendanceRecords.length ? (
                      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-slate-500">
                        Loading attendance records...
                      </div>
                    ) : (
                      <>
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
                                  <div className="flex items-center gap-2">
                                    {policyAppliedLookup.has(record.id) && (
                                      <span className="text-[11px] text-emerald-600">
                                        Policy applied: {policyAppliedLookup.get(record.id)?.name ?? "Grace period"} (grace{" "}
                                        {policyAppliedLookup.get(record.id)?.grace_minutes ?? 0} min)
                                      </span>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-3 text-xs"
                                      onClick={() => handleRunPolicies(record.id)}
                                      disabled={runningPolicyFor === record.id}
                                    >
                                      {runningPolicyFor === record.id ? "Running…" : "Run policies"}
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
                      </>
                    )}
                  </div>
                <div className="w-full space-y-4 xl:w-80">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Timer className="h-4 w-4 text-emerald-500" /> Timesheet snapshot
                        </CardTitle>
                        <CardDescription>Top variance and anomaly for the current filters.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs text-slate-600">
                        {timesheetSummaries.length ? (
                          <>
                            <div className="flex items-center justify-between text-slate-500">
                              <span className="font-semibold text-slate-900">{timesheetSummaries[0].employeeName}</span>
                              <Badge variant="secondary" className={timesheetSummaries[0].variance >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                                {timesheetSummaries[0].variance >= 0 ? "+" : ""}
                                {timesheetSummaries[0].variance.toFixed(1)}h
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Total {timesheetSummaries[0].totalHours.toFixed(1)}h</span>
                              <span>OT {timesheetSummaries[0].overtimeHours.toFixed(1)}h</span>
                            </div>
                            {timesheetSummaries[0].alerts.length ? (
                              <div className="flex flex-wrap gap-1">
                                {timesheetSummaries[0].alerts.map((alert) => (
                                  <Badge key={alert} variant="secondary" className="bg-rose-50 text-rose-700">
                                    {alert}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500">No anomalies detected.</p>
                            )}
                            <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("insights")}>
                              View full timesheet insights
                            </Button>
                          </>
                        ) : (
                          <p className="text-xs text-slate-500">Collect attendance to unlock timesheet analytics.</p>
                        )}
                      </CardContent>
                    </Card>
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
              <Card className="border border-emerald-100">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base text-emerald-700">
                    <Timer className="h-4 w-4" /> Timesheet intelligence
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Highlighted variances, fatigue risks, and missing punches for the selected range.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {timesheetSummaries.slice(0, 5).map((summary) => (
                    <div key={summary.employeeId} className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-700">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-emerald-900">{summary.employeeName}</span>
                        <Badge variant="secondary" className={summary.variance >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                          {summary.variance >= 0 ? "+" : ""}
                          {summary.variance.toFixed(1)}h
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-emerald-600">
                        <span>Total {summary.totalHours.toFixed(1)}h</span>
                        <span>OT {summary.overtimeHours.toFixed(1)}h</span>
                      </div>
                      {summary.alerts.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {summary.alerts.map((alert) => (
                            <Badge key={alert} variant="secondary" className="bg-emerald-100 text-emerald-700">
                              {alert}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] text-emerald-600">No anomalies detected.</p>
                      )}
                    </div>
                  ))}
                  {!timesheetSummaries.length && (
                    <p className="text-xs text-slate-500">Collect attendance to unlock timesheet analytics.</p>
                  )}
                </CardContent>
              </Card>
              <Card className="border border-amber-100">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base text-amber-700">
                    <BellRing className="h-4 w-4" /> Exceptions watchlist
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    The top anomalies flagged for supervisor review.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {timesheetExceptions.map((item) => (
                    <div key={`${item.employeeId}-${item.type}`} className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-900">{item.employeeName}</span>
                        <Badge
                          variant="secondary"
                          className={
                            item.severity === "high"
                              ? "bg-rose-100 text-rose-700"
                              : item.severity === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-700"
                          }
                        >
                          {item.type}
                        </Badge>
                      </div>
                      <p className="mt-2 text-[11px] text-amber-700">{item.description}</p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          onClick={() => toast({ title: "Follow-up queued", description: `Reminder sent to ${item.employeeName}.` })}
                        >
                          Nudge employee
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => toast({ title: "Marked for payroll review", description: `${item.type} forwarded to payroll.` })}
                        >
                          Route to payroll
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!timesheetExceptions.length && (
                    <p className="text-xs text-slate-500">No exceptions detected for the current filters.</p>
                  )}
                </CardContent>
              </Card>
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

          <TabsContent value="compliance" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-emerald-100">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <ShieldCheck className="h-4 w-4" /> Device uptime
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Healthy devices {deviceCompliance.healthy}/{deviceCompliance.devices.length}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-emerald-700">{deviceCompliance.uptimePercent}%</span>
                    <span className="text-xs uppercase text-slate-500">uptime</span>
                  </div>
                  <Progress value={deviceCompliance.uptimePercent} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Warning {deviceCompliance.warning}</span>
                    <span>Critical {deviceCompliance.critical}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-100">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-700">
                    <Activity className="h-4 w-4" /> Sync latency & SLA
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    SLA breach if sync exceeds 30 minutes • {slaBreaches.length} device{slaBreaches.length === 1 ? "" : "s"} at risk
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-slate-600">
                  {deviceCompliance.devices.slice(0, 4).map((device) => {
                    const breach = device.minutesSinceSync > 30 || device.status === "offline"
                    return (
                      <div
                        key={device.id}
                        className={cn(
                          "flex flex-col gap-1 rounded border px-3 py-2",
                          breach ? "border-rose-200 bg-rose-50" : "border-amber-100 bg-amber-50",
                        )}
                      >
                        <div className="flex items-center justify-between text-[13px] font-medium text-slate-900">
                          <span>{device.name}</span>
                          <span className={breach ? "text-rose-700" : "text-amber-700"}>
                            {device.minutesSinceSync >= 999 ? ">999" : device.minutesSinceSync}m
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
                          <span>{device.location || "Unknown site"}</span>
                          <span>{device.status.toUpperCase()}</span>
                        </div>
                        {breach && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 self-start text-[11px]"
                            onClick={() => handleEscalateDevice(device)}
                          >
                            Escalate via comms
                          </Button>
                        )}
                      </div>
                    )
                  })}
                  {!deviceCompliance.devices.length && <p>No devices connected.</p>}
                </CardContent>
              </Card>
              <Card className="border-sky-100">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-sky-700">
                    <Globe className="h-4 w-4" /> Geo compliance
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Remote/mobile records {geoCompliance.totalMobile}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-sky-700">{geoCompliance.complianceRate.toFixed(1)}%</span>
                    <span className="text-xs uppercase text-slate-500">geo tagged</span>
                  </div>
                  <Progress value={geoCompliance.complianceRate} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Missing {geoCompliance.missingCount}</span>
                    <span>Hotspots {geoCompliance.duplicateHotspots}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-rose-100">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-rose-700">
                    <AlertTriangle className="h-4 w-4" /> Tamper alerts
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    {tamperAlerts.length ? `${tamperAlerts.length} open` : "No alerts detected"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-slate-600">
                  {tamperAlerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="rounded border border-rose-100 bg-rose-50 px-3 py-2">
                      <p className="font-medium text-rose-800">{alert.title}</p>
                      <p className="text-[11px] text-rose-700">{alert.description}</p>
                    </div>
                  ))}
                  {!tamperAlerts.length && <p>No tamper alerts at the moment.</p>}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <Radar className="h-5 w-5 text-emerald-500" /> Device health feed
                  </CardTitle>
                  <CardDescription>Real-time insight into biometric device connectivity.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  {deviceCompliance.devices.slice(0, 6).map((device) => (
                    <div
                      key={device.id}
                      className={cn(
                        "flex flex-col rounded border bg-white p-3 shadow-sm",
                        device.health === "critical"
                          ? "border-rose-200"
                          : device.health === "warning"
                            ? "border-amber-200"
                            : "border-slate-200",
                      )}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-900">{device.name}</span>
                        <Badge
                          className={
                            device.health === "healthy"
                              ? "bg-emerald-100 text-emerald-700"
                              : device.health === "warning"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                          }
                        >
                          {device.health.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                        <span>{device.location || "Unknown location"}</span>
                        <span>{device.lastSync}</span>
                      </div>
                      {(device.health === "warning" || device.health === "critical") && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px]"
                            onClick={() => handleEscalateDevice(device)}
                          >
                            Escalate issue
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[11px] text-slate-600 hover:bg-slate-100"
                            onClick={() =>
                              toast({
                                title: "Maintenance task logged",
                                description: `${device.name} added to the device maintenance queue.`,
                              })
                            }
                          >
                            Log maintenance
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {!deviceCompliance.devices.length && <p>No devices to display.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <MapPin className="h-5 w-5 text-sky-500" /> Geo anomalies
                  </CardTitle>
                  <CardDescription>Flagged mobile check-ins requiring manual verification.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  {geoCompliance.anomalies.length ? (
                    geoCompliance.anomalies.slice(0, 6).map((anomaly) => (
                      <div key={anomaly.id} className="flex flex-col rounded border border-slate-200 bg-white p-3 shadow-sm">
                        <span className="font-semibold text-slate-900">{anomaly.employeeName}</span>
                        <span className="text-xs uppercase text-slate-500">{anomaly.reason}</span>
                        <p className="text-xs text-slate-600">{anomaly.detail}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 h-8 px-3 text-xs"
                          onClick={() =>
                            toast({
                              title: "Compliance review queued",
                              description: `${anomaly.employeeName} anomaly forwarded to compliance desk.`,
                            })
                          }
                        >
                          Escalate
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No geo anomalies detected.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Globe className="h-5 w-5 text-emerald-500" /> Geo-fence heatmap
                </CardTitle>
                <CardDescription>
                  Live density of mobile check-ins across Ghana. Sized by activity, coloured by proximity to SLA breaches.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="relative h-72 overflow-hidden rounded-xl border border-emerald-100 bg-[radial-gradient(circle_at_center,_#ecfdf5,_#e0f2fe)]">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.05),_transparent_60%)]" />
                  <div className="pointer-events-none absolute inset-4 rounded-lg border border-white/40" />
                  {geoHeatmap.points.length ? (
                    geoHeatmap.points.map((point) => (
                      <div
                        key={point.id}
                        className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-semibold text-white shadow-lg ring-2 ring-emerald-50"
                        style={{
                          left: `${point.leftPercent}%`,
                          top: `${point.topPercent}%`,
                          width: point.size,
                          height: point.size,
                          background:
                            point.count > 6
                              ? "rgba(239, 68, 68, 0.8)"
                              : point.count > 3
                                ? "rgba(250, 204, 21, 0.8)"
                                : "rgba(16, 185, 129, 0.8)",
                        }}
                        title={`${point.location} • ${point.count} check-ins`}
                      >
                        {point.count}
                      </div>
                    ))
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-emerald-700">
                      No geo-tagged check-ins yet. Mobile events will appear here.
                    </div>
                  )}
                  <div className="pointer-events-none absolute bottom-3 left-3 flex gap-2 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/80 px-2 py-0.5 text-white">
                      <span className="h-2 w-2 rounded-full bg-white" /> Healthy density
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-amber-400/80 px-2 py-0.5 text-white">
                      <span className="h-2 w-2 rounded-full bg-white" /> Watchlist
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-rose-500/80 px-2 py-0.5 text-white">
                      <span className="h-2 w-2 rounded-full bg-white" /> Escalate now
                    </span>
                  </div>
                </div>
                <div className="space-y-4 text-sm text-slate-600">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {geoHeatmap.total} geo-tagged events monitored
                    </p>
                    <p className="text-xs text-slate-500">
                      Top hotspots ordered by activity. Use this to validate geo-fence coverage and spot potential spoofing.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {geoHeatmap.points.slice(0, 5).map((point) => (
                      <div key={point.id} className="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{point.location}</p>
                          <p className="text-[11px] text-slate-500">Last seen {point.latestDate}</p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700">{point.count} logs</Badge>
                      </div>
                    ))}
                    {!geoHeatmap.points.length && (
                      <p className="text-xs text-slate-500">
                        Encourage remote teams to enable geo tagging to populate this heatmap.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportGeoHeatmap}>
                      <Download className="mr-2 h-4 w-4" /> Export heatmap snapshot
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() =>
                        toast({
                          title: "GIS sync pending",
                          description: "Heatmap queued for the enterprise GIS workspace.",
                        })
                      }
                    >
                      Sync to GIS workspace
                    </Button>
                  </div>
                </div>
                </CardContent>
              </Card>
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
                      <Label>Delivery channel</Label>
                      <Select
                        value={alertSettings.deliveryChannel}
                        onValueChange={(value) =>
                          setAlertSettings((previous) => ({
                            ...previous,
                            deliveryChannel: value as AlertSettings["deliveryChannel"],
                          }))
                        }
                      >
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
                  <div>
                    <Label>Communication stream</Label>
                    {communicationChannels.length > 0 ? (
                      <Select
                        value={alertSettings.communicationChannelId ?? ""}
                        onValueChange={(value) =>
                          setAlertSettings((previous) => ({
                            ...previous,
                            communicationChannelId: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                        <SelectContent>
                          {communicationChannels.map((channel) => (
                            <SelectItem key={channel.id} value={channel.id}>
                              {channel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Communication service unavailable. Alerts will default to {defaultCommunicationChannelId}.
                      </p>
                    )}
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <ShieldCheck className="h-5 w-5 text-emerald-500" /> Attendance policy automation
              </CardTitle>
              <CardDescription>Grace periods, rounding, and penalties applied automatically.</CardDescription>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handleOpenNewPolicyDialog}>
                  <Plus className="mr-2 h-4 w-4" /> New policy
                </Button>
                <Button size="sm" variant="outline" onClick={loadAttendancePolicies}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              {isLoadingPolicies ? (
                <p className="text-xs text-slate-500">Loading attendance policies…</p>
              ) : policies.length ? (
                policies.map((policy) => (
                  <div
                    key={policy.id}
                    className="flex flex-col gap-2 rounded border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{policy.name}</p>
                      <p className="text-xs text-slate-500">
                        {policy.policy_type === "grace"
                          ? `Grace period ${policy.grace_minutes ?? 0} min`
                          : policy.policy_type.replace(/^\w/, (char) => char.toUpperCase())}
                        {" • "}
                        Scope {policy.scope_type}
                      </p>
                      {policy.penalty_type && (
                        <p className="text-xs text-rose-600">
                          Penalty: {policy.penalty_type}
                          {policy.penalty_value ? ` (${policy.penalty_value})` : ""}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        {policy.effective_from} — {policy.effective_to ?? "No end date"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={policy.is_active}
                        onCheckedChange={() => handleTogglePolicyActive(policy)}
                        aria-label="Toggle policy activation"
                      />
                      <Button size="sm" variant="outline" onClick={() => handleEditPolicy(policy)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No automation policies defined yet.</p>
              )}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <Download className="h-5 w-5 text-emerald-500" /> Timesheet automations
              </CardTitle>
              <CardDescription>Export payroll-ready timesheets or push variances into payroll review.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 rounded border border-slate-200 p-4">
                    <p className="text-sm font-medium text-slate-800">Weekly CSV export</p>
                    <p className="text-xs text-slate-500">Compile timesheet CSV filtered by current date range and filters.</p>
                    <Button onClick={() => handleExport("Timesheet CSV")} className="w-full">
                      <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                  </div>
                  <div className="space-y-2 rounded border border-slate-200 p-4">
                    <p className="text-sm font-medium text-slate-800">Sync to payroll</p>
                    <p className="text-xs text-slate-500">Push approved hours and overtime variances into payroll staging.</p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        toast({
                          title: "Payroll sync queued",
                          description: "Timesheet variances handed over to payroll review workspace.",
                        })
                      }
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> Queue sync
                    </Button>
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
          <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{policyForm.id ? "Edit attendance policy" : "New attendance policy"}</DialogTitle>
                <DialogDescription>Configure grace periods, rounding, and penalty automation for attendance.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="policy-name">Policy name</Label>
                    <Input
                      id="policy-name"
                      value={policyForm.name}
                      onChange={(event) => handlePolicyFormChange("name", event.target.value)}
                      placeholder="e.g., Morning shift grace"
                    />
                  </div>
                  <div>
                    <Label>Policy type</Label>
                    <Select value={policyForm.policy_type} onValueChange={(value) => handlePolicyFormChange("policy_type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grace">Grace period</SelectItem>
                        <SelectItem value="rounding">Rounding</SelectItem>
                        <SelectItem value="penalty">Penalty</SelectItem>
                        <SelectItem value="payroll">Payroll sync</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Scope</Label>
                    <Select value={policyForm.scope_type} onValueChange={(value) => handlePolicyFormChange("scope_type", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">Company-wide</SelectItem>
                        <SelectItem value="subsidiary">Subsidiary</SelectItem>
                        <SelectItem value="department">Department</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="policy-scope-reference">
                      {policyForm.scope_type === "company" ? "Scope reference (not required)" : "Scope reference"}
                    </Label>
                    {policyForm.scope_type === "company" ? (
                      <Input id="policy-scope-reference" value="Company-wide" disabled />
                    ) : scopeReferenceOptions.length > 0 ? (
                      <Select
                        value={policyForm.scope_reference}
                        onValueChange={(value) => handlePolicyFormChange("scope_reference", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                        <SelectContent>
                          {scopeReferenceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="policy-scope-reference"
                        value={policyForm.scope_reference}
                        onChange={(event) => handlePolicyFormChange("scope_reference", event.target.value)}
                        placeholder={
                          policyForm.scope_type === "department"
                            ? "Type department identifier"
                            : policyForm.scope_type === "team"
                              ? "Type team identifier"
                              : "Enter scope reference"
                        }
                      />
                    )}
                    {policyForm.scope_type === "subsidiary" && scopeReferenceOptions.length === 0 && (
                      <p className="mt-1 text-xs text-slate-500">Add subsidiaries in company settings to target them here.</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="policy-grace-minutes">Grace minutes</Label>
                    <Input
                      id="policy-grace-minutes"
                      type="number"
                      min={0}
                      value={policyForm.grace_minutes}
                      onChange={(event) => handlePolicyFormChange("grace_minutes", Number(event.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="policy-rounding-increment">Rounding increment (minutes)</Label>
                    <Input
                      id="policy-rounding-increment"
                      type="number"
                      min={0}
                      value={policyForm.rounding_increment}
                      onChange={(event) => handlePolicyFormChange("rounding_increment", Number(event.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Rounding mode</Label>
                    <Select value={policyForm.rounding_mode} onValueChange={(value) => handlePolicyFormChange("rounding_mode", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nearest">Nearest</SelectItem>
                        <SelectItem value="up">Round up</SelectItem>
                        <SelectItem value="down">Round down</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="policy-penalty-type">Penalty type</Label>
                    <Input
                      id="policy-penalty-type"
                      value={policyForm.penalty_type}
                      onChange={(event) => handlePolicyFormChange("penalty_type", event.target.value)}
                      placeholder="e.g., Points"
                    />
                  </div>
                  <div>
                    <Label htmlFor="policy-penalty-value">Penalty value</Label>
                    <Input
                      id="policy-penalty-value"
                      value={policyForm.penalty_value}
                      onChange={(event) => handlePolicyFormChange("penalty_value", event.target.value)}
                      placeholder="Optional numeric value"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between rounded border p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">Auto escalate</p>
                      <p className="text-xs text-slate-500">Notify managers when the policy triggers.</p>
                    </div>
                    <Switch
                      checked={policyForm.auto_escalate}
                      onCheckedChange={(checked) => handlePolicyFormChange("auto_escalate", checked)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="policy-escalation-minutes">Escalation minutes</Label>
                    <Input
                      id="policy-escalation-minutes"
                      type="number"
                      min={0}
                      value={policyForm.escalation_minutes}
                      onChange={(event) => handlePolicyFormChange("escalation_minutes", event.target.value)}
                      placeholder="e.g., 30"
                    />
                    <Label>Escalation channel</Label>
                    <Select
                      value={policyForm.escalation_channel}
                      onValueChange={(value) => handlePolicyFormChange("escalation_channel", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="push">Push</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="policy-payroll-action">Payroll action</Label>
                    <Input
                      id="policy-payroll-action"
                      value={policyForm.payroll_action}
                      onChange={(event) => handlePolicyFormChange("payroll_action", event.target.value)}
                      placeholder="e.g., Deduct half-day"
                    />
                  </div>
                  <div className="flex items-center gap-3 rounded border p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">Policy active</p>
                      <p className="text-xs text-slate-500">Disable to pause the automation.</p>
                    </div>
                    <Switch
                      checked={policyForm.is_active}
                      onCheckedChange={(checked) => handlePolicyFormChange("is_active", checked)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="policy-effective-from">Effective from</Label>
                    <Input
                      id="policy-effective-from"
                      type="date"
                      value={policyForm.effective_from}
                      onChange={(event) => handlePolicyFormChange("effective_from", event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="policy-effective-to">Effective to (optional)</Label>
                    <Input
                      id="policy-effective-to"
                      type="date"
                      value={policyForm.effective_to}
                      onChange={(event) => handlePolicyFormChange("effective_to", event.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPolicyDialogOpen(false)} disabled={isSavingPolicy}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePolicy} disabled={isSavingPolicy}>
                    {isSavingPolicy ? "Saving..." : "Save policy"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
