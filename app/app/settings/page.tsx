"use client"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Settings, Calculator, Shield, Wifi, Bell, RefreshCw, Plus, Loader2 } from "lucide-react"

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

const isDemoMode = () => {
  if (typeof window !== "undefined") {
    const demoSession = document.cookie.includes("demo-session=active")
    const demoProfile = localStorage.getItem("demo_profile")
    return demoSession || !!demoProfile
  }
  return false
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company")
  const [selectedCurrency, setSelectedCurrency] = useState("ghs")
  const [monthlyIncomePreview, setMonthlyIncomePreview] = useState(8333) // Default monthly equivalent of 100k annual
  const [isSavingPayroll, setIsSavingPayroll] = useState(false)
  const [isSavingTax, setIsSavingTax] = useState(false)

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
  const [showDocumentPreview, setShowDocumentPreview] = useState(false)
  const [documentPreviewContent, setDocumentPreviewContent] = useState("")

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
  const [showEditSubsidiary, setShowEditSubsidiary] = useState<boolean>(false)
  const [showSubsidiaryDetails, setShowSubsidiaryDetails] = useState<boolean>(false)
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

  const [isSaving, setIsSaving] = useState(false)

  const [hrDocuments, setHrDocuments] = useState([
    { id: 1, name: "Employee Handbook", type: "PDF", size: "2.4 MB", visibleToAll: true },
    { id: 2, name: "Code of Conduct", type: "PDF", size: "1.8 MB", visibleToAll: false },
  ])
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

  const [policyInsights, setPolicyInsights] = useState<Record<string, string>>({})
  const [loadingInsights, setLoadingInsights] = useState<Record<string, boolean>>({})

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

  const [payeTaxBands, setPayeTaxBands] = useState([
    { band: 0, rate: 0, from: 0, to: 365, description: "% on first", cumulative: 0 },
    { band: 5, rate: 5, from: 366, to: 475, description: "% on next", cumulative: 0 },
    { band: 10, rate: 10, from: 476, to: 615, description: "% on next", cumulative: 5.45 },
    { band: 17.5, rate: 17.5, from: 616, to: 3365, description: "% on next", cumulative: 19.35 },
    { band: 25, rate: 25, from: 3366, to: 20000, description: "% on next", cumulative: 500.48 },
    { band: 30, rate: 30, from: 20001, to: 50000, description: "% on next", cumulative: 4659.98 },
    { band: 35, rate: 35, from: 50001, to: null, description: "% on remaining amount", cumulative: 13659.98 },
  ])

  const [ssnitRates, setSsnitRates] = useState({
    employee: 5.5,
    employer: 13,
    total: 18.5,
  })
  const [tier2Rates, setTier2Rates] = useState({
    employee: 5.5,
    employer: 5.5,
    total: 11.0,
  })
  const [tier3Rates, setTier3Rates] = useState({
    employee: 5,
    employer: 5,
    total: 10.0,
  })

  const currencyConfig = {
    ghs: {
      symbol: "₵",
      name: "Ghana Cedis (GHS)",
      country: "Ghana",
      apiEndpoint: "https://api.gra.gov.gh/tax-rates",
      lastUpdated: "2024-01-01",
      version: "2024.1",
      taxBands: [
        { band: 0, rate: 0, from: 0, to: 365, description: "% on first", cumulative: 0, annual: false },
        { band: 5, rate: 5, from: 366, to: 475, description: "% on next", cumulative: 0, annual: false },
        { band: 10, rate: 10, from: 476, to: 615, description: "% on next", cumulative: 5.45, annual: false },
        { band: 17.5, rate: 17.5, from: 616, to: 3365, description: "% on next", cumulative: 19.35, annual: false },
        { band: 25, rate: 25, from: 3366, to: 20000, description: "% on next", cumulative: 500.48, annual: false },
        { band: 30, rate: 30, from: 20001, to: 50000, description: "% on next", cumulative: 4659.98, annual: false },
        {
          band: 35,
          rate: 35,
          from: 50001,
          to: null,
          description: "% on remaining amount",
          cumulative: 13659.98,
          annual: false,
        },
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
      country: "USA",
      apiEndpoint: "https://api.irs.gov/tax-rates",
      lastUpdated: "2024-01-01",
      version: "2024.1",
      taxBands: [
        { band: 0, rate: 0, from: 0, to: 916, description: "% on first", cumulative: 0, annual: false },
        { band: 10, rate: 10, from: 917, to: 3083, description: "% on next", cumulative: 0, annual: false },
        { band: 12, rate: 12, from: 3084, to: 8333, description: "% on next", cumulative: 216.6, annual: false },
        { band: 22, rate: 22, from: 8334, to: 17500, description: "% on next", cumulative: 846.48, annual: false },
        { band: 24, rate: 24, from: 17501, to: 27083, description: "% on next", cumulative: 2863.0, annual: false },
        { band: 32, rate: 32, from: 27084, to: 54167, description: "% on next", cumulative: 5162.92, annual: false },
        {
          band: 35,
          rate: 35,
          from: 54168,
          to: null,
          description: "% on remaining amount",
          cumulative: 13829.44,
          annual: false,
        },
      ],
      socialSecurity: {
        employee: 6.2,
        employer: 6.2,
        total: 12.4,
      },
      tier2: {
        employee: 1.45,
        employer: 1.45,
        total: 2.9,
      },
      tier3: {
        employee: 0,
        employer: 0,
        total: 0,
      },
    },
    ngn: {
      symbol: "₦",
      name: "Nigerian Naira (NGN)",
      country: "Nigeria",
      apiEndpoint: "https://api.firs.gov.ng/tax-rates",
      lastUpdated: "2024-01-01",
      version: "2024.1",
      taxBands: [
        { band: 0, rate: 0, from: 0, to: 25000, description: "% on first", cumulative: 0, annual: false },
        { band: 7.5, rate: 7.5, from: 25001, to: 50000, description: "% on next", cumulative: 0, annual: false },
        { band: 11, rate: 11, from: 50001, to: 83333, description: "% on next", cumulative: 1875, annual: false },
        { band: 15, rate: 15, from: 83334, to: 133333, description: "% on next", cumulative: 5541.63, annual: false },
        { band: 19, rate: 19, from: 133334, to: 208333, description: "% on next", cumulative: 12541.48, annual: false },
        { band: 21, rate: 21, from: 208334, to: 416667, description: "% on next", cumulative: 26791.29, annual: false },
        {
          band: 24,
          rate: 24,
          from: 416668,
          to: null,
          description: "% on remaining amount",
          cumulative: 70541.22,
          annual: false,
        },
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

  const getCurrencyConfig = (currency: string) => {
    return currencyConfig[currency as keyof typeof currencyConfig] || currencyConfig.ghs
  }

  const calculateTax = (monthlyIncome: number, currency: string = selectedCurrency) => {
    const config = getCurrencyConfig(currency)
    if (!config) return 0

    let tax = 0
    let remainingIncome = monthlyIncome

    for (const band of config.taxBands) {
      if (remainingIncome <= 0) break

      const bandMax = band.to || Number.POSITIVE_INFINITY
      const bandMin = band.from || 0
      const bandIncome = Math.min(remainingIncome, bandMax - bandMin)

      if (bandIncome > 0) {
        tax += (bandIncome * band.rate) / 100
        remainingIncome -= bandIncome
      }
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

  const syncWithGovernmentAPI = async (country: string) => {
    try {
      console.log(`[v0] Syncing tax rates for ${country}...`)

      // Simulate API call
      const response = await new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              success: true,
              data: currencyConfig[country as keyof typeof currencyConfig]?.taxBands || [],
              version: "2024.1",
              confidence: 95,
            }),
          2000,
        ),
      )

      setApiStatus((prev) => ({
        ...prev,
        [country]: {
          connected: true,
          lastSync: new Date().toISOString(),
          status: "active",
        },
      }))

      // Add notification
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "sync_success",
          priority: "medium",
          title: `${country.toUpperCase()} Tax Rates Synced`,
          message: `Successfully updated tax rates from government API`,
          timestamp: new Date().toISOString(),
          read: false,
        },
      ])

      return response
    } catch (error) {
      console.error(`[v0] Failed to sync ${country} tax rates:`, error)
      throw error
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

  const updateSsnitRates = (field: "employee" | "employer", value: number) => {
    const newRates = { ...ssnitRates, [field]: value }
    newRates.total = newRates.employee + newRates.employer
    setSsnitRates(newRates)
  }

  const updateTier2Rates = (field: "employee" | "employer", value: number) => {
    const newRates = { ...tier2Rates, [field]: value }
    newRates.total = newRates.employee + newRates.employer
    setTier2Rates(newRates)
  }

  const updateTier3Rates = (field: "employee" | "employer", value: number) => {
    const newRates = { ...tier3Rates, [field]: value }
    newRates.total = newRates.employee + newRates.employer
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

  // Parse document content for preview/download
  const parseDocumentContent = (document: any) => {
    if (!document) return ""

    // Mock document content for demo purposes
    const mockContent = {
      "Employee Handbook": `EMPLOYEE HANDBOOK
      
Welcome to our company! This handbook contains important information about our policies and procedures.

1. CODE OF CONDUCT
All employees are expected to maintain the highest standards of professional conduct.

2. WORKING HOURS
Standard working hours are 8:00 AM to 5:00 PM, Monday through Friday.

3. LEAVE POLICIES
Annual leave, sick leave, and other leave types are outlined in this section.

4. BENEFITS
Information about health insurance, retirement plans, and other benefits.`,

      "Code of Conduct": `CODE OF CONDUCT
      
This document outlines the ethical standards and behavioral expectations for all employees.

1. INTEGRITY
Act with honesty and integrity in all business dealings.

2. RESPECT
Treat all colleagues, customers, and partners with respect and dignity.

3. CONFIDENTIALITY
Maintain confidentiality of sensitive company and customer information.

4. COMPLIANCE
Follow all applicable laws, regulations, and company policies.`,
    }

    return mockContent[document.name] || `Document content for ${document.name}`
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
      }
    }
  }

  const loadEmployees = async () => {
    if (isDemoMode()) {
      setEmployees([
        {
          id: "1",
          first_name: "John",
          last_name: "Doe",
          full_name: "John Doe",
          corporate_email: "john.doe@company.com",
          personal_email: "john@personal.com",
          position: "Software Engineer",
          department: "Technology",
          status: "active",
        },
        {
          id: "2",
          first_name: "Jane",
          last_name: "Smith",
          full_name: "Jane Smith",
          corporate_email: "jane.smith@company.com",
          personal_email: "jane@personal.com",
          position: "HR Manager",
          department: "Human Resources",
          status: "active",
        },
      ])
      return
    }

    try {
      const { data, error } = await supabase.from("employees").select("*")
      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error("[v0] Error loading employees:", error)
    }
  }

  const loadSubsidiaries = async () => {
    if (isDemoMode()) {
      setSubsidiaries([
        {
          id: "1",
          company_id: "demo-company-001",
          name: "Akwaaba Tech Solutions",
          tax_id: "C0012345679",
          ssnit_number: "1234567891",
          industry: "Software Development",
          status: "active",
          email_address: "solutions@akwaabatech.com",
          phone_number: "0249397961",
          address: "456 Independence Ave, Accra, Ghana",
          divisions: ["Development", "Support"],
          departments: ["Engineering", "QA"],
          locations: ["Accra", "Kumasi"],
          divisions_count: 2,
          departments_count: 2,
          locations_count: 2,
          employee_count: 15,
        },
      ])
      return
    }

    try {
      const { data, error } = await supabase.from("subsidiaries").select("*")
      if (error) throw error
      setSubsidiaries(data || [])
    } catch (error) {
      console.error("[v0] Error loading subsidiaries:", error)
    }
  }

  const loadRoles = async () => {
    if (isDemoMode()) {
      setRoles([
        {
          id: "1",
          name: "Admin",
          description: "Full system access",
          permissions: ["read", "write", "delete", "admin"],
          user_count: 2,
        },
        {
          id: "2",
          name: "HR Manager",
          description: "Human resources management",
          permissions: ["read", "write"],
          user_count: 3,
        },
        {
          id: "3",
          name: "Employee",
          description: "Basic employee access",
          permissions: ["read"],
          user_count: 25,
        },
      ])
      return
    }

    try {
      const { data, error } = await supabase.from("roles").select("*")
      if (error) throw error
      setRoles(data || [])
    } catch (error) {
      console.error("[v0] Error loading roles:", error)
    }
  }

  // Save functions
  const savePayrollConfiguration = async () => {
    setIsSavingPayroll(true)
    try {
      console.log("[v0] Saving payroll configuration...")

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Payroll Configuration Saved",
        description: "Your payroll settings have been updated successfully.",
      })
    } catch (error) {
      console.error("[v0] Error saving payroll configuration:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save payroll configuration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingPayroll(false)
    }
  }

  const saveTaxConfiguration = async () => {
    setIsSavingTax(true)
    try {
      console.log("[v0] Saving tax configuration...")

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Tax Configuration Saved",
        description: "Your tax settings have been updated successfully.",
      })
    } catch (error) {
      console.error("[v0] Error saving tax configuration:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save tax configuration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingTax(false)
    }
  }

  useEffect(() => {
    loadCompanyData()
    loadEmployees()
    loadSubsidiaries()
    loadRoles()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your organization settings and configurations</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="multi-company">Multi-Company</TabsTrigger>
          <TabsTrigger value="hr">HR</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="space-y-6">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="payFrequency">Pay Frequency</Label>
                  <Select defaultValue="monthly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
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
                      <SelectItem value="ngn">Nigerian Naira (NGN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="minimumWage">Minimum Wage ({getCurrencyConfig(selectedCurrency).symbol})</Label>
                  <Input id="minimumWage" type="number" defaultValue="18.15" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="weekdayOvertimeRate">Weekday Overtime Rate Multiplier</Label>
                  <Input id="weekdayOvertimeRate" type="number" step="0.1" defaultValue="1.5" />
                </div>
                <div>
                  <Label htmlFor="weekendOvertimeRate">Weekend Overtime Rate Multiplier</Label>
                  <Input id="weekendOvertimeRate" type="number" step="0.1" defaultValue="2" />
                </div>
                <div>
                  <Label htmlFor="payrollCutoffDay">Payroll Cutoff Day</Label>
                  <Input id="payrollCutoffDay" type="number" min="1" max="31" defaultValue="25" />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch id="autoCalculatePAYE" defaultChecked />
                  <Label htmlFor="autoCalculatePAYE">Auto-calculate PAYE</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="autoCalculateSSNIT" defaultChecked />
                  <Label htmlFor="autoCalculateSSNIT">Auto-calculate SSNIT</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="autoCalculateProvidentFund" />
                  <Label htmlFor="autoCalculateProvidentFund">Auto-calculate Provident Fund (Tier 3)</Label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={savePayrollConfiguration} disabled={isSavingPayroll}>
                  {isSavingPayroll && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                      disabled={!apiStatus[selectedCurrency as keyof typeof apiStatus]?.connected}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync API
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log("[v0] Adding new tax band...")
                      }}
                    >
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
                            {band.cumulative ? band.cumulative.toLocaleString() : "0"}
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

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium mb-2">Tax Calculation Preview</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label htmlFor="monthlyIncome" className="text-gray-600">
                        Monthly Income:
                      </Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-gray-600">{getCurrencyConfig(selectedCurrency).symbol}</span>
                        <Input
                          id="monthlyIncome"
                          type="number"
                          value={monthlyIncomePreview}
                          onChange={(e) => setMonthlyIncomePreview(Number(e.target.value))}
                          className="w-32"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Tax Due: </span>
                      <span className="font-medium text-red-600">
                        {getCurrencyConfig(selectedCurrency).symbol}
                        {calculateTax(monthlyIncomePreview).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Effective Rate: </span>
                      <span className="font-medium">
                        {((calculateTax(monthlyIncomePreview) / monthlyIncomePreview) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h5 className="font-medium mb-3 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    SSNIT Rates
                  </h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Employee:</span>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={ssnitRates.employee}
                          onChange={(e) => updateSsnitRates("employee", Number(e.target.value))}
                          className="w-16 h-8 text-sm"
                        />
                        <span className="text-sm">%</span>
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Employer:</span>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={ssnitRates.employer}
                          onChange={(e) => updateSsnitRates("employer", Number(e.target.value))}
                          className="w-16 h-8 text-sm"
                        />
                        <span className="text-sm">%</span>
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">Total:</span>
                      <span className="font-bold text-blue-600">{ssnitRates.total.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-3 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Tier 2 Rates
                  </h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Employee:</span>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={tier2Rates.employee}
                          onChange={(e) => updateTier2Rates("employee", Number(e.target.value))}
                          className="w-16 h-8 text-sm"
                        />
                        <span className="text-sm">%</span>
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Employer:</span>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={tier2Rates.employer}
                          onChange={(e) => updateTier2Rates("employer", Number(e.target.value))}
                          className="w-16 h-8 text-sm"
                        />
                        <span className="text-sm">%</span>
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">Total:</span>
                      <span className="font-bold text-blue-600">{tier2Rates.total.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-3 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Tier 3 Rates
                  </h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Employee:</span>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={tier3Rates.employee}
                          onChange={(e) => updateTier3Rates("employee", Number(e.target.value))}
                          className="w-16 h-8 text-sm"
                        />
                        <span className="text-sm">%</span>
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Employer:</span>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={tier3Rates.employer}
                          onChange={(e) => updateTier3Rates("employer", Number(e.target.value))}
                          className="w-16 h-8 text-sm"
                        />
                        <span className="text-sm">%</span>
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">Total:</span>
                      <span className="font-bold text-blue-600">{tier3Rates.total.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h5 className="font-medium mb-3 flex items-center">
                    <Wifi className="w-4 h-4 mr-2" />
                    API Status
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Ghana</span>
                      <Badge variant={apiStatus.ghana.connected ? "default" : "destructive"}>
                        {apiStatus.ghana.connected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Nigeria</span>
                      <Badge variant={apiStatus.nigeria.connected ? "default" : "destructive"}>
                        {apiStatus.nigeria.connected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">USA</span>
                      <Badge variant={apiStatus.usa.connected ? "default" : "destructive"}>
                        {apiStatus.usa.connected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-3 flex items-center">
                    <Bell className="w-4 h-4 mr-2" />
                    Recent Updates
                  </h5>
                  <div className="space-y-2">
                    {notifications.slice(0, 3).map((notification) => (
                      <div key={notification.id} className="text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="font-medium">{notification.title}</span>
                        </div>
                        <p className="text-gray-500 text-xs ml-4">{notification.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveTaxConfiguration} disabled={isSavingTax}>
                  {isSavingTax && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Tax Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tab contents would go here */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Manage your company details and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Company settings content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multi-company">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Company Management</CardTitle>
              <CardDescription>Manage subsidiaries and related companies</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Multi-company settings content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hr">
          <Card>
            <CardHeader>
              <CardTitle>HR Configuration</CardTitle>
              <CardDescription>Configure HR policies and procedures</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">HR settings content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure system notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notification settings content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Role management content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>Configure access permissions and restrictions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Access control content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security policies and authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Security settings content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
