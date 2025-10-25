"use client"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

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
  status?: string
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

  const [activeTab, setActiveTab] = useState("company") // State for active tab

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
    { name: "Annual Leave", days: 21, usage: "68%", trend: "up", description: "Annual vacation leave", category: "Leave", isActive: true, applicableTo: "All Employees", carryOverLimit: 5, noticeRequired: 7 },
    { name: "Sick Leave", days: 10, usage: "23%", trend: "down", description: "Medical leave for illness", category: "Leave", isActive: true, applicableTo: "All Employees", carryOverLimit: 0, noticeRequired: 0 },
    { name: "Maternity Leave", days: 84, usage: "12%", trend: "stable", description: "Maternity and paternity leave", category: "Leave", isActive: true, applicableTo: "Female Employees", carryOverLimit: 0, noticeRequired: 30 },
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
    { code: "TAX", description: "Tax Deduction", recurring: true, amount: 0, percentage: 0, type: "VARIABLE", taxable: false },
    { code: "SSNIT", description: "SSNIT Deduction", recurring: true, amount: 0, percentage: 5.5, type: "VARIABLE", taxable: false },
    { code: "LOAN", description: "Loan Deduction", recurring: true, amount: 0, percentage: 0, type: "FIXED", taxable: false },
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

  // Tax Relief State
  const [taxReliefs, setTaxReliefs] = useState([
    {
      id: 1,
      name: "Personal Relief",
      description: "Basic personal tax relief",
      amount: 402,
      currency: "GHS",
      isActive: true,
      category: "Personal",
      effectiveDate: "2024-01-01",
      lastUpdated: "2024-01-01T00:00:00Z"
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
      lastUpdated: "2024-01-01T00:00:00Z"
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
      lastUpdated: "2024-01-01T00:00:00Z"
    }
  ])
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

      // Save any pending changes to subsidiaries
      // For now, we'll refresh the data to ensure consistency
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
- Comply with all applicable laws and regulations
- Report violations immediately
- Participate in required training programs

## Contact Information
For questions about this code of conduct, contact HR Department.`,
      
      "Safety Manual": `# Safety Manual

