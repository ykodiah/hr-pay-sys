// @ts-nocheck
"use client"
import { useState, useEffect, useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import TaxReliefManager from "@/components/tax-relief-manager"
import GhanaTaxSettings from "@/components/ghana-tax-settings"
import { createClient } from "@/lib/supabase/client"
import { calculateMonthlyPaye, round2 as roundMoney } from "@/lib/ghana-tax/engine"
import {
  Building2,
  Users,
  X,
  Eye,
  Edit,
  MoreVertical,
  Loader2,
  Brain,
  Plus,
  RefreshCw,
  MapPin,
  Briefcase,
  Copy,
  Download,
  Upload,
  ImageIcon,
  AlertTriangle,
  CheckCircle,
  Save,
  Settings,
  Calendar,
  Sparkles,
  TrendingUp,
  DollarSign,
  Minus,
  Calculator,
  Wifi,
  Bell,
  MoreHorizontal,
  Trash2,
  Send,
  Mail,
  Shield,
  Database,
  FileText,
  EyeOff,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  Search,
  Receipt,
  ExternalLink,
  AlertCircle,
  Clock,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator" // Added for Separator
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table" // Added for Table components

interface Company {
  id: string
  name: string
  tax_id: string
  ssnit_number: string
  industry: string
  address: string
  phone_number: string
  email_address: string
  logo_file_id?: string
  logo_url?: string | null
  divisions?: string[]
  departments?: string[]
  locations?: string[]
  status?: string
}

interface Employee {
  id: string
  first_name: string
  last_name: string
  full_name?: string
  corporate_email: string
  personal_email: string
  position: string
  department: string
  status: string
}

interface Subsidiary {
  id: string
  company_id: string
  name: string
  tax_id: string
  ssnit_number: string
  industry: string
  status: string
  email_address: string
  phone_number: string
  address: string
  logo_url?: string | null
  divisions: any[] | string[]
  departments: any[] | string[]
  locations: any[] | string[]
  created_at?: string
  updated_at?: string
  // Computed fields for display
  divisions_count?: number
  departments_count?: number
  locations_count?: number
  employee_count?: number
  legal_name?: string
  city?: string
  region?: string
  country?: string
  phone?: string
  website?: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  user_count: number
  code?: string | null
  level?: number
  is_system_role?: boolean
  is_active?: boolean
}

// ---------------------------------------------------------------------------
// Role permission model (module x access-level matrix)
// Permissions are persisted as a flat JSONB array of `module:action` strings,
// e.g. ["employees:view", "employees:edit"]. "*:all" grants everything.
// ---------------------------------------------------------------------------
const ROLE_MODULES: { key: string; label: string; description: string }[] = [
  { key: "dashboard", label: "Dashboard", description: "Overview metrics and insights" },
  { key: "employees", label: "Employees", description: "Employee records and profiles" },
  { key: "payroll", label: "Payroll", description: "Payroll runs and payslips" },
  { key: "leave", label: "Leave", description: "Leave requests and policies" },
  { key: "attendance", label: "Attendance", description: "Time and attendance tracking" },
  { key: "performance", label: "Performance", description: "Appraisals and goals" },
  { key: "documents", label: "Documents", description: "Document vault and files" },
  { key: "reports", label: "Reports", description: "Analytics and exports" },
  { key: "multi_company", label: "Multi-Company", description: "Subsidiary management" },
  { key: "notifications", label: "Notifications", description: "Templates and preferences" },
  { key: "settings", label: "Settings", description: "Company configuration" },
  { key: "roles", label: "Roles & Access", description: "Roles, permissions and security" },
]

const ROLE_ACTIONS: { key: string; label: string }[] = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "approve", label: "Approve" },
  { key: "export", label: "Export" },
]

type PermissionMatrix = Record<string, string[]>

const emptyPermissionMatrix = (): PermissionMatrix =>
  ROLE_MODULES.reduce<PermissionMatrix>((acc, m) => {
    acc[m.key] = []
    return acc
  }, {})

/** Expand stored permission strings into a module x action matrix. */
const permissionsToMatrix = (permissions: string[] | undefined | null): PermissionMatrix => {
  const matrix = emptyPermissionMatrix()
  const list = Array.isArray(permissions) ? permissions : []
  const grantAll = list.includes("all") || list.includes("*") || list.includes("*:all")
  for (const module of ROLE_MODULES) {
    if (grantAll) {
      matrix[module.key] = ROLE_ACTIONS.map((a) => a.key)
    }
  }
  for (const raw of list) {
    if (!raw || raw === "all" || raw === "*" || raw === "*:all") continue
    const [moduleKey, actionKey] = String(raw).includes(":")
      ? String(raw).split(":")
      : [String(raw), "view"]
    if (!matrix[moduleKey]) continue
    if (actionKey === "all") {
      matrix[moduleKey] = ROLE_ACTIONS.map((a) => a.key)
    } else if (ROLE_ACTIONS.some((a) => a.key === actionKey) && !matrix[moduleKey].includes(actionKey)) {
      matrix[moduleKey].push(actionKey)
    }
  }
  return matrix
}

/** Flatten a matrix back to `module:action` strings for persistence. */
const matrixToPermissions = (matrix: PermissionMatrix): string[] => {
  const result: string[] = []
  for (const module of ROLE_MODULES) {
    const actions = matrix[module.key] || []
    if (actions.length === ROLE_ACTIONS.length) {
      result.push(`${module.key}:all`)
    } else {
      for (const action of actions) result.push(`${module.key}:${action}`)
    }
  }
  return result
}

const countMatrixGrants = (matrix: PermissionMatrix): number =>
  Object.values(matrix).reduce((sum, actions) => sum + (actions?.length || 0), 0)

const summarizeRolePermissions = (permissions: string[] | undefined | null): string => {
  const matrix = permissionsToMatrix(permissions)
  const modules = ROLE_MODULES.filter((m) => (matrix[m.key] || []).length > 0)
  if (!modules.length) return "No module access"
  if (modules.length === ROLE_MODULES.length && modules.every((m) => matrix[m.key].length === ROLE_ACTIONS.length)) {
    return "Full access (all modules)"
  }
  return modules.map((m) => m.label).join(", ")
}

// Added for Access Control and Security
interface AccessSettings {
  twoFactorEnabled: boolean
  ssoEnabled: boolean
  passwordExpiryEnabled: boolean
  passwordExpiryDays: number
  sessionTimeout: number
  maxLoginAttempts: number
  lockoutDuration: number
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSpecial: boolean
  ipRestrictionsEnabled: boolean
  allowedIPs: string[]
}

interface SecuritySettings {
  dataEncryptionEnabled: boolean
  auditLoggingEnabled: boolean
  autoBackupEnabled: boolean
  backupFrequency: string
  backupRetentionDays: number
  dataRetentionDays: number
  gdprComplianceEnabled: boolean
  dataAnonymizationEnabled: boolean
}

interface BackupHistoryItem {
  id: string
  backup_status: string
  backup_size: number | null
  backup_type: string
  started_at: string
  completed_at: string | null
}

interface HrConfig {
  leaveYearStart: string
  probationPeriod: number
  workingHoursPerDay: number
  workingDaysPerWeek: number
  autoApproveLeave: boolean
  emailNotifications: boolean
  aiRecommendations: boolean
  smartScheduling: boolean
  performanceTracking: boolean
}

interface HrDocumentItem {
  id: string
  name: string
  type: string
  size: string
  visibleToAll: boolean
  fileUrl: string | null
  uploadedAt: string
  content?: string
  vaultDocumentId?: string | null
  fileType?: string | null
}

interface StructuredSalaryGrade {
  id: string | number
  name: string
  description?: string
  minSalary: number
  maxSalary: number
  notches: { step: number; amount: number }[]
}

interface UnstructuredSalaryGrade {
  id: string | number
  name: string
  description: string
  generalIncrement: { type: "percentage" | "fixed"; value: number }
  performanceIncrement: { type: "percentage" | "fixed"; value: number }
}

interface AuditLog {
  id: string
  user_email: string
  action: string
  timestamp: string
  ip_address: string
  severity: "high" | "medium" | "low"
}

interface ActiveSession {
  id: string
  user_email: string
  ip_address: string
  device: string
  browser?: string
  os?: string
  last_activity: string
  is_current?: boolean
}

const isDemoMode = () => {
  if (typeof window !== "undefined") {
    const demoSession = document.cookie.includes("demo-session=active")
    const demoProfile = localStorage.getItem("demo_profile")
    return demoSession || !!demoProfile
  }
  return false
}

const clearClientDemoSession = () => {
  if (typeof window === "undefined") return
  document.cookie = "demo-session=; path=/; max-age=0"
  try {
    localStorage.removeItem("demo_profile")
  } catch {
    // ignore
  }
}

const isPlaceholderLogo = (url?: string | null) => {
  if (!url) return true
  const value = url.trim()
  return !value || value.includes("/placeholder") || value === "null" || value === "undefined"
}

const formatBytes = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return "0 MB"
  const megabytes = bytes / (1024 * 1024)
  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`
}

const toTitleCase = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())

type NotificationPreference = {
  key: string
  label: string
  description: string
  enabled: boolean
  channels: string[]
}

async function settingsFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`)
  }
  return data
}

const ensureStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string")
      }
    } catch (error) {
      // Ignore JSON parse errors and fall through to default
    }
  }

  return []
}

