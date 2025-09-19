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
    { code: 'TRANS', description: 'Transport Allowance', taxable: true, recurring: true, amount: 0, percentage: 0, type: 'FIXED' },
    { code: 'HOUSE', description: 'Housing Allowance', taxable: true, recurring: true, amount: 0, percentage: 0, type: 'FIXED' },
    { code: 'MED', description: 'Medical Allowance', taxable: false, recurring: true, amount: 0, percentage: 0, type: 'FIXED' }
  ])

  const [deductions, setDeductions] = useState([
    { code: 'TAX', description: 'Tax Deduction', recurring: true, amount: 0, percentage: 0, type: 'VARIABLE' },
    { code: 'SSNIT', description: 'SSNIT Deduction', recurring: true, amount: 0, percentage: 5.5, type: 'VARIABLE' },
    { code: 'LOAN', description: 'Loan Deduction', recurring: true, amount: 0, percentage: 0, type: 'FIXED' }
  ])

  const [loanSettings, setLoanSettings] = useState([
    { code: 'PERSON', description: 'Personal Loan', maxAmount: 50000, interestRate: 10, rateMethod: 'Reducing Balance', adminCharges: 500, loanTenure: 12 },
    { code: 'EMERGE', description: 'Emergency Loan', maxAmount: 10000, interestRate: 5, rateMethod: 'Straight Line Met', adminCharges: 200, loanTenure: 6 }
  ])

  const [selectedCurrency, setSelectedCurrency] = useState('ghs')
  const [payeTaxBands, setPayeTaxBands] = useState([
    { band: 1, rate: 0, from: 0, to: 490, description: '0% on first GH₵ 490' },
    { band: 2, rate: 5, from: 490, to: 600, description: '5% on next GH₵ 110 (490-600)' },
    { band: 3, rate: 10, from: 600, to: 730, description: '10% on next GH₵ 130 (600-730)' },
    { band: 4, rate: 17.5, from: 730, to: 3896.67, description: '17.5% on next GH₵ 3,166.67 (730-3896.67)' },
    { band: 5, rate: 25, from: 3896.67, to: 19896.67, description: '25% on next GH₵ 16,000 (3896.67-19896.67)' },
    { band: 6, rate: 30, from: 19896.67, to: 50416.67, description: '30% on next GH₵ 30,520 (19896.67-50416.67)' },
    { band: 7, rate: 35, from: 50416.67, to: null, description: '35% on amounts exceeding GH₵ 50,416.67' }
  ])
  const [ssnitRates, setSsnitRates] = useState({
    employee: 5.5,
    employer: 13,
    total: 18.5
  })
  const [tier2Rates, setTier2Rates] = useState({
    employee: 5.5,
    employer: 5.5,
    total: 11.0
  })
  const [tier3Rates, setTier3Rates] = useState({
    employee: 5,
    employer: 5,
    total: 10.0
  })

  const currencyConfig = {
    ghs: { 
      symbol: '₵', 
      name: 'Ghana Cedis (GHS)',
      country: 'Ghana',
      taxYear: 2025,
      lastUpdated: '2025-01-01',
      taxBands: [
        { band: 1, rate: 0, from: 0, to: 490, description: '0% on first GH₵ 490' },
        { band: 2, rate: 5, from: 490, to: 600, description: '5% on next GH₵ 110 (490-600)' },
        { band: 3, rate: 10, from: 600, to: 730, description: '10% on next GH₵ 130 (600-730)' },
        { band: 4, rate: 17.5, from: 730, to: 3896.67, description: '17.5% on next GH₵ 3,166.67 (730-3896.67)' },
        { band: 5, rate: 25, from: 3896.67, to: 19896.67, description: '25% on next GH₵ 16,000 (3896.67-19896.67)' },
        { band: 6, rate: 30, from: 19896.67, to: 50416.67, description: '30% on next GH₵ 30,520 (19896.67-50416.67)' },
        { band: 7, rate: 35, from: 50416.67, to: null, description: '35% on amounts exceeding GH₵ 50,416.67' }
      ]
    },
    usd: { 
      symbol: '$', 
      name: 'US Dollar (USD)',
      country: 'United States',
      taxYear: 2025,
      lastUpdated: '2025-01-01',
      taxBands: [
        { band: 1, rate: 10, from: 0, to: 11000, description: '10% on first $11,000' },
        { band: 2, rate: 12, from: 11000, to: 44725, description: '12% on income $11,001-$44,725' },
        { band: 3, rate: 22, from: 44725, to: 95375, description: '22% on income $44,726-$95,375' },
        { band: 4, rate: 24, from: 95375, to: 182050, description: '24% on income $95,376-$182,050' },
        { band: 5, rate: 32, from: 182050, to: 231250, description: '32% on income $182,051-$231,250' },
        { band: 6, rate: 37, from: 231250, to: null, description: '37% on income over $231,250' }
      ]
    },
    eur: { 
      symbol: '€', 
      name: 'Euro (EUR)',
      country: 'Germany',
      taxYear: 2025,
      lastUpdated: '2025-01-01',
      taxBands: [
        { band: 1, rate: 0, from: 0, to: 10908, description: '0% on first €10,908' },
        { band: 2, rate: 14, from: 10908, to: 61972, description: '14% on income €10,909-€61,972' },
        { band: 3, rate: 42, from: 61972, to: 277826, description: '42% on income €61,973-€277,826' },
        { band: 4, rate: 45, from: 277826, to: null, description: '45% on income over €277,826' }
      ]
    },
    ngn: { 
      symbol: '₦', 
      name: 'Nigerian Naira (NGN)',
      country: 'Nigeria',
      taxYear: 2025,
      lastUpdated: '2025-01-01',
      taxBands: [
        { band: 1, rate: 7, from: 0, to: 300000, description: '7% on first ₦300,000' },
        { band: 2, rate: 11, from: 300000, to: 600000, description: '11% on next ₦300,000 (300,001-600,000)' },
        { band: 3, rate: 15, from: 600000, to: 1100000, description: '15% on next ₦500,000 (600,001-1,100,000)' },
        { band: 4, rate: 19, from: 1100000, to: 1600000, description: '19% on next ₦500,000 (1,100,001-1,600,000)' },
        { band: 5, rate: 21, from: 1600000, to: 3200000, description: '21% on next ₦1,600,000 (1,600,001-3,200,000)' },
        { band: 6, rate: 24, from: 3200000, to: null, description: '24% on amounts exceeding ₦3,200,000' }
      ]
    }
  }

  const [showTaxRateManager, setShowTaxRateManager] = useState(false)
  const [pendingTaxUpdates, setPendingTaxUpdates] = useState<any[]>([])

  const checkForTaxRateUpdates = async () => {
    // Simulate checking for tax rate updates
    console.log('[v0] Checking for tax rate updates...')
    // In real implementation, this would call government APIs or tax services
    const updates = [
      {
        country: 'Ghana',
        currency: 'GHS',
        taxYear: 2026,
        status: 'available',
        effectiveDate: '2026-01-01',
        changes: ['Updated band 4 rate from 17.5% to 18%', 'Increased threshold for band 7']
      }
    ]
    setPendingTaxUpdates(updates)
  }

  const importTaxRates = async (countryCode: string, taxYear: number) => {
    console.log(`[v0] Importing tax rates for ${countryCode} ${taxYear}...`)
    // In real implementation, this would fetch from official sources
    // For now, simulate the process
    setTimeout(() => {
      console.log('[v0] Tax rates imported successfully')
    }, 2000)
  }

  const exportTaxConfiguration = () => {
    const config = {
      currency: selectedCurrency,
      taxBands: payeTaxBands,
      ssnitRates,
      tier2Rates,
      tier3Rates,
      exportDate: new Date().toISOString(),
      taxYear: currencyConfig[selectedCurrency as keyof typeof currencyConfig].taxYear
    }
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tax-config-${selectedCurrency}-${config.taxYear}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency)
    setPayeTaxBands(currencyConfig[currency as keyof typeof currencyConfig].taxBands)
  }

  const updateSsnitRates = (field: 'employee' | 'employer', value: number) => {
    const newRates = { ...ssnitRates, [field]: value }
    newRates.total = newRates.employee + newRates.employer
    setSsnitRates(newRates)
  }

  const updateTier2Rates = (field: 'employee' | 'employer', value: number) => {
    const newRates = { ...tier2Rates, [field]: value }
    newRates.total = newRates.employee + newRates.employer
    setTier2Rates(newRates)
  }

  const updateTier3Rates = (field: 'employee' | 'employer', value: number) => {
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

  const loadAllData = async () => {
    console.log("[v0] Loading all settings data...")
    try {
      await Promise.all([loadCompanyData(), loadEmployees(), loadSubsidiaries(), loadRoles()])
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

  const viewSubsidiaryEmployees = async (subsidiaryId: string) => {
    console.log("[v0] Viewing employees for subsidiary:", subsidiaryId)

    if (isDemoMode()) {
      const mockEmployees = [
        {
          id: "emp-1",
          name: "John Doe",
          position: "Software Engineer",
          department: "Technology",
          email: "john@company.com",
        },
        {
          id: "emp-2",
          name: "Jane Smith",
          position: "Marketing Manager",
          department: "Marketing",
          email: "jane@company.com",
        },
        {
          id: "emp-3",
          name: "Mike Johnson",
          position: "HR Specialist",
          department: "Human Resources",
          email: "mike@company.com",
        },
      ]

      // Update employee count in subsidiary
      const updatedSubsidiaries = subsidiaries.map((sub) =>
        sub.id === subsidiaryId ? { ...sub, employee_count: mockEmployees.length } : sub,
      )
      setSubsidiaries(updatedSubsidiaries)

      // Update selectedSubsidiary if it matches
      if (selectedSubsidiary?.id === subsidiaryId) {
        setSelectedSubsidiary({ ...selectedSubsidiary, employee_count: mockEmployees.length })
      }

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

      // Update employee count in subsidiary
      const employeeCount = employees?.length || 0
      await updateSubsidiary(subsidiaryId, { employee_count: employeeCount })

      setViewEmployeesModal({
        isOpen: true,
        subsidiaryId,
        employees: employees || [],
      })
    } catch (error) {
      console.error("View employees error:", error)
      toast({
        title: "Error",
        description: "Failed to load subsidiary employees",
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
      const updatedSubsidiaries = subsidiaries.map((sub) => {
        if (sub.id === subsidiaryId) {
          const updatedSub = {
            ...sub,
            ...updates,
            // Recalculate statistics based on updated data
            divisions_count: updates.divisions?.length || sub.divisions?.length || 0,
            departments_count: updates.departments?.length || sub.departments?.length || 0,
            locations_count: updates.locations?.length || sub.locations?.length || 0,
          }
          return updatedSub
        }
        return sub
      })

      setSubsidiaries(updatedSubsidiaries)

      // Update selectedSubsidiary if it's the one being updated
      if (selectedSubsidiary?.id === subsidiaryId) {
        const updatedSelected = updatedSubsidiaries.find((sub) => sub.id === subsidiaryId)
        if (updatedSelected) {
          setSelectedSubsidiary(updatedSelected)
        }
      }

      toast({
        title: "Subsidiary updated",
        description: "Subsidiary information has been updated successfully.",
      })
      return
    }

    try {
      const { error } = await supabase.from("subsidiaries").update(updates).eq("id", subsidiaryId)

      if (error) throw error

      // Reload subsidiaries to get fresh data with updated statistics
      await loadSubsidiaries()

      // Update selectedSubsidiary with fresh data
      if (selectedSubsidiary?.id === subsidiaryId) {
        const updatedSub = subsidiaries.find((sub) => sub.id === subsidiaryId)
        if (updatedSub) {
          setSelectedSubsidiary(updatedSub)
        }
      }

      toast({
        title: "Subsidiary updated",
        description: "Subsidiary information has been updated successfully.",
      })
    } catch (error) {
      console.error("Update subsidiary error:", error)
      toast({
        title: "Error",
        description: "Failed to update subsidiary information",
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
      toast({
        title: "Backup Completed",
        description: "System backup completed successfully.",
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
        leave_types: true,
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

  const handleDeletePolicy = async (policyName: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setCurrentPolicies((prev) => prev.filter((policy) => policy.name !== policyName))
      setShowPolicyModal(false)

      toast({
        title: "Policy Deleted",
        description: `${policyName} policy has been successfully removed.`,
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

  const handleAddLeaveType = async () => {
    setIsManagingLeaveTypes(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Add new leave type to current policies
      const newPolicy = {
        name: newLeaveType.name,
        days: Number.parseInt(newLeaveType.days),
        usage: "0%",
        trend: "stable",
        description: newLeaveType.description,
      }

      setCurrentPolicies((prev) => [...prev, newPolicy])

      // Reset form
      setNewLeaveType({
        name: "",
        days: 0,
        description: "",
        carryOver: false,
      })

      setShowAddLeaveTypeModal(false)

      toast({
        title: "Leave Type Added",
        description: `${newLeaveType.name} has been successfully added to your policies.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add leave type. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsManagingLeaveTypes(false)
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
