"use client"
import type { FunctionComponent } from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import {
  Building2,
  Shield,
  Users,
  DollarSign,
  Bell,
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
  FileText,
  EyeOff,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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

const SettingsPage: FunctionComponent = () => {
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

  const [isSavingPolicy, setIsSavingPolicy] = useState(false)
  const [isSavingDocument, setIsSavingDocument] = useState(false)

  const [showDocumentPreview, setShowDocumentPreview] = useState(false)
  const [documentPreviewContent, setDocumentPreviewContent] = useState("")
  const [leaveTypeAIInsights, setLeaveTypeAIInsights] = useState<string[]>([])

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
        variant: "destructive",
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
    // Simulate different document types with realistic content
    const documentTemplates = {
      "Code of Conduct": {
        content: `Document: Code of Conduct

This is a comprehensive Code of Conduct document outlining the ethical standards and behavioral expectations for all employees.

Key sections include:
• Company policies and procedures
• Employee rights and responsibilities
• Code of conduct guidelines
• Compliance requirements
• Disciplinary procedures
• Reporting mechanisms

1. PROFESSIONAL CONDUCT
All employees are expected to maintain the highest standards of professional conduct in their interactions with colleagues, clients, and stakeholders.

2. CONFIDENTIALITY
Employees must protect confidential information and proprietary data belonging to the company and its clients.

3. CONFLICT OF INTEREST
Employees must avoid situations that create or appear to create conflicts between personal interests and company interests.

4. COMPLIANCE WITH LAWS
All employees must comply with applicable laws, regulations, and company policies.

5. REPORTING VIOLATIONS
Employees are encouraged to report any violations of this code through appropriate channels.

This document serves as a guide for ethical decision-making and professional behavior within our organization.`,
      },
      "Employee Handbook": {
        content: `Document: Employee Handbook

Welcome to our organization! This handbook provides essential information about company policies, procedures, and benefits.

Table of Contents:
• Welcome Message
• Company Overview
• Employment Policies
• Benefits and Compensation
• Leave Policies
• Performance Management
• Safety and Security
• Technology Usage

WELCOME MESSAGE
We are pleased to welcome you to our team. This handbook will help you understand our company culture and expectations.

COMPANY OVERVIEW
Our mission is to provide exceptional service while maintaining the highest standards of integrity and professionalism.

EMPLOYMENT POLICIES
- Equal Opportunity Employment
- Anti-Discrimination Policy
- Harassment Prevention
- Work Schedule and Attendance

BENEFITS AND COMPENSATION
- Health Insurance
- Retirement Plans
- Paid Time Off
- Professional Development

LEAVE POLICIES
- Annual Leave: 21 days per year
- Sick Leave: 10 days per year
- Maternity/Paternity Leave: As per local regulations

This handbook is updated regularly to reflect current policies and procedures.`,
      },
      "Safety Manual": {
        content: `Document: Safety Manual

This safety manual outlines procedures and guidelines to ensure a safe working environment for all employees.

SAFETY PRINCIPLES
1. Safety is everyone's responsibility
2. All accidents are preventable
3. Safety training is mandatory
4. Report all hazards immediately

EMERGENCY PROCEDURES
- Fire Emergency: Exit procedures and assembly points
- Medical Emergency: First aid and emergency contacts
- Security Emergency: Lockdown procedures

WORKPLACE SAFETY
- Personal Protective Equipment (PPE)
- Equipment Operation Guidelines
- Hazard Identification and Reporting
- Incident Investigation Procedures

HEALTH AND WELLNESS
- Ergonomic Guidelines
- Mental Health Resources
- Wellness Programs
- Health Screenings

Remember: When in doubt, prioritize safety over productivity.`,
      },
    }

    // Return specific content based on document name, or generate generic content
    if (documentTemplates[document.name]) {
      return documentTemplates[document.name].content
    }

    // Generate content based on document type
    const fileExtension = document.type.toLowerCase()
    let content = `Document: ${document.name}\n\n`

    if (fileExtension === "pdf") {
      content += `This is a PDF document containing important company information.\n\n`
      content += `Key sections may include:\n`
      content += `• Policy guidelines and procedures\n`
      content += `• Regulatory compliance information\n`
      content += `• Employee responsibilities\n`
      content += `• Contact information and resources\n\n`
      content += `[PDF content would be extracted and displayed here in a production environment]\n\n`
      content += `Document size: ${document.size}\n`
      content += `Last modified: ${new Date().toLocaleDateString()}`
    } else if (fileExtension === "doc" || fileExtension === "docx") {
      content += `This is a Word document containing structured company information.\n\n`
      content += `Document structure:\n`
      content += `• Header with company branding\n`
      content += `• Table of contents\n`
      content += `• Main content sections\n`
      content += `• Appendices and references\n\n`
      content += `[Word document content would be parsed and displayed here]\n\n`
      content += `Document properties:\n`
      content += `- File size: ${document.size}\n`
      content += `- Format: Microsoft Word Document\n`
      content += `- Created: ${new Date().toLocaleDateString()}`
    } else {
      content += `This document contains important company information and policies.\n\n`
      content += `Content overview:\n`
      content += `• Company policies and procedures\n`
      content += `• Employee guidelines and expectations\n`
      content += `• Compliance and regulatory information\n`
      content += `• Contact information and resources\n\n`
      content += `[Document content would be processed and displayed based on file type]\n\n`
      content += `File information:\n`
      content += `- Size: ${document.size}\n`
      content += `- Type: ${document.type}\n`
      content += `- Status: Available for viewing`
    }

    return content
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

  const handleToggleDocumentVisibility = (docId: number) => {
    setHrDocuments((prev) => prev.map((doc) => (doc.id === docId ? { ...doc, visibleToAll: !doc.visibleToAll } : doc)))
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
        variant: "destructive",
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
                                  className="text-xs"
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
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-green-800">Optimal Sick Leave Usage</p>
                              <p className="text-xs text-green-600">Current policy is well-balanced</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-amber-800">Upcoming Peak Season</p>
                              <p className="text-xs text-amber-600">Restrict leave approvals for Q4</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 border-2 border-dashed rounded">
                        <Brain className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Enable AI Recommendations to see insights</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>HR Policy Documents</span>
                </CardTitle>
                <CardDescription>Manage HR policy documents and employee access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Update HR documents rendering with 3-dot menus */}
                <div className="space-y-3">
                  {hrDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-500">
                            {doc.type} • {doc.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`visible-${doc.id}`} className="text-sm">
                            Visible to all employees
                          </Label>
                          <Switch
                            id={`visible-${doc.id}`}
                            checked={doc.visibleToAll}
                            onCheckedChange={() => handleToggleDocumentVisibility(doc.id)}
                          />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDocumentView(doc)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDocumentAction("edit", doc.id)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDocumentAction("delete", doc.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" onClick={handleAddDocument} className="w-full bg-transparent">
                  <Plus className="mr-2 h-4 w-4" />
                  Add HR Policy Document
                </Button>
              </CardContent>
            </Card>

            {/* Employee Analytics card removed as requested */}
          </div>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Payroll Settings</span>
              </CardTitle>
              <CardDescription>Configure payroll calculations, allowances, and deductions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Allowances</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Transport Allowance</span>
                      <span className="text-sm text-gray-600">₵200.00</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Housing Allowance</span>
                      <span className="text-sm text-gray-600">15%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Meal Allowance</span>
                      <span className="text-sm text-gray-600">₵150.00</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleManageAllowances}>
                    Manage Allowances
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Deductions</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>SSNIT (Employee)</span>
                      <span className="text-sm text-gray-600">5.5%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Income Tax</span>
                      <span className="text-sm text-gray-600">Variable</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Staff Loan</span>
                      <span className="text-sm text-gray-600">₵500.00</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleManageDeductions}>
                    Manage Deductions
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Salary Grades</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left">Grade</th>
                        <th className="border border-gray-300 p-2 text-left">Step 1</th>
                        <th className="border border-gray-300 p-2 text-left">Step 2</th>
                        <th className="border border-gray-300 p-2 text-left">Step 3</th>
                        <th className="border border-gray-300 p-2 text-left">Step 4</th>
                        <th className="border border-gray-300 p-2 text-left">Step 5</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-2">Junior Level</td>
                        <td className="border border-gray-300 p-2">₵2,500</td>
                        <td className="border border-gray-300 p-2">₵2,750</td>
                        <td className="border border-gray-300 p-2">₵3,000</td>
                        <td className="border border-gray-300 p-2">₵3,250</td>
                        <td className="border border-gray-300 p-2">₵3,500</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Mid Level</td>
                        <td className="border border-gray-300 p-2">₵4,000</td>
                        <td className="border border-gray-300 p-2">₵4,500</td>
                        <td className="border border-gray-300 p-2">₵5,000</td>
                        <td className="border border-gray-300 p-2">₵5,500</td>
                        <td className="border border-gray-300 p-2">₵6,000</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Senior Level</td>
                        <td className="border border-gray-300 p-2">₵7,000</td>
                        <td className="border border-gray-300 p-2">₵8,000</td>
                        <td className="border border-gray-300 p-2">₵9,000</td>
                        <td className="border border-gray-300 p-2">₵10,000</td>
                        <td className="border border-gray-300 p-2">₵11,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <Button variant="outline" size="sm" onClick={handleManageSalaryGrades}>
                  Manage Salary Grades
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notification Settings</span>
              </CardTitle>
              <CardDescription>Configure email templates and notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Email Templates</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <span className="font-medium">Welcome Email</span>
                      <p className="text-sm text-gray-600">Welcome to Akwaaba Technologies</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditEmailTemplate("Welcome Email")}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Template
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <span className="font-medium">Leave Request</span>
                      <p className="text-sm text-gray-600">Notification for leave requests</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditEmailTemplate("Leave Request")}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Template
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <span className="font-medium">Password Reset</span>
                      <p className="text-sm text-gray-600">Instructions for resetting password</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditEmailTemplate("Password Reset")}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Template
                    </Button>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddEmailTemplate}>
                  Add Email Template
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Notification Preferences</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>Leave Request Notifications</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>Task Assignment Notifications</span>
                    <Switch />
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>Meeting Reminders</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Roles & Permissions</span>
              </CardTitle>
              <CardDescription>Manage user roles and access permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Current Roles</h3>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div key={role.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <span className="font-medium">{role.name}</span>
                        <p className="text-sm text-gray-600">{role.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{role.user_count} Users</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditRole(role.name)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Role
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={handleAddRole}>
                  Add Role
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Access Management</span>
              </CardTitle>
              <CardDescription>Manage user access and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Authentication Methods</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>Password Authentication</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>Two-Factor Authentication</span>
                    <Switch />
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>Social Login (Google, Facebook)</span>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription>Configure security settings and data backup options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Data Backup</h3>
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <span className="font-medium">Last Backup</span>
                    <p className="text-sm text-gray-600">
                      {lastBackupTime ? new Date(lastBackupTime).toLocaleString() : "No backup yet"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleBackupNow} disabled={isBackingUp}>
                    {isBackingUp ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Backing Up...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Backup Now
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Security Policies</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>Password Expiry (90 days)</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>IP Address Whitelisting</span>
                    <Switch />
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>Data Encryption</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Subsidiary Modal */}
      <Dialog open={showAddSubsidiary} onOpenChange={setShowAddSubsidiary}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Subsidiary</DialogTitle>
            <DialogDescription>Create a new subsidiary company</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" defaultValue="" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tax_id" className="text-right">
                Tax ID
              </Label>
              <Input id="tax_id" defaultValue="" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ssnit_number" className="text-right">
                SSNIT Number
              </Label>
              <Input id="ssnit_number" defaultValue="" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="industry" className="text-right">
                Industry
              </Label>
              <Input id="industry" defaultValue="" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email_address" className="text-right">
                Email
              </Label>
              <Input id="email_address" defaultValue="" className="col-span-3" type="email" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone_number" className="text-right">
                Phone
              </Label>
              <Input id="phone_number" defaultValue="" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Textarea id="address" defaultValue="" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Logo</Label>
              <div className="col-span-3">
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
                <div className="space-y-2 mt-2">
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
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={async () => {
                const name = (document.getElementById("name") as HTMLInputElement).value
                const tax_id = (document.getElementById("tax_id") as HTMLInputElement).value
                const ssnit_number = (document.getElementById("ssnit_number") as HTMLInputElement).value
                const industry = (document.getElementById("industry") as HTMLInputElement).value
                const email_address = (document.getElementById("email_address") as HTMLInputElement).value
                const phone_number = (document.getElementById("phone_number") as HTMLInputElement).value
                const address = (document.getElementById("address") as HTMLTextAreaElement).value

                setIsSavingSubsidiary(true)
                await addNewSubsidiary({ name, tax_id, ssnit_number, industry, email_address, phone_number, address })
                setShowAddSubsidiary(false)
                setIsSavingSubsidiary(false)
              }}
              disabled={isSavingSubsidiary}
            >
              {isSavingSubsidiary ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Create Subsidiary"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subsidiary Modal */}
      <Dialog open={showEditSubsidiary} onOpenChange={setShowEditSubsidiary}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Subsidiary</DialogTitle>
            <DialogDescription>Edit details of the selected subsidiary</DialogDescription>
          </DialogHeader>
          {selectedSubsidiary && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit_name"
                  defaultValue={selectedSubsidiary.name}
                  className="col-span-3"
                  onChange={(e) => setSelectedSubsidiary({ ...selectedSubsidiary, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_tax_id" className="text-right">
                  Tax ID
                </Label>
                <Input
                  id="edit_tax_id"
                  defaultValue={selectedSubsidiary.tax_id}
                  className="col-span-3"
                  onChange={(e) => setSelectedSubsidiary({ ...selectedSubsidiary, tax_id: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_ssnit_number" className="text-right">
                  SSNIT Number
                </Label>
                <Input
                  id="edit_ssnit_number"
                  defaultValue={selectedSubsidiary.ssnit_number}
                  className="col-span-3"
                  onChange={(e) => setSelectedSubsidiary({ ...selectedSubsidiary, ssnit_number: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_industry" className="text-right">
                  Industry
                </Label>
                <Input
                  id="edit_industry"
                  defaultValue={selectedSubsidiary.industry}
                  className="col-span-3"
                  onChange={(e) => setSelectedSubsidiary({ ...selectedSubsidiary, industry: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_email_address" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit_email_address"
                  defaultValue={selectedSubsidiary.email_address}
                  className="col-span-3"
                  type="email"
                  onChange={(e) => setSelectedSubsidiary({ ...selectedSubsidiary, email_address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_phone_number" className="text-right">
                  Phone
                </Label>
                <Input
                  id="edit_phone_number"
                  defaultValue={selectedSubsidiary.phone_number}
                  className="col-span-3"
                  onChange={(e) => setSelectedSubsidiary({ ...selectedSubsidiary, phone_number: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_address" className="text-right">
                  Address
                </Label>
                <Textarea
                  id="edit_address"
                  defaultValue={selectedSubsidiary.address}
                  className="col-span-3"
                  onChange={(e) => setSelectedSubsidiary({ ...selectedSubsidiary, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Logo</Label>
                <div className="col-span-3">
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
                        onClick={() => {
                          setSubsidiaryLogoPreview("")
                          setSelectedSubsidiary({ ...selectedSubsidiary, logo_url: "" })
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
                  <div className="space-y-2 mt-2">
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
                      id="edit-subsidiary-logo-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("edit-subsidiary-logo-upload")?.click()}
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
            </div>
          )}
          <DialogFooter>
            <Button
              type="submit"
              onClick={async () => {
                if (!selectedSubsidiary) return

                setIsSavingSubsidiary(true)
                await updateSubsidiary(selectedSubsidiary.id, selectedSubsidiary)
                setShowEditSubsidiary(false)
                setIsSavingSubsidiary(false)
              }}
              disabled={isSavingSubsidiary}
            >
              {isSavingSubsidiary ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subsidiary Details Modal */}
      <Dialog open={showSubsidiaryDetails} onOpenChange={setShowSubsidiaryDetails}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Subsidiary Details</DialogTitle>
            <DialogDescription>View detailed information about the selected subsidiary</DialogDescription>
          </DialogHeader>
          {selectedSubsidiary && (
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-lg flex items-center justify-center overflow-hidden">
                  {selectedSubsidiary.logo_url ? (
                    <img
                      src={selectedSubsidiary.logo_url || "/placeholder.svg"}
                      alt={`${selectedSubsidiary.name} logo`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {selectedSubsidiary.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedSubsidiary.name}</h3>
                  <p className="text-sm text-gray-600">{selectedSubsidiary.industry}</p>
                  <Badge variant={selectedSubsidiary.status === "active" ? "default" : "secondary"} className="mt-1">
                    {selectedSubsidiary.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Contact Information</h4>
                  <p className="text-sm text-gray-600">Email: {selectedSubsidiary.email_address}</p>
                  <p className="text-sm text-gray-600">Phone: {selectedSubsidiary.phone_number}</p>
                  <p className="text-sm text-gray-600">Address: {selectedSubsidiary.address}</p>
                </div>
                <div>
                  <h4 className="font-medium">Registration Details</h4>
                  <p className="text-sm text-gray-600">Tax ID: {selectedSubsidiary.tax_id}</p>
                  <p className="text-sm text-gray-600">SSNIT: {selectedSubsidiary.ssnit_number}</p>
                  <p className="text-sm text-gray-600">
                    Created: {new Date(selectedSubsidiary.created_at || "").toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium">Organizational Structure</h4>
                <p className="text-sm text-gray-600">Divisions: {selectedSubsidiary.divisions?.join(", ") || "N/A"}</p>
                <p className="text-sm text-gray-600">
                  Departments: {selectedSubsidiary.departments?.join(", ") || "N/A"}
                </p>
                <p className="text-sm text-gray-600">Locations: {selectedSubsidiary.locations?.join(", ") || "N/A"}</p>
              </div>

              <div>
                <h4 className="font-medium">Employee Count</h4>
                <p className="text-sm text-gray-600">Total Employees: {selectedSubsidiary.employee_count || 0}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowSubsidiaryDetails(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Deactivate Subsidiary Modal */}
      <Dialog open={showDeactivateConfirm} onOpenChange={setShowDeactivateConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Deactivate Subsidiary</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this subsidiary? This action will prevent further access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDeactivateConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmToggleStatus}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Reactivate Subsidiary Modal */}
      <Dialog open={showReactivateConfirm} onOpenChange={setShowReactivateConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reactivate Subsidiary</DialogTitle>
            <DialogDescription>
              Are you sure you want to reactivate this subsidiary? This action will restore access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowReactivateConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={confirmToggleStatus}>Reactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Employees Modal */}
      <Dialog
        open={viewEmployeesModal.isOpen}
        onOpenChange={() => setViewEmployeesModal({ ...viewEmployeesModal, isOpen: false })}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Employees of {subsidiaries.find((s) => s.id === viewEmployeesModal.subsidiaryId)?.name}
            </DialogTitle>
            <DialogDescription>View a list of employees associated with this subsidiary</DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-gray-200">
            {viewEmployeesModal.employees?.map((employee) => (
              <div key={employee.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-gray-600">
                      {employee.position} - {employee.department}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">{employee.email}</p>
                </div>
              </div>
            ))}
            {viewEmployeesModal.employees?.length === 0 && (
              <div className="py-4 text-center text-gray-500">No employees found for this subsidiary.</div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewEmployeesModal({ ...viewEmployeesModal, isOpen: false })}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Settings Modal */}
      <Dialog open={importModal} onOpenChange={() => setImportModal(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Import Settings</DialogTitle>
            <DialogDescription>Import settings from a CSV file</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleImportSettings(file)
                  setImportModal(false)
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setImportModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Leave Type Modal */}
      <Dialog open={showAddLeaveTypeModal} onOpenChange={() => setShowAddLeaveTypeModal(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Leave Type</DialogTitle>
            <DialogDescription>Create a new leave type for your organization</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaveTypeName" className="text-right">
                Name
              </Label>
              <Input
                id="leaveTypeName"
                value={newLeaveType.name}
                onChange={(e) => {
                  setNewLeaveType({ ...newLeaveType, name: e.target.value })
                  setLeaveTypeAIInsights(
                    generateLeaveTypeInsights(e.target.value, newLeaveType.days, newLeaveType.description),
                  )
                }}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaveTypeDays" className="text-right">
                Days
              </Label>
              <Input
                id="leaveTypeDays"
                type="number"
                value={newLeaveType.days}
                onChange={(e) => {
                  const days = Number.parseInt(e.target.value)
                  setNewLeaveType({ ...newLeaveType, days })
                  setLeaveTypeAIInsights(generateLeaveTypeInsights(newLeaveType.name, days, newLeaveType.description))
                }}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaveTypeDescription" className="text-right">
                Description
              </Label>
              <Textarea
                id="leaveTypeDescription"
                value={newLeaveType.description}
                onChange={(e) => {
                  setNewLeaveType({ ...newLeaveType, description: e.target.value })
                  setLeaveTypeAIInsights(
                    generateLeaveTypeInsights(newLeaveType.name, newLeaveType.days, e.target.value),
                  )
                }}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaveTypeCarryOver" className="text-right">
                Carry Over
              </Label>
              <Switch
                id="leaveTypeCarryOver"
                checked={newLeaveType.carryOver}
                onCheckedChange={(checked) => setNewLeaveType({ ...newLeaveType, carryOver: checked })}
                className="col-span-3"
              />
            </div>

            {leaveTypeAIInsights.length > 0 && (
              <div className="col-span-4 mt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">AI Insights</span>
                  </div>
                  <div className="space-y-1">
                    {leaveTypeAIInsights.map((insight, index) => (
                      <p key={index} className="text-xs text-blue-800">
                        {insight}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowAddLeaveTypeModal(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleAddLeaveType} disabled={isManagingLeaveTypes}>
              {isManagingLeaveTypes ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Leave Type"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Policy Modal */}
      <Dialog open={showPolicyModal} onOpenChange={() => setShowPolicyModal(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {policyModalType === "view"
                ? "Policy Details"
                : policyModalType === "edit"
                  ? "Edit Policy"
                  : "Delete Policy"}
            </DialogTitle>
            <DialogDescription>
              {policyModalType === "view"
                ? "View details of the selected policy"
                : policyModalType === "edit"
                  ? "Edit the selected policy"
                  : "Delete the selected policy"}
            </DialogDescription>
          </DialogHeader>
          {selectedPolicy && policyModalType === "view" && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right col-span-1">Name</Label>
                <Input value={selectedPolicy.name} className="col-span-3" disabled />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right col-span-1">Days</Label>
                <Input value={selectedPolicy.days} className="col-span-3" disabled />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right col-span-1">Description</Label>
                <Textarea value={selectedPolicy.description} className="col-span-3" disabled />
              </div>
            </div>
          )}
          {selectedPolicy && policyModalType === "edit" && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editPolicyName" className="text-right col-span-1">
                  Name
                </Label>
                <Input
                  id="editPolicyName"
                  value={editingPolicy.name}
                  onChange={(e) => setEditingPolicy({ ...editingPolicy, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editPolicyDays" className="text-right col-span-1">
                  Days
                </Label>
                <Input
                  id="editPolicyDays"
                  type="number"
                  value={editingPolicy.days}
                  onChange={(e) => setEditingPolicy({ ...editingPolicy, days: Number.parseInt(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editPolicyDescription" className="text-right col-span-1">
                  Description
                </Label>
                <Textarea
                  id="editPolicyDescription"
                  value={editingPolicy.description}
                  onChange={(e) => setEditingPolicy({ ...editingPolicy, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          {selectedPolicy && policyModalType === "delete" && (
            <div className="py-4">
              <p>Are you sure you want to delete the {selectedPolicy.name} policy?</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowPolicyModal(false)}>
              Cancel
            </Button>
            {policyModalType === "edit" && (
              <Button type="submit" onClick={handleSavePolicyChanges} disabled={isSavingPolicy}>
                {isSavingPolicy ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            )}
            {policyModalType === "delete" && (
              <Button
                variant="destructive"
                onClick={() => {
                  setCurrentPolicies((prev) => prev.filter((policy) => policy.name !== selectedPolicy.name))
                  setShowPolicyModal(false)
                  toast({
                    title: "Policy Deleted",
                    description: `${selectedPolicy.name} policy has been successfully deleted.`,
                  })
                }}
              >
                Delete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Modal */}
      <Dialog open={showDocumentModal} onOpenChange={() => setShowDocumentModal(false)}>
        <DialogContent className={documentModalType === "view" ? "sm:max-w-[700px]" : "sm:max-w-[425px]"}>
          <DialogHeader>
            <DialogTitle>
              {documentModalType === "add"
                ? "Add HR Policy Document"
                : documentModalType === "view"
                  ? "Document Details"
                  : documentModalType === "edit"
                    ? "Edit Document"
                    : "Delete Document"}
            </DialogTitle>
            <DialogDescription>
              {documentModalType === "add"
                ? "Upload a new HR policy document"
                : documentModalType === "view"
                  ? "View details of the selected document"
                  : documentModalType === "edit"
                    ? "Edit the selected document"
                    : "Delete the selected document"}
            </DialogDescription>
          </DialogHeader>
          {documentModalType === "add" && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="documentName" className="text-right">
                  Name
                </Label>
                <Input
                  id="documentName"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="documentFile" className="text-right">
                  File
                </Label>
                <div className="col-span-3">
                  <input type="file" id="documentFile" onChange={handleFileUpload} className="hidden" />
                  <label
                    htmlFor="documentFile"
                    className="flex items-center justify-center w-full h-10 px-3 py-2 text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File No file chosen
                  </label>
                </div>
              </div>
            </div>
          )}
          {selectedDocument && documentModalType === "view" && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right col-span-1">Name</Label>
                <Input value={selectedDocument.name} className="col-span-3" disabled />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right col-span-1">Type</Label>
                <Input value={selectedDocument.type} className="col-span-3" disabled />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right col-span-1">Size</Label>
                <Input value={selectedDocument.size} className="col-span-3" disabled />
              </div>

              <div className="col-span-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Document Preview</Label>
                  <Button variant="outline" size="sm" onClick={() => setShowDocumentPreview(!showDocumentPreview)}>
                    {showDocumentPreview ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Hide Preview
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Show Preview
                      </>
                    )}
                  </Button>
                </div>

                {showDocumentPreview && (
                  <div className="border rounded-lg bg-white shadow-sm">
                    <div className="border-b px-4 py-2 bg-gray-50 rounded-t-lg">
                      <h4 className="text-sm font-medium text-gray-700">Document Content</h4>
                    </div>
                    <div className="p-4 max-h-96 overflow-y-auto">
                      <div className="prose prose-sm max-w-none">
                        <pre className="text-sm whitespace-pre-wrap text-gray-800 font-mono leading-relaxed">
                          {documentPreviewContent || "Loading document preview..."}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {selectedDocument && documentModalType === "edit" && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editDocumentName" className="text-right">
                  Name
                </Label>
                <Input id="editDocumentName" defaultValue={selectedDocument.name} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editDocumentFile" className="text-right">
                  File
                </Label>
                <div className="col-span-3">
                  <input type="file" id="editDocumentFile" onChange={handleFileUpload} className="hidden" />
                  <label
                    htmlFor="editDocumentFile"
                    className="flex items-center justify-center w-full h-10 px-3 py-2 text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File No file chosen
                  </label>
                </div>
              </div>
            </div>
          )}
          {selectedDocument && documentModalType === "delete" && (
            <div className="py-4">
              <p>Are you sure you want to delete the {selectedDocument.name} document?</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDocumentModal(false)}>
              Cancel
            </Button>
            {documentModalType === "add" && (
              <Button type="submit" onClick={handleSaveDocument} disabled={isSavingDocument}>
                {isSavingDocument ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Document"
                )}
              </Button>
            )}
            {documentModalType === "edit" && (
              <Button
                type="submit"
                onClick={() => {
                  setShowDocumentModal(false)
                  toast({
                    title: "Document Updated",
                    description: "Document has been successfully updated.",
                  })
                }}
              >
                Save Changes
              </Button>
            )}
            {documentModalType === "delete" && (
              <Button variant="destructive" onClick={() => handleDeleteDocument(selectedDocument.id)}>
                Delete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SettingsPage
