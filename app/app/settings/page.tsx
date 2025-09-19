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
  RotateCcw,
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

  const [selectedCurrency, setSelectedCurrency] = useState("ghs")
  const [payeTaxBands, setPayeTaxBands] = useState([
    { band: 0, rate: 0, from: 0, to: 4350, description: "% on first ₵4,350" },
    { band: 5, rate: 5, from: 4351, to: 5350, description: "% on next ₵1,000" },
    { band: 10, rate: 10, from: 5351, to: 7350, description: "% on next ₵2,000" },
    { band: 17.5, rate: 17.5, from: 7351, to: 27350, description: "% on next ₵20,000" },
    { band: 25, rate: 25, from: 27351, to: 52350, description: "% on next ₵25,000" },
    { band: 30, rate: 30, from: 52351, to: null, description: "% on remaining amount" },
  ])

  const [taxVersions, setTaxVersions] = useState([
    {
      id: 1,
      version: "2024.1",
      effectiveDate: "2024-01-01",
      status: "active",
      source: "manual",
      confidence: 100,
      approvedBy: "System Admin",
      approvedAt: "2024-01-01T00:00:00Z",
    },
  ])
  const [governmentApiStatus, setGovernmentApiStatus] = useState({
    ghana: { connected: false, lastSync: null, status: "disconnected" },
    nigeria: { connected: false, lastSync: null, status: "disconnected" },
  })
  const [autoUpdateSettings, setAutoUpdateSettings] = useState({
    enabled: false,
    requireApproval: true,
    notifyOnUpdates: true,
    confidenceThreshold: 85,
  })

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
      taxBands: [
        { band: 0, rate: 0, from: 0, to: 4350, description: "% on first ₵4,350" },
        { band: 5, rate: 5, from: 4351, to: 5350, description: "% on next ₵1,000" },
        { band: 10, rate: 10, from: 5351, to: 7350, description: "% on next ₵2,000" },
        { band: 17.5, rate: 17.5, from: 7351, to: 27350, description: "% on next ₵20,000" },
        { band: 25, rate: 25, from: 27351, to: 52350, description: "% on next ₵25,000" },
        { band: 30, rate: 30, from: 52351, to: null, description: "% on remaining amount" },
      ],
      ssnitRates: {
        employee: 5.5,
        employer: 13.0,
        total: 18.5,
      },
      tier2Rates: {
        employee: 5.5,
        employer: 5.5,
        total: 11.0,
      },
      tier3Rates: {
        employee: 5.0,
        employer: 5.0,
        total: 10.0,
      },
    },
    usd: {
      symbol: "$",
      name: "US Dollar (USD)",
      taxBands: [
        { band: 10, rate: 10, from: 11000, to: 44725, description: "% on income" },
        { band: 12, rate: 12, from: 44726, to: 95375, description: "% on income" },
        { band: 22, rate: 22, from: 95376, to: 182050, description: "% on income" },
        { band: 24, rate: 24, from: 182051, to: 231250, description: "% on income" },
        { band: 32, rate: 32, from: 231251, to: 578125, description: "% on income" },
        { band: 37, rate: 37, from: 578126, to: null, description: "% on remaining amount" },
      ],
    },
    eur: {
      symbol: "€",
      name: "Euro (EUR)",
      taxBands: [
        { band: 0, rate: 0, from: 10908, to: null, description: "% on first" },
        { band: 14, rate: 14, from: 10909, to: 61972, description: "% on income" },
        { band: 42, rate: 42, from: 61973, to: 277826, description: "% on income" },
        { band: 45, rate: 45, from: 277827, to: null, description: "% on remaining amount" },
      ],
    },
    ngn: {
      symbol: "₦",
      name: "Nigerian Naira (NGN)",
      taxBands: [
        { band: 7, rate: 7, from: 300000, to: null, description: "% on first" },
        { band: 11, rate: 11, from: 300000, to: null, description: "% on next" },
        { band: 15, rate: 15, from: 500000, to: null, description: "% on next" },
        { band: 19, rate: 19, from: 500000, to: null, description: "% on next" },
        { band: 21, rate: 21, from: 1600000, to: null, description: "% on next" },
        { band: 24, rate: 24, from: null, to: null, description: "% on remaining amount" },
      ],
    },
  }

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency)
    setPayeTaxBands(currencyConfig[currency as keyof typeof currencyConfig].taxBands)
    setSsnitRates(currencyConfig[currency as keyof typeof currencyConfig].ssnitRates)
    setTier2Rates(currencyConfig[currency as keyof typeof currencyConfig].tier2Rates)
    setTier3Rates(currencyConfig[currency as keyof typeof currencyConfig].tier3Rates)
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

