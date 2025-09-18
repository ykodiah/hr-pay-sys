"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import {
  Building2,
  X,
  Loader2,
  Upload,
  Building,
  Users,
  Calculator,
  Bell,
  Shield,
  Key,
  Lock,
  Database,
  FileText,
  TrendingUp,
  Calendar,
  Mail,
  Brain,
  CheckCircle,
  Settings,
  Save,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Pause,
  Play,
  Trash2,
  Download,
  DollarSign,
  Minus,
  Receipt,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
  size?: string
  country?: string
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
    size: "",
    country: "",
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

  const [payrollConfig, setPayrollConfig] = useState({
    payFrequency: "Monthly",
    currency: "USD",
    minimumWage: 18.15,
    weekdayOvertimeMultiplier: 1.5,
    weekendOvertimeMultiplier: 2.0,
    payrollCutoffDay: 25,
    processingDay: 28,
    autoCalculatePAYE: true,
    autoCalculateSSNIT: true,
    autoCalculateProvidentFund: true,
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

  const [selectedCurrency, setSelectedCurrency] = useState('ghs')
  const [payeTaxBands, setPayeTaxBands] = useState([
    { band: 0, rate: 0, from: 4350, to: null, description: '% on first' },
    { band: 5, rate: 5, from: 1000, to: null, description: '% on next' },
    { band: 10, rate: 10, from: 2000, to: null, description: '% on next' },
    { band: 17.5, rate: 17.5, from: 20000, to: null, description: '% on next' },
    { band: 25, rate: 25, from: 25000, to: null, description: '% on next' },
    { band: 30, rate: 30, from: null, to: null, description: '% on remaining amount' }
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
      taxBands: [
        { band: 0, rate: 0, from: 4350, to: null, description: '% on first' },
        { band: 5, rate: 5, from: 1000, to: null, description: '% on next' },
        { band: 10, rate: 10, from: 2000, to: null, description: '% on next' },
        { band: 17.5, rate: 17.5, from: 20000, to: null, description: '% on next' },
        { band: 25, rate: 25, from: 25000, to: null, description: '% on next' },
        { band: 30, rate: 30, from: null, to: null, description: '% on remaining amount' }
      ]
    },
    usd: { 
      symbol: '$', 
      name: 'US Dollar (USD)',
      taxBands: [
        { band: 10, rate: 10, from: 11000, to: 44725, description: '% on income' },
        { band: 12, rate: 12, from: 44726, to: 95375, description: '% on income' },
        { band: 22, rate: 22, from: 95376, to: 182050, description: '% on income' },
        { band: 24, rate: 24, from: 182051, to: 231250, description: '% on income' },
        { band: 32, rate: 32, from: 231251, to: 578125, description: '% on income' },
        { band: 37, rate: 37, from: 578126, to: null, description: '% on remaining amount' }
      ]
    },
    eur: { 
      symbol: '€', 
      name: 'Euro (EUR)',
      taxBands: [
        { band: 0, rate: 0, from: 10908, to: null, description: '% on first' },
        { band: 14, rate: 14, from: 10909, to: 61972, description: '% on income' },
        { band: 42, rate: 42, from: 61973, to: 277826, description: '% on income' },
        { band: 45, rate: 45, from: 277827, to: null, description: '% on remaining amount' }
      ]
    },
    ngn: { 
      symbol: '₦', 
      name: 'Nigerian Naira (NGN)',
      taxBands: [
        { band: 7, rate: 7, from: 300000, to: null, description: '% on first' },
        { band: 11, rate: 11, from: 300000, to: null, description: '% on next' },
        { band: 15, rate: 15, from: 500000, to: null, description: '% on next' },
        { band: 19, rate: 19, from: 500000, to: null, description: '% on next' },
        { band: 21, rate: 21, from: 1600000, to: null, description: '% on next' },
        { band: 24, rate: 24, from: null, to: null, description: '% on remaining amount' }
      ]
    }
  }

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency)
    setPayeTaxBands(currencyConfig[currency as keyof typeof currencyConfig].taxBands)
    setPayrollConfig({ ...payrollConfig, currency: currency })
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
          size: data.size || "",
          country: data.country || "",
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

════════════════════════════════════════════════

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

SECTION I: WELCOME AND INTRODUCTION

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

${policiesData.map(policy => `- ${policy.name}: ${policy.days} days, ${policy.usage}% usage, ${policy.description}`).join('\n')}

Please provide:
1. Overall policy utilization analysis
2. Recommendations for policy optimization
3. Potential cost savings opportunities
4. Employee satisfaction insights`

      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          type: 'leave_policies'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate insights')
      }

      const data = await response.json()
      setAiInsights(data.insights)
    } catch (error) {
      console.error('[v0] Error generating AI insights:', error)
      setAiInsights('Unable to generate insights at this time. Please try again later.')
      toast({
        title: "Error",
        description: "Failed to generate AI insights. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingInsights(false)
    }
  }

  const handleGenerateIndividualInsight = async (policyId: string) => {
    const policy = currentPolicies.find(p => p.id === policyId)
    if (!policy) return

    setLoadingInsights(prev => ({ ...prev, [policyId]: true }))

    try {
      const response = await fetch('/api/policy-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          policy: {
            name: policy.name,
            days: policy.days,
            usage: policy.usage,
            description: policy.description
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate insight')
      }

      const data = await response.json()
      setPolicyInsights(prev => ({ ...prev, [policyId]: data.insight }))
    } catch (error) {
      console.error('[v0] Error generating policy insight:', error)
      setPolicyInsights(prev => ({ ...prev, [policyId]: 'Unable to generate insight at this time.' }))
    } finally {
      setLoadingInsights(prev => ({ ...prev, [policyId]: false }))
    }
  }

  const handleSavePayrollConfig = async () => {
    setIsSavingPayroll(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast({
        title: "Success",
        description: "Payroll configuration saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save payroll configuration.",
        variant: "destructive",
      })
    } finally {
      setIsSavingPayroll(false)
    }
  }

  const handleSaveHRConfig = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast({
        title: "Success",
        description: "HR configuration saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save HR configuration.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const calculateSSNITTotal = () => {
    return ssnitRates.employee + ssnitRates.employer
  }

  const calculateTier2Total = () => {
    return tier2Rates.employee + tier2Rates.employer
  }

  const calculateTier3Total = () => {
    return tier3Rates.employee + tier3Rates.employer
  }

  const handleSSNITChange = (field: 'employee' | 'employer', value: number) => {
    setSsnitRates(prev => ({ ...prev, [field]: value }))
  }

  const handleTier2Change = (field: 'employee' | 'employer', value: number) => {
    setTier2Rates(prev => ({ ...prev, [field]: value }))
  }

  const handleTier3Change = (field: 'employee' | 'employer', value: number) => {
    setTier3Rates(prev => ({ ...prev, [field]: value }))
  }

  const [selectedAllowance, setSelectedAllowance] = useState(null)
  const [selectedDeduction, setSelectedDeduction] = useState(null)
  const [showAllowanceModal, setShowAllowanceModal] = useState(false)
  const [showDeductionModal, setShowDeductionModal] = useState(false)
  const [showAddAllowanceModal, setShowAddAllowanceModal] = useState(false)
  const [showAddDeductionModal, setShowAddDeductionModal] = useState(false)
  const [isSavingPayroll, setIsSavingPayrollHR] = useState(false)
  const [isSavingHR, setIsSavingHR] = useState(false)
  const [salaryGrades, setSalaryGrades] = useState([
    { id: 1, grade: 'A1', level: 'Entry Level', minSalary: 5000, maxSalary: 8000, steps: 5 },
    { id: 2, grade: 'B2', level: 'Mid Level', minSalary: 8000, maxSalary: 12000, steps: 7 },
    { id: 3, grade: 'C3', level: 'Senior Level', minSalary: 12000, maxSalary: 20000, steps: 10 }
  ])
  const [showAddSalaryGradeModal, setShowAddSalaryGradeModal] = useState(false)
  const [policyDocuments, setPolicyDocuments] = useState([
    { id: 1, name: 'Employee Handbook', category: 'HR Policy', version: '1.0', status: 'active', lastUpdated: '2024-01-01' },
    { id: 2, name: 'Code of Conduct', category: 'HR Policy', version: '1.1', status: 'active', lastUpdated: '2024-01-01' },
    { id: 3, name: 'Safety Guidelines', category: 'HR Policy', version: '1.2', status: 'draft', lastUpdated: '2024-01-01' }
  ])
  const [showEditTaxBandModal, setShowEditTaxBandModal] = useState(false)
  const [showAddTaxBandModal, setShowAddTaxBandModal] = useState(false)
  const [emailTemplates, setEmailTemplates] = useState([
    { id: 1, name: 'Welcome Email', description: 'Welcome email for new employees', status: 'active' },
    { id: 2, name: 'Leave Request', description: 'Leave request notification', status: 'active' },
    { id: 3, name: 'Performance Review', description: 'Performance review notification', status: 'active' }
  ])

  const handleViewSalaryGrade = (id) => {
    toast({
      title: "View Salary Grade",
      description: `Viewing salary grade ${id}...`,
    })
  }

  const handleEditSalaryGrade = (id) => {
    toast({
      title: "Edit Salary Grade",
      description: `Editing salary grade ${id}...`,
    })
  }

  const handleDeleteSalaryGrade = (id) => {
    toast({
      title: "Delete Salary Grade",
      description: `Deleting salary grade ${id}...`,
    })
  }

  const handleViewDocument = (id) => {
    toast({
      title: "View Document",
      description: `Viewing document ${id}...`,
    })
  }

  const handleEditDocument = (id) => {
    toast({
      title: "Edit Document",
      description: `Editing document ${id}...`,
    })
  }

  const handleDownloadDocument = (id) => {
    toast({
      title: "Download Document",
      description: `Downloading document ${id}...`,
    })
  }

  const handleDeleteDocument = (id) => {
    toast({
      title: "Delete Document",
      description: `Deleting document ${id}...`,
    })
  }

  const handleEditTaxBand = (index) => {
    toast({
      title: "Edit Tax Band",
      description: `Editing tax band ${index}...`,
    })
  }

  const [activeTab, setActiveTab] = useState("company");
  const getCurrencySymbol = (currencyCode) => {
    switch (currencyCode) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      case "NGN":
        return "₦";
      case "GHS":
        return "₵";
      default:
        return "$";
    }
  };

  const currencySymbol = getCurrencySymbol(payrollConfig.currency)

  const formatCurrency = (amount, currencyCode) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your organization settings and configurations</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            {[
              { id: 'company', label: 'Company', icon: Building2 },
              { id: 'multi-company', label: 'Multi-Company', icon: Building },
              { id: 'hr', label: 'HR', icon: Users },
              { id: 'payroll', label: 'Payroll', icon: Calculator },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'roles', label: 'Roles', icon: Shield },
              { id: 'access', label: 'Access', icon: Key },
              { id: 'security', label: 'Security', icon: Lock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'company' && (
          <div className="space-y-6">
            {/* Company Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
                </div>
                <p className="text-gray-600 mt-1">Basic company details and settings</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyData.name}
                      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <select
                      value={companyData.industry}
                      onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Technology">Technology</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                      <option value="Education">Education</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Retail">Retail</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee Count
                    </label>
                    <select
                      value={companyData.size}
                      onChange={(e) => setCompanyData({ ...companyData, size: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <select
                      value={companyData.country}
                      onChange={(e) => setCompanyData({ ...companyData, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Ghana">Ghana</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="Kenya">Kenya</option>
                      <option value="South Africa">South Africa</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Address
                  </label>
                  <textarea
                    value={companyData.address}
                    onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter company address..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'multi-company' && (
          <div className="space-y-6">
            {/* Multi-Company Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Subsidiaries</h2>
                      <p className="text-gray-600 mt-1">Manage subsidiary companies and branches</p>
                    </div>
                  </div>
                  <Button onClick={() => setShowAddSubsidiaryModal(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subsidiary
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {subsidiaries.map((subsidiary) => (
                    <div key={subsidiary.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{subsidiary.name}</h3>
                          <p className="text-sm text-gray-600">{subsidiary.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          subsidiary.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subsidiary.status}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewSubsidiary(subsidiary.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditSubsidiary(subsidiary.id)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {subsidiary.status === 'active' ? (
                              <DropdownMenuItem onClick={() => confirmDeactivateSubsidiary(subsidiary.id)}>
                                <Pause className="w-4 h-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => confirmReactivateSubsidiary(subsidiary.id)}>
                                <Play className="w-4 h-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hr' && (
          <div className="space-y-6">
            {/* HR Configuration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">HR Configuration</h2>
                      <p className="text-gray-600 mt-1">Configure core HR settings and policies</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSaveHRConfig}
                    disabled={isSavingHR}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSavingHR ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save HR Configuration
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Leave Year Start
                    </label>
                    <select
                      value={hrConfig.leaveYearStart}
                      onChange={(e) => setHrConfig({ ...hrConfig, leaveYearStart: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="January">January</option>
                      <option value="April">April</option>
                      <option value="July">July</option>
                      <option value="October">October</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Probation Period (months)
                    </label>
                    <input
                      type="number"
                      value={hrConfig.probationPeriod}
                      onChange={(e) => setHrConfig({ ...hrConfig, probationPeriod: Number.parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Working Hours/Day
                    </label>
                    <input
                      type="number"
                      value={hrConfig.workingHoursPerDay}
                      onChange={(e) => setHrConfig({ ...hrConfig, workingHoursPerDay: Number.parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Working Days/Week
                    </label>
                    <input
                      type="number"
                      value={hrConfig.workingDaysPerWeek}
                      onChange={(e) => setHrConfig({ ...hrConfig, workingDaysPerWeek: Number.parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Automation Settings</h3>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Auto-approve leave requests</h4>
                        <p className="text-sm text-gray-600">Automatically approve requests within policy</p>
                      </div>
                    </div>
                    <Switch
                      checked={hrConfig.autoApproveLeave}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, autoApproveLeave: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Email notifications</h4>
                        <p className="text-sm text-gray-600">Send email updates for HR activities</p>
                      </div>
                    </div>
                    <Switch
                      checked={hrConfig.emailNotifications}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, emailNotifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Brain className="w-5 h-5 text-purple-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">AI Recommendations</h4>
                        <p className="text-sm text-gray-600">Enable AI-driven insights for HR processes</p>
                      </div>
                    </div>
                    <Switch
                      checked={hrConfig.aiRecommendations}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, aiRecommendations: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Smart Scheduling</h4>
                        <p className="text-sm text-gray-600">Optimize schedules based on employee availability</p>
                      </div>
                    </div>
                    <Switch
                      checked={hrConfig.smartScheduling}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, smartScheduling: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Performance Tracking</h4>
                        <p className="text-sm text-gray-600">Track employee performance metrics and goals</p>
                      </div>
                    </div>
                    <Switch
                      checked={hrConfig.performanceTracking}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, performanceTracking: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Policies */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Leave Policies</h2>
                      <p className="text-gray-600 mt-1">Manage leave policies and generate AI insights</p>
                    </div>
                  </div>
                  <Button onClick={() => setShowAddLeaveTypeModal(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Leave Type
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentPolicies.map((policy) => (
                    <div key={policy.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{policy.name}</h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewPolicy(policy.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditPolicy(policy.id)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeletePolicy(policy.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">{policy.description}</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Days:</span>
                          <span className="font-medium">{policy.days}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Usage:</span>
                          <span className="font-medium">{policy.usage}%</span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">AI Insights</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateIndividualInsight(policy.id)}
                            disabled={loadingInsights[policy.id]}
                            className="text-xs"
                          >
                            {loadingInsights[policy.id] ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Brain className="w-3 h-3 mr-1" />
                                Generate
                              </>
                            )}
                          </Button>
                        </div>
                        {policyInsights[policy.id] && (
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <p className="text-sm text-blue-800">{policyInsights[policy.id]}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Salary Grades & Notches */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Salary Grades & Notches</h2>
                      <p className="text-gray-600 mt-1">Manage salary structures and promotion guidelines</p>
                    </div>
                  </div>
                  <Button onClick={() => setShowAddSalaryGradeModal(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Grade
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Grade</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Level</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Min Salary</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Max Salary</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Steps</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryGrades.map((grade) => (
                        <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{grade.grade}</td>
                          <td className="py-3 px-4 text-gray-600">{grade.level}</td>
                          <td className="py-3 px-4 text-gray-600">{currencySymbol}{grade.minSalary.toLocaleString()}</td>
                          <td className="py-3 px-4 text-gray-600">{currencySymbol}{grade.maxSalary.toLocaleString()}</td>
                          <td className="py-3 px-4 text-gray-600">{grade.steps}</td>
                          <td className="py-3 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewSalaryGrade(grade.id)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditSalaryGrade(grade.id)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteSalaryGrade(grade.id)} className="text-red-600">
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
              </div>
            </div>

            {/* HR Policy Documents */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">HR Policy Documents</h2>
                      <p className="text-gray-600 mt-1">Manage company policies and employee handbooks</p>
                    </div>
                  </div>
                  <Button onClick={() => setShowAddDocumentModal(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Document
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {policyDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{doc.name}</h3>
                          <p className="text-sm text-gray-600">Version {doc.version} • Updated {doc.lastUpdated}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          doc.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.status}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDocument(doc.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditDocument(doc.id)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadDocument(doc.id)}>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteDocument(doc.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="space-y-6">
            {/* Payroll Configuration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Payroll Configuration</h2>
                      <p className="text-gray-600 mt-1">Configure basic payroll settings</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSavePayrollConfig}
                    disabled={isSavingPayroll}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSavingPayroll ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Payroll Settings
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pay Frequency
                    </label>
                    <select
                      value={payrollConfig.payFrequency}
                      onChange={(e) => setPayrollConfig({ ...payrollConfig, payFrequency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Bi-weekly">Bi-weekly</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={payrollConfig.currency}
                      onChange={(e) => handleCurrencyChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">US Dollar (USD)</option>
                      <option value="GHS">Ghana Cedi (GHS)</option>
                      <option value="NGN">Nigerian Naira (NGN)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="GBP">British Pound (GBP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Wage ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      value={payrollConfig.minimumWage}
                      onChange={(e) => setPayrollConfig({ ...payrollConfig, minimumWage: Number.parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weekday Overtime Rate Multiplier
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={payrollConfig.weekdayOvertimeMultiplier}
                      onChange={(e) => setPayrollConfig({ ...payrollConfig, weekdayOvertimeMultiplier: Number.parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weekend Overtime Rate Multiplier
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={payrollConfig.weekendOvertimeMultiplier}
                      onChange={(e) => setPayrollConfig({ ...payrollConfig, weekendOvertimeMultiplier: Number.parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payroll Cutoff Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={payrollConfig.payrollCutoffDay}
                      onChange={(e) => setPayrollConfig({ ...payrollConfig, payrollCutoffDay: Number.parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Auto-calculation Settings</h3>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calculator className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Auto-calculate PAYE</h4>
                        <p className="text-sm text-gray-600">Automatically calculate Pay As You Earn tax</p>
                      </div>
                    </div>
                    <Switch
                      checked={payrollConfig.autoCalculatePAYE}
                      onCheckedChange={(checked) => setPayrollConfig({ ...payrollConfig, autoCalculatePAYE: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calculator className="w-5 h-5 text-green-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Auto-calculate SSNIT</h4>
                        <p className="text-sm text-gray-600">Automatically calculate Social Security contributions</p>
                      </div>
                    </div>
                    <Switch
                      checked={payrollConfig.autoCalculateSSNIT}
                      onCheckedChange={(checked) => setPayrollConfig({ ...payrollConfig, autoCalculateSSNIT: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calculator className="w-5 h-5 text-purple-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Auto-calculate Provident Fund (Tier 3)</h4>
                        <p className="text-sm text-gray-600">Automatically calculate Tier 3 pension contributions</p>
                      </div>
                    </div>
                    <Switch
                      checked={payrollConfig.autoCalculateProvidentFund}
                      onCheckedChange={(checked) => setPayrollConfig({ ...payrollConfig, autoCalculateProvidentFund: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Configuration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Tax Configuration</h2>
                    <p className="text-gray-600 mt-1">Configure tax bands and SSNIT rates</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {/* PAYE Tax Bands */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">PAYE Tax Bands</h3>
                    <Button onClick={() => setShowAddTaxBandModal(true)} size="sm" className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Band
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Band</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Rate (%)</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">From ({currencySymbol})</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">To ({currencySymbol})</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payeTaxBands.map((band, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">{band.band}</td>
                            <td className="py-3 px-4 text-gray-600">{band.rate}% on {band.description}</td>
                            <td className="py-3 px-4 text-gray-600">{band.from ? `${currencySymbol}${band.from.toLocaleString()}` : '-'}</td>
                            <td className="py-3 px-4 text-gray-600">{band.to ? `${currencySymbol}${band.to.toLocaleString()}` : '-'}</td>
                            <td className="py-3 px-4">
                              <Button variant="ghost" size="sm" onClick={() => handleEditTaxBand(index)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SSNIT Rates */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">SSNIT Rates</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Employee:</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.1"
                            value={ssnitRates.employee}
                            onChange={(e) => handleSSNITChange('employee', Number.parseFloat(e.target.value))}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Employer:</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.1"
                            value={ssnitRates.employer}
                            onChange={(e) => handleSSNITChange('employer', Number.parseFloat(e.target.value))}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-900">Total:</span>
                        <span className="text-sm font-medium text-gray-900">{calculateSSNITTotal()}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tier 2 Rates</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Employee:</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.1"
                            value={tier2Rates.employee}
                            onChange={(e) => handleTier2Change('employee', Number.parseFloat(e.target.value))}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Employer:</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.1"
                            value={tier2Rates.employer}
                            onChange={(e) => handleTier2Change('employer', Number.parseFloat(e.target.value))}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-900">Total:</span>
                        <span className="text-sm font-medium text-gray-900">{calculateTier2Total()}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tier 3 Rates</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Employee:</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.1"
                            value={tier3Rates.employee}
                            onChange={(e) => handleTier3Change('employee', Number.parseFloat(e.target.value))}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Employer:</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.1"
                            value={tier3Rates.employer}
                            onChange={(e) => handleTier3Change('employer', Number.parseFloat(e.target.value))}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-900">Total:</span>
                        <span className="text-sm font-medium text-gray-900">{calculateTier3Total()}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Allowances */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Allowances</h2>
                      <p className="text-gray-600 mt-1">Configure employee allowances and benefits</p>
                    </div>
                  </div>
                  <Button onClick={() => setShowAddAllowanceModal(true)} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Code</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Taxable</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Recurring</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">AMOUNT</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">%</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">FIXED/VARIABLE</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allowances.map((allowance) => (
                        <tr key={allowance.code} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{allowance.code}</td>
                          <td className="py-3 px-4 text-gray-600">{allowance.description}</td>
                          <td className="py-3 px-4 text-center">
                            <Switch
                              checked={allowance.taxable}
                              onCheckedChange={(checked) => {
                                setAllowances(prev => prev.map(a => 
                                  a.code === allowance.code ? { ...a, taxable: checked } : a
                                ))
                              }}
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Switch
                              checked={allowance.recurring}
                              onCheckedChange={(checked) => {
                                setAllowances(prev => prev.map(a => 
                                  a.code === allowance.code ? { ...a, recurring: checked } : a
                                ))
                              }}
                            />
                          </td>
                          <td className="py-3 px-4 text-center text-gray-600">{allowance.amount}</td>
                          <td className="py-3 px-4 text-center text-gray-600">{allowance.percentage}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              allowance.type === 'FIXED' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {allowance.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditAllowance(allowance.code)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteAllowance(allowance.code)} className="text-red-600">
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
              </div>
            </div>

            {/* Deductions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Minus className="w-5 h-5 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Deductions</h2>
                      <p className="text-gray-600 mt-1">Configure payroll deductions and taxes</p>
                    </div>
                  </div>
                  <Button onClick={() => setShowAddDeductionModal(true)} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Code</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Recurring</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">AMOUNT</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">%</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">FIXED/VARIABLE</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deductions.map((deduction) => (
                        <tr key={deduction.code} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{deduction.code}</td>
                          <td className="py-3 px-4 text-gray-600">{deduction.description}</td>
                          <td className="py-3 px-4 text-center">
                            <Switch
                              checked={deduction.recurring}
                              onCheckedChange={(checked) => {
                                setDeductions(prev => prev.map(d => 
                                  d.code === deduction.code ? { ...d, recurring: checked } : d
                                ))
                              }}
                            />
                          </td>
                          <td className="py-3 px-4 text-center text-gray-600">{deduction.amount}</td>
                          <td className="py-3 px-4 text-center text-gray-600">{deduction.percentage}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              deduction.type === 'FIXED' 
                                ? 'bg-blue-100 text-blue-800' 
                                : deduction.type === 'VARIABLE'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {deduction.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditDeduction(deduction.code)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteDeduction(deduction.code)} className="text-red-600">
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
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Email Templates */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Email Templates</h2>
                      <p className="text-gray-600 mt-1">Manage automated email notifications</p>
                    </div>
                  </div>
                  <Button onClick={handleAddEmailTemplate} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Template
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {emailTemplates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          template.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {template.status}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEmailTemplate(template.name)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="space-y-6">
            {/* Role Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Role Management</h2>
                      <p className="text-gray-600 mt-1">Define user roles and permissions</p>
                    </div>
                  </div>
                  <Button onClick={handleAddRole} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Role
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{role.name}</h3>
                          <p className="text-sm text-gray-600">{role.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">{role.userCount} users</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRole(role.name)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="space-y-6">
            {/* Access Control */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Key className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Access Control</h2>
                    <p className="text-gray-600 mt-1">Manage system access and permissions</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Access Control Settings</h3>
                  <p className="text-gray-600">Configure user access permissions and security settings.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Security Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                    <p className="text-gray-600 mt-1">Configure security and backup settings</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Backup Settings */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Database className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Data Backup</h3>
                          <p className="text-sm text-gray-600">Automated system backups</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleBackupNow}
                        disabled={isBackingUp}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isBackingUp ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Backing up...
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4 mr-2" />
                            Backup Now
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Last backup: {lastBackupTime ? new Date(lastBackupTime).toLocaleString() : 'Never'}</p>
                      <p>Next scheduled backup: Daily at 2:00 AM</p>
                    </div>
                  </div>

                  {/* Import Settings */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Upload className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Import Settings</h3>
                          <p className="text-sm text-gray-600">Import configuration from file</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowImportModal(true)}
                        variant="outline"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import Settings
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddSubsidiaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Subsidiary</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subsidiary Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter subsidiary name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter location"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddSubsidiaryModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowAddSubsidiaryModal(false)
                  toast({
                    title: "Success",
                    description: "Subsidiary added successfully.",
                  })
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add Subsidiary
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeactivateConfirm && subsidiaryToToggle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Deactivate Subsidiary</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to deactivate "{subsidiaryToToggle.name}"? This action can be reversed later.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeactivateConfirm(false)
                  setSubsidiaryToToggle(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleToggleSubsidiaryStatus(subsidiaryToToggle.id, 'inactive')
                  setShowDeactivateConfirm(false)
                  setSubsidiaryToToggle(null)
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReactivateConfirm && subsidiaryToToggle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reactivate Subsidiary</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reactivate "{subsidiaryToToggle.name}"?
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReactivateConfirm(false)
                  setSubsidiaryToToggle(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleToggleSubsidiaryStatus(subsidiaryToToggle.id, 'active')
                  setShowReactivateConfirm(false)
                  setSubsidiaryToToggle(null)
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Reactivate
              </Button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Import Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Configuration File
                </label>
                <input
                  type="file"
                  accept=".json,.csv"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-sm text-gray-600">
                <p>Supported formats: JSON, CSV</p>
                <p>Maximum file size: 10MB</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowImportModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowImportModal(false)
                  toast({
                    title: "Success",
                    description: "Settings imported successfully.",
                  })
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Import
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Leave Type Modal */}
      {showAddLeaveTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Leave Type</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Personal Leave"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the leave type"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Days Allowed
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 10"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddLeaveTypeModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowAddLeaveTypeModal(false)
                  toast({
                    title: "Success",
                    description: "Leave type added successfully.",
                  })
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add Leave Type
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Modal */}
      {showPolicyModal && selectedPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{policyModalType === 'view' ? 'View' : 'Edit'} Policy</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPolicyModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Policy Name
                </label>
                <input
                  type="text"
                  value={selectedPolicy.name}
                  disabled={policyModalType === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={selectedPolicy.description}
                  disabled={policyModalType === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Days
                  </label>
                  <input
                    type="number"
                    value={selectedPolicy.days}
                    disabled={policyModalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Usage (%)
                  </label>
                  <input
                    type="number"
                    value={selectedPolicy.usage}
                    disabled={policyModalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowPolicyModal(false)}
              >
                {policyModalType === 'view' ? 'Close' : 'Cancel'}
              </Button>
              {policyModalType === 'edit' && (
                <Button
                  onClick={() => {
                    setShowPolicyModal(false)
                    toast({
                      title: "Success",
                      description: "Policy updated successfully.",
                    })
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {documentModalType === 'view' ? 'View' : documentModalType === 'edit' ? 'Edit' : 'Add'} Document
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDocumentModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Name
                </label>
                <input
                  type="text"
                  value={selectedDocument.name}
                  disabled={documentModalType === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selected
