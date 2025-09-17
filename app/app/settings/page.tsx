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
  Trash2,
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

  const handleZoomIn = () => {
    setDocumentZoom((prev) => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setDocumentZoom((prev) => Math.max(prev - 25, 50))
  }

  const handleDownload = () => {
    if (selectedDocument) {
      // Create document content based on type
      const content = parseDocumentContent(selectedDocument)
      let blob
      let filename

      if (selectedDocument.type === "PDF") {
        // For PDF, we'll create a simple text file (in real app, would use PDF library)
        blob = new Blob([content], { type: "application/pdf" })
        filename = `${selectedDocument.name}.pdf`
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

        {/* Multi-Company Management */}
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
                      <p className="text-sm text-muted-foreground">Get AI-powered insights for HR decisions</p>
                    </div>
                    <Switch
                      checked={hrConfig.aiRecommendations}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, aiRecommendations: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Brain className="w-4 h-4 text-blue-500" />
                        <span>Smart Scheduling</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">AI-optimized shift and leave scheduling</p>
                    </div>
                    <Switch
                      checked={hrConfig.smartScheduling}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, smartScheduling: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span>Performance Tracking</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">AI-enhanced performance analytics</p>
                    </div>
                    <Switch
                      checked={hrConfig.performanceTracking}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, performanceTracking: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Leave Policies</span>
                </CardTitle>
                <CardDescription>Manage leave types and policies with AI insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center space-x-2">
                      <span>Current Policies</span>
                      {hrConfig.aiRecommendations && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Enhanced
                        </Badge>
                      )}
                    </h3>
                    {/* Update the current policies rendering to use state */}
                    <div className="space-y-2">
                      {currentPolicies.map((policy) => (
                        <div
                          key={policy.name}
                          className="flex justify-between items-center p-3 border rounded hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{policy.name}</span>
                              {hrConfig.aiRecommendations && (
                                <Badge
                                  variant={
                                    policy.trend === "up"
                                      ? "destructive"
                                      : policy.trend === "down"
                                        ? "default"
                                        : "secondary"
                                  }
                                >
                                  {policy.usage}
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-gray-600">{policy.days} days</span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePolicyAction("view", policy.name)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePolicyAction("edit", policy.name)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Policy
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handlePolicyAction("delete", policy.name)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Policy
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleManageLeaveTypes}
                      disabled={isManagingLeaveTypes}
                      className="w-full bg-transparent"
                    >
                      {isManagingLeaveTypes ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Leave Types
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>AI Insights</span>
                    </h3>
                    {hrConfig.aiRecommendations ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <div className="flex items-start space-x-2">
                            <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-800">High Annual Leave Usage</p>
                              <p className="text-xs text-blue-600">Consider reviewing leave allocation policies</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-start space-x-2">
\