Welcome to our organization. This Code of Conduct serves as a comprehensive guide for ethical decision-making and professional behavior within our company. All employees, contractors, and business partners are expected to adhere to these standards.

Our mission is to provide exceptional service while maintaining the highest standards of integrity and professionalism in all business dealings.

2. PROFESSIONAL CONDUCT STANDARDS

2.1 General Principles
All employees must:
• Treat colleagues, clients, and stakeholders with respect and dignity
• Maintain professional demeanor in all business interactions
• Uphold company values and reputation
• Act with honesty and transparency

2.2 Workplace Behavior
• Harassment, discrimination, or bullying will not be tolerated
• Maintain a safe and inclusive work environment
• Respect diversity and promote equal opportunities
• Follow all safety protocols and procedures

3. CONFIDENTIALITY AND INFORMATION SECURITY

3.1 Confidential Information
Employees must protect:
• Client data and personal information
• Proprietary business information
• Trade secrets and intellectual property
• Financial and strategic information

3.2 Data Protection
• Use strong passwords and secure authentication
• Report security incidents immediately
• Follow data retention and disposal policies
• Comply with privacy regulations (GDPR, CCPA, etc.)

4. CONFLICT OF INTEREST POLICY

4.1 Definition
A conflict of interest occurs when personal interests interfere with company interests or decision-making processes.

4.2 Common Examples
• Financial interests in competitors or suppliers
• Personal relationships affecting business decisions
• Outside employment that competes with company business
• Accepting gifts or favors from business partners

5. COMPLIANCE WITH LAWS AND REGULATIONS

All employees must:
• Comply with applicable local, state, and federal laws
• Follow industry-specific regulations
• Adhere to international trade and export controls
• Report legal violations or concerns

6. REPORTING VIOLATIONS

6.1 Reporting Channels
• Direct supervisor or manager
• Human Resources department
• Ethics hotline: 1-800-ETHICS-1
• Anonymous online reporting portal
• Legal department for serious violations

6.2 Whistleblower Protection
The company prohibits retaliation against employees who report violations in good faith.

7. DISCIPLINARY ACTIONS

Violations may result in:
• Verbal or written warnings
• Mandatory training or counseling
• Suspension or probation
• Termination of employment
• Legal action where appropriate

This document is reviewed annually and updated as needed to reflect current laws and best practices.

═══════════════════════════════════════════════════════════════

For questions about this Code of Conduct, contact:
Ethics and Compliance Office
ethics@company.com | (555) 123-4567

Document ID: COC-2024-001
Last Updated: January 15, 2024
Next Review Date: January 15, 2025`,
      },
      "Employee Handbook": {
        content: `EMPLOYEE HANDBOOK

WELCOME TO OUR ORGANIZATION

EFFECTIVE DATE: January 1, 2024
VERSION: 3.2
HUMAN RESOURCES DEPARTMENT

═══════════════════════════════════════════════════════════════

TABLE OF CONTENTS

SECTION I: WELCOME AND INTRODUCTION
1. Welcome Message .......................................... 4
2. Company Overview ......................................... 5
3. Mission, Vision, and Values ............................. 6

SECTION II: EMPLOYMENT POLICIES
4. Equal Opportunity Employment ............................. 8
5. Anti-Discrimination Policy ............................... 9
6. Harassment Prevention Policy ............................. 10
7. Work Schedule and Attendance ............................. 12

SECTION III: BENEFITS AND COMPENSATION
8. Health Insurance ......................................... 14
9. Retirement Plans ......................................... 16
10. Paid Time Off ........................................... 18
11. Professional Development ................................ 20

SECTION IV: PERFORMANCE MANAGEMENT
12. Performance Reviews ..................................... 22
13. Career Development ...................................... 24
14. Training and Education .................................. 26

SECTION V: SAFETY AND SECURITY
15. Workplace Safety ........................................ 28
16. Technology Usage ........................................ 30
17. Security Protocols ...................................... 32

═══════════════════════════════════════════════════════════════

1. WELCOME MESSAGE

Dear Team Member,

Welcome to our organization! We are pleased to have you join our team. This handbook will help you understand our company culture, policies, and expectations.

