"use client"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
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
  logo_url?: string
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
  logo_url?: string
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
}

// Added for Access Control and Security
interface AccessSettings {
  twoFactorEnabled: boolean
  ssoEnabled: boolean
  passwordExpiryEnabled: boolean
  sessionTimeout: number
  maxLoginAttempts: number
  passwordMinLength: number
  ipRestrictionsEnabled: boolean
  allowedIPs: string[]
}

interface SecuritySettings {
  dataEncryptionEnabled: boolean
  auditLoggingEnabled: boolean
  autoBackupEnabled: boolean
  backupFrequency: string
  dataRetentionDays: number
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
  last_activity: string
}

const isDemoMode = () => {
  if (typeof window !== "undefined") {
    const demoSession = document.cookie.includes("demo-session=active")
    const demoProfile = localStorage.getItem("demo_profile")
    return demoSession || !!demoProfile
  }
  return false
}

export default function SettingsPage() {
  console.log("[v0] SettingsPage component initializing...")

  const { toast } = useToast()
  const supabase = createClient()

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
  })

  const [hrConfig, setHrConfig] = useState({
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

  const [hrDocuments, setHrDocuments] = useState([
    {
      id: 1,
      name: "Employee Handbook",
      type: "PDF",
      size: "1.2MB",
      visibleToAll: true,
      fileUrl: "/placeholder-document.pdf",
      uploadedAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Code of Conduct",
      type: "DOC",
      size: "0.5MB",
      visibleToAll: true,
      fileUrl: "/placeholder-document.pdf",
      uploadedAt: new Date().toISOString()
    },
    {
      id: 3,
      name: "Safety Manual",
      type: "PDF",
      size: "0.8MB",
      visibleToAll: false,
      fileUrl: "/placeholder-document.pdf",
      uploadedAt: new Date().toISOString()
    },
  ])

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
  const [currentPolicies, setCurrentPolicies] = useState([
    { name: "Annual Leave", days: 21, usage: "68%", trend: "up", description: "Annual vacation leave" },
    { name: "Sick Leave", days: 10, usage: "23%", trend: "down", description: "Medical leave for illness" },
    { name: "Maternity Leave", days: 84, usage: "12%", trend: "stable", description: "Maternity and paternity leave" },
  ])

  const [divisions, setDivisions] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false)
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null)
  const [showAddSubsidiary, setShowAddSubsidiary] = useState<boolean>(false)
  const [showEditSubsidiary, setShowEditSubsidiary] = useState(false)
  const [showSubsidiaryDetails, setShowSubsidiaryDetails] = useState(false)
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<Subsidiary | null>(null)
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
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null)

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

  const [allowances, setAllowances] = useState([
    {
      code: "TRANS",
      description: "Transport Allowance",
      taxable: true,
      recurring: true,
      amount: 0,
      percentage: 0,
      type: "FIXED",
    },
    {
      code: "HOUSE",
      description: "Housing Allowance",
      taxable: true,
      recurring: true,
      amount: 0,
      percentage: 0,
      type: "FIXED",
    },
    {
      code: "MED",
      description: "Medical Allowance",
      taxable: false,
      recurring: true,
      amount: 0,
      percentage: 0,
      type: "FIXED",
    },
  ])

  const [deductions, setDeductions] = useState([
    { code: "TAX", description: "Tax Deduction", recurring: true, amount: 0, percentage: 0, type: "VARIABLE" },
    { code: "SSNIT", description: "SSNIT Deduction", recurring: true, amount: 0, percentage: 5.5, type: "VARIABLE" },
    { code: "LOAN", description: "Loan Deduction", recurring: true, amount: 0, percentage: 0, type: "FIXED" },
  ])

  const [ssnitRates, setSsnitRates] = useState({
    employee: 5.5,
    employer: 13,
    total: 18.5,
  })

  const [tier2Rates, setTier2Rates] = useState({
    employee: 5.5,
    employer: 5.5,
    total: 11,
  })

  const [tier3Rates, setTier3Rates] = useState({
    employee: 5,
    employer: 5,
    total: 10,
  })

  const [isSavingPayroll, setIsSavingPayroll] = useState(false)
  const [isSavingTax, setIsSavingTax] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const currencyConfig = {
    ghs: {
      symbol: "₵",
      name: "Ghana Cedis (GHS)",
      country: "Ghana",
      apiEndpoint: "https://api.gra.gov.gh/tax-rates",
      lastUpdated: "2024-01-01",
      version: "2024.1",
      taxBands: [
        { rate: 0, from: 0, to: 490, cumulativeTax: 0 },
        { rate: 5, from: 491, to: 600, cumulativeTax: 0 },
        { rate: 10, from: 601, to: 730, cumulativeTax: 5.5 },
        { rate: 17.5, from: 731, to: 3896.67, cumulativeTax: 18.5 },
        { rate: 25, from: 3896.68, to: 19896.67, cumulativeTax: 572.54 },
        { rate: 30, from: 19896.68, to: 50416.67, cumulativeTax: 4572.54 },
        { rate: 35, from: 50416.68, to: Number.POSITIVE_INFINITY, cumulativeTax: 13728.54 },
      ],
      socialSecurity: {
        employee: 5.5,
        employer: 13.0,
        total: 18.5,
        cap: 2000000, // Annual cap in GHS
      },
      tier2: {
        employee: 5.5,
        employer: 5.5,
        total: 11.0,
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

  const [notificationTemplates, setNotificationTemplates] = useState([
    {
      id: "1",
      name: "Employee Welcome",
      category: "HR",
      type: "Email",
      status: "Active",
      lastModified: "2024-01-15",
      description: "Welcome email sent to new employees",
    },
    {
      id: "2",
      name: "Payroll Processed",
      category: "Payroll",
      type: "Email",
      status: "Active",
      lastModified: "2024-01-10",
      description: "Notification when payroll is processed",
    },
    {
      id: "3",
      name: "Leave Request Approved",
      category: "Leave",
      type: "Email",
      status: "Active",
      lastModified: "2024-01-08",
      description: "Notification when leave is approved",
    },
    {
      id: "4",
      name: "Attendance Alert",
      category: "Attendance",
      type: "SMS",
      status: "Draft",
      lastModified: "2024-01-05",
      description: "Alert for attendance issues",
    },
  ])

  const [emailConfig, setEmailConfig] = useState({
    provider: "smtp",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    fromEmail: "hr@company.com",
    fromName: "HR Department",
    replyTo: "noreply@company.com",
    enableTLS: true,
    enableSSL: false,
  })

  const [notificationSettings, setNotificationSettings] = useState({
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
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    ipRestrictionsEnabled: false,
    allowedIPs: [],
  })
  const [isSavingAccessSettings, setIsSavingAccessSettings] = useState(false)
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [isRefreshingSessions, setIsRefreshingSessions] = useState(false)

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    dataEncryptionEnabled: true,
    auditLoggingEnabled: true,
    autoBackupEnabled: true,
    backupFrequency: "daily",
    dataRetentionDays: 90,
  })
  const [isSavingSecuritySettings, setIsSavingSecuritySettings] = useState(false)
  const [backupSize, setBackupSize] = useState<string | null>(null)
  const [backupStatus, setBackupStatus] = useState<string | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isExportingReport, setIsExportingReport] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [testConnectionStatus, setTestConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")

  // Structured Salary Grades
  const [salaryGrades, setSalaryGrades] = useState([
    {
      id: 1,
      name: "Grade 1",
      description: "Entry Level",
      minSalary: 2500,
      maxSalary: 4000,
      notches: [
        { step: 1, amount: 2500 },
        { step: 2, amount: 2750 },
        { step: 3, amount: 3000 },
        { step: 4, amount: 3250 },
        { step: 5, amount: 3500 },
        { step: 6, amount: 3750 },
        { step: 7, amount: 4000 },
      ],
    },
  ])
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
  const [unstructuredGrades, setUnstructuredGrades] = useState([
    {
      id: 1,
      name: "Management Level",
      description: "Senior management positions",
      generalIncrement: { type: "percentage", value: 5 },
      performanceIncrement: { type: "percentage", value: 10 },
    },
  ])
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

    let tax = 0
    let remainingIncome = income

    for (const band of config.taxBands) {
      if (remainingIncome <= 0) break

      const bandIncome = band.to ? Math.min(remainingIncome, band.to - (band.from || 0)) : remainingIncome
      tax += (bandIncome * band.rate) / 100
      remainingIncome -= bandIncome
    }

    return tax
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update API status
      setApiStatus((prev) => ({
        ...prev,
        [currency]: {
          ...prev[currency as keyof typeof prev],
          connected: true,
          lastSync: new Date().toISOString(),
          status: "active",
        },
      }))

      toast({
        title: "Success",
        description: `${currency.toUpperCase()} tax rates synced successfully`,
      })
    } catch (error) {
      console.error(`[v0] Error syncing ${currency} tax rates:`, error)
      toast({
        title: "Error",
        description: "Failed to sync tax rates",
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
  const handleLogoUpload = async (file: File, type: "company" | "subsidiary") => {
    if (!file) return

    setIsUploadingLogo(true)
    try {
      // Create form data for blob upload
      const formData = new FormData()
      formData.append("file", file)

      // Upload to Vercel Blob
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const { url } = await response.json()

      // Set preview based on type
      if (type === "company") {
        setCompanyLogoPreview(url)
        setCompanyData({ ...companyData, logo_url: url })
      } else {
        setSubsidiaryLogoPreview(url)
        if (selectedSubsidiary) {
          const updatedSubsidiary = { ...selectedSubsidiary, logo_url: url }
          setSelectedSubsidiary(updatedSubsidiary)
          // Also update the subsidiary in the main list
          setSubsidiaries((prev) =>
            prev.map((sub) => (sub.id === selectedSubsidiary.id ? { ...sub, logo_url: url } : sub)),
          )
        }
      }

      toast({
        title: "Logo uploaded successfully",
        description: "Your logo has been uploaded and is ready to use.",
      })
    } catch (error) {
      console.error("Logo upload error:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingLogo(false)
    }
  }

  // Load functions
  const loadCompanyData = async () => {
    console.log("[v0] Loading company data...")

    if (isDemoMode()) {
      console.log("[v0] Demo mode detected, using mock company data")
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
      })
      setDivisions(["Head Office", "Regional Office"])
      setDepartments(["Technology", "Human Resources", "Finance"])
      setLocations(["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"])
      return
    }

    try {
      const { data, error } = await supabase.from("companies").select("*").single()

      if (error) throw error

      if (data) {
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
          divisions: data.divisions || [],
          departments: data.departments || [],
          locations: data.locations || [],
        })

        setDivisions(data.divisions || [])
        setDepartments(data.departments || [])
        setLocations(data.locations || [])
        setLogoPreview(data.logo_url || "")
      }
    } catch (error) {
      console.error("[v0] Error loading company data:", error)
      if (error.message && error.message.includes("infinite recursion detected in policy")) {
        console.log("[v0] Database policy error detected, falling back to demo mode")
        // Set demo session cookie to prevent future database calls
        document.cookie = "demo-session=active; path=/; max-age=86400"
        // Load demo data
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
        })
        setDivisions(["Head Office", "Regional Office"])
        setDepartments(["Technology", "Human Resources", "Finance"])
        setLocations(["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"])
        return
      }
      toast({
        title: "Error",
        description: "Failed to load company data",
        variant: "destructive",
      })
    }
  }

  const loadEmployees = async () => {
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
      const { data, error } = await supabase.from("employees").select("*").order("created_at", { ascending: false })

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

  const loadSubsidiaries = async () => {
    console.log("[v0] Loading subsidiaries...")

    if (isDemoMode()) {
      console.log("[v0] Demo mode detected, using mock subsidiaries data")
      setSubsidiaries([
        {
          id: "sub-001",
          company_id: "comp-001",
          name: "Akwaaba Digital Solutions",
          email_address: "info@akwaabadigital.com",
          phone_number: "+233 30 276 5432",
          tax_id: "TIN-ADS-2023-001",
          ssnit_number: "SSNIT-ADS-789012",
          address: "15 Liberation Road, Ridge, Accra, Ghana",
          status: "active",
          industry: "Digital Marketing & Web Development",
          divisions: ["Digital Marketing", "Web Development", "Mobile Apps"],
          departments: ["Marketing", "Development", "Design", "Sales"],
          locations: ["Accra - Ridge", "Kumasi Branch"],
          divisions_count: 3,
          departments_count: 4,
          locations_count: 2,
          employee_count: 45,
          created_at: new Date().toISOString(),
        },
        {
          id: "sub-002",
          company_id: "comp-001",
          name: "Akwaaba Consulting Group",
          email_address: "consulting@akwaaba.com",
          phone_number: "+233 30 276 5433",
          tax_id: "TIN-ACG-2023-002",
          ssnit_number: "SSNIT-ACG-789013",
          address: "8 Airport Residential Area, Accra, Ghana",
          status: "active",
          industry: "Business Consulting & Strategy",
          divisions: ["Strategy Consulting", "Digital Transformation", "Process Optimization"],
          departments: ["Consulting", "Strategy", "Operations", "Client Relations"],
          locations: ["Accra - Airport", "Tema Office"],
          divisions_count: 3,
          departments_count: 4,
          locations_count: 2,
          employee_count: 32,
          created_at: new Date().toISOString(),
        },
        {
          id: "sub-003",
          company_id: "comp-001",
          name: "Akwaaba Financial Services",
          email_address: "finance@akwaabafs.com",
          phone_number: "+233 30 276 5434",
          tax_id: "TIN-AFS-2023-003",
          ssnit_number: "SSNIT-AFS-789014",
          address: "25 Independence Avenue, Accra, Ghana",
          status: "active",
          industry: "Financial Technology & Services",
          divisions: ["Fintech Solutions", "Payment Processing", "Financial Advisory"],
          departments: ["Finance", "Technology", "Compliance", "Customer Service"],
          locations: ["Accra - Independence Ave", "Ho Regional Office"],
          divisions_count: 3,
          departments_count: 4,
          locations_count: 2,
          employee_count: 28,
          created_at: new Date().toISOString(),
        },
        {
          id: "sub-004",
          company_id: "comp-001",
          name: "Akwaaba Logistics Ltd",
          email_address: "logistics@akwaabalog.com",
          phone_number: "+233 30 276 5435",
          tax_id: "TIN-ALL-2023-004",
          ssnit_number: "SSNIT-ALL-789015",
          address: "12 Spintex Road, Accra, Ghana",
          status: "active",
          industry: "Supply Chain & Logistics",
          divisions: ["Transportation", "Warehousing", "Supply Chain Management"],
          departments: ["Operations", "Fleet Management", "Warehousing", "Customer Service"],
          locations: ["Accra - Spintex", "Takoradi Port", "Tamale Hub"],
          divisions_count: 3,
          departments_count: 4,
          locations_count: 3,
          employee_count: 67,
          created_at: new Date().toISOString(),
        },
        {
          id: "sub-005",
          company_id: "comp-001",
          name: "Akwaaba Training Institute",
          email_address: "training@akwaabainstitute.com",
          phone_number: "+233 30 276 5436",
          tax_id: "TIN-ATI-2023-005",
          ssnit_number: "SSNIT-ATI-789016",
          address: "5 Cantonments Road, Accra, Ghana",
          status: "active",
          industry: "Education & Professional Training",
          divisions: ["Corporate Training", "IT Certification", "Professional Development"],
          departments: ["Training", "Curriculum Development", "Student Services", "Administration"],
          locations: ["Accra - Cantonments", "Kumasi Campus", "Online Platform"],
          divisions_count: 3,
          departments_count: 4,
          locations_count: 3,
          employee_count: 23,
          created_at: new Date().toISOString(),
        },
      ])
      return
    }

    try {
      // Load subsidiaries with employee counts
      const { data: subsidiariesData, error: subsidiariesError } = await supabase
        .from("subsidiaries")
        .select(`
          *,
          employees:employees(count)
        `)
        .order("created_at", { ascending: false })

      if (subsidiariesError) throw subsidiariesError

      // Process the data to add computed fields
      const processedSubsidiaries = (subsidiariesData || []).map((sub: any) => ({
        ...sub,
        divisions: Array.isArray(sub.divisions) ? sub.divisions : [],
        departments: Array.isArray(sub.departments) ? sub.departments : [],
        locations: Array.isArray(sub.locations) ? sub.locations : [],
        divisions_count: Array.isArray(sub.divisions) ? sub.divisions.length : 0,
        departments_count: Array.isArray(sub.departments) ? sub.departments.length : 0,
        locations_count: Array.isArray(sub.locations) ? sub.locations.length : 0,
        employee_count: sub.employees?.[0]?.count || 0,
      }))

      setSubsidiaries(processedSubsidiaries)
      console.log("[v0] Loaded subsidiaries:", processedSubsidiaries.length)
    } catch (error) {
      console.error("Subsidiaries loading error:", error)
      toast({
        title: "Error",
        description: "Failed to load subsidiaries",
        variant: "destructive",
      })
    }
  }

  const loadRoles = async () => {
    console.log("[v0] Loading roles...")

    if (isDemoMode()) {
      console.log("[v0] Demo mode detected, using mock roles data")
      setRoles([
        {
          id: "role-001",
          name: "Administrator",
          description: "Full system access and management capabilities",
          permissions: ["all"],
          user_count: 2,
        },
        {
          id: "role-002",
          name: "HR Manager",
          description: "Human resources management and employee oversight",
          permissions: ["hr", "employees", "reports"],
          user_count: 3,
        },
        {
          id: "role-003",
          name: "Employee",
          description: "Standard employee access to personal information",
          permissions: ["profile", "payslip", "leave"],
          user_count: 45,
        },
      ])
      return
    }

    try {
      const { data, error } = await supabase.from("roles").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setRoles(data || [])
    } catch (error) {
      console.error("Error loading roles:", error)
      if (error.message && error.message.includes("infinite recursion detected in policy")) {
        console.log("[v0] Database policy error detected, falling back to demo mode for roles")
        document.cookie = "demo-session=active; path=/; max-age=86400"
        setRoles([
          {
            id: "role-001",
            name: "Administrator",
            description: "Full system access",
            permissions: ["read", "write", "delete", "admin"],
            status: "active",
          },
          {
            id: "role-002",
            name: "HR Manager",
            description: "Human Resources management",
            permissions: ["read", "write"],
            status: "active",
          },
        ])
        return
      }
      toast({
        title: "Error",
        description: "Failed to load roles",
        variant: "destructive",
      })
    }
  }

  // Added for Access Control and Security
  const loadAccessAndSecurityData = async () => {
    console.log("[v0] Loading access and security data...")
    // Simulate fetching data
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock data for demonstration
    setAccessSettings({
      twoFactorEnabled: true,
      ssoEnabled: false,
      passwordExpiryEnabled: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordMinLength: 10,
      ipRestrictionsEnabled: true,
      allowedIPs: ["192.168.1.0/24", "10.0.0.1"],
    })
    setSecuritySettings({
      dataEncryptionEnabled: true,
      auditLoggingEnabled: true,
      autoBackupEnabled: true,
      backupFrequency: "daily",
      dataRetentionDays: 180,
    })
    setLastBackupTime(new Date("2024-03-10T10:00:00Z").toISOString())
    setBackupSize("50 MB")
    setBackupStatus("Completed")
    setAuditLogs([
      {
        id: "log-001",
        user_email: "admin@example.com",
        action: "User logged in",
        timestamp: new Date("2024-03-11T09:00:00Z").toISOString(),
        ip_address: "192.168.1.10",
        severity: "low",
      },
      {
        id: "log-002",
        user_email: "hr@example.com",
        action: "Updated employee record",
        timestamp: new Date("2024-03-11T09:05:00Z").toISOString(),
        ip_address: "192.168.1.11",
        severity: "medium",
      },
      {
        id: "log-003",
        user_email: "admin@example.com",
        action: "Security settings modified",
        timestamp: new Date("2024-03-11T09:10:00Z").toISOString(),
        ip_address: "192.168.1.10",
        severity: "high",
      },
    ])
    setActiveSessions([
      {
        id: "session-001",
        user_email: "admin@example.com",
        ip_address: "192.168.1.10",
        device: "Desktop",
        last_activity: new Date("2024-03-11T09:10:00Z").toISOString(),
      },
      {
        id: "session-002",
        user_email: "user@example.com",
        ip_address: "10.0.0.5",
        device: "Mobile",
        last_activity: new Date("2024-03-11T08:30:00Z").toISOString(),
      },
    ])
    console.log("[v0] Access and security data loaded.")
  }

  const loadAllData = async () => {
    console.log("[v0] Loading settings data...")
    try {
      await Promise.all([
        loadCompanyData(),
        loadEmployees(),
        loadSubsidiaries(),
        loadRoles(),
        loadAccessAndSecurityData(),
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

    if (isDemoMode()) {
      toast({
        title: "Settings Synced",
        description: "Subsidiary settings synchronized successfully (Demo Mode)",
      })
      return
    }

    try {
      // Simulate settings sync process
      const { error } = await supabase
        .from("subsidiaries")
        .update({
          settings_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", subsidiaryId)

      if (error) throw error

      toast({
        title: "Settings Synced",
        description: "Subsidiary settings synchronized successfully",
      })
    } catch (error) {
      console.error("Sync settings error:", error)
      toast({
        title: "Error",
        description: "Failed to sync subsidiary settings",
        variant: "destructive",
      })
    }
  }

  const refreshEmployeeCount = async (subsidiaryId: string) => {
    console.log("[v0] Refreshing employee count for subsidiary:", subsidiaryId)

    if (isDemoMode()) {
      // Simulate employee count refresh in demo mode
      const mockCount = Math.floor(Math.random() * 100) + 10 // Random count between 10-110
      const updatedSubsidiaries = subsidiaries.map((sub) =>
        sub.id === subsidiaryId ? { ...sub, employee_count: mockCount } : sub,
      )
      setSubsidiaries(updatedSubsidiaries)

      if (selectedSubsidiary?.id === subsidiaryId) {
        setSelectedSubsidiary({ ...selectedSubsidiary, employee_count: mockCount })
      }
      return mockCount
    }

    try {
      const { count, error } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("subsidiary_id", subsidiaryId)

      if (error) throw error

      const employeeCount = count || 0
      await updateSubsidiary(subsidiaryId, { employee_count: employeeCount })

      return employeeCount
    } catch (error) {
      console.error("Refresh employee count error:", error)
      return 0
    }
  }

  const viewSubsidiaryEmployees = async (subsidiaryId: string) => {
    console.log("[v0] Viewing employees for subsidiary:", subsidiaryId)

    const currentCount = await refreshEmployeeCount(subsidiaryId)

    if (isDemoMode()) {
      const mockEmployees = Array.from({ length: currentCount }, (_, i) => ({
        id: `emp-${i + 1}`,
        name: `Employee ${i + 1}`,
        position: ["Software Engineer", "Marketing Manager", "HR Specialist", "Sales Representative", "Accountant"][
          i % 5
        ],
        department: ["Technology", "Marketing", "Human Resources", "Sales", "Finance"][i % 5],
        email: `employee${i + 1}@company.com`,
      }))

      setViewEmployeesModal({
        isOpen: true,
        subsidiaryId,
        employees: mockEmployees,
      })
      return
    }

    try {
      const { data: employees, error } = await supabase.from("employees").select("*").eq("subsidiary_id", subsidiaryId)

      if (error) throw error

      setViewEmployeesModal({
        isOpen: true,
        subsidiaryId,
        employees: employees || [],
      })
    } catch (error) {
      console.error("View employees error:", error)
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      })
    }
  }

  const addNewSubsidiary = async (subsidiaryData: Partial<Subsidiary>) => {
    console.log("[v0] Adding new subsidiary:", subsidiaryData)

    if (isDemoMode()) {
      const newSubsidiary: Subsidiary = {
        id: `sub-${Date.now()}`,
        company_id: "comp-001",
        name: subsidiaryData.name || "New Subsidiary",
        tax_id: subsidiaryData.tax_id || `TIN-${Date.now()}`,
        ssnit_number: subsidiaryData.ssnit_number || `SSNIT-${Date.now()}`,
        address: subsidiaryData.address || "",
        phone_number: subsidiaryData.phone_number || "",
        email_address: subsidiaryData.email_address || "",
        status: "active",
        industry: subsidiaryData.industry || "",
        divisions: subsidiaryData.divisions || [],
        departments: subsidiaryData.departments || [],
        locations: subsidiaryData.locations || [],
        divisions_count: 0,
        departments_count: 0,
        locations_count: 0,
        employee_count: 0,
        created_at: new Date().toISOString(),
        logo_url: subsidiaryLogoPreview || "", // Include uploaded logo URL
      }
      setSubsidiaries((prev) => [newSubsidiary, ...prev])

      setSubsidiaryLogoPreview("")

      toast({
        title: "Subsidiary Added",
        description: "New subsidiary created successfully (Demo Mode)",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("subsidiaries")
        .insert([
          {
            company_id: companyData?.id,
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
            logo_url: subsidiaryLogoPreview || "", // Include uploaded logo URL
          },
        ])
        .select()

      if (error) throw error

      await loadSubsidiaries() // Reload the list

      setSubsidiaryLogoPreview("")

      toast({
        title: "Subsidiary Added",
        description: "New subsidiary created successfully",
      })
    } catch (error) {
      console.error("Add subsidiary error:", error)
      toast({
        title: "Error",
        description: "Failed to add subsidiary",
        variant: "destructive",
      })
    }
  }

  const updateSubsidiary = async (subsidiaryId: string, updates: Partial<Subsidiary>) => {
    console.log("[v0] Updating subsidiary:", subsidiaryId, updates)

    if (isDemoMode()) {
      // Update in local state for demo mode
      const updatedSubsidiaries = subsidiaries.map((sub) => {
        if (sub.id === subsidiaryId) {
          const updatedSub = {
            ...sub,
            ...updates,
            // Recalculate counts based on arrays
            divisions_count: Array.isArray(updates.divisions) ? updates.divisions.length : sub.divisions_count,
            departments_count: Array.isArray(updates.departments) ? updates.departments.length : sub.departments_count,
            locations_count: Array.isArray(updates.locations) ? updates.locations.length : sub.locations_count,
            updated_at: new Date().toISOString(),
          }
          return updatedSub
        }
        return sub
      })
      setSubsidiaries(updatedSubsidiaries)

      // Update selectedSubsidiary if it matches
      if (selectedSubsidiary?.id === subsidiaryId) {
        const updatedSelected = updatedSubsidiaries.find((sub) => sub.id === subsidiaryId)
        if (updatedSelected) {
          setSelectedSubsidiary(updatedSelected)
        }
      }

      toast({
        title: "Success",
        description: "Subsidiary updated successfully (Demo Mode)",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("subsidiaries")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subsidiaryId)

      if (error) throw error

      // Reload subsidiaries to get fresh data
      await loadSubsidiaries()

      toast({
        title: "Success",
        description: "Subsidiary updated successfully",
      })
    } catch (error) {
      console.error("Update subsidiary error:", error)
      toast({
        title: "Error",
        description: "Failed to update subsidiary",
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

    if (isDemoMode()) {
      setSubsidiaries((prev) => prev.filter((s) => s.id !== subsidiaryId))
      toast({
        title: "Subsidiary Deleted",
        description: "Subsidiary has been deleted successfully (Demo Mode)",
      })
      return
    }

    try {
      const { error } = await supabase.from("subsidiaries").delete().eq("id", subsidiaryId)

      if (error) throw error

      setSubsidiaries((prev) => prev.filter((s) => s.id !== subsidiaryId))
      toast({
        title: "Subsidiary Deleted",
        description: "Subsidiary has been deleted successfully",
      })
    } catch (error) {
      console.error("Subsidiary deletion error:", error)
      toast({
        title: "Error",
        description: "Failed to delete subsidiary",
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
    toast({
      title: "Add Role",
      description: "Opening role creation form...",
    })
  }

  const handleEditRoleInner = (roleName: string) => {
    toast({
      title: "Edit Role",
      description: `Editing ${roleName} role...`,
    })
  }

  const handleBackupNowInner = async () => {
    setIsBackingUp(true)
    try {
      // Simulate backup process
      await new Promise((resolve) => setTimeout(resolve, 3000))
      setLastBackupTime(new Date().toISOString())
      setBackupSize("55 MB") // Simulate updated size
      setBackupStatus("Completed")
      toast({
        title: "Backup Successful",
        description: "Manual backup completed.",
      })
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to complete system backup.",
      })
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleSyncAllSettings = async () => {
    console.log("[v0] Syncing all subsidiary settings")

    if (isDemoMode()) {
      toast({
        title: "Syncing All Settings",
        description: "Synchronizing settings across all subsidiaries... (Demo Mode)",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("subsidiaries")
        .update({
          settings_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .neq("id", "00000000-0000-0000-0000-000000000000")

      if (error) throw error

      toast({
        title: "Settings Synchronized",
        description: "All subsidiary settings have been synchronized successfully",
      })
    } catch (error) {
      console.error("Sync all settings error:", error)
      toast({
        title: "Error",
        description: "Failed to sync all subsidiary settings",
        variant: "destructive",
      })
    }
  }

  const handleExportSettingsTemplate = async () => {
    console.log("[v0] Exporting settings template")

    try {
      const response = await fetch("/api/subsidiaries/export")

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
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/subsidiaries/import", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error)

      toast({
        title: "Import Successful",
        description: result.message,
      })

      // Refresh subsidiaries list
      await loadSubsidiaries()
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
    console.log("[v0] Saving all settings changes")
    setIsSavingSettings(true)

    if (isDemoMode()) {
      // Simulate saving delay for demo
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Settings Saved",
        description: "All settings changes have been saved successfully (Demo Mode)",
      })
      setIsSavingSettings(false)
      return
    }

    try {
      // Save any pending changes to subsidiaries
      const { error: subsidiaryError } = await supabase
        .from("subsidiaries")
        .update({
          updated_at: new Date().toISOString(),
        })
        .neq("id", "00000000-0000-0000-0000-000000000000")

      if (subsidiaryError) throw subsidiaryError

      // Save sync options to company settings
      const syncOptions = {
        hr_policies: true,
        payroll_configuration: true,
        leave_types: false,
        roles_permissions: false,
      }

      const { error: settingsError } = await supabase.from("company_settings").upsert({
        id: "sync_options",
        settings: syncOptions,
        updated_at: new Date().toISOString(),
      })

      if (settingsError) throw settingsError

      // Refresh data to show updates
      await loadAllData()

      toast({
        title: "Settings Saved",
        description: "All settings changes have been saved and updated successfully",
      })
    } catch (error) {
      console.error("Save settings error:", error)
      toast({
        title: "Error",
        description: "Failed to save settings changes",
        variant: "destructive",
      })
    } finally {
      setIsSavingSettings(false)
    }
  }

  // Enhanced Save button with loading state and better feedback
  const handleSaveSubsidiaryChanges = async () => {
    console.log("[v0] Saving subsidiary changes")
    setIsSavingSubsidiary(true)

    try {
      if (isDemoMode()) {
        // Simulate saving delay for demo
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast({
          title: "Changes Saved",
          description: "Subsidiary changes have been saved successfully (Demo Mode)",
        })
        setIsSavingSubsidiary(false)
        return
      }

      // Save any pending subsidiary changes
      await loadSubsidiaries()

      toast({
        title: "Changes Saved",
        description: "Subsidiary changes have been saved and updated successfully",
      })
    } catch (error) {
      console.error("Save subsidiary changes error:", error)
      toast({
        title: "Error",
        description: "Failed to save subsidiary changes. Please try again.",
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
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setCurrentPolicies((prev) => prev.filter((policy) => policy.name !== selectedPolicy.name))
      setShowPolicyModal(false)

      toast({
        title: "Policy Deleted",
        description: `${selectedPolicy.name} policy has been successfully deleted.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete policy. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingPolicy(false)
    }
  }

  const handleToggleDocumentVisibility = (docId: number) => {
    setHrDocuments((prev) => prev.map((doc) => (doc.id === docId ? { ...doc, visibleToAll: !doc.visibleToAll } : doc)))

    const doc = hrDocuments.find((d) => d.id === docId)
    toast({
      title: "Visibility Updated",
      description: `${doc?.name} is now ${doc?.visibleToAll ? "hidden from" : "visible to"} all employees.`,
    })
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
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setHrDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === selectedDocument.id) {
            const updates: any = { name: documentName }

            // If a new file was uploaded, update the file URL
            if (uploadedFile) {
              updates.fileUrl = URL.createObjectURL(uploadedFile)
              updates.type = uploadedFile.type.includes("pdf") ? "PDF" : uploadedFile.type.includes("word") ? "DOC" : "FILE"
              updates.size = `${(uploadedFile.size / (1024 * 1024)).toFixed(1)}MB`
            }

            return { ...doc, ...updates }
          }
          return doc
        }),
      )

      setShowDocumentModal(false)
      setDocumentName("")
      setUploadedFile(null)

      toast({
        title: "Document Updated",
        description: `${documentName} has been successfully updated.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update document. Please try again.",
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
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newPolicy = {
        name: newLeaveType.name,
        days: newLeaveType.days,
        usage: "0%",
        trend: "new",
        description: newLeaveType.description,
      }

      setCurrentPolicies((prev) => [...prev, newPolicy])
      setNewLeaveType({ name: "", days: 0, description: "", carryOver: false })
      setShowAddLeaveTypeModal(false)

      toast({
        title: "Leave Type Added",
        description: `${newLeaveType.name} has been successfully added.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add leave type. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingPolicy(false)
    }
  }

  const handlePolicyAction = (action, policyName) => {
    const policy = currentPolicies.find((p) => p.name === policyName)

    setSelectedPolicy(policy)
    setPolicyModalType(action)

    if (action === "edit") {
      setEditingPolicy({
        name: policy.name,
        days: policy.days,
        description: policy.description,
      })
    }

    setShowPolicyModal(true)
  }

  const handleSavePolicyChanges = async () => {
    setIsSavingPolicy(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update the policy in current policies
      setCurrentPolicies((prev) =>
        prev.map((policy) =>
          policy.name === selectedPolicy.name
            ? { ...policy, name: editingPolicy.name, days: editingPolicy.days, description: editingPolicy.description }
            : policy,
        ),
      )

      setShowPolicyModal(false)
      toast({
        title: "Policy Updated",
        description: `${editingPolicy.name} policy has been successfully updated.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update policy. Please try again.",
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
  const parseDocumentContent = (document: any) => {
    // If document has stored content from uploaded file, use that
    if (document.content) {
      return document.content
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
    setShowDocumentPreview(false) // Reset preview state

    // Immediately parse and set the document content
    const parsedContent = parseDocumentContent(document)
    setDocumentPreviewContent(parsedContent)
    
    // In a real PDF viewer, you'd set totalPages here based on loaded PDF
    setTotalPages(1)
    
    // Show preview after a brief delay to ensure smooth transition
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
      // Parse file content if not already parsed
      let content = documentPreviewContent
      if (!content || content.includes("File uploaded successfully")) {
        content = await parseFileContent(uploadedFile)
      }

      // Upload file to Vercel Blob storage
      const formData = new FormData()
      formData.append('file', uploadedFile)

      // Simulate file upload - in production, this would upload to Blob storage
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Create a temporary URL for the uploaded file
      const fileUrl = URL.createObjectURL(uploadedFile)

      // Determine file type more accurately
      let fileType = "FILE"
      const fileName = uploadedFile.name.toLowerCase()
      if (uploadedFile.type.includes("pdf") || fileName.endsWith('.pdf')) {
        fileType = "PDF"
      } else if (uploadedFile.type.includes("word") || fileName.endsWith('.docx')) {
        fileType = "DOCX"
      } else if (fileName.endsWith('.doc')) {
        fileType = "DOC"
      }

      const newDoc = {
        id: Date.now(),
        name: documentName,
        type: fileType,
        size: `${(uploadedFile.size / (1024 * 1024)).toFixed(1)}MB`,
        visibleToAll: false,
        fileUrl: fileUrl,
        uploadedAt: new Date().toISOString(),
        content: content // Store the parsed content
      }

      setHrDocuments((prev) => [...prev, newDoc])
      setShowDocumentModal(false)
      setDocumentName("")
      setUploadedFile(null)
      setDocumentPreviewContent("") // Clear preview content

      toast({
        title: "Document Added",
        description: `${documentName} has been successfully uploaded with content preview.`,
      })
    } catch (error) {
      console.error("Error saving document:", error)
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingDocument(false)
    }
  }

  const handleDeleteDocument = async (docId) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setHrDocuments((prev) => prev.filter((doc) => doc.id !== docId))
      setShowDocumentModal(false)
      toast({
        title: "Document Deleted",
        description: "Document has been successfully removed.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
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
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (isDemoMode) {
        toast({
          title: "HR Configuration Saved",
          description: "HR settings updated successfully (Demo Mode)",
        })
      } else {
        // Real database update would go here
        toast({
          title: "HR Configuration Saved",
          description: "HR settings updated successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save HR configuration",
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
    toast({
      title: "Add Role",
      description: "Opening role creation form...",
    })
  }

  const handleEditRole = (roleName: string) => {
    toast({
      title: "Edit Role",
      description: `Editing ${roleName} role...`,
    })
  }

  const handleBackupNow = async () => {
    setIsBackingUp(true)
    console.log("[v0] Initiating manual backup...")
    try {
      // Simulate backup process
      await new Promise((resolve) => setTimeout(resolve, 3000))
      setLastBackupTime(new Date().toISOString())
      setBackupSize("55 MB") // Simulate updated size
      setBackupStatus("Completed")
      toast({
        title: "Backup Successful",
        description: "Manual backup completed successfully.",
      })
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to complete system backup.",
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
    console.log("[v0] Adding new tax band...")
    const currentConfig = getCurrencyConfig(selectedCurrency)
    const newBand = {
      rate: 0,
      from: 0,
      to: 0,
      cumulativeTax: 0,
    }

    // Update the currency config with new band
    const updatedBands = [...currentConfig.taxBands, newBand]
    // This would typically update the state or database
    toast({
      title: "Success",
      description: "New tax band added successfully",
    })
  }

  const handleSavePayrollConfig = async () => {
    setIsSavingPayroll(true)
    console.log("[v0] Saving payroll configuration...")

    try {
      // Simulate save operation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Success",
        description: "Payroll configuration saved successfully",
      })
    } catch (error) {
      console.error("Error saving payroll config:", error)
      toast({
        title: "Error",
        description: "Failed to save payroll configuration",
        variant: "destructive",
      })
    } finally {
      setIsSavingPayroll(false)
    }
  }

  const handleSaveTaxConfig = async () => {
    setIsSavingTax(true)
    console.log("[v0] Saving tax configuration...")

    try {
      // Simulate save operation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Success",
        description: "Tax configuration saved successfully",
      })
    } catch (error) {
      console.error("Error saving tax config:", error)
      toast({
        title: "Error",
        description: "Failed to save tax configuration",
        variant: "destructive",
      })
    } finally {
      setIsSavingTax(false)
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
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (templateModalType === "edit" && editingTemplate) {
        // Update existing template
        const updatedTemplates = notificationTemplates.map((template) =>
          template.id === editingTemplate.id
            ? {
                ...template,
                name: newTemplate.name,
                category: newTemplate.category,
                type: newTemplate.type,
                description: newTemplate.subject,
                subject: newTemplate.subject,
                body: newTemplate.body,
                variables: newTemplate.variables,
                lastModified: new Date().toLocaleDateString(),
              }
            : template
        )
        setNotificationTemplates(updatedTemplates)
        
        toast({
          title: "Template Updated",
          description: `${newTemplate.name} has been updated successfully`,
        })
      } else {
        // Create new template
        const template = {
          id: Date.now().toString(),
          name: newTemplate.name,
          category: newTemplate.category,
          type: newTemplate.type,
          description: newTemplate.subject,
          status: "Active",
          lastModified: new Date().toLocaleDateString(),
          subject: newTemplate.subject,
          body: newTemplate.body,
          variables: newTemplate.variables,
        }

        setNotificationTemplates([...notificationTemplates, template])
        
        toast({
          title: "Template Created",
          description: `${newTemplate.name} has been created successfully`,
        })
      }

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

      // Reset form
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
        description: "Failed to save template. Please try again.",
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
    setIsSaving(true) // Use the general saving state
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setNotificationTemplates(notificationTemplates.filter((t) => t.id !== templateId))
      toast({
        title: "Template Deleted",
        description: "Template has been deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
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
      // Simulate API call to test SMTP connection
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Simulate random success/failure for demo
      const isSuccess = Math.random() > 0.3

      if (isSuccess) {
        setTestConnectionStatus("success")
        toast({
          title: "Connection Successful! ✅",
          description: "SMTP connection established successfully. Email configuration is working properly.",
        })
      } else {
        throw new Error("Connection failed")
      }
    } catch (error) {
      setTestConnectionStatus("error")
      toast({
        title: "Connection Failed ❌",
        description: "Unable to connect to SMTP server. Please check your credentials and settings.",
        variant: "destructive",
      })
    }

    // Reset status after 5 seconds
    setTimeout(() => setTestConnectionStatus("idle"), 5000)
  }

  const handleSaveEmailConfig = async () => {
    setIsSaving(true) // Use the general saving state
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast({
        title: "Email Configuration Saved",
        description: "Email settings have been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save email configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Added for Access Control
  const handleRefreshSessions = async () => {
    setIsRefreshingSessions(true)
    console.log("[v0] Refreshing active sessions...")
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
    // Mock data update
    setActiveSessions([
      {
        id: "session-001",
        user_email: "admin@example.com",
        ip_address: "192.168.1.10",
        device: "Desktop",
        last_activity: new Date().toISOString(),
      },
      {
        id: "session-003",
        user_email: "newuser@example.com",
        ip_address: "192.168.1.15",
        device: "Laptop",
        last_activity: new Date().toISOString(),
      },
    ])
    setIsRefreshingSessions(false)
    toast({ title: "Sessions Refreshed", description: "Active sessions have been updated." })
  }

  const handleTerminateSession = async (sessionId: string) => {
    console.log(`[v0] Terminating session: ${sessionId}`)
    if (!confirm("Are you sure you want to terminate this session?")) return
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    setActiveSessions((prev) => prev.filter((session) => session.id !== sessionId))
    toast({ title: "Session Terminated", description: "The selected session has been terminated." })
  }

  const handleSaveAccessSettings = async () => {
    setIsSavingAccessSettings(true)
    console.log("[v0] Saving access settings...")
    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call
    setIsSavingAccessSettings(false)
    toast({ title: "Access Settings Saved", description: "Access control settings have been updated." })
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
    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call
    setIsSavingSecuritySettings(false)
    toast({ title: "Security Settings Saved", description: "Security configurations have been updated." })
  }

  const handleViewAllLogs = () => {
    console.log("[v0] Navigating to Audit Logs page...")
    // In a real app, this would navigate to a dedicated audit logs page
    toast({ title: "View All Logs", description: "Navigating to the full audit log history." })
  }

  const handleExportSecurityReport = async () => {
    setIsExportingReport(true)
    console.log("[v0] Exporting security report...")
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate export process
    setIsExportingReport(false)
    toast({ title: "Report Exported", description: "Security report generated and downloaded." })
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

  const handleSaveSalaryGrade = () => {
    if (!newGrade.name || !newGrade.minSalary || !newGrade.maxSalary) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const gradeToAdd = {
      id: editingGrade ? editingGrade.id : Date.now(),
      name: newGrade.name,
      description: newGrade.description,
      minSalary: Number.parseFloat(newGrade.minSalary),
      maxSalary: Number.parseFloat(newGrade.maxSalary),
      notches: newGrade.notches,
    }

    if (editingGrade) {
      setSalaryGrades((prev) => prev.map((grade) => (grade.id === editingGrade.id ? gradeToAdd : grade)))
      toast({
        title: "Grade Updated",
        description: "Salary grade has been updated successfully.",
      })
    } else {
      setSalaryGrades((prev) => [...prev, gradeToAdd])
      toast({
        title: "Grade Added",
        description: "New salary grade has been added successfully.",
      })
    }

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
  }

  const handleDeleteSalaryGrade = (gradeId) => {
    setSalaryGrades((prev) => prev.filter((grade) => grade.id !== gradeId))
    toast({
      title: "Grade Deleted",
      description: "Salary grade has been deleted successfully.",
    })
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

  const handleSaveUnstructuredGrade = () => {
    if (!newUnstructured.name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const gradeToAdd = {
      id: editingUnstructured ? editingUnstructured.id : Date.now(),
      name: newUnstructured.name,
      description: newUnstructured.description,
      generalIncrement: newUnstructured.generalIncrement,
      performanceIncrement: newUnstructured.performanceIncrement,
    }

    if (editingUnstructured) {
      setUnstructuredGrades((prev) => prev.map((grade) => (grade.id === editingUnstructured.id ? gradeToAdd : grade)))
      toast({
        title: "Grade Updated",
        description: "Unstructured salary grade has been updated successfully.",
      })
    } else {
      setUnstructuredGrades((prev) => [...prev, gradeToAdd])
      toast({
        title: "Grade Added",
        description: "New unstructured salary grade has been added successfully.",
      })
    }

    setShowUnstructuredModal(false)
    setEditingUnstructured(null)
    setNewUnstructured({
      name: "",
      description: "",
      generalIncrement: { type: "percentage", value: 0 },
      performanceIncrement: { type: "percentage", value: 0 },
    })
  }

  const handleDeleteUnstructuredGrade = (gradeId) => {
    setUnstructuredGrades((prev) => prev.filter((grade) => grade.id !== gradeId))
    toast({
      title: "Grade Deleted",
      description: "Unstructured salary grade has been deleted successfully.",
    })
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

      <Tabs defaultValue="company" className="space-y-6">
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
                  {companyLogoPreview || companyData.logo_url ? (
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
                        onClick={() => {
                          setCompanyLogoPreview("")
                          setCompanyData({ ...companyData, logo_url: "" })
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
                  <Button onClick={() => setShowAddSubsidiary(true)}>
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
                                  setShowSubsidiaryDetails(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedSubsidiary(subsidiary)
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
                        <Button onClick={() => setShowAddSubsidiary(true)}>
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
                            <input type="checkbox" className="rounded" defaultChecked />
                            <span className="text-sm">HR Policies</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" defaultChecked />
                            <span className="text-sm">Payroll Configuration</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">Leave Types</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">Roles & Permissions</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Sync Actions</h4>

                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start bg-transparent"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentPolicies.map((policy) => (
                    <Card key={policy.name} className="border-l-4 border-l-blue-500">
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
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Salary Grades & Notches</span>
                </CardTitle>
                <CardDescription>Manage salary grades and compensation structure for employees</CardDescription>
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
                              <span className="font-medium">Range:</span> ₵{grade.minSalary.toLocaleString()} - ₵
                              {grade.maxSalary.toLocaleString()}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Notches:</span> {grade.notches.length} steps
                            </p>
                          </div>

                          <div className="border-t pt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-muted-foreground">Salary Steps</span>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-32 overflow-y-auto">
                              <div className="space-y-1">
                                {grade.notches.map((notch) => (
                                  <div key={notch.step} className="flex justify-between text-xs">
                                    <span>Step {notch.step}</span>
                                    <span className="font-medium">₵{notch.amount.toLocaleString()}</span>
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
                )}

                {/* Unstructured Salary Grades */}
                {salaryGradeTab === "unstructured" && (
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
                                    : `₵${grade.generalIncrement.value.toLocaleString()}`}
                                </span>
                              </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-800">Performance Increment</span>
                                <span className="text-sm font-semibold text-blue-900">
                                  {grade.performanceIncrement.type === "percentage"
                                    ? `${grade.performanceIncrement.value}%`
                                    : `₵${grade.performanceIncrement.value.toLocaleString()}`}
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
                    <Select defaultValue="monthly">
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
                    <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
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
                    <Input type="number" defaultValue="18.15" />
                  </div>

                  <div>
                    <Label htmlFor="weekdayOvertimeRate">Weekday Overtime Rate Multiplier</Label>
                    <Input type="number" step="0.1" defaultValue="1.5" />
                  </div>

                  <div>
                    <Label htmlFor="weekendOvertimeRate">Weekend Overtime Rate Multiplier</Label>
                    <Input type="number" step="0.1" defaultValue="2" />
                  </div>

                  <div>
                    <Label htmlFor="payrollCutoffDay">Payroll Cutoff Day</Label>
                    <Input type="number" min="1" max="31" defaultValue="25" />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="autoCalculatePAYE" defaultChecked />
                    <Label htmlFor="autoCalculatePAYE">Auto-calculate PAYE</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="autoCalculateSSNIT" defaultChecked />
                    <Label htmlFor="autoCalculateSSNIT">Auto-calculate SSNIT</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="autoCalculateProvidentFund" defaultChecked />
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
                        {getCurrencyConfig(selectedCurrency)?.taxBands.map((band, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-3 font-medium">{band.rate}</td>
                            <td className="border border-gray-200 px-4 py-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {band.rate}%
                              </span>
                            </td>
                            <td className="border border-gray-200 px-4 py-3">
                              {band.from ? band.from.toLocaleString() : "0"}
                            </td>
                            <td className="border border-gray-200 px-4 py-3">
                              {band.to ? band.to.toLocaleString() : "∞"}
                            </td>
                            <td className="border border-gray-200 px-4 py-3 font-medium text-green-600">
                              {band.cumulativeTax ? band.cumulativeTax.toLocaleString() : "0"}
                            </td>
                            <td className="border border-gray-200 px-4 py-3 text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  console.log("[v0] Editing tax band:", band)
                                }}
                              >
                                Edit
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
                        <Button onClick={() => {
                          setTemplateModalType("edit")
                        }}>
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
                            checked={notificationSettings.payrollNotifications} // Corrected to use a relevant setting
                            onCheckedChange={(checked) =>
                              setNotificationSettings({ ...notificationSettings, payrollNotifications: checked })
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
                    <Button
                      onClick={() => {
                        setIsSaving(true) // Use the general saving state
                        setTimeout(() => {
                          setIsSaving(false)
                          toast({
                            title: "Preferences Saved",
                            description: "Notification preferences have been updated successfully",
                          })
                        }, 1500)
                      }}
                      disabled={isSaving}
                    >
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
                  <Button variant="outline" onClick={handleAddRoleInner}>
                    Add Role
                  </Button>
                </div>
              </div>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {roles.map((role) => (
                  <Card key={role.id} className="border-l-4 border-l-indigo-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-semibold">{role.name}</h3>
                          <p className="text-xs text-gray-600">{role.description}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">{role.user_count} Users</span>
                          <Button variant="outline" size="sm" onClick={() => handleEditRoleInner(role.name)}>
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Control Tab Content */}
        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Access Control</span>
              </CardTitle>
              <CardDescription>Manage user access and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Authentication Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Authentication Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                      <Switch
                        id="twoFactor"
                        checked={accessSettings.twoFactorEnabled}
                        onCheckedChange={(checked) =>
                          setAccessSettings({ ...accessSettings, twoFactorEnabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ssoEnabled">Single Sign-On (SSO)</Label>
                      <Switch
                        id="ssoEnabled"
                        checked={accessSettings.ssoEnabled}
                        onCheckedChange={(checked) => setAccessSettings({ ...accessSettings, ssoEnabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="passwordExpiry">Password Expiry</Label>
                      <Switch
                        id="passwordExpiry"
                        checked={accessSettings.passwordExpiryEnabled}
                        onCheckedChange={(checked) =>
                          setAccessSettings({ ...accessSettings, passwordExpiryEnabled: checked })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={accessSettings.sessionTimeout}
                        onChange={(e) =>
                          setAccessSettings({ ...accessSettings, sessionTimeout: Number.parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        value={accessSettings.maxLoginAttempts}
                        onChange={(e) =>
                          setAccessSettings({ ...accessSettings, maxLoginAttempts: Number.parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                      <Input
                        id="passwordMinLength"
                        type="number"
                        value={accessSettings.passwordMinLength}
                        onChange={(e) =>
                          setAccessSettings({ ...accessSettings, passwordMinLength: Number.parseInt(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* IP Restrictions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">IP Access Control</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ipRestrictions">Enable IP Restrictions</Label>
                    <Switch
                      id="ipRestrictions"
                      checked={accessSettings.ipRestrictionsEnabled}
                      onCheckedChange={(checked) =>
                        setAccessSettings({ ...accessSettings, ipRestrictionsEnabled: checked })
                      }
                    />
                  </div>
                  {accessSettings.ipRestrictionsEnabled && (
                    <div className="space-y-2">
                      <Label>Allowed IP Addresses</Label>
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
                        Add IP Range
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Sessions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Active Sessions</h3>
                  <Button variant="outline" onClick={handleRefreshSessions} disabled={isRefreshingSessions}>
                    {isRefreshingSessions ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </div>
                <div className="space-y-2">
                  {activeSessions.map((session) => (
                    <Card key={session.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{session.user_email}</p>
                            <p className="text-sm text-gray-600">
                              {session.ip_address} • {session.device} • Last active:{" "}
                              {new Date(session.last_activity).toLocaleString()}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleTerminateSession(session.id)}>
                            Terminate
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
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
            </CardContent>
          </Card>
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dataEncryption">Data Encryption at Rest</Label>
                      <Switch
                        id="dataEncryption"
                        checked={securitySettings.dataEncryptionEnabled}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, dataEncryptionEnabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auditLogging">Audit Logging</Label>
                      <Switch
                        id="auditLogging"
                        checked={securitySettings.auditLoggingEnabled}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, auditLoggingEnabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoBackup">Automatic Backups</Label>
                      <Switch
                        id="autoBackup"
                        checked={securitySettings.autoBackupEnabled}
                        onCheckedChange={(checked) =>
                          setSecuritySettings({ ...securitySettings, autoBackupEnabled: checked })
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
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="retentionPeriod">Data Retention Period (days)</Label>
                      <Input
                        id="retentionPeriod"
                        type="number"
                        value={securitySettings.dataRetentionDays}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            dataRetentionDays: Number.parseInt(e.target.value),
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

                {/* Document Preview Area */}
                <div className={`border border-gray-300 rounded-md bg-gray-50 ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[600px]'} overflow-auto`}>
                  <div
                    className="bg-white shadow-lg min-h-full"
                    style={{
                      transform: `scale(${documentZoom / 100}) rotate(${documentRotation}deg)`,
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    {documentPreviewContent ? (
                      <div className="p-8 max-w-4xl mx-auto">
                        <div className="prose prose-lg max-w-none">
                          <div 
                            className="whitespace-pre-wrap text-gray-800 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: documentPreviewContent
                                .replace(/# (.*)/g, '<h1 class="text-3xl font-bold text-gray-900 mb-6 border-b-2 border-gray-200 pb-2">$1</h1>')
                                .replace(/## (.*)/g, '<h2 class="text-2xl font-semibold text-gray-800 mb-4 mt-8">$1</h2>')
                                .replace(/### (.*)/g, '<h3 class="text-xl font-medium text-gray-700 mb-3 mt-6">$1</h3>')
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                                .replace(/- (.*)/g, '<li class="mb-2 text-gray-700">$1</li>')
                                .replace(/(\d+)\. (.*)/g, '<li class="mb-2 text-gray-700"><span class="font-medium">$1.</span> $2</li>')
                                .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700">')
                                .replace(/^(?!<[h|l])/gm, '<p class="mb-4 text-gray-700">')
                                .replace(/<li/g, '<ul class="list-disc list-inside mb-4"><li')
                                .replace(/<\/li>/g, '</li></ul>')
                                .replace(/<ul class="list-disc list-inside mb-4"><ul class="list-disc list-inside mb-4">/g, '<ul class="list-disc list-inside mb-4">')
                                .replace(/<\/ul><\/ul>/g, '</ul>')
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <FileText className="w-16 h-16 mx-auto text-gray-400" />
                          <div>
                            <p className="text-lg font-semibold text-gray-700">{selectedDocument.name}</p>
                            <p className="text-sm text-gray-500">Loading document preview...</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Viewer Info */}
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      This document is protected. Downloading is disabled for security purposes.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleResetViewer}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset View
                  </Button>
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
                      <Input id="subsidiaryName" placeholder="Enter subsidiary name" />
                    </div>
                    <div>
                      <Label htmlFor="subsidiaryIndustry">Industry</Label>
                      <Input id="subsidiaryIndustry" placeholder="Enter industry" />
                    </div>
                    <div>
                      <Label htmlFor="subsidiaryTaxId">Tax ID</Label>
                      <Input id="subsidiaryTaxId" placeholder="Enter tax ID" />
                    </div>
                    <div>
                      <Label htmlFor="subsidiarySsnit">SSNIT Number</Label>
                      <Input id="subsidiarySsnit" placeholder="Enter SSNIT number" />
                    </div>
                    <div>
                      <Label htmlFor="subsidiaryEmail">Email Address</Label>
                      <Input id="subsidiaryEmail" type="email" placeholder="Enter email address" />
                    </div>
                    <div>
                      <Label htmlFor="subsidiaryPhone">Phone Number</Label>
                      <Input id="subsidiaryPhone" placeholder="Enter phone number" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subsidiaryAddress">Address</Label>
                    <Textarea id="subsidiaryAddress" placeholder="Enter address" />
                  </div>

                  <div className="space-y-2">
                    <Label>Divisions</Label>
                    <div className="space-y-2">
                      <Input placeholder="Enter division" />
                      <Button variant="outline" size="sm">
                        Add Division
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Departments</Label>
                    <div className="space-y-2">
                      <Input placeholder="Enter department" />
                      <Button variant="outline" size="sm">
                        Add Department
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Locations</Label>
                    <div className="space-y-2">
                      <Input placeholder="Enter location name" />
                      <Button variant="outline" size="sm">
                        Add Location
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" onClick={() => setShowAddSubsidiary(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowAddSubsidiary(false)}>Add Subsidiary</Button>
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
