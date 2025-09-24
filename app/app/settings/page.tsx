"use client"
import { useState, useEffect } from "react"
import type React from "react"

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
  const [showDocumentPreview, setShowDocumentPreview] = useState(false)
  const [documentPreviewContent, setDocumentPreviewContent] = useState("")
  const [isSavingDocument, setIsSavingDocument] = useState(false)
  const [pdfViewerState, setPdfViewerState] = useState({
    currentPage: 1,
    totalPages: 1,
    zoom: 100,
    isLoading: false
  })

  const [documentZoom, setDocumentZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)

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
  const [hrDocuments, setHrDocuments] = useState([
    { id: 1, name: "Employee Handbook", type: "PDF", size: "1.2MB", visibleToAll: true },
    { id: 2, name: "Code of Conduct", type: "DOC", size: "0.5MB", visibleToAll: true },
    { id: 3, name: "Safety Manual", type: "PDF", size: "0.8MB", visibleToAll: false },
  ])

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

  const handleDownload = () => {
    if (selectedDocument) {
      const content = parseDocumentContent(selectedDocument)
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
      setLogoPreview(data.logo_url || "")
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
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setHrDocuments((prev) =>
        prev.map((doc) => (doc.id === selectedDocument.id ? { ...doc, name: documentName } : doc)),
      )

      setShowDocumentModal(false)
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

  const handleSaveLeaveType = async () => {
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

  const parseDocumentContent = (document: any) => {
    const documentTemplates = {
      "Code of Conduct": {
        content: `COMPANY CODE OF CONDUCT

EFFECTIVE DATE: January 1, 2024
VERSION: 2.1
APPROVED BY: Board of Directors

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Introduction and Purpose ................................. 3
2. Professional Conduct Standards .......................... 4
3. Confidentiality and Information Security ............... 6
4. Conflict of Interest Policy ............................. 8
5. Compliance with Laws and Regulations .................... 10
6. Reporting Violations and Whistleblower Protection ...... 12
7. Disciplinary Actions and Consequences .................. 14
8. Acknowledgment and Certification ........................ 16

═══════════════════════════════════════════════════════════════

1. INTRODUCTION AND PURPOSE

This Code of Conduct establishes the ethical standards and behavioral expectations for all employees, contractors, and representatives of our organization. It serves as a guide for making ethical decisions and maintaining the highest standards of professional integrity.

Our commitment to ethical business practices is fundamental to our success and reputation. Every individual associated with our organization is expected to read, understand, and comply with this Code of Conduct.

2. PROFESSIONAL CONDUCT STANDARDS

2.1 RESPECT AND DIGNITY
All employees must treat colleagues, customers, suppliers, and stakeholders with respect and dignity. Discrimination, harassment, or intimidation of any kind will not be tolerated.

2.2 HONESTY AND INTEGRITY
Employees must conduct themselves with honesty and integrity in all business dealings. This includes accurate reporting, truthful communication, and ethical decision-making.

2.3 PROFESSIONAL COMPETENCE
Employees are expected to maintain and develop their professional skills and knowledge to perform their duties effectively and efficiently.

3. CONFIDENTIALITY AND INFORMATION SECURITY

3.1 CONFIDENTIAL INFORMATION
Employees must protect confidential and proprietary information belonging to the company, customers, and business partners. This obligation continues even after employment ends.

3.2 DATA PROTECTION
All personal and sensitive data must be handled in accordance with applicable privacy laws and company policies. Unauthorized access, use, or disclosure of such information is strictly prohibited.

4. CONFLICT OF INTEREST POLICY

4.1 IDENTIFICATION OF CONFLICTS
Employees must identify and disclose any actual or potential conflicts of interest that may affect their ability to perform their duties objectively.

4.2 OUTSIDE ACTIVITIES
Employees should avoid outside activities, investments, or relationships that could interfere with their job performance or create conflicts with company interests.

5. COMPLIANCE WITH LAWS AND REGULATIONS

All employees must comply with applicable laws, regulations, and company policies. Ignorance of the law is not an acceptable excuse for non-compliance.

6. REPORTING VIOLATIONS

Employees are encouraged to report suspected violations of this Code of Conduct through appropriate channels. The company prohibits retaliation against individuals who report violations in good faith.

7. DISCIPLINARY ACTIONS

Violations of this Code of Conduct may result in disciplinary action, up to and including termination of employment, depending on the severity of the violation.

8. ACKNOWLEDGMENT

By signing below, I acknowledge that I have read, understood, and agree to comply with this Code of Conduct.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

For questions or clarifications regarding this Code of Conduct, please contact the Human Resources Department.

Document Control:
- Document ID: COC-2024-001
- Last Review Date: December 15, 2023
- Next Review Date: December 15, 2024
- Document Owner: Human Resources Department`
      },
      "Employee Handbook": {
        content: `EMPLOYEE HANDBOOK

WELCOME TO OUR ORGANIZATION

EFFECTIVE DATE: January 1, 2024
VERSION: 3.2
APPROVED BY: Executive Leadership Team

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Welcome Message .......................................... 3
2. Company Overview ......................................... 4
3. Employment Policies ...................................... 6
4. Compensation and Benefits ................................ 12
5. Work Environment and Safety .............................. 18
6. Professional Development ................................. 22
7. Technology and Communication ............................. 25
8. Leave Policies ........................................... 28
9. Performance Management ................................... 32
10. Disciplinary Procedures ................................. 35
11. Employee Resources ...................................... 38

═══════════════════════════════════════════════════════════════

1. WELCOME MESSAGE

Dear Team Member,

Welcome to our organization! We are delighted to have you join our team and look forward to the contributions you will make to our continued success.

This Employee Handbook serves as your comprehensive guide to our company policies, procedures, benefits, and expectations. Please take the time to read through this handbook carefully and keep it as a reference throughout your employment.

Our success depends on the dedication, creativity, and teamwork of our employees. We are committed to providing a positive work environment that promotes professional growth, work-life balance, and mutual respect.

If you have any questions about the information contained in this handbook, please don't hesitate to contact the Human Resources Department.

Welcome aboard!

Sincerely,
The Executive Leadership Team

2. COMPANY OVERVIEW

2.1 OUR MISSION
To deliver exceptional products and services while maintaining the highest standards of integrity, innovation, and customer satisfaction.

2.2 OUR VALUES
- Integrity: We conduct business with honesty and transparency
- Excellence: We strive for the highest quality in everything we do
- Innovation: We embrace change and continuously improve
- Teamwork: We collaborate effectively to achieve common goals
- Respect: We value diversity and treat everyone with dignity

2.3 ORGANIZATIONAL STRUCTURE
Our organization is structured to promote efficiency, accountability, and clear communication. Each department plays a vital role in achieving our overall objectives.

3. EMPLOYMENT POLICIES

3.1 EQUAL EMPLOYMENT OPPORTUNITY
We are committed to providing equal employment opportunities to all qualified individuals regardless of race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status.

3.2 AT-WILL EMPLOYMENT
Employment with our organization is at-will, meaning that either the employee or the company may terminate the employment relationship at any time, with or without cause or notice.

3.3 BACKGROUND CHECKS
All employment offers are contingent upon successful completion of background checks as required by law and company policy.

4. COMPENSATION AND BENEFITS

4.1 PAY PERIODS
Employees are paid bi-weekly on Fridays. If a payday falls on a holiday, payment will be made on the preceding business day.

4.2 OVERTIME
Non-exempt employees will receive overtime pay at one and one-half times their regular rate for hours worked in excess of 40 hours per week.

4.3 BENEFITS OVERVIEW
We offer a comprehensive benefits package including:
- Health insurance
- Dental and vision coverage
- Retirement savings plan with company matching
- Paid time off
- Professional development opportunities

5. WORK ENVIRONMENT AND SAFETY

5.1 WORKPLACE SAFETY
The safety and well-being of our employees is our top priority. All employees are expected to follow safety procedures and report any unsafe conditions immediately.

5.2 DRUG-FREE WORKPLACE
We maintain a drug-free workplace. The use, possession, or distribution of illegal drugs or alcohol on company premises is strictly prohibited.

6. PROFESSIONAL DEVELOPMENT

We are committed to supporting the professional growth and development of our employees through training programs, educational assistance, and career advancement opportunities.

7. TECHNOLOGY AND COMMUNICATION

7.1 COMPUTER AND INTERNET USE
Company-provided technology resources are to be used primarily for business purposes. Personal use should be limited and must not interfere with work responsibilities.

7.2 CONFIDENTIALITY
Employees must protect confidential company information and respect the privacy of customer and employee data.

8. LEAVE POLICIES

8.1 PAID TIME OFF (PTO)
Full-time employees accrue PTO based on length of service. PTO requests should be submitted in advance and approved by supervisors.

8.2 FAMILY AND MEDICAL LEAVE
Eligible employees may take unpaid leave for qualifying family and medical reasons as provided by applicable law.

9. PERFORMANCE MANAGEMENT

Regular performance evaluations help ensure that employees understand expectations and receive feedback on their performance. These evaluations also identify opportunities for professional development.

10. DISCIPLINARY PROCEDURES

When performance or conduct issues arise, we follow a progressive discipline process designed to help employees improve while maintaining workplace standards.

11. EMPLOYEE RESOURCES

11.1 HUMAN RESOURCES DEPARTMENT
The HR Department is available to assist with questions about policies, benefits, and workplace concerns.

11.2 EMPLOYEE ASSISTANCE PROGRAM
Confidential counseling and support services are available to help employees deal with personal and work-related challenges.

═══════════════════════════════════════════════════════════════

ACKNOWLEDGMENT

I acknowledge that I have received and read this Employee Handbook. I understand that it is my responsibility to comply with the policies and procedures outlined herein.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

This handbook is subject to change. Updates will be communicated to all employees.

Document Control:
- Document ID: EH-2024-001
- Last Review Date: December 1, 2023
- Next Review Date: December 1, 2024
- Document Owner: Human Resources Department`
      },
      "Safety Manual": {
        content: `WORKPLACE SAFETY MANUAL

SAFETY FIRST - ALWAYS

EFFECTIVE DATE: January 1, 2024
VERSION: 2.3
APPROVED BY: Safety Committee

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Safety Policy Statement ................................... 3
2. General Safety Rules ..................................... 4
3. Emergency Procedures ..................................... 6
4. Personal Protective Equipment ............................ 8
5. Hazard Communication ..................................... 10
6. Incident Reporting ....................................... 12
7. Training Requirements .................................... 14
8. Safety Committee ......................................... 16

═══════════════════════════════════════════════════════════════

1. SAFETY POLICY STATEMENT

The safety and health of our employees is our highest priority. We are committed to providing a safe and healthy work environment for all employees, contractors, and visitors.

Every employee has the right to a safe workplace and the responsibility to work safely. Management is committed to providing the resources necessary to maintain a safe work environment and expects all employees to actively participate in our safety program.

2. GENERAL SAFETY RULES

2.1 BASIC SAFETY PRINCIPLES
- Follow all safety procedures and guidelines
- Report unsafe conditions immediately
- Use appropriate personal protective equipment
- Keep work areas clean and organized
- Never take shortcuts that compromise safety

2.2 PROHIBITED ACTIVITIES
- Horseplay or practical jokes
- Operating equipment without proper training
- Removing or disabling safety devices
- Working under the influence of drugs or alcohol

3. EMERGENCY PROCEDURES

3.1 FIRE EMERGENCY
- Activate the nearest fire alarm
- Evacuate immediately using designated routes
- Proceed to assembly areas
- Do not use elevators
- Do not re-enter the building until authorized

3.2 MEDICAL EMERGENCY
- Call 911 immediately for serious injuries
- Notify your supervisor and security
- Provide first aid only if trained to do so
- Do not move seriously injured persons

3.3 SEVERE WEATHER
- Monitor weather alerts and warnings
- Follow instructions from management
- Move to designated shelter areas if required
- Remain in shelter until all-clear is given

4. PERSONAL PROTECTIVE EQUIPMENT (PPE)

4.1 GENERAL REQUIREMENTS
Appropriate PPE must be worn when required by job duties or workplace conditions. This may include:
- Safety glasses or goggles
- Hard hats
- Safety shoes
- Gloves
- Hearing protection
- Respiratory protection

4.2 PPE MAINTENANCE
- Inspect PPE before each use
- Replace damaged or worn equipment
- Clean and store PPE properly
- Report defective equipment immediately

5. HAZARD COMMUNICATION

5.1 CHEMICAL SAFETY
- Read and understand Safety Data Sheets (SDS)
- Follow proper handling procedures
- Use appropriate PPE when working with chemicals
- Store chemicals according to manufacturer instructions

5.2 LABELING REQUIREMENTS
All hazardous materials must be properly labeled with:
- Product identification
- Hazard warnings
- Precautionary statements
- Supplier information

6. INCIDENT REPORTING

6.1 REPORTING REQUIREMENTS
All incidents, including near misses, must be reported immediately to:
- Your immediate supervisor
- The Safety Department
- Human Resources (for injuries)

6.2 INVESTIGATION PROCESS
All incidents will be thoroughly investigated to:
- Determine root causes
- Implement corrective actions
- Prevent similar occurrences
- Comply with regulatory requirements

7. TRAINING REQUIREMENTS

7.1 NEW EMPLOYEE ORIENTATION
All new employees must complete safety orientation training before beginning work assignments.

7.2 ONGOING TRAINING
Regular safety training is provided on topics including:
- Job-specific safety procedures
- Emergency response
- Hazard recognition
- PPE use and maintenance

8. SAFETY COMMITTEE

Our Safety Committee meets monthly to:
- Review incident reports and trends
- Evaluate safety procedures
- Recommend improvements
- Promote safety awareness

Committee members represent all departments and levels of the organization.

═══════════════════════════════════════════════════════════════

SAFETY CONTACTS

Emergency: 911
Security: Extension 2911
Safety Department: Extension 2500
Human Resources: Extension 2100

═══════════════════════════════════════════════════════════════

Remember: Safety is everyone's responsibility!

Document Control:
- Document ID: SM-2024-001
- Last Review Date: November 15, 2023
- Next Review Date: November 15, 2024
- Document Owner: Safety Committee`
      }
    };

    return documentTemplates[document.name as keyof typeof documentTemplates] || {
      content: `Document: ${document.name}\n\nThis is a sample document content for ${document.name}.\n\nFile Type: ${document.type}\nFile Size: ${document.size}\n\nThis document contains important information relevant to your role and responsibilities within the organization. Please review carefully and contact HR if you have any questions.`
    };
  };

  // State for document modals
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [editDocumentName, setEditDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // PDF Viewer State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for PDF files
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setUploadProgress(0); // Reset progress on new file selection
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        setSelectedFile(null);
      }
    }
  };

  const handleAddDocument = async () => {
    if (!newDocumentName.trim() || !selectedFile) {
      toast({
        title: "Validation Error",
        description: "Please provide a document name and upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDocument(true);
    try {
      // Simulate saving the document
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newDoc = {
        id: hrDocuments.length + 1,
        name: newDocumentName,
        type: "PDF", // Assuming PDF for now
        size: `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`,
        visibleToAll: true, // Default visibility
      };

      setHrDocuments((prev) => [...prev, newDoc]);
      setShowAddDocumentModal(false);
      setNewDocumentName('');
      setSelectedFile(null);
      setUploadProgress(0);

      toast({
        title: "Document Added",
        description: `${newDocumentName} has been successfully added.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDocument(false);
    }
  };

  const handleEditDocumentModal = (document: any) => {
    setSelectedDocument(document);
    setEditDocumentName(document.name);
    setShowEditDocumentModal(true);
    setSelectedFile(null); // Reset selected file for editing
    setUploadProgress(0);
  };

  const handleDocumentDelete = (docId: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      setHrDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
      });
    }
  };

  const handleDocumentView = (document: any) => {
    setSelectedDocument(document);
    setDocumentModalType("view");
    setShowDocumentModal(true);
    // Simulate setting total pages for PDF viewer
    setTotalPages(Math.floor(Math.random() * 10) + 5); // Random pages between 5 and 14
    setCurrentPage(1);
    setZoomLevel(1);
  };

  const handlePdfNavigation = (direction: 'prev' | 'next') => {
    setCurrentPage(prev => {
      if (direction === 'next') {
        return Math.min(prev + 1, totalPages);
      } else {
        return Math.max(1, prev - 1);
      }
    });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  const parseDocumentContent = (document: any) => {
    const documentTemplates = {
      "Code of Conduct": {
        content: `COMPANY CODE OF CONDUCT

EFFECTIVE DATE: January 1, 2024
VERSION: 2.1
APPROVED BY: Board of Directors

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Introduction and Purpose ................................. 3
2. Professional Conduct Standards .......................... 4
3. Confidentiality and Information Security ............... 6
4. Conflict of Interest Policy ............................. 8
5. Compliance with Laws and Regulations .................... 10
6. Reporting Violations and Whistleblower Protection ...... 12
7. Disciplinary Actions and Consequences .................. 14
8. Acknowledgment and Certification ........................ 16

═══════════════════════════════════════════════════════════════

1. INTRODUCTION AND PURPOSE

This Code of Conduct establishes the ethical standards and behavioral expectations for all employees, contractors, and representatives of our organization. It serves as a guide for making ethical decisions and maintaining the highest standards of professional integrity.

Our commitment to ethical business practices is fundamental to our success and reputation. Every individual associated with our organization is expected to read, understand, and comply with this Code of Conduct.

2. PROFESSIONAL CONDUCT STANDARDS

2.1 RESPECT AND DIGNITY
All employees must treat colleagues, customers, suppliers, and stakeholders with respect and dignity. Discrimination, harassment, or intimidation of any kind will not be tolerated.

2.2 HONESTY AND INTEGRITY
Employees must conduct themselves with honesty and integrity in all business dealings. This includes accurate reporting, truthful communication, and ethical decision-making.

2.3 PROFESSIONAL COMPETENCE
Employees are expected to maintain and develop their professional skills and knowledge to perform their duties effectively and efficiently.

3. CONFIDENTIALITY AND INFORMATION SECURITY

3.1 CONFIDENTIAL INFORMATION
Employees must protect confidential and proprietary information belonging to the company, customers, and business partners. This obligation continues even after employment ends.

3.2 DATA PROTECTION
All personal and sensitive data must be handled in accordance with applicable privacy laws and company policies. Unauthorized access, use, or disclosure of such information is strictly prohibited.

4. CONFLICT OF INTEREST POLICY

4.1 IDENTIFICATION OF CONFLICTS
Employees must identify and disclose any actual or potential conflicts of interest that may affect their ability to perform their duties objectively.

4.2 OUTSIDE ACTIVITIES
Employees should avoid outside activities, investments, or relationships that could interfere with their job performance or create conflicts with company interests.

5. COMPLIANCE WITH LAWS AND REGULATIONS

All employees must comply with applicable laws, regulations, and company policies. Ignorance of the law is not an acceptable excuse for non-compliance.

6. REPORTING VIOLATIONS

Employees are encouraged to report suspected violations of this Code of Conduct through appropriate channels. The company prohibits retaliation against individuals who report violations in good faith.

7. DISCIPLINARY ACTIONS

Violations of this Code of Conduct may result in disciplinary action, up to and including termination of employment, depending on the severity of the violation.

8. ACKNOWLEDGMENT

By signing below, I acknowledge that I have read, understood, and agree to comply with this Code of Conduct.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

For questions or clarifications regarding this Code of Conduct, please contact the Human Resources Department.

Document Control:
- Document ID: COC-2024-001
- Last Review Date: December 15, 2023
- Next Review Date: December 15, 2024
- Document Owner: Human Resources Department`
      },
      "Employee Handbook": {
        content: `EMPLOYEE HANDBOOK

WELCOME TO OUR ORGANIZATION

EFFECTIVE DATE: January 1, 2024
VERSION: 3.2
APPROVED BY: Executive Leadership Team

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Welcome Message .......................................... 3
2. Company Overview ......................................... 4
3. Employment Policies ...................................... 6
4. Compensation and Benefits ................................ 12
5. Work Environment and Safety .............................. 18
6. Professional Development ................................. 22
7. Technology and Communication ............................. 25
8. Leave Policies ........................................... 28
9. Performance Management ................................... 32
10. Disciplinary Procedures ................................. 35
11. Employee Resources ...................................... 38

═══════════════════════════════════════════════════════════════

1. WELCOME MESSAGE

Dear Team Member,

Welcome to our organization! We are delighted to have you join our team and look forward to the contributions you will make to our continued success.

This Employee Handbook serves as your comprehensive guide to our company policies, procedures, benefits, and expectations. Please take the time to read through this handbook carefully and keep it as a reference throughout your employment.

Our success depends on the dedication, creativity, and teamwork of our employees. We are committed to providing a positive work environment that promotes professional growth, work-life balance, and mutual respect.

If you have any questions about the information contained in this handbook, please don't hesitate to contact the Human Resources Department.

Welcome aboard!

Sincerely,
The Executive Leadership Team

2. COMPANY OVERVIEW

2.1 OUR MISSION
To deliver exceptional products and services while maintaining the highest standards of integrity, innovation, and customer satisfaction.

2.2 OUR VALUES
- Integrity: We conduct business with honesty and transparency
- Excellence: We strive for the highest quality in everything we do
- Innovation: We embrace change and continuously improve
- Teamwork: We collaborate effectively to achieve common goals
- Respect: We value diversity and treat everyone with dignity

2.3 ORGANIZATIONAL STRUCTURE
Our organization is structured to promote efficiency, accountability, and clear communication. Each department plays a vital role in achieving our overall objectives.

3. EMPLOYMENT POLICIES

3.1 EQUAL EMPLOYMENT OPPORTUNITY
We are committed to providing equal employment opportunities to all qualified individuals regardless of race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status.

3.2 AT-WILL EMPLOYMENT
Employment with our organization is at-will, meaning that either the employee or the company may terminate the employment relationship at any time, with or without cause or notice.

3.3 BACKGROUND CHECKS
All employment offers are contingent upon successful completion of background checks as required by law and company policy.

4. COMPENSATION AND BENEFITS

4.1 PAY PERIODS
Employees are paid bi-weekly on Fridays. If a payday falls on a holiday, payment will be made on the preceding business day.

4.2 OVERTIME
Non-exempt employees will receive overtime pay at one and one-half times their regular rate for hours worked in excess of 40 hours per week.

4.3 BENEFITS OVERVIEW
We offer a comprehensive benefits package including:
- Health insurance
- Dental and vision coverage
- Retirement savings plan with company matching
- Paid time off
- Professional development opportunities

5. WORK ENVIRONMENT AND SAFETY

5.1 WORKPLACE SAFETY
The safety and well-being of our employees is our top priority. All employees are expected to follow safety procedures and report any unsafe conditions immediately.

5.2 DRUG-FREE WORKPLACE
We maintain a drug-free workplace. The use, possession, or distribution of illegal drugs or alcohol on company premises is strictly prohibited.

6. PROFESSIONAL DEVELOPMENT

We are committed to supporting the professional growth and development of our employees through training programs, educational assistance, and career advancement opportunities.

7. TECHNOLOGY AND COMMUNICATION

7.1 COMPUTER AND INTERNET USE
Company-provided technology resources are to be used primarily for business purposes. Personal use should be limited and must not interfere with work responsibilities.

7.2 CONFIDENTIALITY
Employees must protect confidential company information and respect the privacy of customer and employee data.

8. LEAVE POLICIES

8.1 PAID TIME OFF (PTO)
Full-time employees accrue PTO based on length of service. PTO requests should be submitted in advance and approved by supervisors.

8.2 FAMILY AND MEDICAL LEAVE
Eligible employees may take unpaid leave for qualifying family and medical reasons as provided by applicable law.

9. PERFORMANCE MANAGEMENT

Regular performance evaluations help ensure that employees understand expectations and receive feedback on their performance. These evaluations also identify opportunities for professional development.

10. DISCIPLINARY PROCEDURES

When performance or conduct issues arise, we follow a progressive discipline process designed to help employees improve while maintaining workplace standards.

11. EMPLOYEE RESOURCES

11.1 HUMAN RESOURCES DEPARTMENT
The HR Department is available to assist with questions about policies, benefits, and workplace concerns.

11.2 EMPLOYEE ASSISTANCE PROGRAM
Confidential counseling and support services are available to help employees deal with personal and work-related challenges.

═══════════════════════════════════════════════════════════════

ACKNOWLEDGMENT

I acknowledge that I have received and read this Employee Handbook. I understand that it is my responsibility to comply with the policies and procedures outlined herein.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

This handbook is subject to change. Updates will be communicated to all employees.

Document Control:
- Document ID: EH-2024-001
- Last Review Date: December 1, 2023
- Next Review Date: December 1, 2024
- Document Owner: Human Resources Department`
      },
      "Safety Manual": {
        content: `WORKPLACE SAFETY MANUAL

SAFETY FIRST - ALWAYS

EFFECTIVE DATE: January 1, 2024
VERSION: 2.3
APPROVED BY: Safety Committee

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Safety Policy Statement ................................... 3
2. General Safety Rules ..................................... 4
3. Emergency Procedures ..................................... 6
4. Personal Protective Equipment ............................ 8
5. Hazard Communication ..................................... 10
6. Incident Reporting ....................................... 12
7. Training Requirements .................................... 14
8. Safety Committee ......................................... 16

═══════════════════════════════════════════════════════════════

1. SAFETY POLICY STATEMENT

The safety and health of our employees is our highest priority. We are committed to providing a safe and healthy work environment for all employees, contractors, and visitors.

Every employee has the right to a safe workplace and the responsibility to work safely. Management is committed to providing the resources necessary to maintain a safe work environment and expects all employees to actively participate in our safety program.

2. GENERAL SAFETY RULES

2.1 BASIC SAFETY PRINCIPLES
- Follow all safety procedures and guidelines
- Report unsafe conditions immediately
- Use appropriate personal protective equipment
- Keep work areas clean and organized
- Never take shortcuts that compromise safety

2.2 PROHIBITED ACTIVITIES
- Horseplay or practical jokes
- Operating equipment without proper training
- Removing or disabling safety devices
- Working under the influence of drugs or alcohol

3. EMERGENCY PROCEDURES

3.1 FIRE EMERGENCY
- Activate the nearest fire alarm
- Evacuate immediately using designated routes
- Proceed to assembly areas
- Do not use elevators
- Do not re-enter the building until authorized

3.2 MEDICAL EMERGENCY
- Call 911 immediately for serious injuries
- Notify your supervisor and security
- Provide first aid only if trained to do so
- Do not move seriously injured persons

3.3 SEVERE WEATHER
- Monitor weather alerts and warnings
- Follow instructions from management
- Move to designated shelter areas if required
- Remain in shelter until all-clear is given

4. PERSONAL PROTECTIVE EQUIPMENT (PPE)

4.1 GENERAL REQUIREMENTS
Appropriate PPE must be worn when required by job duties or workplace conditions. This may include:
- Safety glasses or goggles
- Hard hats
- Safety shoes
- Gloves
- Hearing protection
- Respiratory protection

4.2 PPE MAINTENANCE
- Inspect PPE before each use
- Replace damaged or worn equipment
- Clean and store PPE properly
- Report defective equipment immediately

5. HAZARD COMMUNICATION

5.1 CHEMICAL SAFETY
- Read and understand Safety Data Sheets (SDS)
- Follow proper handling procedures
- Use appropriate PPE when working with chemicals
- Store chemicals according to manufacturer instructions

5.2 LABELING REQUIREMENTS
All hazardous materials must be properly labeled with:
- Product identification
- Hazard warnings
- Precautionary statements
- Supplier information

6. INCIDENT REPORTING

6.1 REPORTING REQUIREMENTS
All incidents, including near misses, must be reported immediately to:
- Your immediate supervisor
- The Safety Department
- Human Resources (for injuries)

6.2 INVESTIGATION PROCESS
All incidents will be thoroughly investigated to:
- Determine root causes
- Implement corrective actions
- Prevent similar occurrences
- Comply with regulatory requirements

7. TRAINING REQUIREMENTS

7.1 NEW EMPLOYEE ORIENTATION
All new employees must complete safety orientation training before beginning work assignments.

7.2 ONGOING TRAINING
Regular safety training is provided on topics including:
- Job-specific safety procedures
- Emergency response
- Hazard recognition
- PPE use and maintenance

8. SAFETY COMMITTEE

Our Safety Committee meets monthly to:
- Review incident reports and trends
- Evaluate safety procedures
- Recommend improvements
- Promote safety awareness

Committee members represent all departments and levels of the organization.

═══════════════════════════════════════════════════════════════

SAFETY CONTACTS

Emergency: 911
Security: Extension 2911
Safety Department: Extension 2500
Human Resources: Extension 2100

═══════════════════════════════════════════════════════════════

Remember: Safety is everyone's responsibility!

Document Control:
- Document ID: SM-2024-001
- Last Review Date: November 15, 2023
- Next Review Date: November 15, 2024
- Document Owner: Safety Committee`
      }
    };

    return documentTemplates[document.name as keyof typeof documentTemplates] || {
      content: `Document: ${document.name}\n\nThis is a sample document content for ${document.name}.\n\nFile Type: ${document.type}\nFile Size: ${document.size}\n\nThis document contains important information relevant to your role and responsibilities within the organization. Please review carefully and contact HR if you have any questions.`
    };
  };

  // State for document modals
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [editDocumentName, setEditDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // PDF Viewer State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for PDF files
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setUploadProgress(0); // Reset progress on new file selection
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        setSelectedFile(null);
      }
    }
  };

  const handleAddDocument = async () => {
    if (!newDocumentName.trim() || !selectedFile) {
      toast({
        title: "Validation Error",
        description: "Please provide a document name and upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDocument(true);
    try {
      // Simulate saving the document
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newDoc = {
        id: hrDocuments.length + 1,
        name: newDocumentName,
        type: "PDF", // Assuming PDF for now
        size: `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`,
        visibleToAll: true, // Default visibility
      };

      setHrDocuments((prev) => [...prev, newDoc]);
      setShowAddDocumentModal(false);
      setNewDocumentName('');
      setSelectedFile(null);
      setUploadProgress(0);

      toast({
        title: "Document Added",
        description: `${newDocumentName} has been successfully added.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDocument(false);
    }
  };

  const handleEditDocumentModal = (document: any) => {
    setSelectedDocument(document);
    setEditDocumentName(document.name);
    setShowEditDocumentModal(true);
    setSelectedFile(null); // Reset selected file for editing
    setUploadProgress(0);
  };

  const handleDocumentDelete = (docId: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      setHrDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
      });
    }
  };

  const handleDocumentView = (document: any) => {
    setSelectedDocument(document);
    setDocumentModalType("view");
    setShowDocumentModal(true);
    // Simulate setting total pages for PDF viewer
    setTotalPages(Math.floor(Math.random() * 10) + 5); // Random pages between 5 and 14
    setCurrentPage(1);
    setZoomLevel(1);
  };

  const handlePdfNavigation = (direction: 'prev' | 'next') => {
    setCurrentPage(prev => {
      if (direction === 'next') {
        return Math.min(prev + 1, totalPages);
      } else {
        return Math.max(1, prev - 1);
      }
    });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  const parseDocumentContent = (document: any) => {
    const documentTemplates = {
      "Code of Conduct": {
        content: `COMPANY CODE OF CONDUCT

EFFECTIVE DATE: January 1, 2024
VERSION: 2.1
APPROVED BY: Board of Directors

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Introduction and Purpose ................................. 3
2. Professional Conduct Standards .......................... 4
3. Confidentiality and Information Security ............... 6
4. Conflict of Interest Policy ............................. 8
5. Compliance with Laws and Regulations .................... 10
6. Reporting Violations and Whistleblower Protection ...... 12
7. Disciplinary Actions and Consequences .................. 14
8. Acknowledgment and Certification ........................ 16

═══════════════════════════════════════════════════════════════

1. INTRODUCTION AND PURPOSE

This Code of Conduct establishes the ethical standards and behavioral expectations for all employees, contractors, and representatives of our organization. It serves as a guide for making ethical decisions and maintaining the highest standards of professional integrity.

Our commitment to ethical business practices is fundamental to our success and reputation. Every individual associated with our organization is expected to read, understand, and comply with this Code of Conduct.

2. PROFESSIONAL CONDUCT STANDARDS

2.1 RESPECT AND DIGNITY
All employees must treat colleagues, customers, suppliers, and stakeholders with respect and dignity. Discrimination, harassment, or intimidation of any kind will not be tolerated.

2.2 HONESTY AND INTEGRITY
Employees must conduct themselves with honesty and integrity in all business dealings. This includes accurate reporting, truthful communication, and ethical decision-making.

2.3 PROFESSIONAL COMPETENCE
Employees are expected to maintain and develop their professional skills and knowledge to perform their duties effectively and efficiently.

3. CONFIDENTIALITY AND INFORMATION SECURITY

3.1 CONFIDENTIAL INFORMATION
Employees must protect confidential and proprietary information belonging to the company, customers, and business partners. This obligation continues even after employment ends.

3.2 DATA PROTECTION
All personal and sensitive data must be handled in accordance with applicable privacy laws and company policies. Unauthorized access, use, or disclosure of such information is strictly prohibited.

4. CONFLICT OF INTEREST POLICY

4.1 IDENTIFICATION OF CONFLICTS
Employees must identify and disclose any actual or potential conflicts of interest that may affect their ability to perform their duties objectively.

4.2 OUTSIDE ACTIVITIES
Employees should avoid outside activities, investments, or relationships that could interfere with their job performance or create conflicts with company interests.

5. COMPLIANCE WITH LAWS AND REGULATIONS

All employees must comply with applicable laws, regulations, and company policies. Ignorance of the law is not an acceptable excuse for non-compliance.

6. REPORTING VIOLATIONS

Employees are encouraged to report suspected violations of this Code of Conduct through appropriate channels. The company prohibits retaliation against individuals who report violations in good faith.

7. DISCIPLINARY ACTIONS

Violations of this Code of Conduct may result in disciplinary action, up to and including termination of employment, depending on the severity of the violation.

8. ACKNOWLEDGMENT

By signing below, I acknowledge that I have read, understood, and agree to comply with this Code of Conduct.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

For questions or clarifications regarding this Code of Conduct, please contact the Human Resources Department.

Document Control:
- Document ID: COC-2024-001
- Last Review Date: December 15, 2023
- Next Review Date: December 15, 2024
- Document Owner: Human Resources Department`
      },
      "Employee Handbook": {
        content: `EMPLOYEE HANDBOOK

WELCOME TO OUR ORGANIZATION

EFFECTIVE DATE: January 1, 2024
VERSION: 3.2
APPROVED BY: Executive Leadership Team

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Welcome Message .......................................... 3
2. Company Overview ......................................... 4
3. Employment Policies ...................................... 6
4. Compensation and Benefits ................................ 12
5. Work Environment and Safety .............................. 18
6. Professional Development ................................. 22
7. Technology and Communication ............................. 25
8. Leave Policies ........................................... 28
9. Performance Management ................................... 32
10. Disciplinary Procedures ................................. 35
11. Employee Resources ...................................... 38

═══════════════════════════════════════════════════════════════

1. WELCOME MESSAGE

Dear Team Member,

Welcome to our organization! We are delighted to have you join our team and look forward to the contributions you will make to our continued success.

This Employee Handbook serves as your comprehensive guide to our company policies, procedures, benefits, and expectations. Please take the time to read through this handbook carefully and keep it as a reference throughout your employment.

Our success depends on the dedication, creativity, and teamwork of our employees. We are committed to providing a positive work environment that promotes professional growth, work-life balance, and mutual respect.

If you have any questions about the information contained in this handbook, please don't hesitate to contact the Human Resources Department.

Welcome aboard!

Sincerely,
The Executive Leadership Team

2. COMPANY OVERVIEW

2.1 OUR MISSION
To deliver exceptional products and services while maintaining the highest standards of integrity, innovation, and customer satisfaction.

2.2 OUR VALUES
- Integrity: We conduct business with honesty and transparency
- Excellence: We strive for the highest quality in everything we do
- Innovation: We embrace change and continuously improve
- Teamwork: We collaborate effectively to achieve common goals
- Respect: We value diversity and treat everyone with dignity

2.3 ORGANIZATIONAL STRUCTURE
Our organization is structured to promote efficiency, accountability, and clear communication. Each department plays a vital role in achieving our overall objectives.

3. EMPLOYMENT POLICIES

3.1 EQUAL EMPLOYMENT OPPORTUNITY
We are committed to providing equal employment opportunities to all qualified individuals regardless of race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status.

3.2 AT-WILL EMPLOYMENT
Employment with our organization is at-will, meaning that either the employee or the company may terminate the employment relationship at any time, with or without cause or notice.

3.3 BACKGROUND CHECKS
All employment offers are contingent upon successful completion of background checks as required by law and company policy.

4. COMPENSATION AND BENEFITS

4.1 PAY PERIODS
Employees are paid bi-weekly on Fridays. If a payday falls on a holiday, payment will be made on the preceding business day.

4.2 OVERTIME
Non-exempt employees will receive overtime pay at one and one-half times their regular rate for hours worked in excess of 40 hours per week.

4.3 BENEFITS OVERVIEW
We offer a comprehensive benefits package including:
- Health insurance
- Dental and vision coverage
- Retirement savings plan with company matching
- Paid time off
- Professional development opportunities

5. WORK ENVIRONMENT AND SAFETY

5.1 WORKPLACE SAFETY
The safety and well-being of our employees is our top priority. All employees are expected to follow safety procedures and report any unsafe conditions immediately.

5.2 DRUG-FREE WORKPLACE
We maintain a drug-free workplace. The use, possession, or distribution of illegal drugs or alcohol on company premises is strictly prohibited.

6. PROFESSIONAL DEVELOPMENT

We are committed to supporting the professional growth and development of our employees through training programs, educational assistance, and career advancement opportunities.

7. TECHNOLOGY AND COMMUNICATION

7.1 COMPUTER AND INTERNET USE
Company-provided technology resources are to be used primarily for business purposes. Personal use should be limited and must not interfere with work responsibilities.

7.2 CONFIDENTIALITY
Employees must protect confidential company information and respect the privacy of customer and employee data.

8. LEAVE POLICIES

8.1 PAID TIME OFF (PTO)
Full-time employees accrue PTO based on length of service. PTO requests should be submitted in advance and approved by supervisors.

8.2 FAMILY AND MEDICAL LEAVE
Eligible employees may take unpaid leave for qualifying family and medical reasons as provided by applicable law.

9. PERFORMANCE MANAGEMENT

Regular performance evaluations help ensure that employees understand expectations and receive feedback on their performance. These evaluations also identify opportunities for professional development.

10. DISCIPLINARY PROCEDURES

When performance or conduct issues arise, we follow a progressive discipline process designed to help employees improve while maintaining workplace standards.

11. EMPLOYEE RESOURCES

11.1 HUMAN RESOURCES DEPARTMENT
The HR Department is available to assist with questions about policies, benefits, and workplace concerns.

11.2 EMPLOYEE ASSISTANCE PROGRAM
Confidential counseling and support services are available to help employees deal with personal and work-related challenges.

═══════════════════════════════════════════════════════════════

ACKNOWLEDGMENT

I acknowledge that I have received and read this Employee Handbook. I understand that it is my responsibility to comply with the policies and procedures outlined herein.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

This handbook is subject to change. Updates will be communicated to all employees.

Document Control:
- Document ID: EH-2024-001
- Last Review Date: December 1, 2023
- Next Review Date: December 1, 2024
- Document Owner: Human Resources Department`
      },
      "Safety Manual": {
        content: `WORKPLACE SAFETY MANUAL

SAFETY FIRST - ALWAYS

EFFECTIVE DATE: January 1, 2024
VERSION: 2.3
APPROVED BY: Safety Committee

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Safety Policy Statement ................................... 3
2. General Safety Rules ..................................... 4
3. Emergency Procedures ..................................... 6
4. Personal Protective Equipment ............................ 8
5. Hazard Communication ..................................... 10
6. Incident Reporting ....................................... 12
7. Training Requirements .................................... 14
8. Safety Committee ......................................... 16

═══════════════════════════════════════════════════════════════

1. SAFETY POLICY STATEMENT

The safety and health of our employees is our highest priority. We are committed to providing a safe and healthy work environment for all employees, contractors, and visitors.

Every employee has the right to a safe workplace and the responsibility to work safely. Management is committed to providing the resources necessary to maintain a safe work environment and expects all employees to actively participate in our safety program.

2. GENERAL SAFETY RULES

2.1 BASIC SAFETY PRINCIPLES
- Follow all safety procedures and guidelines
- Report unsafe conditions immediately
- Use appropriate personal protective equipment
- Keep work areas clean and organized
- Never take shortcuts that compromise safety

2.2 PROHIBITED ACTIVITIES
- Horseplay or practical jokes
- Operating equipment without proper training
- Removing or disabling safety devices
- Working under the influence of drugs or alcohol

3. EMERGENCY PROCEDURES

3.1 FIRE EMERGENCY
- Activate the nearest fire alarm
- Evacuate immediately using designated routes
- Proceed to assembly areas
- Do not use elevators
- Do not re-enter the building until authorized

3.2 MEDICAL EMERGENCY
- Call 911 immediately for serious injuries
- Notify your supervisor and security
- Provide first aid only if trained to do so
- Do not move seriously injured persons

3.3 SEVERE WEATHER
- Monitor weather alerts and warnings
- Follow instructions from management
- Move to designated shelter areas if required
- Remain in shelter until all-clear is given

4. PERSONAL PROTECTIVE EQUIPMENT (PPE)

4.1 GENERAL REQUIREMENTS
Appropriate PPE must be worn when required by job duties or workplace conditions. This may include:
- Safety glasses or goggles
- Hard hats
- Safety shoes
- Gloves
- Hearing protection
- Respiratory protection

4.2 PPE MAINTENANCE
- Inspect PPE before each use
- Replace damaged or worn equipment
- Clean and store PPE properly
- Report defective equipment immediately

5. HAZARD COMMUNICATION

5.1 CHEMICAL SAFETY
- Read and understand Safety Data Sheets (SDS)
- Follow proper handling procedures
- Use appropriate PPE when working with chemicals
- Store chemicals according to manufacturer instructions

5.2 LABELING REQUIREMENTS
All hazardous materials must be properly labeled with:
- Product identification
- Hazard warnings
- Precautionary statements
- Supplier information

6. INCIDENT REPORTING

6.1 REPORTING REQUIREMENTS
All incidents, including near misses, must be reported immediately to:
- Your immediate supervisor
- The Safety Department
- Human Resources (for injuries)

6.2 INVESTIGATION PROCESS
All incidents will be thoroughly investigated to:
- Determine root causes
- Implement corrective actions
- Prevent similar occurrences
- Comply with regulatory requirements

7. TRAINING REQUIREMENTS

7.1 NEW EMPLOYEE ORIENTATION
All new employees must complete safety orientation training before beginning work assignments.

7.2 ONGOING TRAINING
Regular safety training is provided on topics including:
- Job-specific safety procedures
- Emergency response
- Hazard recognition
- PPE use and maintenance

8. SAFETY COMMITTEE

Our Safety Committee meets monthly to:
- Review incident reports and trends
- Evaluate safety procedures
- Recommend improvements
- Promote safety awareness

Committee members represent all departments and levels of the organization.

═══════════════════════════════════════════════════════════════

SAFETY CONTACTS

Emergency: 911
Security: Extension 2911
Safety Department: Extension 2500
Human Resources: Extension 2100

═══════════════════════════════════════════════════════════════

Remember: Safety is everyone's responsibility!

Document Control:
- Document ID: SM-2024-001
- Last Review Date: November 15, 2023
- Next Review Date: November 15, 2024
- Document Owner: Safety Committee`
      }
    };

    return documentTemplates[document.name as keyof typeof documentTemplates] || {
      content: `Document: ${document.name}\n\nThis is a sample document content for ${document.name}.\n\nFile Type: ${document.type}\nFile Size: ${document.size}\n\nThis document contains important information relevant to your role and responsibilities within the organization. Please review carefully and contact HR if you have any questions.`
    };
  };

  // State for document modals
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [editDocumentName, setEditDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // PDF Viewer State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for PDF files
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setUploadProgress(0); // Reset progress on new file selection
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        setSelectedFile(null);
      }
    }
  };

  const handleAddDocument = async () => {
    if (!newDocumentName.trim() || !selectedFile) {
      toast({
        title: "Validation Error",
        description: "Please provide a document name and upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDocument(true);
    try {
      // Simulate saving the document
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newDoc = {
        id: hrDocuments.length + 1,
        name: newDocumentName,
        type: "PDF", // Assuming PDF for now
        size: `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`,
        visibleToAll: true, // Default visibility
      };

      setHrDocuments((prev) => [...prev, newDoc]);
      setShowAddDocumentModal(false);
      setNewDocumentName('');
      setSelectedFile(null);
      setUploadProgress(0);

      toast({
        title: "Document Added",
        description: `${newDocumentName} has been successfully added.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDocument(false);
    }
  };

  const handleEditDocumentModal = (document: any) => {
    setSelectedDocument(document);
    setEditDocumentName(document.name);
    setShowEditDocumentModal(true);
    setSelectedFile(null); // Reset selected file for editing
    setUploadProgress(0);
  };

  const handleDocumentDelete = (docId: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      setHrDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
      });
    }
  };

  const handleDocumentView = (document: any) => {
    setSelectedDocument(document);
    setDocumentModalType("view");
    setShowDocumentModal(true);
    // Simulate setting total pages for PDF viewer
    setTotalPages(Math.floor(Math.random() * 10) + 5); // Random pages between 5 and 14
    setCurrentPage(1);
    setZoomLevel(1);
  };

  const handlePdfNavigation = (direction: 'prev' | 'next') => {
    setCurrentPage(prev => {
      if (direction === 'next') {
        return Math.min(prev + 1, totalPages);
      } else {
        return Math.max(1, prev - 1);
      }
    });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  const parseDocumentContent = (document: any) => {
    const documentTemplates = {
      "Code of Conduct": {
        content: `COMPANY CODE OF CONDUCT

EFFECTIVE DATE: January 1, 2024
VERSION: 2.1
APPROVED BY: Board of Directors

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Introduction and Purpose ................................. 3
2. Professional Conduct Standards .......................... 4
3. Confidentiality and Information Security ............... 6
4. Conflict of Interest Policy ............................. 8
5. Compliance with Laws and Regulations .................... 10
6. Reporting Violations and Whistleblower Protection ...... 12
7. Disciplinary Actions and Consequences .................. 14
8. Acknowledgment and Certification ........................ 16

═══════════════════════════════════════════════════════════════

1. INTRODUCTION AND PURPOSE

This Code of Conduct establishes the ethical standards and behavioral expectations for all employees, contractors, and representatives of our organization. It serves as a guide for making ethical decisions and maintaining the highest standards of professional integrity.

Our commitment to ethical business practices is fundamental to our success and reputation. Every individual associated with our organization is expected to read, understand, and comply with this Code of Conduct.

2. PROFESSIONAL CONDUCT STANDARDS

2.1 RESPECT AND DIGNITY
All employees must treat colleagues, customers, suppliers, and stakeholders with respect and dignity. Discrimination, harassment, or intimidation of any kind will not be tolerated.

2.2 HONESTY AND INTEGRITY
Employees must conduct themselves with honesty and integrity in all business dealings. This includes accurate reporting, truthful communication, and ethical decision-making.

2.3 PROFESSIONAL COMPETENCE
Employees are expected to maintain and develop their professional skills and knowledge to perform their duties effectively and efficiently.

3. CONFIDENTIALITY AND INFORMATION SECURITY

3.1 CONFIDENTIAL INFORMATION
Employees must protect confidential and proprietary information belonging to the company, customers, and business partners. This obligation continues even after employment ends.

3.2 DATA PROTECTION
All personal and sensitive data must be handled in accordance with applicable privacy laws and company policies. Unauthorized access, use, or disclosure of such information is strictly prohibited.

4. CONFLICT OF INTEREST POLICY

4.1 IDENTIFICATION OF CONFLICTS
Employees must identify and disclose any actual or potential conflicts of interest that may affect their ability to perform their duties objectively.

4.2 OUTSIDE ACTIVITIES
Employees should avoid outside activities, investments, or relationships that could interfere with their job performance or create conflicts with company interests.

5. COMPLIANCE WITH LAWS AND REGULATIONS

All employees must comply with applicable laws, regulations, and company policies. Ignorance of the law is not an acceptable excuse for non-compliance.

6. REPORTING VIOLATIONS

Employees are encouraged to report suspected violations of this Code of Conduct through appropriate channels. The company prohibits retaliation against individuals who report violations in good faith.

7. DISCIPLINARY ACTIONS

Violations of this Code of Conduct may result in disciplinary action, up to and including termination of employment, depending on the severity of the violation.

8. ACKNOWLEDGMENT

By signing below, I acknowledge that I have read, understood, and agree to comply with this Code of Conduct.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

For questions or clarifications regarding this Code of Conduct, please contact the Human Resources Department.

Document Control:
- Document ID: COC-2024-001
- Last Review Date: December 15, 2023
- Next Review Date: December 15, 2024
- Document Owner: Human Resources Department`
      },
      "Employee Handbook": {
        content: `EMPLOYEE HANDBOOK

WELCOME TO OUR ORGANIZATION

EFFECTIVE DATE: January 1, 2024
VERSION: 3.2
APPROVED BY: Executive Leadership Team

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Welcome Message .......................................... 3
2. Company Overview ......................................... 4
3. Employment Policies ...................................... 6
4. Compensation and Benefits ................................ 12
5. Work Environment and Safety .............................. 18
6. Professional Development ................................. 22
7. Technology and Communication ............................. 25
8. Leave Policies ........................................... 28
9. Performance Management ................................... 32
10. Disciplinary Procedures ................................. 35
11. Employee Resources ...................................... 38

═══════════════════════════════════════════════════════════════

1. WELCOME MESSAGE

Dear Team Member,

Welcome to our organization! We are delighted to have you join our team and look forward to the contributions you will make to our continued success.

This Employee Handbook serves as your comprehensive guide to our company policies, procedures, benefits, and expectations. Please take the time to read through this handbook carefully and keep it as a reference throughout your employment.

Our success depends on the dedication, creativity, and teamwork of our employees. We are committed to providing a positive work environment that promotes professional growth, work-life balance, and mutual respect.

If you have any questions about the information contained in this handbook, please don't hesitate to contact the Human Resources Department.

Welcome aboard!

Sincerely,
The Executive Leadership Team

2. COMPANY OVERVIEW

2.1 OUR MISSION
To deliver exceptional products and services while maintaining the highest standards of integrity, innovation, and customer satisfaction.

2.2 OUR VALUES
- Integrity: We conduct business with honesty and transparency
- Excellence: We strive for the highest quality in everything we do
- Innovation: We embrace change and continuously improve
- Teamwork: We collaborate effectively to achieve common goals
- Respect: We value diversity and treat everyone with dignity

2.3 ORGANIZATIONAL STRUCTURE
Our organization is structured to promote efficiency, accountability, and clear communication. Each department plays a vital role in achieving our overall objectives.

3. EMPLOYMENT POLICIES

3.1 EQUAL EMPLOYMENT OPPORTUNITY
We are committed to providing equal employment opportunities to all qualified individuals regardless of race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status.

3.2 AT-WILL EMPLOYMENT
Employment with our organization is at-will, meaning that either the employee or the company may terminate the employment relationship at any time, with or without cause or notice.

3.3 BACKGROUND CHECKS
All employment offers are contingent upon successful completion of background checks as required by law and company policy.

4. COMPENSATION AND BENEFITS

4.1 PAY PERIODS
Employees are paid bi-weekly on Fridays. If a payday falls on a holiday, payment will be made on the preceding business day.

4.2 OVERTIME
Non-exempt employees will receive overtime pay at one and one-half times their regular rate for hours worked in excess of 40 hours per week.

4.3 BENEFITS OVERVIEW
We offer a comprehensive benefits package including:
- Health insurance
- Dental and vision coverage
- Retirement savings plan with company matching
- Paid time off
- Professional development opportunities

5. WORK ENVIRONMENT AND SAFETY

5.1 WORKPLACE SAFETY
The safety and well-being of our employees is our top priority. All employees are expected to follow safety procedures and report any unsafe conditions immediately.

5.2 DRUG-FREE WORKPLACE
We maintain a drug-free workplace. The use, possession, or distribution of illegal drugs or alcohol on company premises is strictly prohibited.

6. PROFESSIONAL DEVELOPMENT

We are committed to supporting the professional growth and development of our employees through training programs, educational assistance, and career advancement opportunities.

7. TECHNOLOGY AND COMMUNICATION

7.1 COMPUTER AND INTERNET USE
Company-provided technology resources are to be used primarily for business purposes. Personal use should be limited and must not interfere with work responsibilities.

7.2 CONFIDENTIALITY
Employees must protect confidential company information and respect the privacy of customer and employee data.

8. LEAVE POLICIES

8.1 PAID TIME OFF (PTO)
Full-time employees accrue PTO based on length of service. PTO requests should be submitted in advance and approved by supervisors.

8.2 FAMILY AND MEDICAL LEAVE
Eligible employees may take unpaid leave for qualifying family and medical reasons as provided by applicable law.

9. PERFORMANCE MANAGEMENT

Regular performance evaluations help ensure that employees understand expectations and receive feedback on their performance. These evaluations also identify opportunities for professional development.

10. DISCIPLINARY PROCEDURES

When performance or conduct issues arise, we follow a progressive discipline process designed to help employees improve while maintaining workplace standards.

11. EMPLOYEE RESOURCES

11.1 HUMAN RESOURCES DEPARTMENT
The HR Department is available to assist with questions about policies, benefits, and workplace concerns.

11.2 EMPLOYEE ASSISTANCE PROGRAM
Confidential counseling and support services are available to help employees deal with personal and work-related challenges.

═══════════════════════════════════════════════════════════════

ACKNOWLEDGMENT

I acknowledge that I have received and read this Employee Handbook. I understand that it is my responsibility to comply with the policies and procedures outlined herein.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

This handbook is subject to change. Updates will be communicated to all employees.

Document Control:
- Document ID: EH-2024-001
- Last Review Date: December 1, 2023
- Next Review Date: December 1, 2024
- Document Owner: Human Resources Department`
      },
      "Safety Manual": {
        content: `WORKPLACE SAFETY MANUAL

SAFETY FIRST - ALWAYS

EFFECTIVE DATE: January 1, 2024
VERSION: 2.3
APPROVED BY: Safety Committee

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Safety Policy Statement ................................... 3
2. General Safety Rules ..................................... 4
3. Emergency Procedures ..................................... 6
4. Personal Protective Equipment ............................ 8
5. Hazard Communication ..................................... 10
6. Incident Reporting ....................................... 12
7. Training Requirements .................................... 14
8. Safety Committee ......................................... 16

═══════════════════════════════════════════════════════════════

1. SAFETY POLICY STATEMENT

The safety and health of our employees is our highest priority. We are committed to providing a safe and healthy work environment for all employees, contractors, and visitors.

Every employee has the right to a safe workplace and the responsibility to work safely. Management is committed to providing the resources necessary to maintain a safe work environment and expects all employees to actively participate in our safety program.

2. GENERAL SAFETY RULES

2.1 BASIC SAFETY PRINCIPLES
- Follow all safety procedures and guidelines
- Report unsafe conditions immediately
- Use appropriate personal protective equipment
- Keep work areas clean and organized
- Never take shortcuts that compromise safety

2.2 PROHIBITED ACTIVITIES
- Horseplay or practical jokes
- Operating equipment without proper training
- Removing or disabling safety devices
- Working under the influence of drugs or alcohol

3. EMERGENCY PROCEDURES

3.1 FIRE EMERGENCY
- Activate the nearest fire alarm
- Evacuate immediately using designated routes
- Proceed to assembly areas
- Do not use elevators
- Do not re-enter the building until authorized

3.2 MEDICAL EMERGENCY
- Call 911 immediately for serious injuries
- Notify your supervisor and security
- Provide first aid only if trained to do so
- Do not move seriously injured persons

3.3 SEVERE WEATHER
- Monitor weather alerts and warnings
- Follow instructions from management
- Move to designated shelter areas if required
- Remain in shelter until all-clear is given

4. PERSONAL PROTECTIVE EQUIPMENT (PPE)

4.1 GENERAL REQUIREMENTS
Appropriate PPE must be worn when required by job duties or workplace conditions. This may include:
- Safety glasses or goggles
- Hard hats
- Safety shoes
- Gloves
- Hearing protection
- Respiratory protection

4.2 PPE MAINTENANCE
- Inspect PPE before each use
- Replace damaged or worn equipment
- Clean and store PPE properly
- Report defective equipment immediately

5. HAZARD COMMUNICATION

5.1 CHEMICAL SAFETY
- Read and understand Safety Data Sheets (SDS)
- Follow proper handling procedures
- Use appropriate PPE when working with chemicals
- Store chemicals according to manufacturer instructions

5.2 LABELING REQUIREMENTS
All hazardous materials must be properly labeled with:
- Product identification
- Hazard warnings
- Precautionary statements
- Supplier information

6. INCIDENT REPORTING

6.1 REPORTING REQUIREMENTS
All incidents, including near misses, must be reported immediately to:
- Your immediate supervisor
- The Safety Department
- Human Resources (for injuries)

6.2 INVESTIGATION PROCESS
All incidents will be thoroughly investigated to:
- Determine root causes
- Implement corrective actions
- Prevent similar occurrences
- Comply with regulatory requirements

7. TRAINING REQUIREMENTS

7.1 NEW EMPLOYEE ORIENTATION
All new employees must complete safety orientation training before beginning work assignments.

7.2 ONGOING TRAINING
Regular safety training is provided on topics including:
- Job-specific safety procedures
- Emergency response
- Hazard recognition
- PPE use and maintenance

8. SAFETY COMMITTEE

Our Safety Committee meets monthly to:
- Review incident reports and trends
- Evaluate safety procedures
- Recommend improvements
- Promote safety awareness

Committee members represent all departments and levels of the organization.

═══════════════════════════════════════════════════════════════

SAFETY CONTACTS

Emergency: 911
Security: Extension 2911
Safety Department: Extension 2500
Human Resources: Extension 2100

═══════════════════════════════════════════════════════════════

Remember: Safety is everyone's responsibility!

Document Control:
- Document ID: SM-2024-001
- Last Review Date: November 15, 2023
- Next Review Date: November 15, 2024
- Document Owner: Safety Committee`
      }
    };

    return documentTemplates[document.name as keyof typeof documentTemplates] || {
      content: `Document: ${document.name}\n\nThis is a sample document content for ${document.name}.\n\nFile Type: ${document.type}\nFile Size: ${document.size}\n\nThis document contains important information relevant to your role and responsibilities within the organization. Please review carefully and contact HR if you have any questions.`
    };
  };

  // State for document modals
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [editDocumentName, setEditDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // PDF Viewer State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for PDF files
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setUploadProgress(0); // Reset progress on new file selection
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        setSelectedFile(null);
      }
    }
  };

  const handleAddDocument = async () => {
    if (!newDocumentName.trim() || !selectedFile) {
      toast({
        title: "Validation Error",
        description: "Please provide a document name and upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDocument(true);
    try {
      // Simulate saving the document
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newDoc = {
        id: hrDocuments.length + 1,
        name: newDocumentName,
        type: "PDF", // Assuming PDF for now
        size: `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`,
        visibleToAll: true, // Default visibility
      };

      setHrDocuments((prev) => [...prev, newDoc]);
      setShowAddDocumentModal(false);
      setNewDocumentName('');
      setSelectedFile(null);
      setUploadProgress(0);

      toast({
        title: "Document Added",
        description: `${newDocumentName} has been successfully added.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDocument(false);
    }
  };

  const handleEditDocumentModal = (document: any) => {
    setSelectedDocument(document);
    setEditDocumentName(document.name);
    setShowEditDocumentModal(true);
    setSelectedFile(null); // Reset selected file for editing
    setUploadProgress(0);
  };

  const handleDocumentDelete = (docId: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      setHrDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
      });
    }
  };

  const handleDocumentView = (document: any) => {
    setSelectedDocument(document);
    setDocumentModalType("view");
    setShowDocumentModal(true);
    // Simulate setting total pages for PDF viewer
    setTotalPages(Math.floor(Math.random() * 10) + 5); // Random pages between 5 and 14
    setCurrentPage(1);
    setZoomLevel(1);
  };

  const handlePdfNavigation = (direction: 'prev' | 'next') => {
    setCurrentPage(prev => {
      if (direction === 'next') {
        return Math.min(prev + 1, totalPages);
      } else {
        return Math.max(1, prev - 1);
      }
    });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  const parseDocumentContent = (document: any) => {
    const documentTemplates = {
      "Code of Conduct": {
        content: `COMPANY CODE OF CONDUCT

EFFECTIVE DATE: January 1, 2024
VERSION: 2.1
APPROVED BY: Board of Directors

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Introduction and Purpose ................................. 3
2. Professional Conduct Standards .......................... 4
3. Confidentiality and Information Security ............... 6
4. Conflict of Interest Policy ............................. 8
5. Compliance with Laws and Regulations .................... 10
6. Reporting Violations and Whistleblower Protection ...... 12
7. Disciplinary Actions and Consequences .................. 14
8. Acknowledgment and Certification ........................ 16

═══════════════════════════════════════════════════════════════

1. INTRODUCTION AND PURPOSE

This Code of Conduct establishes the ethical standards and behavioral expectations for all employees, contractors, and representatives of our organization. It serves as a guide for making ethical decisions and maintaining the highest standards of professional integrity.

Our commitment to ethical business practices is fundamental to our success and reputation. Every individual associated with our organization is expected to read, understand, and comply with this Code of Conduct.

2. PROFESSIONAL CONDUCT STANDARDS

2.1 RESPECT AND DIGNITY
All employees must treat colleagues, customers, suppliers, and stakeholders with respect and dignity. Discrimination, harassment, or intimidation of any kind will not be tolerated.

2.2 HONESTY AND INTEGRITY
Employees must conduct themselves with honesty and integrity in all business dealings. This includes accurate reporting, truthful communication, and ethical decision-making.

2.3 PROFESSIONAL COMPETENCE
Employees are expected to maintain and develop their professional skills and knowledge to perform their duties effectively and efficiently.

3. CONFIDENTIALITY AND INFORMATION SECURITY

3.1 CONFIDENTIAL INFORMATION
Employees must protect confidential and proprietary information belonging to the company, customers, and business partners. This obligation continues even after employment ends.

3.2 DATA PROTECTION
All personal and sensitive data must be handled in accordance with applicable privacy laws and company policies. Unauthorized access, use, or disclosure of such information is strictly prohibited.

4. CONFLICT OF INTEREST POLICY

4.1 IDENTIFICATION OF CONFLICTS
Employees must identify and disclose any actual or potential conflicts of interest that may affect their ability to perform their duties objectively.

4.2 OUTSIDE ACTIVITIES
Employees should avoid outside activities, investments, or relationships that could interfere with their job performance or create conflicts with company interests.

5. COMPLIANCE WITH LAWS AND REGULATIONS

All employees must comply with applicable laws, regulations, and company policies. Ignorance of the law is not an acceptable excuse for non-compliance.

6. REPORTING VIOLATIONS

Employees are encouraged to report suspected violations of this Code of Conduct through appropriate channels. The company prohibits retaliation against individuals who report violations in good faith.

7. DISCIPLINARY ACTIONS

Violations of this Code of Conduct may result in disciplinary action, up to and including termination of employment, depending on the severity of the violation.

8. ACKNOWLEDGMENT

By signing below, I acknowledge that I have read, understood, and agree to comply with this Code of Conduct.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

For questions or clarifications regarding this Code of Conduct, please contact the Human Resources Department.

Document Control:
- Document ID: COC-2024-001
- Last Review Date: December 15, 2023
- Next Review Date: December 15, 2024
- Document Owner: Human Resources Department`
      },
      "Employee Handbook": {
        content: `EMPLOYEE HANDBOOK

WELCOME TO OUR ORGANIZATION

EFFECTIVE DATE: January 1, 2024
VERSION: 3.2
APPROVED BY: Executive Leadership Team

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Welcome Message .......................................... 3
2. Company Overview ......................................... 4
3. Employment Policies ...................................... 6
4. Compensation and Benefits ................................ 12
5. Work Environment and Safety .............................. 18
6. Professional Development ................................. 22
7. Technology and Communication ............................. 25
8. Leave Policies ........................................... 28
9. Performance Management ................................... 32
10. Disciplinary Procedures ................................. 35
11. Employee Resources ...................................... 38

═══════════════════════════════════════════════════════════════

1. WELCOME MESSAGE

Dear Team Member,

Welcome to our organization! We are delighted to have you join our team and look forward to the contributions you will make to our continued success.

This Employee Handbook serves as your comprehensive guide to our company policies, procedures, benefits, and expectations. Please take the time to read through this handbook carefully and keep it as a reference throughout your employment.

Our success depends on the dedication, creativity, and teamwork of our employees. We are committed to providing a positive work environment that promotes professional growth, work-life balance, and mutual respect.

If you have any questions about the information contained in this handbook, please don't hesitate to contact the Human Resources Department.

Welcome aboard!

Sincerely,
The Executive Leadership Team

2. COMPANY OVERVIEW

2.1 OUR MISSION
To deliver exceptional products and services while maintaining the highest standards of integrity, innovation, and customer satisfaction.

2.2 OUR VALUES
- Integrity: We conduct business with honesty and transparency
- Excellence: We strive for the highest quality in everything we do
- Innovation: We embrace change and continuously improve
- Teamwork: We collaborate effectively to achieve common goals
- Respect: We value diversity and treat everyone with dignity

2.3 ORGANIZATIONAL STRUCTURE
Our organization is structured to promote efficiency, accountability, and clear communication. Each department plays a vital role in achieving our overall objectives.

3. EMPLOYMENT POLICIES

3.1 EQUAL EMPLOYMENT OPPORTUNITY
We are committed to providing equal employment opportunities to all qualified individuals regardless of race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status.

3.2 AT-WILL EMPLOYMENT
Employment with our organization is at-will, meaning that either the employee or the company may terminate the employment relationship at any time, with or without cause or notice.

3.3 BACKGROUND CHECKS
All employment offers are contingent upon successful completion of background checks as required by law and company policy.

4. COMPENSATION AND BENEFITS

4.1 PAY PERIODS
Employees are paid bi-weekly on Fridays. If a payday falls on a holiday, payment will be made on the preceding business day.

4.2 OVERTIME
Non-exempt employees will receive overtime pay at one and one-half times their regular rate for hours worked in excess of 40 hours per week.

4.3 BENEFITS OVERVIEW
We offer a comprehensive benefits package including:
- Health insurance
- Dental and vision coverage
- Retirement savings plan with company matching
- Paid time off
- Professional development opportunities

5. WORK ENVIRONMENT AND SAFETY

5.1 WORKPLACE SAFETY
The safety and well-being of our employees is our top priority. All employees are expected to follow safety procedures and report any unsafe conditions immediately.

5.2 DRUG-FREE WORKPLACE
We maintain a drug-free workplace. The use, possession, or distribution of illegal drugs or alcohol on company premises is strictly prohibited.

6. PROFESSIONAL DEVELOPMENT

We are committed to supporting the professional growth and development of our employees through training programs, educational assistance, and career advancement opportunities.

7. TECHNOLOGY AND COMMUNICATION

7.1 COMPUTER AND INTERNET USE
Company-provided technology resources are to be used primarily for business purposes. Personal use should be limited and must not interfere with work responsibilities.

7.2 CONFIDENTIALITY
Employees must protect confidential company information and respect the privacy of customer and employee data.

8. LEAVE POLICIES

8.1 PAID TIME OFF (PTO)
Full-time employees accrue PTO based on length of service. PTO requests should be submitted in advance and approved by supervisors.

8.2 FAMILY AND MEDICAL LEAVE
Eligible employees may take unpaid leave for qualifying family and medical reasons as provided by applicable law.

9. PERFORMANCE MANAGEMENT

Regular performance evaluations help ensure that employees understand expectations and receive feedback on their performance. These evaluations also identify opportunities for professional development.

10. DISCIPLINARY PROCEDURES

When performance or conduct issues arise, we follow a progressive discipline process designed to help employees improve while maintaining workplace standards.

11. EMPLOYEE RESOURCES

11.1 HUMAN RESOURCES DEPARTMENT
The HR Department is available to assist with questions about policies, benefits, and workplace concerns.

11.2 EMPLOYEE ASSISTANCE PROGRAM
Confidential counseling and support services are available to help employees deal with personal and work-related challenges.

═══════════════════════════════════════════════════════════════

ACKNOWLEDGMENT

I acknowledge that I have received and read this Employee Handbook. I understand that it is my responsibility to comply with the policies and procedures outlined herein.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

This handbook is subject to change. Updates will be communicated to all employees.

Document Control:
- Document ID: EH-2024-001
- Last Review Date: December 1, 2023
- Next Review Date: December 1, 2024
- Document Owner: Human Resources Department`
      },
      "Safety Manual": {
        content: `WORKPLACE SAFETY MANUAL

SAFETY FIRST - ALWAYS

EFFECTIVE DATE: January 1, 2024
VERSION: 2.3
APPROVED BY: Safety Committee

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Safety Policy Statement ................................... 3
2. General Safety Rules ..................................... 4
3. Emergency Procedures ..................................... 6
4. Personal Protective Equipment ............................ 8
5. Hazard Communication ..................................... 10
6. Incident Reporting ....................................... 12
7. Training Requirements .................................... 14
8. Safety Committee ......................................... 16

═══════════════════════════════════════════════════════════════

1. SAFETY POLICY STATEMENT

The safety and health of our employees is our highest priority. We are committed to providing a safe and healthy work environment for all employees, contractors, and visitors.

Every employee has the right to a safe workplace and the responsibility to work safely. Management is committed to providing the resources necessary to maintain a safe work environment and expects all employees to actively participate in our safety program.

2. GENERAL SAFETY RULES

2.1 BASIC SAFETY PRINCIPLES
- Follow all safety procedures and guidelines
- Report unsafe conditions immediately
- Use appropriate personal protective equipment
- Keep work areas clean and organized
- Never take shortcuts that compromise safety

2.2 PROHIBITED ACTIVITIES
- Horseplay or practical jokes
- Operating equipment without proper training
- Removing or disabling safety devices
- Working under the influence of drugs or alcohol

3. EMERGENCY PROCEDURES

3.1 FIRE EMERGENCY
- Activate the nearest fire alarm
- Evacuate immediately using designated routes
- Proceed to assembly areas
- Do not use elevators
- Do not re-enter the building until authorized

3.2 MEDICAL EMERGENCY
- Call 911 immediately for serious injuries
- Notify your supervisor and security
- Provide first aid only if trained to do so
- Do not move seriously injured persons

3.3 SEVERE WEATHER
- Monitor weather alerts and warnings
- Follow instructions from management
- Move to designated shelter areas if required
- Remain in shelter until all-clear is given

4. PERSONAL PROTECTIVE EQUIPMENT (PPE)

4.1 GENERAL REQUIREMENTS
Appropriate PPE must be worn when required by job duties or workplace conditions. This may include:
- Safety glasses or goggles
- Hard hats
- Safety shoes
- Gloves
- Hearing protection
- Respiratory protection

4.2 PPE MAINTENANCE
- Inspect PPE before each use
- Replace damaged or worn equipment
- Clean and store PPE properly
- Report defective equipment immediately

5. HAZARD COMMUNICATION

5.1 CHEMICAL SAFETY
- Read and understand Safety Data Sheets (SDS)
- Follow proper handling procedures
- Use appropriate PPE when working with chemicals
- Store chemicals according to manufacturer instructions

5.2 LABELING REQUIREMENTS
All hazardous materials must be properly labeled with:
- Product identification
- Hazard warnings
- Precautionary statements
- Supplier information

6. INCIDENT REPORTING

6.1 REPORTING REQUIREMENTS
All incidents, including near misses, must be reported immediately to:
- Your immediate supervisor
- The Safety Department
- Human Resources (for injuries)

6.2 INVESTIGATION PROCESS
All incidents will be thoroughly investigated to:
- Determine root causes
- Implement corrective actions
- Prevent similar occurrences
- Comply with regulatory requirements

7. TRAINING REQUIREMENTS

7.1 NEW EMPLOYEE ORIENTATION
All new employees must complete safety orientation training before beginning work assignments.

7.2 ONGOING TRAINING
Regular safety training is provided on topics including:
- Job-specific safety procedures
- Emergency response
- Hazard recognition
- PPE use and maintenance

8. SAFETY COMMITTEE

Our Safety Committee meets monthly to:
- Review incident reports and trends
- Evaluate safety procedures
- Recommend improvements
- Promote safety awareness

Committee members represent all departments and levels of the organization.

═══════════════════════════════════════════════════════════════

SAFETY CONTACTS

Emergency: 911
Security: Extension 2911
Safety Department: Extension 2500
Human Resources: Extension 2100

═══════════════════════════════════════════════════════════════

Remember: Safety is everyone's responsibility!

Document Control:
- Document ID: SM-2024-001
- Last Review Date: November 15, 2023
- Next Review Date: November 15, 2024
- Document Owner: Safety Committee`
      }
    };

    return documentTemplates[document.name as keyof typeof documentTemplates] || {
      content: `Document: ${document.name}\n\nThis is a sample document content for ${document.name}.\n\nFile Type: ${document.type}\nFile Size: ${document.size}\n\nThis document contains important information relevant to your role and responsibilities within the organization. Please review carefully and contact HR if you have any questions.`
    };
  };

  // State for document modals
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [editDocumentName, setEditDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // PDF Viewer State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for PDF files
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setUploadProgress(0); // Reset progress on new file selection
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        setSelectedFile(null);
      }
    }
  };

  const handleAddDocument = async () => {
    if (!newDocumentName.trim() || !selectedFile) {
      toast({
        title: "Validation Error",
        description: "Please provide a document name and upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDocument(true);
    try {
      // Simulate saving the document
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newDoc = {
        id: hrDocuments.length + 1,
        name: newDocumentName,
        type: "PDF", // Assuming PDF for now
        size: `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`,
        visibleToAll: true, // Default visibility
      };

      setHrDocuments((prev) => [...prev, newDoc]);
      setShowAddDocumentModal(false);
      setNewDocumentName('');
      setSelectedFile(null);
      setUploadProgress(0);

      toast({
        title: "Document Added",
        description: `${newDocumentName} has been successfully added.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDocument(false);
    }
  };

  const handleEditDocumentModal = (document: any) => {
    setSelectedDocument(document);
    setEditDocumentName(document.name);
    setShowEditDocumentModal(true);
    setSelectedFile(null); // Reset selected file for editing
    setUploadProgress(0);
  };

  const handleDocumentDelete = (docId: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      setHrDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
      });
    }
  };

  const handleDocumentView = (document: any) => {
    setSelectedDocument(document);
    setDocumentModalType("view");
    setShowDocumentModal(true);
    // Simulate setting total pages for PDF viewer
    setTotalPages(Math.floor(Math.random() * 10) + 5); // Random pages between 5 and 14
    setCurrentPage(1);
    setZoomLevel(1);
  };

  const handlePdfNavigation = (direction: 'prev' | 'next') => {
    setCurrentPage(prev => {
      if (direction === 'next') {
        return Math.min(prev + 1, totalPages);
      } else {
        return Math.max(1, prev - 1);
      }
    });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  const parseDocumentContent = (document: any) => {
    const documentTemplates = {
      "Code of Conduct": {
        content: `COMPANY CODE OF CONDUCT

EFFECTIVE DATE: January 1, 2024
VERSION: 2.1
APPROVED BY: Board of Directors

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Introduction and Purpose ................................. 3
2. Professional Conduct Standards .......................... 4
3. Confidentiality and Information Security ............... 6
4. Conflict of Interest Policy ............................. 8
5. Compliance with Laws and Regulations .................... 10
6. Reporting Violations and Whistleblower Protection ...... 12
7. Disciplinary Actions and Consequences .................. 14
8. Acknowledgment and Certification ........................ 16

═══════════════════════════════════════════════════════════════

1. INTRODUCTION AND PURPOSE

This Code of Conduct establishes the ethical standards and behavioral expectations for all employees, contractors, and representatives of our organization. It serves as a guide for making ethical decisions and maintaining the highest standards of professional integrity.

Our commitment to ethical business practices is fundamental to our success and reputation. Every individual associated with our organization is expected to read, understand, and comply with this Code of Conduct.

2. PROFESSIONAL CONDUCT STANDARDS

2.1 RESPECT AND DIGNITY
All employees must treat colleagues, customers, suppliers, and stakeholders with respect and dignity. Discrimination, harassment, or intimidation of any kind will not be tolerated.

2.2 HONESTY AND INTEGRITY
Employees must conduct themselves with honesty and integrity in all business dealings. This includes accurate reporting, truthful communication, and ethical decision-making.

2.3 PROFESSIONAL COMPETENCE
Employees are expected to maintain and develop their professional skills and knowledge to perform their duties effectively and efficiently.

3. CONFIDENTIALITY AND INFORMATION SECURITY

3.1 CONFIDENTIAL INFORMATION
Employees must protect confidential and proprietary information belonging to the company, customers, and business partners. This obligation continues even after employment ends.

3.2 DATA PROTECTION
All personal and sensitive data must be handled in accordance with applicable privacy laws and company policies. Unauthorized access, use, or disclosure of such information is strictly prohibited.

4. CONFLICT OF INTEREST POLICY

4.1 IDENTIFICATION OF CONFLICTS
Employees must identify and disclose any actual or potential conflicts of interest that may affect their ability to perform their duties objectively.

4.2 OUTSIDE ACTIVITIES
Employees should avoid outside activities, investments, or relationships that could interfere with their job performance or create conflicts with company interests.

5. COMPLIANCE WITH LAWS AND REGULATIONS

All employees must comply with applicable laws, regulations, and company policies. Ignorance of the law is not an acceptable excuse for non-compliance.

6. REPORTING VIOLATIONS

Employees are encouraged to report suspected violations of this Code of Conduct through appropriate channels. The company prohibits retaliation against individuals who report violations in good faith.

7. DISCIPLINARY ACTIONS

Violations of this Code of Conduct may result in disciplinary action, up to and including termination of employment, depending on the severity of the violation.

8. ACKNOWLEDGMENT

By signing below, I acknowledge that I have read, understood, and agree to comply with this Code of Conduct.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

For questions or clarifications regarding this Code of Conduct, please contact the Human Resources Department.

Document Control:
- Document ID: COC-2024-001
- Last Review Date: December 15, 2023
- Next Review Date: December 15, 2024
- Document Owner: Human Resources Department`
      },
      "Employee Handbook": {
        content: `EMPLOYEE HANDBOOK

WELCOME TO OUR ORGANIZATION

EFFECTIVE DATE: January 1, 2024
VERSION: 3.2
APPROVED BY: Executive Leadership Team

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Welcome Message .......................................... 3
2. Company Overview ......................................... 4
3. Employment Policies ...................................... 6
4. Compensation and Benefits ................................ 12
5. Work Environment and Safety .............................. 18
6. Professional Development ................................. 22
7. Technology and Communication ............................. 25
8. Leave Policies ........................................... 28
9. Performance Management ................................... 32
10. Disciplinary Procedures ................................. 35
11. Employee Resources ...................................... 38

═══════════════════════════════════════════════════════════════

1. WELCOME MESSAGE

Dear Team Member,

Welcome to our organization! We are delighted to have you join our team and look forward to the contributions you will make to our continued success.

This Employee Handbook serves as your comprehensive guide to our company policies, procedures, benefits, and expectations. Please take the time to read through this handbook carefully and keep it as a reference throughout your employment.

Our success depends on the dedication, creativity, and teamwork of our employees. We are committed to providing a positive work environment that promotes professional growth, work-life balance, and mutual respect.

If you have any questions about the information contained in this handbook, please don't hesitate to contact the Human Resources Department.

Welcome aboard!

Sincerely,
The Executive Leadership Team

2. COMPANY OVERVIEW

2.1 OUR MISSION
To deliver exceptional products and services while maintaining the highest standards of integrity, innovation, and customer satisfaction.

2.2 OUR VALUES
- Integrity: We conduct business with honesty and transparency
- Excellence: We strive for the highest quality in everything we do
- Innovation: We embrace change and continuously improve
- Teamwork: We collaborate effectively to achieve common goals
- Respect: We value diversity and treat everyone with dignity

2.3 ORGANIZATIONAL STRUCTURE
Our organization is structured to promote efficiency, accountability, and clear communication. Each department plays a vital role in achieving our overall objectives.

3. EMPLOYMENT POLICIES

3.1 EQUAL EMPLOYMENT OPPORTUNITY
We are committed to providing equal employment opportunities to all qualified individuals regardless of race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status.

3.2 AT-WILL EMPLOYMENT
Employment with our organization is at-will, meaning that either the employee or the company may terminate the employment relationship at any time, with or without cause or notice.

3.3 BACKGROUND CHECKS
All employment offers are contingent upon successful completion of background checks as required by law and company policy.

4. COMPENSATION AND BENEFITS

4.1 PAY PERIODS
Employees are paid bi-weekly on Fridays. If a payday falls on a holiday, payment will be made on the preceding business day.

4.2 OVERTIME
Non-exempt employees will receive overtime pay at one and one-half times their regular rate for hours worked in excess of 40 hours per week.

4.3 BENEFITS OVERVIEW
We offer a comprehensive benefits package including:
- Health insurance
- Dental and vision coverage
- Retirement savings plan with company matching
- Paid time off
- Professional development opportunities

5. WORK ENVIRONMENT AND SAFETY

5.1 WORKPLACE SAFETY
The safety and well-being of our employees is our top priority. All employees are expected to follow safety procedures and report any unsafe conditions immediately.

5.2 DRUG-FREE WORKPLACE
We maintain a drug-free workplace. The use, possession, or distribution of illegal drugs or alcohol on company premises is strictly prohibited.

6. PROFESSIONAL DEVELOPMENT

We are committed to supporting the professional growth and development of our employees through training programs, educational assistance, and career advancement opportunities.

7. TECHNOLOGY AND COMMUNICATION

7.1 COMPUTER AND INTERNET USE
Company-provided technology resources are to be used primarily for business purposes. Personal use should be limited and must not interfere with work responsibilities.

7.2 CONFIDENTIALITY
Employees must protect confidential company information and respect the privacy of customer and employee data.

8. LEAVE POLICIES

8.1 PAID TIME OFF (PTO)
Full-time employees accrue PTO based on length of service. PTO requests should be submitted in advance and approved by supervisors.

8.2 FAMILY AND MEDICAL LEAVE
Eligible employees may take unpaid leave for qualifying family and medical reasons as provided by applicable law.

9. PERFORMANCE MANAGEMENT

Regular performance evaluations help ensure that employees understand expectations and receive feedback on their performance. These evaluations also identify opportunities for professional development.

10. DISCIPLINARY PROCEDURES

When performance or conduct issues arise, we follow a progressive discipline process designed to help employees improve while maintaining workplace standards.

11. EMPLOYEE RESOURCES

11.1 HUMAN RESOURCES DEPARTMENT
The HR Department is available to assist with questions about policies, benefits, and workplace concerns.

11.2 EMPLOYEE ASSISTANCE PROGRAM
Confidential counseling and support services are available to help employees deal with personal and work-related challenges.

═══════════════════════════════════════════════════════════════

ACKNOWLEDGMENT

I acknowledge that I have received and read this Employee Handbook. I understand that it is my responsibility to comply with the policies and procedures outlined herein.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

This handbook is subject to change. Updates will be communicated to all employees.

Document Control:
- Document ID: EH-2024-001
- Last Review Date: December 1, 2023
- Next Review Date: December 1, 2024
- Document Owner: Human Resources Department`
      },
      "Safety Manual": {
        content: `WORKPLACE SAFETY MANUAL

SAFETY FIRST - ALWAYS

EFFECTIVE DATE: January 1, 2024
VERSION: 2.3
APPROVED BY: Safety Committee

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Safety Policy Statement ................................... 3
2. General Safety Rules ..................................... 4
3. Emergency Procedures ..................................... 6
4. Personal Protective Equipment ............................ 8
5. Hazard Communication ..................................... 10
6. Incident Reporting ....................................... 12
7. Training Requirements .................................... 14
8. Safety Committee ......................................... 16

═══════════════════════════════════════════════════════════════

1. SAFETY POLICY STATEMENT

The safety and health of our employees is our highest priority. We are committed to providing a safe and healthy work environment for all employees, contractors, and visitors.

Every employee has the right to a safe workplace and the responsibility to work safely. Management is committed to providing the resources necessary to maintain a safe work environment and expects all employees to actively participate in our safety program.

2. GENERAL SAFETY RULES

2.1 BASIC SAFETY PRINCIPLES
- Follow all safety procedures and guidelines
- Report unsafe conditions immediately
- Use appropriate personal protective equipment
- Keep work areas clean and organized
- Never take shortcuts that compromise safety

2.2 PROHIBITED ACTIVITIES
- Horseplay or practical jokes
- Operating equipment without proper training
- Removing or disabling safety devices
- Working under the influence of drugs or alcohol

3. EMERGENCY PROCEDURES

3.1 FIRE EMERGENCY
- Activate the nearest fire alarm
- Evacuate immediately using designated routes
- Proceed to assembly areas
- Do not use elevators
- Do not re-enter the building until authorized

3.2 MEDICAL EMERGENCY
- Call 911 immediately for serious injuries
- Notify your supervisor and security
- Provide first aid only if trained to do so
- Do not move seriously injured persons

3.3 SEVERE WEATHER
- Monitor weather alerts and warnings
- Follow instructions from management
- Move to designated shelter areas if required
- Remain in shelter until all-clear is given

4. PERSONAL PROTECTIVE EQUIPMENT (PPE)

4.1 GENERAL REQUIREMENTS
Appropriate PPE must be worn when required by job duties or workplace conditions. This may include:
- Safety glasses or goggles
- Hard hats
- Safety shoes
- Gloves
- Hearing protection
- Respiratory protection

4.2 PPE MAINTENANCE
- Inspect PPE before each use
- Replace damaged or worn equipment
- Clean and store PPE properly
- Report defective equipment immediately

5. HAZARD COMMUNICATION

5.1 CHEMICAL SAFETY
- Read and understand Safety Data Sheets (SDS)
- Follow proper handling procedures
- Use appropriate PPE when working with chemicals
- Store chemicals according to manufacturer instructions

5.2 LABELING REQUIREMENTS
All hazardous materials must be properly labeled with:
- Product identification
- Hazard warnings
- Precautionary statements
- Supplier information

6. INCIDENT REPORTING

6.1 REPORTING REQUIREMENTS
All incidents, including near misses, must be reported immediately to:
- Your immediate supervisor
- The Safety Department
- Human Resources (for injuries)

6.2 INVESTIGATION PROCESS
All incidents will be thoroughly investigated to:
- Determine root causes
- Implement corrective actions
- Prevent similar occurrences
- Comply with regulatory requirements

7. TRAINING REQUIREMENTS

7.1 NEW EMPLOYEE ORIENTATION
All new employees must complete safety orientation training before beginning work assignments.

7.2 ONGOING TRAINING
Regular safety training is provided on topics including:
- Job-specific safety procedures
- Emergency response
- Hazard recognition
- PPE use and maintenance

8. SAFETY COMMITTEE

Our Safety Committee meets monthly to:
- Review incident reports and trends
- Evaluate safety procedures
- Recommend improvements
- Promote safety awareness

Committee members represent all departments and levels of the organization.

═══════════════════════════════════════════════════════════════

SAFETY CONTACTS

Emergency: 911
Security: Extension 2911
Safety Department: Extension 2500
Human Resources: Extension 2100

═══════════════════════════════════════════════════════════════

Remember: Safety is everyone's responsibility!

Document Control:
- Document ID: SM-2024-001
- Last Review Date: November 15, 2023
- Next Review Date: November 15, 2024
- Document Owner: Safety Committee`
      }
    };

    return documentTemplates[document.name as keyof typeof documentTemplates] || {
      content: `Document: ${document.name}\n\nThis is a sample document content for ${document.name}.\n\nFile Type: ${document.type}\nFile Size: ${document.size}\n\nThis document contains important information relevant to your role and responsibilities within the organization. Please review carefully and contact HR if you have any questions.`
    };
  };

  // State for document modals
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [editDocumentName, setEditDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // PDF Viewer State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for PDF files
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setUploadProgress(0); // Reset progress on new file selection
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        setSelectedFile(null);
      }
    }
  };

  const handleAddDocument = async () => {
    if (!newDocumentName.trim() || !selectedFile) {
      toast({
        title: "Validation Error",
        description: "Please provide a document name and upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDocument(true);
    try {
      // Simulate saving the document
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newDoc = {
        id: hrDocuments.length + 1,
        name: newDocumentName,
        type: "PDF", // Assuming PDF for now
        size: `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`,
        visibleToAll: true, // Default visibility
      };

      setHrDocuments((prev) => [...prev, newDoc]);
      setShowAddDocumentModal(false);
      setNewDocumentName('');
      setSelectedFile(null);
      setUploadProgress(0);

      toast({
        title: "Document Added",
        description: `${newDocumentName} has been successfully added.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDocument(false);
    }
  };

  const handleEditDocumentModal = (document: any) => {
    setSelectedDocument(document);
    setEditDocumentName(document.name);
    setShowEditDocumentModal(true);
    setSelectedFile(null); // Reset selected file for editing
    setUploadProgress(0);
  };

  const handleDocumentDelete = (docId: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      setHrDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
      });
    }
  };

  const handleDocumentView = (document: any) => {
    setSelectedDocument(document);
    setDocumentModalType("view");
    setShowDocumentModal(true);
    // Simulate setting total pages for PDF viewer
    setTotalPages(Math.floor(Math.random() * 10) + 5); // Random pages between 5 and 14
    setCurrentPage(1);
    setZoomLevel(1);
  };

  const handlePdfNavigation = (direction: 'prev' | 'next') => {
    setCurrentPage(prev => {
      if (direction === 'next') {
        return Math.min(prev + 1, totalPages);
      } else {
        return Math.max(1, prev - 1);
      }
    });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  const parseDocumentContent = (document: any) => {
    const documentTemplates = {
      "Code of Conduct": {
        content: `COMPANY CODE OF CONDUCT

EFFECTIVE DATE: January 1, 2024
VERSION: 2.1
APPROVED BY: Board of Directors

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Introduction and Purpose ................................. 3
2. Professional Conduct Standards .......................... 4
3. Confidentiality and Information Security ............... 6
4. Conflict of Interest Policy ............................. 8
5. Compliance with Laws and Regulations .................... 10
6. Reporting Violations and Whistleblower Protection ...... 12
7. Disciplinary Actions and Consequences .................. 14
8. Acknowledgment and Certification ........................ 16

═══════════════════════════════════════════════════════════════

1. INTRODUCTION AND PURPOSE

This Code of Conduct establishes the ethical standards and behavioral expectations for all employees, contractors, and representatives of our organization. It serves as a guide for making ethical decisions and maintaining the highest standards of professional integrity.

Our commitment to ethical business practices is fundamental to our success and reputation. Every individual associated with our organization is expected to read, understand, and comply with this Code of Conduct.

2. PROFESSIONAL CONDUCT STANDARDS

2.1 RESPECT AND DIGNITY
All employees must treat colleagues, customers, suppliers, and stakeholders with respect and dignity. Discrimination, harassment, or intimidation of any kind will not be tolerated.

2.2 HONESTY AND INTEGRITY
Employees must conduct themselves with honesty and integrity in all business dealings. This includes accurate reporting, truthful communication, and ethical decision-making.

2.3 PROFESSIONAL COMPETENCE
Employees are expected to maintain and develop their professional skills and knowledge to perform their duties effectively and efficiently.

3. CONFIDENTIALITY AND INFORMATION SECURITY

3.1 CONFIDENTIAL INFORMATION
Employees must protect confidential and proprietary information belonging to the company, customers, and business partners. This obligation continues even after employment ends.

3.2 DATA PROTECTION
All personal and sensitive data must be handled in accordance with applicable privacy laws and company policies. Unauthorized access, use, or disclosure of such information is strictly prohibited.

4. CONFLICT OF INTEREST POLICY

4.1 IDENTIFICATION OF CONFLICTS
Employees must identify and disclose any actual or potential conflicts of interest that may affect their ability to perform their duties objectively.

4.2 OUTSIDE ACTIVITIES
Employees should avoid outside activities, investments, or relationships that could interfere with their job performance or create conflicts with company interests.

5. COMPLIANCE WITH LAWS AND REGULATIONS

All employees must comply with applicable laws, regulations, and company policies. Ignorance of the law is not an acceptable excuse for non-compliance.

6. REPORTING VIOLATIONS

Employees are encouraged to report suspected violations of this Code of Conduct through appropriate channels. The company prohibits retaliation against individuals who report violations in good faith.

7. DISCIPLINARY ACTIONS

Violations of this Code of Conduct may result in disciplinary action, up to and including termination of employment, depending on the severity of the violation.

8. ACKNOWLEDGMENT

By signing below, I acknowledge that I have read, understood, and agree to comply with this Code of Conduct.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

For questions or clarifications regarding this Code of Conduct, please contact the Human Resources Department.

Document Control:
- Document ID: COC-2024-001
- Last Review Date: December 15, 2023
- Next Review Date: December 15, 2024
- Document Owner: Human Resources Department`
      },
      "Employee Handbook": {
        content: `EMPLOYEE HANDBOOK

WELCOME TO OUR ORGANIZATION

EFFECTIVE DATE: January 1, 2024
VERSION: 3.2
APPROVED BY: Executive Leadership Team

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Welcome Message .......................................... 3
2. Company Overview ......................................... 4
3. Employment Policies ...................................... 6
4. Compensation and Benefits ................................ 12
5. Work Environment and Safety .............................. 18
6. Professional Development ................................. 22
7. Technology and Communication ............................. 25
8. Leave Policies ........................................... 28
9. Performance Management ................................... 32
10. Disciplinary Procedures ................................. 35
11. Employee Resources ...................................... 38

═══════════════════════════════════════════════════════════════

1. WELCOME MESSAGE

Dear Team Member,

Welcome to our organization! We are delighted to have you join our team and look forward to the contributions you will make to our continued success.

This Employee Handbook serves as your comprehensive guide to our company policies, procedures, benefits, and expectations. Please take the time to read through this handbook carefully and keep it as a reference throughout your employment.

Our success depends on the dedication, creativity, and teamwork of our employees. We are committed to providing a positive work environment that promotes professional growth, work-life balance, and mutual respect.

If you have any questions about the information contained in this handbook, please don't hesitate to contact the Human Resources Department.

Welcome aboard!

Sincerely,
The Executive Leadership Team

2. COMPANY OVERVIEW

2.1 OUR MISSION
To deliver exceptional products and services while maintaining the highest standards of integrity, innovation, and customer satisfaction.

2.2 OUR VALUES
- Integrity: We conduct business with honesty and transparency
- Excellence: We strive for the highest quality in everything we do
- Innovation: We embrace change and continuously improve
- Teamwork: We collaborate effectively to achieve common goals
- Respect: We value diversity and treat everyone with dignity

2.3 ORGANIZATIONAL STRUCTURE
Our organization is structured to promote efficiency, accountability, and clear communication. Each department plays a vital role in achieving our overall objectives.

3. EMPLOYMENT POLICIES

3.1 EQUAL EMPLOYMENT OPPORTUNITY
We are committed to providing equal employment opportunities to all qualified individuals regardless of race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status.

3.2 AT-WILL EMPLOYMENT
Employment with our organization is at-will, meaning that either the employee or the company may terminate the employment relationship at any time, with or without cause or notice.

3.3 BACKGROUND CHECKS
All employment offers are contingent upon successful completion of background checks as required by law and company policy.

4. COMPENSATION AND BENEFITS

4.1 PAY PERIODS
Employees are paid bi-weekly on Fridays. If a payday falls on a holiday, payment will be made on the preceding business day.

4.2 OVERTIME
Non-exempt employees will receive overtime pay at one and one-half times their regular rate for hours worked in excess of 40 hours per week.

4.3 BENEFITS OVERVIEW
We offer a comprehensive benefits package including:
- Health insurance
- Dental and vision coverage
- Retirement savings plan with company matching
- Paid time off
- Professional development opportunities

5. WORK ENVIRONMENT AND SAFETY

5.1 WORKPLACE SAFETY
The safety and well-being of our employees is our top priority. All employees are expected to follow safety procedures and report any unsafe conditions immediately.

5.2 DRUG-FREE WORKPLACE
We maintain a drug-free workplace. The use, possession, or distribution of illegal drugs or alcohol on company premises is strictly prohibited.

6. PROFESSIONAL DEVELOPMENT

We are committed to supporting the professional growth and development of our employees through training programs, educational assistance, and career advancement opportunities.

7. TECHNOLOGY AND COMMUNICATION

7.1 COMPUTER AND INTERNET USE
Company-provided technology resources are to be used primarily for business purposes. Personal use should be limited and must not interfere with work responsibilities.

7.2 CONFIDENTIALITY
Employees must protect confidential company information and respect the privacy of customer and employee data.

8. LEAVE POLICIES

8.1 PAID TIME OFF (PTO)
Full-time employees accrue PTO based on length of service. PTO requests should be submitted in advance and approved by supervisors.

8.2 FAMILY AND MEDICAL LEAVE
Eligible employees may take unpaid leave for qualifying family and medical reasons as provided by applicable law.

9. PERFORMANCE MANAGEMENT

Regular performance evaluations help ensure that employees understand expectations and receive feedback on their performance. These evaluations also identify opportunities for professional development.

10. DISCIPLINARY PROCEDURES

When performance or conduct issues arise, we follow a progressive discipline process designed to help employees improve while maintaining workplace standards.

11. EMPLOYEE RESOURCES

11.1 HUMAN RESOURCES DEPARTMENT
The HR Department is available to assist with questions about policies, benefits, and workplace concerns.

11.2 EMPLOYEE ASSISTANCE PROGRAM
Confidential counseling and support services are available to help employees deal with personal and work-related challenges.

═══════════════════════════════════════════════════════════════

ACKNOWLEDGMENT

I acknowledge that I have received and read this Employee Handbook. I understand that it is my responsibility to comply with the policies and procedures outlined herein.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

This handbook is subject to change. Updates will be communicated to all employees.

Document Control:
- Document ID: EH-2024-001
- Last Review Date: December 1, 2023
- Next Review Date: December 1, 2024
- Document Owner: Human Resources Department`
      },
      "Safety Manual": {
        content: `WORKPLACE SAFETY MANUAL

SAFETY FIRST - ALWAYS

EFFECTIVE DATE: January 1, 2024
VERSION: 2.3
APPROVED BY: Safety Committee

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Safety Policy Statement ................................... 3
2. General Safety Rules ..................................... 4
3. Emergency Procedures ..................................... 6
4. Personal Protective Equipment ............................ 8
5. Hazard Communication ..................................... 10
6. Incident Reporting ....................................... 12
7. Training Requirements .................................... 14
8. Safety Committee ......................................... 16

═══════════════════════════════════════════════════════════════

1. SAFETY POLICY STATEMENT

The safety and health of our employees is our highest priority. We are committed to providing a safe and healthy work environment for all employees, contractors, and visitors.

Every employee has the right to a safe workplace and the responsibility to work safely. Management is committed to providing the resources necessary to maintain a safe work environment and expects all employees to actively participate in our safety program.

2. GENERAL SAFETY RULES

2.1 BASIC SAFETY PRINCIPLES
- Follow all safety procedures and guidelines
- Report unsafe conditions immediately
- Use appropriate personal protective equipment
- Keep work areas clean and organized
- Never take shortcuts that compromise safety

2.2 PROHIBITED ACTIVITIES
- Horseplay or practical jokes
- Operating equipment without proper training
- Removing or disabling safety devices
- Working under the influence of drugs or alcohol

3. EMERGENCY PROCEDURES

3.1 FIRE EMERGENCY
- Activate the nearest fire alarm
- Evacuate immediately using designated routes
- Proceed to assembly areas
- Do not use elevators
- Do not re-enter the building until authorized

3.2 MEDICAL EMERGENCY
- Call 911 immediately for serious injuries
- Notify your supervisor and security
- Provide first aid only if trained to do so
- Do not move seriously injured persons

3.3 SEVERE WEATHER
- Monitor weather alerts and warnings
- Follow instructions from management
- Move to designated shelter areas if required
- Remain in shelter until all-clear is given

4. PERSONAL PROTECTIVE EQUIPMENT (PPE)

4.1 GENERAL REQUIREMENTS
Appropriate PPE must be worn when required by job duties or workplace conditions. This may include:
- Safety glasses or goggles
- Hard hats
- Safety shoes
- Gloves
- Hearing protection
- Respiratory protection

4.2 PPE MAINTENANCE
- Inspect PPE before each use
- Replace damaged or worn equipment
- Clean and store PPE properly
- Report defective equipment immediately

5. HAZARD COMMUNICATION

5.1 CHEMICAL SAFETY
- Read and understand Safety Data Sheets (SDS)
- Follow proper handling procedures
- Use appropriate PPE when working with chemicals
- Store chemicals according to manufacturer instructions

5.2 LABELING REQUIREMENTS
All hazardous materials must be properly labeled with:
- Product identification
- Hazard warnings
- Precautionary statements
- Supplier information

6. INCIDENT REPORTING

6.1 REPORTING REQUIREMENTS
All incidents, including near misses, must be reported immediately to:
- Your immediate supervisor
- The Safety Department
- Human Resources (for injuries)

6.2 INVESTIGATION PROCESS
All incidents will be thoroughly investigated to:
- Determine root causes
- Implement corrective actions
- Prevent similar occurrences
- Comply with regulatory requirements

7. TRAINING REQUIREMENTS

7.1 NEW EMPLOYEE ORIENTATION
All new employees must complete safety orientation training before beginning work assignments.

7.2 ONGOING TRAINING
Regular safety training is provided on topics including:
- Job-specific safety procedures
- Emergency response
- Hazard recognition
- PPE use and maintenance

8. SAFETY COMMITTEE

Our Safety Committee meets monthly to:
- Review incident reports and trends
- Evaluate safety procedures
- Recommend improvements
- Promote safety awareness

Committee members represent all departments and levels of the organization.

═══════════════════════════════════════════════════════════════

SAFETY CONTACTS

Emergency: 911
Security: Extension 2911
Safety Department: Extension 2500
Human Resources: Extension 2100

═══════════════════════════════════════════════════════════════

Remember: Safety is everyone's responsibility!

Document Control:
- Document ID: SM-2024-001
- Last Review Date: November 15, 2023
- Next Review Date: November 15, 2024
- Document Owner: Safety Committee`
      }
    };

    return documentTemplates[document.name as keyof typeof documentTemplates] || {
      content: `Document: ${document.name}\n\nThis is a sample document content for ${document.name}.\n\nFile Type: ${document.type}\nFile Size: ${document.size}\n\nThis document contains important information relevant to your role and responsibilities within the organization. Please review carefully and contact HR if you have any questions.`
    };
  };

  // State for document modals
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [editDocumentName, setEditDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // PDF Viewer State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for PDF files
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setUploadProgress(0); // Reset progress on new file selection
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        setSelectedFile(null);
      }
    }
  };

  const handleAddDocument = async () => {
    if (!newDocumentName.trim() || !selectedFile) {
      toast({
        title: "Validation Error",
        description: "Please provide a document name and upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDocument(true);
    try {
      // Simulate saving the document
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newDoc = {
        id: hrDocuments.length + 1,
        name: newDocumentName,
        type: "PDF", // Assuming PDF for now
        size: `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`,
        visibleToAll: true, // Default visibility
      };

      setHrDocuments((prev) => [...prev, newDoc]);
      setShowAddDocumentModal(false);
      setNewDocumentName('');
      setSelectedFile(null);
      setUploadProgress(0);

      toast({
        title: "Document Added",
        description: `${newDocumentName} has been successfully added.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDocument(false);
    }
  };

  const handleEditDocumentModal = (document: any) => {
    setSelectedDocument(document);
    setEditDocumentName(document.name);
    setShowEditDocumentModal(true);
    setSelectedFile(null); // Reset selected file for editing
    setUploadProgress(0);
  };

  const handleDocumentDelete = (docId: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      setHrDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
      });
    }
  };

  const handleDocumentView = (document: any) => {
    setSelectedDocument(document);
    setDocumentModalType("view");
    setShowDocumentModal(true);
    // Simulate setting total pages for PDF viewer
    setTotalPages(Math.floor(Math.random() * 10) + 5); // Random pages between 5 and 14
    setCurrentPage(1);
    setZoomLevel(1);
  };

  const handlePdfNavigation = (direction: 'prev' | 'next') => {
    setCurrentPage(prev => {
      if (direction === 'next') {
        return Math.min(prev + 1, totalPages);
      } else {
        return Math.max(1, prev - 1);
      }
    });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  const parseDocumentContent = (document: any) => {
    const documentTemplates = {
      "Code of Conduct": {
        content: `COMPANY CODE OF CONDUCT

EFFECTIVE DATE: January 1, 2024
VERSION: 2.1
APPROVED BY: Board of Directors

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Introduction and Purpose ................................. 3
2. Professional Conduct Standards .......................... 4
3. Confidentiality and Information Security ............... 6
4. Conflict of Interest Policy ............................. 8
5. Compliance with Laws and Regulations .................... 10
6. Reporting Violations and Whistleblower Protection ...... 12
7. Disciplinary Actions and Consequences .................. 14
8. Acknowledgment and Certification ........................ 16

═══════════════════════════════════════════════════════════════

1. INTRODUCTION AND PURPOSE

This Code of Conduct establishes the ethical standards and behavioral expectations for all employees, contractors, and representatives of our organization. It serves as a guide for making ethical decisions and maintaining the highest standards of professional integrity.

Our commitment to ethical business practices is fundamental to our success and reputation. Every individual associated with our organization is expected to read, understand, and comply with this Code of Conduct.

2. PROFESSIONAL CONDUCT STANDARDS

2.1 RESPECT AND DIGNITY
All employees must treat colleagues, customers, suppliers, and stakeholders with respect and dignity. Discrimination, harassment, or intimidation of any kind will not be tolerated.

2.2 HONESTY AND INTEGRITY
Employees must conduct themselves with honesty and integrity in all business dealings. This includes accurate reporting, truthful communication, and ethical decision-making.

2.3 PROFESSIONAL COMPETENCE
Employees are expected to maintain and develop their professional skills and knowledge to perform their duties effectively and efficiently.

3. CONFIDENTIALITY AND INFORMATION SECURITY

3.1 CONFIDENTIAL INFORMATION
Employees must protect confidential and proprietary information belonging to the company, customers, and business partners. This obligation continues even after employment ends.

3.2 DATA PROTECTION
All personal and sensitive data must be handled in accordance with applicable privacy laws and company policies. Unauthorized access, use, or disclosure of such information is strictly prohibited.

4. CONFLICT OF INTEREST POLICY

4.1 IDENTIFICATION OF CONFLICTS
Employees must identify and disclose any actual or potential conflicts of interest that may affect their ability to perform their duties objectively.

4.2 OUTSIDE ACTIVITIES
Employees should avoid outside activities, investments, or relationships that could interfere with their job performance or create conflicts with company interests.

5. COMPLIANCE WITH LAWS AND REGULATIONS

All employees must comply with applicable laws, regulations, and company policies. Ignorance of the law is not an acceptable excuse for non-compliance.

6. REPORTING VIOLATIONS

Employees are encouraged to report suspected violations of this Code of Conduct through appropriate channels. The company prohibits retaliation against individuals who report violations in good faith.

7. DISCIPLINARY ACTIONS

Violations of this Code of Conduct may result in disciplinary action, up to and including termination of employment, depending on the severity of the violation.

8. ACKNOWLEDGMENT

By signing below, I acknowledge that I have read, understood, and agree to comply with this Code of Conduct.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

For questions or clarifications regarding this Code of Conduct, please contact the Human Resources Department.

Document Control:
- Document ID: COC-2024-001
- Last Review Date: December 15, 2023
- Next Review Date: December 15, 2024
- Document Owner: Human Resources Department`
      },
      "Employee Handbook": {
        content: `EMPLOYEE HANDBOOK

WELCOME TO OUR ORGANIZATION

EFFECTIVE DATE: January 1, 2024
VERSION: 3.2
APPROVED BY: Executive Leadership Team

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Welcome Message .......................................... 3
2. Company Overview ......................................... 4
3. Employment Policies ...................................... 6
4. Compensation and Benefits ................................ 12
5. Work Environment and Safety .............................. 18
6. Professional Development ................................. 22
7. Technology and Communication ............................. 25
8. Leave Policies ........................................... 28
9. Performance Management ................................... 32
10. Disciplinary Procedures ................................. 35
11. Employee Resources ...................................... 38

═══════════════════════════════════════════════════════════════

1. WELCOME MESSAGE

Dear Team Member,

Welcome to our organization! We are delighted to have you join our team and look forward to the contributions you will make to our continued success.

This Employee Handbook serves as your comprehensive guide to our company policies, procedures, benefits, and expectations. Please take the time to read through this handbook carefully and keep it as a reference throughout your employment.

Our success depends on the dedication, creativity, and teamwork of our employees. We are committed to providing a positive work environment that promotes professional growth, work-life balance, and mutual respect.

If you have any questions about the information contained in this handbook, please don't hesitate to contact the Human Resources Department.

Welcome aboard!

Sincerely,
The Executive Leadership Team

2. COMPANY OVERVIEW

2.1 OUR MISSION
To deliver exceptional products and services while maintaining the highest standards of integrity, innovation, and customer satisfaction.

2.2 OUR VALUES
- Integrity: We conduct business with honesty and transparency
- Excellence: We strive for the highest quality in everything we do
- Innovation: We embrace change and continuously improve
- Teamwork: We collaborate effectively to achieve common goals
- Respect: We value diversity and treat everyone with dignity

2.3 ORGANIZATIONAL STRUCTURE
Our organization is structured to promote efficiency, accountability, and clear communication. Each department plays a vital role in achieving our overall objectives.

3. EMPLOYMENT POLICIES

3.1 EQUAL EMPLOYMENT OPPORTUNITY
We are committed to providing equal employment opportunities to all qualified individuals regardless of race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status.

3.2 AT-WILL EMPLOYMENT
Employment with our organization is at-will, meaning that either the employee or the company may terminate the employment relationship at any time, with or without cause or notice.

3.3 BACKGROUND CHECKS
All employment offers are contingent upon successful completion of background checks as required by law and company policy.

4. COMPENSATION AND BENEFITS

4.1 PAY PERIODS
Employees are paid bi-weekly on Fridays. If a payday falls on a holiday, payment will be made on the preceding business day.

4.2 OVERTIME
Non-exempt employees will receive overtime pay at one and one-half times their regular rate for hours worked in excess of 40 hours per week.

4.3 BENEFITS OVERVIEW
We offer a comprehensive benefits package including:
- Health insurance
- Dental and vision coverage
- Retirement savings plan with company matching
- Paid time off
- Professional development opportunities

5. WORK ENVIRONMENT AND SAFETY

5.1 WORKPLACE SAFETY
The safety and well-being of our employees is our top priority. All employees are expected to follow safety procedures and report any unsafe conditions immediately.

5.2 DRUG-FREE WORKPLACE
We maintain a drug-free workplace. The use, possession, or distribution of illegal drugs or alcohol on company premises is strictly prohibited.

6. PROFESSIONAL DEVELOPMENT

We are committed to supporting the professional growth and development of our employees through training programs, educational assistance, and career advancement opportunities.

7. TECHNOLOGY AND COMMUNICATION

7.1 COMPUTER AND INTERNET USE
Company-provided technology resources are to be used primarily for business purposes. Personal use should be limited and must not interfere with work responsibilities.

7.2 CONFIDENTIALITY
Employees must protect confidential company information and respect the privacy of customer and employee data.

8. LEAVE POLICIES

8.1 PAID TIME OFF (PTO)
Full-time employees accrue PTO based on length of service. PTO requests should be submitted in advance and approved by supervisors.

8.2 FAMILY AND MEDICAL LEAVE
Eligible employees may take unpaid leave for qualifying family and medical reasons as provided by applicable law.

9. PERFORMANCE MANAGEMENT

Regular performance evaluations help ensure that employees understand expectations and receive feedback on their performance. These evaluations also identify opportunities for professional development.

10. DISCIPLINARY PROCEDURES

When performance or conduct issues arise, we follow a progressive discipline process designed to help employees improve while maintaining workplace standards.

11. EMPLOYEE RESOURCES

11.1 HUMAN RESOURCES DEPARTMENT
The HR Department is available to assist with questions about policies, benefits, and workplace concerns.

11.2 EMPLOYEE ASSISTANCE PROGRAM
Confidential counseling and support services are available to help employees deal with personal and work-related challenges.

═══════════════════════════════════════════════════════════════

ACKNOWLEDGMENT

I acknowledge that I have received and read this Employee Handbook. I understand that it is my responsibility to comply with the policies and procedures outlined herein.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

This handbook is subject to change. Updates will be communicated to all employees.

Document Control:
- Document ID: EH-2024-001
- Last Review Date: December 1, 2023
- Next Review Date: December 1, 2024
- Document Owner: Human Resources Department`
      },
      "Safety Manual": {
        content: `WORKPLACE SAFETY MANUAL

SAFETY FIRST - ALWAYS

EFFECTIVE DATE: January 1, 2024
VERSION: 2.3
APPROVED BY: Safety Committee

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Safety Policy Statement ................................... 3
2. General Safety Rules ..................................... 4
3. Emergency Procedures ..................................... 6
4. Personal Protective Equipment ............................ 8
5. Hazard Communication ..................................... 10
6. Incident Reporting ....................................... 12
7. Training Requirements .................................... 14
8. Safety Committee ......................................... 16

═══════════════════════════════════════════════════════════════

1. SAFETY POLICY STATEMENT

The safety and health of our employees is our highest priority. We are committed to providing a safe and healthy work environment for all employees, contractors, and visitors.

Every employee has the right to a safe workplace and the responsibility to work safely. Management is committed to providing the resources necessary to maintain a safe work environment and expects all employees to actively participate in our safety program.

2. GENERAL SAFETY RULES

2.1 BASIC SAFETY PRINCIPLES
- Follow all safety procedures and guidelines
- Report unsafe conditions immediately
- Use appropriate personal protective equipment
- Keep work areas clean and organized
- Never take shortcuts that compromise safety

2.2 PROHIBITED ACTIVITIES
- Horseplay or practical jokes
- Operating equipment without proper training
- Removing or disabling safety devices
- Working under the influence of drugs or alcohol

3. EMERGENCY PROCEDURES

3.1 FIRE EMERGENCY
- Activate the nearest fire alarm
- Evacuate immediately using designated routes
- Proceed to assembly areas
- Do not use elevators
- Do not re-enter the building until authorized

3.2 MEDICAL EMERGENCY
- Call 911 immediately for serious injuries
- Notify your supervisor and security
- Provide first aid only if trained to do so
- Do not move seriously injured persons

3.3 SEVERE WEATHER
- Monitor weather alerts and warnings
- Follow instructions from management
- Move to designated shelter areas if required
- Remain in shelter until all-clear is given

4. PERSONAL PROTECTIVE EQUIPMENT (PPE)

4.1 GENERAL REQUIREMENTS
Appropriate PPE must be worn when required by job duties or workplace conditions. This may include:
- Safety glasses or goggles
- Hard hats
- Safety shoes
- Gloves
- Hearing protection
- Respiratory protection

4.2 PPE MAINTENANCE
- Inspect PPE before each use
- Replace damaged or worn equipment
- Clean and store PPE properly
- Report defective equipment immediately

5. HAZARD COMMUNICATION

5.1 CHEMICAL SAFETY
- Read and understand Safety Data Sheets (SDS)
- Follow proper handling procedures
- Use appropriate PPE when working with chemicals
- Store chemicals according to manufacturer instructions

5.2 LABELING REQUIREMENTS
All hazardous materials must be properly labeled with:
- Product identification
- Hazard warnings
- Precautionary statements
- Supplier information

6. INCIDENT REPORTING

6.1 REPORTING REQUIREMENTS
All incidents, including near misses, must be reported immediately to:
- Your immediate supervisor
- The Safety Department
- Human Resources (for injuries)

6.2 INVESTIGATION PROCESS
All incidents will be thoroughly investigated to:
- Determine root causes
- Implement corrective actions
- Prevent similar occurrences
- Comply with regulatory requirements

7. TRAINING REQUIREMENTS

7.1 NEW EMPLOYEE ORIENTATION
All new employees must complete safety orientation training before beginning work assignments.

7.2 ONGOING TRAINING
Regular safety training is provided on topics including:
- Job-specific safety procedures
- Emergency response
- Hazard recognition
- PPE use and maintenance

8. SAFETY COMMITTEE

Our Safety Committee meets monthly to:
- Review incident reports and trends
- Evaluate safety procedures
- Recommend improvements
- Promote safety awareness

Committee members represent all departments and levels of the organization.

═══════════════════════════════════════════════════════════════

SAFETY CONTACTS

Emergency: 911
Security: Extension 2911
Safety Department: Extension 2500
Human Resources: Extension 2100

═══════════════════════════════════════════════════════════════

Remember: Safety is everyone's responsibility!

Document Control:
- Document ID: SM-2024-001
- Last Review Date: November 15, 2023
- Next Review Date: November 15, 2024
- Document Owner: Safety Committee`
      }
    };

    return documentTemplates[document.name as keyof typeof documentTemplates] || {
      content: `Document: ${document.name}\n\nThis is a sample document content for ${document.name}.\n\nFile Type: ${document.type}\nFile Size: ${document.size}\n\nThis document contains important information relevant to your role and responsibilities within the organization. Please review carefully and contact HR if you have any questions.`
    };
  };

  // State for document modals
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [editDocumentName, setEditDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // PDF Viewer State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for PDF files
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setUploadProgress(0); // Reset progress on new file selection
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        setSelectedFile(null);
      }
    }
  };

  const handleAddDocument = async () => {
    if (!newDocumentName.trim() || !selectedFile) {
      toast({
        title: "Validation Error",
        description: "Please provide a document name and upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDocument(true);
    try {
      // Simulate saving the document
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newDoc = {
        id: hrDocuments.length + 1,
        name: newDocumentName,
        type: "PDF", // Assuming PDF for now
        size: `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`,
        visibleToAll: true, // Default visibility
      };

      setHrDocuments((prev) => [...prev, newDoc]);
      setShowAddDocumentModal(false);
      setNewDocumentName('');
      setSelectedFile(null);
      setUploadProgress(0);

      toast({
        title: "Document Added",
        description: `${newDocumentName} has been successfully added.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDocument(false);
    }
  };

  const handleEditDocumentModal = (document: any) => {
    setSelectedDocument(document);
    setEditDocumentName(document.name);
    setShowEditDocumentModal(true);
    setSelectedFile(null); // Reset selected file for editing
    setUploadProgress(0);
  };

  const handleDocumentDelete = (docId: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      setHrDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
      });
    }
  };

  const handleDocumentView = (document: any) => {
    setSelectedDocument(document);
    setDocumentModalType("view");
    setShowDocumentModal(true);
    // Simulate setting total pages for PDF viewer
    setTotalPages(Math.floor(Math.random() * 10) + 5); // Random pages between 5 and 14
    setCurrentPage(1);
    setZoomLevel(1);
  };

  const handlePdfNavigation = (direction: 'prev' | 'next') => {
    setCurrentPage(prev => {
      if (direction === 'next') {
        return Math.min(prev + 1, totalPages);
      } else {
        return Math.max(1, prev - 1);
      }
    });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  const parseDocumentContent = (document: any) => {
    const documentTemplates = {
      "Code of Conduct": {
        content: `COMPANY CODE OF CONDUCT

EFFECTIVE DATE: January 1, 2024
VERSION: 2.1
APPROVED BY: Board of Directors

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Introduction and Purpose ................................. 3
2. Professional Conduct Standards .......................... 4
3. Confidentiality and Information Security ............... 6
4. Conflict of Interest Policy ............................. 8
5. Compliance with Laws and Regulations .................... 10
6. Reporting Violations and Whistleblower Protection ...... 12
7. Disciplinary Actions and Consequences .................. 14
8. Acknowledgment and Certification ........................ 16

═══════════════════════════════════════════════════════════════

1. INTRODUCTION AND PURPOSE

This Code of Conduct establishes the ethical standards and behavioral expectations for all employees, contractors, and representatives of our organization. It serves as a guide for making ethical decisions and maintaining the highest standards of professional integrity.

Our commitment to ethical business practices is fundamental to our success and reputation. Every individual associated with our organization is expected to read, understand, and comply with this Code of Conduct.

2. PROFESSIONAL CONDUCT STANDARDS

2.1 RESPECT AND DIGNITY
All employees must treat colleagues, customers, suppliers, and stakeholders with respect and dignity. Discrimination, harassment, or intimidation of any kind will not be tolerated.

2.2 HONESTY AND INTEGRITY
Employees must conduct themselves with honesty and integrity in all business dealings. This includes accurate reporting, truthful communication, and ethical decision-making.

2.3 PROFESSIONAL COMPETENCE
Employees are expected to maintain and develop their professional skills and knowledge to perform their duties effectively and efficiently.

3. CONFIDENTIALITY AND INFORMATION SECURITY

3.1 CONFIDENTIAL INFORMATION
Employees must protect confidential and proprietary information belonging to the company, customers, and business partners. This obligation continues even after employment ends.

3.2 DATA PROTECTION
All personal and sensitive data must be handled in accordance with applicable privacy laws and company policies. Unauthorized access, use, or disclosure of such information is strictly prohibited.

4. CONFLICT OF INTEREST POLICY

4.1 IDENTIFICATION OF CONFLICTS
Employees must identify and disclose any actual or potential conflicts of interest that may affect their ability to perform their duties objectively.

4.2 OUTSIDE ACTIVITIES
Employees should avoid outside activities, investments, or relationships that could interfere with their job performance or create conflicts with company interests.

5. COMPLIANCE WITH LAWS AND REGULATIONS

All employees must comply with applicable laws, regulations, and company policies. Ignorance of the law is not an acceptable excuse for non-compliance.

6. REPORTING VIOLATIONS

Employees are encouraged to report suspected violations of this Code of Conduct through appropriate channels. The company prohibits retaliation against individuals who report violations in good faith.

7. DISCIPLINARY ACTIONS

Violations of this Code of Conduct may result in disciplinary action, up to and including termination of employment, depending on the severity of the violation.

8. ACKNOWLEDGMENT

By signing below, I acknowledge that I have read, understood, and agree to comply with this Code of Conduct.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

For questions or clarifications regarding this Code of Conduct, please contact the Human Resources Department.

Document Control:
- Document ID: COC-2024-001
- Last Review Date: December 15, 2023
- Next Review Date: December 15, 2024
- Document Owner: Human Resources Department`
      },
      "Employee Handbook": {
        content: `EMPLOYEE HANDBOOK

WELCOME TO OUR ORGANIZATION

EFFECTIVE DATE: January 1, 2024
VERSION: 3.2
APPROVED BY: Executive Leadership Team

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Welcome Message .......................................... 3
2. Company Overview ......................................... 4
3. Employment Policies ...................................... 6
4. Compensation and Benefits ................................ 12
5. Work Environment and Safety .............................. 18
6. Professional Development ................................. 22
7. Technology and Communication ............................. 25
8. Leave Policies ........................................... 28
9. Performance Management ................................... 32
10. Disciplinary Procedures ................................. 35
11. Employee Resources ...................................... 38

═══════════════════════════════════════════════════════════════

1. WELCOME MESSAGE

Dear Team Member,

Welcome to our organization! We are delighted to have you join our team and look forward to the contributions you will make to our continued success.

This Employee Handbook serves as your comprehensive guide to our company policies, procedures, benefits, and expectations. Please take the time to read through this handbook carefully and keep it as a reference throughout your employment.

Our success depends on the dedication, creativity, and teamwork of our employees. We are committed to providing a positive work environment that promotes professional growth, work-life balance, and mutual respect.

If you have any questions about the information contained in this handbook, please don't hesitate to contact the Human Resources Department.

Welcome aboard!

Sincerely,
The Executive Leadership Team

2. COMPANY OVERVIEW

2.1 OUR MISSION
To deliver exceptional products and services while maintaining the highest standards of integrity, innovation, and customer satisfaction.

2.2 OUR VALUES
- Integrity: We conduct business with honesty and transparency
- Excellence: We strive for the highest quality in everything we do
- Innovation: We embrace change and continuously improve
- Teamwork: We collaborate effectively to achieve common goals
- Respect: We value diversity and treat everyone with dignity

2.3 ORGANIZATIONAL STRUCTURE
Our organization is structured to promote efficiency, accountability, and clear communication. Each department plays a vital role in achieving our overall objectives.

3. EMPLOYMENT POLICIES

3.1 EQUAL EMPLOYMENT OPPORTUNITY
We are committed to providing equal employment opportunities to all qualified individuals regardless of race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status.

3.2 AT-WILL EMPLOYMENT
Employment with our organization is at-will, meaning that either the employee or the company may terminate the employment relationship at any time, with or without cause or notice.

3.3 BACKGROUND CHECKS
All employment offers are contingent upon successful completion of background checks as required by law and company policy.

4. COMPENSATION AND BENEFITS

4.1 PAY PERIODS
Employees are paid bi-weekly on Fridays. If a payday falls on a holiday, payment will be made on the preceding business day.

4.2 OVERTIME
Non-exempt employees will receive overtime pay at one and one-half times their regular rate for hours worked in excess of 40 hours per week.

4.3 BENEFITS OVERVIEW
We offer a comprehensive benefits package including:
- Health insurance
- Dental and vision coverage
- Retirement savings plan with company matching
- Paid time off
- Professional development opportunities

5. WORK ENVIRONMENT AND SAFETY

5.1 WORKPLACE SAFETY
The safety and well-being of our employees is our top priority. All employees are expected to follow safety procedures and report any unsafe conditions immediately.

5.2 DRUG-FREE WORKPLACE
We maintain a drug-free workplace. The use, possession, or distribution of illegal drugs or alcohol on company premises is strictly prohibited.

6. PROFESSIONAL DEVELOPMENT

We are committed to supporting the professional growth and development of our employees through training programs, educational assistance, and career advancement opportunities.

7. TECHNOLOGY AND COMMUNICATION

7.1 COMPUTER AND INTERNET USE
Company-provided technology resources are to be used primarily for business purposes. Personal use should be limited and must not interfere with work responsibilities.

7.2 CONFIDENTIALITY
Employees must protect confidential company information and respect the privacy of customer and employee data.

8. LEAVE POLICIES

8.1 PAID TIME OFF (PTO)
Full-time employees accrue PTO based on length of service. PTO requests should be submitted in advance and approved by supervisors.

8.2 FAMILY AND MEDICAL LEAVE
Eligible employees may take unpaid leave for qualifying family and medical reasons as provided by applicable law.

9. PERFORMANCE MANAGEMENT

Regular performance evaluations help ensure that employees understand expectations and receive feedback on their performance. These evaluations also identify opportunities for professional development.

10. DISCIPLINARY PROCEDURES

When performance or conduct issues arise, we follow a progressive discipline process designed to help employees improve while maintaining workplace standards.

11. EMPLOYEE RESOURCES

11.1 HUMAN RESOURCES DEPARTMENT
The HR Department is available to assist with questions about policies, benefits, and workplace concerns.

11.2 EMPLOYEE ASSISTANCE PROGRAM
Confidential counseling and support services are available to help employees deal with personal and work-related challenges.

═══════════════════════════════════════════════════════════════

ACKNOWLEDGMENT

I acknowledge that I have received and read this Employee Handbook. I understand that it is my responsibility to comply with the policies and procedures outlined herein.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

This handbook is subject to change. Updates will be communicated to all employees.

Document Control:
- Document ID: EH-2024-001
- Last Review Date: December 1, 2023
- Next Review Date: December 1, 2024
- Document Owner: Human Resources Department`
      },
      "Safety Manual": {
        content: `WORKPLACE SAFETY MANUAL

SAFETY FIRST - ALWAYS

EFFECTIVE DATE: January 1, 2024
VERSION: 2.3
APPROVED BY: Safety Committee

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Safety Policy Statement ................................... 3
2. General Safety Rules ..................................... 4
3. Emergency Procedures ..................................... 6
4. Personal Protective Equipment ............................ 8
5. Hazard Communication ..................................... 10
6. Incident Reporting ....................................... 12
7. Training Requirements .................................... 14
8. Safety Committee ......................................... 16

═══════════════════════════════════════════════════════════════

1. SAFETY POLICY STATEMENT

The safety and health of our employees is our highest priority. We are committed to providing a safe and healthy work environment for all employees, contractors, and visitors.

Every employee has the right to a safe workplace and the responsibility to work safely. Management is committed to providing the resources necessary to maintain a safe work environment and expects all employees to actively participate in our safety program.

2. GENERAL SAFETY RULES

2.1 BASIC SAFETY PRINCIPLES
- Follow all safety procedures and guidelines
- Report unsafe conditions immediately
- Use appropriate personal protective equipment
- Keep work areas clean and organized
- Never take shortcuts that compromise safety

2.2 PROHIBITED ACTIVITIES
- Horseplay or practical jokes
- Operating equipment without proper training
- Removing or disabling safety devices
- Working under the influence of drugs or alcohol

3. EMERGENCY PROCEDURES

3.1 FIRE EMERGENCY
- Activate the nearest fire alarm
- Evacuate immediately using designated routes
- Proceed to assembly areas
- Do not use elevators
- Do not re-enter the building until authorized

3.2 MEDICAL EMERGENCY
- Call 911 immediately for serious injuries
- Notify your supervisor and security
- Provide first aid only if trained to do so
- Do not move seriously injured persons

3.3 SEVERE WEATHER
- Monitor weather alerts and warnings
- Follow instructions from management
- Move to designated shelter areas if required
- Remain in shelter until all-clear is given

4. PERSONAL PROTECTIVE EQUIPMENT (PPE)

4.1 GENERAL REQUIREMENTS
Appropriate PPE must be worn when required by job duties or workplace conditions. This may include:
- Safety glasses or goggles
- Hard hats
- Safety shoes
- Gloves
- Hearing protection
- Respiratory protection

4.2 PPE MAINTENANCE
- Inspect PPE before each use
- Replace damaged or worn equipment
- Clean and store PPE properly
- Report defective equipment immediately

5. HAZARD COMMUNICATION

5.1 CHEMICAL SAFETY
- Read and understand Safety Data Sheets (SDS)
- Follow proper handling procedures
- Use appropriate PPE when working with chemicals
- Store chemicals according to manufacturer instructions

5.2 LABELING REQUIREMENTS
All hazardous materials must be properly labeled with:
- Product identification
- Hazard warnings
- Precautionary statements
- Supplier information

6. INCIDENT REPORTING

6.1 REPORTING REQUIREMENTS
All incidents, including near misses, must be reported immediately to:
- Your immediate supervisor
- The Safety Department
- Human Resources (for injuries)

6.2 INVESTIGATION PROCESS
All incidents will be thoroughly investigated to:
- Determine root causes
- Implement corrective actions
- Prevent similar occurrences
- Comply with regulatory requirements

7. TRAINING REQUIREMENTS

7.1 NEW EMPLOYEE ORIENTATION
All new employees must complete safety orientation training before beginning work assignments.

7.2 ONGOING TRAINING
Regular safety training is provided on topics including:
- Job-specific safety procedures
- Emergency response
- Hazard recognition
- PPE use and maintenance

8. SAFETY COMMITTEE

Our Safety Committee meets monthly to:
- Review incident reports and trends
- Evaluate safety procedures
- Recommend improvements
- Promote safety awareness

Committee members represent all departments and levels of the organization.

═══════════════════════════════════════════════════════════════

SAFETY CONTACTS

Emergency: 911
Security: Extension 2911
Safety Department: Extension 2500
Human Resources: Extension 2100

═══════════════════════════════════════════════════════════════

Remember: Safety is everyone's responsibility!

Document Control:
- Document ID: SM-2024-001
- Last Review Date: November 15, 2023
- Next Review Date: November 15, 2024
- Document Owner: Safety Committee`
      }
    };

    return documentTemplates[document.name as keyof typeof documentTemplates] || {
      content: `Document: ${document.name}\n\nThis is a sample document content for ${document.name}.\n\nFile Type: ${document.type}\nFile Size: ${document.size}\n\nThis document contains important information relevant to your role and responsibilities within the organization. Please review carefully and contact HR if you have any questions.`
    };
  };

  // State for document modals
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [editDocumentName, setEditDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // PDF Viewer State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for PDF files
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setUploadProgress(0); // Reset progress on new file selection
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        setSelectedFile(null);
      }
    }
  };

  const handleAddDocument = async () => {
    if (!newDocumentName.trim() || !selectedFile) {
      toast({
        title: "Validation Error",
        description: "Please provide a document name and upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDocument(true);
    try {
      // Simulate saving the document
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newDoc = {
        id: hrDocuments.length + 1,
        name: newDocumentName,
        type: "PDF", // Assuming PDF for now
        size: `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`,
        visibleToAll: true, // Default visibility
      };

      setHrDocuments((prev) => [...prev, newDoc]);
      setShowAddDocumentModal(false);
      setNewDocumentName('');
      setSelectedFile(null);
      setUploadProgress(0);

      toast({
        title: "Document Added",
        description: `${newDocumentName} has been successfully added.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDocument(false);
    }
  };

  const handleEditDocumentModal = (document: any) => {
    setSelectedDocument(document);
    setEditDocumentName(document.name);
    setShowEditDocumentModal(true);
    setSelectedFile(null); // Reset selected file for editing
    setUploadProgress(0);
  };

  const handleDocumentDelete = (docId: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      setHrDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
      });
    }
  };

  const handleDocumentView = (document: any) => {
    setSelectedDocument(document);
    setDocumentModalType("view");
    setShowDocumentModal(true);
    // Simulate setting total pages for PDF viewer
    setTotalPages(Math.floor(Math.random() * 10) + 5); // Random pages between 5 and 14
    setCurrentPage(1);
    setZoomLevel(1);
  };

  const handlePdfNavigation = (direction: 'prev' | 'next') => {
    setCurrentPage(prev => {
      if (direction === 'next') {
        return Math.min(prev + 1, totalPages);
      } else {
        return Math.max(1, prev - 1);
      }
    });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  const parseDocumentContent = (document: any) => {
    const documentTemplates = {
      "Code of Conduct": {
        content: `COMPANY CODE OF CONDUCT

EFFECTIVE DATE: January 1, 2024
VERSION: 2.1
APPROVED BY: Board of Directors

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Introduction and Purpose ................................. 3
2. Professional Conduct Standards .......................... 4
3. Confidentiality and Information Security ............... 6
4. Conflict of Interest Policy ............................. 8
5. Compliance with Laws and Regulations .................... 10
6. Reporting Violations and Whistleblower Protection ...... 12
7. Disciplinary Actions and Consequences .................. 14
8. Acknowledgment and Certification ........................ 16

═══════════════════════════════════════════════════════════════

1. INTRODUCTION AND PURPOSE

This Code of Conduct establishes the ethical standards and behavioral expectations for all employees, contractors, and representatives of our organization. It serves as a guide for making ethical decisions and maintaining the highest standards of professional integrity.

Our commitment to ethical business practices is fundamental to our success and reputation. Every individual associated with our organization is expected to read, understand, and comply with this Code of Conduct.

2. PROFESSIONAL CONDUCT STANDARDS

2.1 RESPECT AND DIGNITY
All employees must treat colleagues, customers, suppliers, and stakeholders with respect and dignity. Discrimination, harassment, or intimidation of any kind will not be tolerated.

2.2 HONESTY AND INTEGRITY
Employees must conduct themselves with honesty and integrity in all business dealings. This includes accurate reporting, truthful communication, and ethical decision-making.

2.3 PROFESSIONAL COMPETENCE
Employees are expected to maintain and develop their professional skills and knowledge to perform their duties effectively and efficiently.

3. CONFIDENTIALITY AND INFORMATION SECURITY

3.1 CONFIDENTIAL INFORMATION
Employees must protect confidential and proprietary information belonging to the company, customers, and business partners. This obligation continues even after employment ends.

3.2 DATA PROTECTION
All personal and sensitive data must be handled in accordance with applicable privacy laws and company policies. Unauthorized access, use, or disclosure of such information is strictly prohibited.

4. CONFLICT OF INTEREST POLICY

4.1 IDENTIFICATION OF CONFLICTS
Employees must identify and disclose any actual or potential conflicts of interest that may affect their ability to perform their duties objectively.

4.2 OUTSIDE ACTIVITIES
Employees should avoid outside activities, investments, or relationships that could interfere with their job performance or create conflicts with company interests.

5. COMPLIANCE WITH LAWS AND REGULATIONS

All employees must comply with applicable laws, regulations, and company policies. Ignorance of the law is not an acceptable excuse for non-compliance.

6. REPORTING VIOLATIONS

Employees are encouraged to report suspected violations of this Code of Conduct through appropriate channels. The company prohibits retaliation against individuals who report violations in good faith.

7. DISCIPLINARY ACTIONS

Violations of this Code of Conduct may result in disciplinary action, up to and including termination of employment, depending on the severity of the violation.

8. ACKNOWLEDGMENT

By signing below, I acknowledge that I have read, understood, and agree to comply with this Code of Conduct.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

For questions or clarifications regarding this Code of Conduct, please contact the Human Resources Department.

Document Control:
- Document ID: COC-2024-001
- Last Review Date: December 15, 2023
- Next Review Date: December 15, 2024
- Document Owner: Human Resources Department`
      },
      "Employee Handbook": {
        content: `EMPLOYEE HANDBOOK

WELCOME TO OUR ORGANIZATION

EFFECTIVE DATE: January 1, 2024
VERSION: 3.2
APPROVED BY: Executive Leadership Team

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Welcome Message .......................................... 3
2. Company Overview ......................................... 4
3. Employment Policies ...................................... 6
4. Compensation and Benefits ................................ 12
5. Work Environment and Safety .............................. 18
6. Professional Development ................................. 22
7. Technology and Communication ............................. 25
8. Leave Policies ........................................... 28
9. Performance Management ................................... 32
10. Disciplinary Procedures ................................. 35
11. Employee Resources ...................................... 38

═══════════════════════════════════════════════════════════════

1. WELCOME MESSAGE

Dear Team Member,

Welcome to our organization! We are delighted to have you join our team and look forward to the contributions you will make to our continued success.

This Employee Handbook serves as your comprehensive guide to our company policies, procedures, benefits, and expectations. Please take the time to read through this handbook carefully and keep it as a reference throughout your employment.

Our success depends on the dedication, creativity, and teamwork of our employees. We are committed to providing a positive work environment that promotes professional growth, work-life balance, and mutual respect.

If you have any questions about the information contained in this handbook, please don't hesitate to contact the Human Resources Department.

Welcome aboard!

Sincerely,
The Executive Leadership Team

2. COMPANY OVERVIEW

2.1 OUR MISSION
To deliver exceptional products and services while maintaining the highest standards of integrity, innovation, and customer satisfaction.

2.2 OUR VALUES
- Integrity: We conduct business with honesty and transparency
- Excellence: We strive for the highest quality in everything we do
- Innovation: We embrace change and continuously improve
- Teamwork: We collaborate effectively to achieve common goals
- Respect: We value diversity and treat everyone with dignity

2.3 ORGANIZATIONAL STRUCTURE
Our organization is structured to promote efficiency, accountability, and clear communication. Each department plays a vital role in achieving our overall objectives.

3. EMPLOYMENT POLICIES

3.1 EQUAL EMPLOYMENT OPPORTUNITY
We are committed to providing equal employment opportunities to all qualified individuals regardless of race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status.

3.2 AT-WILL EMPLOYMENT
Employment with our organization is at-will, meaning that either the employee or the company may terminate the employment relationship at any time, with or without cause or notice.

3.3 BACKGROUND CHECKS
All employment offers are contingent upon successful completion of background checks as required by law and company policy.

4. COMPENSATION AND BENEFITS

4.1 PAY PERIODS
Employees are paid bi-weekly on Fridays. If a payday falls on a holiday, payment will be made on the preceding business day.

4.2 OVERTIME
Non-exempt employees will receive overtime pay at one and one-half times their regular rate for hours worked in excess of 40 hours per week.

4.3 BENEFITS OVERVIEW
We offer a comprehensive benefits package including:
- Health insurance
- Dental and vision coverage
- Retirement savings plan with company matching
- Paid time off
- Professional development opportunities

5. WORK ENVIRONMENT AND SAFETY

5.1 WORKPLACE SAFETY
The safety and well-being of our employees is our top priority. All employees are expected to follow safety procedures and report any unsafe conditions immediately.

5.2 DRUG-FREE WORKPLACE
We maintain a drug-free workplace. The use, possession, or distribution of illegal drugs or alcohol on company premises is strictly prohibited.

6. PROFESSIONAL DEVELOPMENT

We are committed to supporting the professional growth and development of our employees through training programs, educational assistance, and career advancement opportunities.

7. TECHNOLOGY AND COMMUNICATION

7.1 COMPUTER AND INTERNET USE
Company-provided technology resources are to be used primarily for business purposes. Personal use should be limited and must not interfere with work responsibilities.

7.2 CONFIDENTIALITY
Employees must protect confidential company information and respect the privacy of customer and employee data.

8. LEAVE POLICIES

8.1 PAID TIME OFF (PTO)
Full-time employees accrue PTO based on length of service. PTO requests should be submitted in advance and approved by supervisors.

8.2 FAMILY AND MEDICAL LEAVE
Eligible employees may take unpaid leave for qualifying family and medical reasons as provided by applicable law.

9. PERFORMANCE MANAGEMENT

Regular performance evaluations help ensure that employees understand expectations and receive feedback on their performance. These evaluations also identify opportunities for professional development.

10. DISCIPLINARY PROCEDURES

When performance or conduct issues arise, we follow a progressive discipline process designed to help employees improve while maintaining workplace standards.

11. EMPLOYEE RESOURCES

11.1 HUMAN RESOURCES DEPARTMENT
The HR Department is available to assist with questions about policies, benefits, and workplace concerns.

11.2 EMPLOYEE ASSISTANCE PROGRAM
Confidential counseling and support services are available to help employees deal with personal and work-related challenges.

═══════════════════════════════════════════════════════════════

ACKNOWLEDGMENT

I acknowledge that I have received and read this Employee Handbook. I understand that it is my responsibility to comply with the policies and procedures outlined herein.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

This handbook is subject to change. Updates will be communicated to all employees.

Document Control:
- Document ID: EH-2024-001
- Last Review Date: December 1, 2023
- Next Review Date: December 1, 2024
- Document Owner: Human Resources Department`
      },
      "Safety Manual": {
        content: `WORKPLACE SAFETY MANUAL

SAFETY FIRST - ALWAYS

EFFECTIVE DATE: January 1, 2024
VERSION: 2.3
APPROVED BY: Safety Committee

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Safety Policy Statement ................................... 3
2. General Safety Rules ..................................... 4
3. Emergency Procedures ..................................... 6
4. Personal Protective Equipment ............................ 8
5. Hazard Communication ..................................... 10
6. Incident Reporting ....................................... 12
7. Training Requirements .................................... 14
8. Safety Committee ......................................... 16

═══════════════════════════════════════════════════════════════

1. SAFETY POLICY STATEMENT

The safety and health of our employees is our highest priority. We are committed to providing a safe and healthy work environment for all employees, contractors, and visitors.

Every employee has the right to a safe workplace and the responsibility to work safely. Management is committed to providing the resources necessary to maintain a safe work environment and expects all employees to actively participate in our safety program.

2. GENERAL SAFETY RULES

2.1 BASIC SAFETY PRINCIPLES
- Follow all safety procedures and guidelines
- Report unsafe conditions immediately
- Use appropriate personal protective equipment
- Keep work areas clean and organized
- Never take shortcuts that compromise safety

2.2 PROHIBITED ACTIVITIES
- Horseplay or practical jokes
- Operating equipment without proper training
- Removing or disabling safety devices
- Working under the influence of drugs or alcohol

3. EMERGENCY PROCEDURES

3.1 FIRE EMERGENCY
- Activate the nearest fire alarm
- Evacuate immediately using designated routes
- Proceed to assembly areas
- Do not use elevators
- Do not re-enter the building until authorized

3.2 MEDICAL EMERGENCY
- Call 911 immediately for serious injuries
- Notify your supervisor and security
- Provide first aid only if trained to do so
- Do not move seriously injured persons

3.3 SEVERE WEATHER
- Monitor weather alerts and warnings
- Follow instructions from management
- Move to designated shelter areas if required
- Remain in shelter until all-clear is given

4. PERSONAL PROTECTIVE EQUIPMENT (PPE)

4.1 GENERAL REQUIREMENTS
Appropriate PPE must be worn when required by job duties or workplace conditions. This may include:
- Safety glasses or goggles
- Hard hats
- Safety shoes
- Gloves
- Hearing protection
- Respiratory protection

4.2 PPE MAINTENANCE
- Inspect PPE before each use
- Replace damaged or worn equipment
- Clean and store PPE properly
- Report defective equipment immediately

5. HAZARD COMMUNICATION

5.1 CHEMICAL SAFETY
- Read and understand Safety Data Sheets (SDS)
- Follow proper handling procedures
- Use appropriate PPE when working with chemicals
- Store chemicals according to manufacturer instructions

5.2 LABELING REQUIREMENTS
All hazardous materials must be properly labeled with:
- Product identification
- Hazard warnings
- Precautionary statements
- Supplier information

6. INCIDENT REPORTING

6.1 REPORTING REQUIREMENTS
All incidents, including near misses, must be reported immediately to:
- Your immediate supervisor
- The Safety Department
- Human Resources (for injuries)

6.2 INVESTIGATION PROCESS
All incidents will be thoroughly investigated to:
- Determine root causes
- Implement corrective actions
- Prevent similar occurrences
- Comply with regulatory requirements

7. TRAINING REQUIREMENTS

7.1 NEW EMPLOYEE ORIENTATION
All new employees must complete safety orientation training before beginning work assignments.

7.2 ONGOING TRAINING
Regular safety training is provided on topics including:
- Job-specific safety procedures
- Emergency response
- Hazard recognition
- PPE use and maintenance

8. SAFETY COMMITTEE

Our Safety Committee meets monthly to:
- Review incident reports and trends
- Evaluate safety procedures
- Recommend improvements
- Promote safety awareness

Committee members represent all departments and levels of the organization.

═══════════════════════════════════════════════════════════════

SAFETY CONTACTS

Emergency: 911
Security: Extension 2911
Safety Department: Extension 2500
Human Resources: Extension 2100

═══════════════════════════════════════════════════════════════

Remember: Safety is everyone's responsibility!

Document Control:
- Document ID: SM-2024-001
- Last Review Date: November 15, 2023
- Next Review Date: November 15, 2024
- Document Owner: Safety Committee`
      }
    };

    return documentTemplates[document.name as keyof typeof documentTemplates] || {
      content: `Document: ${document.name}\n\nThis is a sample document content for ${document.name}.\n\nFile Type: ${document.type}\nFile Size: ${document.size}\n\nThis document contains important information relevant to your role and responsibilities within the organization. Please review carefully and contact HR if you have any questions.`
    };
  };

  // State for document modals
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [editDocumentName, setEditDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // PDF Viewer State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for PDF files
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setUploadProgress(0); // Reset progress on new file selection
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        setSelectedFile(null);
      }
    }
  };

  const handleAddDocument = async () => {
    if (!newDocumentName.trim() || !selectedFile) {
      toast({
        title: "Validation Error",
        description: "Please provide a document name and upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDocument(true);
    try {
      // Simulate saving the document
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newDoc = {
        id: hrDocuments.length + 1,
        name: newDocumentName,
        type: "PDF", // Assuming PDF for now
        size: `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`,
        visibleToAll: true, // Default visibility
      };

      setHrDocuments((prev) => [...prev, newDoc]);
      setShowAddDocumentModal(false);
      setNewDocumentName('');
      setSelectedFile(null);
      setUploadProgress(0);

      toast({
        title: "Document Added",
        description: `${newDocumentName} has been successfully added.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDocument(false);
    }
  };

  const handleEditDocumentModal = (document: any) => {
    setSelectedDocument(document);
    setEditDocumentName(document.name);
    setShowEditDocumentModal(true);
    setSelectedFile(null); // Reset selected file for editing
    setUploadProgress(0);
  };

  const handleDocumentDelete = (docId: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      setHrDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
      });
    }
  };

  const handleDocumentView = (document: any) => {
    setSelectedDocument(document);
    setDocumentModalType("view");
    setShowDocumentModal(true);
    // Simulate setting total pages for PDF viewer
    setTotalPages(Math.floor(Math.random() * 10) + 5); // Random pages between 5 and 14
    setCurrentPage(1);
    setZoomLevel(1);
  };

  const handlePdfNavigation = (direction: 'prev' | 'next') => {
    setCurrentPage(prev => {
      if (direction === 'next') {
        return Math.min(prev + 1, totalPages);
      } else {
        return Math.max(1, prev - 1);
      }
    });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  const parseDocumentContent = (document: any) => {
    const documentTemplates = {
      "Code of Conduct": {
        content: `COMPANY CODE OF CONDUCT

EFFECTIVE DATE: January 1, 2024
VERSION: 2.1
APPROVED BY: Board of Directors

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Introduction and Purpose ................................. 3
2. Professional Conduct Standards .......................... 4
3. Confidentiality and Information Security ............... 6
4. Conflict of Interest Policy ............................. 8
5. Compliance with Laws and Regulations .................... 10
6. Reporting Violations and Whistleblower Protection ...... 12
7. Disciplinary Actions and Consequences .................. 14
8. Acknowledgment and Certification ........................ 16

═══════════════════════════════════════════════════════════════

1. INTRODUCTION AND PURPOSE

This Code of Conduct establishes the ethical standards and behavioral expectations for all employees, contractors, and representatives of our organization. It serves as a guide for making ethical decisions and maintaining the highest standards of professional integrity.

Our commitment to ethical business practices is fundamental to our success and reputation. Every individual associated with our organization is expected to read, understand, and comply with this Code of Conduct.

2. PROFESSIONAL CONDUCT STANDARDS

2.1 RESPECT AND DIGNITY
All employees must treat colleagues, customers, suppliers, and stakeholders with respect and dignity. Discrimination, harassment, or intimidation of any kind will not be tolerated.

2.2 HONESTY AND INTEGRITY
Employees must conduct themselves with honesty and integrity in all business dealings. This includes accurate reporting, truthful communication, and ethical decision-making.

2.3 PROFESSIONAL COMPETENCE
Employees are expected to maintain and develop their professional skills and knowledge to perform their duties effectively and efficiently.

3. CONFIDENTIALITY AND INFORMATION SECURITY

3.1 CONFIDENTIAL INFORMATION
Employees must protect confidential and proprietary information belonging to the company, customers, and business partners. This obligation continues even after employment ends.

3.2 DATA PROTECTION
All personal and sensitive data must be handled in accordance with applicable privacy laws and company policies. Unauthorized access, use, or disclosure of such information is strictly prohibited.

4. CONFLICT OF INTEREST POLICY

4.1 IDENTIFICATION OF CONFLICTS
Employees must identify and disclose any actual or potential conflicts of interest that may affect their ability to perform their duties objectively.

4.2 OUTSIDE ACTIVITIES
Employees should avoid outside activities, investments, or relationships that could interfere with their job performance or create conflicts with company interests.

5. COMPLIANCE WITH LAWS AND REGULATIONS

All employees must comply with applicable laws, regulations, and company policies. Ignorance of the law is not an acceptable excuse for non-compliance.

6. REPORTING VIOLATIONS

Employees are encouraged to report suspected violations of this Code of Conduct through appropriate channels. The company prohibits retaliation against individuals who report violations in good faith.

7. DISCIPLINARY ACTIONS

Violations of this Code of Conduct may result in disciplinary action, up to and including termination of employment, depending on the severity of the violation.

8. ACKNOWLEDGMENT

By signing below, I acknowledge that I have read, understood, and agree to comply with this Code of Conduct.

Employee Signature: ___________________________ Date: ___________

Print Name: ___________________________

═══════════════════════════════════════════════════════════════

For questions or clarifications regarding this Code of Conduct, please contact the Human Resources Department.

Document Control:
- Document ID: COC-2024-001
- Last Review Date: December 15, 2023
- Next Review Date: December 15, 2024
- Document Owner: Human Resources Department`
      },
      "Employee Handbook": {
        content: `EMPLOYEE HANDBOOK

WELCOME TO OUR ORGANIZATION

EFFECTIVE DATE: January 1, 2024
VERSION: 3.2
APPROVED BY: Executive Leadership Team

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

1. Welcome Message .......................................... 3
2. Company Overview ......................................... 4
3. Employment Policies ...................................... 6
4. Compensation and Benefits ................................ 12
5. Work Environment and Safety .............................. 18
6. Professional Development ................................. 22
7. Technology and Communication ............................. 25
8. Leave Policies ........................................... 28
9. Performance Management ................................... 32
10. Disciplinary Procedures ................................. 35
11. Employee Resources ...................................... 38

═══════════════════════════════════════════════════════════════

1. WELCOME MESSAGE

Dear Team Member,

Welcome to our organization! We are delighted to have you join our team and look forward to the contributions you will make to our continued success.

This Employee Handbook serves as your comprehensive guide to our company policies, procedures, benefits, and expectations. Please take the time to read through this handbook carefully and keep it as a reference throughout your employment.

Our success depends on the dedication, creativity, and teamwork of our employees. We are committed to providing a positive work environment that promotes professional growth, work-life balance, and mutual respect.

If you have any questions about the information contained in this handbook, please don't hesitate to contact the Human Resources Department.

Welcome aboard!

Sincerely,
The Executive Leadership Team

2. COMPANY OVERVIEW

2.1 OUR MISSION
To deliver exceptional products and services while maintaining the highest standards of integrity, innovation, and customer satisfaction.

2.2 OUR VALUES
- Integrity: We conduct business with honesty and transparency
- Excellence: We strive for the highest quality in everything we do
- Innovation: We embrace change and continuously improve
- Teamwork: We collaborate effectively to achieve common goals
- Respect: We value diversity and treat everyone with dignity

2.3 ORGANIZATIONAL STRUCTURE
Our organization is structured to promote efficiency, accountability, and clear communication. Each department plays a vital role in achieving our overall objectives.

3. EMPLOYMENT POLICIES

3.1 EQUAL EMPLOYMENT OPPORTUNITY
We are committed to providing equal employment opportunities to all qualified individuals regardless of race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status.

3.2 AT-WILL EMPLOYMENT
Employment with our organization is at-will, meaning that either the employee or the company may terminate the employment relationship at any time, with or without cause or notice.

3.3 BACKGROUND CHECKS
All employment offers are contingent upon successful completion of background checks as required by law and company policy.

4. COMPENSATION AND BENEFITS

4.1 PAY PERIODS
Employees are paid bi-weekly on Fridays. If a payday falls on a holiday, payment will be made on the preceding business day.

4.2 OVERTIME
Non-exempt employees will receive overtime pay at one and one-half times their regular rate for hours worked in excess of 40 hours per week.

4.3 BENEFITS OVERVIEW
We offer a comprehensive benefits package including:
- Health insurance
- Dental and vision coverage
- Retirement savings plan with company matching
- Paid time off
- Professional development opportunities

5. WORK