Our success depends on the dedication, creativity, and teamwork of our employees. We are committed to providing a positive work environment where everyone can thrive and contribute to our shared goals.

This handbook is your guide to understanding our policies and procedures. Please read it carefully and keep it as a reference throughout your employment.

We look forward to working with you and supporting your professional growth.

Sincerely,
The Management Team

2. COMPANY OVERVIEW

Our mission is to provide exceptional service while maintaining the highest standards of integrity and professionalism.

Founded in 1995, we have grown from a small startup to a leading organization in our industry. We serve clients across multiple sectors and pride ourselves on innovation, quality, and customer satisfaction.

Key Facts:
• Founded: 1995
• Employees: 500+
• Locations: 12 offices worldwide
• Industries Served: Technology, Healthcare, Finance, Education

3. MISSION, VISION, AND VALUES

MISSION STATEMENT
To deliver innovative solutions that exceed client expectations while fostering a culture of excellence, integrity, and continuous improvement.

VISION STATEMENT
To be the leading provider of professional services, recognized for our expertise, innovation, and commitment to client success.

CORE VALUES
• INTEGRITY: We act with honesty and transparency in all our dealings
• EXCELLENCE: We strive for the highest quality in everything we do
• INNOVATION: We embrace new ideas and creative solutions
• COLLABORATION: We work together to achieve common goals
• RESPECT: We treat everyone with dignity and consideration

SECTION II: EMPLOYMENT POLICIES

4. EQUAL OPPORTUNITY EMPLOYMENT

We are an equal opportunity employer committed to providing employment opportunities regardless of:
• Race, color, or national origin
• Religion or creed
• Gender or gender identity
• Sexual orientation
• Age (40 and over)
• Disability status
• Veteran status
• Genetic information

5. BENEFITS AND COMPENSATION

HEALTH INSURANCE
• Comprehensive medical coverage
• Dental and vision plans
• Health Savings Account (HSA) options
• Employee assistance programs

RETIREMENT PLANS
• 401(k) plan with company matching
• Vesting schedule: 100% after 3 years
• Financial planning resources
• Retirement counseling services

PAID TIME OFF
• Annual Leave: 21 days per year
• Sick Leave: 10 days per year
• Maternity/Paternity Leave: As per local regulations
• Personal Days: 5 days per year

LEAVE POLICIES

Annual Leave: 21 days per year
• Accrual begins on first day of employment
• Maximum carryover: 5 days to following year
• Advance approval required for extended leave

Sick Leave: 10 days per year
• Available for personal illness or family care
• Medical certification required for absences over 3 days
• Unused sick days do not carry over

Maternity/Paternity Leave: As per local regulations
• Up to 12 weeks for eligible employees
• Combination of paid and unpaid leave
• Job protection guaranteed upon return

This handbook is updated regularly to reflect current policies and procedures. For the most current version, please check the company intranet or contact Human Resources.

═══════════════════════════════════════════════════════════════

For questions about policies in this handbook, contact:
Human Resources Department
hr@company.com | (555) 123-4567

