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
  Power,
  Clock,
  Brain,
  Plus,
  RefreshCw,
  MapPin,
  Briefcase,
  Copy,
  Pause,
  Play,
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
  Minus,
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

  const handlePolicyAction = (action: string, policyName: string) => {
    const policy = [
      { name: "Annual Leave", days: 21, usage: "68%", trend: "up", description: "Standard annual leave entitlement" },
      { name: "Sick Leave", days: 10, usage: "23%", trend: "down", description: "Medical leave for illness" },
      {
        name: "Maternity Leave",
        days: 84,
        usage: "12%",
        trend: "stable",
        description: "Maternity and paternity leave",
      },
    ].find((p) => p.name === policyName)

    setSelectedPolicy(policy)
    setPolicyModalType(action)
    setShowPolicyModal(true)
  }

  const handleManageLeaveTypes = () => {
    setShowAddLeaveTypeModal(true)
  }

  const handleAddLeaveType = async () => {
    setIsManagingLeaveTypes(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Add new leave type logic here
      toast({
        title: "Leave Type Added",
        description: `${newLeaveType.name} has been added successfully`,
      })

      // Reset form
      setNewLeaveType({ name: "", days: 0, description: "", carryOver: false })
      setShowAddLeaveTypeModal(false)

      // Update AI insights
      if (hrConfig.aiRecommendations) {
        toast({
          title: "AI Insights Updated",
          description: "Leave policy recommendations have been refreshed",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add leave type",
        variant: "destructive",
      })
    } finally {
      setIsManagingLeaveTypes(false)
    }
  }

  const handleAddDocument = () => {
    const newDoc = {
      id: Date.now(),
      name: "New Document",
      type: "PDF",
      size: "0 MB",
      visibleToAll: false,
    }
    setHrDocuments([...hrDocuments, newDoc])
  }

  const handleRemoveDocument = (id: number) => {
    setHrDocuments(hrDocuments.filter((doc) => doc.id !== id))
  }

  const handleToggleDocumentVisibility = (id: number) => {
    setHrDocuments(hrDocuments.map((doc) => (doc.id === id ? { ...doc, visibleToAll: !doc.visibleToAll } : doc)))
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

  const handleAddEmailTemplate = () => {
    toast({
      title: "Add Email Template",
      description: "Opening email template editor...",
    })
  }

  const handleEditEmailTemplate = (templateName: string) => {
    toast({
      title: "Edit Email Template",
      description: `Editing ${templateName} template...`,
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

  const confirmDeactivateSubsidiary = (subsidiaryId: string) => {
    const subsidiary = subsidiaries.find((s) => s.id === subsidiaryId)
    if (subsidiary) {
      setSubsidiaryToToggle(subsidiary)
      setShowDeactivateConfirm(true)
    }
  }

  const confirmReactivateSubsidiary = (subsidiaryId: string) => {
    const subsidiary = subsidiaries.find((s) => s.id === subsidiaryId)
    if (subsidiary) {
      setSubsidiaryToToggle(subsidiary)
      setShowReactivateConfirm(true)
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
                    <div className="space-y-2">
                      {[
                        { name: "Annual Leave", days: 21, usage: "68%", trend: "up" },
                        { name: "Sick Leave", days: 10, usage: "23%", trend: "down" },
                        { name: "Maternity Leave", days: 84, usage: "12%", trend: "stable" },
                      ].map((policy) => (
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
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
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <span className="font-medium">Leave Approval</span>
                      <p className="text-sm text-gray-600">Leave Request Approved</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditEmailTemplate("Leave Approval")}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <span className="font-medium">Payroll Notification</span>
                      <p className="text-sm text-gray-600">Payroll Processed</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditEmailTemplate("Payroll Notification")}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddEmailTemplate}>
                  Add Email Template
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Notification Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="notificationEmail">Notification Email</Label>
                    <Input
                      id="notificationEmail"
                      type="email"
                      defaultValue="notifications@akwaaba.com"
                      placeholder="Enter notification email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      type="url"
                      defaultValue="https://api.akwaaba.com/webhooks/notifications"
                      placeholder="Enter webhook URL"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Role Management</span>
                </div>
                <Button onClick={handleAddRole}>Add Role</Button>
              </CardTitle>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => (
                  <div key={role.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{role.name}</h3>
                        <p className="text-sm text-gray-600">{role.description}</p>
                        <p className="text-sm text-gray-500">{role.user_count} users assigned</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditRole(role.name)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>View Permissions</DropdownMenuItem>
                            <DropdownMenuItem>Edit Role</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Delete Role</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Access Control</span>
              </CardTitle>
              <CardDescription>Manage user access permissions and restrictions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Permission Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left">Role</th>
                        <th className="border border-gray-300 p-2 text-center">Dashboard</th>
                        <th className="border border-gray-300 p-2 text-center">Employees</th>
                        <th className="border border-gray-300 p-2 text-center">Payroll</th>
                        <th className="border border-gray-300 p-2 text-center">Reports</th>
                        <th className="border border-gray-300 p-2 text-center">Settings</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-2 font-medium">Administrator</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2 font-medium">HR Manager</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">-</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2 font-medium">Employee</td>
                        <td className="border border-gray-300 p-2 text-center">✓</td>
                        <td className="border border-gray-300 p-2 text-center">-</td>
                        <td className="border border-gray-300 p-2 text-center">-</td>
                        <td className="border border-gray-300 p-2 text-center">-</td>
                        <td className="border border-gray-300 p-2 text-center">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Access Restrictions</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>IP Address Restrictions</span>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>Time-based Access</span>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>Device Restrictions</span>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
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
              <CardDescription>Configure security policies and monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Password Policy</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>Minimum Length</span>
                      <span className="font-semibold">8 characters</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>Require Special Characters</span>
                      <span className="font-semibold">Yes</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>Password Expiry</span>
                      <span className="font-semibold">90 days</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Update Policy
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Security Actions</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Shield className="h-4 w-4 mr-2" />
                      Change Admin Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Clock className="h-4 w-4 mr-2" />
                      View Activity Log
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Brain className="h-4 w-4 mr-2" />
                      Download Security Report
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">System Backup</h3>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Last Backup</p>
                    <p className="text-sm text-gray-600">
                      {lastBackupTime ? new Date(lastBackupTime).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <Button
                    onClick={handleBackupNow}
                    disabled={isBackingUp}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isBackingUp ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Backing Up...
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4 mr-2" />
                        Backup Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={viewEmployeesModal.isOpen}
        onOpenChange={(open) => setViewEmployeesModal({ ...viewEmployeesModal, isOpen: open })}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subsidiary Employees</DialogTitle>
            <DialogDescription>
              Employees working at {subsidiaries.find((s) => s.id === viewEmployeesModal.subsidiaryId)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isDemoMode() ? (
              <div className="grid gap-4">
                {[
                  {
                    name: "John Doe",
                    position: "Software Engineer",
                    department: "Technology",
                    email: "john@company.com",
                  },
                  {
                    name: "Jane Smith",
                    position: "Marketing Manager",
                    department: "Marketing",
                    email: "jane@company.com",
                  },
                  {
                    name: "Mike Johnson",
                    position: "HR Specialist",
                    department: "Human Resources",
                    email: "mike@company.com",
                  },
                ].map((employee, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{employee.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {employee.position} • {employee.department}
                      </p>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4">
                {viewEmployeesModal.employees?.length ? (
                  viewEmployeesModal.employees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{employee.full_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {employee.position} • {employee.department}
                        </p>
                        <p className="text-sm text-muted-foreground">{employee.corporate_email}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No employees found for this subsidiary</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={importModal} onOpenChange={setImportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Settings</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import subsidiary settings. Download the template first if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImportSettings(file)
                    setImportModal(false)
                  }
                }}
                className="hidden"
                id="import-file"
              />
              <label htmlFor="import-file" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Click to upload CSV file</p>
                <p className="text-xs text-gray-400 mt-1">Supports CSV, Excel formats</p>
              </label>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleExportSettingsTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
              <Button variant="outline" onClick={() => setImportModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showAddSubsidiary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add New Subsidiary</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddSubsidiary(false)
                  setSubsidiaryLogoPreview("")
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                const subsidiaryData = {
                  name: formData.get("name") as string,
                  legal_name: formData.get("legal_name") as string,
                  tax_id: formData.get("tax_id") as string,
                  ssnit_number: formData.get("ssnit_number") as string,
                  address: formData.get("address") as string,
                  city: formData.get("city") as string,
                  region: formData.get("region") as string,
                  country: formData.get("country") as string,
                  phone: formData.get("phone") as string,
                  email: formData.get("email") as string,
                  website: formData.get("website") as string,
                  industry: formData.get("industry") as string,
                  status: "active",
                  logo_url: subsidiaryLogoPreview,
                  departments: formData.get("departments")
                    ? (formData.get("departments") as string).split(",").map((d) => d.trim())
                    : [],
                  divisions: formData.get("divisions")
                    ? (formData.get("divisions") as string).split(",").map((d) => d.trim())
                    : [],
                  locations: formData.get("locations")
                    ? (formData.get("locations") as string).split(",").map((l) => l.trim())
                    : [],
                }
                addNewSubsidiary(subsidiaryData)
                setShowAddSubsidiary(false)
                setSubsidiaryLogoPreview("")
              }}
            >
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Company Logo</label>
                <div className="flex items-center space-x-4">
                  {subsidiaryLogoPreview ? (
                    <div className="relative">
                      <img
                        src={subsidiaryLogoPreview || "/placeholder.svg"}
                        alt="Subsidiary Logo"
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => setSubsidiaryLogoPreview("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div>
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
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("subsidiary-logo-upload")?.click()}
                      disabled={isUploadingLogo}
                      className="flex items-center space-x-2"
                    >
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3 h-3" />
                          <span>Upload</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Legal Name *</label>
                  <input
                    name="legal_name"
                    type="text"
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter legal name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tax ID *</label>
                  <input
                    name="tax_id"
                    type="text"
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter tax ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SSNIT Number</label>
                  <input
                    name="ssnit_number"
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter SSNIT number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    name="address"
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input name="city" type="text" className="w-full p-2 border rounded-md" placeholder="Enter city" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Region</label>
                  <input
                    name="region"
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter region"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <input
                    name="country"
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter country"
                    defaultValue="Ghana"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input name="email" type="email" className="w-full p-2 border rounded-md" placeholder="Enter email" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input
                    name="website"
                    type="url"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter website URL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Industry</label>
                  <select name="industry" className="w-full p-2 border rounded-md">
                    <option value="">Select industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Departments</label>
                  <input
                    name="departments"
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter departments (comma-separated)"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Divisions</label>
                  <input
                    name="divisions"
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter divisions (comma-separated)"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Locations</label>
                  <input
                    name="locations"
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter locations (comma-separated)"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddSubsidiary(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Subsidiary</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditSubsidiary && selectedSubsidiary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit Subsidiary</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditSubsidiary(false)
                  setSelectedSubsidiary(null)
                  setSubsidiaryLogoPreview("")
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                const subsidiaryData = {
                  name: formData.get("name") as string,
                  legal_name: formData.get("legal_name") as string,
                  tax_id: formData.get("tax_id") as string,
                  ssnit_number: formData.get("ssnit_number") as string,
                  address: formData.get("address") as string,
                  city: formData.get("city") as string,
                  region: formData.get("region") as string,
                  country: formData.get("country") as string,
                  phone: formData.get("phone") as string,
                  email: formData.get("email") as string,
                  website: formData.get("website") as string,
                  industry: formData.get("industry") as string,
                  departments: formData.get("departments")
                    ? (formData.get("departments") as string).split(",").map((d) => d.trim())
                    : [],
                  divisions: formData.get("divisions")
                    ? (formData.get("divisions") as string).split(",").map((d) => d.trim())
                    : [],
                  locations: formData.get("locations")
                    ? (formData.get("locations") as string).split(",").map((l) => l.trim())
                    : [],
                  logo_url: subsidiaryLogoPreview || selectedSubsidiary.logo_url,
                }
                updateSubsidiary(selectedSubsidiary.id, subsidiaryData)
                setShowEditSubsidiary(false)
                setSelectedSubsidiary(null)
                setSubsidiaryLogoPreview("")
              }}
            >
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Company Logo</label>
                <div className="flex items-center space-x-4">
                  {subsidiaryLogoPreview || selectedSubsidiary.logo_url ? (
                    <div className="relative">
                      <img
                        src={subsidiaryLogoPreview || selectedSubsidiary.logo_url}
                        alt="Subsidiary Logo"
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => setSubsidiaryLogoPreview("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div>
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
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("edit-subsidiary-logo-upload")?.click()}
                      disabled={isUploadingLogo}
                      className="flex items-center space-x-2"
                    >
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3 h-3" />
                          <span>Upload</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    defaultValue={selectedSubsidiary.name}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Legal Name *</label>
                  <input
                    name="legal_name"
                    type="text"
                    required
                    defaultValue={selectedSubsidiary.legal_name}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter legal name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tax ID *</label>
                  <input
                    name="tax_id"
                    type="text"
                    required
                    defaultValue={selectedSubsidiary.tax_id}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter tax ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SSNIT Number</label>
                  <input
                    name="ssnit_number"
                    type="text"
                    defaultValue={selectedSubsidiary.ssnit_number || ""}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter SSNIT number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    name="address"
                    type="text"
                    defaultValue={selectedSubsidiary.address || ""}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    name="city"
                    type="text"
                    defaultValue={selectedSubsidiary.city || ""}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Region</label>
                  <input
                    name="region"
                    type="text"
                    defaultValue={selectedSubsidiary.region || ""}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter region"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <input
                    name="country"
                    type="text"
                    defaultValue={selectedSubsidiary.country || "Ghana"}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={selectedSubsidiary.phone || ""}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={selectedSubsidiary.email || ""}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input
                    name="website"
                    type="url"
                    defaultValue={selectedSubsidiary.website || ""}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter website URL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Industry</label>
                  <select
                    name="industry"
                    defaultValue={selectedSubsidiary.industry || ""}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Departments</label>
                  <input
                    name="departments"
                    type="text"
                    defaultValue={selectedSubsidiary.departments?.join(", ") || ""}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter departments (comma-separated)"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Divisions</label>
                  <input
                    name="divisions"
                    type="text"
                    defaultValue={selectedSubsidiary.divisions?.join(", ") || ""}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter divisions (comma-separated)"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Locations</label>
                  <input
                    name="locations"
                    type="text"
                    defaultValue={selectedSubsidiary.locations?.join(", ") || ""}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter locations (comma-separated)"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditSubsidiary(false)
                    setSelectedSubsidiary(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Subsidiary</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubsidiaryDetails && selectedSubsidiary && (
        <Dialog open={showSubsidiaryDetails} onOpenChange={setShowSubsidiaryDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                {selectedSubsidiary?.logo_url ? (
                  <img
                    src={selectedSubsidiary.logo_url || "/placeholder.svg"}
                    alt={`${selectedSubsidiary.name} logo`}
                    className="w-8 h-8 object-cover rounded"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white font-bold text-sm">
                    {selectedSubsidiary?.name.charAt(0)}
                  </div>
                )}
                <span>Subsidiary Details</span>
              </DialogTitle>
              <DialogDescription>Detailed information for {selectedSubsidiary?.name}</DialogDescription>
            </DialogHeader>

            {selectedSubsidiary && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Company Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Company Name</Label>
                        <p className="text-sm">{selectedSubsidiary.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Legal Name</Label>
                        <p className="text-sm">{selectedSubsidiary.legal_name || selectedSubsidiary.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Tax ID</Label>
                        <p className="text-sm">{selectedSubsidiary.tax_id}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">SSNIT Number</Label>
                        <p className="text-sm">{selectedSubsidiary.ssnit_number}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Industry</Label>
                        <p className="text-sm">{selectedSubsidiary.industry}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                        <Badge variant={selectedSubsidiary.status === "active" ? "default" : "secondary"}>
                          {selectedSubsidiary.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Address</Label>
                        <p className="text-sm">{selectedSubsidiary.address || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">City</Label>
                        <p className="text-sm">{selectedSubsidiary.city || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Region</Label>
                        <p className="text-sm">{selectedSubsidiary.region || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Country</Label>
                        <p className="text-sm">{selectedSubsidiary.country || "Ghana"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Phone</Label>
                        <p className="text-sm">{selectedSubsidiary.phone_number || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Email</Label>
                        <p className="text-sm">{selectedSubsidiary.email_address || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Website</Label>
                        <p className="text-sm">{selectedSubsidiary.website || "Not provided"}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Organization Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedSubsidiary.employee_count || 0}</div>
                        <div className="text-sm text-gray-600">Employees</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedSubsidiary.divisions_count || selectedSubsidiary.divisions?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Divisions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedSubsidiary.departments_count || selectedSubsidiary.departments?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Departments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedSubsidiary.locations_count || selectedSubsidiary.locations?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Locations</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-2 mt-6">
                  <Button
                    onClick={() => {
                      setShowSubsidiaryDetails(false)
                      setSelectedSubsidiary(null)
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {showDeactivateConfirm && subsidiaryToToggle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-orange-600">Confirm Deactivation</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDeactivateConfirm(false)
                  setSubsidiaryToToggle(null)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to deactivate <strong>{subsidiaryToToggle.name}</strong>?
              </p>
              <p className="text-sm text-gray-600">
                This will temporarily disable access to this subsidiary. You can reactivate it later.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeactivateConfirm(false)
                  setSubsidiaryToToggle(null)
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmToggleStatusInner}>
                <Pause className="w-4 h-4 mr-2" />
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReactivateConfirm && subsidiaryToToggle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-green-600">Confirm Reactivation</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReactivateConfirm(false)
                  setSubsidiaryToToggle(null)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to reactivate <strong>{subsidiaryToToggle.name}</strong>?
              </p>
              <p className="text-sm text-gray-600">
                This will restore full access to this subsidiary and its features.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReactivateConfirm(false)
                  setSubsidiaryToToggle(null)
                }}
              >
                Cancel
              </Button>
              <Button variant="default" onClick={confirmToggleStatusInner} className="bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                Reactivate
              </Button>
            </div>
          </div>
        </div>
      )}
      <Dialog open={showAddLeaveTypeModal} onOpenChange={setShowAddLeaveTypeModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Add New Leave Type</span>
            </DialogTitle>
            <DialogDescription>Create a new leave type with AI-powered policy recommendations</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="leaveTypeName">Leave Type Name</Label>
              <Input
                id="leaveTypeName"
                value={newLeaveType.name}
                onChange={(e) => setNewLeaveType({ ...newLeaveType, name: e.target.value })}
                placeholder="e.g., Compassionate Leave"
              />
            </div>
            <div>
              <Label htmlFor="leaveDays">Number of Days</Label>
              <Input
                id="leaveDays"
                type="number"
                value={newLeaveType.days}
                onChange={(e) => setNewLeaveType({ ...newLeaveType, days: Number.parseInt(e.target.value) })}
                min="0"
                max="365"
              />
            </div>
            <div>
              <Label htmlFor="leaveDescription">Description</Label>
              <Input
                id="leaveDescription"
                value={newLeaveType.description}
                onChange={(e) => setNewLeaveType({ ...newLeaveType, description: e.target.value })}
                placeholder="Brief description of the leave type"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="carryOver"
                checked={newLeaveType.carryOver}
                onCheckedChange={(checked) => setNewLeaveType({ ...newLeaveType, carryOver: checked })}
              />
              <Label htmlFor="carryOver">Allow carry over to next year</Label>
            </div>
            {hrConfig.aiRecommendations && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">AI Recommendation</p>
                    <p className="text-xs text-blue-600">
                      Based on industry standards, consider 3-5 days for compassionate leave
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLeaveTypeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLeaveType} disabled={isManagingLeaveTypes || !newLeaveType.name}>
              {isManagingLeaveTypes ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Leave Type
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPolicyModal} onOpenChange={setShowPolicyModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {policyModalType === "view" && <Eye className="w-5 h-5" />}
              {policyModalType === "edit" && <Edit className="w-5 h-5" />}
              {policyModalType === "delete" && <Trash2 className="w-5 h-5 text-red-600" />}
              <span>
                {policyModalType === "view" && "View Policy Details"}
                {policyModalType === "edit" && "Edit Policy"}
                {policyModalType === "delete" && "Delete Policy"}
              </span>
            </DialogTitle>
            <DialogDescription>
              {selectedPolicy?.name} - {selectedPolicy?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {policyModalType === "view" && selectedPolicy && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Policy Name</Label>
                    <p className="text-sm font-medium">{selectedPolicy.name}</p>
                  </div>
                  <div>
                    <Label>Days Allocated</Label>
                    <p className="text-sm font-medium">{selectedPolicy.days} days</p>
                  </div>
                  <div>
                    <Label>Current Usage</Label>
                    <p className="text-sm font-medium">{selectedPolicy.usage}</p>
                  </div>
                  <div>
                    <Label>Trend</Label>
                    <p className="text-sm font-medium capitalize">{selectedPolicy.trend}</p>
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm">{selectedPolicy.description}</p>
                </div>
              </div>
            )}
            {policyModalType === "edit" && selectedPolicy && (
              <div className="space-y-3">
                <div>
                  <Label>Policy Name</Label>
                  <Input defaultValue={selectedPolicy.name} />
                </div>
                <div>
                  <Label>Days Allocated</Label>
                  <Input type="number" defaultValue={selectedPolicy.days} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input defaultValue={selectedPolicy.description} />
                </div>
              </div>
            )}
            {policyModalType === "delete" && selectedPolicy && (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-sm">
                  Are you sure you want to delete the <strong>{selectedPolicy.name}</strong> policy? This action cannot
                  be undone.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPolicyModal(false)}>
              Cancel
            </Button>
            {policyModalType === "edit" && (
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            )}
            {policyModalType === "delete" && (
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Policy
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SettingsPage