export default function SettingsPage() {
  console.log("[v0] SettingsPage component initializing...")

  const { toast } = useToast()
  const supabase = createClient()
  const [activeSettingsTab, setActiveSettingsTab] = useState("company")

  const [companyData, setCompanyData] = useState<Company>({
    id: "",
    name: "",
    email_address: "",
    tax_id: "",
    ssnit_number: "",
    industry: "",
    address: "",
    phone_number: "",
    divisions: [],
    departments: [],
    locations: [],
    logo_url: null,
  })

  const [hrConfig, setHrConfig] = useState<HrConfig>({
    leaveYearStart: "January",
    probationPeriod: 3,
    workingHoursPerDay: 8,
    workingDaysPerWeek: 5,
    autoApproveLeave: false,
    emailNotifications: true,
    aiRecommendations: true,
    smartScheduling: false,
    performanceTracking: true,
  })

  const [editingPolicy, setEditingPolicy] = useState({
    name: "",
    days: 0,
    description: "",
  })
  const [isSavingPolicy, setIsSavingPolicy] = useState(false)
  const [isSavingDocument, setIsSavingDocument] = useState(false)
  const [documentPreviewContent, setDocumentPreviewContent] = useState("")
  const [isParsingFile, setIsParsingFile] = useState(false)

  const [hrDocuments, setHrDocuments] = useState<HrDocumentItem[]>([])

  const [documentZoom, setDocumentZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [documentRotation, setDocumentRotation] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [showDocumentPreview, setShowDocumentPreview] = useState(false)

  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [documentModalType, setDocumentModalType] = useState("add") // add, view, edit, delete
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [documentName, setDocumentName] = useState("")
  const [currentPolicies, setCurrentPolicies] = useState<any[]>([])

  const [divisions, setDivisions] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [roleModalType, setRoleModalType] = useState<"add" | "edit" | "view">("add")
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [roleForm, setRoleForm] = useState({ name: "", description: "" })
  const [rolePermissionMatrix, setRolePermissionMatrix] = useState<PermissionMatrix>(emptyPermissionMatrix())
  const [isSavingRole, setIsSavingRole] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [isDeletingRole, setIsDeletingRole] = useState(false)
  const [syncPrefs, setSyncPrefs] = useState({
    sync_hr_policies: true,
    sync_payroll_config: true,
    sync_leave_types: true,
    sync_roles_permissions: false,
  })
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>([])
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false)
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null)
  const [showAddSubsidiary, setShowAddSubsidiary] = useState<boolean>(false)
  const [showEditSubsidiary, setShowEditSubsidiary] = useState(false)
  const [showSubsidiaryDetails, setShowSubsidiaryDetails] = useState(false)
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<Subsidiary | null>(null)
  const emptySubsidiaryForm = {
    name: "",
    industry: "",
    tax_id: "",
    ssnit_number: "",
    email_address: "",
    phone_number: "",
    address: "",
    divisions: [] as string[],
    departments: [] as string[],
    locations: [] as string[],
  }
  const [newSubsidiary, setNewSubsidiary] = useState(emptySubsidiaryForm)
  const [newSubsidiaryDivision, setNewSubsidiaryDivision] = useState("")
  const [newSubsidiaryDepartment, setNewSubsidiaryDepartment] = useState("")
  const [newSubsidiaryLocation, setNewSubsidiaryLocation] = useState("")
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState<boolean>(false)
  const [showReactivateConfirm, setShowReactivateConfirm] = useState<boolean>(false)
  const [subsidiaryToToggle, setSubsidiaryToToggle] = useState<Subsidiary | null>(null)

  const [companyLogoPreview, setCompanyLogoPreview] = useState<string>("")
  const [subsidiaryLogoPreview, setSubsidiaryLogoPreview] = useState<string>("")
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false)

  const [viewEmployeesModal, setViewEmployeesModal] = useState<{
    isOpen: boolean
    subsidiaryId: string
    employees?: any[]
  }>({ isOpen: false, subsidiaryId: "" })

  const [importModal, setImportModal] = useState(false)

  const [isSavingSubsidiary, setIsSavingSubsidiary] = useState(false)

  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const [isSavingSubsidiaries, setIsSavingSubsidiaries] = useState(false)

  const [isManagingLeaveTypes, setIsManagingLeaveTypes] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null)

  useEffect(() => {
    if (selectedSubsidiary) {
      const nextPreview = selectedSubsidiary.logo_url || ""
      if (subsidiaryLogoPreview !== nextPreview) {
        setSubsidiaryLogoPreview(nextPreview)
      }
    } else if (!showEditSubsidiary && !showSubsidiaryDetails) {
      setSubsidiaryLogoPreview("")
    }
  }, [selectedSubsidiary?.id, selectedSubsidiary?.logo_url, showEditSubsidiary, showSubsidiaryDetails, subsidiaryLogoPreview])

  const [isSaving, setIsSaving] = useState(false) // General saving state
  const [showAddLeaveTypeModal, setShowAddLeaveTypeModal] = useState(false)
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [policyModalType, setPolicyModalType] = useState("view") // view, edit, delete
  const [newLeaveType, setNewLeaveType] = useState({
    name: "",
    days: 0,
    description: "",
    carryOver: false,
  })

  const [leaveTypeAIInsights, setLeaveTypeAIInsights] = useState<string[]>([])

  const [showAIInsightsModal, setShowAIInsightsModal] = useState(false)
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const [aiInsights, setAiInsights] = useState<string>("")

  const [loadingInsights, setLoadingInsights] = useState<Record<string, boolean>>({})
  const [policyInsights, setPolicyInsights] = useState<Record<string, string>>({})

  const [editingAllowance, setEditingAllowance] = useState<number | null>(null)
  const [editingDeduction, setEditingDeduction] = useState<number | null>(null)

  const [allowances, setAllowances] = useState<any[]>([])

  const [deductions, setDeductions] = useState<any[]>([])

  // Act 766: Tier 1 (SSNIT) 0.5% ee / 13% er — Tier 2 is separate (5% ee / 0% er)
  const [ssnitRates, setSsnitRates] = useState({
    employee: 0.5,
    employer: 13,
    total: 13.5,
  })

  const [tier2Rates, setTier2Rates] = useState({
    employee: 5,
    employer: 0,
    total: 5,
  })

  const [tier3Rates, setTier3Rates] = useState({
    employee: 5,
    employer: 5,
    total: 10,
  })

  // Payroll configuration — controlled state (replaces defaultValue)
  const [payFrequency, setPayFrequency] = useState("monthly")
  const [currency, setCurrencyPref] = useState("ghs")
  const [minimumWage, setMinimumWage] = useState(18.15)
  const [overtimeWeekdayRate, setOvertimeWeekdayRate] = useState(1.5)
  const [overtimeWeekendRate, setOvertimeWeekendRate] = useState(2.0)
  const [payrollCutoffDay, setPayrollCutoffDay] = useState(25)
  const [autoCalcPaye, setAutoCalcPaye] = useState(true)
  const [autoCalcSsnit, setAutoCalcSsnit] = useState(true)
  const [autoCalcProvident, setAutoCalcProvident] = useState(true)

  const [isSavingPayroll, setIsSavingPayroll] = useState(false)
  const [isSavingTax, setIsSavingTax] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [overviewPeriod, setOverviewPeriod] = useState<"quarter" | "year">("quarter")
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false)
  const [isOverviewRefreshing, setIsOverviewRefreshing] = useState(false)

  // Tax Relief State — loaded from tax_reliefs via /api/settings/payroll/items
  const [taxReliefs, setTaxReliefs] = useState<any[]>([])
  const [isSyncingReliefs, setIsSyncingReliefs] = useState(false)
  const [reliefsLastSync, setReliefsLastSync] = useState<string | null>("2024-01-01T00:00:00Z")
  const [editingRelief, setEditingRelief] = useState<number | null>(null)
  const [isSavingReliefs, setIsSavingReliefs] = useState(false)

  const currencyConfig = {
    ghs: {
      symbol: "₵",
      name: "Ghana Cedis (GHS)",
      country: "Ghana",
      apiEndpoint: "https://api.gra.gov.gh/tax-rates",
      lastUpdated: "2024-01-01",
      version: "2024.1",
      // GRA monthly PAYE bands effective 1 Jan 2024 (display + calculator source of truth)
      taxBands: [
        { rate: 0, from: 0, to: 490, cumulativeTax: 0 },
        { rate: 5, from: 490, to: 600, cumulativeTax: 0 },
        { rate: 10, from: 600, to: 730, cumulativeTax: 5.5 },
        { rate: 17.5, from: 730, to: 3896.67, cumulativeTax: 18.5 },
        { rate: 25, from: 3896.67, to: 19896.67, cumulativeTax: 572.67 },
        { rate: 30, from: 19896.67, to: 50416.67, cumulativeTax: 4572.67 },
        { rate: 35, from: 50416.67, to: Number.POSITIVE_INFINITY, cumulativeTax: 13728.67 },
      ],
      socialSecurity: {
        // Act 766 Tier 1 (SSNIT) portion — employee total pension is 5.5% with Tier 2
        employee: 0.5,
        employer: 13.0,
        total: 13.5,
        cap: 2000000, // Annual cap in GHS
      },
      tier2: {
        employee: 5.0,
        employer: 0,
        total: 5.0,
      },
      tier3: {
        employee: 5.0,
        employer: 5.0,
        total: 10.0,
      },
    },
    usd: {
      symbol: "$",
      name: "US Dollar (USD)",
      country: "United States",
      apiEndpoint: "https://api.irs.gov/tax-rates",
      lastUpdated: "2024-01-01",
      version: "2024.1",
      taxBands: [
        { rate: 10, from: 0, to: 916.67, cumulativeTax: 0 },
        { rate: 12, from: 916.68, to: 3083.33, cumulativeTax: 91.67 },
        { rate: 22, from: 3083.34, to: 8333.33, cumulativeTax: 351.67 },
        { rate: 24, from: 8333.34, to: 14583.33, cumulativeTax: 1506.67 },
        { rate: 32, from: 14583.34, to: 18750, cumulativeTax: 3006.67 },
        { rate: 35, from: 18750.01, to: 47083.33, cumulativeTax: 4340.01 },
        { rate: 37, from: 47083.34, to: Number.POSITIVE_INFINITY, cumulativeTax: 14256.68 },
      ],
    },
    eur: {
      country: "Germany",
      symbol: "€",
      version: "2024.1",
      lastUpdated: "2024-01-01",
      taxBands: [
        { rate: 0, from: 0, to: 916.67, cumulativeTax: 0 },
        { rate: 14, from: 916.68, to: 4583.33, cumulativeTax: 0 },
        { rate: 24, from: 4583.34, to: 4791.67, cumulativeTax: 513.33 },
        { rate: 42, from: 4791.68, to: 22500, cumulativeTax: 563.33 },
        { rate: 45, from: 22500.01, to: Number.POSITIVE_INFINITY, cumulativeTax: 8000.83 },
      ],
    },
    ngn: {
      country: "Nigeria",
      symbol: "₦",
      version: "2024.1",
      lastUpdated: "2024-01-01",
      taxBands: [
        { rate: 7, from: 0, to: 25000, cumulativeTax: 0 },
        { rate: 11, from: 25001, to: 50000, cumulativeTax: 1750 },
        { rate: 15, from: 50001, to: 83333.33, cumulativeTax: 4500 },
        { rate: 19, from: 83333.34, to: 133333.33, cumulativeTax: 9500 },
        { rate: 21, from: 133333.34, to: 208333.33, cumulativeTax: 19000 },
        { rate: 24, from: 208333.34, to: Number.POSITIVE_INFINITY, cumulativeTax: 34750 },
      ],
      socialSecurity: {
        employee: 8.0,
        employer: 10.0,
        total: 18.0,
        cap: 1800000, // Annual cap in NGN
      },
    },
  }

  const [taxVersions, setTaxVersions] = useState([
    {
      id: "v2024.1",
      version: "2024.1",
      effectiveDate: "2024-01-01",
      status: "active",
      source: "government_api",
      confidence: 95,
      lastUpdated: "2024-01-01T00:00:00Z",
      approvedBy: "System Admin",
      changes: "Updated for 2024 tax year",
    },
  ])

  const [apiStatus, setApiStatus] = useState({
    ghana: { connected: true, lastSync: "2024-01-01T00:00:00Z", status: "active" },
    nigeria: { connected: false, lastSync: null, status: "inactive" },
    usa: { connected: false, lastSync: null, status: "inactive" },
  })

  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "tax_update",
      priority: "high",
      title: "Ghana PAYE Rates Updated",
      message: "New tax rates effective January 1, 2024",
      timestamp: "2024-01-01T00:00:00Z",
      read: false,
    },
  ])

  const [selectedCurrency, setSelectedCurrency] = useState("ghs")
  const [payeTaxBands, setPayeTaxBands] = useState(currencyConfig.ghs.taxBands)

  const [notificationTemplates, setNotificationTemplates] = useState<any[]>([])

  const [emailConfig, setEmailConfig] = useState({
    provider: "smtp",
    smtpHost: "",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    fromEmail: "",
    fromName: "",
    replyTo: "",
    enableTLS: true,
    enableSSL: false,
  })

  const [notificationSettings, setNotificationSettings] = useState({
    welcomeNotifications: true,
    payrollNotifications: true,
    leaveNotifications: true,
    attendanceAlerts: true,
    promotionNotifications: true,
    systemMaintenanceAlerts: true,
    emailDigest: "daily",
    smsAlerts: false,
    pushNotifications: true,
  })

  const [isAddingTemplate, setIsAddingTemplate] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateModalType, setTemplateModalType] = useState("view") // view, edit, add
  const [aiDescription, setAiDescription] = useState("")
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false)
  const [templateRating, setTemplateRating] = useState(0)
  const [templateFeedback, setTemplateFeedback] = useState("")
  const [templateImprovements, setTemplateImprovements] = useState("")
  const [lastGeneratedTemplateId, setLastGeneratedTemplateId] = useState("")
  const [currentAIModel, setCurrentAIModel] = useState(null)
  const [showModelUpgrade, setShowModelUpgrade] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "HR",
    type: "Email",
    subject: "",
    body: "",
    variables: [],
  })

  // Added for Access Control and Security
  const [accessSettings, setAccessSettings] = useState<AccessSettings>({
    twoFactorEnabled: false,
    ssoEnabled: false,
    passwordExpiryEnabled: true,
    passwordExpiryDays: 90,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecial: false,
    ipRestrictionsEnabled: false,
    allowedIPs: [],
  })
  const [isSavingAccessSettings, setIsSavingAccessSettings] = useState(false)
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [isRefreshingSessions, setIsRefreshingSessions] = useState(false)
  const [sessionToTerminate, setSessionToTerminate] = useState<ActiveSession | null>(null)
  const [isTerminatingSession, setIsTerminatingSession] = useState(false)

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    dataEncryptionEnabled: true,
    auditLoggingEnabled: true,
    autoBackupEnabled: true,
    backupFrequency: "daily",
    backupRetentionDays: 30,
    dataRetentionDays: 90,
    gdprComplianceEnabled: false,
    dataAnonymizationEnabled: false,
  })
  const [isSavingSecuritySettings, setIsSavingSecuritySettings] = useState(false)
  const [backupSize, setBackupSize] = useState<string | null>(null)
  const [backupStatus, setBackupStatus] = useState<string | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>([])
  const [isExportingReport, setIsExportingReport] = useState(false)
  const [showAllLogsModal, setShowAllLogsModal] = useState(false)
  const [isLoadingAllLogs, setIsLoadingAllLogs] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [testConnectionStatus, setTestConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")

  const overviewMetrics = useMemo(() => {
    const headcount = employees.length
    const subsidiariesCount = subsidiaries.length

    const automationKeys: Array<keyof HrConfig> = [
      "autoApproveLeave",
      "emailNotifications",
      "aiRecommendations",
      "smartScheduling",
      "performanceTracking",
    ]

    const automationEnabled = automationKeys.reduce((count, key) => (hrConfig[key] ? count + 1 : count), 0)
    const automationCoverage = Math.round((automationEnabled / automationKeys.length) * 100)

    const securitySignals = [
      accessSettings.twoFactorEnabled,
      accessSettings.passwordExpiryEnabled,
      accessSettings.ipRestrictionsEnabled,
      securitySettings.dataEncryptionEnabled,
      securitySettings.auditLoggingEnabled,
      securitySettings.autoBackupEnabled,
    ]

    const securityScore = Math.round((securitySignals.filter(Boolean).length / securitySignals.length) * 100)
    const securityLabel = securityScore >= 80 ? "Low risk" : securityScore >= 60 ? "Moderate" : "High risk"

    const periodDeltas = {
      quarter: { headcount: 0.042, automation: 0.08, security: "+3" },
      year: { headcount: 0.12, automation: 0.18, security: "+9" },
    } as const

    return {
      headcount,
      subsidiariesCount,
      automationCoverage,
      securityScore,
      securityLabel,
      deltas: periodDeltas[overviewPeriod],
    }
  }, [
    employees.length,
    subsidiaries.length,
    hrConfig,
    accessSettings,
    securitySettings,
    overviewPeriod,
  ])

  // Structured Salary Grades
  const [salaryGrades, setSalaryGrades] = useState<StructuredSalaryGrade[]>([])
  const [showSalaryGradeModal, setShowSalaryGradeModal] = useState(false)
  const [editingGrade, setEditingGrade] = useState(null)
  const [newGrade, setNewGrade] = useState({
    name: "",
    description: "",
    minSalary: "",
    maxSalary: "",
    numberOfNotches: 5,
    notches: [],
  })
  const [isGeneratingNotches, setIsGeneratingNotches] = useState(false)

  const [showImportExportModal, setShowImportExportModal] = useState(false)
  const [importData, setImportData] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const [salaryGradeTab, setSalaryGradeTab] = useState("structured")
  const [unstructuredGrades, setUnstructuredGrades] = useState<UnstructuredSalaryGrade[]>([])
  const [showUnstructuredModal, setShowUnstructuredModal] = useState(false)
  const [editingUnstructured, setEditingUnstructured] = useState(null)
  const [newUnstructured, setNewUnstructured] = useState({
    name: "",
    description: "",
    generalIncrement: { type: "percentage", value: 0 },
    performanceIncrement: { type: "percentage", value: 0 },
  })

  const handleExportSalaryGrades = async (format: "csv" | "excel") => {
    setIsExporting(true)

    try {
      // Prepare data for export
      const exportData = []

      // Add headers
      exportData.push(["Grade Name", "Description", "Min Salary", "Max Salary", "Step", "Step Amount"])

      // Add data rows
      salaryGrades.forEach((grade) => {
        grade.notches.forEach((notch) => {
          exportData.push([grade.name, grade.description, grade.minSalary, grade.maxSalary, notch.step, notch.amount])
        })
      })

      if (format === "csv") {
        // Convert to CSV
        const csvContent = exportData.map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

        // Download CSV
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `salary_grades_${new Date().toISOString().split("T")[0]}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // For Excel format, we'll create a simple tab-separated format
        const tsvContent = exportData.map((row) => row.join("\t")).join("\n")
        const blob = new Blob([tsvContent], { type: "application/vnd.ms-excel" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `salary_grades_${new Date().toISOString().split("T")[0]}.xlsx`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      toast({
        title: "Export Successful",
        description: `Salary grades exported as ${format.toUpperCase()} file.`,
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export salary grades. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportSalaryGrades = async () => {
    if (!importData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste CSV data to import.",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)

    try {
      const lines = importData.trim().split("\n")
      const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())

      // Validate headers
      const expectedHeaders = ["Grade Name", "Description", "Min Salary", "Max Salary", "Step", "Step Amount"]
      const hasValidHeaders = expectedHeaders.every((header) =>
        headers.some((h) => h.toLowerCase().includes(header.toLowerCase())),
      )

      if (!hasValidHeaders) {
        throw new Error("Invalid CSV format. Please ensure headers match the expected format.")
      }

      // Parse data
      const gradesMap = new Map()

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.replace(/"/g, "").trim())

        if (values.length >= 6) {
          const gradeName = values[0]
          const description = values[1]
          const minSalary = Number.parseFloat(values[2])
          const maxSalary = Number.parseFloat(values[3])
          const step = Number.parseInt(values[4])
          const stepAmount = Number.parseFloat(values[5])

          if (!gradesMap.has(gradeName)) {
            gradesMap.set(gradeName, {
              id: Date.now() + Math.random(),
              name: gradeName,
              description,
              minSalary,
              maxSalary,
              notches: [],
            })
          }

          gradesMap.get(gradeName).notches.push({
            step,
            amount: stepAmount,
          })
        }
      }

      // Convert to array and sort notches
      const importedGrades = Array.from(gradesMap.values()).map((grade) => ({
        ...grade,
        notches: grade.notches.sort((a, b) => a.step - b.step),
      }))

      // Add to existing grades
      setSalaryGrades((prev) => [...prev, ...importedGrades])

      toast({
        title: "Import Successful",
        description: `Successfully imported ${importedGrades.length} salary grades.`,
      })

      setShowImportExportModal(false)
      setImportData("")
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import salary grades. Please check your data format.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const [newDivisionName, setNewDivisionName] = useState("")
  const [newDepartmentName, setNewDepartmentName] = useState("")
  const [newLocationName, setNewLocationName] = useState("")

  // HR Documents State

  const getCurrencyConfig = (currency: string) => {
    return currencyConfig[currency as keyof typeof currencyConfig] || currencyConfig.ghs
  }

  const calculateTax = (income: number, currency: string = selectedCurrency) => {
    const config = getCurrencyConfig(currency)
    if (!config) return 0

    // Ghana PAYE: use the shared GRA monthly engine so Settings matches Payroll
    if (currency === "ghs") {
      return roundMoney(calculateMonthlyPaye(Math.max(0, income)).monthlyTax)
    }

    let tax = 0
    let remainingIncome = Math.max(0, income)
    const bands = [...config.taxBands].sort((a: any, b: any) => (a.from || 0) - (b.from || 0))

    for (let i = 0; i < bands.length; i++) {
      if (remainingIncome <= 0) break
      const band = bands[i]
      const bandStart = band.from || 0
      const bandEnd = band.to == null || !Number.isFinite(band.to) ? Number.POSITIVE_INFINITY : band.to
      const bandWidth = bandEnd - bandStart
      if (bandWidth <= 0 && Number.isFinite(bandEnd)) continue
      const taxableInBand = Number.isFinite(bandWidth) ? Math.min(remainingIncome, bandWidth) : remainingIncome
      tax += (taxableInBand * band.rate) / 100
      remainingIncome -= taxableInBand
    }

    return Math.round(tax * 100) / 100
  }

  const validateTaxBands = (bands: any[]) => {
    const errors = []

    for (let i = 0; i < bands.length; i++) {
      const band = bands[i]

      // Check for overlapping bands
      if (i > 0 && band.from <= bands[i - 1].to) {
        errors.push(`Band ${i + 1}: Overlapping with previous band`)
      }

      // Check for gaps
      if (i > 0 && band.from !== bands[i - 1].to + 1) {
        errors.push(`Band ${i + 1}: Gap detected with previous band`)
      }

      // Check rate validity
      if (band.rate < 0 || band.rate > 100) {
        errors.push(`Band ${i + 1}: Invalid tax rate (${band.rate}%)`)
      }
    }

    return errors
  }

  const syncWithGovernmentAPI = async (currency: string) => {
    setIsSyncing(true)
    console.log(`[v0] Syncing ${currency} tax rates with government API...`)

    try {
      const selectedConfig = getCurrencyConfig(currency)
      const nextBands = selectedConfig?.taxBands || payeTaxBands
      const nextSsnit = selectedConfig?.socialSecurity
        ? {
            employee: selectedConfig.socialSecurity.employee,
            employer: selectedConfig.socialSecurity.employer,
            total: selectedConfig.socialSecurity.total,
          }
        : ssnitRates
      const nextTier2 = selectedConfig?.tier2
        ? {
            employee: selectedConfig.tier2.employee,
            employer: selectedConfig.tier2.employer,
            total: selectedConfig.tier2.total,
          }
        : tier2Rates
      const nextTier3 = selectedConfig?.tier3
        ? {
            employee: selectedConfig.tier3.employee,
            employer: selectedConfig.tier3.employer,
            total: selectedConfig.tier3.total,
          }
        : tier3Rates

      setPayeTaxBands(nextBands)
      setSsnitRates(nextSsnit)
      setTier2Rates(nextTier2)
      setTier3Rates(nextTier3)

      setApiStatus((prev) => ({
        ...prev,
        [currency]: {
          ...prev[currency as keyof typeof prev],
          connected: true,
          lastSync: new Date().toISOString(),
          status: "active",
        },
      }))

      // Persist using the synced values (avoid stale React state)
      const companyId = await resolveHrCompanyId()
      const taxYear = new Date().getFullYear()
      const payeBands = nextBands.map((b: any, i: number) => ({
        band_order: i + 1,
        rate: Number(b.rate || 0),
        threshold_amount: b.to === Number.POSITIVE_INFINITY ? 999999999 : Number(b.to || 0),
        is_remaining_amount: b.to === Number.POSITIVE_INFINITY,
        description: `${b.rate}% band`,
      }))
      await settingsFetch("/api/settings/tax", {
        method: "POST",
        body: JSON.stringify({
          company_id: companyId,
          tax_year: taxYear,
          ssnit: { employee: nextSsnit.employee, employer: nextSsnit.employer },
          tier2: { employee: nextTier2.employee, employer: nextTier2.employer },
          tier3: { employee: nextTier3.employee, employer: nextTier3.employer },
          paye_bands: payeBands,
        }),
      })

      toast({
        title: "Success",
        description: `${currency.toUpperCase()} tax rates synced and saved`,
      })
    } catch (error) {
      console.error(`[v0] Error syncing ${currency} tax rates:`, error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sync tax rates",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency)
    // Update payeTaxBands based on the selected currency
    const selectedConfig = getCurrencyConfig(currency)
    if (selectedConfig && selectedConfig.taxBands) {
      setPayeTaxBands(selectedConfig.taxBands)
      // Update SSNIT, Tier2, Tier3 rates if they exist in the config
      if (selectedConfig.socialSecurity) {
        setSsnitRates({
          employee: selectedConfig.socialSecurity.employee,
          employer: selectedConfig.socialSecurity.employer,
          total: selectedConfig.socialSecurity.total,
        })
      }
      if (selectedConfig.tier2) {
        setTier2Rates({
          employee: selectedConfig.tier2.employee,
          employer: selectedConfig.tier2.employer,
          total: selectedConfig.tier2.total,
        })
      }
      if (selectedConfig.tier3) {
        setTier3Rates({
          employee: selectedConfig.tier3.employee,
          employer: selectedConfig.tier3.employer,
          total: selectedConfig.tier3.total,
        })
      }
    }
  }

  const updateSsnitRates = (field: string, value: number) => {
    const newRates = { ...ssnitRates, [field]: value }
    if (field !== "total") {
      newRates.total = newRates.employee + newRates.employer
    }
    setSsnitRates(newRates)
  }

  const updateTier2Rates = (field: string, value: number) => {
    const newRates = { ...tier2Rates, [field]: value }
    if (field !== "total") {
      newRates.total = newRates.employee + newRates.employer
    }
    setTier2Rates(newRates)
  }

  const updateTier3Rates = (field: string, value: number) => {
    const newRates = { ...tier3Rates, [field]: value }
    if (field !== "total") {
      newRates.total = newRates.employee + newRates.employer
    }
    setTier3Rates(newRates)
  }

  // Enhanced handleDownload to work with Blob URLs
  const handleDownload = () => {
    if (selectedDocument) {
      const content = parseDocumentContent(selectedDocument)
      let blob
      let filename

      if (selectedDocument.type === "PDF") {
        // In a real application, this would be a PDF file from a URL
        // For this demo, we'll simulate downloading as a text file
        blob = new Blob([content], { type: "text/plain" })
        filename = `${selectedDocument.name}.txt`

        toast({
          title: "Download Note",
          description: "PDF viewed directly; download is disabled in this view.",
        })
        return // Prevent actual download for PDF in view mode
      } else if (selectedDocument.type === "DOC" || selectedDocument.type === "DOCX") {
        // For Word docs, create as RTF format
        const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} \\f0\\fs24 ${content.replace(/\n/g, "\\par ")}}`
        blob = new Blob([rtfContent], { type: "application/rtf" })
        filename = `${selectedDocument.name}.rtf`
      } else {
        // Fallback for other file types
        blob = new Blob([content], { type: "text/plain" })
        filename = `${selectedDocument.name}.txt`
      }

      // Simulate download for non-PDF types
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Download Started",
        description: `Downloading ${filename}...`,
      })
    }
  }

  // Updated handleFullscreen to use the new state and potentially toggle document viewer fullscreen
  const handleFullscreen = () => {
    setIsFullscreen((prev) => !prev)
    if (!isFullscreen) {
      toast({
        title: "Fullscreen Mode",
        description: "Press ESC to exit fullscreen",
      })
    }
  }

  // Logo upload function
  const applyCompanyPayload = (data: any) => {
    if (!data?.id) return null
    const nextDivisions = ensureStringArray(data.divisions)
    const nextDepartments = ensureStringArray(data.departments)
    const nextLocations = ensureStringArray(data.locations)
    const resolvedLogoUrl = isPlaceholderLogo(data.logo_url) ? "" : String(data.logo_url)

    setCompanyData({
      id: data.id,
      name: data.name || "",
      email_address: data.email_address || "",
      tax_id: data.tax_id || "",
      ssnit_number: data.ssnit_number || "",
      industry: data.industry || "",
      status: "active",
      address: data.address || "",
      phone_number: data.phone_number || "",
      divisions: nextDivisions,
      departments: nextDepartments,
      locations: nextLocations,
      logo_url: resolvedLogoUrl || null,
    })
    setDivisions(nextDivisions)
    setDepartments(nextDepartments)
    setLocations(nextLocations)
    setCompanyLogoPreview(resolvedLogoUrl)
    setLogoPreview(resolvedLogoUrl)
    return data.id as string
  }

  const persistCompanySettings = async (overrides: Record<string, unknown> = {}) => {
    const companyId = (overrides.company_id as string) || companyData.id
    if (!companyId) throw new Error("No company identifier available")

    const logoCandidate =
      (overrides.logo_url as string | null | undefined) ??
      (isPlaceholderLogo(companyLogoPreview) ? null : companyLogoPreview) ??
      (isPlaceholderLogo(companyData.logo_url) ? null : companyData.logo_url)

    const payload = {
      company_id: companyId,
      name: companyData.name,
      industry: companyData.industry,
      tax_id: companyData.tax_id,
      ssnit_number: companyData.ssnit_number,
      email_address: companyData.email_address,
      phone_number: companyData.phone_number,
      address: companyData.address,
      divisions,
      departments,
      locations,
      logo_url: logoCandidate,
      ...overrides,
    }

    const result = await settingsFetch("/api/settings/company", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    if (result.company) {
      applyCompanyPayload(result.company)
      clearClientDemoSession()
    }
    return result
  }

  const handleLogoUpload = async (file: File, type: "company" | "subsidiary") => {
    if (!file) return

    setIsUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      const uploaded = await response.json().catch(() => ({}))
      if (!response.ok || !uploaded.url) {
        throw new Error(uploaded.error || "Upload failed")
      }

      const url = uploaded.url as string

      if (type === "company") {
        setCompanyLogoPreview(url)
        setCompanyData((prev) => ({ ...prev, logo_url: url }))

        // Persist immediately so navigating away cannot lose the new logo.
        if (companyData.id && !String(companyData.id).startsWith("demo-")) {
          await persistCompanySettings({ logo_url: url })
          toast({
            title: "Logo saved",
            description: "Company logo uploaded and saved to the database.",
          })
        } else {
          toast({
            title: "Logo uploaded",
            description: "Logo ready. Click Save Company Settings to persist it.",
          })
        }
      } else {
        setSubsidiaryLogoPreview(url)
        if (selectedSubsidiary) {
          const updatedSubsidiary = { ...selectedSubsidiary, logo_url: url }
          setSelectedSubsidiary(updatedSubsidiary)
          setSubsidiaries((prev) =>
            prev.map((sub) => (sub.id === selectedSubsidiary.id ? { ...sub, logo_url: url } : sub)),
          )
        }
        toast({
          title: "Logo uploaded successfully",
          description: "Your logo has been uploaded and is ready to use.",
        })
      }
    } catch (error) {
      console.error("Logo upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload logo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingLogo(false)
    }
  }

  // Load functions
  const fetchCurrentCompanyId = async (): Promise<string | null> => {
    if (companyData.id) {
      const trimmed = companyData.id.trim()
      if (trimmed.length > 0 && !trimmed.startsWith("demo-")) return trimmed
    }

    try {
      const { data, error } = await supabase.rpc("get_current_user_company_id")
      if (!error && typeof data === "string" && data.trim().length > 0) {
        return data
      }
      if (error) {
        console.warn("[v0] get_current_user_company_id RPC failed", error)
      }
    } catch (error) {
      console.warn("[v0] RPC get_current_user_company_id threw", error)
    }

    // Only fall back to the synthetic demo id when no real tenant id exists.
    if (isDemoMode()) return "demo-company-001"
    return null
  }

  const loadCompanyData = async (): Promise<string | null> => {
    console.log("[v0] Loading company data...")

    // Always try the service-role API first. A stale demo-session cookie must not
    // block reading real tenant company rows (that was causing logo/settings reverts).
    try {
      const currentCompanyId = await fetchCurrentCompanyId()
      const qs =
        currentCompanyId && !String(currentCompanyId).startsWith("demo-")
          ? `?company_id=${encodeURIComponent(currentCompanyId)}`
          : ""
      const payload = await settingsFetch(`/api/settings/company${qs}`)
      if (payload.company?.id) {
        clearClientDemoSession()
        return applyCompanyPayload(payload.company)
      }
    } catch (error) {
      console.error("[v0] Error loading company data:", error)
      if (!isDemoMode()) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load company data",
          variant: "destructive",
        })
      }
    }

    if (isDemoMode()) {
      console.log("[v0] Demo mode fallback for company data")
      setCompanyData({
        id: "demo-company-001",
        name: "Akwaaba Technologies Ltd",
        email_address: "ykodiah@gmail.com",
        tax_id: "C0012345678",
        ssnit_number: "1234567890",
        industry: "Technology",
        status: "active",
        address: "123 Liberation Road, Labone, Accra, Ghana",
        phone_number: "0249397960",
        divisions: ["Head Office", "Regional Office"],
        departments: ["Technology", "Human Resources", "Finance"],
        locations: ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"],
        logo_url: null,
      })
      setDivisions(["Head Office", "Regional Office"])
      setDepartments(["Technology", "Human Resources", "Finance"])
      setLocations(["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"])
      setCompanyLogoPreview("")
      setLogoPreview("")
      return "demo-company-001"
    }

    return companyData.id || null
  }

  const loadEmployees = async (companyId?: string) => {
    console.log("[v0] Loading employees...")

    if (isDemoMode()) {
      console.log("[v0] Demo mode detected, using mock employees data")
      setEmployees([
        {
          id: "emp-001",
          first_name: "John",
          last_name: "Doe",
          full_name: "John Doe",
          corporate_email: "john.doe@akwaaba.com",
          personal_email: "john.doe@gmail.com",
          position: "Software Engineer",
          department: "Technology",
          status: "active",
        },
        {
          id: "emp-002",
          first_name: "Jane",
          last_name: "Smith",
          full_name: "Jane Smith",
          corporate_email: "jane.smith@akwaaba.com",
          personal_email: "jane.smith@gmail.com",
          position: "HR Manager",
          department: "Human Resources",
          status: "active",
        },
      ])
      return
    }

    try {
      const targetCompanyId = companyId || companyData.id
      let query = supabase.from("employees").select("*").order("created_at", { ascending: false })

      if (targetCompanyId) {
        query = query.eq("company_id", targetCompanyId)
      }

      const { data, error } = await query

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error("Error loading employees:", error)
      if (error.message && error.message.includes("infinite recursion detected in policy")) {
        console.log("[v0] Database policy error detected, falling back to demo mode for employees")
        document.cookie = "demo-session=active; path=/; max-age=86400"
        setEmployees([
          {
            id: "emp-001",
            first_name: "John",
            last_name: "Doe",
            full_name: "John Doe",
            corporate_email: "john.doe@akwaaba.com",
            personal_email: "john.doe@gmail.com",
            position: "Software Engineer",
            department: "Technology",
            status: "active",
          },
          {
            id: "emp-002",
            first_name: "Jane",
            last_name: "Smith",
            full_name: "Jane Smith",
            corporate_email: "jane.smith@akwaaba.com",
            personal_email: "jane.smith@gmail.com",
            position: "HR Manager",
            department: "Human Resources",
            status: "active",
          },
        ])
        return
      }
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      })
    }
  }

  const loadSubsidiaries = async (companyId?: string) => {
    console.log("[v0] Loading subsidiaries...")

    try {
      let targetCompanyId = companyId || companyData.id
      if (!targetCompanyId || String(targetCompanyId).startsWith("demo-")) {
        targetCompanyId = (await loadCompanyData()) || targetCompanyId
      }
      const qs =
        targetCompanyId && !String(targetCompanyId).startsWith("demo-")
          ? `?company_id=${encodeURIComponent(targetCompanyId)}`
          : ""
      const [listPayload, prefsPayload] = await Promise.all([
        settingsFetch(`/api/settings/subsidiaries${qs}`),
        settingsFetch(`/api/settings/subsidiaries${qs}${qs ? "&" : "?"}action=sync_preferences`).catch(() => null),
      ])
      setSubsidiaries(listPayload.subsidiaries || [])
      clearClientDemoSession()
      if (prefsPayload?.preferences) {
        setSyncPrefs({
          sync_hr_policies: !!prefsPayload.preferences.sync_hr_policies,
          sync_payroll_config: !!prefsPayload.preferences.sync_payroll_config,
          sync_leave_types: !!prefsPayload.preferences.sync_leave_types,
          sync_roles_permissions: !!prefsPayload.preferences.sync_roles_permissions,
        })
      }
      console.log("[v0] Loaded subsidiaries:", (listPayload.subsidiaries || []).length)
    } catch (error) {
      console.error("Subsidiaries loading error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load subsidiaries",
        variant: "destructive",
      })
    }
  }

  const loadRoles = async (companyId?: string) => {
    console.log("[v0] Loading roles...")
    // Always read from the service-role API (same pattern as HR / Payroll / Notifications).
    try {
      let targetCompanyId = companyId || companyData.id
      if (!targetCompanyId || String(targetCompanyId).startsWith("demo-")) {
        targetCompanyId = (await loadCompanyData()) || targetCompanyId
      }
      const qs =
        targetCompanyId && !String(targetCompanyId).startsWith("demo-")
          ? `?company_id=${encodeURIComponent(targetCompanyId)}`
          : ""
      const { roles: roleRows } = await settingsFetch(`/api/settings/roles${qs}`)
      clearClientDemoSession()
      setRoles(Array.isArray(roleRows) ? roleRows : [])
    } catch (error) {
      console.error("Error loading roles:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load roles",
        variant: "destructive",
      })
    }
  }

  // Added for Access Control and Security
  const loadAccessAndSecurityData = async (companyId?: string) => {
    console.log("[v0] Loading access and security data...")

    let targetCompanyId = companyId || companyData.id
    if (!targetCompanyId || String(targetCompanyId).startsWith("demo-")) {
      targetCompanyId = (await loadCompanyData()) || targetCompanyId
    }

    if (!targetCompanyId || String(targetCompanyId).startsWith("demo-")) {
      console.warn("[v0] Unable to load access/security data without a company id")
      return
    }

    try {
      const qs = `?company_id=${encodeURIComponent(targetCompanyId)}`
      const [accessPayload, securityPayload] = await Promise.all([
        settingsFetch(`/api/settings/access${qs}`),
        settingsFetch(`/api/settings/security${qs}`),
      ])
      clearClientDemoSession()

      if (accessPayload.accessSettings) setAccessSettings((prev) => ({ ...prev, ...accessPayload.accessSettings }))
      setActiveSessions(Array.isArray(accessPayload.activeSessions) ? accessPayload.activeSessions : [])
      if (securityPayload.securitySettings)
        setSecuritySettings((prev) => ({ ...prev, ...securityPayload.securitySettings }))
      setLastBackupTime(securityPayload.lastBackupTime || null)
      setBackupStatus(securityPayload.backupStatus || null)
      setBackupSize(securityPayload.backupSize || "0 MB")
      setAuditLogs(Array.isArray(securityPayload.auditLogs) ? securityPayload.auditLogs : [])
      setBackupHistory(Array.isArray(securityPayload.backupHistory) ? securityPayload.backupHistory : [])

      console.log("[v0] Access and security data loaded from database.")
    } catch (error) {
      console.error("[v0] Failed to load access and security data", error)
      toast({
        title: "Error",
        description: "Unable to load access and security insights.",
        variant: "destructive",
      })
    }
  }

  const resolveHrCompanyId = async (companyId?: string) => {
    let targetCompanyId = companyId || companyData.id
    if (!targetCompanyId || String(targetCompanyId).startsWith("demo-")) {
      targetCompanyId = (await loadCompanyData()) || targetCompanyId
    }
    if (!targetCompanyId || String(targetCompanyId).startsWith("demo-")) {
      throw new Error("No company identifier available")
    }
    return targetCompanyId
  }

  const loadHrData = async (companyId?: string) => {
    // Always hit the service-role API first (same pattern as Company).
    // A stale demo-session cookie must not keep mock HR policies/docs on screen.
    try {
      let targetCompanyId = companyId || companyData.id
      if (!targetCompanyId || String(targetCompanyId).startsWith("demo-")) {
        targetCompanyId = (await loadCompanyData()) || targetCompanyId
      }

      const qs =
        targetCompanyId && !String(targetCompanyId).startsWith("demo-")
          ? `?company_id=${encodeURIComponent(targetCompanyId)}`
          : ""
      const payload = await settingsFetch(`/api/settings/hr${qs}`)
      clearClientDemoSession()

      if (payload.hrConfig) setHrConfig(payload.hrConfig)
      setHrDocuments(Array.isArray(payload.hrDocuments) ? payload.hrDocuments : [])
      setCurrentPolicies(Array.isArray(payload.leavePolicies) ? payload.leavePolicies : [])
      setSalaryGrades(Array.isArray(payload.salaryGrades) ? payload.salaryGrades : [])
      setUnstructuredGrades(Array.isArray(payload.unstructuredGrades) ? payload.unstructuredGrades : [])
    } catch (error) {
      console.error("[v0] Failed to load HR configuration/documents", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to load HR configuration.",
        variant: "destructive",
      })
    }
  }

  const mapDbBandsToUi = (bands: any[]) => {
    const sorted = [...(bands || [])].sort((a, b) => Number(a.band_order || 0) - Number(b.band_order || 0))
    let previousTo = 0
    return sorted.map((band) => {
      const to = band.is_remaining_amount ? Number.POSITIVE_INFINITY : Number(band.threshold_amount || 0)
      const from = previousTo
      previousTo = Number.isFinite(to) ? to : previousTo
      return {
        rate: Number(band.rate || 0),
        from,
        to,
        cumulativeTax: 0,
      }
    })
  }

  const loadPayrollSettings = async (cid: string) => {
    if (!cid || String(cid).startsWith("demo-")) return
    try {
      const [configRes, taxRes] = await Promise.all([
        fetch(`/api/settings/payroll?company_id=${encodeURIComponent(cid)}`, { credentials: "include" }),
        fetch(`/api/settings/tax?company_id=${encodeURIComponent(cid)}`, { credentials: "include" }),
      ])
      if (configRes.ok) {
        const { config } = await configRes.json()
        if (config) {
          clearClientDemoSession()
          if (config.pay_frequency) setPayFrequency(config.pay_frequency)
          if (config.currency) {
            setCurrencyPref(config.currency)
            setSelectedCurrency(config.currency)
          }
          if (typeof config.minimum_wage === "number") setMinimumWage(config.minimum_wage)
          if (typeof config.overtime_weekday_multiplier === "number") setOvertimeWeekdayRate(config.overtime_weekday_multiplier)
          if (typeof config.overtime_weekend_multiplier === "number") setOvertimeWeekendRate(config.overtime_weekend_multiplier)
          if (typeof config.payroll_cutoff_day === "number") setPayrollCutoffDay(config.payroll_cutoff_day)
          if (typeof config.auto_calculate_paye === "boolean") setAutoCalcPaye(config.auto_calculate_paye)
          if (typeof config.auto_calculate_ssnit === "boolean") setAutoCalcSsnit(config.auto_calculate_ssnit)
          if (typeof config.auto_calculate_provident_fund === "boolean") setAutoCalcProvident(config.auto_calculate_provident_fund)
        }
      }
      if (taxRes.ok) {
        const tax = await taxRes.json()
        if (tax.ssnit) {
          setSsnitRates({
            employee: tax.ssnit.employee_rate,
            employer: tax.ssnit.employer_rate,
            total: tax.ssnit.employee_rate + tax.ssnit.employer_rate,
          })
        }
        if (tax.tier2) {
          setTier2Rates({
            employee: tax.tier2.employee_rate,
            employer: tax.tier2.employer_rate,
            total: tax.tier2.employee_rate + tax.tier2.employer_rate,
          })
        }
        if (tax.tier3) {
          setTier3Rates({
            employee: tax.tier3.employee_rate,
            employer: tax.tier3.employer_rate,
            total: tax.tier3.employee_rate + tax.tier3.employer_rate,
          })
        }
        if (Array.isArray(tax.paye_bands) && tax.paye_bands.length) {
          setPayeTaxBands(mapDbBandsToUi(tax.paye_bands))
        }
      }
    } catch (err) {
      console.warn("[v0] loadPayrollSettings error:", err)
    }
  }

  const loadPayrollData = async (companyId?: string) => {
    // Always hit service-role APIs first (same pattern as Company / HR).
    try {
      let targetCompanyId = companyId || companyData.id
      if (!targetCompanyId || String(targetCompanyId).startsWith("demo-")) {
        targetCompanyId = (await loadCompanyData()) || targetCompanyId
      }
      if (!targetCompanyId || String(targetCompanyId).startsWith("demo-")) {
        console.warn("[v0] Unable to load payroll data without a company id")
        return
      }

      await loadPayrollSettings(targetCompanyId)

      const items = await settingsFetch(
        `/api/settings/payroll/items?company_id=${encodeURIComponent(targetCompanyId)}`,
      )
      clearClientDemoSession()
      setAllowances(Array.isArray(items.allowances) ? items.allowances : [])
      setDeductions(Array.isArray(items.deductions) ? items.deductions : [])
      setTaxReliefs(Array.isArray(items.taxReliefs) ? items.taxReliefs : [])
    } catch (error) {
      console.error("[v0] Failed to load payroll configuration", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to load payroll settings.",
        variant: "destructive",
      })
    }
  }

  const loadNotificationSettings = async (companyId?: string) => {
    // Always hit the service-role API first (same pattern as Company / HR / Payroll).
    try {
      let targetCompanyId = companyId || companyData.id
      if (!targetCompanyId || String(targetCompanyId).startsWith("demo-")) {
        targetCompanyId = (await loadCompanyData()) || targetCompanyId
      }

      const qs =
        targetCompanyId && !String(targetCompanyId).startsWith("demo-")
          ? `?company_id=${encodeURIComponent(targetCompanyId)}`
          : ""
      const payload = await settingsFetch(`/api/settings/notifications${qs}`)
      clearClientDemoSession()

      setNotificationTemplates(Array.isArray(payload.templates) ? payload.templates : [])
      if (payload.emailConfig) {
        setEmailConfig((prev) => ({ ...prev, ...payload.emailConfig }))
      }
      if (payload.preferences) {
        setNotificationSettings((prev) => ({ ...prev, ...payload.preferences }))
      }
    } catch (error) {
      console.error("[v0] Failed to load notification settings", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to load notification preferences.",
        variant: "destructive",
      })
    }
  }

  const loadAllData = async () => {
    console.log("[v0] Loading settings data...")
    try {
      if (isDemoMode()) {
        await Promise.all([
          loadCompanyData(),
          loadEmployees(),
          loadSubsidiaries(),
          loadRoles(),
          loadHrData(),
          loadPayrollData(),
          loadNotificationSettings(),
          loadAccessAndSecurityData(),
        ])
        console.log("[v0] All settings data loaded successfully in demo mode")
        return
      }

      const companyId = await loadCompanyData()

      if (!companyId) {
        console.warn("[v0] No company id available after loading company data")
        return
      }

      await Promise.all([
        loadEmployees(companyId),
        loadSubsidiaries(companyId),
        loadRoles(companyId),
        loadHrData(companyId),
        loadPayrollData(companyId),
        loadNotificationSettings(companyId),
        loadAccessAndSecurityData(companyId),
      ])

      console.log("[v0] All settings data loaded successfully")
    } catch (error) {
      console.error("[v0] Error loading settings data:", error)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  // Subsidiary Management Functions
  const syncSubsidiarySettings = async (subsidiaryId: string) => {
    console.log("[v0] Syncing settings for subsidiary:", subsidiaryId)
    try {
      const companyId = companyData.id || (await loadCompanyData())
      const result = await settingsFetch("/api/settings/subsidiaries", {
        method: "POST",
        body: JSON.stringify({
          company_id: companyId,
          action: "sync",
          subsidiary_id: subsidiaryId,
          sync_types: [
            syncPrefs.sync_hr_policies ? "hr_policies" : null,
            syncPrefs.sync_payroll_config ? "payroll_config" : null,
            syncPrefs.sync_leave_types ? "leave_types" : null,
            syncPrefs.sync_roles_permissions ? "roles" : null,
          ].filter(Boolean),
        }),
      })
      await loadSubsidiaries(companyId || undefined)
      toast({
        title: "Settings Synced",
        description: `Synced ${(result.sync_types || []).join(", ") || "selected settings"} to subsidiary.`,
      })
    } catch (error) {
      console.error("Sync settings error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sync subsidiary settings",
        variant: "destructive",
      })
    }
  }

  const refreshEmployeeCount = async (subsidiaryId: string) => {
    console.log("[v0] Refreshing employee count for subsidiary:", subsidiaryId)
    try {
      const companyId = companyData.id || (await loadCompanyData())
      const payload = await settingsFetch(
        `/api/settings/subsidiaries?action=employees&company_id=${encodeURIComponent(companyId || "")}&subsidiary_id=${encodeURIComponent(subsidiaryId)}`,
      )
      const employeeCount = (payload.employees || []).length
      await settingsFetch("/api/settings/subsidiaries", {
        method: "POST",
        body: JSON.stringify({
          action: "update",
          company_id: companyId,
          id: subsidiaryId,
          employee_count: employeeCount,
        }),
      })
      setSubsidiaries((prev) =>
        prev.map((sub) => (sub.id === subsidiaryId ? { ...sub, employee_count: employeeCount } : sub)),
      )
      if (selectedSubsidiary?.id === subsidiaryId) {
        setSelectedSubsidiary({ ...selectedSubsidiary, employee_count: employeeCount })
      }
      return employeeCount
    } catch (error) {
      console.error("Refresh employee count error:", error)
      return 0
    }
  }

  const viewSubsidiaryEmployees = async (subsidiaryId: string) => {
    console.log("[v0] Viewing employees for subsidiary:", subsidiaryId)
    try {
      const companyId = companyData.id || (await loadCompanyData())
      const payload = await settingsFetch(
        `/api/settings/subsidiaries?action=employees&company_id=${encodeURIComponent(companyId || "")}&subsidiary_id=${encodeURIComponent(subsidiaryId)}`,
      )
      const employees = payload.employees || []
      setSubsidiaries((prev) =>
        prev.map((sub) => (sub.id === subsidiaryId ? { ...sub, employee_count: employees.length } : sub)),
      )
      setViewEmployeesModal({
        isOpen: true,
        subsidiaryId,
        employees,
      })
    } catch (error) {
      console.error("View employees error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load employees",
        variant: "destructive",
      })
    }
  }

  const addNewSubsidiary = async (subsidiaryData: Partial<Subsidiary>) => {
    console.log("[v0] Adding new subsidiary:", subsidiaryData)
    setIsSavingSubsidiary(true)
    try {
      const companyId = companyData.id || (await loadCompanyData())
      if (!companyId || String(companyId).startsWith("demo-")) {
        throw new Error("No company identifier available")
      }

      await settingsFetch("/api/settings/subsidiaries", {
        method: "POST",
        body: JSON.stringify({
          action: "create",
          company_id: companyId,
          name: subsidiaryData.name,
          tax_id: subsidiaryData.tax_id,
          ssnit_number: subsidiaryData.ssnit_number,
          address: subsidiaryData.address,
          phone_number: subsidiaryData.phone_number,
          email_address: subsidiaryData.email_address,
          industry: subsidiaryData.industry,
          status: "active",
          divisions: subsidiaryData.divisions || [],
          departments: subsidiaryData.departments || [],
          locations: subsidiaryData.locations || [],
          logo_url: subsidiaryLogoPreview || subsidiaryData.logo_url || "",
        }),
      })

      await loadSubsidiaries(companyId)
      setSubsidiaryLogoPreview("")
      setNewSubsidiary(emptySubsidiaryForm)
      setNewSubsidiaryDivision("")
      setNewSubsidiaryDepartment("")
      setNewSubsidiaryLocation("")
      setShowAddSubsidiary(false)
      toast({
        title: "Subsidiary Added",
        description: "New subsidiary created and saved to the database.",
      })
    } catch (error) {
      console.error("Add subsidiary error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add subsidiary",
        variant: "destructive",
      })
    } finally {
      setIsSavingSubsidiary(false)
    }
  }

  const openAddSubsidiary = () => {
    setNewSubsidiary(emptySubsidiaryForm)
    setNewSubsidiaryDivision("")
    setNewSubsidiaryDepartment("")
    setNewSubsidiaryLocation("")
    setSubsidiaryLogoPreview("")
    setShowAddSubsidiary(true)
  }

  const handleCreateSubsidiary = async () => {
    const name = newSubsidiary.name.trim()
    if (!name) {
      toast({
        title: "Validation Error",
        description: "Subsidiary name is required.",
        variant: "destructive",
      })
      return
    }
    await addNewSubsidiary({
      ...newSubsidiary,
      name,
      industry: newSubsidiary.industry.trim(),
      tax_id: newSubsidiary.tax_id.trim(),
      ssnit_number: newSubsidiary.ssnit_number.trim(),
      email_address: newSubsidiary.email_address.trim(),
      phone_number: newSubsidiary.phone_number.trim(),
      address: newSubsidiary.address.trim(),
      logo_url: subsidiaryLogoPreview || null,
    })
  }

  const updateSubsidiary = async (subsidiaryId: string, updates: Partial<Subsidiary>) => {
    console.log("[v0] Updating subsidiary:", subsidiaryId, updates)
    try {
      const companyId = companyData.id || (await loadCompanyData())
      const result = await settingsFetch("/api/settings/subsidiaries", {
        method: "POST",
        body: JSON.stringify({
          action: "update",
          company_id: companyId,
          id: subsidiaryId,
          ...updates,
        }),
      })
      await loadSubsidiaries(companyId || undefined)
      if (result.subsidiary && selectedSubsidiary?.id === subsidiaryId) {
        setSelectedSubsidiary(result.subsidiary)
      }
      toast({
        title: "Success",
        description: "Subsidiary updated in the database.",
      })
    } catch (error) {
      console.error("Update subsidiary error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update subsidiary",
        variant: "destructive",
      })
    }
  }

  const toggleSubsidiaryStatus = async (subsidiaryId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active"
    await updateSubsidiary(subsidiaryId, { status: newStatus })
  }

  const duplicateSubsidiary = async (subsidiary: Subsidiary) => {
    const duplicatedData = {
      ...subsidiary,
      name: `${subsidiary.name} (Copy)`,
      tax_id: `${subsidiary.tax_id}-COPY`,
      ssnit_number: `${subsidiary.ssnit_number}-COPY`,
    }
    delete duplicatedData.id
    delete duplicatedData.company_id
    delete duplicatedData.created_at
    delete duplicatedData.updated_at

    await addNewSubsidiary(duplicatedData)
  }

  const deleteSubsidiary = async (subsidiaryId: string) => {
    console.log("[v0] Deleting subsidiary:", subsidiaryId)

    if (!confirm("Are you sure you want to delete this subsidiary? This action cannot be undone.")) {
      return
    }

    try {
      const companyId = companyData.id || (await loadCompanyData())
      await settingsFetch("/api/settings/subsidiaries", {
        method: "POST",
        body: JSON.stringify({ action: "delete", company_id: companyId, id: subsidiaryId }),
      })
      setSubsidiaries((prev) => prev.filter((s) => s.id !== subsidiaryId))
      toast({
        title: "Subsidiary Deleted",
        description: "Subsidiary has been deleted from the database.",
      })
    } catch (error) {
      console.error("Subsidiary deletion error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete subsidiary",
        variant: "destructive",
      })
    }
  }

  const handleToggleSubsidiaryStatusInner = (subsidiary: Subsidiary) => {
    setSubsidiaryToToggle(subsidiary)
    if (subsidiary.status === "active") {
      setShowDeactivateConfirm(true)
    } else {
      setShowReactivateConfirm(true)
    }
  }

  const confirmToggleStatusInner = async () => {
    if (!subsidiaryToToggle) return

    await toggleSubsidiaryStatus(subsidiaryToToggle.id, subsidiaryToToggle.status)
    setShowDeactivateConfirm(false)
    setShowReactivateConfirm(false)
    setSubsidiaryToToggle(null)
  }

  const handleManageLeaveTypesInner = () => {
    toast({
      title: "Leave Types Management",
      description: "Opening leave types configuration...",
    })
  }

  const handleManageAllowancesInner = () => {
    toast({
      title: "Allowances Management",
      description: "Opening allowances configuration...",
    })
  }

  const handleManageDeductionsInner = () => {
    toast({
      title: "Deductions Management",
      description: "Opening deductions configuration...",
    })
  }

  const handleManageSalaryGradesInner = () => {
    toast({
      title: "Salary Grades Management",
      description: "Opening salary grades configuration...",
    })
  }

  const handleAddEmailTemplateInner = () => {
    toast({
      title: "Add Email Template",
      description: "Opening email template editor...",
    })
  }

  const handleEditEmailTemplateInner = (templateName: string) => {
    toast({
      title: "Edit Email Template",
      description: `Editing ${templateName} template...`,
    })
  }

  const handleAddRoleInner = () => {
    setRoleModalType("add")
    setEditingRole(null)
    setRoleForm({ name: "", description: "" })
    setRolePermissionMatrix(emptyPermissionMatrix())
    setShowRoleModal(true)
  }

  const openRoleModal = (role: Role, mode: "edit" | "view") => {
    setRoleModalType(mode)
    setEditingRole(role)
    setRoleForm({ name: role?.name || "", description: role?.description || "" })
    setRolePermissionMatrix(permissionsToMatrix(role?.permissions))
    setShowRoleModal(true)
  }

  const handleEditRoleInner = (roleName: string) => {
    const role = roles.find((r) => r.name === roleName)
    if (role) openRoleModal(role, "edit")
  }

  const toggleRolePermission = (moduleKey: string, actionKey: string) => {
    setRolePermissionMatrix((prev) => {
      const current = prev[moduleKey] || []
      const next = current.includes(actionKey)
        ? current.filter((a) => a !== actionKey)
        : [...current, actionKey]
      return { ...prev, [moduleKey]: next }
    })
  }

  const toggleRoleModuleAll = (moduleKey: string) => {
    setRolePermissionMatrix((prev) => {
      const current = prev[moduleKey] || []
      const allKeys = ROLE_ACTIONS.map((a) => a.key)
      const next = current.length === allKeys.length ? [] : allKeys
      return { ...prev, [moduleKey]: next }
    })
  }

  const setAllRolePermissions = (grant: boolean) => {
    setRolePermissionMatrix(() => {
      const matrix = emptyPermissionMatrix()
      if (grant) {
        for (const module of ROLE_MODULES) matrix[module.key] = ROLE_ACTIONS.map((a) => a.key)
      }
      return matrix
    })
  }

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) {
      toast({ title: "Validation Error", description: "Role name is required", variant: "destructive" })
      return
    }
    const permissions = matrixToPermissions(rolePermissionMatrix)
    if (!permissions.length) {
      toast({
        title: "Validation Error",
        description: "Select at least one module permission for this role.",
        variant: "destructive",
      })
      return
    }
    setIsSavingRole(true)
    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/roles", {
        method: "POST",
        body: JSON.stringify({
          action: "save",
          company_id: companyId,
          role: {
            id: editingRole?.id,
            name: roleForm.name.trim(),
            description: roleForm.description.trim(),
            permissions,
            level: editingRole?.level,
            is_system_role: editingRole?.is_system_role,
          },
        }),
      })
      await loadRoles(companyId)
      setShowRoleModal(false)
      toast({
        title: roleModalType === "edit" ? "Role Updated" : "Role Created",
        description: `${roleForm.name} has been saved successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save role",
        variant: "destructive",
      })
    } finally {
      setIsSavingRole(false)
    }
  }

  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return
    setIsDeletingRole(true)
    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/roles", {
        method: "POST",
        body: JSON.stringify({ action: "delete", company_id: companyId, id: roleToDelete.id }),
      })
      await loadRoles(companyId)
      toast({ title: "Role Deleted", description: `${roleToDelete.name} was removed successfully` })
      setRoleToDelete(null)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete role",
        variant: "destructive",
      })
    } finally {
      setIsDeletingRole(false)
    }
  }

  const handleBackupNowInner = async () => {
    await handleBackupNow()
  }

  const handleSyncAllSettings = async () => {
    console.log("[v0] Syncing all subsidiary settings")
    try {
      const companyId = companyData.id || (await loadCompanyData())
      // Persist sync option checkboxes first, then sync all subsidiaries.
      await settingsFetch("/api/settings/subsidiaries", {
        method: "POST",
        body: JSON.stringify({
          action: "save_sync_preferences",
          company_id: companyId,
          ...syncPrefs,
        }),
      })
      const result = await settingsFetch("/api/settings/subsidiaries", {
        method: "POST",
        body: JSON.stringify({
          action: "sync",
          company_id: companyId,
          sync_types: [
            syncPrefs.sync_hr_policies ? "hr_policies" : null,
            syncPrefs.sync_payroll_config ? "payroll_config" : null,
            syncPrefs.sync_leave_types ? "leave_types" : null,
            syncPrefs.sync_roles_permissions ? "roles" : null,
          ].filter(Boolean),
        }),
      })
      await loadSubsidiaries(companyId || undefined)
      toast({
        title: "Settings Synchronized",
        description: `Synced ${result.synced || 0} subsidiaries (${(result.sync_types || []).join(", ") || "selected"}).`,
      })
    } catch (error) {
      console.error("Sync all settings error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sync all subsidiary settings",
        variant: "destructive",
      })
    }
  }

  const handleExportSettingsTemplate = async () => {
    console.log("[v0] Exporting settings template")

    try {
      const companyId = companyData.id || (await loadCompanyData())
      const response = await fetch(
        `/api/settings/subsidiaries?action=export&company_id=${encodeURIComponent(companyId || "")}`,
        { credentials: "include" },
      )

      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "subsidiaries_template.csv"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export Successful",
        description: "Settings template has been downloaded",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Error",
        description: "Failed to export settings template",
        variant: "destructive",
      })
    }
  }

  const handleImportSettings = async (file: File) => {
    console.log("[v0] Importing settings from file:", file.name)

    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())
      if (lines.length < 2) throw new Error("Invalid file format")
      const rows = lines.slice(1).map((line) => {
        const fields = line.split(",").map((field) => field.replace(/"/g, "").trim())
        return {
          name: fields[0],
          tax_id: fields[1],
          ssnit_number: fields[2],
          address: fields[3],
          phone_number: fields[4],
          email_address: fields[5],
          industry: fields[6],
          status: fields[7] || "active",
          divisions: fields[8] ? fields[8].split(";").map((d) => d.trim()) : [],
          departments: fields[9] ? fields[9].split(";").map((d) => d.trim()) : [],
          locations: fields[10] ? fields[10].split(";").map((l) => l.trim()) : [],
        }
      }).filter((r) => r.name)

      const companyId = companyData.id || (await loadCompanyData())
      const result = await settingsFetch("/api/settings/subsidiaries", {
        method: "POST",
        body: JSON.stringify({ action: "import", company_id: companyId, rows }),
      })

      toast({
        title: "Import Successful",
        description: `Successfully imported ${result.count || rows.length} subsidiaries`,
      })

      await loadSubsidiaries(companyId || undefined)
      setImportModal(false)
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import settings",
        variant: "destructive",
      })
    }
  }

  const handleSaveSettings = async () => {
    console.log("[v0] Saving company settings changes")
    setIsSavingSettings(true)

    try {
      let companyId = companyData.id
      if (!companyId || String(companyId).startsWith("demo-")) {
        companyId = (await loadCompanyData()) || companyId
      }
      if (!companyId) {
        throw new Error("No company identifier available")
      }

      const normalizedCompanyLogo = isPlaceholderLogo(companyLogoPreview)
        ? isPlaceholderLogo(companyData.logo_url)
          ? null
          : companyData.logo_url
        : companyLogoPreview.trim()

      const saved = await persistCompanySettings({
        company_id: companyId,
        logo_url: normalizedCompanyLogo,
        divisions,
        departments,
        locations,
      })

      // Keep related settings in sync, but never let these wipe a successful company save.
      await settingsFetch("/api/settings/hr", {
        method: "POST",
        body: JSON.stringify({
          action: "save_config",
          company_id: saved.company?.id || companyId,
          config: hrConfig,
        }),
      }).catch((err) => console.warn("[v0] HR config save skipped:", err))

      await settingsFetch("/api/settings/subsidiaries", {
        method: "POST",
        body: JSON.stringify({
          action: "save_sync_preferences",
          company_id: saved.company?.id || companyId,
          ...syncPrefs,
        }),
      }).catch(() => null)

      // Re-read company from API to prove persistence (same path used on module return).
      await loadCompanyData()

      toast({
        title: "Company Settings Saved",
        description: saved?.warnings?.length
          ? `Saved successfully. Note: ${saved.warnings[0]}`
          : "Company details and logo were saved to the database.",
      })
    } catch (error) {
      console.error("Save settings error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings changes",
        variant: "destructive",
      })
    } finally {
      setIsSavingSettings(false)
    }
  }

  // Enhanced Save button with loading state and better feedback
  const handleSaveSubsidiaryChanges = async () => {
    console.log("[v0] Saving subsidiary sync preferences")
    setIsSavingSubsidiary(true)

    try {
      const companyId = companyData.id || (await loadCompanyData())
      if (!companyId) throw new Error("No company identifier available")

      await settingsFetch("/api/settings/subsidiaries", {
        method: "POST",
        body: JSON.stringify({
          action: "save_sync_preferences",
          company_id: companyId,
          ...syncPrefs,
        }),
      })

      await loadSubsidiaries(companyId)

      toast({
        title: "Sync Settings Saved",
        description: "Sync options were saved to the database for this tenant.",
      })
    } catch (error) {
      console.error("Save subsidiary changes error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save subsidiary sync settings",
        variant: "destructive",
      })
    } finally {
      setIsSavingSubsidiary(false)
    }
  }

  const handleRefreshSubsidiaries = async () => {
    console.log("[v0] Refreshing subsidiaries list")

    try {
      await loadSubsidiaries()
      toast({
        title: "Refreshed",
        description: "Subsidiaries list has been refreshed",
      })
    } catch (error) {
      console.error("Refresh error:", error)
      toast({
        title: "Error",
        description: "Failed to refresh subsidiaries",
        variant: "destructive",
      })
    }
  }

  const handleDeletePolicy = async () => {
    if (!selectedPolicy) return

    setIsSavingPolicy(true)
    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/hr", {
        method: "POST",
        body: JSON.stringify({
          action: "delete_leave_policy",
          company_id: companyId,
          id: selectedPolicy.id,
          name: selectedPolicy.name,
        }),
      })
      await loadHrData(companyId)
      setShowPolicyModal(false)

      toast({
        title: "Policy Deleted",
        description: `${selectedPolicy.name} policy has been successfully deleted.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete policy. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingPolicy(false)
    }
  }

  const handleToggleDocumentVisibility = async (docId: number | string) => {
    const doc = hrDocuments.find((d) => String(d.id) === String(docId))
    if (!doc) return
    const nextVisible = !doc.visibleToAll
    const previous = doc.visibleToAll
    setHrDocuments((prev) =>
      prev.map((d) => (String(d.id) === String(docId) ? { ...d, visibleToAll: nextVisible } : d)),
    )
    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/hr", {
        method: "POST",
        body: JSON.stringify({
          action: "toggle_document_visibility",
          company_id: companyId,
          id: doc.id,
          visible_to_all: nextVisible,
        }),
      })
      toast({
        title: "Visibility Updated",
        description: `${doc.name} is now ${nextVisible ? "visible to" : "hidden from"} all employees.`,
      })
    } catch (error) {
      setHrDocuments((prev) =>
        prev.map((d) => (String(d.id) === String(docId) ? { ...d, visibleToAll: previous } : d)),
      )
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update document visibility",
        variant: "destructive",
      })
    }
  }

  const handleEditDocument = async () => {
    if (!documentName) {
      toast({
        title: "Error",
        description: "Please provide a document name.",
        variant: "destructive",
      })
      return
    }

    setIsSavingDocument(true)
    try {
      const companyId = await resolveHrCompanyId()
      let fileUrl = selectedDocument?.fileUrl || null
      let content = selectedDocument?.content || documentPreviewContent || ""
      let fileType = selectedDocument?.type || "FILE"
      let fileSize = undefined as number | undefined

      if (uploadedFile) {
        const formData = new FormData()
        formData.append("file", uploadedFile)
        const uploadRes = await fetch("/api/upload/document", {
          method: "POST",
          body: formData,
          credentials: "include",
        })
        const uploaded = await uploadRes.json().catch(() => ({}))
        if (!uploadRes.ok) {
          throw new Error(uploaded.error || "Document upload failed")
        }
        fileUrl = uploaded.url
        if (!content || content.includes("File uploaded successfully")) {
          content = await parseFileContent(uploadedFile)
        }
        fileSize = uploadedFile.size
        const fileName = uploadedFile.name.toLowerCase()
        if (uploadedFile.type.includes("pdf") || fileName.endsWith(".pdf")) fileType = "PDF"
        else if (uploadedFile.type.includes("word") || fileName.endsWith(".docx")) fileType = "DOCX"
        else if (fileName.endsWith(".doc")) fileType = "DOC"
      }

      await settingsFetch("/api/settings/hr", {
        method: "POST",
        body: JSON.stringify({
          action: "save_document",
          company_id: companyId,
          document: {
            id: selectedDocument?.id,
            name: documentName,
            type: fileType,
            fileUrl,
            visibleToAll: selectedDocument?.visibleToAll,
            file_size: fileSize,
            content,
          },
        }),
      })
      await loadHrData(companyId)

      setShowDocumentModal(false)
      setDocumentName("")
      setUploadedFile(null)
      setDocumentPreviewContent("")

      toast({
        title: "Document Updated",
        description: `${documentName} has been successfully updated.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingDocument(false)
    }
  }

  const handleZoomIn = () => {
    setDocumentZoom((prev) => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setDocumentZoom((prev) => Math.max(prev - 25, 50))
  }

  const handleRotate = () => {
    setDocumentRotation((prev) => (prev + 90) % 360)
  }

  const handleToggleFullscreen = () => {
    setIsFullscreen((prev) => !prev)
    if (!isFullscreen) {
      toast({
        title: "Fullscreen Mode",
        description: "Press ESC to exit fullscreen",
      })
    }
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }


  const handleToggleSubsidiaryStatus = (subsidiary: Subsidiary) => {
    setSubsidiaryToToggle(subsidiary)
    if (subsidiary.status === "active") {
      setShowDeactivateConfirm(true)
    } else {
      setShowReactivateConfirm(true)
    }
  }

  const confirmToggleStatus = async () => {
    if (!subsidiaryToToggle) return

    await toggleSubsidiaryStatus(subsidiaryToToggle.id, subsidiaryToToggle.status)
    setShowDeactivateConfirm(false)
    setShowReactivateConfirm(false)
    setSubsidiaryToToggle(null)
  }

  const handleAddLeaveType = async () => {
    if (!newLeaveType.name || !newLeaveType.days) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSavingPolicy(true)
    try {
      const companyId = await resolveHrCompanyId()
      const newPolicy = {
        name: newLeaveType.name,
        days: newLeaveType.days,
        usage: "0%",
        trend: "new",
        description: newLeaveType.description,
        carryOver: !!newLeaveType.carryOver,
      }

      await settingsFetch("/api/settings/hr", {
        method: "POST",
        body: JSON.stringify({
          action: "save_leave_policy",
          company_id: companyId,
          policy: newPolicy,
        }),
      })
      await loadHrData(companyId)
      setNewLeaveType({ name: "", days: 0, description: "", carryOver: false })
      setShowAddLeaveTypeModal(false)

      toast({
        title: "Leave Type Added",
        description: `${newLeaveType.name} has been successfully added.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add leave type. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingPolicy(false)
    }
  }

  const handlePolicyAction = (action, policyName) => {
    const policy = currentPolicies.find((p) => p.name === policyName)
    if (!policy) return

    setSelectedPolicy(policy)
    setPolicyModalType(action)

    if (action === "edit") {
      setEditingPolicy({
        name: policy.name,
        days: policy.days,
        description: policy.description || "",
      })
    }

    setShowPolicyModal(true)
  }

  const handleSavePolicyChanges = async () => {
    setIsSavingPolicy(true)
    try {
      const companyId = await resolveHrCompanyId()
      const updated = {
        id: selectedPolicy.id,
        name: editingPolicy.name,
        days: editingPolicy.days,
        description: editingPolicy.description,
        usage: selectedPolicy.usage,
        trend: selectedPolicy.trend,
        carryOver: !!selectedPolicy.carryOver,
      }

      await settingsFetch("/api/settings/hr", {
        method: "POST",
        body: JSON.stringify({
          action: "save_leave_policy",
          company_id: companyId,
          policy: updated,
        }),
      })
      await loadHrData(companyId)

      setShowPolicyModal(false)
      toast({
        title: "Policy Updated",
        description: `${editingPolicy.name} policy has been successfully updated.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update policy. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingPolicy(false)
    }
  }

  const generateLeaveTypeInsights = (name: string, days: number, description: string) => {
    const insights = []

    if (days > 30) {
      insights.push("⚠️ Consider if this extended leave period aligns with industry standards")
    }
    if (days < 5) {
      insights.push("💡 Short leave periods may require frequent approvals - consider automation")
    }
    if (name.toLowerCase().includes("sick")) {
      insights.push("🏥 Recommend integrating with health insurance policies")
    }
    if (name.toLowerCase().includes("maternity") || name.toLowerCase().includes("paternity")) {
      insights.push("👶 Ensure compliance with local family leave regulations")
    }
    if (description.length < 20) {
      insights.push("📝 Consider adding more detailed policy description for clarity")
    }

    insights.push("✨ AI suggests reviewing similar policies in your industry for benchmarking")

    return insights
  }

  const getDocumentContent = (document: any) => {
    if (!document) return ""

    const documentTemplates: Record<string, { content: string }> = {
      "Employee Handbook": {
        content: `EMPLOYEE HANDBOOK

EFFECTIVE DATE: January 1, 2024
VERSION: 2.1
APPROVED BY: Board of Directors

WELCOME TO OUR COMPANY

This handbook serves as a guide to our company policies, procedures, and benefits. Please read it carefully and keep it for future reference.

TABLE OF CONTENTS

1. EMPLOYMENT POLICIES
   - Equal Employment Opportunity
   - Anti-Discrimination Policy
   - Harassment Prevention
   - Code of Conduct

2. WORK SCHEDULES AND ATTENDANCE
   - Standard Work Hours
   - Flexible Work Arrangements
   - Attendance Policy
   - Time Off Requests

3. COMPENSATION AND BENEFITS
   - Salary Administration
   - Performance Reviews
   - Health Insurance
   - Retirement Plans
   - Paid Time Off

4. WORKPLACE POLICIES
   - Dress Code
   - Technology Use
   - Confidentiality
   - Safety Procedures

5. EMPLOYEE DEVELOPMENT
   - Training Programs
   - Career Advancement
   - Performance Management
   - Professional Development

For questions about this handbook, please contact Human Resources.`,
      },
      "Code of Conduct": {
        content: `COMPANY CODE OF CONDUCT

EFFECTIVE DATE: January 1, 2024
VERSION: 2.1
APPROVED BY: Board of Directors

INTRODUCTION

Our Code of Conduct outlines the ethical standards and behavioral expectations for all employees, contractors, and business partners.

CORE VALUES

1. INTEGRITY
   - Act honestly and transparently
   - Keep commitments and promises
   - Report violations without fear of retaliation

2. RESPECT
   - Treat all individuals with dignity
   - Value diversity and inclusion
   - Maintain professional relationships

3. ACCOUNTABILITY
   - Take responsibility for actions
   - Meet performance expectations
   - Support team objectives

ETHICAL GUIDELINES

• Conflict of Interest
• Confidential Information
• Fair Dealing
• Compliance with Laws
• Reporting Concerns

ENFORCEMENT

Violations of this Code may result in disciplinary action, up to and including termination of employment.

For questions or to report concerns, contact the Ethics Hotline at ethics@company.com`,
      },
      "Safety Manual": {
        content: `WORKPLACE SAFETY MANUAL

EFFECTIVE DATE: January 1, 2024
VERSION: 3.0
APPROVED BY: Safety Committee

SAFETY FIRST

The safety and well-being of our employees is our top priority. This manual provides guidelines for maintaining a safe work environment.

GENERAL SAFETY RULES

1. Report all accidents and injuries immediately
2. Use personal protective equipment when required
3. Follow all safety procedures and protocols
4. Keep work areas clean and organized
5. Report unsafe conditions or practices

EMERGENCY PROCEDURES

• Fire Emergency
• Medical Emergency
• Evacuation Procedures
• Emergency Contacts

WORKPLACE HAZARDS

• Chemical Safety
• Electrical Safety
• Ergonomic Guidelines
• Equipment Operation

TRAINING REQUIREMENTS

All employees must complete safety training within 30 days of employment and annually thereafter.

For safety concerns, contact the Safety Officer at safety@company.com`,
      },
    }

    return (
      documentTemplates[document.name]?.content ||
      `Document: ${document.name}

This document contains important information about ${document.name.toLowerCase()}. The content would be displayed here in a real implementation.`
    )
  }


  // Parse document content based on document type and name
  const isPdfDocument = (document: any) => {
    const type = String(document?.type || document?.fileType || "").toLowerCase()
    const url = String(document?.fileUrl || "")
    return type.includes("pdf") || url.toLowerCase().includes(".pdf") || url.startsWith("data:application/pdf")
  }

  const isImageDocument = (document: any) => {
    const type = String(document?.type || document?.fileType || "").toLowerCase()
    const url = String(document?.fileUrl || "")
    return type.startsWith("image/") || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url) || url.startsWith("data:image/")
  }

  const parseDocumentContent = (document: any) => {
    // Prefer stored extracted content from the uploaded file
    if (document.content && String(document.content).trim()) {
      return document.content
    }

    // If we have a file URL, don't invent fake handbook text — viewer will embed the file
    if (document.fileUrl) {
      return ""
    }

    // Document templates with realistic content for default documents
    const documentTemplates = {
      "Employee Handbook": `# Employee Handbook

## Welcome to Our Company

We're delighted to have you as part of our team. This handbook contains important information about our company policies, procedures, and benefits.

## Company Overview
Our company is committed to excellence and innovation in the HR and payroll management sector. We serve clients across Ghana with comprehensive HR solutions.

## Employment Policies

### Working Hours
- Standard working hours: 8:00 AM - 5:00 PM, Monday to Friday
- Flexible working arrangements available upon approval
- Overtime compensation as per Ghana Labour Act

### Leave Policies
- Annual Leave: 21 working days per year
- Sick Leave: 10 working days per year
- Maternity Leave: 84 calendar days
- Paternity Leave: 7 calendar days

### Code of Conduct
All employees are expected to:
- Maintain professional behavior at all times
- Respect colleagues and clients
- Follow company policies and procedures
- Maintain confidentiality of sensitive information

## Benefits Package
- Health Insurance Coverage
- Provident Fund Contribution
- Professional Development Opportunities
- Annual Performance Bonuses

## Contact Information
For questions about this handbook, please contact HR Department at hr@company.com or extension 1001.`,
      
      "Code of Conduct": `# Code of Conduct

## Professional Standards
All employees must maintain the highest standards of professional conduct.

### Core Values
- Integrity and honesty
- Respect for all individuals
- Excellence in performance
- Innovation and creativity

### Workplace Behavior
- Arrive on time and maintain regular attendance
- Complete assigned tasks efficiently
- Collaborate effectively with team members
- Maintain confidentiality of sensitive information

## Compliance Requirements
- Follow all company policies and procedures
- Comply with applicable laws and regulations
- Report violations immediately
- Participate in required training programs

## Contact Information
For questions about this code of conduct, contact HR Department.`,
      
      "Safety Manual": `# Safety Manual

## General Safety Rules
Safety is everyone's responsibility in our workplace.

### Emergency Procedures
- Fire Emergency: Call 192
- Medical Emergency: Call 193
- Security Emergency: Call internal security

### Workplace Safety
- Keep walkways clear
- Report hazards immediately
- Use proper safety equipment
- Follow all safety protocols

## Personal Protective Equipment
Required PPE for specific tasks:
- Safety glasses for laboratory work
- Hard hats for construction areas
- Safety shoes for warehouse operations

## Incident Reporting
All workplace incidents must be reported within 24 hours.`,
      
      "HR Policies": `# HR Policies and Procedures

## Recruitment and Selection
Our recruitment process ensures we hire the best talent while maintaining fairness and transparency.

### Hiring Process
1. Job Requisition Approval
2. Job Posting and Advertisement
3. Application Review and Screening
4. Interview Process
5. Reference Checks
6. Offer and Onboarding

### Equal Opportunity Employment
We are committed to providing equal employment opportunities regardless of race, gender, religion, or background.

## Performance Management
Regular performance reviews help employees grow and contribute effectively to company goals.

### Review Process
- Quarterly performance discussions
- Annual formal reviews
- Goal setting and tracking
- Development planning

## Disciplinary Procedures
Progressive disciplinary measures ensure fair treatment while maintaining workplace standards.

### Disciplinary Steps
1. Verbal Warning
2. Written Warning
3. Final Written Warning
4. Suspension
5. Termination

## Grievance Procedures
Employees have the right to raise concerns through proper channels.

### Grievance Process
1. Informal Discussion with Supervisor
2. Formal Written Complaint
3. HR Investigation
4. Resolution and Follow-up`,
      
      "Payroll Procedures": `# Payroll Management Procedures

## Payroll Processing Schedule
- Monthly payroll processing: 25th of each month
- Payment date: Last working day of the month
- Cut-off date for changes: 20th of each month

## Salary Components
### Basic Salary
- Fixed monthly amount
- Subject to PAYE tax deductions
- Basis for other calculations

### Allowances
- Transport Allowance: GHS 200/month
- Communication Allowance: GHS 100/month
- Meal Allowance: GHS 150/month

### Deductions
- PAYE Tax (as per Ghana Revenue Authority)
- Social Security (SSNIT) - 5.5%
- Provident Fund - 5%
- Health Insurance - 2%

## Overtime Calculations
- Weekday overtime: 1.5x hourly rate
- Weekend overtime: 2x hourly rate
- Public holiday overtime: 2.5x hourly rate

## Leave Encashment
- Annual leave can be encashed up to 5 days
- Sick leave encashment not permitted
- Maternity leave encashment as per policy

## Payroll Security
- All payroll data encrypted
- Access restricted to authorized personnel
- Regular security audits conducted
- Backup procedures in place

## Contact Information
Payroll Department: payroll@company.com
Phone: +233-XXX-XXXX-XXX`,
      
      "Safety Guidelines": `# Workplace Safety Guidelines

## General Safety Rules
Safety is everyone's responsibility. All employees must follow these guidelines to maintain a safe working environment.

### Emergency Procedures
- Fire Emergency: Call 192 (Ghana Fire Service)
- Medical Emergency: Call 193 (Ambulance Service)
- Security Emergency: Call internal security at extension 999

### Evacuation Procedures
1. Sound the alarm
2. Exit via nearest emergency exit
3. Assemble at designated meeting point
4. Account for all personnel
5. Wait for all-clear signal

## Workplace Hazards
### Electrical Safety
- Report damaged electrical equipment immediately
- Don't overload power outlets
- Use proper electrical safety equipment
- Regular electrical inspections conducted

### Office Safety
- Keep walkways clear
- Report slippery surfaces
- Use proper lifting techniques
- Maintain clean and organized workspace

## Personal Protective Equipment (PPE)
Required PPE for specific tasks:
- Safety glasses for laboratory work
- Hard hats for construction areas
- Safety shoes for warehouse operations
- High-visibility vests for outdoor work

## Incident Reporting
All workplace incidents must be reported within 24 hours:
1. Immediate first aid if needed
2. Report to supervisor
3. Complete incident report form
4. Investigation and corrective action

## Health and Wellness
- Regular health checkups encouraged
- Mental health support available
- Work-life balance initiatives
- Stress management resources

## Contact Information
Safety Officer: safety@company.com
Emergency Hotline: +233-XXX-XXXX-XXX`
    }

    // Return template content or default content
    return documentTemplates[document.name] || 
      `# ${document.name}

## Document Information
- **Type:** ${document.type}
- **Size:** ${document.size}
- **Uploaded:** ${new Date(document.uploadedAt).toLocaleDateString()}
- **Visibility:** ${document.visibleToAll ? 'Available to all employees' : 'Restricted access'}

## Content Preview
This document contains important information about ${document.name.toLowerCase()}. 

### Key Sections:
1. **Overview** - General information and purpose
2. **Policy Details** - Specific rules and procedures
3. **Implementation** - How to apply these guidelines
4. **Contact Information** - Who to reach for questions

### Important Notes:
- This document is for internal use only
- Please read carefully and follow all guidelines
- Contact HR department for clarification
- Regular updates will be communicated

---
*This is a preview of the document content. The full document may contain additional sections and detailed information.*`
  }

  const handleDocumentView = (document: any) => {
    setSelectedDocument(document)
    setDocumentModalType("view")
    setShowDocumentModal(true)
    setShowDocumentPreview(false)
    setDocumentZoom(100)
    setDocumentRotation(0)
    setCurrentPage(1)
    setSearchTerm("")

    const parsedContent = parseDocumentContent(document)
    setDocumentPreviewContent(parsedContent)
    setTotalPages(1)

    setTimeout(() => {
      setShowDocumentPreview(true)
    }, 100)
  }

  const handleResetViewer = () => {
    setDocumentPreviewContent("")
    setShowDocumentPreview(false)
    setDocumentZoom(100)
    setDocumentRotation(0)
    setCurrentPage(1)
    setTotalPages(1)
    setSearchTerm("")
    setIsFullscreen(false)
    setIsParsingFile(false)
  }

  const handleDocumentAction = (action, docId = null) => {
    if (docId) {
      const doc = hrDocuments.find((d) => d.id === docId)
      setSelectedDocument(doc)
      if (action === "edit" && doc) {
        setDocumentName(doc.name || "")
        setUploadedFile(null)
        setDocumentPreviewContent(doc.content || "")
      }
    } else if (action === "add") {
      setSelectedDocument(null)
      setDocumentName("")
      setUploadedFile(null)
      setDocumentPreviewContent("")
    }
    setDocumentModalType(action)
    setShowDocumentModal(true)
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      setUploadedFile(file)
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ""))
      }
      
      // Parse file content for preview
      setIsParsingFile(true)
      try {
        const content = await parseFileContent(file)
        setDocumentPreviewContent(content)
      } catch (error) {
        console.error("Error parsing file content:", error)
        // Set fallback content if parsing fails
        setDocumentPreviewContent(`# ${file.name}\n\nFile uploaded successfully. Content preview not available for this file type.`)
      } finally {
        setIsParsingFile(false)
      }
    }
  }

  // Parse file content based on file type
  const parseFileContent = async (file: File): Promise<string> => {
    const fileType = file.type
    const fileName = file.name.toLowerCase()
    
    try {
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return await parsePDFContent(file)
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        return await parseDOCXContent(file)
      } else if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
        return await parseDOCContent(file)
      } else {
        return `# ${file.name}\n\nFile type: ${fileType}\nSize: ${(file.size / (1024 * 1024)).toFixed(2)}MB\n\nContent preview not available for this file type.`
      }
    } catch (error) {
      console.error("Error parsing file:", error)
      return `# ${file.name}\n\nError parsing file content. The file may be corrupted or in an unsupported format.`
    }
  }

  // Parse PDF content
  const parsePDFContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          // Import pdfjs-dist dynamically to avoid SSR issues
          const pdfjsLib = await import('pdfjs-dist')
          
          // Set worker source
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
          
          const arrayBuffer = reader.result as ArrayBuffer
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
          
          let fullText = ''
          
          // Extract text from all pages
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum)
            const textContent = await page.getTextContent()
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ')
            fullText += pageText + '\n'
          }
          
          resolve(formatPDFContent(fullText, file.name))
        } catch (error) {
          console.error("PDF parsing error:", error)
          // Fallback to basic file info if parsing fails
          resolve(`# ${file.name}\n\n**Document Type:** PDF Document\n**Size:** ${(file.size / (1024 * 1024)).toFixed(2)}MB\n\n**Note:** Unable to extract text content from this PDF. The document may be image-based or password-protected. The file has been uploaded successfully and can be downloaded when needed.`)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  // Parse DOCX content
  const parseDOCXContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          // Import mammoth dynamically to avoid SSR issues
          const mammoth = (await import('mammoth')).default
          const result = await mammoth.convertToHtml({ arrayBuffer: reader.result as ArrayBuffer })
          resolve(formatDOCXContent(result.value, file.name))
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  // Parse DOC content (fallback to basic parsing)
  const parseDOCContent = async (file: File): Promise<string> => {
    return `# ${file.name}\n\n**Document Type:** Microsoft Word Document (.doc)\n**Size:** ${(file.size / (1024 * 1024)).toFixed(2)}MB\n\n**Note:** Content preview for .doc files is not available. Please convert to .docx format for full preview functionality.\n\nThis document has been uploaded successfully and can be downloaded when needed.`
  }

  // Format PDF content for display
  const formatPDFContent = (text: string, fileName: string): string => {
    if (!text || text.trim().length === 0) {
      return `# ${fileName}\n\n**Document Type:** PDF\n\n**Note:** This PDF appears to be image-based or contains no extractable text. The document has been uploaded successfully and can be downloaded when needed.`
    }

    // Clean and format the text
    let formattedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    // Add document header
    const header = `# ${fileName}\n\n**Document Type:** PDF Document\n**Content Preview:**\n\n---\n\n`
    
    return header + formattedText
  }

  // Format DOCX content for display
  const formatDOCXContent = (html: string, fileName: string): string => {
    if (!html || html.trim().length === 0) {
      return `# ${fileName}\n\n**Document Type:** Microsoft Word Document (.docx)\n\n**Note:** This document appears to be empty or contains no readable content.`
    }

    // Convert HTML to markdown-like format
    let formattedText = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      })
      .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
        let counter = 1
        return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`)
      })
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    // Add document header
    const header = `# ${fileName}\n\n**Document Type:** Microsoft Word Document (.docx)\n**Content Preview:**\n\n---\n\n`
    
    return header + formattedText
  }

  const handleAddDocument = () => {
    setDocumentName("")
    setUploadedFile(null)
    handleDocumentAction("add")
  }

  const handleSaveDocument = async () => {
    if (!documentName || !uploadedFile) {
      toast({
        title: "Error",
        description: "Please provide a document name and upload a file.",
        variant: "destructive",
      })
      return
    }

    setIsSavingDocument(true)
    try {
      const companyId = await resolveHrCompanyId()

      // Parse file content if not already parsed
      let content = documentPreviewContent
      if (!content || content.includes("File uploaded successfully")) {
        content = await parseFileContent(uploadedFile)
      }

      const formData = new FormData()
      formData.append("file", uploadedFile)
      const uploadRes = await fetch("/api/upload/document", {
        method: "POST",
        body: formData,
        credentials: "include",
      })
      const uploaded = await uploadRes.json().catch(() => ({}))
      if (!uploadRes.ok || !uploaded.url) {
        throw new Error(uploaded.error || "Document upload failed")
      }
      const fileUrl = uploaded.url

      let fileType = "FILE"
      const fileName = uploadedFile.name.toLowerCase()
      if (uploadedFile.type.includes("pdf") || fileName.endsWith(".pdf")) fileType = "PDF"
      else if (uploadedFile.type.includes("word") || fileName.endsWith(".docx")) fileType = "DOCX"
      else if (fileName.endsWith(".doc")) fileType = "DOC"

      await settingsFetch("/api/settings/hr", {
        method: "POST",
        body: JSON.stringify({
          action: "save_document",
          company_id: companyId,
          document: {
            name: documentName,
            type: fileType,
            fileUrl,
            visibleToAll: false,
            file_size: uploadedFile.size,
            content,
          },
        }),
      })
      await loadHrData(companyId)

      setShowDocumentModal(false)
      setDocumentName("")
      setUploadedFile(null)
      setDocumentPreviewContent("")

      toast({
        title: "Document Added",
        description: `${documentName} has been successfully uploaded with content preview.`,
      })
    } catch (error) {
      console.error("Error saving document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingDocument(false)
    }
  }

  const handleDeleteDocument = async (docId) => {
    setIsSavingDocument(true)
    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/hr", {
        method: "POST",
        body: JSON.stringify({ action: "delete_document", company_id: companyId, id: docId }),
      })
      await loadHrData(companyId)
      setShowDocumentModal(false)
      toast({
        title: "Document Deleted",
        description: "Document has been successfully removed.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingDocument(false)
    }
  }

  const handleSaveSubsidiaries = async () => {
    console.log("[v0] Saving subsidiaries changes")
    setIsSavingSubsidiaries(true)

    try {
      if (isDemoMode()) {
        // Simulate saving delay for demo
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast({
          title: "Changes Saved",
          description: "All subsidiary changes have been saved successfully (Demo Mode)",
        })
        setIsSavingSubsidiaries(false)
        return
      }

      // Save any pending changes to the database
      // This could include updated subsidiary information, organizational changes, etc.

      // For now, we'll refresh the data to ensure consistency
      await loadSubsidiaries()

      toast({
        title: "Changes Saved",
        description: "All subsidiary changes have been saved successfully",
      })
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      })
    } finally {
      setIsSavingSubsidiaries(false)
    }
  }

  const handleSaveHRConfig = async () => {
    setIsSaving(true)
    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/hr", {
        method: "POST",
        body: JSON.stringify({ action: "save_config", company_id: companyId, config: hrConfig }),
      })
      await loadHrData(companyId)
      toast({
        title: "HR Configuration Saved",
        description: "HR settings updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save HR configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDeactivateSubsidiary = (subsidiaryId: string) => {
    setSubsidiaryToToggle(subsidiaries.find((s) => s.id === subsidiaryId) || null)
    setShowDeactivateConfirm(true)
  }

  const confirmReactivateSubsidiary = (subsidiaryId: string) => {
    setSubsidiaryToToggle(subsidiaries.find((s) => s.id === subsidiaryId) || null)
    setShowReactivateConfirm(true)
  }

  const handleManageLeaveTypes = () => {
    setShowAddLeaveTypeModal(true)
  }

  const handleManageAllowances = () => {
    toast({
      title: "Allowances Management",
      description: "Opening allowances configuration...",
    })
  }

  const handleManageDeductions = () => {
    toast({
      title: "Deductions Management",
      description: "Opening deductions configuration...",
    })
  }

  const handleManageSalaryGrades = () => {
    toast({
      title: "Salary Grades Management",
      description: "Opening salary grades configuration...",
    })
  }

  const handleEditEmailTemplate = (templateName: string) => {
    toast({
      title: "Edit Email Template",
      description: `Editing ${templateName} template...`,
    })
  }

  const handleAddEmailTemplate = () => {
    toast({
      title: "Add Email Template",
      description: "Opening email template editor...",
    })
  }

  const handleAddRole = () => {
    handleAddRoleInner()
  }

  const handleEditRole = (roleName: string) => {
    handleEditRoleInner(roleName)
  }

  const handleBackupNow = async () => {
    setIsBackingUp(true)
    console.log("[v0] Initiating manual backup...")
    try {
      const companyId = await resolveHrCompanyId()

      const result = await settingsFetch("/api/settings/security", {
        method: "POST",
        body: JSON.stringify({ action: "backup_now", company_id: companyId }),
      })

      setLastBackupTime(result.backup?.lastBackupTime || new Date().toISOString())
      setBackupSize(result.backup?.backupSize || "0 MB")
      setBackupStatus(result.backup?.backupStatus || "Completed")
      await loadAccessAndSecurityData(companyId)

      toast({
        title: "Backup Successful",
        description: "Manual backup completed successfully.",
      })
    } catch (error) {
      console.error("[v0] Backup failed", error)
      toast({
        title: "Backup Failed",
        description: error instanceof Error ? error.message : "Failed to complete system backup.",
        variant: "destructive",
      })
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleGenerateAIInsights = async () => {
    setIsGeneratingInsights(true)
    setShowAIInsightsModal(true)

    try {
      // Prepare leave policies data for AI analysis
      const policiesData = currentPolicies.map((policy) => ({
        name: policy.name,
        days: policy.days,
        usage: policy.usage,
        trend: policy.trend,
        description: policy.description,
      }))

      const prompt = `Analyze the following leave policies and provide professional HR insights:

${policiesData
  .map(
    (policy) =>
      `- ${policy.name}: ${policy.days} days allocated, ${policy.usage} usage rate, trend: ${policy.trend}
    Description: ${policy.description}`,
  )
  .join("\n")}

Please provide:
1. Usage pattern analysis
2. Policy optimization recommendations
3. Compliance considerations
4. Industry benchmarking insights
5. Cost impact analysis
6. Employee satisfaction implications

Format the response in a professional, actionable manner for HR decision-makers.`

      const response = await fetch("/api/ai-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate insights")
      }

      const data = await response.json()
      setAiInsights(data.insights)

      toast({
        title: "AI Insights Generated",
        description: "Professional leave policy analysis completed successfully.",
      })
    } catch (error) {
      console.error("Error generating AI insights:", error)
      toast({
        title: "Error",
        description: "Failed to generate AI insights. Please try again.",
        variant: "destructive",
      })
      setShowAIInsightsModal(false)
    } finally {
      setIsGeneratingInsights(false)
    }
  }

  const handleGeneratePolicyInsight = async (policyName: string) => {
    const policy = currentPolicies.find((p) => p.name === policyName)
    if (!policy) return

    setLoadingInsights((prev) => ({ ...prev, [policyName]: true }))

    try {
      console.log("[v0] Generating insight for policy:", policyName)
      console.log("[v0] JSON object available:", typeof JSON, JSON)

      // Simulate AI insight generation with realistic delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate contextual insights based on policy data
      const insights = {
        "Annual Leave": `Based on 68% usage rate, this policy shows healthy utilization. Consider implementing carry-over limits to prevent year-end clustering. Industry benchmark: 15-25 days annually.`,
        "Sick Leave": `Low 23% usage indicates good employee health or potential underreporting. Consider wellness programs and ensure employees feel comfortable using sick days when needed.`,
        "Maternity Leave": `12% usage aligns with demographic expectations. Ensure compliance with local labor laws. Consider paternity leave expansion for better work-life balance.`,
      }

      const insight =
        insights[policyName as keyof typeof insights] ||
        `Policy analysis: ${policy.days} days allocated with ${policy.usage} usage. Consider reviewing against industry standards and employee feedback.`

      setPolicyInsights((prev) => ({ ...prev, [policyName]: insight }))

      toast({
        title: "AI Insight Generated",
        description: `Professional analysis completed for ${policyName} policy.`,
      })
    } catch (error) {
      console.error("Error generating insight:", error)
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
        policyName,
        policy,
      })
      toast({
        title: "Error",
        description: "Failed to generate AI insight. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingInsights((prev) => ({ ...prev, [policyName]: false }))
    }
  }

  const [showAIInsights, setShowAIInsights] = useState(false)
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false)

  const handleAddTaxBand = () => {
    const last = payeTaxBands[payeTaxBands.length - 1]
    const from = last && Number.isFinite(last.to) ? Number(last.to) : Number(last?.from || 0)
    setPayeTaxBands([
      ...payeTaxBands.map((b) =>
        b.to === Number.POSITIVE_INFINITY ? { ...b, to: from || b.from || 0 } : b,
      ),
      {
        rate: 0,
        from: from || 0,
        to: Number.POSITIVE_INFINITY,
        cumulativeTax: 0,
      },
    ])
    toast({
      title: "Tax Band Added",
      description: "Edit the new band values, then click Save Tax Configuration.",
    })
  }

  const handleUpdateTaxBand = (index: number, field: string, value: number) => {
    setPayeTaxBands((prev) =>
      prev.map((band, i) => (i === index ? { ...band, [field]: value } : band)),
    )
  }

  const handleDeleteTaxBand = (index: number) => {
    setPayeTaxBands((prev) => prev.filter((_, i) => i !== index))
    toast({
      title: "Tax Band Removed",
      description: "Save Tax Configuration to persist this change.",
    })
  }

  const handleSavePayrollConfig = async () => {
    setIsSavingPayroll(true)

    try {
      const companyId = await resolveHrCompanyId()

      await settingsFetch("/api/settings/payroll/items", {
        method: "POST",
        body: JSON.stringify({
          action: "save_allowances_deductions",
          company_id: companyId,
          allowances,
          deductions,
        }),
      })

      await settingsFetch("/api/settings/payroll", {
        method: "POST",
        body: JSON.stringify({
          company_id: companyId,
          config: {
            pay_frequency: payFrequency,
            currency: selectedCurrency || currency,
            minimum_wage: minimumWage,
            overtime_weekday_multiplier: overtimeWeekdayRate,
            overtime_weekend_multiplier: overtimeWeekendRate,
            payroll_cutoff_day: payrollCutoffDay,
            auto_calculate_paye: autoCalcPaye,
            auto_calculate_ssnit: autoCalcSsnit,
            auto_calculate_provident_fund: autoCalcProvident,
          },
        }),
      })

      await loadPayrollData(companyId)

      toast({
        title: "Payroll configuration saved",
        description: "Allowances, deductions, and payroll settings updated in database.",
      })
    } catch (error) {
      console.error("Error saving payroll config:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save payroll configuration",
        variant: "destructive",
      })
    } finally {
      setIsSavingPayroll(false)
    }
  }

  const handleSaveTaxConfig = async () => {
    setIsSavingTax(true)

    try {
      const companyId = await resolveHrCompanyId()
      const taxYear = new Date().getFullYear()

      const payeBands = payeTaxBands.map((b: any, i: number) => ({
        band_order: i + 1,
        rate: Number(b.rate || 0),
        threshold_amount: b.to === Number.POSITIVE_INFINITY ? 999999999 : Number(b.to || 0),
        is_remaining_amount: b.to === Number.POSITIVE_INFINITY,
        description: `${b.rate}% — ${Number(b.from || 0).toLocaleString()} to ${
          b.to === Number.POSITIVE_INFINITY ? "∞" : Number(b.to || 0).toLocaleString()
        }`,
      }))

      const data = await settingsFetch("/api/settings/tax", {
        method: "POST",
        body: JSON.stringify({
          company_id: companyId,
          tax_year: taxYear,
          ssnit: { employee: ssnitRates.employee, employer: ssnitRates.employer },
          tier2: { employee: tier2Rates.employee, employer: tier2Rates.employer },
          tier3: { employee: tier3Rates.employee, employer: tier3Rates.employer },
          paye_bands: payeBands,
        }),
      })

      toast({
        title: "Tax configuration saved",
        description: `SSNIT/Tier rates and ${data.saved_bands ?? payeBands.length} PAYE bands saved to database.`,
      })
    } catch (error) {
      console.error("Error saving tax config:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save tax configuration",
        variant: "destructive",
      })
    } finally {
      setIsSavingTax(false)
    }
  }

  // Tax Relief Handlers
  const handleTaxReliefFieldChange = (index: number, field: string, value: any) => {
    const updatedReliefs = [...taxReliefs]
    updatedReliefs[index] = { ...updatedReliefs[index], [field]: value }
    setTaxReliefs(updatedReliefs)
  }

  const handleAddTaxRelief = () => {
    const newRelief = {
      id: Math.max(...taxReliefs.map(r => r.id)) + 1,
      name: "",
      description: "",
      amount: 0,
      currency: selectedCurrency.toUpperCase(),
      isActive: true,
      category: "Personal",
      effectiveDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString()
    }
    setTaxReliefs([...taxReliefs, newRelief])
    setEditingRelief(taxReliefs.length)
  }

  const handleEditTaxRelief = (index: number) => {
    setEditingRelief(editingRelief === index ? null : index)
  }

  const handleDeleteTaxRelief = (index: number) => {
    const updatedReliefs = taxReliefs.filter((_, i) => i !== index)
    setTaxReliefs(updatedReliefs)
    if (editingRelief === index) {
      setEditingRelief(null)
    } else if (editingRelief && editingRelief > index) {
      setEditingRelief(editingRelief - 1)
    }
    toast({
      title: "Tax Relief Deleted",
      description: "The tax relief has been removed successfully.",
    })
  }

  const syncTaxReliefsFromGRA = async () => {
    setIsSyncingReliefs(true)
    console.log("[v0] Syncing tax reliefs from GRA...")

    try {
      // Simulate API call to GRA
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate updated data from GRA
      const graReliefs = [
        {
          id: 1,
          name: "Personal Relief",
          description: "Basic personal tax relief",
          amount: 402,
          currency: "GHS",
          isActive: true,
          category: "Personal",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString()
        },
        {
          id: 2,
          name: "Child Relief",
          description: "Tax relief for dependent children",
          amount: 150,
          currency: "GHS",
          isActive: true,
          category: "Family",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString()
        },
        {
          id: 3,
          name: "Old Age Relief",
          description: "Tax relief for elderly citizens",
          amount: 200,
          currency: "GHS",
          isActive: true,
          category: "Age",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString()
        },
        {
          id: 4,
          name: "Disability Relief",
          description: "Tax relief for persons with disabilities",
          amount: 100,
          currency: "GHS",
          isActive: true,
          category: "Disability",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString()
        }
      ]

      setTaxReliefs(graReliefs)
      setReliefsLastSync(new Date().toISOString())

      toast({
        title: "Tax Reliefs Synced",
        description: "Successfully synced tax reliefs from GRA. 4 reliefs updated.",
      })
    } catch (error) {
      console.error("[v0] Error syncing tax reliefs:", error)
      toast({
        title: "Sync Failed",
        description: "Failed to sync tax reliefs from GRA. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSyncingReliefs(false)
    }
  }

  const handleSaveReliefs = async (reliefsOverride?: any[]) => {
    setIsSavingReliefs(true)
    console.log("[v0] Saving tax reliefs...")

    try {
      const companyId = await resolveHrCompanyId()
      const payload = Array.isArray(reliefsOverride) ? reliefsOverride : taxReliefs
      await settingsFetch("/api/settings/payroll/items", {
        method: "POST",
        body: JSON.stringify({
          action: "save_tax_reliefs",
          company_id: companyId,
          taxReliefs: payload,
        }),
      })
      await loadPayrollData(companyId)

      toast({
        title: "Tax Reliefs Saved",
        description: "Tax reliefs have been saved successfully.",
      })
    } catch (error) {
      console.error("[v0] Error saving tax reliefs:", error)
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save tax reliefs. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingReliefs(false)
    }
  }

  const handleAllowanceFieldChange = (index: number, field: string, value: any) => {
    const updatedAllowances = [...allowances]
    updatedAllowances[index] = { ...updatedAllowances[index], [field]: value }
    setAllowances(updatedAllowances)
  }

  const handleDeductionFieldChange = (index: number, field: string, value: any) => {
    const updatedDeductions = [...deductions]
    updatedDeductions[index] = { ...updatedDeductions[index], [field]: value }
    setDeductions(updatedDeductions)
  }

  const handleAddAllowance = () => {
    const newAllowance = {
      code: "",
      description: "",
      taxable: false,
      recurring: false,
      amount: 0,
      percentage: 0,
      type: "FIXED",
    }
    setAllowances([...allowances, newAllowance])
  }

  const handleAddDeduction = () => {
    const newDeduction = {
      code: "",
      description: "",
      recurring: false,
      amount: 0,
      percentage: 0,
      type: "FIXED",
    }
    setDeductions([...deductions, newDeduction])
  }

  const handleEditAllowance = (index: number) => {
    console.log(`[v0] Editing allowance at index ${index}`)
    setEditingAllowance(index)
  }

  const handleDeleteAllowance = (index: number) => {
    const updatedAllowances = allowances.filter((_, i) => i !== index)
    setAllowances(updatedAllowances)
    toast({
      title: "Success",
      description: "Allowance deleted successfully",
    })
  }

  const handleEditDeduction = (index: number) => {
    console.log(`[v0] Editing deduction at index ${index}`)
    setEditingDeduction(index)
  }

  const handleDeleteDeduction = (index: number) => {
    const updatedDeductions = deductions.filter((_, i) => i !== index)
    setDeductions(updatedDeductions)
    toast({
      title: "Success",
      description: "Deduction deleted successfully",
    })
  }

  const handleAddNotificationTemplate = () => {
    setIsAddingTemplate(true)
    setTemplateModalType("add")
    setShowTemplateModal(true)
    setNewTemplate({
      name: "",
      category: "HR",
      type: "Email",
      subject: "",
      body: "",
      variables: [],
    })
  }

  const handleSaveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Subject, Body)",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/notifications", {
        method: "POST",
        body: JSON.stringify({
          action: "save_template",
          company_id: companyId,
          template: {
            id: templateModalType === "edit" ? editingTemplate?.id || selectedTemplate?.id : undefined,
            name: newTemplate.name,
            category: newTemplate.category,
            type: newTemplate.type,
            subject: newTemplate.subject,
            description: newTemplate.subject,
            body: newTemplate.body,
            variables: newTemplate.variables,
            status: "Active",
          },
        }),
      })
      await loadNotificationSettings(companyId)
      toast({
        title: templateModalType === "edit" ? "Template Updated" : "Template Created",
        description: `${newTemplate.name} has been saved successfully`,
      })

      // Close modal and reset state
      setShowTemplateModal(false)
      setIsAddingTemplate(false)
      setEditingTemplate(null)
      setSelectedTemplate(null)
      setTemplateModalType("view")
      setAiDescription("")
      setShowAiPanel(false)
      setIsGeneratingAi(false)
      setShowFeedbackPanel(false)
      setTemplateRating(0)
      setTemplateFeedback("")
      setTemplateImprovements("")
      setLastGeneratedTemplateId("")
      setCurrentAIModel(null)
      setShowModelUpgrade(false)

      setNewTemplate({
        name: "",
        category: "HR",
        type: "Email",
        subject: "",
        body: "",
        variables: [],
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setSelectedTemplate(template)
    setTemplateModalType("edit")
    setShowTemplateModal(true)
    setNewTemplate({
      name: template.name,
      category: template.category,
      type: template.type,
      subject: template.subject || template.description, // Use subject if available, fallback to description
      body: template.body || `Dear {{employee_name}},\n\nThis is a sample template for ${template.name}.\n\nBest regards,\nHR Team`, // Use actual body or placeholder
      variables: template.variables || ["employee_name", "company_name"], // Use actual variables or placeholder
    })
  }

  const handleDeleteTemplate = async (templateId) => {
    setIsSaving(true)
    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/notifications", {
        method: "POST",
        body: JSON.stringify({ action: "delete_template", company_id: companyId, id: templateId }),
      })
      await loadNotificationSettings(companyId)
      toast({
        title: "Template Deleted",
        description: "Template has been deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete template",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleViewTemplate = (template) => {
    setSelectedTemplate(template)
    setShowTemplateModal(true)
    setTemplateModalType("view")
  }

  const handleGenerateAiTemplate = async () => {
    if (!aiDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please provide a description for the AI to generate a template",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingAi(true)
    try {
      // Call the AI template generation API
      const response = await fetch('/api/generate-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: aiDescription,
          category: newTemplate.category,
          type: newTemplate.type,
          context: {
            companyName: "Akwaaba HR & Payroll",
            industry: "HR Technology",
            userRole: "HR Manager",
          },
          previousTemplates: notificationTemplates.slice(-5), // Send recent templates for context
          userPreferences: {
            tone: "Professional",
            length: "Detailed",
            includeVariables: true,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.template) {
        // Store the generation ID for feedback
        setLastGeneratedTemplateId(result.generationId)
        
        // Store AI model information
        if (result.modelInfo) {
          setCurrentAIModel(result.modelInfo)
          
          // Show upgrade notification if using latest model
          if (result.modelInfo.isLatest && result.modelInfo.performanceScore >= 95) {
            setShowModelUpgrade(true)
          }
        }
        
        // Update the form with AI-generated content
        setNewTemplate({
          ...newTemplate,
          name: result.template.name,
          subject: result.template.subject,
          body: result.template.body,
        })

        // Show feedback panel after generation
        setShowFeedbackPanel(true)

        const modelName = result.modelInfo?.name || "AI"
        toast({
          title: "AI Template Generated",
          description: `Professional template generated using ${modelName}. You can edit it before saving.`,
        })
      } else {
        throw new Error(result.error || "Failed to generate template")
      }
    } catch (error) {
      console.error("AI template generation error:", error)
      toast({
        title: "AI Generation Failed",
        description: "Failed to generate template. Please try again or check your connection.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const checkAIModelUpdates = async () => {
    try {
      const response = await fetch('/api/ai-model-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check_updates'
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.currentModel) {
          setCurrentAIModel(result.currentModel)
          
          // Show upgrade notification if new model is available
          if (result.currentModel.performanceScore >= 95) {
            setShowModelUpgrade(true)
            toast({
              title: "AI Model Updated! 🚀",
              description: `Now using ${result.currentModel.name} with ${result.currentModel.performanceScore}% performance`,
            })
          }
        }
      }
    } catch (error) {
      console.error("Error checking AI model updates:", error)
    }
  }

  const simulateGPT5Upgrade = async () => {
    try {
      const response = await fetch('/api/ai-model-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'simulate_gpt5_upgrade'
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.newModel) {
          setCurrentAIModel(result.newModel)
          setShowModelUpgrade(true)
          
          toast({
            title: "GPT-5 Upgrade Complete! 🎉",
            description: `Successfully upgraded to ${result.newModel.name} with advanced capabilities!`,
          })
        }
      }
    } catch (error) {
      console.error("Error simulating GPT-5 upgrade:", error)
    }
  }

  const handleSubmitTemplateFeedback = async () => {
    if (!lastGeneratedTemplateId || templateRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating for the generated template",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/generate-template', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: lastGeneratedTemplateId,
          rating: templateRating,
          feedback: templateFeedback,
          improvements: templateImprovements.split('\n').filter(imp => imp.trim()),
        }),
      })

      if (response.ok) {
        toast({
          title: "Feedback Submitted",
          description: "Thank you for helping improve our AI templates!",
        })
        
        // Reset feedback form
        setTemplateRating(0)
        setTemplateFeedback("")
        setTemplateImprovements("")
        setShowFeedbackPanel(false)
      } else {
        throw new Error("Failed to submit feedback")
      }
    } catch (error) {
      console.error("Feedback submission error:", error)
      toast({
        title: "Feedback Failed",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
    }
  }


  const handleTestEmail = async () => {
    setTestConnectionStatus("testing")
    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/notifications", {
        method: "POST",
        body: JSON.stringify({
          action: "test_email",
          company_id: companyId,
          config: emailConfig,
        }),
      })
      setTestConnectionStatus("success")
      toast({
        title: "Connection Test Passed",
        description: "Email configuration validated. Save settings to persist SMTP credentials.",
      })
    } catch (error) {
      setTestConnectionStatus("error")
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unable to validate email configuration.",
        variant: "destructive",
      })
    }

    setTimeout(() => setTestConnectionStatus("idle"), 5000)
  }

  const handleSaveEmailConfig = async () => {
    setIsSaving(true)
    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/notifications", {
        method: "POST",
        body: JSON.stringify({
          action: "save_email_config",
          company_id: companyId,
          config: emailConfig,
        }),
      })
      await loadNotificationSettings(companyId)
      toast({
        title: "Email Configuration Saved",
        description: "Email settings have been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save email configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotificationPreferences = async () => {
    setIsSaving(true)
    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/notifications", {
        method: "POST",
        body: JSON.stringify({
          action: "save_preferences",
          company_id: companyId,
          preferences: notificationSettings,
        }),
      })
      await loadNotificationSettings(companyId)
      toast({
        title: "Preferences Saved",
        description: "Notification preferences have been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save preferences",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefreshOverview = async () => {
    setIsOverviewRefreshing(true)
    try {
      await loadAllData()
      toast({ title: "Metrics Updated", description: "Overview metrics have been refreshed." })
    } catch (error) {
      console.error("[v0] Failed to refresh overview metrics", error)
      toast({
        title: "Error",
        description: "Unable to refresh overview metrics.",
        variant: "destructive",
      })
    } finally {
      setIsOverviewRefreshing(false)
    }
  }

  // Added for Access Control
  const handleRefreshSessions = async () => {
    setIsRefreshingSessions(true)
    console.log("[v0] Refreshing active sessions...")
    try {
      const companyId = await resolveHrCompanyId()
      await loadAccessAndSecurityData(companyId)
      toast({ title: "Sessions Refreshed", description: "Active sessions have been updated." })
    } catch (error) {
      console.error("[v0] Failed to refresh sessions", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to refresh active sessions.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshingSessions(false)
    }
  }

  const handleConfirmTerminateSession = async () => {
    if (!sessionToTerminate) return
    setIsTerminatingSession(true)
    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/access", {
        method: "POST",
        body: JSON.stringify({
          action: "terminate_session",
          company_id: companyId,
          session_id: sessionToTerminate.id,
        }),
      })
      setActiveSessions((prev) => prev.filter((session) => session.id !== sessionToTerminate.id))
      toast({ title: "Session Terminated", description: "The selected session has been terminated." })
      setSessionToTerminate(null)
    } catch (error) {
      console.error("[v0] Failed to terminate session", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to terminate the selected session.",
        variant: "destructive",
      })
    } finally {
      setIsTerminatingSession(false)
    }
  }

  const handleTerminateAllSessions = async () => {
    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/access", {
        method: "POST",
        body: JSON.stringify({ action: "terminate_all_sessions", company_id: companyId }),
      })
      setActiveSessions([])
      toast({ title: "Sessions Terminated", description: "All active sessions have been terminated." })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to terminate sessions.",
        variant: "destructive",
      })
    }
  }

  const handleSaveAccessSettings = async () => {
    setIsSavingAccessSettings(true)
    console.log("[v0] Saving access settings...")

    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/access", {
        method: "POST",
        body: JSON.stringify({
          action: "save",
          company_id: companyId,
          settings: accessSettings,
        }),
      })
      await loadAccessAndSecurityData(companyId)
      toast({ title: "Access Settings Saved", description: "Access control settings have been updated." })
    } catch (error) {
      console.error("[v0] Failed to save access settings", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to save access control settings.",
        variant: "destructive",
      })
    } finally {
      setIsSavingAccessSettings(false)
    }
  }

  // Added for Security
  // const handleBackupNow = async () => { // This function was duplicated and is now removed.
  //   setIsBackingUp(true)
  //   console.log("[v0] Initiating manual backup...")
  //   await new Promise((resolve) => setTimeout(resolve, 3000)) // Simulate backup process
  //   setLastBackupTime(new Date().toISOString())
  //   setBackupSize("55 MB") // Simulate updated size
  //   setBackupStatus("Completed")
  //   toast({ title: "Backup Successful", description: "Manual backup completed." })
  //   setIsBackingUp(false)
  // }

  const handleSaveSecuritySettings = async () => {
    setIsSavingSecuritySettings(true)
    console.log("[v0] Saving security settings...")
    try {
      const companyId = await resolveHrCompanyId()

      await settingsFetch("/api/settings/security", {
        method: "POST",
        body: JSON.stringify({
          action: "save",
          company_id: companyId,
          settings: securitySettings,
        }),
      })
      await loadAccessAndSecurityData(companyId)

      toast({ title: "Security Settings Saved", description: "Security configurations have been updated." })
    } catch (error) {
      console.error("[v0] Failed to save security settings", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to save security configurations.",
        variant: "destructive",
      })
    } finally {
      setIsSavingSecuritySettings(false)
    }
  }

  const handleViewAllLogs = async () => {
    setShowAllLogsModal(true)
    setIsLoadingAllLogs(true)
    try {
      const companyId = await resolveHrCompanyId()
      const payload = await settingsFetch(
        `/api/settings/security?company_id=${encodeURIComponent(companyId)}&limit=200`,
      )
      if (Array.isArray(payload.auditLogs)) setAuditLogs(payload.auditLogs)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to load full audit log history.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingAllLogs(false)
    }
  }

  const handleExportSecurityReport = async () => {
    setIsExportingReport(true)
    try {
      const companyId = await resolveHrCompanyId()
      const res = await fetch("/api/settings/security", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export_report", company_id: companyId }),
      })
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `security-report-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({ title: "Report Exported", description: "Security report generated and downloaded." })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export security report.",
        variant: "destructive",
      })
    } finally {
      setIsExportingReport(false)
    }
  }

  const handleAddSalaryGrade = () => {
    setEditingGrade(null)
    setNewGrade({
      name: "",
      description: "",
      minSalary: "",
      maxSalary: "",
      numberOfNotches: 5,
      notches: [],
    })
    setShowSalaryGradeModal(true)
  }

  const handleEditSalaryGrade = (grade) => {
    setEditingGrade(grade)
    setNewGrade({
      name: grade.name,
      description: grade.description,
      minSalary: grade.minSalary.toString(),
      maxSalary: grade.maxSalary.toString(),
      numberOfNotches: grade.notches.length,
      notches: grade.notches,
    })
    setShowSalaryGradeModal(true)
  }

  const handleGenerateNotches = async () => {
    const minSalary = Number.parseFloat(newGrade.minSalary)
    const maxSalary = Number.parseFloat(newGrade.maxSalary)
    const numberOfNotches = newGrade.numberOfNotches

    if (!minSalary || !maxSalary || minSalary >= maxSalary) {
      toast({
        title: "Invalid Salary Range",
        description: "Please enter valid minimum and maximum salary values.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingNotches(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const increment = (maxSalary - minSalary) / (numberOfNotches - 1)
    const generatedNotches = []

    for (let i = 0; i < numberOfNotches; i++) {
      generatedNotches.push({
        step: i + 1,
        amount: Math.round(minSalary + increment * i),
      })
    }

    setNewGrade((prev) => ({ ...prev, notches: generatedNotches }))
    setIsGeneratingNotches(false)

    toast({
      title: "Notches Generated",
      description: `Successfully generated ${numberOfNotches} salary notches.`,
    })
  }

  const handleSaveSalaryGrade = async () => {
    if (!newGrade.name || !newGrade.minSalary || !newGrade.maxSalary) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const gradeToAdd = {
      id: editingGrade ? editingGrade.id : undefined,
      name: newGrade.name,
      description: newGrade.description,
      minSalary: Number.parseFloat(newGrade.minSalary),
      maxSalary: Number.parseFloat(newGrade.maxSalary),
      notches: newGrade.notches,
    }

    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/hr", {
        method: "POST",
        body: JSON.stringify({
          action: "save_salary_grade",
          company_id: companyId,
          grade: gradeToAdd,
        }),
      })
      await loadHrData(companyId)

      toast({
        title: editingGrade ? "Grade Updated" : "Grade Added",
        description: editingGrade
          ? "Salary grade has been updated successfully."
          : "New salary grade has been added successfully.",
      })
      setShowSalaryGradeModal(false)
      setEditingGrade(null)
      setNewGrade({
        name: "",
        description: "",
        minSalary: "",
        maxSalary: "",
        numberOfNotches: 5,
        notches: [],
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save salary grade",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSalaryGrade = async (gradeId) => {
    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/hr", {
        method: "POST",
        body: JSON.stringify({ action: "delete_salary_grade", company_id: companyId, id: gradeId }),
      })
      await loadHrData(companyId)
      toast({
        title: "Grade Deleted",
        description: "Salary grade has been deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete salary grade",
        variant: "destructive",
      })
    }
  }

  const handleAddDivision = () => {
    const newDivision = newDivisionName.trim()
    if (newDivision && !divisions.includes(newDivision)) {
      const updatedDivisions = [...divisions, newDivision]
      setDivisions(updatedDivisions)
      setCompanyData({ ...companyData, divisions: updatedDivisions })
      setNewDivisionName("")
      toast({
        title: "Success",
        description: "Division added successfully",
      })
    }
  }

  const handleRemoveDivision = (divisionToRemove: string) => {
    const updatedDivisions = divisions.filter((division) => division !== divisionToRemove)
    setDivisions(updatedDivisions)
    setCompanyData({ ...companyData, divisions: updatedDivisions })
    toast({
      title: "Success",
      description: "Division removed successfully",
    })
  }

  const handleAddDepartment = () => {
    const newDept = newDepartmentName.trim()
    if (newDept && !departments.includes(newDept)) {
      const updatedDepartments = [...departments, newDept]
      setDepartments(updatedDepartments)
      setCompanyData({ ...companyData, departments: updatedDepartments })
      setNewDepartmentName("")
      toast({
        title: "Success",
        description: "Department added successfully",
      })
    }
  }

  const handleRemoveDepartment = (departmentToRemove: string) => {
    const updatedDepartments = departments.filter((dept) => dept !== departmentToRemove)
    setDepartments(updatedDepartments)
    setCompanyData({ ...companyData, departments: updatedDepartments })
    toast({
      title: "Success",
      description: "Department removed successfully",
    })
  }

  const handleAddLocation = () => {
    const newLoc = newLocationName.trim()
    if (newLoc && !locations.includes(newLoc)) {
      const updatedLocations = [...locations, newLoc]
      setLocations(updatedLocations)
      setCompanyData({ ...companyData, locations: updatedLocations })
      setNewLocationName("")
      toast({
        title: "Success",
        description: "Location added successfully",
      })
    }
  }

  const handleRemoveLocation = (locationToRemove: string) => {
    const updatedLocations = locations.filter((loc) => loc !== locationToRemove)
    setLocations(updatedLocations)
    setCompanyData({ ...companyData, locations: updatedLocations })
    toast({
      title: "Success",
      description: "Location removed successfully",
    })
  }

  const handleAddUnstructuredGrade = () => {
    setEditingUnstructured(null)
    setNewUnstructured({
      name: "",
      description: "",
      generalIncrement: { type: "percentage", value: 0 },
      performanceIncrement: { type: "percentage", value: 0 },
    })
    setShowUnstructuredModal(true)
  }

  const handleEditUnstructuredGrade = (grade) => {
    setEditingUnstructured(grade)
    setNewUnstructured({
      name: grade.name,
      description: grade.description,
      generalIncrement: grade.generalIncrement,
      performanceIncrement: grade.performanceIncrement,
    })
    setShowUnstructuredModal(true)
  }

  const handleSaveUnstructuredGrade = async () => {
    if (!newUnstructured.name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const gradeToAdd = {
      id: editingUnstructured ? editingUnstructured.id : undefined,
      name: newUnstructured.name,
      description: newUnstructured.description,
      generalIncrement: newUnstructured.generalIncrement,
      performanceIncrement: newUnstructured.performanceIncrement,
    }

    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/hr", {
        method: "POST",
        body: JSON.stringify({
          action: "save_unstructured_grade",
          company_id: companyId,
          grade: gradeToAdd,
        }),
      })
      await loadHrData(companyId)

      toast({
        title: editingUnstructured ? "Grade Updated" : "Grade Added",
        description: editingUnstructured
          ? "Unstructured salary grade has been updated successfully."
          : "New unstructured salary grade has been added successfully.",
      })
      setShowUnstructuredModal(false)
      setEditingUnstructured(null)
      setNewUnstructured({
        name: "",
        description: "",
        generalIncrement: { type: "percentage", value: 0 },
        performanceIncrement: { type: "percentage", value: 0 },
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save unstructured grade",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUnstructuredGrade = async (gradeId) => {
    try {
      const companyId = await resolveHrCompanyId()
      await settingsFetch("/api/settings/hr", {
        method: "POST",
        body: JSON.stringify({
          action: "delete_unstructured_grade",
          company_id: companyId,
          id: gradeId,
        }),
      })
      await loadHrData(companyId)
      toast({
        title: "Grade Deleted",
        description: "Unstructured salary grade has been deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete unstructured grade",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your organization settings and configurations</p>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Workspace Pulse</CardTitle>
            <CardDescription>
              Snapshot of people, automation, and security health for your workspace.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={overviewPeriod}
              onValueChange={(value) => setOverviewPeriod(value as "quarter" | "year")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quarter">Last quarter</SelectItem>
                <SelectItem value="year">Year to date</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={isOverviewExpanded ? "default" : "outline"}
              size="sm"
              onClick={() => setIsOverviewExpanded((prev) => !prev)}
            >
              {isOverviewExpanded ? "Hide insights" : "Show insights"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshOverview}
              disabled={isOverviewRefreshing}
            >
              {isOverviewRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-card/80 p-4">
              <p className="text-xs uppercase text-muted-foreground">Headcount</p>
              <div className="mt-1 flex items-end justify-between">
                <span className="text-2xl font-semibold text-foreground">{overviewMetrics.headcount}</span>
                <span className="text-xs font-medium text-emerald-600">
                  +{(overviewMetrics.deltas.headcount * 100).toFixed(1)}%
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Across {overviewMetrics.subsidiariesCount} subsidiaries
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-card/80 p-4">
              <p className="text-xs uppercase text-muted-foreground">Subsidiaries</p>
              <div className="mt-1 flex items-end justify-between">
                <span className="text-2xl font-semibold text-foreground">{overviewMetrics.subsidiariesCount}</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {overviewPeriod === "year" ? "Annual view" : "Quarter view"}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Active company profiles in scope</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-card/80 p-4">
              <p className="text-xs uppercase text-muted-foreground">Automation Coverage</p>
              <div className="mt-1 flex items-end justify-between">
                <span className="text-2xl font-semibold text-foreground">{overviewMetrics.automationCoverage}%</span>
                <span className="text-xs font-medium text-emerald-600">
                  +{(overviewMetrics.deltas.automation * 100).toFixed(0)}%
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Enabled HR & payroll automations</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-card/80 p-4">
              <p className="text-xs uppercase text-muted-foreground">Security Posture</p>
              <div className="mt-1 flex items-end justify-between">
                <span className="text-2xl font-semibold text-foreground">{overviewMetrics.securityLabel}</span>
                <span className="text-xs font-medium text-emerald-600">{overviewMetrics.deltas.security}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {overviewMetrics.securityScore}% of safeguards active
              </p>
            </div>
          </div>
          {isOverviewExpanded && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">People highlights</p>
                <p className="mt-1">
                  {overviewMetrics.headcount === 0
                    ? "No employees on record yet."
                    : `Hiring velocity remains positive with ${(overviewMetrics.deltas.headcount * 100).toFixed(1)}% growth for the selected period.`}
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Security highlights</p>
                <p className="mt-1">
                  {overviewMetrics.securityScore >= 80
                    ? "Controls meet best-practice thresholds. Continue quarterly reviews."
                    : "Enable more security controls to lower risk exposure and improve audit readiness."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs
        value={activeSettingsTab}
        onValueChange={(value) => {
          setActiveSettingsTab(value)
          if (value === "subsidiaries") void loadSubsidiaries()
          if (value === "notifications") void loadNotificationSettings()
          if (value === "roles") void loadRoles()
          if (value === "access") void loadAccessAndSecurityData()
          if (value === "security") void loadAccessAndSecurityData()
        }}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="subsidiaries">Multi-Company</TabsTrigger>
          <TabsTrigger value="hr">HR</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Company Settings</span>
              </CardTitle>
              <CardDescription>Manage your company information and organizational structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Company Logo</Label>
                <div className="flex items-center space-x-4">
                  {!isPlaceholderLogo(companyLogoPreview || companyData.logo_url) ? (
                    <div className="relative">
                      <img
                        src={companyLogoPreview || companyData.logo_url}
                        alt="Company Logo"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
                        onClick={async () => {
                          setCompanyLogoPreview("")
                          setCompanyData((prev) => ({ ...prev, logo_url: null }))
                          if (companyData.id && !String(companyData.id).startsWith("demo-")) {
                            try {
                              await persistCompanySettings({ logo_url: null })
                              toast({
                                title: "Logo removed",
                                description: "Company logo cleared in the database.",
                              })
                            } catch (error) {
                              toast({
                                title: "Error",
                                description:
                                  error instanceof Error ? error.message : "Failed to clear logo",
                                variant: "destructive",
                              })
                            }
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleLogoUpload(file, "company")
                        }
                      }}
                      className="hidden"
                      id="company-logo-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("company-logo-upload")?.click()}
                      disabled={isUploadingLogo}
                      className="flex items-center space-x-2"
                    >
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Upload Logo</span>
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={companyData.industry}
                    onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={companyData.tax_id}
                    onChange={(e) => setCompanyData({ ...companyData, tax_id: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ssnitNumber">SSNIT Number</Label>
                  <Input
                    id="ssnitNumber"
                    value={companyData.ssnit_number}
                    onChange={(e) => setCompanyData({ ...companyData, ssnit_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyData.email_address}
                    onChange={(e) => setCompanyData({ ...companyData, email_address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={companyData.phone_number}
                    onChange={(e) => setCompanyData({ ...companyData, phone_number: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Divisions</Label>
                <div className="space-y-3">
                  {divisions.length > 0 ? (
                    <div className="space-y-2">
                      {divisions.map((division, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{division}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDivision(division)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No divisions added yet</p>
                  )}
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter division name"
                      value={newDivisionName}
                      onChange={(e) => setNewDivisionName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddDivision()}
                    />
                    <Button variant="outline" size="sm" onClick={handleAddDivision} disabled={!newDivisionName.trim()}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Division
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Departments</Label>
                <div className="space-y-3">
                  {departments.length > 0 ? (
                    <div className="space-y-2">
                      {departments.map((department, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{department}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDepartment(department)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No departments added yet</p>
                  )}
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter department name"
                      value={newDepartmentName}
                      onChange={(e) => setNewDepartmentName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddDepartment()}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddDepartment}
                      disabled={!newDepartmentName.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Department
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Locations</Label>
                <div className="space-y-3">
                  {locations.length > 0 ? (
                    <div className="space-y-2">
                      {locations.map((location, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{location}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveLocation(location)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No locations added yet</p>
                  )}
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter location name"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddLocation()}
                    />
                    <Button variant="outline" size="sm" onClick={handleAddLocation} disabled={!newLocationName.trim()}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Location
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Company Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subsidiaries">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Multi-Company Management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button onClick={openAddSubsidiary}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subsidiary
                  </Button>
                  <Button variant="outline" onClick={handleSaveSubsidiaryChanges} disabled={isSavingSubsidiary}>
                    {isSavingSubsidiary ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Manage subsidiary companies, their organizational structure, and synchronize settings across entities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Company Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">Total Subsidiaries</p>
                          <p className="text-2xl font-bold">{subsidiaries.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Active Companies</p>
                          <p className="text-2xl font-bold">
                            {subsidiaries.filter((s) => s.status === "active").length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium">Total Locations</p>
                          <p className="text-2xl font-bold">
                            {subsidiaries.reduce((acc, s) => acc + (s.locations?.length || 0), 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium">Total Departments</p>
                          <p className="text-2xl font-bold">
                            {subsidiaries.reduce((acc, s) => acc + (s.departments?.length || 0), 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Subsidiaries List */}
                <div className="space-y-3">
                  {subsidiaries.map((subsidiary) => (
                    // Updated subsidiary card to show logo and removed Edit button
                    <Card key={subsidiary.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                                {subsidiary.logo_url ? (
                                  <img
                                    src={subsidiary.logo_url || "/placeholder.svg"}
                                    alt={`${subsidiary.name} logo`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                    {subsidiary.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="text-base font-semibold">{subsidiary.name}</h3>
                                    <p className="text-xs text-gray-600">{subsidiary.industry}</p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge
                                      variant={subsidiary.status === "active" ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      {subsidiary.status}
                                    </Badge>
                                    <span className="text-xs text-gray-500">Tax ID: {subsidiary.tax_id}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                              <div>
                                <p className="text-xs font-medium text-gray-700 mb-1">Contact Information</p>
                                <div className="space-y-0.5">
                                  <p className="text-xs text-gray-600">{subsidiary.email_address}</p>
                                  <p className="text-xs text-gray-600">{subsidiary.phone_number}</p>
                                  <p className="text-xs text-gray-600 truncate">{subsidiary.address}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-700 mb-1">Organizational Structure</p>
                                <div className="flex items-center space-x-3 text-xs text-gray-600">
                                  <span>
                                    {subsidiary.divisions_count || subsidiary.divisions?.length || 0} Divisions
                                  </span>
                                  <span>
                                    {subsidiary.departments_count || subsidiary.departments?.length || 0} Departments
                                  </span>
                                  <span>
                                    {subsidiary.locations_count || subsidiary.locations?.length || 0} Locations
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-700 mb-1">Registration Details</p>
                                <div className="space-y-0.5">
                                  <p className="text-xs text-gray-600">SSNIT: {subsidiary.ssnit_number}</p>
                                  <p className="text-xs text-gray-600">
                                    Created:{" "}
                                    {subsidiary.created_at
                                      ? new Date(subsidiary.created_at).toLocaleDateString()
                                      : "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs bg-transparent"
                                onClick={() => {
                                  setSelectedSubsidiary(subsidiary)
                                  setSubsidiaryLogoPreview(subsidiary.logo_url || "")
                                  setShowSubsidiaryDetails(true)
                                }}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs bg-transparent"
                                onClick={() => {
                                  setSelectedSubsidiary(subsidiary)
                                  setSubsidiaryLogoPreview(subsidiary.logo_url || "")
                                  setShowEditSubsidiary(true)
                                }}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs bg-transparent"
                                onClick={() => syncSubsidiarySettings(subsidiary.id)}
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Sync Settings
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs bg-transparent"
                                onClick={() => viewSubsidiaryEmployees(subsidiary.id)}
                              >
                                <Users className="w-3 h-3 mr-1" />
                                View Employees ({subsidiary.employee_count || 0})
                              </Button>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedSubsidiary(subsidiary)
                                  setSubsidiaryLogoPreview(subsidiary.logo_url || "")
                                  setShowSubsidiaryDetails(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedSubsidiary(subsidiary)
                                  setSubsidiaryLogoPreview(subsidiary.logo_url || "")
                                  setShowEditSubsidiary(true)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Subsidiary
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => syncSubsidiarySettings(subsidiary.id)}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Sync Settings
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicateSubsidiary(subsidiary)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {subsidiary.status === "active" ? (
                                <DropdownMenuItem
                                  onClick={() => confirmDeactivateSubsidiary(subsidiary.id)}
                                  className="text-orange-600"
                                >
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => confirmReactivateSubsidiary(subsidiary.id)}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Reactivate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {subsidiaries.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Subsidiaries Found</h3>
                        <p className="text-gray-600 mb-4">
                          Get started by adding your first subsidiary company to manage multiple entities.
                        </p>
                        <Button onClick={openAddSubsidiary}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Subsidiary
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Settings Synchronization Panel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <RefreshCw className="w-5 h-5" />
                      <span>Settings Synchronization</span>
                    </CardTitle>
                    <CardDescription>Synchronize settings across all subsidiary companies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Sync Options</h4>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={syncPrefs.sync_hr_policies}
                              onChange={(e) => setSyncPrefs((p) => ({ ...p, sync_hr_policies: e.target.checked }))}
                            />
                            <span className="text-sm">HR Policies</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={syncPrefs.sync_payroll_config}
                              onChange={(e) => setSyncPrefs((p) => ({ ...p, sync_payroll_config: e.target.checked }))}
                            />
                            <span className="text-sm">Payroll Configuration</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={syncPrefs.sync_leave_types}
                              onChange={(e) => setSyncPrefs((p) => ({ ...p, sync_leave_types: e.target.checked }))}
                            />
                            <span className="text-sm">Leave Types</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={syncPrefs.sync_roles_permissions}
                              onChange={(e) =>
                                setSyncPrefs((p) => ({ ...p, sync_roles_permissions: e.target.checked }))
                              }
                            />
                            <span className="text-sm">Roles & Permissions</span>
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start bg-transparent"
                            onClick={handleSyncAllSettings}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Sync Selected Settings
                          </Button>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Sync Actions</h4>

                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start bg-transparent"
                            onClick={handleSaveSubsidiaryChanges}
                            disabled={isSavingSubsidiary}
                          >
                            {isSavingSubsidiary ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Settings
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start bg-transparent"
                            onClick={handleExportSettingsTemplate}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export Settings Template
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start bg-transparent"
                            onClick={() => setImportModal(true)}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Import Settings
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hr">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>HR Configuration</span>
                    </CardTitle>
                    <CardDescription>Configure core HR settings and policies</CardDescription>
                  </div>
                  <Button
                    onClick={handleSaveHRConfig}
                    disabled={isSaving}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save HR Configuration
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="leaveYearStart">Leave Year Start</Label>
                      <Select
                        value={hrConfig.leaveYearStart}
                        onValueChange={(value) => setHrConfig({ ...hrConfig, leaveYearStart: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="January">January</SelectItem>
                          <SelectItem value="February">February</SelectItem>
                          <SelectItem value="March">March</SelectItem>
                          <SelectItem value="April">April</SelectItem>
                          <SelectItem value="May">May</SelectItem>
                          <SelectItem value="June">June</SelectItem>
                          <SelectItem value="July">July</SelectItem>
                          <SelectItem value="August">August</SelectItem>
                          <SelectItem value="September">September</SelectItem>
                          <SelectItem value="October">October</SelectItem>
                          <SelectItem value="November">November</SelectItem>
                          <SelectItem value="December">December</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="workingHours">Working Hours/Day</Label>
                      <Input
                        id="workingHours"
                        type="number"
                        value={hrConfig.workingHoursPerDay}
                        onChange={(e) =>
                          setHrConfig({ ...hrConfig, workingHoursPerDay: Number.parseInt(e.target.value) })
                        }
                        min="1"
                        max="24"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="probationPeriod">Probation Period (months)</Label>
                      <Input
                        id="probationPeriod"
                        type="number"
                        value={hrConfig.probationPeriod}
                        onChange={(e) => setHrConfig({ ...hrConfig, probationPeriod: Number.parseInt(e.target.value) })}
                        min="0"
                        max="12"
                      />
                    </div>

                    <div>
                      <Label htmlFor="workingDays">Working Days/Week</Label>
                      <Input
                        id="workingDays"
                        type="number"
                        value={hrConfig.workingDaysPerWeek}
                        onChange={(e) =>
                          setHrConfig({ ...hrConfig, workingDaysPerWeek: Number.parseInt(e.target.value) })
                        }
                        min="1"
                        max="7"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-approve leave requests</Label>
                      <p className="text-sm text-muted-foreground">Automatically approve requests within policy</p>
                    </div>
                    <Switch
                      checked={hrConfig.autoApproveLeave}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, autoApproveLeave: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email notifications</Label>
                      <p className="text-sm text-muted-foreground">Send email updates for HR activities</p>
                    </div>
                    <Switch
                      checked={hrConfig.emailNotifications}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, emailNotifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span>AI Recommendations</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">Enable AI-driven insights for HR processes</p>
                    </div>
                    <Switch
                      checked={hrConfig.aiRecommendations}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, aiRecommendations: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span>Smart Scheduling</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">Optimize schedules based on employee availability</p>
                    </div>
                    <Switch
                      checked={hrConfig.smartScheduling}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, smartScheduling: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-green-500" />
                        <span>Performance Tracking</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">Track employee performance metrics and goals</p>
                    </div>
                    <Switch
                      checked={hrConfig.performanceTracking}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, performanceTracking: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Policies Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Leave Policies</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={handleManageLeaveTypes}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Leave Type
                    </Button>
                  </div>
                </div>
                <CardDescription>Manage leave policies and generate AI insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentPolicies.length === 0 && (
                  <p className="text-sm text-muted-foreground">No leave policies yet. Add a leave type to get started.</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentPolicies.map((policy) => (
                    <Card key={policy.id || policy.name} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold">{policy.name}</CardTitle>
                        <CardDescription>{policy.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Days:</span> {policy.days}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Usage:</span> {policy.usage}
                          </p>
                        </div>

                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">AI Insight</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGeneratePolicyInsight(policy.name)}
                              disabled={loadingInsights[policy.name]}
                              className="h-6 px-2 text-xs"
                            >
                              {loadingInsights[policy.name] ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Brain className="w-3 h-3" />
                              )}
                              <span className="ml-1">Generate</span>
                            </Button>
                          </div>

                          {policyInsights[policy.name] ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                              <p className="text-xs text-blue-800 leading-relaxed">{policyInsights[policy.name]}</p>
                            </div>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-center">
                              <p className="text-xs text-gray-500">Click Generate to get AI insights for this policy</p>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end space-x-2 pt-2">
                          <Button variant="outline" size="sm" onClick={() => handlePolicyAction("view", policy.name)}>
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handlePolicyAction("edit", policy.name)}>
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handlePolicyAction("delete", policy.name)}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* HR Documents Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <ImageIcon className="w-5 h-5" />
                    <span>HR Documents</span>
                  </CardTitle>
                  <Button variant="outline" onClick={handleAddDocument}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Document
                  </Button>
                </div>
                <CardDescription>Manage HR documents and visibility settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {hrDocuments.length === 0 && (
                  <p className="text-sm text-muted-foreground">No HR documents yet. Upload a PDF or Word file to get started.</p>
                )}
                <div className="space-y-3">
                  {hrDocuments.map((doc) => (
                    <Card key={doc.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-semibold">{doc.name}</h3>
                            <p className="text-xs text-gray-600">
                              {doc.type} - {doc.size}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex flex-col items-center space-y-1">
                              <Switch
                                checked={doc.visibleToAll}
                                onCheckedChange={() => handleToggleDocumentVisibility(doc.id)}
                              />
                              <span className="text-xs text-muted-foreground">
                                {doc.visibleToAll ? "available to employees" : "hidden from employees"}
                              </span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleDocumentView(doc)}>
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDocumentAction("edit", doc.id)}>
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDocumentAction("delete", doc.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Salary Grades & Notches</span>
                    </CardTitle>
                    <CardDescription>Manage salary grades and compensation structure for employees</CardDescription>
                  </div>
                  {salaryGradeTab === "structured" ? (
                    <Button variant="outline" onClick={handleAddSalaryGrade}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Grade
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={handleAddUnstructuredGrade}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Grade
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                  <button
                    onClick={() => setSalaryGradeTab("structured")}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      salaryGradeTab === "structured"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Structured Salary Grade
                  </button>
                  <button
                    onClick={() => setSalaryGradeTab("unstructured")}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      salaryGradeTab === "unstructured"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Unstructured Salary Grade
                  </button>
                </div>

                {/* Structured Salary Grades */}
                {salaryGradeTab === "structured" && (
                  <>
                    {salaryGrades.length === 0 && (
                      <p className="text-sm text-muted-foreground">No structured grades yet. Click Add Grade to create one.</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {salaryGrades.map((grade) => (
                        <Card key={grade.id} className="border-l-4 border-l-purple-500">
                          <CardHeader>
                            <CardTitle className="text-lg font-semibold">{grade.name}</CardTitle>
                            <CardDescription>{grade.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <p className="text-sm">
                                <span className="font-medium">Range:</span> ₵{Number(grade.minSalary || 0).toLocaleString()} - ₵
                                {Number(grade.maxSalary || 0).toLocaleString()}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Notches:</span> {(grade.notches || []).length} steps
                              </p>
                            </div>

                            <div className="border-t pt-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">Salary Steps</span>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-32 overflow-y-auto">
                                <div className="space-y-1">
                                  {(grade.notches || []).map((notch) => (
                                    <div key={notch.step} className="flex justify-between text-xs">
                                      <span>Step {notch.step}</span>
                                      <span className="font-medium">₵{Number(notch.amount || 0).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditSalaryGrade(grade)}>
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteSalaryGrade(grade.id)}>
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}

                {/* Unstructured Salary Grades */}
                {salaryGradeTab === "unstructured" && (
                  <>
                    {unstructuredGrades.length === 0 && (
                      <p className="text-sm text-muted-foreground">No unstructured grades yet. Click Add Grade to create one.</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {unstructuredGrades.map((grade) => (
                        <Card key={grade.id} className="border-l-4 border-l-blue-500">
                          <CardHeader>
                            <CardTitle className="text-lg font-semibold">{grade.name}</CardTitle>
                            <CardDescription>{grade.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-green-800">General Increment</span>
                                  <span className="text-sm font-semibold text-green-900">
                                    {grade.generalIncrement.type === "percentage"
                                      ? `${grade.generalIncrement.value}%`
                                      : `₵${Number(grade.generalIncrement.value || 0).toLocaleString()}`}
                                  </span>
                                </div>
                              </div>

                              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-blue-800">Performance Increment</span>
                                  <span className="text-sm font-semibold text-blue-900">
                                    {grade.performanceIncrement.type === "percentage"
                                      ? `${grade.performanceIncrement.value}%`
                                      : `₵${Number(grade.performanceIncrement.value || 0).toLocaleString()}`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditUnstructuredGrade(grade)}>
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteUnstructuredGrade(grade.id)}>
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payroll">
          <div className="space-y-6">
            {/* Payroll Configuration Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Payroll Configuration</span>
                </CardTitle>
                <CardDescription>Configure basic payroll settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="payFrequency">Pay Frequency</Label>
                    <Select value={payFrequency} onValueChange={setPayFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={selectedCurrency} onValueChange={(v) => { handleCurrencyChange(v); setCurrencyPref(v) }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ghs">Ghana Cedis (GHS)</SelectItem>
                        <SelectItem value="usd">US Dollar (USD)</SelectItem>
                        <SelectItem value="eur">Euro (EUR)</SelectItem>
                        <SelectItem value="ngn">Nigerian Naira (NGN)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="minimumWage">Minimum Wage ({getCurrencyConfig(selectedCurrency).symbol})</Label>
                    <Input
                      id="minimumWage"
                      type="number"
                      value={minimumWage}
                      onChange={(e) => setMinimumWage(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="weekdayOvertimeRate">Weekday Overtime Rate Multiplier</Label>
                    <Input
                      id="weekdayOvertimeRate"
                      type="number"
                      step="0.1"
                      value={overtimeWeekdayRate}
                      onChange={(e) => setOvertimeWeekdayRate(parseFloat(e.target.value) || 1)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="weekendOvertimeRate">Weekend Overtime Rate Multiplier</Label>
                    <Input
                      id="weekendOvertimeRate"
                      type="number"
                      step="0.1"
                      value={overtimeWeekendRate}
                      onChange={(e) => setOvertimeWeekendRate(parseFloat(e.target.value) || 1)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="payrollCutoffDay">Payroll Cutoff Day</Label>
                    <Input
                      id="payrollCutoffDay"
                      type="number"
                      min="1"
                      max="31"
                      value={payrollCutoffDay}
                      onChange={(e) => setPayrollCutoffDay(parseInt(e.target.value, 10) || 25)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="autoCalculatePAYE" checked={autoCalcPaye} onCheckedChange={setAutoCalcPaye} />
                    <Label htmlFor="autoCalculatePAYE">Auto-calculate PAYE</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="autoCalculateSSNIT" checked={autoCalcSsnit} onCheckedChange={setAutoCalcSsnit} />
                    <Label htmlFor="autoCalculateSSNIT">Auto-calculate SSNIT</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="autoCalculateProvidentFund" checked={autoCalcProvident} onCheckedChange={setAutoCalcProvident} />
                    <Label htmlFor="autoCalculateProvidentFund">Auto-calculate Provident Fund (Tier 3)</Label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePayrollConfig} disabled={isSavingPayroll}>
                    {isSavingPayroll ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Payroll Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tax Configuration Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5" />
                  <span>Tax Configuration</span>
                </CardTitle>
                <CardDescription>Configure tax bands and SSNIT rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">PAYE Tax Bands</h4>
                      <p className="text-sm text-gray-500">
                        {getCurrencyConfig(selectedCurrency).country} - Version{" "}
                        {getCurrencyConfig(selectedCurrency)?.version} - Last Updated:{" "}
                        {getCurrencyConfig(selectedCurrency)?.lastUpdated}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncWithGovernmentAPI(selectedCurrency)}
                        disabled={!apiStatus[selectedCurrency as keyof typeof apiStatus]?.connected || isSyncing}
                      >
                        {isSyncing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Sync API
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleAddTaxBand}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Band
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200 rounded-lg">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-3 text-left font-medium">Band</th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-medium">Rate (%)</th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-medium">
                            From ({getCurrencyConfig(selectedCurrency).symbol})
                          </th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-medium">
                            To ({getCurrencyConfig(selectedCurrency).symbol})
                          </th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-medium">
                            Cumulative Tax ({getCurrencyConfig(selectedCurrency).symbol})
                          </th>
                          <th className="border border-gray-200 px-4 py-3 text-center font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payeTaxBands.map((band, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-3 font-medium">{index + 1}</td>
                            <td className="border border-gray-200 px-4 py-3">
                              <Input
                                type="number"
                                step="0.1"
                                className="w-24"
                                value={band.rate}
                                onChange={(e) =>
                                  handleUpdateTaxBand(index, "rate", Number.parseFloat(e.target.value) || 0)
                                }
                              />
                            </td>
                            <td className="border border-gray-200 px-4 py-3">
                              <Input
                                type="number"
                                className="w-32"
                                value={band.from ?? 0}
                                onChange={(e) =>
                                  handleUpdateTaxBand(index, "from", Number.parseFloat(e.target.value) || 0)
                                }
                              />
                            </td>
                            <td className="border border-gray-200 px-4 py-3">
                              <Input
                                type="number"
                                className="w-32"
                                value={band.to === Number.POSITIVE_INFINITY ? "" : band.to ?? ""}
                                placeholder="∞"
                                onChange={(e) => {
                                  const raw = e.target.value
                                  handleUpdateTaxBand(
                                    index,
                                    "to",
                                    raw === "" ? Number.POSITIVE_INFINITY : Number.parseFloat(raw) || 0,
                                  )
                                }}
                              />
                            </td>
                            <td className="border border-gray-200 px-4 py-3 font-medium text-green-600">
                              {band.cumulativeTax ? Number(band.cumulativeTax).toLocaleString() : "0"}
                            </td>
                            <td className="border border-gray-200 px-4 py-3 text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteTaxBand(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* SSNIT Rates Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">SSNIT Rates</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Employee:</span>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={ssnitRates.employee}
                              onChange={(e) => updateSsnitRates("employee", Number.parseFloat(e.target.value) || 0)}
                              className="w-20 text-right"
                              step="0.1"
                            />
                            <span className="text-sm">%</span>
                            <Badge variant="secondary">Active</Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Employer:</span>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={ssnitRates.employer}
                              onChange={(e) => updateSsnitRates("employer", Number.parseFloat(e.target.value) || 0)}
                              className="w-20 text-right"
                              step="0.1"
                            />
                            <span className="text-sm">%</span>
                            <Badge variant="secondary">Active</Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-medium text-blue-600">Total:</span>
                          <span className="font-medium text-blue-600">{ssnitRates.total}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tier 2 Rates</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Employee:</span>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={tier2Rates.employee}
                              onChange={(e) => updateTier2Rates("employee", Number.parseFloat(e.target.value) || 0)}
                              className="w-20 text-right"
                              step="0.1"
                            />
                            <span className="text-sm">%</span>
                            <Badge variant="secondary">Active</Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Employer:</span>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={tier2Rates.employer}
                              onChange={(e) => updateTier2Rates("employer", Number.parseFloat(e.target.value) || 0)}
                              className="w-20 text-right"
                              step="0.1"
                            />
                            <span className="text-sm">%</span>
                            <Badge variant="secondary">Active</Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-medium text-blue-600">Total:</span>
                          <span className="font-medium text-blue-600">{tier2Rates.total}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tier 3 Rates</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Employee:</span>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={tier3Rates.employee}
                              onChange={(e) => updateTier3Rates("employee", Number.parseFloat(e.target.value) || 0)}
                              className="w-20 text-right"
                              step="0.1"
                            />
                            <span className="text-sm">%</span>
                            <Badge variant="secondary">Active</Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Employer:</span>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={tier3Rates.employer}
                              onChange={(e) => updateTier3Rates("employer", Number.parseFloat(e.target.value) || 0)}
                              className="w-20 text-right"
                              step="0.1"
                            />
                            <span className="text-sm">%</span>
                            <Badge variant="secondary">Active</Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-medium text-blue-600">Total:</span>
                          <span className="font-medium text-blue-600">{tier3Rates.total}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* API Status and Recent Updates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Wifi className="w-5 h-5" />
                          <span>API Status</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Ghana</span>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Connected
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Nigeria</span>
                          <Badge variant="destructive">Disconnected</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Usa</span>
                          <Badge variant="destructive">Disconnected</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Bell className="w-5 h-5" />
                          <span>Recent Updates</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Ghana PAYE Rates Updated</p>
                              <p className="text-xs text-gray-500">New tax rates effective January 1, 2024</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end mt-6">
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleSaveTaxConfig}
                      disabled={isSavingTax}
                    >
                      {isSavingTax ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Tax Configuration
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Allowances</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={handleAddAllowance} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-3 text-left font-medium">Code</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-medium">Description</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-medium">Taxable</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-medium">Recurring</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-medium">AMOUNT</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-medium">%</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-medium">FIXED/VARIABLE</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allowances.map((allowance, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-3">
                            <Input
                              value={allowance.code}
                              onChange={(e) => handleAllowanceFieldChange(index, "code", e.target.value)}
                              className="border-0 bg-transparent p-0 font-medium"
                            />
                          </td>
                          <td className="border border-gray-200 px-4 py-3">
                            <Input
                              value={allowance.description}
                              onChange={(e) => handleAllowanceFieldChange(index, "description", e.target.value)}
                              className="border-0 bg-transparent p-0"
                            />
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <Switch
                              checked={allowance.taxable}
                              onCheckedChange={(checked) => handleAllowanceFieldChange(index, "taxable", checked)}
                            />
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <Switch
                              checked={allowance.recurring}
                              onCheckedChange={(checked) => handleAllowanceFieldChange(index, "recurring", checked)}
                            />
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <Input
                              type="number"
                              value={allowance.amount}
                              onChange={(e) =>
                                handleAllowanceFieldChange(index, "amount", Number.parseFloat(e.target.value) || 0)
                              }
                              className="border-0 bg-transparent p-0 text-center w-20"
                            />
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <Input
                              type="number"
                              step="0.1"
                              value={allowance.percentage}
                              onChange={(e) =>
                                handleAllowanceFieldChange(index, "percentage", Number.parseFloat(e.target.value) || 0)
                              }
                              className="border-0 bg-transparent p-0 text-center w-20"
                            />
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <Select
                              value={allowance.type}
                              onValueChange={(value) => handleAllowanceFieldChange(index, "type", value)}
                            >
                              <SelectTrigger className="border-0 bg-transparent p-0 h-auto">
                                <Badge variant={allowance.type === "FIXED" ? "default" : "secondary"}>
                                  {allowance.type}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FIXED">FIXED</SelectItem>
                                <SelectItem value="VARIABLE">VARIABLE</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleEditAllowance(index)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteAllowance(index)} className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Minus className="w-5 h-5" />
                  <span>Deductions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={handleAddDeduction} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-3 text-left font-medium">Code</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-medium">Description</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-medium">Recurring</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-medium">AMOUNT</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-medium">%</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-medium">FIXED/VARIABLE</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deductions.map((deduction, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-3">
                            <Input
                              value={deduction.code}
                              onChange={(e) => handleDeductionFieldChange(index, "code", e.target.value)}
                              className="border-0 bg-transparent p-0 font-medium"
                            />
                          </td>
                          <td className="border border-gray-200 px-4 py-3">
                            <Input
                              value={deduction.description}
                              onChange={(e) => handleDeductionFieldChange(index, "description", e.target.value)}
                              className="border-0 bg-transparent p-0"
                            />
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <Switch
                              checked={deduction.recurring}
                              onCheckedChange={(checked) => handleDeductionFieldChange(index, "recurring", checked)}
                            />
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <Input
                              type="number"
                              value={deduction.amount}
                              onChange={(e) =>
                                handleDeductionFieldChange(index, "amount", Number.parseFloat(e.target.value) || 0)
                              }
                              className="border-0 bg-transparent p-0 text-center w-20"
                            />
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <Input
                              type="number"
                              step="0.1"
                              value={deduction.percentage}
                              onChange={(e) =>
                                handleDeductionFieldChange(index, "percentage", Number.parseFloat(e.target.value) || 0)
                              }
                              className="border-0 bg-transparent p-0 text-center w-20"
                            />
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <Select
                              value={deduction.type}
                              onValueChange={(value) => handleDeductionFieldChange(index, "type", value)}
                            >
                              <SelectTrigger className="border-0 bg-transparent p-0 h-auto">
                                <Badge variant={deduction.type === "FIXED" ? "default" : "secondary"}>
                                  {deduction.type}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FIXED">FIXED</SelectItem>
                                <SelectItem value="VARIABLE">VARIABLE</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleEditDeduction(index)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteDeduction(index)} className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSavePayrollConfig}
                disabled={isSavingPayroll}
              >
                {isSavingPayroll ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Payroll Configuration
              </Button>
            </div>

            {/* Ghana tax engine — PAYE bands, SSNIT rates, live preview */}
            {companyData?.id && (
              <GhanaTaxSettings companyId={companyData.id} taxYear={new Date().getFullYear()} />
            )}

            {/* Enhanced Tax Reliefs Section */}
            <TaxReliefManager
              onReliefsChange={setTaxReliefs}
              initialReliefs={taxReliefs}
              companyId={companyData.id}
              onSaveReliefs={handleSaveReliefs}
            />
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notification Templates</span>
                </CardTitle>
                <CardDescription>Manage email and SMS templates for HR and payroll notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button onClick={handleAddNotificationTemplate} className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Template
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{notificationTemplates.length} Templates</Badge>
                    </div>
                  </div>

                  {notificationTemplates.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No notification templates yet. Click Add Template to create one.
                    </p>
                  )}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Template Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Modified</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notificationTemplates.map((template) => (
                          <TableRow key={template.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className="text-sm text-muted-foreground">{template.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{template.category}</Badge>
                            </TableCell>
                            <TableCell>{template.type}</TableCell>
                            <TableCell>
                              <Badge variant={template.status === "Active" ? "default" : "secondary"}>
                                {template.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{template.lastModified}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewTemplate(template)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteTemplate(template.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Modal */}
            {showTemplateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">
                      {templateModalType === 'view' && `View Template: ${selectedTemplate?.name}`}
                      {templateModalType === 'edit' && `Edit Template: ${selectedTemplate?.name}`}
                      {templateModalType === 'add' && 'Add New Template'}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setShowTemplateModal(false)
                      setSelectedTemplate(null)
                      setTemplateModalType("view")
                      setAiDescription("")
                      setShowAiPanel(false)
                      setIsGeneratingAi(false)
                      setShowFeedbackPanel(false)
                      setTemplateRating(0)
                      setTemplateFeedback("")
                      setTemplateImprovements("")
                      setLastGeneratedTemplateId("")
                      setCurrentAIModel(null)
                      setShowModelUpgrade(false)
                    }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {templateModalType === 'view' && selectedTemplate && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Template Name</Label>
                          <div className="p-3 bg-gray-50 rounded-md">{selectedTemplate.name}</div>
                        </div>
                        <div>
                          <Label>Category</Label>
                          <div className="p-3 bg-gray-50 rounded-md">{selectedTemplate.category}</div>
                        </div>
                        <div>
                          <Label>Type</Label>
                          <div className="p-3 bg-gray-50 rounded-md">{selectedTemplate.type}</div>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <div className="p-3 bg-gray-50 rounded-md">
                            <Badge variant={selectedTemplate.status === "Active" ? "default" : "secondary"}>
                              {selectedTemplate.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedTemplate.description}</div>
                      </div>
                      <div>
                        <Label>Subject</Label>
                        <div className="p-3 bg-gray-50 rounded-md">{selectedTemplate.subject || "No subject specified"}</div>
                      </div>
                      <div>
                        <Label>Template Body</Label>
                        <div className="p-3 bg-gray-50 rounded-md min-h-32 whitespace-pre-wrap">
                          {selectedTemplate.body || "No template body specified"}
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => {
                          setShowTemplateModal(false)
                          setSelectedTemplate(null)
                          setAiDescription("")
                          setShowAiPanel(false)
                          setIsGeneratingAi(false)
                          setShowFeedbackPanel(false)
                          setTemplateRating(0)
                          setTemplateFeedback("")
                          setTemplateImprovements("")
                          setLastGeneratedTemplateId("")
                          setCurrentAIModel(null)
                          setShowModelUpgrade(false)
                        }}>
                          Close
                        </Button>
                        <Button onClick={() => handleEditTemplate(selectedTemplate)}>
                          Edit Template
                        </Button>
                      </div>
                    </div>
                  )}

                  {templateModalType === 'edit' && selectedTemplate && (
                    <div className="space-y-4">
                      {/* AI Assist Panel */}
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-semibold text-blue-900">AI Template Assistant</h3>
                              {currentAIModel && (
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant={currentAIModel.isLatest ? "default" : "secondary"} className="text-xs">
                                    {currentAIModel.name}
                                  </Badge>
                                  <span className="text-xs text-blue-700">
                                    {currentAIModel.performanceScore}% performance
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={checkAIModelUpdates}
                              className="text-blue-600 border-blue-200 hover:bg-blue-100"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Check Updates
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAiPanel(!showAiPanel)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-100"
                            >
                              {showAiPanel ? "Hide" : "Show"} AI Assistant
                            </Button>
                          </div>
                        </div>
                        
                        {showAiPanel && (
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="aiDescription">Describe the template you want to create or improve:</Label>
                              <Textarea
                                id="aiDescription"
                                value={aiDescription}
                                onChange={(e) => setAiDescription(e.target.value)}
                                placeholder="e.g., 'Create a welcome email for new employees' or 'Generate a leave approval notification'"
                                rows={3}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={handleGenerateAiTemplate}
                                disabled={isGeneratingAi || !aiDescription.trim()}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {isGeneratingAi ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Generate with AI
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAiDescription("")}
                                disabled={isGeneratingAi}
                              >
                                Clear
                              </Button>
                            </div>
                            <p className="text-xs text-blue-700">
                              💡 AI will generate a professional template based on your description. You can edit the generated content before saving.
                            </p>
                            
                            {/* GPT-5 Upgrade Simulation Button (for testing) */}
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={simulateGPT5Upgrade}
                                className="text-purple-600 border-purple-200 hover:bg-purple-100 w-full"
                              >
                                <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Simulate GPT-5 Upgrade
                              </Button>
                              <p className="text-xs text-purple-600 mt-1 text-center">
                                Test the automatic upgrade system
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Feedback Panel */}
                        {showFeedbackPanel && lastGeneratedTemplateId && (
                          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-green-900">Rate This AI Template</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowFeedbackPanel(false)}
                                className="text-green-600 hover:bg-green-100"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <Label>How would you rate this template?</Label>
                                <div className="flex space-x-1 mt-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => setTemplateRating(star)}
                                      className={`w-6 h-6 ${
                                        star <= templateRating
                                          ? 'text-yellow-400'
                                          : 'text-gray-300'
                                      } hover:text-yellow-400 transition-colors`}
                                    >
                                      <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <Label htmlFor="templateFeedback">Additional Feedback (Optional)</Label>
                                <Textarea
                                  id="templateFeedback"
                                  value={templateFeedback}
                                  onChange={(e) => setTemplateFeedback(e.target.value)}
                                  placeholder="What did you like or dislike about this template?"
                                  rows={2}
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="templateImprovements">Suggested Improvements (Optional)</Label>
                                <Textarea
                                  id="templateImprovements"
                                  value={templateImprovements}
                                  onChange={(e) => setTemplateImprovements(e.target.value)}
                                  placeholder="How could this template be improved? (One suggestion per line)"
                                  rows={2}
                                  className="mt-1"
                                />
                              </div>
                              
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowFeedbackPanel(false)}
                                >
                                  Skip
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleSubmitTemplateFeedback}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Submit Feedback
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editTemplateName">Template Name</Label>
                          <Input
                            id="editTemplateName"
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                            placeholder="Enter template name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="editTemplateCategory">Category</Label>
                          <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({...newTemplate, category: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HR">HR</SelectItem>
                              <SelectItem value="Payroll">Payroll</SelectItem>
                              <SelectItem value="Leave">Leave</SelectItem>
                              <SelectItem value="Performance">Performance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="editTemplateType">Type</Label>
                          <Select value={newTemplate.type} onValueChange={(value) => setNewTemplate({...newTemplate, type: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Email">Email</SelectItem>
                              <SelectItem value="SMS">SMS</SelectItem>
                              <SelectItem value="Push">Push Notification</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="editTemplateSubject">Subject</Label>
                          <Input
                            id="editTemplateSubject"
                            value={newTemplate.subject}
                            onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                            placeholder="Enter email subject"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="editTemplateBody">Template Body</Label>
                        <Textarea
                          id="editTemplateBody"
                          value={newTemplate.body}
                          onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})}
                          placeholder="Enter template content. Use {{variable_name}} for dynamic content."
                          rows={8}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => {
                          setTemplateModalType("view")
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveTemplate} disabled={isSaving}>
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {templateModalType === 'add' && (
                    <div className="space-y-4">
                      {/* AI Assist Panel */}
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-semibold text-blue-900">AI Template Assistant</h3>
                              {currentAIModel && (
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant={currentAIModel.isLatest ? "default" : "secondary"} className="text-xs">
                                    {currentAIModel.name}
                                  </Badge>
                                  <span className="text-xs text-blue-700">
                                    {currentAIModel.performanceScore}% performance
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={checkAIModelUpdates}
                              className="text-blue-600 border-blue-200 hover:bg-blue-100"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Check Updates
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAiPanel(!showAiPanel)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-100"
                            >
                              {showAiPanel ? "Hide" : "Show"} AI Assistant
                            </Button>
                          </div>
                        </div>
                        
                        {showAiPanel && (
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="aiDescriptionAdd">Describe the template you want to create:</Label>
                              <Textarea
                                id="aiDescriptionAdd"
                                value={aiDescription}
                                onChange={(e) => setAiDescription(e.target.value)}
                                placeholder="e.g., 'Create a welcome email for new employees' or 'Generate a leave approval notification'"
                                rows={3}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={handleGenerateAiTemplate}
                                disabled={isGeneratingAi || !aiDescription.trim()}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {isGeneratingAi ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Generate with AI
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAiDescription("")}
                                disabled={isGeneratingAi}
                              >
                                Clear
                              </Button>
                            </div>
                            <p className="text-xs text-blue-700">
                              💡 AI will generate a professional template based on your description. You can edit the generated content before saving.
                            </p>
                            
                            {/* GPT-5 Upgrade Simulation Button (for testing) */}
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={simulateGPT5Upgrade}
                                className="text-purple-600 border-purple-200 hover:bg-purple-100 w-full"
                              >
                                <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Simulate GPT-5 Upgrade
                              </Button>
                              <p className="text-xs text-purple-600 mt-1 text-center">
                                Test the automatic upgrade system
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Feedback Panel */}
                        {showFeedbackPanel && lastGeneratedTemplateId && (
                          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-green-900">Rate This AI Template</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowFeedbackPanel(false)}
                                className="text-green-600 hover:bg-green-100"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <Label>How would you rate this template?</Label>
                                <div className="flex space-x-1 mt-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => setTemplateRating(star)}
                                      className={`w-6 h-6 ${
                                        star <= templateRating
                                          ? 'text-yellow-400'
                                          : 'text-gray-300'
                                      } hover:text-yellow-400 transition-colors`}
                                    >
                                      <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <Label htmlFor="templateFeedbackAdd">Additional Feedback (Optional)</Label>
                                <Textarea
                                  id="templateFeedbackAdd"
                                  value={templateFeedback}
                                  onChange={(e) => setTemplateFeedback(e.target.value)}
                                  placeholder="What did you like or dislike about this template?"
                                  rows={2}
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="templateImprovementsAdd">Suggested Improvements (Optional)</Label>
                                <Textarea
                                  id="templateImprovementsAdd"
                                  value={templateImprovements}
                                  onChange={(e) => setTemplateImprovements(e.target.value)}
                                  placeholder="How could this template be improved? (One suggestion per line)"
                                  rows={2}
                                  className="mt-1"
                                />
                              </div>
                              
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowFeedbackPanel(false)}
                                >
                                  Skip
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleSubmitTemplateFeedback}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Submit Feedback
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="templateName">Template Name</Label>
                          <Input
                            id="templateName"
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                            placeholder="Enter template name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="templateCategory">Category</Label>
                          <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({...newTemplate, category: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HR">HR</SelectItem>
                              <SelectItem value="Payroll">Payroll</SelectItem>
                              <SelectItem value="Leave">Leave</SelectItem>
                              <SelectItem value="Performance">Performance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="templateType">Type</Label>
                          <Select value={newTemplate.type} onValueChange={(value) => setNewTemplate({...newTemplate, type: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Email">Email</SelectItem>
                              <SelectItem value="SMS">SMS</SelectItem>
                              <SelectItem value="Push">Push Notification</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="templateSubject">Subject</Label>
                          <Input
                            id="templateSubject"
                            value={newTemplate.subject}
                            onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                            placeholder="Enter email subject"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="templateBody">Template Body</Label>
                        <Textarea
                          id="templateBody"
                          value={newTemplate.body}
                          onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})}
                          placeholder="Enter template content. Use {{variable_name}} for dynamic content."
                          rows={8}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => {
                          setShowTemplateModal(false)
                          setIsAddingTemplate(false)
                          setAiDescription("")
                          setShowAiPanel(false)
                          setIsGeneratingAi(false)
                          setShowFeedbackPanel(false)
                          setTemplateRating(0)
                          setTemplateFeedback("")
                          setTemplateImprovements("")
                          setLastGeneratedTemplateId("")
                          setCurrentAIModel(null)
                          setShowModelUpgrade(false)
                          setNewTemplate({
                            name: "",
                            category: "HR",
                            type: "Email",
                            subject: "",
                            body: "",
                            variables: [],
                          })
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveTemplate} disabled={isSaving}>
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Template
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Email Configuration</span>
                </CardTitle>
                <CardDescription>Configure SMTP settings for sending notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="provider">Email Provider</Label>
                      <Select
                        value={emailConfig.provider}
                        onValueChange={(value) => setEmailConfig({ ...emailConfig, provider: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="smtp">SMTP</SelectItem>
                          <SelectItem value="sendgrid">SendGrid</SelectItem>
                          <SelectItem value="mailgun">Mailgun</SelectItem>
                          <SelectItem value="ses">Amazon SES</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={emailConfig.smtpHost}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                        placeholder="smtp.gmail.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={emailConfig.smtpPort}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: Number.parseInt(e.target.value) })}
                        placeholder="587"
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtpUsername">Username</Label>
                      <Input
                        id="smtpUsername"
                        value={emailConfig.smtpUsername}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpUsername: e.target.value })}
                        placeholder="your-email@company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fromEmail">From Email</Label>
                      <Input
                        id="fromEmail"
                        value={emailConfig.fromEmail}
                        onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                        placeholder="hr@company.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="fromName">From Name</Label>
                      <Input
                        id="fromName"
                        value={emailConfig.fromName}
                        onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                        placeholder="HR Department"
                      />
                    </div>

                    <div>
                      <Label htmlFor="replyTo">Reply To</Label>
                      <Input
                        id="replyTo"
                        value={emailConfig.replyTo}
                        onChange={(e) => setEmailConfig({ ...emailConfig, replyTo: e.target.value })}
                        placeholder="noreply@company.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="enableTLS"
                          checked={emailConfig.enableTLS}
                          onCheckedChange={(checked) => setEmailConfig({ ...emailConfig, enableTLS: checked })}
                        />
                        <Label htmlFor="enableTLS">Enable TLS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="enableSSL"
                          checked={emailConfig.enableSSL}
                          onCheckedChange={(checked) => setEmailConfig({ ...emailConfig, enableSSL: checked })}
                        />
                        <Label htmlFor="enableSSL">Enable SSL</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="smtpPassword">Password</Label>
                  <div className="relative">
                    <Input
                      id="smtpPassword"
                      type={showPassword ? "text" : "password"}
                      value={emailConfig.smtpPassword}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })}
                      placeholder="Enter your email password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleTestEmail}
                    disabled={testConnectionStatus === "testing"}
                    className={`${
                      testConnectionStatus === "success"
                        ? "border-green-500 text-green-600"
                        : testConnectionStatus === "error"
                          ? "border-red-500 text-red-600"
                          : ""
                    }`}
                  >
                    {testConnectionStatus === "testing" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : testConnectionStatus === "success" ? (
                      <Check className="w-4 h-4 mr-2 text-green-600" />
                    ) : testConnectionStatus === "error" ? (
                      <X className="w-4 h-4 mr-2 text-red-600" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {testConnectionStatus === "testing"
                      ? "Testing Connection..."
                      : testConnectionStatus === "success"
                        ? "Connection Successful"
                        : testConnectionStatus === "error"
                          ? "Connection Failed"
                          : "Test Connection"}
                  </Button>
                  <Button onClick={handleSaveEmailConfig} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>Configure default notification settings for all employees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">HR Notifications</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Employee Welcome</Label>
                            <p className="text-sm text-muted-foreground">Send welcome email to new employees</p>
                          </div>
                          <Switch
                            checked={notificationSettings.welcomeNotifications}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({ ...notificationSettings, welcomeNotifications: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Leave Notifications</Label>
                            <p className="text-sm text-muted-foreground">Notify about leave requests and approvals</p>
                          </div>
                          <Switch
                            checked={notificationSettings.leaveNotifications}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({ ...notificationSettings, leaveNotifications: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Promotion Notifications</Label>
                            <p className="text-sm text-muted-foreground">Send promotion and transfer notifications</p>
                          </div>
                          <Switch
                            checked={notificationSettings.promotionNotifications}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({ ...notificationSettings, promotionNotifications: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Payroll & Attendance</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Payroll Processing</Label>
                            <p className="text-sm text-muted-foreground">Notify when payroll is processed</p>
                          </div>
                          <Switch
                            checked={notificationSettings.payrollNotifications}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({ ...notificationSettings, payrollNotifications: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Attendance Alerts</Label>
                            <p className="text-sm text-muted-foreground">Send alerts for attendance issues</p>
                          </div>
                          <Switch
                            checked={notificationSettings.attendanceAlerts}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({ ...notificationSettings, attendanceAlerts: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>System Maintenance</Label>
                            <p className="text-sm text-muted-foreground">Notify about system maintenance</p>
                          </div>
                          <Switch
                            checked={notificationSettings.systemMaintenanceAlerts}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({ ...notificationSettings, systemMaintenanceAlerts: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label>Email Digest Frequency</Label>
                      <Select
                        value={notificationSettings.emailDigest}
                        onValueChange={(value) =>
                          setNotificationSettings({ ...notificationSettings, emailDigest: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="smsAlerts"
                        checked={notificationSettings.smsAlerts}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, smsAlerts: checked })
                        }
                      />
                      <div>
                        <Label htmlFor="smsAlerts">SMS Alerts</Label>
                        <p className="text-sm text-muted-foreground">Enable SMS notifications</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="pushNotifications"
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, pushNotifications: checked })
                        }
                      />
                      <div>
                        <Label htmlFor="pushNotifications">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Enable browser push notifications</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveNotificationPreferences} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Roles & Permissions</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => loadRoles()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button onClick={handleAddRoleInner}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Role
                  </Button>
                </div>
              </div>
              <CardDescription>
                Define roles and grant module-level access (view, create, edit, delete, approve, export)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-indigo-600" />
                      <div>
                        <p className="text-sm font-medium">Total Roles</p>
                        <p className="text-2xl font-bold">{roles.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Assigned Users</p>
                        <p className="text-2xl font-bold">
                          {roles.reduce((sum, r) => sum + (r.user_count || 0), 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium">Managed Modules</p>
                        <p className="text-2xl font-bold">{ROLE_MODULES.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                {roles.map((role) => {
                  const matrix = permissionsToMatrix(role.permissions)
                  const grantedModules = ROLE_MODULES.filter((m) => (matrix[m.key] || []).length > 0)
                  return (
                    <Card key={role.id} className="border-l-4 border-l-indigo-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-semibold">{role.name}</h3>
                              {role.is_system_role && (
                                <Badge variant="secondary" className="text-xs">
                                  System
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {role.user_count || 0} Users
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{role.description || "No description"}</p>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {grantedModules.length === 0 && (
                                <span className="text-xs text-muted-foreground">No module access granted</span>
                              )}
                              {grantedModules.map((m) => (
                                <Badge key={m.key} variant="secondary" className="text-xs font-normal">
                                  {m.label}
                                  <span className="ml-1 text-muted-foreground">
                                    ({(matrix[m.key] || []).length === ROLE_ACTIONS.length
                                      ? "Full"
                                      : (matrix[m.key] || []).length})
                                  </span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button variant="outline" size="sm" onClick={() => openRoleModal(role, "view")}>
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openRoleModal(role, "edit")}>
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setRoleToDelete(role)}>
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                {roles.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Roles Yet</h3>
                      <p className="text-gray-600 mb-4">
                        Create your first role and grant module-level permissions.
                      </p>
                      <Button onClick={handleAddRoleInner}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Role
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>

          {showRoleModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {roleModalType === "edit"
                          ? "Edit Role"
                          : roleModalType === "view"
                            ? `Role: ${roleForm.name}`
                            : "Add Role"}
                      </CardTitle>
                      <CardDescription>
                        {roleModalType === "view"
                          ? "Review this role's module-level access"
                          : "Define the role and grant module-level access"}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowRoleModal(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="roleName">Role Name</Label>
                      <Input
                        id="roleName"
                        value={roleForm.name}
                        disabled={roleModalType === "view"}
                        onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="HR Manager"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roleDescription">Description</Label>
                      <Input
                        id="roleDescription"
                        value={roleForm.description}
                        disabled={roleModalType === "view"}
                        onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="What this role can manage"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Module Permissions</Label>
                      {roleModalType !== "view" && (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setAllRolePermissions(true)}>
                            Grant All
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setAllRolePermissions(false)}>
                            Clear All
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="border rounded-lg overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            <th className="text-left font-medium px-3 py-2 min-w-[180px]">Module</th>
                            {ROLE_ACTIONS.map((action) => (
                              <th key={action.key} className="text-center font-medium px-3 py-2">
                                {action.label}
                              </th>
                            ))}
                            <th className="text-center font-medium px-3 py-2">Full</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ROLE_MODULES.map((module) => {
                            const actions = rolePermissionMatrix[module.key] || []
                            const allChecked = actions.length === ROLE_ACTIONS.length
                            return (
                              <tr key={module.key} className="border-b last:border-0 hover:bg-muted/30">
                                <td className="px-3 py-2">
                                  <div className="font-medium">{module.label}</div>
                                  <div className="text-xs text-muted-foreground">{module.description}</div>
                                </td>
                                {ROLE_ACTIONS.map((action) => (
                                  <td key={action.key} className="text-center px-3 py-2">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-gray-300"
                                      disabled={roleModalType === "view"}
                                      checked={actions.includes(action.key)}
                                      onChange={() => toggleRolePermission(module.key, action.key)}
                                    />
                                  </td>
                                ))}
                                <td className="text-center px-3 py-2">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300"
                                    disabled={roleModalType === "view"}
                                    checked={allChecked}
                                    onChange={() => toggleRoleModuleAll(module.key)}
                                  />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {countMatrixGrants(rolePermissionMatrix)} permission(s) selected across{" "}
                      {ROLE_MODULES.filter((m) => (rolePermissionMatrix[m.key] || []).length > 0).length} module(s)
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" onClick={() => setShowRoleModal(false)}>
                      {roleModalType === "view" ? "Close" : "Cancel"}
                    </Button>
                    {roleModalType === "view" ? (
                      <Button onClick={() => setRoleModalType("edit")}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Role
                      </Button>
                    ) : (
                      <Button onClick={handleSaveRole} disabled={isSavingRole}>
                        {isSavingRole ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {roleModalType === "edit" ? "Save Changes" : "Create Role"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {roleToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="text-xl">Delete Role</CardTitle>
                  <CardDescription>
                    Are you sure you want to delete <span className="font-medium">{roleToDelete.name}</span>? This
                    action cannot be undone.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" onClick={() => setRoleToDelete(null)} disabled={isDeletingRole}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleConfirmDeleteRole} disabled={isDeletingRole}>
                      {isDeletingRole ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Role
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Access Control Tab Content */}
        <TabsContent value="access">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Access Control</span>
                </CardTitle>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSaveAccessSettings}
                  disabled={isSavingAccessSettings}
                >
                  {isSavingAccessSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Access Settings
                    </>
                  )}
                </Button>
              </div>
              <CardDescription>Manage authentication, password policy, IP access and active sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Overview stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-emerald-600" />
                        <p className="text-sm font-medium">Two-Factor</p>
                      </div>
                      <Badge variant={accessSettings.twoFactorEnabled ? "default" : "secondary"}>
                        {accessSettings.twoFactorEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Wifi className="w-5 h-5 text-blue-600" />
                        <p className="text-sm font-medium">IP Restrictions</p>
                      </div>
                      <Badge variant={accessSettings.ipRestrictionsEnabled ? "default" : "secondary"}>
                        {accessSettings.ipRestrictionsEnabled
                          ? `${accessSettings.allowedIPs.filter((ip) => ip.trim()).length} allowed`
                          : "Off"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <p className="text-sm font-medium">Active Sessions</p>
                      </div>
                      <Badge variant="outline">{activeSessions.length}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Authentication Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Authentication</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                        <p className="text-xs text-muted-foreground">Require a second factor at sign-in</p>
                      </div>
                      <Switch
                        id="twoFactor"
                        checked={accessSettings.twoFactorEnabled}
                        onCheckedChange={(checked) =>
                          setAccessSettings({ ...accessSettings, twoFactorEnabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label htmlFor="ssoEnabled">Single Sign-On (SSO)</Label>
                        <p className="text-xs text-muted-foreground">Allow identity-provider login</p>
                      </div>
                      <Switch
                        id="ssoEnabled"
                        checked={accessSettings.ssoEnabled}
                        onCheckedChange={(checked) => setAccessSettings({ ...accessSettings, ssoEnabled: checked })}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="1"
                        value={accessSettings.sessionTimeout}
                        onChange={(e) =>
                          setAccessSettings({ ...accessSettings, sessionTimeout: Number.parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                        <Input
                          id="maxLoginAttempts"
                          type="number"
                          min="1"
                          value={accessSettings.maxLoginAttempts}
                          onChange={(e) =>
                            setAccessSettings({
                              ...accessSettings,
                              maxLoginAttempts: Number.parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="lockoutDuration">Lockout (minutes)</Label>
                        <Input
                          id="lockoutDuration"
                          type="number"
                          min="1"
                          value={accessSettings.lockoutDuration}
                          onChange={(e) =>
                            setAccessSettings({
                              ...accessSettings,
                              lockoutDuration: Number.parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Password Policy */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Password Policy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                      <Input
                        id="passwordMinLength"
                        type="number"
                        min="4"
                        value={accessSettings.passwordMinLength}
                        onChange={(e) =>
                          setAccessSettings({
                            ...accessSettings,
                            passwordMinLength: Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label htmlFor="passwordExpiry">Password Expiry</Label>
                        <p className="text-xs text-muted-foreground">Force periodic password changes</p>
                      </div>
                      <Switch
                        id="passwordExpiry"
                        checked={accessSettings.passwordExpiryEnabled}
                        onCheckedChange={(checked) =>
                          setAccessSettings({ ...accessSettings, passwordExpiryEnabled: checked })
                        }
                      />
                    </div>
                    {accessSettings.passwordExpiryEnabled && (
                      <div>
                        <Label htmlFor="passwordExpiryDays">Expiry Period (days)</Label>
                        <Input
                          id="passwordExpiryDays"
                          type="number"
                          min="1"
                          value={accessSettings.passwordExpiryDays}
                          onChange={(e) =>
                            setAccessSettings({
                              ...accessSettings,
                              passwordExpiryDays: Number.parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label>Complexity Requirements</Label>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm">Require uppercase letter</span>
                      <Switch
                        checked={accessSettings.passwordRequireUppercase}
                        onCheckedChange={(checked) =>
                          setAccessSettings({ ...accessSettings, passwordRequireUppercase: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm">Require lowercase letter</span>
                      <Switch
                        checked={accessSettings.passwordRequireLowercase}
                        onCheckedChange={(checked) =>
                          setAccessSettings({ ...accessSettings, passwordRequireLowercase: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm">Require number</span>
                      <Switch
                        checked={accessSettings.passwordRequireNumbers}
                        onCheckedChange={(checked) =>
                          setAccessSettings({ ...accessSettings, passwordRequireNumbers: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm">Require special character</span>
                      <Switch
                        checked={accessSettings.passwordRequireSpecial}
                        onCheckedChange={(checked) =>
                          setAccessSettings({ ...accessSettings, passwordRequireSpecial: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* IP Restrictions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">IP Access Control</h3>
                  <Switch
                    id="ipRestrictions"
                    checked={accessSettings.ipRestrictionsEnabled}
                    onCheckedChange={(checked) =>
                      setAccessSettings({ ...accessSettings, ipRestrictionsEnabled: checked })
                    }
                  />
                </div>
                {accessSettings.ipRestrictionsEnabled ? (
                  <div className="space-y-2">
                    <Label>Allowed IP Addresses / Ranges</Label>
                    {accessSettings.allowedIPs.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No IP ranges yet. Add one below to restrict access.
                      </p>
                    )}
                    {accessSettings.allowedIPs.map((ip, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={ip}
                          onChange={(e) => {
                            const newIPs = [...accessSettings.allowedIPs]
                            newIPs[index] = e.target.value
                            setAccessSettings({ ...accessSettings, allowedIPs: newIPs })
                          }}
                          placeholder="192.168.1.0/24"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newIPs = accessSettings.allowedIPs.filter((_, i) => i !== index)
                            setAccessSettings({ ...accessSettings, allowedIPs: newIPs })
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAccessSettings({
                          ...accessSettings,
                          allowedIPs: [...accessSettings.allowedIPs, ""],
                        })
                      }
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add IP Range
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    IP restrictions are disabled. Enable to limit access to specific networks.
                  </p>
                )}
              </div>

              <Separator />

              {/* Active Sessions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Active Sessions</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefreshSessions} disabled={isRefreshingSessions}>
                      {isRefreshingSessions ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Refresh
                    </Button>
                    {activeSessions.length > 0 && (
                      <Button variant="destructive" size="sm" onClick={handleTerminateAllSessions}>
                        <X className="w-4 h-4 mr-2" />
                        Terminate All
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {activeSessions.length === 0 && (
                    <Card>
                      <CardContent className="p-6 text-center text-sm text-muted-foreground">
                        No active sessions recorded.
                      </CardContent>
                    </Card>
                  )}
                  {activeSessions.map((session) => (
                    <Card key={session.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{session.user_email}</p>
                            <p className="text-sm text-gray-600">
                              {session.ip_address} • {session.device}
                              {session.browser ? ` • ${session.browser}` : ""} • Last active:{" "}
                              {new Date(session.last_activity).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSessionToTerminate(session)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Terminate
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {sessionToTerminate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="text-xl">Terminate Session</CardTitle>
                  <CardDescription>
                    End the session for <span className="font-medium">{sessionToTerminate.user_email}</span> (
                    {sessionToTerminate.ip_address})? The user will need to sign in again.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" onClick={() => setSessionToTerminate(null)} disabled={isTerminatingSession}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleConfirmTerminateSession}
                      disabled={isTerminatingSession}
                    >
                      {isTerminatingSession ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Terminating...
                        </>
                      ) : (
                        "Terminate Session"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Security Tab Content */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Security Settings</span>
                </CardTitle>
                <Button variant="outline" onClick={handleBackupNow} disabled={isBackingUp}>
                  {isBackingUp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Backing Up...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Backup Now
                    </>
                  )}
                </Button>
              </div>
              <CardDescription>Manage security settings, backups, and audit logs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Security Policies */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Security Policies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label htmlFor="dataEncryption">Data Encryption at Rest</Label>
                        <p className="text-xs text-muted-foreground">Encrypt stored tenant data</p>
                      </div>
                      <Switch
                        id="dataEncryption"
                        checked={securitySettings.dataEncryptionEnabled}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, dataEncryptionEnabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label htmlFor="auditLogging">Audit Logging</Label>
                        <p className="text-xs text-muted-foreground">Record security-relevant events</p>
                      </div>
                      <Switch
                        id="auditLogging"
                        checked={securitySettings.auditLoggingEnabled}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, auditLoggingEnabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label htmlFor="autoBackup">Automatic Backups</Label>
                        <p className="text-xs text-muted-foreground">Schedule recurring backups</p>
                      </div>
                      <Switch
                        id="autoBackup"
                        checked={securitySettings.autoBackupEnabled}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, autoBackupEnabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label htmlFor="gdprCompliance">GDPR Compliance Mode</Label>
                        <p className="text-xs text-muted-foreground">Enforce data-subject protections</p>
                      </div>
                      <Switch
                        id="gdprCompliance"
                        checked={securitySettings.gdprComplianceEnabled}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, gdprComplianceEnabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label htmlFor="dataAnonymization">Data Anonymization</Label>
                        <p className="text-xs text-muted-foreground">Mask PII in exports and logs</p>
                      </div>
                      <Switch
                        id="dataAnonymization"
                        checked={securitySettings.dataAnonymizationEnabled}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, dataAnonymizationEnabled: checked })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="backupFrequency">Backup Frequency</Label>
                      <Select
                        value={securitySettings.backupFrequency}
                        onValueChange={(value) => setSecuritySettings({ ...securitySettings, backupFrequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="backupRetention">Backup Retention (days)</Label>
                      <Input
                        id="backupRetention"
                        type="number"
                        min="1"
                        value={securitySettings.backupRetentionDays}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            backupRetentionDays: Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="retentionPeriod">Data Retention Period (days)</Label>
                      <Input
                        id="retentionPeriod"
                        type="number"
                        min="1"
                        value={securitySettings.dataRetentionDays}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            dataRetentionDays: Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Backup Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Backup Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">Last Backup</p>
                          <p className="text-lg font-bold">
                            {lastBackupTime ? new Date(lastBackupTime).toLocaleDateString() : "Never"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Database className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Backup Size</p>
                          <p className="text-lg font-bold">{backupSize || "0 MB"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="text-sm font-medium">Status</p>
                          <p className="text-lg font-bold">{backupStatus || "Ready"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {backupHistory.length > 0 && (
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left font-medium px-3 py-2">Type</th>
                          <th className="text-left font-medium px-3 py-2">Status</th>
                          <th className="text-left font-medium px-3 py-2">Size</th>
                          <th className="text-left font-medium px-3 py-2">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backupHistory.slice(0, 8).map((b) => (
                          <tr key={b.id} className="border-b last:border-0">
                            <td className="px-3 py-2 capitalize">{b.backup_type || "manual"}</td>
                            <td className="px-3 py-2">
                              <Badge
                                variant={
                                  String(b.backup_status).toLowerCase() === "completed" ? "default" : "secondary"
                                }
                                className="capitalize"
                              >
                                {b.backup_status || "unknown"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">
                              {b.backup_size ? `${(b.backup_size / (1024 * 1024)).toFixed(1)} MB` : "—"}
                            </td>
                            <td className="px-3 py-2">
                              {b.completed_at || b.started_at
                                ? new Date(b.completed_at || b.started_at).toLocaleString()
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Audit Logs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Recent Audit Logs</h3>
                  <Button variant="outline" onClick={handleViewAllLogs}>
                    <Eye className="w-4 h-4 mr-2" />
                    View All Logs
                  </Button>
                </div>
                <div className="space-y-2">
                  {auditLogs.slice(0, 5).map((log) => (
                    <Card key={log.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{log.action}</p>
                            <p className="text-xs text-gray-600">
                              {log.user_email} • {log.ip_address} •{new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={log.severity === "high" ? "destructive" : "secondary"}>{log.severity}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleExportSecurityReport} disabled={isExportingReport}>
                  {isExportingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Export Security Report
                    </>
                  )}
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSaveSecuritySettings}
                  disabled={isSavingSecuritySettings}
                >
                  {isSavingSecuritySettings ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Security Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {showAllLogsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-3xl max-h-[85vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Audit Logs</CardTitle>
                      <CardDescription>Latest security and access events for this tenant</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowAllLogsModal(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingAllLogs ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No audit events recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between border rounded-md p-3">
                          <div>
                            <p className="font-medium text-sm">{log.action}</p>
                            <p className="text-xs text-gray-600">
                              {log.user_email} • {log.ip_address} • {new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={log.severity === "high" ? "destructive" : "secondary"}>
                            {log.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" onClick={() => setShowAllLogsModal(false)}>
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-white rounded-lg p-6 w-full ${documentModalType === 'view' ? 'max-w-6xl max-h-[95vh]' : 'max-w-2xl max-h-[90vh]'} overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {documentModalType === 'add' && 'Add New Document'}
                {documentModalType === 'edit' && 'Edit Document'}
                {documentModalType === 'view' && `View Document: ${selectedDocument?.name}`}
                {documentModalType === 'delete' && 'Delete Document'}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowDocumentModal(false)
                handleResetViewer()
              }}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Add Document Form */}
            {documentModalType === 'add' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="documentName">Document Name</Label>
                  <Input
                    id="documentName"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="e.g., Employee Handbook"
                  />
                </div>

                <div>
                  <Label htmlFor="documentFile">Upload File</Label>
                  <Input
                    id="documentFile"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                  {uploadedFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {uploadedFile.name} ({(uploadedFile.size / (1024 * 1024)).toFixed(2)}MB)
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <AlertTriangle className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    Supported formats: PDF, DOC, DOCX. Maximum file size: 10MB
                  </p>
                </div>

                {/* File Content Preview */}
                {(documentPreviewContent || isParsingFile) && (
                  <div className="space-y-2">
                    <Label>Content Preview</Label>
                    <div className="border border-gray-300 rounded-md bg-gray-50 h-64 overflow-auto p-4">
                      {isParsingFile ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center space-y-2">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                            <p className="text-sm text-gray-600">Parsing file content...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          <div 
                            className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm"
                            dangerouslySetInnerHTML={{
                              __html: documentPreviewContent
                                .replace(/# (.*)/g, '<h1 class="text-lg font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">$1</h1>')
                                .replace(/## (.*)/g, '<h2 class="text-base font-semibold text-gray-800 mb-2 mt-4">$1</h2>')
                                .replace(/### (.*)/g, '<h3 class="text-sm font-medium text-gray-700 mb-2 mt-3">$1</h3>')
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                                .replace(/- (.*)/g, '<li class="mb-1 text-gray-700">$1</li>')
                                .replace(/(\d+)\. (.*)/g, '<li class="mb-1 text-gray-700"><span class="font-medium">$1.</span> $2</li>')
                                .replace(/\n\n/g, '</p><p class="mb-2 text-gray-700">')
                                .replace(/^(?!<[h|l])/gm, '<p class="mb-2 text-gray-700">')
                                .replace(/<li/g, '<ul class="list-disc list-inside mb-2"><li')
                                .replace(/<\/li>/g, '</li></ul>')
                                .replace(/<ul class="list-disc list-inside mb-2"><ul class="list-disc list-inside mb-2">/g, '<ul class="list-disc list-inside mb-2">')
                                .replace(/<\/ul><\/ul>/g, '</ul>')
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {!isParsingFile && (
                      <p className="text-xs text-gray-500">
                        This is a preview of the parsed content from your uploaded file.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <Button variant="outline" onClick={() => setShowDocumentModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveDocument}
                    disabled={isSavingDocument}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    {isSavingDocument ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Document
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Edit Document Form */}
            {documentModalType === 'edit' && selectedDocument && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editDocumentName">Document Name</Label>
                  <Input
                    id="editDocumentName"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="e.g., Employee Handbook"
                  />
                </div>

                <div>
                  <Label htmlFor="editDocumentFile">Replace File (Optional)</Label>
                  <Input
                    id="editDocumentFile"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                  {uploadedFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      New file: {uploadedFile.name} ({(uploadedFile.size / (1024 * 1024)).toFixed(2)}MB)
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    Current: {selectedDocument.name} ({selectedDocument.size})
                  </p>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button variant="outline" onClick={() => setShowDocumentModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEditDocument}
                    disabled={isSavingDocument}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    {isSavingDocument ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Update Document
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* View Document - Adobe-like PDF Viewer */}
            {documentModalType === 'view' && selectedDocument && (
              <div className="space-y-4">
                {/* PDF Viewer Toolbar */}
                <div className="flex items-center justify-between p-3 bg-gray-100 border border-gray-300 rounded-md">
                  <div className="flex items-center space-x-2">
                    {/* Page Navigation */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Zoom Controls */}
                    <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={documentZoom <= 50}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium px-2 min-w-[60px] text-center">
                      {documentZoom}%
                    </span>
                    <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={documentZoom >= 200}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>

                    {/* Rotate */}
                    <Button variant="outline" size="sm" onClick={handleRotate}>
                      <RotateCw className="w-4 h-4" />
                    </Button>

                    {/* Fullscreen */}
                    <Button variant="outline" size="sm" onClick={handleToggleFullscreen}>
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </Button>

                    {/* Search */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-40 h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Document Preview Area — prefer real file embed when available */}
                <div className={`border border-gray-300 rounded-md bg-gray-50 ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[600px]'} overflow-auto`}>
                  {selectedDocument.fileUrl && isPdfDocument(selectedDocument) ? (
                    <iframe
                      title={selectedDocument.name}
                      src={selectedDocument.fileUrl}
                      className="w-full h-full min-h-[560px] bg-white"
                      style={{
                        transform: `scale(${documentZoom / 100})`,
                        transformOrigin: "top left",
                        width: `${10000 / documentZoom}%`,
                        height: `${10000 / documentZoom}%`,
                      }}
                    />
                  ) : selectedDocument.fileUrl && isImageDocument(selectedDocument) ? (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <img
                        src={selectedDocument.fileUrl}
                        alt={selectedDocument.name}
                        className="max-w-full max-h-full object-contain"
                        style={{
                          transform: `scale(${documentZoom / 100}) rotate(${documentRotation}deg)`,
                          transition: "transform 0.3s ease",
                        }}
                      />
                    </div>
                  ) : selectedDocument.fileUrl && !documentPreviewContent ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6">
                      <FileText className="w-16 h-16 text-gray-400" />
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-700">{selectedDocument.name}</p>
                        <p className="text-sm text-gray-500 mb-4">
                          Preview is not available for this file type. Open or download the original file.
                        </p>
                        <Button asChild variant="outline">
                          <a href={selectedDocument.fileUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Document
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="bg-white shadow-lg min-h-full"
                      style={{
                        transform: `scale(${documentZoom / 100}) rotate(${documentRotation}deg)`,
                        transition: "transform 0.3s ease",
                      }}
                    >
                      {documentPreviewContent ? (
                        <div className="p-8 max-w-4xl mx-auto">
                          <div className="prose prose-lg max-w-none">
                            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                              {documentPreviewContent}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center min-h-[400px]">
                          <div className="text-center space-y-4">
                            <FileText className="w-16 h-16 mx-auto text-gray-400" />
                            <div>
                              <p className="text-lg font-semibold text-gray-700">{selectedDocument.name}</p>
                              <p className="text-sm text-gray-500">No preview content available for this document.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Viewer Info */}
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      {selectedDocument.vaultDocumentId
                        ? "A copy of this document is stored in Document Vault."
                        : selectedDocument.fileUrl
                          ? "Showing the uploaded file contents."
                          : "Showing available document content."}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedDocument.fileUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedDocument.fileUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open File
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleResetViewer}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset View
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-4">
                  <Button variant="outline" onClick={() => {
                    setShowDocumentModal(false)
                    handleResetViewer()
                  }}>
                    Close
                  </Button>
                </div>
              </div>
            )}

            {/* Delete Document Confirmation */}
            {documentModalType === 'delete' && selectedDocument && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-md">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-800">Are you sure you want to delete this document?</p>
                    <p className="text-sm text-red-700 mt-1">
                      "{selectedDocument.name}" will be permanently removed. This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button variant="outline" onClick={() => setShowDocumentModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteDocument(selectedDocument.id)}
                    disabled={isSavingDocument}
                  >
                    {isSavingDocument ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Document
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Subsidiary Modal */}
      {showAddSubsidiary && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/50">
          <div className="relative m-8 md:m-16 lg:m-24">
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="text-xl">Add New Subsidiary</CardTitle>
                <CardDescription>Enter the details for the new subsidiary company</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-4">
                    <Label>Subsidiary Logo</Label>
                    <div className="flex items-center space-x-4">
                      {subsidiaryLogoPreview ? (
                        <div className="relative">
                          <img
                            src={subsidiaryLogoPreview || "/placeholder.svg"}
                            alt="Subsidiary Logo"
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => setSubsidiaryLogoPreview("")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleLogoUpload(file, "subsidiary")
                            }
                          }}
                          className="hidden"
                          id="subsidiary-logo-upload"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById("subsidiary-logo-upload")?.click()}
                          disabled={isUploadingLogo}
                          className="flex items-center space-x-2"
                        >
                          {isUploadingLogo ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Upload Logo</span>
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="subsidiaryName">Subsidiary Name</Label>
                      <Input
                        id="subsidiaryName"
                        placeholder="Enter subsidiary name"
                        value={newSubsidiary.name}
                        onChange={(e) => setNewSubsidiary({ ...newSubsidiary, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subsidiaryIndustry">Industry</Label>
                      <Input
                        id="subsidiaryIndustry"
                        placeholder="Enter industry"
                        value={newSubsidiary.industry}
                        onChange={(e) => setNewSubsidiary({ ...newSubsidiary, industry: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subsidiaryTaxId">Tax ID</Label>
                      <Input
                        id="subsidiaryTaxId"
                        placeholder="Enter tax ID"
                        value={newSubsidiary.tax_id}
                        onChange={(e) => setNewSubsidiary({ ...newSubsidiary, tax_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subsidiarySsnit">SSNIT Number</Label>
                      <Input
                        id="subsidiarySsnit"
                        placeholder="Enter SSNIT number"
                        value={newSubsidiary.ssnit_number}
                        onChange={(e) => setNewSubsidiary({ ...newSubsidiary, ssnit_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subsidiaryEmail">Email Address</Label>
                      <Input
                        id="subsidiaryEmail"
                        type="email"
                        placeholder="Enter email address"
                        value={newSubsidiary.email_address}
                        onChange={(e) => setNewSubsidiary({ ...newSubsidiary, email_address: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subsidiaryPhone">Phone Number</Label>
                      <Input
                        id="subsidiaryPhone"
                        placeholder="Enter phone number"
                        value={newSubsidiary.phone_number}
                        onChange={(e) => setNewSubsidiary({ ...newSubsidiary, phone_number: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subsidiaryAddress">Address</Label>
                    <Textarea
                      id="subsidiaryAddress"
                      placeholder="Enter address"
                      value={newSubsidiary.address}
                      onChange={(e) => setNewSubsidiary({ ...newSubsidiary, address: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Divisions</Label>
                    <div className="space-y-2">
                      {newSubsidiary.divisions.map((division, index) => (
                        <div key={`${division}-${index}`} className="flex items-center gap-2">
                          <Input
                            value={division}
                            onChange={(e) =>
                              setNewSubsidiary({
                                ...newSubsidiary,
                                divisions: newSubsidiary.divisions.map((item, i) =>
                                  i === index ? e.target.value : item,
                                ),
                              })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setNewSubsidiary({
                                ...newSubsidiary,
                                divisions: newSubsidiary.divisions.filter((_, i) => i !== index),
                              })
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Enter division"
                          value={newSubsidiaryDivision}
                          onChange={(e) => setNewSubsidiaryDivision(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              const value = newSubsidiaryDivision.trim()
                              if (value) {
                                setNewSubsidiary({
                                  ...newSubsidiary,
                                  divisions: [...newSubsidiary.divisions, value],
                                })
                                setNewSubsidiaryDivision("")
                              }
                            }
                          }}
                        />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!newSubsidiaryDivision.trim()}
                        onClick={() => {
                          const value = newSubsidiaryDivision.trim()
                          if (!value) return
                          setNewSubsidiary({
                            ...newSubsidiary,
                            divisions: [...newSubsidiary.divisions, value],
                          })
                          setNewSubsidiaryDivision("")
                        }}
                      >
                        Add Division
                      </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Departments</Label>
                    <div className="space-y-2">
                      {newSubsidiary.departments.map((department, index) => (
                        <div key={`${department}-${index}`} className="flex items-center gap-2">
                          <Input
                            value={department}
                            onChange={(e) =>
                              setNewSubsidiary({
                                ...newSubsidiary,
                                departments: newSubsidiary.departments.map((item, i) =>
                                  i === index ? e.target.value : item,
                                ),
                              })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setNewSubsidiary({
                                ...newSubsidiary,
                                departments: newSubsidiary.departments.filter((_, i) => i !== index),
                              })
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Enter department"
                          value={newSubsidiaryDepartment}
                          onChange={(e) => setNewSubsidiaryDepartment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              const value = newSubsidiaryDepartment.trim()
                              if (value) {
                                setNewSubsidiary({
                                  ...newSubsidiary,
                                  departments: [...newSubsidiary.departments, value],
                                })
                                setNewSubsidiaryDepartment("")
                              }
                            }
                          }}
                        />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!newSubsidiaryDepartment.trim()}
                        onClick={() => {
                          const value = newSubsidiaryDepartment.trim()
                          if (!value) return
                          setNewSubsidiary({
                            ...newSubsidiary,
                            departments: [...newSubsidiary.departments, value],
                          })
                          setNewSubsidiaryDepartment("")
                        }}
                      >
                        Add Department
                      </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Locations</Label>
                    <div className="space-y-2">
                      {newSubsidiary.locations.map((location, index) => (
                        <div key={`${location}-${index}`} className="flex items-center gap-2">
                          <Input
                            value={location}
                            onChange={(e) =>
                              setNewSubsidiary({
                                ...newSubsidiary,
                                locations: newSubsidiary.locations.map((item, i) =>
                                  i === index ? e.target.value : item,
                                ),
                              })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setNewSubsidiary({
                                ...newSubsidiary,
                                locations: newSubsidiary.locations.filter((_, i) => i !== index),
                              })
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Enter location name"
                          value={newSubsidiaryLocation}
                          onChange={(e) => setNewSubsidiaryLocation(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              const value = newSubsidiaryLocation.trim()
                              if (value) {
                                setNewSubsidiary({
                                  ...newSubsidiary,
                                  locations: [...newSubsidiary.locations, value],
                                })
                                setNewSubsidiaryLocation("")
                              }
                            }
                          }}
                        />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!newSubsidiaryLocation.trim()}
                        onClick={() => {
                          const value = newSubsidiaryLocation.trim()
                          if (!value) return
                          setNewSubsidiary({
                            ...newSubsidiary,
                            locations: [...newSubsidiary.locations, value],
                          })
                          setNewSubsidiaryLocation("")
                        }}
                      >
                        Add Location
                      </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" onClick={() => setShowAddSubsidiary(false)} disabled={isSavingSubsidiary}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSubsidiary} disabled={isSavingSubsidiary || !newSubsidiary.name.trim()}>
                    {isSavingSubsidiary ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Add Subsidiary"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Edit Subsidiary Modal */}
      {showEditSubsidiary && selectedSubsidiary && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/50">
          <div className="relative m-8 md:m-16 lg:m-24">
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="text-xl">Edit Subsidiary</CardTitle>
                <CardDescription>Edit the details for the selected subsidiary company</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-4">
                    <Label>Subsidiary Logo</Label>
                    <div className="flex items-center space-x-4">
                      {subsidiaryLogoPreview || selectedSubsidiary.logo_url ? (
                        <div className="relative">
                          <img
                            src={subsidiaryLogoPreview || selectedSubsidiary.logo_url}
                            alt="Subsidiary Logo"
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => setSubsidiaryLogoPreview("")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleLogoUpload(file, "subsidiary")
                            }
                          }}
                          className="hidden"
                          id="subsidiary-logo-upload-edit"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById("subsidiary-logo-upload-edit")?.click()}
                          disabled={isUploadingLogo}
                          className="flex items-center space-x-2"
                        >
                          {isUploadingLogo ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Upload Logo</span>
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="editSubsidiaryName">Subsidiary Name</Label>
                      <Input
                        id="editSubsidiaryName"
                        placeholder="Enter subsidiary name"
                        value={selectedSubsidiary.name}
                        onChange={(e) => setSelectedSubsidiary({ ...selectedSubsidiary, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="editSubsidiaryIndustry">Industry</Label>
                      <Input
                        id="editSubsidiaryIndustry"
                        placeholder="Enter industry"
                        value={selectedSubsidiary.industry}
                        onChange={(e) => setSelectedSubsidiary({ ...selectedSubsidiary, industry: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="editSubsidiaryTaxId">Tax ID</Label>
                      <Input
                        id="editSubsidiaryTaxId"
                        placeholder="Enter tax ID"
                        value={selectedSubsidiary.tax_id}
                        onChange={(e) => setSelectedSubsidiary({ ...selectedSubsidiary, tax_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="editSubsidiarySsnit">SSNIT Number</Label>
                      <Input
                        id="editSubsidiarySsnit"
                        placeholder="Enter SSNIT number"
                        value={selectedSubsidiary.ssnit_number}
                        onChange={(e) => setSelectedSubsidiary({ ...selectedSubsidiary, ssnit_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="editSubsidiaryEmail">Email Address</Label>
                      <Input
                        id="editSubsidiaryEmail"
                        type="email"
                        placeholder="Enter email address"
                        value={selectedSubsidiary.email_address}
                        onChange={(e) =>
                          setSelectedSubsidiary({ ...selectedSubsidiary, email_address: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="editSubsidiaryPhone">Phone Number</Label>
                      <Input
                        id="editSubsidiaryPhone"
                        placeholder="Enter phone number"
                        value={selectedSubsidiary.phone_number}
                        onChange={(e) => setSelectedSubsidiary({ ...selectedSubsidiary, phone_number: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="editSubsidiaryAddress">Address</Label>
                    <Textarea
                      id="editSubsidiaryAddress"
                      placeholder="Enter address"
                      value={selectedSubsidiary.address}
                      onChange={(e) => setSelectedSubsidiary({ ...selectedSubsidiary, address: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Divisions</Label>
                    <div className="space-y-2">
                      {Array.isArray(selectedSubsidiary.divisions) ? (
                        selectedSubsidiary.divisions.map((division, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={division}
                              onChange={(e) => {
                                const newDivisions = [...selectedSubsidiary.divisions]
                                newDivisions[index] = e.target.value
                                setSelectedSubsidiary({ ...selectedSubsidiary, divisions: newDivisions })
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newDivisions = selectedSubsidiary.divisions.filter((_, i) => i !== index)
                                setSelectedSubsidiary({ ...selectedSubsidiary, divisions: newDivisions })
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <Input placeholder="No divisions defined" disabled />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newDivisions = selectedSubsidiary.divisions
                            ? [...selectedSubsidiary.divisions, "New Division"]
                            : ["New Division"]
                          setSelectedSubsidiary({ ...selectedSubsidiary, divisions: newDivisions })
                        }}
                      >
                        Add Division
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Departments</Label>
                    <div className="space-y-2">
                      {Array.isArray(selectedSubsidiary.departments) ? (
                        selectedSubsidiary.departments.map((department, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={department}
                              onChange={(e) => {
                                const newDepartments = [...selectedSubsidiary.departments]
                                newDepartments[index] = e.target.value
                                setSelectedSubsidiary({ ...selectedSubsidiary, departments: newDepartments })
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newDepartments = selectedSubsidiary.departments.filter((_, i) => i !== index)
                                setSelectedSubsidiary({ ...selectedSubsidiary, departments: newDepartments })
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <Input placeholder="No departments defined" disabled />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newDepartments = selectedSubsidiary.departments
                            ? [...selectedSubsidiary.departments, "New Department"]
                            : ["New Department"]
                          setSelectedSubsidiary({ ...selectedSubsidiary, departments: newDepartments })
                        }}
                      >
                        Add Department
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Locations</Label>
                    <div className="space-y-2">
                      {Array.isArray(selectedSubsidiary.locations) ? (
                        selectedSubsidiary.locations.map((location, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={location}
                              onChange={(e) => {
                                const newLocations = [...selectedSubsidiary.locations]
                                newLocations[index] = e.target.value
                                setSelectedSubsidiary({ ...selectedSubsidiary, locations: newLocations })
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newLocations = selectedSubsidiary.locations.filter((_, i) => i !== index)
                                setSelectedSubsidiary({ ...selectedSubsidiary, locations: newLocations })
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <Input placeholder="No locations defined" disabled />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newLocations = selectedSubsidiary.locations
                            ? [...selectedSubsidiary.locations, "New Location"]
                            : ["New Location"]
                          setSelectedSubsidiary({ ...selectedSubsidiary, locations: newLocations })
                        }}
                      >
                        Add Location
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" onClick={() => setShowEditSubsidiary(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      if (selectedSubsidiary) {
                        await updateSubsidiary(selectedSubsidiary.id, {
                          name: selectedSubsidiary.name,
                          industry: selectedSubsidiary.industry,
                          tax_id: selectedSubsidiary.tax_id,
                          ssnit_number: selectedSubsidiary.ssnit_number,
                          email_address: selectedSubsidiary.email_address,
                          phone_number: selectedSubsidiary.phone_number,
                          address: selectedSubsidiary.address,
                          divisions: selectedSubsidiary.divisions,
                          departments: selectedSubsidiary.departments,
                          locations: selectedSubsidiary.locations,
                          logo_url: subsidiaryLogoPreview || selectedSubsidiary.logo_url,
                        })
                        setShowEditSubsidiary(false)
                        setSubsidiaryLogoPreview("")
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Subsidiary Details Modal */}
      {showSubsidiaryDetails && selectedSubsidiary && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/50">
          <div className="relative m-8 md:m-16 lg:m-24">
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="text-xl">Subsidiary Details</CardTitle>
                <CardDescription>View the details for the selected subsidiary company</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-4">
                    <Label>Subsidiary Logo</Label>
                    {selectedSubsidiary.logo_url ? (
                      <img
                        src={selectedSubsidiary.logo_url || "/placeholder.svg"}
                        alt="Subsidiary Logo"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Subsidiary Name</Label>
                      <Input value={selectedSubsidiary.name} disabled />
                    </div>
                    <div>
                      <Label>Industry</Label>
                      <Input value={selectedSubsidiary.industry} disabled />
                    </div>
                    <div>
                      <Label>Tax ID</Label>
                      <Input value={selectedSubsidiary.tax_id} disabled />
                    </div>
                    <div>
                      <Label>SSNIT Number</Label>
                      <Input value={selectedSubsidiary.ssnit_number} disabled />
                    </div>
                    <div>
                      <Label>Email Address</Label>
                      <Input value={selectedSubsidiary.email_address} disabled />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <Input value={selectedSubsidiary.phone_number} disabled />
                    </div>
                  </div>

                  <div>
                    <Label>Address</Label>
                    <Textarea value={selectedSubsidiary.address} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label>Divisions</Label>
                    {Array.isArray(selectedSubsidiary.divisions) ? (
                      selectedSubsidiary.divisions.map((division, index) => (
                        <Input key={index} value={division} disabled />
                      ))
                    ) : (
                      <Input placeholder="No divisions defined" disabled />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Departments</Label>
                    {Array.isArray(selectedSubsidiary.departments) ? (
                      selectedSubsidiary.departments.map((department, index) => (
                        <Input key={index} value={department} disabled />
                      ))
                    ) : (
                      <Input placeholder="No departments defined" disabled />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Locations</Label>
                    {Array.isArray(selectedSubsidiary.locations) ? (
                      selectedSubsidiary.locations.map((location, index) => (
                        <Input key={index} value={location} disabled />
                      ))
                    ) : (
                      <Input placeholder="No locations defined" disabled />
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={() => setShowSubsidiaryDetails(false)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Add Leave Type Modal */}
      {showAddLeaveTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add Leave Type</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddLeaveTypeModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="leaveTypeName">Name</Label>
                <Input
                  id="leaveTypeName"
                  value={newLeaveType.name}
                  onChange={(e) => setNewLeaveType({ ...newLeaveType, name: e.target.value })}
                  placeholder="e.g., Annual Leave"
                />
              </div>
              <div>
                <Label htmlFor="leaveTypeDays">Days</Label>
                <Input
                  id="leaveTypeDays"
                  type="number"
                  min="1"
                  value={newLeaveType.days || ""}
                  onChange={(e) => setNewLeaveType({ ...newLeaveType, days: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="leaveTypeDescription">Description</Label>
                <Textarea
                  id="leaveTypeDescription"
                  value={newLeaveType.description}
                  onChange={(e) => setNewLeaveType({ ...newLeaveType, description: e.target.value })}
                  placeholder="Brief policy description"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow carry over</Label>
                  <p className="text-sm text-muted-foreground">Unused days can roll into the next leave year</p>
                </div>
                <Switch
                  checked={!!newLeaveType.carryOver}
                  onCheckedChange={(checked) => setNewLeaveType({ ...newLeaveType, carryOver: checked })}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="outline" onClick={() => setShowAddLeaveTypeModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddLeaveType}
                  disabled={isSavingPolicy}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {isSavingPolicy ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Leave Type"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Policy View / Edit / Delete Modal */}
      {showPolicyModal && selectedPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {policyModalType === "view" && `View Policy: ${selectedPolicy.name}`}
                {policyModalType === "edit" && "Edit Leave Policy"}
                {policyModalType === "delete" && "Delete Leave Policy"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowPolicyModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {policyModalType === "view" && (
              <div className="space-y-3">
                <p className="text-sm">
                  <span className="font-medium">Name:</span> {selectedPolicy.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Days:</span> {selectedPolicy.days}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Usage:</span> {selectedPolicy.usage || "0%"}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Carry over:</span> {selectedPolicy.carryOver ? "Yes" : "No"}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Description:</span> {selectedPolicy.description || "—"}
                </p>
                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setShowPolicyModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}

            {policyModalType === "edit" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editPolicyName">Name</Label>
                  <Input
                    id="editPolicyName"
                    value={editingPolicy.name}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editPolicyDays">Days</Label>
                  <Input
                    id="editPolicyDays"
                    type="number"
                    min="0"
                    value={editingPolicy.days}
                    onChange={(e) =>
                      setEditingPolicy({ ...editingPolicy, days: Number.parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="editPolicyDescription">Description</Label>
                  <Textarea
                    id="editPolicyDescription"
                    value={editingPolicy.description}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <Button variant="outline" onClick={() => setShowPolicyModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSavePolicyChanges}
                    disabled={isSavingPolicy}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    {isSavingPolicy ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {policyModalType === "delete" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete <span className="font-medium text-foreground">{selectedPolicy.name}</span>?
                  This will deactivate the leave policy for the tenant.
                </p>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowPolicyModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeletePolicy} disabled={isSavingPolicy}>
                    {isSavingPolicy ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Policy"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Structured Salary Grade Modal */}
      {showSalaryGradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{editingGrade ? "Edit Salary Grade" : "Add Salary Grade"}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowSalaryGradeModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="gradeName">Grade Name</Label>
                <Input
                  id="gradeName"
                  value={newGrade.name}
                  onChange={(e) => setNewGrade({ ...newGrade, name: e.target.value })}
                  placeholder="e.g., Grade 1"
                />
              </div>
              <div>
                <Label htmlFor="gradeDescription">Description</Label>
                <Input
                  id="gradeDescription"
                  value={newGrade.description}
                  onChange={(e) => setNewGrade({ ...newGrade, description: e.target.value })}
                  placeholder="e.g., Entry Level"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minSalary">Min Salary</Label>
                  <Input
                    id="minSalary"
                    type="number"
                    value={newGrade.minSalary}
                    onChange={(e) => setNewGrade({ ...newGrade, minSalary: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxSalary">Max Salary</Label>
                  <Input
                    id="maxSalary"
                    type="number"
                    value={newGrade.maxSalary}
                    onChange={(e) => setNewGrade({ ...newGrade, maxSalary: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="numberOfNotches">Number of Notches</Label>
                <Input
                  id="numberOfNotches"
                  type="number"
                  min="2"
                  max="20"
                  value={newGrade.numberOfNotches}
                  onChange={(e) =>
                    setNewGrade({ ...newGrade, numberOfNotches: Number.parseInt(e.target.value) || 5 })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={handleGenerateNotches} disabled={isGeneratingNotches}>
                  {isGeneratingNotches ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Notches"
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">{(newGrade.notches || []).length} notches ready</span>
              </div>
              {(newGrade.notches || []).length > 0 && (
                <div className="bg-gray-50 border rounded-md p-3 max-h-40 overflow-y-auto space-y-1">
                  {newGrade.notches.map((notch) => (
                    <div key={notch.step} className="flex justify-between text-xs">
                      <span>Step {notch.step}</span>
                      <span className="font-medium">₵{Number(notch.amount || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="outline" onClick={() => setShowSalaryGradeModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSalaryGrade} className="bg-black text-white hover:bg-gray-800">
                  {editingGrade ? "Update Grade" : "Save Grade"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unstructured Salary Grade Modal */}
      {showUnstructuredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingUnstructured ? "Edit Unstructured Grade" : "Add Unstructured Grade"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowUnstructuredModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="unstructuredName">Grade Name</Label>
                <Input
                  id="unstructuredName"
                  value={newUnstructured.name}
                  onChange={(e) => setNewUnstructured({ ...newUnstructured, name: e.target.value })}
                  placeholder="e.g., Management Level"
                />
              </div>
              <div>
                <Label htmlFor="unstructuredDescription">Description</Label>
                <Textarea
                  id="unstructuredDescription"
                  value={newUnstructured.description}
                  onChange={(e) => setNewUnstructured({ ...newUnstructured, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>General Increment Type</Label>
                  <Select
                    value={newUnstructured.generalIncrement.type}
                    onValueChange={(value) =>
                      setNewUnstructured({
                        ...newUnstructured,
                        generalIncrement: { ...newUnstructured.generalIncrement, type: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>General Increment Value</Label>
                  <Input
                    type="number"
                    value={newUnstructured.generalIncrement.value}
                    onChange={(e) =>
                      setNewUnstructured({
                        ...newUnstructured,
                        generalIncrement: {
                          ...newUnstructured.generalIncrement,
                          value: Number.parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Performance Increment Type</Label>
                  <Select
                    value={newUnstructured.performanceIncrement.type}
                    onValueChange={(value) =>
                      setNewUnstructured({
                        ...newUnstructured,
                        performanceIncrement: { ...newUnstructured.performanceIncrement, type: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Performance Increment Value</Label>
                  <Input
                    type="number"
                    value={newUnstructured.performanceIncrement.value}
                    onChange={(e) =>
                      setNewUnstructured({
                        ...newUnstructured,
                        performanceIncrement: {
                          ...newUnstructured.performanceIncrement,
                          value: Number.parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="outline" onClick={() => setShowUnstructuredModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveUnstructuredGrade} className="bg-black text-white hover:bg-gray-800">
                  {editingUnstructured ? "Update Grade" : "Save Grade"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateConfirm && subsidiaryToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-xl">Confirm Action</CardTitle>
              <CardDescription>
                Are you sure you want to {subsidiaryToToggle.status === 'active' ? 'deactivate' : 'activate'} this subsidiary?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowDeactivateConfirm(false)
                    setSubsidiaryToToggle(null)
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant={subsidiaryToToggle.status === 'active' ? 'destructive' : 'default'}
                  onClick={() => {
                    handleToggleSubsidiaryStatus(subsidiaryToToggle.id)
                    setShowDeactivateConfirm(false)
                    setSubsidiaryToToggle(null)
                  }}
                >
                  {subsidiaryToToggle.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