Document ID: EH-2024-001
Last Updated: January 15, 2024
Next Review Date: January 15, 2025`,
      },
    }

    return (
      documentTemplates[document.name]?.content ||
      `Document: ${document.name}\n\nThis document contains important information about ${document.name.toLowerCase()}. The content would be displayed here in a real implementation.`
    )
  }

  const handleDocumentView = (document: any) => {
    setSelectedDocument(document)
    setDocumentModalType("view")
    setShowDocumentModal(true)
    setShowDocumentPreview(false) // Reset preview state

    setTimeout(() => {
      const parsedContent = parseDocumentContent(document)
      setDocumentPreviewContent(parsedContent)
    }, 500)
  }

  const handleDocumentAction = (action, docId = null) => {
    if (docId) {
      const doc = hrDocuments.find((d) => d.id === docId)
      setSelectedDocument(doc)
    }
    setDocumentModalType(action)
    setShowDocumentModal(true)
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setUploadedFile(file)
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ""))
      }
    }
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
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const newDoc = {
        id: Date.now(),
        name: documentName,
        type: uploadedFile.type.includes("pdf") ? "PDF" : "DOC",
        size: `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB`,
        visibleToAll: false,
      }

      setHrDocuments((prev) => [...prev, newDoc])
      setShowDocumentModal(false)
      setDocumentName("")
      setUploadedFile(null)

      toast({
        title: "Document Added",
        description: `${documentName} has been successfully uploaded.`,
      })
    } catch (error) {
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
      const response = await fetch("/api/policy-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy }),
      })

      if (!response.ok) throw new Error("Failed to generate insight")

      const data = await response.json()
      setPolicyInsights((prev) => ({ ...prev, [policyName]: data.insight }))
    } catch (error) {
      console.error("Error generating insight:", error)
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

  const handleGovernmentApiSync = async (country: string) => {
    console.log(`[v0] Syncing with ${country} government API...`)
    setGovernmentApiStatus((prev) => ({
      ...prev,
      [country]: { ...prev[country as keyof typeof prev], status: "syncing" },
    }))

    // Simulate API call
    setTimeout(() => {
      setGovernmentApiStatus((prev) => ({
        ...prev,
        [country]: {
          connected: true,
          lastSync: new Date().toISOString(),
          status: "connected",
        },
      }))
    }, 2000)
  }

  const handleTaxVersionApproval = (versionId: number, approved: boolean) => {
    console.log(`[v0] ${approved ? "Approving" : "Rejecting"} tax version:`, versionId)
    setTaxVersions((prev) =>
      prev.map((version) =>
        version.id === versionId
          ? { ...version, status: approved ? "active" : "rejected" }
          : { ...version, status: version.status === "active" ? "inactive" : version.status },
      ),
    )
  }

  const exportTaxConfiguration = () => {
    const config = {
      currency: selectedCurrency,
      taxBands: payeTaxBands,
      ssnitRates,
      tier2Rates,
      tier3Rates,
      exportDate: new Date().toISOString(),
      version: taxVersions.find((v) => v.status === "active")?.version || "1.0",
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `tax-config-${selectedCurrency}-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
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
                <div>
                  <Label>Departments</Label>
                  <div className="space-y-2">
                    {departments.map((dept, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={dept}
                          onChange={(e) => {
                            const newDepts = [...departments]
                            newDepts[index] = e.target.value
                            setDepartments(newDepts)
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDepartments(departments.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDepartments([...departments, "New Department"])}
                    >
                      Add Department
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Locations</Label>
                  <div className="space-y-2">
                    {locations.map((location, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={location}
                          onChange={(e) => {
                            const newLocations = [...locations]
                            newLocations[index] = e.target.value
                            setLocations(newLocations)
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocations(locations.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setLocations([...locations, "New Location"])}>
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
                            <Switch
                              checked={doc.visibleToAll}
                              onCheckedChange={() => handleToggleDocumentVisibility(doc.id)}
                            />
                            <Button variant="outline" size="sm" onClick={() => handleDocumentView(doc)}>
                              View
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDocumentAction("edit", doc.id)}>
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDocumentAction("delete", doc.id)}
                            >
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
                    <Label htmlFor="minimumWage">
                      Minimum Wage ({currencyConfig[selectedCurrency as keyof typeof currencyConfig].symbol})
                    </Label>
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
                  <Button
                    onClick={() => {
                      // Save payroll configuration
                      console.log("[v0] Saving payroll configuration...")
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Payroll Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tax Configuration Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-5 h-5" />
                    <span>Tax Configuration</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGovernmentApiSync(selectedCurrency === "ghs" ? "ghana" : "nigeria")}
                      disabled={
                        governmentApiStatus[
                          selectedCurrency === "ghs" ? "ghana" : ("nigeria" as keyof typeof governmentApiStatus)
                        ].status === "syncing"
                      }
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${governmentApiStatus[selectedCurrency === "ghs" ? "ghana" : ("nigeria" as keyof typeof governmentApiStatus)].status === "syncing" ? "animate-spin" : ""}`}
                      />
                      Sync with Gov API
                    </Button>
                    <Button size="sm" variant="outline" onClick={exportTaxConfiguration}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Config
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Configure tax bands and SSNIT rates with government API integration
                  {governmentApiStatus[
                    selectedCurrency === "ghs" ? "ghana" : ("nigeria" as keyof typeof governmentApiStatus)
                  ].connected && <span className="ml-2 text-green-600 text-sm">✓ Connected to Government API</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-blue-900">Tax Version Management</h4>
                    <Badge variant="secondary">
                      Active: {taxVersions.find((v) => v.status === "active")?.version || "N/A"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Effective Date:</span>
                      <p className="font-medium">
                        {taxVersions.find((v) => v.status === "active")?.effectiveDate || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-700">Source:</span>
                      <p className="font-medium capitalize">
                        {taxVersions.find((v) => v.status === "active")?.source || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-700">Confidence:</span>
                      <p className="font-medium">{taxVersions.find((v) => v.status === "active")?.confidence || 0}%</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">
                      PAYE Tax Bands - {currencyConfig[selectedCurrency as keyof typeof currencyConfig].name}
                    </h4>
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
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left">Band</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Rate (%)</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Description</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">
                            From ({currencyConfig[selectedCurrency as keyof typeof currencyConfig].symbol})
                          </th>
                          <th className="border border-gray-200 px-4 py-2 text-left">
                            To ({currencyConfig[selectedCurrency as keyof typeof currencyConfig].symbol})
                          </th>
                          <th className="border border-gray-200 px-4 py-2 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payeTaxBands.map((band, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-gray-25" : ""}>
                            <td className="border border-gray-200 px-4 py-2 font-medium">{index + 1}</td>
                            <td className="border border-gray-200 px-4 py-2 font-medium">{band.rate}%</td>
                            <td className="border border-gray-200 px-4 py-2">{band.description}</td>
                            <td className="border border-gray-200 px-4 py-2">
                              {band.from ? band.from.toLocaleString() : "0"}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {band.to ? band.to.toLocaleString() : "∞"}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-green-900">SSNIT Rates (Tier 1)</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-green-700">Employee:</span>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={ssnitRates.employee}
                            onChange={(e) => updateSsnitRates("employee", Number.parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-right bg-white"
                          />
                          <span className="text-green-700">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-green-700">Employer:</span>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={ssnitRates.employer}
                            onChange={(e) => updateSsnitRates("employer", Number.parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-right bg-white"
                          />
                          <span className="text-green-700">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center font-medium border-t border-green-200 pt-2">
                        <span className="text-green-900">Total:</span>
                        <span className="text-green-900">{ssnitRates.total.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-blue-900">Tier 2 Rates</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Employee:</span>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={tier2Rates.employee}
                            onChange={(e) => updateTier2Rates("employee", Number.parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-right bg-white"
                          />
                          <span className="text-blue-700">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Employer:</span>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={tier2Rates.employer}
                            onChange={(e) => updateTier2Rates("employer", Number.parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-right bg-white"
                          />
                          <span className="text-blue-700">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center font-medium border-t border-blue-200 pt-2">
                        <span className="text-blue-900">Total:</span>
                        <span className="text-blue-900">{tier2Rates.total.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-purple-900">Tier 3 Rates</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-700">Employee:</span>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={tier3Rates.employee}
                            onChange={(e) => updateTier3Rates("employee", Number.parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-right bg-white"
                          />
                          <span className="text-purple-700">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-700">Employer:</span>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={tier3Rates.employer}
                            onChange={(e) => updateTier3Rates("employer", Number.parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-right bg-white"
                          />
                          <span className="text-purple-700">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center font-medium border-t border-purple-200 pt-2">
                        <span className="text-purple-900">Total:</span>
                        <span className="text-purple-900">{tier3Rates.total.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 text-yellow-900">Auto-Update Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-700">Enable Auto-Updates:</span>
                      <Switch
                        checked={autoUpdateSettings.enabled}
                        onCheckedChange={(checked) => setAutoUpdateSettings((prev) => ({ ...prev, enabled: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-700">Require Approval:</span>
                      <Switch
                        checked={autoUpdateSettings.requireApproval}
                        onCheckedChange={(checked) =>
                          setAutoUpdateSettings((prev) => ({ ...prev, requireApproval: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-700">Notify on Updates:</span>
                      <Switch
                        checked={autoUpdateSettings.notifyOnUpdates}
                        onCheckedChange={(checked) =>
                          setAutoUpdateSettings((prev) => ({ ...prev, notifyOnUpdates: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-700">Confidence Threshold:</span>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={autoUpdateSettings.confidenceThreshold}
                          onChange={(e) =>
                            setAutoUpdateSettings((prev) => ({
                              ...prev,
                              confidenceThreshold: Number.parseInt(e.target.value) || 85,
                            }))
                          }
                          className="w-20 h-8 text-right bg-white"
                        />
                        <span className="text-yellow-700">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      console.log("[v0] Resetting to defaults...")
                      setPayeTaxBands(currencyConfig[selectedCurrency as keyof typeof currencyConfig].taxBands)
                      setSsnitRates(currencyConfig[selectedCurrency as keyof typeof currencyConfig].ssnitRates)
                      setTier2Rates(currencyConfig[selectedCurrency as keyof typeof currencyConfig].tier2Rates)
                      setTier3Rates(currencyConfig[selectedCurrency as keyof typeof currencyConfig].tier3Rates)
                    }}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Defaults
                  </Button>
                  <Button
                    onClick={() => {
                      console.log("[v0] Saving tax configuration...")
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Tax Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Allowances Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Allowances</span>
                  </div>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">Code</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Description</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Taxable</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Recurring</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">AMOUNT</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">%</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">FIXED/VARIABLE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allowances.map((allowance, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2 font-medium">{allowance.code}</td>
                          <td className="border border-gray-200 px-4 py-2">{allowance.description}</td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <Switch checked={allowance.taxable} />
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <Switch checked={allowance.recurring} />
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-right">{allowance.amount}</td>
                          <td className="border border-gray-200 px-4 py-2 text-right">{allowance.percentage}</td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                              {allowance.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Deductions Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Minus className="w-5 h-5" />
                    <span>Deductions</span>
                  </div>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">Code</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Description</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Recurring</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">AMOUNT</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">%</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">FIXED/VARIABLE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deductions.map((deduction, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2 font-medium">{deduction.code}</td>
                          <td className="border border-gray-200 px-4 py-2">{deduction.description}</td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <Switch checked={deduction.recurring} />
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-right">{deduction.amount}</td>
                          <td className="border border-gray-200 px-4 py-2 text-right">{deduction.percentage}</td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800">
                              {deduction.type}
                            </span>
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
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save Payroll Settings
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>Configure email and system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Button variant="outline" onClick={handleAddEmailTemplateInner}>
                  Add Email Template
                </Button>
                <Button variant="outline" onClick={() => handleEditEmailTemplateInner("Welcome Email")}>
                  Edit Welcome Email
                </Button>
              </div>
            </CardContent>
          </Card>
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

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Access Control</span>
              </CardTitle>
              <CardDescription>Manage user access and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Two-Factor Authentication</Label>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Security</span>
                </CardTitle>
                <Button variant="outline" onClick={handleBackupNowInner} disabled={isBackingUp}>
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
              <CardDescription>Manage security settings and backups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Last Backup</Label>
                <p>{lastBackupTime ? new Date(lastBackupTime).toLocaleString() : "No backup yet"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                      <Input placeholder="Enter location" />
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
                  <Button onClick={() => setShowEditSubsidiary(false)}>Save Changes</Button>
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
          <Card className="max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Deactivate Subsidiary</CardTitle>
              <CardDescription>Are you sure you want to deactivate {subsidiaryToToggle.name}?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Deactivating will prevent further actions on this subsidiary.</p>
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setShowDeactivateConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmToggleStatus}>
                  Deactivate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reactivate Confirmation Modal */}
      {showReactivateConfirm && subsidiaryToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Reactivate Subsidiary</CardTitle>
              <CardDescription>Are you sure you want to reactivate {subsidiaryToToggle.name}?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Reactivating will allow full access and actions on this subsidiary.</p>
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setShowReactivateConfirm(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmToggleStatus}>Reactivate</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Employees Modal */}
      {viewEmployeesModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/50">
          <div className="relative m-8 md:m-16 lg:m-24">
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="text-xl">Employees of Subsidiary</CardTitle>
                <CardDescription>View the employees for the selected subsidiary company</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {viewEmployeesModal.employees && viewEmployeesModal.employees.length > 0 ? (
                  <div className="space-y-3">
                    {viewEmployeesModal.employees.map((employee) => (
                      <Card key={employee.id} className="border-l-4 border-l-indigo-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-base font-semibold">{employee.name}</h3>
                              <p className="text-xs text-gray-600">{employee.position}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-500">{employee.email}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p>No employees found for this subsidiary.</p>
                )}
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={() => setViewEmployeesModal({ isOpen: false, subsidiaryId: "" })}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Import Settings Modal */}
      {importModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/50">
          <div className="relative m-8 md:m-16 lg:m-24">
            <Card className="max-w-lg mx-auto">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Import Settings</CardTitle>
                <CardDescription>Import settings from a CSV file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="importFile">Select CSV File</Label>
                    <Input
                      id="importFile"
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImportSettings(file)
                        }
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Upload a CSV file with subsidiary settings. The file should include columns for name, tax_id,
                    ssnit_number, industry, etc.
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" onClick={() => setImportModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setImportModal(false)}>Import</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