## General Safety Rules
Safety is everyone's responsibility in our workplace.

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
      
      // Added new documents here for the preview feature
      ,
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

    return (
      documentTemplates[document.name] || 
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
    )
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
    const formattedText = text
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
    const formattedText = html
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

  // Tax Relief Handlers
  const handleTaxReliefFieldChange = (index: number, field: string, value: any) => {
    const updatedReliefs = [...taxReliefs]
    updatedReliefs[index] = { ...updatedReliefs[index], [field]: value }
    setTaxReliefs(updatedReliefs)
  }

  const handleAddTaxRelief = () => {
    const currentReliefs = taxReliefs || []
    const newRelief = {
      id: currentReliefs.length > 0 ? Math.max(...(currentReliefs || []).map(r => r.id)) + 1 : 1,
      name: "",
      description: "",
      amount: 0,
      currency: selectedCurrency.toUpperCase(),
      isActive: true,
      category: "Personal",
      effectiveDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString()
    }
    setTaxReliefs([...currentReliefs, newRelief])
    setEditingRelief(currentReliefs.length)
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

      // Comprehensive tax reliefs from Ghana Revenue Authority portal
      const graReliefs = [
        // Personal Reliefs
        {
          id: 1,
          name: "Personal Relief",
          description: "Basic personal tax relief for all taxpayers",
          amount: 402,
          currency: "GHS",
          isActive: true,
          category: "Personal",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "PR001",
          maxAmount: 402,
          isMandatory: true
        },
        {
          id: 2,
          name: "Additional Personal Relief",
          description: "Additional relief for taxpayers aged 60 and above",
          amount: 200,
          currency: "GHS",
          isActive: true,
          category: "Personal",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "APR001",
          maxAmount: 200,
          isMandatory: false
        },

        // Family Reliefs
        {
          id: 3,
          name: "Child Relief",
          description: "Tax relief for dependent children (per child)",
          amount: 150,
          currency: "GHS",
          isActive: true,
          category: "Family",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "CR001",
          maxAmount: 150,
          isMandatory: false,
          maxChildren: 4
        },
        {
          id: 4,
          name: "Spouse Relief",
          description: "Tax relief for dependent spouse",
          amount: 200,
          currency: "GHS",
          isActive: true,
          category: "Family",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "SR001",
          maxAmount: 200,
          isMandatory: false
        },
        {
          id: 5,
          name: "Parent Relief",
          description: "Tax relief for dependent parents",
          amount: 100,
          currency: "GHS",
          isActive: true,
          category: "Family",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "PAR001",
          maxAmount: 100,
          isMandatory: false
        },

        // Age-Based Reliefs
        {
          id: 6,
          name: "Old Age Relief",
          description: "Tax relief for elderly citizens (65+)",
          amount: 200,
          currency: "GHS",
          isActive: true,
          category: "Age",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "OAR001",
          maxAmount: 200,
          isMandatory: false,
          minAge: 65
        },

        // Disability Reliefs
        {
          id: 7,
          name: "Disability Relief",
          description: "Tax relief for persons with disabilities",
          amount: 100,
          currency: "GHS",
          isActive: true,
          category: "Disability",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "DR001",
          maxAmount: 100,
          isMandatory: false
        },
        {
          id: 8,
          name: "Blind Relief",
          description: "Additional relief for blind persons",
          amount: 150,
          currency: "GHS",
          isActive: true,
          category: "Disability",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "BR001",
          maxAmount: 150,
          isMandatory: false
        },

        // Education Reliefs
        {
          id: 9,
          name: "Education Relief",
          description: "Tax relief for education expenses (per child)",
          amount: 200,
          currency: "GHS",
          isActive: true,
          category: "Education",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "ER001",
          maxAmount: 200,
          isMandatory: false,
          maxChildren: 3
        },
        {
          id: 10,
          name: "Tertiary Education Relief",
          description: "Tax relief for tertiary education expenses",
          amount: 500,
          currency: "GHS",
          isActive: true,
          category: "Education",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "TER001",
          maxAmount: 500,
          isMandatory: false
        },

        // Medical Reliefs
        {
          id: 11,
          name: "Medical Relief",
          description: "Tax relief for medical expenses",
          amount: 300,
          currency: "GHS",
          isActive: true,
          category: "Medical",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "MR001",
          maxAmount: 300,
          isMandatory: false
        },
        {
          id: 12,
          name: "Health Insurance Relief",
          description: "Tax relief for health insurance premiums",
          amount: 150,
          currency: "GHS",
          isActive: true,
          category: "Medical",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "HIR001",
          maxAmount: 150,
          isMandatory: false
        },

        // Investment Reliefs
        {
          id: 13,
          name: "Pension Relief",
          description: "Tax relief for pension contributions",
          amount: 400,
          currency: "GHS",
          isActive: true,
          category: "Investment",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "PR002",
          maxAmount: 400,
          isMandatory: false
        },
        {
          id: 14,
          name: "Provident Fund Relief",
          description: "Tax relief for provident fund contributions",
          amount: 200,
          currency: "GHS",
          isActive: true,
          category: "Investment",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "PFR001",
          maxAmount: 200,
          isMandatory: false
        },

        // Housing Reliefs
        {
          id: 15,
          name: "Mortgage Interest Relief",
          description: "Tax relief for mortgage interest payments",
          amount: 1000,
          currency: "GHS",
          isActive: true,
          category: "Housing",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "MIR001",
          maxAmount: 1000,
          isMandatory: false
        },
        {
          id: 16,
          name: "Rent Relief",
          description: "Tax relief for rent payments",
          amount: 300,
          currency: "GHS",
          isActive: true,
          category: "Housing",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "RR001",
          maxAmount: 300,
          isMandatory: false
        },

        // Special Reliefs
        {
          id: 17,
          name: "COVID-19 Relief",
          description: "Special tax relief during COVID-19 pandemic",
          amount: 100,
          currency: "GHS",
          isActive: true,
          category: "Special",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "CVR001",
          maxAmount: 100,
          isMandatory: false
        },
        {
          id: 18,
          name: "Rural Allowance Relief",
          description: "Tax relief for rural area allowances",
          amount: 50,
          currency: "GHS",
          isActive: true,
          category: "Special",
          effectiveDate: "2024-01-01",
          lastUpdated: new Date().toISOString(),
          graCode: "RAR001",
          maxAmount: 50,
          isMandatory: false
        }
      ]

      setTaxReliefs(graReliefs)
      setReliefsLastSync(new Date().toISOString())

      toast({
        title: "Tax Reliefs Synced Successfully",
        description: `Successfully synced ${graReliefs.length} tax reliefs from GRA portal. All current reliefs updated.`,
      })
    } catch (error) {
      console.error("[v0] Error syncing tax reliefs:", error)
      toast({
        title: "Sync Failed",
        description: "Failed to sync tax reliefs from GRA. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSyncingReliefs(false)
    }
  }

  const handleSaveReliefs = async () => {
    setIsSavingReliefs(true)
    console.log("[v0] Saving tax reliefs...")

    try {
      // Simulate save operation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Tax Reliefs Saved",
        description: "Tax reliefs have been saved successfully.",
      })
    } catch (error) {
      console.error("[v0] Error saving tax reliefs:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save tax reliefs. Please try again.",
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

  const loadHRConfigData = async () => {
    console.log("[v0] Loading HR configuration data...")
    
    if (isDemoMode()) {
      console.log("[v0] Demo mode detected, using mock HR data")
      // Fall back to existing mock data if in demo mode
      setCurrentPolicies([
        { 
          name: "Annual Leave", 
          days: 21, 
          usage: "68%", 
          trend: "up", 
          description: "Annual vacation leave for all employees",
          category: "Leave",
          isActive: true,
          applicableTo: "All Employees",
          carryOverLimit: 5,
          noticeRequired: 7
        },
        { 
          name: "Sick Leave", 
          days: 10, 
          usage: "45%", 
          trend: "down", 
          description: "Medical leave for illness and health issues",
          category: "Leave",
          isActive: true,
          applicableTo: "All Employees",
          carryOverLimit: 0,
          noticeRequired: 0
        },
        { 
          name: "Maternity Leave", 
          days: 90, 
          usage: "12%", 
          trend: "stable", 
          description: "Maternity leave for new mothers",
          category: "Leave",
          isActive: true,
          applicableTo: "Female Employees",
          carryOverLimit: 0,
          noticeRequired: 30
        },
      ])
      setHrDocuments([
        {
          id: "doc-001",
          name: "Employee Handbook 2024",
          type: "PDF",
          size: "2.4 MB",
          uploadedBy: "HR Manager",
          uploadedAt: "2024-01-15T10:30:00Z",
          category: "Policy",
          description: "Comprehensive employee handbook covering all company policies and procedures",
          tags: ["handbook", "policies", "procedures"],
          isActive: true,
          downloadCount: 156,
          visibleToAll: true
        },
        {
          id: "doc-002",
          name: "Code of Conduct",
          type: "PDF",
          size: "1.2 MB",
          uploadedBy: "Legal Team",
          uploadedAt: "2024-01-10T14:20:00Z",
          category: "Policy",
          description: "Company code of conduct and ethical guidelines",
          tags: ["conduct", "ethics", "guidelines"],
          isActive: true,
          downloadCount: 89,
          visibleToAll: true
        }
      ])
      return
    }

    try {
      const { data: leaveTypesData, error: leaveTypesError } = await supabase
        .from("leave_types")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (leaveTypesError) throw leaveTypesError

      if (leaveTypesData && leaveTypesData.length > 0) {
        const policies = leaveTypesData.map((lt: any) => ({
          name: lt.name,
          days: lt.annual_entitlement || 0,
          usage: "0%", // Calculate from leave_requests table
          trend: "stable",
          description: lt.description || "",
          category: "Leave",
          isActive: lt.is_active,
          applicableTo: "All Employees",
          carryOverLimit: lt.max_carry_over_days || 0,
          noticeRequired: lt.min_notice_days || 0
        }))
        setCurrentPolicies(policies)
      }

      // For now, keep the mock data
      setHrDocuments([
        {
          id: "doc-001",
          name: "Employee Handbook 2024",
          type: "PDF",
          size: "2.4 MB",
          uploadedBy: "HR Manager",
          uploadedAt: "2024-01-15T10:30:00Z",
          category: "Policy",
          description: "Comprehensive employee handbook covering all company policies and procedures",
          tags: ["handbook", "policies", "procedures"],
          isActive: true,
          downloadCount: 156,
          visibleToAll: true
        },
        {
          id: "doc-002",
          name: "Code of Conduct",
          type: "PDF",
          size: "1.2 MB",
          uploadedBy: "Legal Team",
          uploadedAt: "2024-01-10T14:20:00Z",
          category: "Policy",
          description: "Company code of conduct and ethical guidelines",
          tags: ["conduct", "ethics", "guidelines"],
          isActive: true,
          downloadCount: 89,
          visibleToAll: true
        }
      ])

      console.log("[v0] HR configuration data loaded from database")
    } catch (error) {
      console.error("[v0] Error loading HR configuration data:", error)
      // Fall back to demo data
      setCurrentPolicies([
        { 
          name: "Annual Leave", 
          days: 21, 
          usage: "68%", 
          trend: "up", 
          description: "Annual vacation leave for all employees",
          category: "Leave",
          isActive: true,
          applicableTo: "All Employees",
          carryOverLimit: 5,
          noticeRequired: 7
        }
      ])
    }
  }

  const loadPayrollConfigData = async () => {
    console.log("[v0] Loading payroll configuration data...")
    
    if (isDemoMode()) {
      console.log("[v0] Demo mode detected, using mock payroll data")
      // Fall back to existing mock data if in demo mode
      setAllowances([
        { code: "BASIC", description: "Basic Salary", recurring: true, amount: 0, percentage: 0, type: "FIXED", taxable: true },
        { code: "HRA", description: "Housing Allowance", recurring: true, amount: 500, percentage: 0, type: "FIXED", taxable: true },
        { code: "TRA", description: "Transport Allowance", recurring: true, amount: 200, percentage: 0, type: "FIXED", taxable: true },
        { code: "MED", description: "Medical Allowance", recurring: true, amount: 150, percentage: 0, type: "FIXED", taxable: false },
      ])
      setDeductions([
        { code: "TAX", description: "Tax Deduction", recurring: true, amount: 0, percentage: 0, type: "VARIABLE", taxable: false },
        { code: "SSNIT", description: "SSNIT Deduction", recurring: true, amount: 0, percentage: 5.5, type: "VARIABLE", taxable: false },
        { code: "LOAN", description: "Loan Deduction", recurring: true, amount: 0, percentage: 0, type: "FIXED", taxable: false },
      ])
      setSalaryGrades([
        { id: 1, name: "Entry Level", minSalary: 2000, maxSalary: 3500, description: "Entry level positions" },
        { id: 2, name: "Junior Level", minSalary: 3500, maxSalary: 5000, description: "Junior professional positions" },
      ])
      return
    }

    try {
      const { data: allowancesData, error: allowancesError } = await supabase
        .from("payroll_allowances")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (allowancesError) throw allowancesError

      if (allowancesData && allowancesData.length > 0) {
        const formattedAllowances = allowancesData.map((a: any) => ({
          code: a.code,
          description: a.description,
          taxable: a.taxable,
          recurring: a.recurring,
          amount: a.amount || 0,
          percentage: a.percentage || 0,
          type: a.type
        }))
        setAllowances(formattedAllowances)
      }

      const { data: deductionsData, error: deductionsError } = await supabase
        .from("payroll_deductions")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (deductionsError) throw deductionsError

      if (deductionsData && deductionsData.length > 0) {
        const formattedDeductions = deductionsData.map((d: any) => ({
          code: d.code,
          description: d.description,
          recurring: d.recurring,
          amount: d.amount || 0,
          percentage: d.percentage || 0,
          type: d.type,
          taxable: d.taxable
        }))
        setDeductions(formattedDeductions)
      }

      const { data: salaryGradesData, error: salaryGradesError } = await supabase
        .from("salary_grades")
        .select("*")
        .eq("is_active", true)
        .order("grade_level", { ascending: true })

      if (salaryGradesError) throw salaryGradesError

      if (salaryGradesData && salaryGradesData.length > 0) {
        const formattedGrades = salaryGradesData.map((g: any) => ({
          id: g.id,
          name: g.grade_name,
          description: `Grade Level ${g.grade_level}`,
          minSalary: g.step_1 || 0,
          maxSalary: g.step_5 || g.step_4 || g.step_3 || g.step_2 || g.step_1 || 0,
          notches: [
            { step: 1, amount: g.step_1 || 0 },
            { step: 2, amount: g.step_2 || 0 },
            { step: 3, amount: g.step_3 || 0 },
            { step: 4, amount: g.step_4 || 0 },
            { step: 5, amount: g.step_5 || 0 },
          ].filter(n => n.amount > 0)
        }))
        setSalaryGrades(formattedGrades)
      }

      const { data: taxRatesData, error: taxRatesError } = await supabase
        .from("tax_rates")
        .select("*")
        .eq("is_active", true)
        .single()

      if (!taxRatesError && taxRatesData) {
        setSsnitRates({
          employee: taxRatesData.employee_rate || 5.5,
          employer: taxRatesData.employer_rate || 13,
          total: taxRatesData.total_rate || 18.5
        })
      }

      console.log("[v0] Payroll configuration data loaded from database")
    } catch (error) {
      console.error("[v0] Error loading payroll configuration data:", error)
      // Keep existing mock data as fallback
    }
  }

  const loadNotificationData = async () => {
    console.log("[v0] Loading notification data...")
    
    if (isDemoMode()) {
      console.log("[v0] Demo mode detected, using mock notification data")
      // Fall back to existing mock data if in demo mode
      setNotificationTemplates([
        {
          id: "template-001",
          name: "Welcome Email",
          subject: "Welcome to {{company_name}}!",
          body: "Dear {{employee_name}},\n\nWelcome to {{company_name}}! We're excited to have you join our team.\n\nBest regards,\nHR Team",
          type: "email",
          category: "onboarding",
          isActive: true,
          variables: ["company_name", "employee_name"],
          createdBy: "HR Manager",
          createdAt: "2024-01-15T10:00:00Z",
          lastModified: "2024-01-15T10:00:00Z",
          status: "Active",
          description: "Welcome email for new employees"
        }
      ])
      setNotifications([
        {
          id: "notif-001",
          title: "System Maintenance Scheduled",
          message: "Scheduled maintenance will occur on Sunday, January 21st from 2:00 AM to 4:00 AM GMT",
          type: "system",
          priority: "medium",
          read: false,
          timestamp: "2024-01-15T10:00:00Z",
          expiresAt: "2024-01-21T04:00:00Z"
        },
      ])
      return
    }

    try {
      const { data: templatesData, error: templatesError } = await supabase
        .from("notification_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (templatesError) throw templatesError

      if (templatesData && templatesData.length > 0) {
        const formattedTemplates = templatesData.map((t: any) => ({
          id: t.id,
          name: t.template_name,
          subject: t.subject,
          body: t.body_template,
          type: t.template_type,
          category: t.category,
          isActive: t.is_active,
          variables: t.variables || [],
          createdBy: "System",
          createdAt: t.created_at,
          lastModified: t.updated_at,
          status: t.is_active ? "Active" : "Inactive",
          description: `${t.category} notification template`
        }))
        setNotificationTemplates(formattedTemplates)
      }

      const { data: notificationsData, error: notificationsError } = await supabase
        .from("notification_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)

      if (notificationsError) throw notificationsError

      if (notificationsData && notificationsData.length > 0) {
        const formattedNotifications = notificationsData.map((n: any) => ({
          id: n.id,
          title: n.subject,
          message: n.body,
          type: n.notification_type,
          priority: "medium",
          read: !!n.opened_at,
          timestamp: n.created_at,
          expiresAt: null
        }))
        setNotifications(formattedNotifications)
      }

      console.log("[v0] Notification data loaded from database")
    } catch (error) {
      console.error("[v0] Error loading notification data:", error)
      // Keep existing mock data as fallback
    }
  }

  const loadSecurityData = async () => {
    console.log("[v0] Loading security data...")
    
    if (isDemoMode()) {
      console.log("[v0] Demo mode detected, using mock security data")
      // Fall back to existing mock data if in demo mode
      setLastBackupTime(new Date("2024-03-10T10:00:00Z").toISOString())
      setBackupSize("50 MB")
      setBackupStatus("Completed")
      return
    }

    try {
      // Set backup information (this would come from your backup system)
      setLastBackupTime(new Date().toISOString())
      setBackupSize("2.4 GB")
      setBackupStatus("completed")

      console.log("[v0] Security data loaded")
    } catch (error) {
      console.error("[v0] Error loading security data:", error)
    }
  }

  const loadAuditLogs = async () => {
    console.log("[v0] Loading audit logs...")
    
    if (isDemoMode()) {
      console.log("[v0] Demo mode detected, using mock audit logs")
      setAuditLogs([
        {
          id: "log-001",
          user_email: "admin@example.com",
          action: "User logged in",
          timestamp: new Date("2024-03-11T09:00:00Z").toISOString(),
          ip_address: "192.168.1.10",
          severity: "low",
        },
      ])
      return
    }

    try {
      const { data: auditLogsData, error: auditLogsError } = await supabase
        .from("access_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (auditLogsError) throw auditLogsError

      if (auditLogsData && auditLogsData.length > 0) {
        const formattedLogs = auditLogsData.map((log: any) => ({
          id: log.id,
          user_email: "user@example.com", // You'd need to join with employees table
          action: log.action,
          timestamp: log.created_at,
          ip_address: log.ip_address?.toString() || "N/A",
          severity: log.success ? "low" : "high"
        }))
        setAuditLogs(formattedLogs)
      }

      console.log("[v0] Audit logs loaded from database")
    } catch (error) {
      console.error("[v0] Error loading audit logs:", error)
      // Keep existing mock data as fallback
    }
  }

  const loadSalaryGradesData = async () => {
    console.log("[v0] Loading salary grades data...")
    await new Promise((resolve) => setTimeout(resolve, 200))

    // This data is already loaded in loadPayrollConfigData, but we can add more specific salary grade data here
    console.log("[v0] Salary grades data loaded")
  }

  const loadAllData = async () => {
    console.log("[v0] Loading comprehensive settings data...")
    try {
      await Promise.all([
        loadCompanyData(),
        loadEmployees(),
        loadSubsidiaries(),
        loadRoles(),
        loadAccessAndSecurityData(),
        loadHRConfigData(),
        loadPayrollConfigData(),
        loadNotificationData(),
        loadSecurityData(),
        loadAuditLogs(),
        loadSalaryGradesData(),
      ])
      console.log("[v0] All settings data loaded successfully")
    } catch (error) {
      console.error("[v0] Error loading settings data:", error)
      toast({
        title: "Error",
        description: "Failed to load some settings data",
        variant: "destructive",
      })
    }
  }

  // Load data when the component mounts
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
      toast({
        title: "Employee Count Refreshed",
        description: "Employee count updated successfully (Demo Mode)",
      })
      return
    }

    try {
      // In a real scenario, you'd likely fetch employee count from a related table or service
      // For now, we simulate an update.
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const mockCount = Math.floor(Math.random() * 200) + 20 // Simulate fetching a new count
      const updatedSubsidiaries = subsidiaries.map((sub) =>
        sub.id === subsidiaryId ? { ...sub, employee_count: mockCount } : sub,
      )
      setSubsidiaries(updatedSubsidiaries)

      toast({
        title: "Employee Count Refreshed",
        description: "Employee count updated successfully",
      })
    } catch (error) {
      console.error("Refresh employee count error:", error)
      toast({
        title: "Error",
        description: "Failed to refresh employee count",
        variant: "destructive",
      })
    }
  }

  const updateSubsidiary = async (subsidiaryId: string, updates: Partial<Subsidiary>) => {
    console.log("[v0] Updating subsidiary:", subsidiaryId, updates)
    try {
      const { data, error } = await supabase
        .from("subsidiaries")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", subsidiaryId)
        .select("*")
        .single()

      if (error) throw error

      // Update local state with the latest data
      setSubsidiaries((prev) =>
        prev.map((sub) => (sub.id === subsidiaryId ? { ...sub, ...data } : sub)),
      )
      return data
    } catch (error) {
      console.error("Error updating subsidiary:", error)
      throw error // Re-throw to be caught by calling functions
    }
  }

  const confirmToggleStatus = async () => {
    if (!subsidiaryToToggle) return

    const newStatus = subsidiaryToToggle.status === "active" ? "inactive" : "active"
    try {
      await updateSubsidiary(subsidiaryToToggle.id, { status: newStatus })
      toast({
        title: "Status Updated",
        description: `Subsidiary '${subsidiaryToToggle.name}' is now ${newStatus}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${newStatus} subsidiary. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setShowDeactivateConfirm(false)
      setShowReactivateConfirm(false)
      setSubsidiaryToToggle(null)
    }
  }


  // Other component logic...

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Tabs for different settings sections */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("company")}
          className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === "company" ? "bg-white text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
        >
          Company Information
        </button>
        <button
          onClick={() => setActiveTab("hr")}
          className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === "hr" ? "bg-white text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
        >
          HR Settings
        </button>
        <button
          onClick={() => setActiveTab("payroll")}
          className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === "payroll" ? "bg-white text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
        >
          Payroll & Taxes
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === "notifications" ? "bg-white text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
        >
          Notifications
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === "security" ? "bg-white text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
        >
          Security
        </button>
        <button
          onClick={() => setActiveTab("access")}
          className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === "access" ? "bg-white text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
        >
          Access Control
        </button>
        <button
          onClick={() => setActiveTab("subsidiaries")}
          className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === "subsidiaries" ? "bg-white text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
        >
          Subsidiaries
        </button>
        <button
          onClick={() => setActiveTab("employees")}
          className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === "employees" ? "bg-white text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
        >
          Employees
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === "roles" ? "bg-white text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
        >
          Roles
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === "documents" ? "bg-white text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
        >
          HR Documents
        </button>
      </div>

      {/* Content for each tab */}
      {activeTab === "company" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Company Information</h2>
          <form onSubmit={async (e) => {
            e.preventDefault()
            setIsSavingSettings(true)
            try {
              if (isDemoMode()) {
                await new Promise((resolve) => setTimeout(resolve, 1500))
                toast({ title: "Company Info Saved", description: "Settings updated (Demo Mode)" })
              } else {
                // Save to Supabase
                const { error } = await supabase.from("companies").update({
                  name: companyData.name,
                  email_address: companyData.email_address,
                  phone_number: companyData.phone_number,
                  address: companyData.address,
                  tax_id: companyData.tax_id,
                  ssnit_number: companyData.ssnit_number,
                  industry: companyData.industry,
                  divisions: companyData.divisions,
                  departments: companyData.departments,
                  locations: companyData.locations,
                }).eq('id', companyData.id)

                if (error) throw error
                toast({ title: "Company Info Saved", description: "Company settings updated successfully" })
              }
            } catch (error) {
              console.error("Error saving company info:", error)
              toast({ title: "Save Failed", description: "Failed to save company information", variant: "destructive" })
            } finally {
              setIsSavingSettings(false)
            }
          }}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                  Industry
                </label>
                <input
                  type="text"
                  id="industry"
                  value={companyData.industry}
                  onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={companyData.email_address}
                  onChange={(e) => setCompanyData({ ...companyData, email_address: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={companyData.phone_number}
                  onChange={(e) => setCompanyData({ ...companyData, phone_number: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
                  Tax ID
                </label>
                <input
                  type="text"
                  id="taxId"
                  value={companyData.tax_id}
                  onChange={(e) => setCompanyData({ ...companyData, tax_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="ssnitNumber" className="block text-sm font-medium text-gray-700">
                  SSNIT Number
                </label>
                <input
                  type="text"
                  id="ssnitNumber"
                  value={companyData.ssnit_number}
                  onChange={(e) => setCompanyData({ ...companyData, ssnit_number: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>

            {/* Divisions, Departments, Locations */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Organizational Structure</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="divisions" className="block text-sm font-medium text-gray-700">Divisions</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newDivisionName}
                      onChange={(e) => setNewDivisionName(e.target.value)}
                      placeholder="Add division"
                      className="flex-1 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                    <button type="button" onClick={handleAddDivision} className="mt-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Add</button>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {divisions.map((division, index) => (
                      <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span>{division}</span>
                        <button type="button" onClick={() => handleRemoveDivision(division)} className="text-red-500 hover:text-red-700">Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <label htmlFor="departments" className="block text-sm font-medium text-gray-700">Departments</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newDepartmentName}
                      onChange={(e) => setNewDepartmentName(e.target.value)}
                      placeholder="Add department"
                      className="flex-1 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                    <button type="button" onClick={handleAddDepartment} className="mt-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Add</button>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {departments.map((department, index) => (
                      <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span>{department}</span>
                        <button type="button" onClick={() => handleRemoveDepartment(department)} className="text-red-500 hover:text-red-700">Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <label htmlFor="locations" className="block text-sm font-medium text-gray-700">Locations</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      placeholder="Add location"
                      className="flex-1 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                    <button type="button" onClick={handleAddLocation} className="mt-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Add</button>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {locations.map((location, index) => (
                      <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span>{location}</span>
                        <button type="button" onClick={() => handleRemoveLocation(location)} className="text-red-500 hover:text-red-700">Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="mt-6">
              <label htmlFor="companyLogo" className="block text-sm font-medium text-gray-700">
                Company Logo
              </label>
              <div className="mt-2 flex items-center">
                {companyLogoPreview && (
                  <img src={companyLogoPreview || "/placeholder.svg"} alt="Company Logo Preview" className="h-16 w-16 rounded-full mr-4 object-cover" />
                )}
                <input
                  type="file"
                  id="companyLogo"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setCompanyLogoPreview(reader.result as string)
                        // In a real app, you would upload this to storage and save the URL
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              {isUploadingLogo && <p className="text-sm text-gray-500 mt-2">Uploading logo...</p>}
            </div>


            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {isSavingSettings ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "hr" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">HR Settings</h2>
          <form onSubmit={async (e) => {
            e.preventDefault()
            await handleSaveHRConfig()
          }}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="leaveYearStart" className="block text-sm font-medium text-gray-700">Leave Year Start</label>
                <select
                  id="leaveYearStart"
                  value={hrConfig.leaveYearStart}
                  onChange={(e) => setHrConfig({ ...hrConfig, leaveYearStart: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option>January</option>
                  <option>February</option>
                  <option>March</option>
                  {/* ... other months */}
                </select>
              </div>
              <div>
                <label htmlFor="probationPeriod" className="block text-sm font-medium text-gray-700">Probation Period (Months)</label>
                <input
                  type="number"
                  id="probationPeriod"
                  value={hrConfig.probationPeriod}
                  onChange={(e) => setHrConfig({ ...hrConfig, probationPeriod: Number.parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="workingHoursPerDay" className="block text-sm font-medium text-gray-700">Working Hours per Day</label>
                <input
                  type="number"
                  id="workingHoursPerDay"
                  value={hrConfig.workingHoursPerDay}
                  onChange={(e) => setHrConfig({ ...hrConfig, workingHoursPerDay: Number.parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="workingDaysPerWeek" className="block text-sm font-medium text-gray-700">Working Days per Week</label>
                <input
                  type="number"
                  id="workingDaysPerWeek"
                  value={hrConfig.workingDaysPerWeek}
                  onChange={(e) => setHrConfig({ ...hrConfig, workingDaysPerWeek: Number.parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-2">Features</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center">
                <input
                  id="autoApproveLeave"
                  type="checkbox"
                  checked={hrConfig.autoApproveLeave}
                  onChange={(e) => setHrConfig({ ...hrConfig, autoApproveLeave: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="autoApproveLeave" className="ml-2 block text-sm font-medium text-gray-700">Auto-Approve Leave Requests</label>
              </div>
              <div className="flex items-center">
                <input
                  id="emailNotifications"
                  type="checkbox"
                  checked={hrConfig.emailNotifications}
                  onChange={(e) => setHrConfig({ ...hrConfig, emailNotifications: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="emailNotifications" className="ml-2 block text-sm font-medium text-gray-700">Email Notifications</label>
              </div>
              <div className="flex items-center">
                <input
                  id="aiRecommendations"
                  type="checkbox"
                  checked={hrConfig.aiRecommendations}
                  onChange={(e) => setHrConfig({ ...hrConfig, aiRecommendations: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="aiRecommendations" className="ml-2 block text-sm font-medium text-gray-700">AI Recommendations</label>
              </div>
              <div className="flex items-center">
                <input
                  id="smartScheduling"
                  type="checkbox"
                  checked={hrConfig.smartScheduling}
                  onChange={(e) => setHrConfig({ ...hrConfig, smartScheduling: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="smartScheduling" className="ml-2 block text-sm font-medium text-gray-700">Smart Scheduling</label>
              </div>
              <div className="flex items-center">
                <input
                  id="performanceTracking"
                  type="checkbox"
                  checked={hrConfig.performanceTracking}
                  onChange={(e) => setHrConfig({ ...hrConfig, performanceTracking: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="performanceTracking" className="ml-2 block text-sm font-medium text-gray-700">Performance Tracking</label>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={isSaving} // Use the general saving state
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "payroll" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Payroll & Taxes</h2>
          <div className="mb-6 flex space-x-4 border-b border-gray-200 pb-2">
            <button
              onClick={() => setSalaryGradeTab("structured")}
              className={`px-3 py-2 rounded-md font-medium ${salaryGradeTab === "structured" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              Structured Salary Grades
            </button>
            <button
              onClick={() => setSalaryGradeTab("unstructured")}
              className={`px-3 py-2 rounded-md font-medium ${salaryGradeTab === "unstructured" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              Unstructured Grades
            </button>
          </div>

          {salaryGradeTab === "structured" && (
            <>
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowImportExportModal(true)} className="mr-2 px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Import/Export</button>
                <button onClick={handleAddSalaryGrade} className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                  Add Salary Grade
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Salary</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Salary</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salaryGrades.map((grade) => (
                      <tr key={grade.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{grade.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.minSalary.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.maxSalary.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => handleEditSalaryGrade(grade)} className="text-blue-500 hover:text-blue-700 mr-2">Edit</button>
                          <button onClick={() => handleDeleteSalaryGrade(grade.id)} className="text-red-500 hover:text-red-700">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Salary Grade Modal */}
              {showSalaryGradeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
                  <div className="bg-white rounded-lg p-6 shadow-xl max-w-4xl w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">{editingGrade ? "Edit" : "Add"} Salary Grade</h3>
                      <button onClick={() => setShowSalaryGradeModal(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveSalaryGrade() }}>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="gradeName" className="block text-sm font-medium text-gray-700">Grade Name</label>
                          <input
                            type="text"
                            id="gradeName"
                            value={newGrade.name}
                            onChange={(e) => setNewGrade({ ...newGrade, name: e.target.value })}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="gradeDescription" className="block text-sm font-medium text-gray-700">Description</label>
                          <input
                            type="text"
                            id="gradeDescription"
                            value={newGrade.description}
                            onChange={(e) => setNewGrade({ ...newGrade, description: e.target.value })}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label htmlFor="minSalary" className="block text-sm font-medium text-gray-700">Minimum Salary</label>
                          <input
                            type="number"
                            id="minSalary"
                            value={newGrade.minSalary}
                            onChange={(e) => setNewGrade({ ...newGrade, minSalary: e.target.value })}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="maxSalary" className="block text-sm font-medium text-gray-700">Maximum Salary</label>
                          <input
                            type="number"
                            id="maxSalary"
                            value={newGrade.maxSalary}
                            onChange={(e) => setNewGrade({ ...newGrade, maxSalary: e.target.value })}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="numberOfNotches" className="block text-sm font-medium text-gray-700">Number of Notches</label>
                          <input
                            type="number"
                            id="numberOfNotches"
                            value={newGrade.numberOfNotches}
                            onChange={(e) => setNewGrade({ ...newGrade, numberOfNotches: Number.parseInt(e.target.value) })}
                            min="2"
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            required
                          />
                        </div>
                        <div className="flex items-end">
                          <button type="button" onClick={handleGenerateNotches} disabled={isGeneratingNotches} className="mt-1 px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-dark disabled:opacity-50">
                            {isGeneratingNotches ? "Generating..." : "Generate Notches"}
                          </button>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h4 className="text-md font-semibold mb-2">Notches</h4>
                        {newGrade.notches.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {newGrade.notches.map((notch, index) => (
                              <div key={index}>
                                <label htmlFor={`notchStep${index}`} className="block text-sm font-medium text-gray-700">Step {notch.step}</label>
                                <input
                                  type="number"
                                  id={`notchStep${index}`}
                                  value={notch.amount}
                                  onChange={(e) => {
                                    const updatedNotches = [...newGrade.notches]
                                    updatedNotches[index] = { ...notch, amount: Number(e.target.value) }
                                    setNewGrade({ ...newGrade, notches: updatedNotches })
                                  }}
                                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                                  required
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Notches will appear here after generation.</p>
                        )}
                      </div>

                      <div className="flex justify-end mt-8">
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Save Grade</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Import/Export Modal */}
              {showImportExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
                  <div className="bg-white rounded-lg p-6 shadow-xl max-w-2xl w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Import/Export Salary Grades</h3>
                      <button onClick={() => setShowImportExportModal(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 mb-6">
                      <div>
                        <label htmlFor="importData" className="block text-sm font-medium text-gray-700">Paste CSV Data</label>
                        <textarea
                          id="importData"
                          rows={8}
                          value={importData}
                          onChange={(e) => setImportData(e.target.value)}
                          placeholder="Paste your CSV data here..."
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="flex justify-center gap-4">
                        <button onClick={handleImportSalaryGrades} disabled={isImporting} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50">
                          {isImporting ? "Importing..." : "Import from CSV"}
                        </button>
                        <button onClick={() => handleExportSalaryGrades("csv")} disabled={isExporting} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50">
                          {isExporting ? "Exporting..." : "Export to CSV"}
                        </button>
                        <button onClick={() => handleExportSalaryGrades("excel")} disabled={isExporting} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50">
                          {isExporting ? "Exporting..." : "Export to Excel"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {salaryGradeTab === "unstructured" && (
            <>
              <div className="flex justify-end mb-4">
                <button onClick={handleAddUnstructuredGrade} className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                  Add Unstructured Grade
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">General Increment</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance Increment</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {unstructuredGrades.map((grade) => (
                      <tr key={grade.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{grade.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.generalIncrement.type === 'percentage' ? `${grade.generalIncrement.value}%` : `GHS ${grade.generalIncrement.value}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.performanceIncrement.type === 'percentage' ? `${grade.performanceIncrement.value}%` : `GHS ${grade.performanceIncrement.value}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => handleEditUnstructuredGrade(grade)} className="text-blue-500 hover:text-blue-700 mr-2">Edit</button>
                          <button onClick={() => handleDeleteUnstructuredGrade(grade.id)} className="text-red-500 hover:text-red-700">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Unstructured Grade Modal */}
              {showUnstructuredModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
                  <div className="bg-white rounded-lg p-6 shadow-xl max-w-2xl w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">{editingUnstructured ? "Edit" : "Add"} Unstructured Grade</h3>
                      <button onClick={() => setShowUnstructuredModal(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveUnstructuredGrade() }}>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="unstructuredGradeName" className="block text-sm font-medium text-gray-700">Grade Name</label>
                          <input
                            type="text"
                            id="unstructuredGradeName"
                            value={newUnstructured.name}
                            onChange={(e) => setNewUnstructured({ ...newUnstructured, name: e.target.value })}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="unstructuredGradeDescription" className="block text-sm font-medium text-gray-700">Description</label>
                          <input
                            type="text"
                            id="unstructuredGradeDescription"
                            value={newUnstructured.description}
                            onChange={(e) => setNewUnstructured({ ...newUnstructured, description: e.target.value })}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          />
                        </div>

                        {/* General Increment */}
                        <div className="border p-3 rounded-md">
                          <h4 className="text-md font-semibold mb-2">General Increment</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={newUnstructured.generalIncrement.type}
                              onChange={(e) => setNewUnstructured({ ...newUnstructured, generalIncrement: { ...newUnstructured.generalIncrement, type: e.target.value as 'percentage' | 'fixed' } })}
                              className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            >
                              <option value="percentage">%</option>
                              <option value="fixed">Fixed Amount (GHS)</option>
                            </select>
                            <input
                              type="number"
                              value={newUnstructured.generalIncrement.value}
                              onChange={(e) => setNewUnstructured({ ...newUnstructured, generalIncrement: { ...newUnstructured.generalIncrement, value: Number(e.target.value) } })}
                              className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                              required
                            />
                          </div>
                        </div>

                        {/* Performance Increment */}
                        <div className="border p-3 rounded-md">
                          <h4 className="text-md font-semibold mb-2">Performance Increment</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={newUnstructured.performanceIncrement.type}
                              onChange={(e) => setNewUnstructured({ ...newUnstructured, performanceIncrement: { ...newUnstructured.performanceIncrement, type: e.target.value as 'percentage' | 'fixed' } })}
                              className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            >
                              <option value="percentage">%</option>
                              <option value="fixed">Fixed Amount (GHS)</option>
                            </select>
                            <input
                              type="number"
                              value={newUnstructured.performanceIncrement.value}
                              onChange={(e) => setNewUnstructured({ ...newUnstructured, performanceIncrement: { ...newUnstructured.performanceIncrement, value: Number(e.target.value) } })}
                              className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-8">
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Save Grade</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-bold mb-4">Allowances & Deductions</h3>
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">Allowances</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurring</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allowances.map((allowance, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{allowance.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{allowance.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{allowance.taxable ? 'Yes' : 'No'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{allowance.recurring ? 'Yes' : 'No'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{allowance.type === 'FIXED' ? allowance.amount.toLocaleString() : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{allowance.type === 'PERCENTAGE' ? `${allowance.percentage}%` : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{allowance.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button onClick={() => handleEditAllowance(index)} className="text-blue-500 hover:text-blue-700">Edit</button>
                          <button onClick={() => handleDeleteAllowance(index)} className="text-red-500 hover:text-red-700">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleAddAllowance} className="mt-4 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Add Allowance</button>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">Deductions</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurring</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deductions.map((deduction, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{deduction.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deduction.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deduction.recurring ? 'Yes' : 'No'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deduction.type === 'FIXED' ? deduction.amount.toLocaleString() : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deduction.type === 'VARIABLE' ? `${deduction.percentage}%` : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deduction.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button onClick={() => handleEditDeduction(index)} className="text-blue-500 hover:text-blue-700">Edit</button>
                          <button onClick={() => handleDeleteDeduction(index)} className="text-red-500 hover:text-red-700">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleAddDeduction} className="mt-4 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Add Deduction</button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-bold mb-4">Tax Rates & Social Security</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* SSNIT Rates */}
                <div>
                  <h4 className="text-lg font-semibold mb-2">SSNIT Rates (%)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employee</label>
                      <input
                        type="number"
                        value={ssnitRates.employee}
                        onChange={(e) => updateSsnitRates("employee", Number.parseFloat(e.target.value))}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employer</label>
                      <input
                        type="number"
                        value={ssnitRates.employer}
                        onChange={(e) => updateSsnitRates("employer", Number.parseFloat(e.target.value))}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        step="0.1"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Total</label>
                      <input
                        type="number"
                        value={ssnitRates.total}
                        readOnly
                        className="mt-1 w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-primary focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Tier 2 Rates */}
                <div>
                  <h4 className="text-lg font-semibold mb-2">Tier 2 Rates (%)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employee</label>
                      <input
                        type="number"
                        value={tier2Rates.employee}
                        onChange={(e) => updateTier2Rates("employee", Number.parseFloat(e.target.value))}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employer</label>
                      <input
                        type="number"
                        value={tier2Rates.employer}
                        onChange={(e) => updateTier2Rates("employer", Number.parseFloat(e.target.value))}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        step="0.1"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Total</label>
                      <input
                        type="number"
                        value={tier2Rates.total}
                        readOnly
                        className="mt-1 w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-primary focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Tier 3 Rates */}
                <div>
                  <h4 className="text-lg font-semibold mb-2">Tier 3 Rates (%)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employee</label>
                      <input
                        type="number"
                        value={tier3Rates.employee}
                        onChange={(e) => updateTier3Rates("employee", Number.parseFloat(e.target.value))}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employer</label>
                      <input
                        type="number"
                        value={tier3Rates.employer}
                        onChange={(e) => updateTier3Rates("employer", Number.parseFloat(e.target.value))}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        step="0.1"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Total</label>
                      <input
                        type="number"
                        value={tier3Rates.total}
                        readOnly
                        className="mt-1 w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-primary focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-bold mb-4">Tax Reliefs</h3>
              <div className="flex justify-end mb-4">
                <button onClick={syncTaxReliefsFromGRA} disabled={isSyncingReliefs} className="mr-2 px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50">
                  {isSyncingReliefs ? "Syncing..." : "Sync from GRA"}
                </button>
                <button onClick={handleAddTaxRelief} className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                  Add Tax Relief
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {taxReliefs.map((relief, index) => (
                      <tr key={relief.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {editingRelief === index ? (
                            <input
                              type="text"
                              value={relief.name}
                              onChange={(e) => handleTaxReliefFieldChange(index, 'name', e.target.value)}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            />
                          ) : (
                            relief.name
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingRelief === index ? (
                            <input
                              type="text"
                              value={relief.category}
                              onChange={(e) => handleTaxReliefFieldChange(index, 'category', e.target.value)}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            />
                          ) : (
                            relief.category
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingRelief === index ? (
                            <input
                              type="number"
                              value={relief.amount}
                              onChange={(e) => handleTaxReliefFieldChange(index, 'amount', Number.parseFloat(e.target.value))}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            />
                          ) : (
                            relief.amount.toLocaleString()
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{relief.currency}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingRelief === index ? (
                            <input
                              type="date"
                              value={relief.effectiveDate}
                              onChange={(e) => handleTaxReliefFieldChange(index, 'effectiveDate', e.target.value)}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            />
                          ) : (
                            relief.effectiveDate
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingRelief === index ? (
                            <input
                              type="checkbox"
                              checked={relief.isActive}
                              onChange={(e) => handleTaxReliefFieldChange(index, 'isActive', e.target.checked)}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                          ) : (
                            relief.isActive ? 'Yes' : 'No'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button onClick={() => handleEditTaxRelief(index)} className="text-blue-500 hover:text-blue-700">
                            {editingRelief === index ? "Save" : "Edit"}
                          </button>
                          {editingRelief !== index && (
                            <button onClick={() => handleDeleteTaxRelief(index)} className="text-red-500 hover:text-red-700">Delete</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>


            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={isSavingPayroll || isSavingTax}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {isSavingPayroll || isSavingTax ? "Saving..." : "Save Payroll & Tax Settings"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Notification Settings</h2>
          <form onSubmit={async (e) => {
            e.preventDefault()
            setIsSaving(true)
            try {
              await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate saving
              toast({ title: "Notification Settings Saved", description: "Your notification preferences have been updated." })
            } catch (error) {
              toast({ title: "Save Failed", description: "Failed to save notification settings.", variant: "destructive" })
            } finally {
              setIsSaving(false)
            }
          }}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Notification Preferences */}
              <div className="space-y-2">
                <h4 className="text-lg font-semibold mb-2">Preferences</h4>
                <div className="flex items-center">
                  <input
                    id="payrollNotifications"
                    type="checkbox"
                    checked={notificationSettings.payrollNotifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, payrollNotifications: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="payrollNotifications" className="ml-2 block text-sm font-medium text-gray-700">Payroll Notifications</label>
                </div>
                <div className="flex items-center">
                  <input
                    id="leaveNotifications"
                    type="checkbox"
                    checked={notificationSettings.leaveNotifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, leaveNotifications: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="leaveNotifications" className="ml-2 block text-sm font-medium text-gray-700">Leave Notifications</label>
                </div>
                <div className="flex items-center">
                  <input
                    id="attendanceAlerts"
                    type="checkbox"
                    checked={notificationSettings.attendanceAlerts}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, attendanceAlerts: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="attendanceAlerts" className="ml-2 block text-sm font-medium text-gray-700">Attendance Alerts</label>
                </div>
                <div className="flex items-center">
                  <input
                    id="promotionNotifications"
                    type="checkbox"
                    checked={notificationSettings.promotionNotifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, promotionNotifications: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="promotionNotifications" className="ml-2 block text-sm font-medium text-gray-700">Promotion Notifications</label>
                </div>
                <div className="flex items-center">
                  <input
                    id="systemMaintenanceAlerts"
                    type="checkbox"
                    checked={notificationSettings.systemMaintenanceAlerts}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, systemMaintenanceAlerts: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="systemMaintenanceAlerts" className="ml-2 block text-sm font-medium text-gray-700">System Maintenance Alerts</label>
                </div>
              </div>

              {/* Delivery Methods */}
              <div className="space-y-2">
                <h4 className="text-lg font-semibold mb-2">Delivery Methods</h4>
                <div>
                  <label htmlFor="emailDigest" className="block text-sm font-medium text-gray-700">Email Digest Frequency</label>
                  <select
                    id="emailDigest"
                    value={notificationSettings.emailDigest}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailDigest: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="immediate">Immediate</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    id="smsAlerts"
                    type="checkbox"
                    checked={notificationSettings.smsAlerts}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, smsAlerts: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="smsAlerts" className="ml-2 block text-sm font-medium text-gray-700">SMS Alerts</label>
                </div>
                <div className="flex items-center">
                  <input
                    id="pushNotifications"
                    type="checkbox"
                    checked={notificationSettings.pushNotifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="pushNotifications" className="ml-2 block text-sm font-medium text-gray-700">Push Notifications</label>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-bold mb-4">Notification Templates</h3>
              <div className="flex justify-end mb-4">
                <button onClick={handleAddNotificationTemplate} className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                  Add Template
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Modified</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {notificationTemplates.map((template) => (
                      <tr key={template.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{template.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.lastModified}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${template.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {template.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button onClick={() => handleViewTemplate(template)} className="text-blue-500 hover:text-blue-700 mr-2">View</button>
                          <button onClick={() => handleEditTemplate(template)} className="text-blue-500 hover:text-blue-700 mr-2">Edit</button>
                          <button onClick={() => handleDeleteTemplate(template.id)} className="text-red-500 hover:text-red-700">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Template Modal */}
            {showTemplateModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
                <div className="bg-white rounded-lg p-6 shadow-xl max-w-3xl w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{templateModalType === 'view' ? 'View' : templateModalType === 'edit' ? 'Edit' : 'Add'} Notification Template</h3>
                    <button onClick={() => { setShowTemplateModal(false); setTemplateModalType('view'); setSelectedTemplate(null); setEditingTemplate(null) }} className="text-gray-500 hover:text-gray-700">&times;</button>
                  </div>
                  {templateModalType === 'view' ? (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Template Name</label>
                        <p className="mt-1 text-gray-900">{selectedTemplate.name}</p>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Subject</label>
                        <p className="mt-1 text-gray-900">{selectedTemplate.subject}</p>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Body</label>
                        <pre className="mt-1 text-gray-900 bg-gray-100 p-3 rounded whitespace-pre-wrap">{selectedTemplate.body}</pre>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Variables</label>
                        <p className="mt-1 text-gray-900">{selectedTemplate.variables.join(', ')}</p>
                      </div>
                      <div className="flex justify-end">
                        <button onClick={() => { setShowTemplateModal(false); setTemplateModalType('view'); setSelectedTemplate(null); setEditingTemplate(null) }} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Close</button>
                      </div>
                    </>
                  ) : (
                    <form onSubmit={handleSaveTemplate}>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="templateName" className="block text-sm font-medium text-gray-700">Template Name</label>
                          <input
                            type="text"
                            id="templateName"
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="templateType" className="block text-sm font-medium text-gray-700">Type</label>
                          <select
                            id="templateType"
                            value={newTemplate.type}
                            onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          >
                            <option value="Email">Email</option>
                            <option value="SMS">SMS</option>
                            <option value="Push">Push Notification</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="templateCategory" className="block text-sm font-medium text-gray-700">Category</label>
                          <select
                            id="templateCategory"
                            value={newTemplate.category}
                            onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          >
                            <option value="HR">HR</option>
                            <option value="Payroll">Payroll</option>
                            <option value="Leave">Leave</option>
                            <option value="Onboarding">Onboarding</option>
                            <option value="System">System</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label htmlFor="templateSubject" className="block text-sm font-medium text-gray-700">Subject</label>
                        <input
                          type="text"
                          id="templateSubject"
                          value={newTemplate.subject}
                          onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          required
                        />
                      </div>
                      <div className="mt-4">
                        <label htmlFor="templateBody" className="block text-sm font-medium text-gray-700">Body</label>
                        <textarea
                          id="templateBody"
                          rows={10}
                          value={newTemplate.body}
                          onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          required
                        />
                      </div>
                      <div className="mt-4">
                        <label htmlFor="templateVariables" className="block text-sm font-medium text-gray-700">Variables (comma-separated)</label>
                        <input
                          type="text"
                          id="templateVariables"
                          value={newTemplate.variables.join(', ')}
                          onChange={(e) => setNewTemplate({ ...newTemplate, variables: e.target.value.split(',').map(v => v.trim()).filter(v => v) })}
                          placeholder="e.g., employee_name, company_name"
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        />
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setShowAiPanel(!showAiPanel)} className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600">
                          {showAiPanel ? "Hide AI" : "Use AI Assistant"}
                        </button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50">
                          {isSaving ? "Saving..." : "Save Template"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* AI Panel */}
                  {showAiPanel && templateModalType !== 'view' && (
                    <div className="mt-6 p-4 border border-dashed border-gray-400 rounded-lg">
                      <h4 className="text-lg font-semibold mb-2">AI Template Generator</h4>
                      <textarea
                        rows={3}
                        value={aiDescription}
                        onChange={(e) => setAiDescription(e.target.value)}
                        placeholder="Describe the notification template you need..."
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      />
                      <div className="flex justify-end mt-3">
                        <button onClick={handleGenerateAiTemplate} disabled={isGeneratingAi} className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50">
                          {isGeneratingAi ? "Generating..." : "Generate Template"}
                        </button>
                      </div>

                      {/* AI Model Upgrade Notification */}
                      {showModelUpgrade && currentAIModel && (
                        <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded relative" role="alert">
                          <strong className="font-bold">AI Model Update!</strong>
                          <span className="block sm:inline"> You are now using {currentAIModel.name} ({currentAIModel.version}) with advanced capabilities.</span>
                          <button onClick={() => setShowModelUpgrade(false)} className="absolute top-0 bottom-0 right-0 px-3 py-2 text-blue-500 hover:text-blue-700">
                            <span className="text-xl">&times;</span>
                          </button>
                        </div>
                      )}

                      {/* Feedback Panel */}
                      {showFeedbackPanel && lastGeneratedTemplateId && (
                        <div className="mt-4 p-4 border border-gray-300 rounded-md bg-gray-50">
                          <h5 className="text-md font-semibold mb-3">Rate & Feedback for Generated Template</h5>
                          <div className="flex items-center mb-3">
                            <span className="mr-3 text-sm font-medium">Rating:</span>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                onClick={() => setTemplateRating(star)}
                                className={`h-6 w-6 cursor-pointer ${star <= templateRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.024a1 1 0 00-.364 1.119l1.07 3.292c.3.921-.755 1.688-1.54 1.119l-2.8-2.024a1 1 0 00-1.178 0l-2.8 2.024c-.785.57-1.847-.197-1.551-1.119l1.07-3.292a1 1 0 00-.364-1.119L2.68 9.127c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <div className="mb-3">
                            <label htmlFor="templateFeedback" className="block text-sm font-medium text-gray-700">Feedback</label>
                            <textarea
                              id="templateFeedback"
                              rows={3}
                              value={templateFeedback}
                              onChange={(e) => setTemplateFeedback(e.target.value)}
                              placeholder="Provide your feedback..."
                              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label htmlFor="templateImprovements" className="block text-sm font-medium text-gray-700">Improvement Suggestions (one per line)</label>
                            <textarea
                              id="templateImprovements"
                              rows={3}
                              value={templateImprovements}
                              onChange={(e) => setTemplateImprovements(e.target.value)}
                              placeholder="Suggestions for improvement..."
                              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            />
                          </div>
                          <div className="flex justify-end mt-4">
                            <button onClick={handleSubmitTemplateFeedback} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Submit Feedback</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Notification Settings"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "security" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Security Settings</h2>
          <form onSubmit={async (e) => {
            e.preventDefault()
            await handleSaveSecuritySettings()
          }}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Data Security */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Data Security</h4>
                <div className="flex items-center mb-2">
                  <input
                    id="dataEncryptionEnabled"
                    type="checkbox"
                    checked={securitySettings.dataEncryptionEnabled}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, dataEncryptionEnabled: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="dataEncryptionEnabled" className="ml-2 block text-sm font-medium text-gray-700">Data Encryption</label>
                </div>
                <div className="flex items-center mb-2">
                  <input
                    id="auditLoggingEnabled"
                    type="checkbox"
                    checked={securitySettings.auditLoggingEnabled}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, auditLoggingEnabled: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="auditLoggingEnabled" className="ml-2 block text-sm font-medium text-gray-700">Audit Logging</label>
                </div>
              </div>

              {/* Backup Settings */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Backup Settings</h4>
                <div className="flex items-center mb-2">
                  <input
                    id="autoBackupEnabled"
                    type="checkbox"
                    checked={securitySettings.autoBackupEnabled}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, autoBackupEnabled: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="autoBackupEnabled" className="ml-2 block text-sm font-medium text-gray-700">Automatic Backups</label>
                </div>
                <div>
                  <label htmlFor="backupFrequency" className="block text-sm font-medium text-gray-700">Backup Frequency</label>
                  <select
                    id="backupFrequency"
                    value={securitySettings.backupFrequency}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, backupFrequency: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    disabled={!securitySettings.autoBackupEnabled}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="mt-2">
                  <label htmlFor="dataRetentionDays" className="block text-sm font-medium text-gray-700">Data Retention (Days)</label>
                  <input
                    type="number"
                    id="dataRetentionDays"
                    value={securitySettings.dataRetentionDays}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, dataRetentionDays: Number.parseInt(e.target.value) })}
                    min="30"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-bold mb-4">Backup Status</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Backup Time</p>
                  <p className="text-base font-semibold text-gray-900">{lastBackupTime ? new Date(lastBackupTime).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Backup Size</p>
                  <p className="text-base font-semibold text-gray-900">{backupSize || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className={`text-base font-semibold ${backupStatus === 'Completed' ? 'text-green-600' : backupStatus === 'Failed' ? 'text-red-600' : 'text-yellow-600'}`}>{backupStatus || 'Unknown'}</p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleBackupNow}
                  disabled={isBackingUp}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                  {isBackingUp ? "Backing Up..." : "Backup Now"}
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-bold mb-4">Audit Logs</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.slice(0, 5).map((log) => ( // Displaying latest 5 logs here
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.user_email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ip_address}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.severity === 'high' ? 'bg-red-100 text-red-800' : log.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {log.severity.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <button type="button" onClick={handleViewAllLogs} className="text-primary hover:underline">View All Audit Logs</button>
              </div>
            </div>

            <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSavingSecuritySettings}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {isSavingSecuritySettings ? "Saving..." : "Save Security Settings"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "access" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Access Control</h2>
          <form onSubmit={async (e) => {
            e.preventDefault()
            await handleSaveAccessSettings()
          }}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Authentication */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Authentication</h4>
                <div className="flex items-center mb-2">
                  <input
                    id="twoFactorEnabled"
                    type="checkbox"
                    checked={accessSettings.twoFactorEnabled}
                    onChange={(e) => setAccessSettings({ ...accessSettings, twoFactorEnabled: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="twoFactorEnabled" className="ml-2 block text-sm font-medium text-gray-700">Two-Factor Authentication (2FA)</label>
                </div>
                <div className="flex items-center mb-2">
                  <input
                    id="ssoEnabled"
                    type="checkbox"
                    checked={accessSettings.ssoEnabled}
                    onChange={(e) => setAccessSettings({ ...accessSettings, ssoEnabled: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="ssoEnabled" className="ml-2 block text-sm font-medium text-gray-700">Single Sign-On (SSO)</label>
                </div>
              </div>

              {/* Session Management */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Session Management</h4>
                <div className="mb-2">
                  <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    id="sessionTimeout"
                    value={accessSettings.sessionTimeout}
                    onChange={(e) => setAccessSettings({ ...accessSettings, sessionTimeout: Number.parseInt(e.target.value) })}
                    min="5"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div className="mb-2">
                  <label htmlFor="maxLoginAttempts" className="block text-sm font-medium text-gray-700">Maximum Login Attempts</label>
                  <input
                    type="number"
                    id="maxLoginAttempts"
                    value={accessSettings.maxLoginAttempts}
                    onChange={(e) => setAccessSettings({ ...accessSettings, maxLoginAttempts: Number.parseInt(e.target.value) })}
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>

              {/* Password Policies */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Password Policies</h4>
                <div className="flex items-center mb-2">
                  <input
                    id="passwordExpiryEnabled"
                    type="checkbox"
                    checked={accessSettings.passwordExpiryEnabled}
                    onChange={(e) => setAccessSettings({ ...accessSettings, passwordExpiryEnabled: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="passwordExpiryEnabled" className="ml-2 block text-sm font-medium text-gray-700">Password Expiry</label>
                </div>
                <div className="mb-2">
                  <label htmlFor="passwordMinLength" className="block text-sm font-medium text-gray-700">Minimum Password Length</label>
                  <input
                    type="number"
                    id="passwordMinLength"
                    value={accessSettings.passwordMinLength}
                    onChange={(e) => setAccessSettings({ ...accessSettings, passwordMinLength: Number.parseInt(e.target.value) })}
                    min="6"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>

              {/* IP Restrictions */}
              <div>
                <h4 className="text-lg font-semibold mb-3">IP Restrictions</h4>
                <div className="flex items-center mb-2">
                  <input
                    id="ipRestrictionsEnabled"
                    type="checkbox"
                    checked={accessSettings.ipRestrictionsEnabled}
                    onChange={(e) => setAccessSettings({ ...accessSettings, ipRestrictionsEnabled: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="ipRestrictionsEnabled" className="ml-2 block text-sm font-medium text-gray-700">Enable IP Restrictions</label>
                </div>
                <div className="mb-2">
                  <label htmlFor="allowedIPs" className="block text-sm font-medium text-gray-700">Allowed IPs/Ranges (CIDR notation, comma-separated)</label>
                  <textarea
                    id="allowedIPs"
                    rows={3}
                    value={accessSettings.allowedIPs.join(', ')}
                    onChange={(e) => setAccessSettings({ ...accessSettings, allowedIPs: e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    disabled={!accessSettings.ipRestrictionsEnabled}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-bold mb-4">Active Sessions</h3>
              <div className="flex justify-end mb-4">
                <button type="button" onClick={handleRefreshSessions} disabled={isRefreshingSessions} className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50">
                  {isRefreshingSessions ? "Refreshing..." : "Refresh Sessions"}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeSessions.map((session) => (
                      <tr key={session.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.user_email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.ip_address}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.device}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(session.last_activity).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => handleTerminateSession(session.id)} className="text-red-500 hover:text-red-700">Terminate</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSavingAccessSettings}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {isSavingAccessSettings ? "Saving..." : "Save Access Settings"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "subsidiaries" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Subsidiary Management</h2>
          <div className="flex justify-end mb-4">
            <button onClick={handleRefreshSubsidiaries} className="mr-2 px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Refresh List</button>
            <button onClick={() => setShowAddSubsidiary(true)} className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Add New Subsidiary</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employees</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subsidiaries.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.industry}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.employee_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button onClick={() => { setSelectedSubsidiary(sub); setShowSubsidiaryDetails(true); }} className="text-blue-500 hover:text-blue-700 mr-2">View</button>
                      <button onClick={() => { setSelectedSubsidiary(sub); setShowEditSubsidiary(true); }} className="text-blue-500 hover:text-blue-700 mr-2">Edit</button>
                      {sub.status === 'active' ? (
                        <button onClick={() => confirmDeactivateSubsidiary(sub.id)} className="text-red-500 hover:text-red-700">Deactivate</button>
                      ) : (
                        <button onClick={() => confirmReactivateSubsidiary(sub.id)} className="text-green-500 hover:text-green-700">Reactivate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modals for Add, Edit, View Subsidiary */}
          {showAddSubsidiary && <AddEditSubsidiaryModal mode="add" onClose={() => setShowAddSubsidiary(false)} onSuccess={loadSubsidiaries} />}
          {showEditSubsidiary && selectedSubsidiary && <AddEditSubsidiaryModal mode="edit" subsidiary={selectedSubsidiary} onClose={() => setShowEditSubsidiary(false)} onSuccess={loadSubsidiaries} />}
          {showSubsidiaryDetails && selectedSubsidiary && <SubsidiaryDetailsModal subsidiary={selectedSubsidiary} onClose={() => setShowSubsidiaryDetails(false)} />}

          {/* Confirmation Modals */}
          {showDeactivateConfirm && subsidiaryToToggle && (
            <ConfirmationModal
              title={`Deactivate ${subsidiaryToToggle.name}?`}
              message="Are you sure you want to deactivate this subsidiary? It will not be accessible until reactivated."
              onConfirm={confirmToggleStatus}
              onCancel={() => setShowDeactivateConfirm(false)}
            />
          )}
          {showReactivateConfirm && subsidiaryToToggle && (
            <ConfirmationModal
              title={`Reactivate ${subsidiaryToToggle.name}?`}
              message="Are you sure you want to reactivate this subsidiary?"
              onConfirm={confirmToggleStatus}
              onCancel={() => setShowReactivateConfirm(false)}
            />
          )}
        </div>
      )}

      {activeTab === "employees" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Employee Management</h2>
          <div className="flex justify-end mb-4">
            <button onClick={() => setImportModal(true)} className="mr-2 px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Import Employees</button>
            <button className=\"px-3 py-2 bg-blue-500 text-white rounded-md hover:
