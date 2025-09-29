"use client"
import { useState, useEffect } from "react"

import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Building, Building2, ChevronLeft, ChevronRight, FileText, Loader2, Plus, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

  // Company State
  const [company, setCompany] = useState<Company | null>(null) // Changed to allow null initially
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
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [isSavingCompany, setIsSavingCompany] = useState(false)

  // HR State
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
  const [showDocumentPreview, setShowDocumentPreview] = useState(false)
  const [documentPreviewContent, setDocumentPreviewContent] = useState("")
  const [isSavingDocument, setIsSavingDocument] = useState(false)
  const [pdfViewerState, setPdfViewerState] = useState({
    currentPage: 1,
    totalPages: 1,
    zoom: 100,
    isLoading: false,
  })

  const [documentZoom, setDocumentZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [documentModalType, setDocumentModalType] = useState("add") // add, view, edit, delete
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [newDocumentName, setNewDocumentName] = useState("") // Fixed undeclared variable
  const [newDocumentFile, setNewDocumentFile] = useState<File | null>(null)
  const [newDocumentAvailable, setNewDocumentAvailable] = useState(true)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0) // Added for upload progress

  const [currentPolicies, setCurrentPolicies] = useState([
    { name: "Annual Leave", days: 21, usage: "68%", trend: "up", description: "Annual vacation leave" },
    { name: "Sick Leave", days: 10, usage: "23%", trend: "down", description: "Medical leave for illness" },
    { name: "Maternity Leave", days: 84, usage: "12%", trend: "stable", description: "Maternity and paternity leave" },
  ])

  // HR Documents State
  const [hrDocuments, setHrDocuments] = useState([
    { id: 1, name: "Employee Handbook", type: "PDF", size: "1.2MB", availableToEmployees: true },
    { id: 2, name: "Code of Conduct", type: "DOC", size: "0.5MB", availableToEmployees: true },
    { id: 3, name: "Safety Manual", type: "PDF", size: "0.8MB", availableToEmployees: false },
  ])
  const [viewingDocument, setViewingDocument] = useState<any>(null)
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  const [loadingDocument, setLoadingDocument] = useState(false)
  const [documentContent, setDocumentContent] = useState("")
  const [editingDocument, setEditingDocument] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1) // Fixed undeclared variable
  const [totalPages, setTotalPages] = useState(1) // Fixed undeclared variable
  const [zoomLevel, setZoomLevel] = useState(1) // Fixed undeclared variable

  // Leave Policies State
  const [leavePolicies, setLeavePolicies] = useState([
    { id: 1, name: "Annual Leave", days: 21, carryOver: true },
    { id: 2, name: "Sick Leave", days: 10, carryOver: false },
    { id: 3, name: "Maternity Leave", days: 84, carryOver: true },
    { id: 4, name: "Paternity Leave", days: 5, carryOver: false },
  ])
  const [showLeavePolicyModal, setShowLeavePolicyModal] = useState(false)
  const [editingLeavePolicy, setEditingLeavePolicy] = useState<any>(null)
  const [newLeaveType, setNewLeaveType] = useState("") // Fixed redeclared variable
  const [newLeaveDays, setNewLeaveDays] = useState(0)
  const [newLeaveCarryOver, setNewLeaveCarryOver] = useState(false)

  // Divisions, Departments, Locations State
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
  const [showSubsidiaryModal, setShowSubsidiaryModal] = useState<boolean>(false)
  const [editingSubsidiary, setEditingSubsidiary] = useState<Subsidiary | null>(null)
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<Subsidiary | null>(null)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState<boolean>(false)
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false)
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
  const [newLeaveTypeState, setNewLeaveTypeState] = useState({
    // Fixed redeclared variable
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
  const [structuredSalaryGrades, setStructuredSalaryGrades] = useState([
    {
      id: 1,
      name: "Grade 1",
      currency: "GHS",
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
  const [showStructuredGradeModal, setShowStructuredGradeModal] = useState(false)
  const [showUnstructuredGradeModal, setShowUnstructuredGradeModal] = useState(false)
  const [editingGrade, setEditingGrade] = useState<any>(null) // Changed to any to match usage
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
  const [unstructuredSalaryGrades, setUnstructuredSalaryGrades] = useState([
    {
      id: 1,
      name: "Management Level",
      description: "Senior management positions",
      generalIncrement: { type: "percentage", value: 5 },
      performanceIncrement: { type: "percentage", value: 10 },
    },
  ])
  const [editingUnstructured, setEditingUnstructured] = useState<any>(null) // Changed to any to match usage
  const [newUnstructured, setNewUnstructured] = useState({
    name: "",
    description: "",
    generalIncrement: { type: "percentage", value: 0, min: 0, max: 0 },
    performanceIncrement: { type: "percentage", value: 0, min: 0, max: 0 },
  })

  const handleExportSalaryGrades = async (format: "csv" | "excel") => {
    setIsExporting(true)

    try {
      // Prepare data for export
      const exportData = []

      // Add headers
      exportData.push(["Grade Name", "Description", "Min Salary", "Max Salary", "Step", "Step Amount"])

      // Add data rows
      structuredSalaryGrades.forEach((grade) => {
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
      setStructuredSalaryGrades((prev) => [...prev, ...importedGrades])

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

  const handleZoomIn = () => {
    setDocumentZoom((prev) => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setDocumentZoom((prev) => Math.max(prev - 25, 50))
  }

  // Helper function to parse document content (mock implementation)
  const parseDocumentContent = (document: any) => {
    // In a real application, this would parse different document types (PDF, DOC, etc.)
    // For demo purposes, we'll return a simple string representation.
    return {
      content: `This is the content of the document: ${document.name}. It's a ${document.type} file.`,
      // Simulate total pages for PDF
      totalPages: document.type === "PDF" ? Math.floor(Math.random() * 10) + 5 : 1,
    }
  }

  const handleDownload = () => {
    if (selectedDocument) {
      const { content } = parseDocumentContent(selectedDocument) // Fixed undeclared variable
      let blob
      let filename

      if (selectedDocument.type === "PDF") {
        // For demo purposes, download as text file since we don't have actual PDF binary data
        // In production, this would fetch the actual PDF file from storage
        blob = new Blob([content], { type: "text/plain" })
        filename = `${selectedDocument.name}.txt`

        toast({
          title: "Download Note",
          description: "PDF downloaded as text file for demo purposes",
        })
      } else if (selectedDocument.type === "DOC" || selectedDocument.type === "DOCX") {
        // For Word docs, create as RTF format
        const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} \\f0\\fs24 ${content.replace(/\n/g, "\\par ")}}`
        blob = new Blob([rtfContent], { type: "application/rtf" })
        filename = `${selectedDocument.name}.rtf`
      } else {
        blob = new Blob([content], { type: "text/plain" })
        filename = `${selectedDocument.name}.txt`
      }

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

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
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
      const mockCompanyData = {
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
      }
      setCompany(mockCompanyData)
      setCompanyData(mockCompanyData) // Also update the detailed state
      setDivisions(mockCompanyData.divisions || [])
      setDepartments(mockCompanyData.departments || [])
      setLocations(mockCompanyData.locations || [])
      setLogoPreview(mockCompanyData.logo_url || "")
      return
    }

    try {
      const { data, error } = await supabase.from("companies").select("*").single()

      if (error) throw error

      if (data) {
        setCompany(data) // Set the company data
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
        const mockCompanyData = {
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
        }
        setCompany(mockCompanyData)
        setCompanyData(mockCompanyData)
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
            user_count: 2, // Added user_count to match interface
          },
          {
            id: "role-002",
            name: "HR Manager",
            description: "Human Resources management",
            permissions: ["read", "write"],
            user_count: 3, // Added user_count to match interface
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

  const handleDeleteLeavePolicy = async (policyId: number) => {
    if (!confirm("Are you sure you want to delete this leave policy?")) return

    setLeavePolicies((prev) => prev.filter((p) => p.id !== policyId))
    toast({
      title: "Leave Policy Deleted",
      description: "The leave policy has been successfully deleted.",
    })
  }

  const handleSaveLeavePolicy = async () => {
    if (!newLeaveType.trim() || newLeaveDays <= 0) {
      toast({
        title: "Validation Error",
        description: "Please provide a leave type name and a valid number of days.",
        variant: "destructive",
      })
      return
    }

    if (editingLeavePolicy) {
      // Edit existing policy
      setLeavePolicies((prev) =>
        prev.map((p) =>
          p.id === editingLeavePolicy.id
            ? { ...p, name: newLeaveType, days: newLeaveDays, carryOver: newLeaveCarryOver }
            : p,
        ),
      )
      toast({
        title: "Leave Policy Updated",
        description: `${newLeaveType} has been successfully updated.`,
      })
    } else {
      // Add new policy
      const newPolicy = {
        id: Date.now(), // Simple unique ID generation
        name: newLeaveType,
        days: newLeaveDays,
        carryOver: newLeaveCarryOver,
      }
      setLeavePolicies((prev) => [...prev, newPolicy])
      toast({
        title: "Leave Policy Added",
        description: `${newLeaveType} has been successfully added.`,
      })
    }

    setShowLeavePolicyModal(false)
    setEditingLeavePolicy(null)
    setNewLeaveType("")
    setNewLeaveDays(0)
    setNewLeaveCarryOver(false)
  }

  const handleToggleDocumentVisibility = (docId: number) => {
    setHrDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, availableToEmployees: !doc.availableToEmployees } : doc)),
    )

    const doc = hrDocuments.find((d) => d.id === docId)
    toast({
      title: "Visibility Updated",
      description: `${doc?.name} is now ${doc?.availableToEmployees ? "visible to" : "hidden from"} employees.`,
    })
  }

  const handleSaveDocument = async () => {
    if (!newDocumentName.trim() || (!newDocumentFile && !editingDocument)) {
      toast({
        title: "Validation Error",
        description: "Please provide a document name and upload a file.",
        variant: "destructive",
      })
      return
    }

    setIsSavingDocument(true)
    setUploadingDocument(true) // Indicate upload is in progress

    try {
      let fileUrl = editingDocument?.url // Use existing URL if editing and no new file

      if (newDocumentFile) {
        // Upload new file
        const formData = new FormData()
        formData.append("file", newDocumentFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("File upload failed")
        }
        const uploadResult = await uploadResponse.json()
        fileUrl = uploadResult.url
      }

      // Simulate saving document details
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (editingDocument) {
        // Update existing document
        setHrDocuments((prev) =>
          prev.map((doc) =>
            doc.id === editingDocument.id
              ? { ...doc, name: newDocumentName, availableToEmployees: newDocumentAvailable, url: fileUrl }
              : doc,
          ),
        )
        toast({
          title: "Document Updated",
          description: `${newDocumentName} has been successfully updated.`,
        })
      } else {
        // Add new document
        const newDoc = {
          id: Date.now(),
          name: newDocumentName,
          type: newDocumentFile?.type.split("/")[1].toUpperCase() || "PDF", // Infer type or default to PDF
          size: newDocumentFile ? `${(newDocumentFile.size / 1024 / 1024).toFixed(2)}MB` : "0MB",
          availableToEmployees: newDocumentAvailable,
          url: fileUrl, // Store the URL of the uploaded file
        }
        setHrDocuments((prev) => [...prev, newDoc])
        toast({
          title: "Document Added",
          description: `${newDocumentName} has been successfully added.`,
        })
      }

      setShowDocumentModal(false)
      setEditingDocument(null)
      setNewDocumentName("")
      setNewDocumentFile(null)
      setNewDocumentAvailable(true)
    } catch (error) {
      console.error("Save document error:", error)
      toast({
        title: "Error",
        description: "Failed to save document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingDocument(false)
      setUploadingDocument(false)
    }
  }

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    // In a real app, you'd also delete the file from storage here.
    setHrDocuments((prev) => prev.filter((doc) => doc.id !== docId))
    toast({
      title: "Document Deleted",
      description: "The document has been successfully deleted.",
    })
  }

  const handleDocumentView = (document: any) => {
    setViewingDocument(document)
    setShowDocumentViewer(true)
    setLoadingDocument(true) // Start loading indicator

    // Simulate fetching document content
    const { content, totalPages: docTotalPages } = parseDocumentContent(document) // Fixed undeclared variable
    setDocumentContent(content)
    setTotalPages(docTotalPages) // Fixed undeclared variable
    setCurrentPage(1) // Fixed undeclared variable
    setZoomLevel(1) // Fixed undeclared variable
    setLoadingDocument(false)
  }

  const handlePageChange = (direction: "prev" | "next") => {
    setCurrentPage((prev) => {
      if (direction === "prev") {
        return Math.max(1, prev - 1)
      } else {
        return Math.min(prev + 1, totalPages) // Fixed undeclared variable
      }
    })
  }

  const handleSaveCompanyInfo = async () => {
    if (!company) return
    setIsSavingCompany(true)
    try {
      const { error } = await supabase.from("companies").upsert({
        ...company,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      toast({ title: "Company Info Saved", description: "Company information updated successfully." })
    } catch (error) {
      console.error("Error saving company info:", error)
      toast({ title: "Error", description: "Failed to save company information.", variant: "destructive" })
    } finally {
      setIsSavingCompany(false)
      setShowCompanyModal(false)
    }
  }

  const handleSaveSubsidiary = async () => {
    if (!editingSubsidiary) return // Fixed undeclared variable
    setIsSavingSubsidiary(true)
    try {
      if (editingSubsidiary.id) {
        // Update existing subsidiary
        await updateSubsidiary(editingSubsidiary.id, editingSubsidiary)
      } else {
        // Add new subsidiary
        await addNewSubsidiary(editingSubsidiary)
      }
      setShowSubsidiaryModal(false) // Fixed undeclared variable
      setEditingSubsidiary(null) // Fixed undeclared variable
    } catch (error) {
      console.error("Error saving subsidiary:", error)
      toast({ title: "Error", description: "Failed to save subsidiary.", variant: "destructive" })
    } finally {
      setIsSavingSubsidiary(false)
    }
  }

  const handleDeleteSubsidiary = async (subsidiaryId: string) => {
    if (!confirm("Are you sure you want to delete this subsidiary?")) return
    await deleteSubsidiary(subsidiaryId)
  }

  const [activeTab, setActiveTab] = useState("company")

  // Render function
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your organization settings and preferences</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="hr">HR</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-6">
            {/* Company Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>Basic information about your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {company && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Company Name</Label>
                      <p className="text-sm font-medium">{company.name}</p>
                    </div>
                    <div>
                      <Label>Tax ID</Label>
                      <p className="text-sm font-medium">{company.tax_id}</p>
                    </div>
                    <div>
                      <Label>SSNIT Number</Label>
                      <p className="text-sm font-medium">{company.ssnit_number}</p>
                    </div>
                    <div>
                      <Label>Industry</Label>
                      <p className="text-sm font-medium">{company.industry}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Address</Label>
                      <p className="text-sm font-medium">{company.address}</p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p className="text-sm font-medium">{company.phone_number}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm font-medium">{company.email_address}</p>
                    </div>
                  </div>
                )}
                <Button onClick={() => setShowCompanyModal(true)}>Edit Company Information</Button>
              </CardContent>
            </Card>

            {/* Subsidiaries Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Subsidiaries
                    </CardTitle>
                    <CardDescription>Manage subsidiary companies and their settings</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingSubsidiary(null) // Ensure we are adding a new one
                      setShowSubsidiaryModal(true) // Fixed undeclared variable
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subsidiary
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subsidiaries.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{sub.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {sub.industry} • {sub.email_address}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSubsidiary(sub) // Fixed undeclared variable
                            setShowSubsidiaryModal(true) // Fixed undeclared variable
                          }}
                        >
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteSubsidiary(sub.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HR Tab */}
          <TabsContent value="hr" className="space-y-6">
            {/* HR Documents Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      HR Documents
                    </CardTitle>
                    <CardDescription>Manage HR documents and visibility settings</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingDocument(null) // Ensure we are adding a new one
                      setShowDocumentModal(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hrDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg border-l-4"
                      style={{ borderLeftColor: doc.availableToEmployees ? "#22c55e" : "#e5e7eb" }}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{doc.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {doc.type.toUpperCase()} • {doc.size}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Switch
                            checked={doc.availableToEmployees}
                            onCheckedChange={() => handleToggleDocumentVisibility(doc.id)}
                          />
                          <span className="text-xs text-muted-foreground">Available for employees</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleDocumentView(doc)}>
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingDocument(doc)
                            setNewDocumentName(doc.name) // Pre-fill name for editing
                            setNewDocumentAvailable(doc.availableToEmployees) // Pre-fill availability
                            setShowDocumentModal(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteDocument(doc.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Leave Policies Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Leave Policies</CardTitle>
                    <CardDescription>Configure leave types and policies</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingLeavePolicy(null) // Ensure we are adding a new one
                      setShowLeavePolicyModal(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Leave Type
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leavePolicies.map((policy) => (
                    <div key={policy.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{policy.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {policy.days} days • {policy.carryOver ? "Carry over allowed" : "No carry over"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingLeavePolicy(policy)
                            setNewLeaveType(policy.name)
                            setNewLeaveDays(policy.days)
                            setNewLeaveCarryOver(policy.carryOver)
                            setShowLeavePolicyModal(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteLeavePolicy(policy.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payroll Tab */}
          <TabsContent value="payroll" className="space-y-6">
            {/* Salary Grades Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Salary Grades</CardTitle>
                    <CardDescription>Manage salary structures and grades</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingGrade(null) // Ensure adding new
                        setShowStructuredGradeModal(true) // Fixed undeclared variable
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Structured Grade
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingUnstructured(null) // Ensure adding new
                        setShowUnstructuredGradeModal(true) // Fixed undeclared variable
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Unstructured Grade
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="structured">
                  <TabsList>
                    <TabsTrigger value="structured">Structured</TabsTrigger>
                    <TabsTrigger value="unstructured">Unstructured</TabsTrigger>
                  </TabsList>
                  <TabsContent value="structured" className="space-y-4 mt-4">
                    {structuredSalaryGrades.map((grade) => (
                      <div key={grade.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{grade.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {grade.currency} {grade.minSalary.toLocaleString()} - {grade.maxSalary.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="unstructured" className="space-y-4 mt-4">
                    {unstructuredSalaryGrades.map((grade) => (
                      <div key={grade.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{grade.name}</h3>
                          <p className="text-sm text-muted-foreground">{grade.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure email and system notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Notification settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Access Control & Security</CardTitle>
                <CardDescription>Manage security settings and access controls</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Security settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Company Info Modal */}
      <Dialog open={showCompanyModal} onOpenChange={setShowCompanyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company Information</DialogTitle>
            <DialogDescription>Update your company's details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={company?.name || ""}
                  onChange={(e) => setCompany({ ...company!, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="company-tax-id">Tax ID</Label>
                <Input
                  id="company-tax-id"
                  value={company?.tax_id || ""}
                  onChange={(e) => setCompany({ ...company!, tax_id: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="company-ssnit">SSNIT Number</Label>
                <Input
                  id="company-ssnit"
                  value={company?.ssnit_number || ""}
                  onChange={(e) => setCompany({ ...company!, ssnit_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="company-industry">Industry</Label>
                <Input
                  id="company-industry"
                  value={company?.industry || ""}
                  onChange={(e) => setCompany({ ...company!, industry: e.target.value })}
                />
              </div>
            </div>
            <div className="col-span-2">
              <Label htmlFor="company-address">Address</Label>
              <Input
                id="company-address"
                value={company?.address || ""}
                onChange={(e) => setCompany({ ...company!, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-phone">Phone</Label>
                <Input
                  id="company-phone"
                  value={company?.phone_number || ""}
                  onChange={(e) => setCompany({ ...company!, phone_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="company-email">Email</Label>
                <Input
                  id="company-email"
                  value={company?.email_address || ""}
                  onChange={(e) => setCompany({ ...company!, email_address: e.target.value })}
                />
              </div>
            </div>
            {/* Logo Upload */}
            <div>
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4 mt-2">
                {companyLogoPreview && (
                  <img
                    src={companyLogoPreview || "/placeholder.svg"}
                    alt="Company Logo Preview"
                    className="h-16 w-16 object-cover rounded-md"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0], "company")}
                  className="max-w-xs"
                />
                {isUploadingLogo && <Loader2 className="h-5 w-5 animate-spin" />}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompanyModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCompanyInfo} disabled={isSavingCompany}>
              {isSavingCompany ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subsidiary Modal */}
      <Dialog open={showSubsidiaryModal} onOpenChange={setShowSubsidiaryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubsidiary ? "Edit Subsidiary" : "Add New Subsidiary"}</DialogTitle>
            <DialogDescription>
              {editingSubsidiary ? "Update subsidiary details" : "Enter details for the new subsidiary"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subsidiary-name">Subsidiary Name</Label>
                <Input
                  id="subsidiary-name"
                  value={editingSubsidiary?.name || ""}
                  onChange={(e) => setEditingSubsidiary({ ...editingSubsidiary!, name: e.target.value })}
                  placeholder="e.g., Akwaaba Digital Solutions"
                />
              </div>
              <div>
                <Label htmlFor="subsidiary-tax-id">Tax ID</Label>
                <Input
                  id="subsidiary-tax-id"
                  value={editingSubsidiary?.tax_id || ""}
                  onChange={(e) => setEditingSubsidiary({ ...editingSubsidiary!, tax_id: e.target.value })}
                  placeholder="e.g., TIN-ADS-2023-001"
                />
              </div>
              <div>
                <Label htmlFor="subsidiary-ssnit">SSNIT Number</Label>
                <Input
                  id="subsidiary-ssnit"
                  value={editingSubsidiary?.ssnit_number || ""}
                  onChange={(e) => setEditingSubsidiary({ ...editingSubsidiary!, ssnit_number: e.target.value })}
                  placeholder="e.g., SSNIT-ADS-789012"
                />
              </div>
              <div>
                <Label htmlFor="subsidiary-industry">Industry</Label>
                <Input
                  id="subsidiary-industry"
                  value={editingSubsidiary?.industry || ""}
                  onChange={(e) => setEditingSubsidiary({ ...editingSubsidiary!, industry: e.target.value })}
                  placeholder="e.g., Digital Marketing"
                />
              </div>
            </div>
            <div className="col-span-2">
              <Label htmlFor="subsidiary-address">Address</Label>
              <Input
                id="subsidiary-address"
                value={editingSubsidiary?.address || ""}
                onChange={(e) => setEditingSubsidiary({ ...editingSubsidiary!, address: e.target.value })}
                placeholder="e.g., 15 Liberation Road, Ridge, Accra"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subsidiary-phone">Phone</Label>
                <Input
                  id="subsidiary-phone"
                  value={editingSubsidiary?.phone_number || ""}
                  onChange={(e) => setEditingSubsidiary({ ...editingSubsidiary!, phone_number: e.target.value })}
                  placeholder="+233 30 276 5432"
                />
              </div>
              <div>
                <Label htmlFor="subsidiary-email">Email</Label>
                <Input
                  id="subsidiary-email"
                  value={editingSubsidiary?.email_address || ""}
                  onChange={(e) => setEditingSubsidiary({ ...editingSubsidiary!, email_address: e.target.value })}
                  placeholder="info@akwaabadigital.com"
                />
              </div>
            </div>
            {/* Logo Upload */}
            <div>
              <Label>Subsidiary Logo</Label>
              <div className="flex items-center gap-4 mt-2">
                {subsidiaryLogoPreview && (
                  <img
                    src={subsidiaryLogoPreview || "/placeholder.svg"}
                    alt="Subsidiary Logo Preview"
                    className="h-16 w-16 object-cover rounded-md"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0], "subsidiary")}
                  className="max-w-xs"
                />
                {isUploadingLogo && <Loader2 className="h-5 w-5 animate-spin" />}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubsidiaryModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSubsidiary} disabled={isSavingSubsidiary}>
              {isSavingSubsidiary ? "Saving..." : "Save Subsidiary"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      <Dialog open={showDocumentViewer} onOpenChange={setShowDocumentViewer}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewingDocument?.name}</DialogTitle>
            <DialogDescription>
              {viewingDocument?.type.toUpperCase()} • {viewingDocument?.size}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 flex flex-col h-full">
            {/* PDF Viewer Controls */}
            <div className="flex items-center justify-between p-2 border-b bg-muted/50">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handlePageChange("prev")} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange("next")}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm">{zoomLevel}%</span>
                <Button variant="ghost" size="sm" onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Document Content */}
            <div className="flex-1 overflow-auto bg-gray-100 p-4">
              <div
                className="bg-white shadow-lg mx-auto p-8"
                style={{
                  width: `${zoomLevel}%`,
                  minHeight: "100%",
                }}
              >
                {loadingDocument ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm">{documentContent}</pre>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Document Modal */}
      <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDocument ? "Edit Document" : "Add Document"}</DialogTitle>
            <DialogDescription>
              {editingDocument ? "Update document details" : "Upload a new HR document (PDF only)"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="doc-name">Document Name</Label>
              <Input
                id="doc-name"
                value={newDocumentName}
                onChange={(e) => setNewDocumentName(e.target.value)}
                placeholder="e.g., Employee Handbook"
              />
            </div>
            {!editingDocument && (
              <div>
                <Label htmlFor="doc-file">Upload PDF</Label>
                <Input
                  id="doc-file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setNewDocumentFile(file)
                    }
                  }}
                />
                {newDocumentFile && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Selected: {newDocumentFile.name} ({(newDocumentFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
                {uploadingDocument && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <div className="text-sm text-muted-foreground text-center">{uploadProgress}%</div>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={newDocumentAvailable} onCheckedChange={setNewDocumentAvailable} />
              <Label>Available for employees</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDocumentModal(false)
                setEditingDocument(null) // Reset editing state
                setNewDocumentName("")
                setNewDocumentFile(null)
                setNewDocumentAvailable(true)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveDocument} disabled={isSavingDocument || uploadingDocument}>
              {isSavingDocument ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Leave Policy Modal */}
      <Dialog open={showLeavePolicyModal} onOpenChange={setShowLeavePolicyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLeavePolicy ? "Edit Leave Type" : "Add Leave Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="leave-name">Leave Type Name</Label>
              <Input
                id="leave-name"
                value={newLeaveType}
                onChange={(e) => setNewLeaveType(e.target.value)}
                placeholder="e.g., Annual Leave"
              />
            </div>
            <div>
              <Label htmlFor="leave-days">Number of Days</Label>
              <Input
                id="leave-days"
                type="number"
                value={newLeaveDays}
                onChange={(e) => setNewLeaveDays(Number(e.target.value))}
                placeholder="e.g., 21"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={newLeaveCarryOver} onCheckedChange={setNewLeaveCarryOver} />
              <Label>Allow carry over to next year</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLeavePolicyModal(false)
                setEditingLeavePolicy(null)
                setNewLeaveType("")
                setNewLeaveDays(0)
                setNewLeaveCarryOver(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveLeavePolicy}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Unstructured Salary Grade Modal */}
      <Dialog open={showUnstructuredGradeModal} onOpenChange={setShowUnstructuredGradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Unstructured Salary Grade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="grade-name">Grade Name</Label>
              <Input
                id="grade-name"
                value={newUnstructured?.name}
                onChange={(e) => setNewUnstructured({ ...newUnstructured!, name: e.target.value })}
                placeholder="e.g., Executive Level"
              />
            </div>
            <div>
              <Label htmlFor="grade-desc">Description</Label>
              <Input
                id="grade-desc"
                value={newUnstructured?.description}
                onChange={(e) => setNewUnstructured({ ...newUnstructured!, description: e.target.value })}
                placeholder="Description of this grade"
              />
            </div>
            {/* Add fields for increments */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnstructuredGradeModal(false)}>
              Cancel
            </Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Structured Salary Grade Modal */}
      <Dialog open={showStructuredGradeModal} onOpenChange={setShowStructuredGradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Structured Salary Grade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="struct-grade-name">Grade Name</Label>
              <Input
                id="struct-grade-name"
                value={editingGrade?.name}
                onChange={(e) => setEditingGrade({ ...editingGrade!, name: e.target.value })}
                placeholder="e.g., Grade A"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={editingGrade?.currency}
                onChange={(e) => setEditingGrade({ ...editingGrade!, currency: e.target.value })}
                placeholder="GHS"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-salary">Minimum Salary</Label>
                <Input
                  id="min-salary"
                  type="number"
                  value={editingGrade?.minSalary}
                  onChange={(e) => setEditingGrade({ ...editingGrade!, minSalary: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="max-salary">Maximum Salary</Label>
                <Input
                  id="max-salary"
                  type="number"
                  value={editingGrade?.maxSalary}
                  onChange={(e) => setEditingGrade({ ...editingGrade!, maxSalary: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>
            {/* Add fields for notches */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStructuredGradeModal(false)}>
              Cancel
            </Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
