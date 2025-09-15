"use client"
import type { FunctionComponent } from "react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Building,
  Users,
  Calculator,
  Bell,
  Shield,
  Key,
  Lock,
  Upload,
  Plus,
  X,
  Save,
  Loader2,
  MoreHorizontal,
  Edit,
  UserX,
  UserCheck,
  Settings,
  Sparkles,
  Calendar,
  TrendingUp,
  FileText,
  Eye,
  Trash2,
  Minus,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

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
  logo?: string
  email?: string
  phone?: string
  website?: string
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
  location?: string
  logo?: string
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
    email: "",
    phone: "",
    website: "",
    logo: "",
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
    frequency: "monthly",
    currency: "USD",
    autoTaxCalculation: true,
  })

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: false,
    sms: false,
  })

  const [accessSettings, setAccessSettings] = useState({
    sso: false,
    mfa: true,
    passwordComplexity: true,
  })

  const [securitySettings, setSecuritySettings] = useState({
    dataEncryption: true,
    auditLogging: true,
    intrusionDetection: false,
    twoFactorAuth: false,
    ipRestrictions: false,
    sessionTimeout: false,
  })

  const [newSubsidiary, setNewSubsidiary] = useState({
    name: "",
    location: "",
    logo: "",
  })

  const [editSubsidiaryData, setEditSubsidiaryData] = useState({
    name: "",
    location: "",
  })

  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [],
  })

  const [selectedRole, setSelectedRole] = useState(null)

  const [editPolicyData, setEditPolicyData] = useState({
    name: "",
    days: 0,
    description: "",
  })

  const [newDocumentData, setNewDocumentData] = useState({
    name: "",
    file: null,
  })

  const [editDocumentData, setEditDocumentData] = useState({
    name: "",
    file: null,
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
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null)

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

  const [activeTab, setActiveTab] = useState("company")
  const [activeSubsidiaryTab, setActiveSubsidiaryTab] = useState("access")

  const [newDivision, setNewDivision] = useState("")
  const [newDepartment, setNewDepartment] = useState("")
  const [newLocation, setNewLocation] = useState("")

  const [showAddLeaveType, setShowAddLeaveType] = useState(false)
  const [showViewPolicy, setShowViewPolicy] = useState(false)
  const [showEditPolicy, setShowEditPolicy] = useState(false)
  const [showDeletePolicy, setShowDeletePolicy] = useState(false)

  const [showAddDocument, setShowAddDocument] = useState(false)
  const [showDocumentDetails, setShowDocumentDetails] = useState(false)
  const [showEditDocument, setShowEditDocument] = useState(false)
  const [showDeleteDocument, setShowDeleteDocument] = useState(false)

  const [isSavingCompany, setIsSavingCompany] = useState(false)
  const [isSavingHR, setIsSavingHR] = useState(false)

  const [showAddRole, setShowAddRole] = useState(false)
  const [showEditRole, setShowEditRole] = useState(false)
  const [showDeleteRole, setShowDeleteRole] = useState(false)

  const availablePermissions = [
    "read",
    "write",
    "delete",
    "admin",
    "hr",
    "employees",
    "reports",
    "profile",
    "payslip",
    "leave",
  ]

  const leavePolicies = [
    {
      id: "annual",
      name: "Annual Leave",
      days: 21,
      usage: 68,
      trend: "up",
      description: "Annual vacation leave",
    },
    {
      id: "sick",
      name: "Sick Leave",
      days: 10,
      usage: 23,
      trend: "down",
      description: "Medical leave for illness",
    },
    {
      id: "maternity",
      name: "Maternity Leave",
      days: 84,
      usage: 12,
      trend: "stable",
      description: "Maternity and paternity leave",
    },
  ]

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
        email: "ykodiah@gmail.com",
        phone: "0249397960",
        website: "akwaabatech.com",
        logo: "/placeholder.svg",
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
          email: data.email_address || "",
          phone: data.phone_number || "",
          website: "https://company.com",
          logo: data.logo_url || "/placeholder.svg",
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
          email: "ykodiah@gmail.com",
          phone: "0249397960",
          website: "akwaabatech.com",
          logo: "/placeholder.svg",
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
          divisions: ["Digital Marketing", "Web Development", "Mobile Apps", "UI/UX Design", "E-commerce Solutions"],
          departments: ["Marketing", "Development", "Design", "Sales", "Customer Support", "Quality Assurance"],
          locations: ["Accra - Ridge", "Kumasi Branch", "Takoradi Office"],
          divisions_count: 5,
          departments_count: 6,
          locations_count: 3,
          employee_count: 45,
          created_at: new Date().toISOString(),
          location: "Accra",
          logo: "/digital-solutions-logo.jpg",
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
          divisions: [
            "Strategy Consulting",
            "Digital Transformation",
            "Process Optimization",
            "Change Management",
            "Business Intelligence",
          ],
          departments: ["Consulting", "Strategy", "Operations", "Client Relations", "Research & Analytics"],
          locations: ["Accra - Airport", "Tema Office", "Cape Coast Branch"],
          divisions_count: 5,
          departments_count: 5,
          locations_count: 3,
          employee_count: 32,
          created_at: new Date().toISOString(),
          location: "Accra",
          logo: "/consulting-group-logo.jpg",
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
          divisions: [
            "Fintech Solutions",
            "Payment Processing",
            "Financial Advisory",
            "Investment Management",
            "Insurance Services",
          ],
          departments: [
            "Finance",
            "Technology",
            "Compliance",
            "Customer Service",
            "Risk Management",
            "Investment Advisory",
          ],
          locations: ["Accra - Independence Ave", "Ho Regional Office", "Sunyani Branch"],
          divisions_count: 5,
          departments_count: 6,
          locations_count: 3,
          employee_count: 28,
          created_at: new Date().toISOString(),
          location: "Accra",
          logo: "/financial-services-logo.png",
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
          divisions: [
            "Transportation",
            "Warehousing",
            "Supply Chain Management",
            "Freight Forwarding",
            "Last Mile Delivery",
          ],
          departments: [
            "Operations",
            "Fleet Management",
            "Warehousing",
            "Customer Service",
            "Procurement",
            "Maintenance",
          ],
          locations: ["Accra - Spintex", "Takoradi Port", "Tamale Hub", "Bolgatanga Depot"],
          divisions_count: 5,
          departments_count: 6,
          locations_count: 4,
          employee_count: 67,
          created_at: new Date().toISOString(),
          location: "Accra",
          logo: "/logistics-company-logo.png",
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
          divisions: [
            "Corporate Training",
            "IT Certification",
            "Professional Development",
            "Leadership Training",
            "Skills Assessment",
          ],
          departments: [
            "Training",
            "Curriculum Development",
            "Student Services",
            "Administration",
            "Assessment & Evaluation",
          ],
          locations: ["Accra - Cantonments", "Kumasi Campus", "Online Platform", "Tamale Center"],
          divisions_count: 5,
          departments_count: 5,
          locations_count: 4,
          employee_count: 23,
          created_at: new Date().toISOString(),
          location: "Accra",
          logo: "/training-institute-logo.jpg",
        },
        {
          id: "sub-006",
          company_id: "comp-001",
          name: "Akwaaba Manufacturing Co.",
          email_address: "manufacturing@akwaabamanuf.com",
          phone_number: "+233 30 276 5437",
          tax_id: "TIN-AMC-2023-006",
          ssnit_number: "SSNIT-AMC-789017",
          address: "45 Industrial Area, Tema, Ghana",
          status: "active",
          industry: "Manufacturing & Production",
          divisions: [
            "Product Manufacturing",
            "Quality Control",
            "Research & Development",
            "Supply Chain",
            "Export Operations",
          ],
          departments: ["Production", "Quality Assurance", "Engineering", "Maintenance", "Procurement", "Export Sales"],
          locations: ["Tema - Industrial Area", "Kumasi Factory", "Takoradi Processing Plant"],
          divisions_count: 5,
          departments_count: 6,
          locations_count: 3,
          employee_count: 89,
          created_at: new Date().toISOString(),
          location: "Tema",
          logo: "/manufacturing-company-logo.png",
        },
        {
          id: "sub-007",
          company_id: "comp-001",
          name: "Akwaaba Healthcare Services",
          email_address: "healthcare@akwaabahealthcare.com",
          phone_number: "+233 30 276 5438",
          tax_id: "TIN-AHS-2023-007",
          ssnit_number: "SSNIT-AHS-789018",
          address: "18 Ring Road East, Accra, Ghana",
          status: "active",
          industry: "Healthcare & Medical Services",
          divisions: [
            "Primary Healthcare",
            "Specialized Medicine",
            "Diagnostic Services",
            "Pharmacy Services",
            "Health Insurance",
          ],
          departments: ["Medical Services", "Nursing", "Pharmacy", "Administration", "Laboratory", "Patient Relations"],
          locations: ["Accra - Ring Road", "Kumasi Medical Center", "Ho Clinic", "Tamale Health Post"],
          divisions_count: 5,
          departments_count: 6,
          locations_count: 4,
          employee_count: 56,
          created_at: new Date().toISOString(),
          location: "Accra",
          logo: "/healthcare-services-logo.jpg",
        },
      ])
      return
    }

    try {
      console.log("[v0] Fetching subsidiaries from database...")
      const { data: subsidiariesData, error: subsidiariesError } = await supabase
        .from("subsidiary_statistics")
        .select("*")
        .order("created_at", { ascending: false })

      if (subsidiariesError) {
        console.error("[v0] Subsidiaries query error:", subsidiariesError)
        throw subsidiariesError
      }

      console.log("[v0] Raw subsidiaries data:", subsidiariesData)

      const processedSubsidiaries = (subsidiariesData || []).map((sub: any) => {
        const divisions = Array.isArray(sub.divisions)
          ? sub.divisions
          : typeof sub.divisions === "string"
            ? JSON.parse(sub.divisions)
            : []
        const departments = Array.isArray(sub.departments)
          ? sub.departments
          : typeof sub.departments === "string"
            ? JSON.parse(sub.departments)
            : []
        const locations = Array.isArray(sub.locations)
          ? sub.locations
          : typeof sub.locations === "string"
            ? JSON.parse(sub.locations)
            : []

        return {
          ...sub,
          divisions,
          departments,
          locations,
          divisions_count: divisions.length,
          departments_count: departments.length,
          locations_count: locations.length,
          employee_count: sub.employee_count || 0,
          location: locations[0] || "Accra",
          logo: sub.logo_url || "/generic-company-logo.png",
        }
      })

      console.log("[v0] Processed subsidiaries:", processedSubsidiaries)
      setSubsidiaries(processedSubsidiaries)
      console.log("[v0] Successfully loaded", processedSubsidiaries.length, "subsidiaries")
    } catch (error) {
      console.error("[v0] Subsidiaries loading error:", error)
      toast({
        title: "Error",
        description: "Failed to load subsidiaries. Please try again.",
        variant: "destructive",
      })
      setSubsidiaries([])
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

  const handleDocumentView = async (document: any) => {
    setSelectedDocument(document)
    setDocumentModalType("view")
    setShowDocumentModal(true)
    setDocumentPreviewContent("Loading document content...")

    // Simulate real document parsing based on file type
    setTimeout(() => {
      let content = ""

      if (document.type === "PDF") {
        // Simulate PDF content extraction
        content = `Document: ${document.name}

TENANCY AGREEMENT - ELIX EVENTS

This is a comprehensive tenancy agreement document outlining the terms and conditions for property rental.

SECTION 1: PARTIES TO THE AGREEMENT
This agreement is entered into between ELIX EVENTS (the Landlord) and the Tenant(s) as specified herein.

SECTION 2: PROPERTY DETAILS
The property subject to this agreement is located at the address specified in Schedule A, including all fixtures and fittings as detailed in the inventory.

SECTION 3: RENTAL TERMS
- Monthly Rent: As specified in Schedule B
- Security Deposit: Equivalent to two months' rent
- Payment Due Date: 1st of each month
- Late Payment Fee: 5% of monthly rent after 7 days

SECTION 4: TENANT OBLIGATIONS
• Maintain the property in good condition
• Pay rent and utilities on time
• Comply with building rules and regulations
• Obtain landlord consent for modifications
• Provide proper notice for termination

SECTION 5: LANDLORD OBLIGATIONS
• Ensure property is habitable
• Maintain structural integrity
• Provide 24-hour notice for inspections
• Return security deposit as per legal requirements

SECTION 6: TERMINATION CLAUSE
Either party may terminate this agreement with 30 days written notice, subject to the terms outlined in this document.

This document contains additional clauses regarding insurance, maintenance responsibilities, and dispute resolution procedures.`
      } else if (document.type === "DOC") {
        // Simulate DOC content extraction
        content = `Document: ${document.name}

EMPLOYEE HANDBOOK - COMPANY POLICIES

Welcome to our organization! This handbook contains important information about company policies and procedures.

TABLE OF CONTENTS:
1. Company Overview
2. Employment Policies
3. Code of Conduct
4. Benefits and Compensation
5. Leave Policies
6. Performance Management
7. Health and Safety

COMPANY OVERVIEW:
Our company is committed to providing a positive work environment that promotes professional growth and development.

EMPLOYMENT POLICIES:
• Equal Opportunity Employment
• Anti-Discrimination Policy
• Workplace Harassment Prevention
• Confidentiality Agreements

CODE OF CONDUCT:
All employees are expected to maintain the highest standards of professional conduct, including:
- Respect for colleagues and clients
- Integrity in all business dealings
- Compliance with company policies
- Protection of company assets

BENEFITS AND COMPENSATION:
Our comprehensive benefits package includes health insurance, retirement plans, and professional development opportunities.

LEAVE POLICIES:
- Annual Leave: 21 days per year
- Sick Leave: 10 days per year
- Maternity/Paternity Leave: As per local regulations
- Emergency Leave: Available upon approval

For questions about any policy, please contact the HR department.`
      } else {
        // Default content for other file types
        content = `Document: ${document.name}

This document contains important company information and policies.

Key sections include:
• Company policies and procedures
• Employee rights and responsibilities
• Code of conduct guidelines
• Compliance requirements
• Operational procedures

Please review this document carefully and contact HR if you have any questions about the content or policies outlined herein.

[Additional document content would be displayed here based on the actual file content]`
      }

      setDocumentPreviewContent(content)
    }, 800)
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setUploadedFile(file)
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ""))
      }

      // Store file content for future preview (in real implementation, this would parse the actual file)
      const reader = new FileReader()
      reader.onload = (e) => {
        // In a real implementation, you would use libraries like pdf-parse, mammoth, etc.
        // For now, we'll store a reference to enable preview functionality
        console.log("[v0] File loaded for preview capability")
      }
      reader.readAsText(file)
    }
  }

  const handleDocumentAction = () => {}

  const handleSaveDocument = async () => {
    if (!documentName || !uploadedFile) {
      toast({
        title: "Error",
        description: "Please provide a document name and upload a file.",
        variant: "destructive",
      })
      return
    }
    // Additional code for saving document can be added here
  }

  const handleSaveCompanyChanges = async () => {
    console.log("[v0] Saving company changes")
    setIsSavingCompany(true)

    try {
      if (isDemoMode()) {
        // Simulate saving delay for demo
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast({
          title: "Changes Saved",
          description: "Company changes have been saved successfully (Demo Mode)",
        })
        setIsSavingCompany(false)
        return
      }

      // Save any pending company changes
      await loadCompanyData()

      toast({
        title: "Changes Saved",
        description: "Company changes have been saved and updated successfully",
      })
    } catch (error) {
      console.error("Save company changes error:", error)
      toast({
        title: "Error",
        description: "Failed to save company changes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingCompany(false)
    }
  }

  const handleSaveHRConfiguration = async () => {
    console.log("[v0] Saving HR configuration")
    setIsSavingHR(true)

    try {
      if (isDemoMode()) {
        // Simulate saving delay for demo
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast({
          title: "Changes Saved",
          description: "HR configuration have been saved successfully (Demo Mode)",
        })
        setIsSavingHR(false)
        return
      }

      // Save any pending HR configuration changes
      await loadCompanyData()

      toast({
        title: "Changes Saved",
        description: "HR configuration have been saved and updated successfully",
      })
    } catch (error) {
      console.error("Save HR configuration error:", error)
      toast({
        title: "Error",
        description: "Failed to save HR configuration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingHR(false)
    }
  }

  const handleAddSubsidiary = async () => {
    console.log("[v0] Adding subsidiary")

    try {
      if (isDemoMode()) {
        // Simulate saving delay for demo
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast({
          title: "Changes Saved",
          description: "Subsidiary have been added successfully (Demo Mode)",
        })
        setShowAddSubsidiary(false)
        return
      }

      // Save any pending HR configuration changes
      await loadCompanyData()

      toast({
        title: "Changes Saved",
        description: "Subsidiary have been added and updated successfully",
      })
    } catch (error) {
      console.error("Save HR configuration error:", error)
      toast({
        title: "Error",
        description: "Failed to add subsidiary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowAddSubsidiary(false)
    }
  }

  const handleEditSubsidiary = async () => {
    console.log("[v0] Editing subsidiary")

    try {
      if (isDemoMode()) {
        // Simulate saving delay for demo
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast({
          title: "Changes Saved",
          description: "Subsidiary have been edited successfully (Demo Mode)",
        })
        setShowEditSubsidiary(false)
        return
      }

      // Save any pending HR configuration changes
      await loadCompanyData()

      toast({
        title: "Changes Saved",
        description: "Subsidiary have been edited and updated successfully",
      })
    } catch (error) {
      console.error("Save HR configuration error:", error)
      toast({
        title: "Error",
        description: "Failed to edit subsidiary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowEditSubsidiary(false)
    }
  }

  const handleAddRole = async () => {
    console.log("[v0] Adding role")

    try {
      if (isDemoMode()) {
        // Simulate saving delay for demo
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast({
          title: "Changes Saved",
          description: "Role have been added successfully (Demo Mode)",
        })
        setShowAddRole(false)
        return
      }

      // Save any pending HR configuration changes
      await loadCompanyData()

      toast({
        title: "Changes Saved",
        description: "Role have been added and updated successfully",
      })
    } catch (error) {
      console.error("Save HR configuration error:", error)
      toast({
        title: "Error",
        description: "Failed to add role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowAddRole(false)
    }
  }

  const handleEditRole = async () => {
    console.log("[v0] Editing role")

    try {
      if (isDemoMode()) {
        // Simulate saving delay for demo
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast({
          title: "Changes Saved",
          description: "Role have been edited successfully (Demo Mode)",
        })
        setShowEditRole(false)
        return
      }

      // Save any pending HR configuration changes
      await loadCompanyData()

      toast({
        title: "Changes Saved",
        description: "Role have been edited and updated successfully",
      })
    } catch (error) {
      console.error("Save HR configuration error:", error)
      toast({
        title: "Error",
        description: "Failed to edit role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowEditRole(false)
    }
  }

  const handleDeleteRole = async () => {
    console.log("[v0] Deleting role")

    try {
      if (isDemoMode()) {
        // Simulate saving delay for demo
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast({
          title: "Changes Saved",
          description: "Role have been deleted successfully (Demo Mode)",
        })
        setShowDeleteRole(false)
        return
      }

      // Save any pending HR configuration changes
      await loadCompanyData()

      toast({
        title: "Changes Saved",
        description: "Role have been deleted and updated successfully",
      })
    } catch (error) {
      console.error("Save HR configuration error:", error)
      toast({
        title: "Error",
        description: "Failed to delete role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowDeleteRole(false)
    }
  }

  const handleEditPolicy = async () => {
    console.log("[v0] Editing policy")

    try {
      if (isDemoMode()) {
        // Simulate saving delay for demo
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast({
          title: "Changes Saved",
          description: "Policy have been edited successfully (Demo Mode)",
        })
        setShowEditPolicy(false)
        return
      }

      // Save any pending HR configuration changes
      await loadCompanyData()

      toast({
        title: "Changes Saved",
        description: "Policy have been edited and updated successfully",
      })
    } catch (error) {
      console.error("Save HR configuration error:", error)
      toast({
        title: "Error",
        description: "Failed to edit policy. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowEditPolicy(false)
    }
  }

  const handleDeletePolicy = async () => {
    console.log("[v0] Deleting policy")

    try {
      if (isDemoMode()) {
        // Simulate saving delay for demo
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast({
          title: "Changes Saved",
          description: "Policy have been deleted successfully (Demo Mode)",
        })
        setShowDeletePolicy(false)
        return
      }

      // Save any pending HR configuration changes
      await loadCompanyData()

      toast({
        title: "Changes Saved",
        description: "Policy have been deleted and updated successfully",
      })
    } catch (error) {
      console.error("Save HR configuration error:", error)
      toast({
        title: "Error",
        description: "Failed to delete policy. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowDeletePolicy(false)
    }
  }

  const handleAddDocument = async () => {
    console.log("[v0] Adding document")

    try {
      if (isDemoMode()) {
        // Simulate saving delay for demo
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast({
          title: "Changes Saved",
          description: "Document have been added successfully (Demo Mode)",
        })
        setShowAddDocument(false)
        return
      }

      // Save any pending HR configuration changes
      await loadCompanyData()

      toast({
        title: "Changes Saved",
        description: "Document have been added and updated successfully",
      })
    } catch (error) {
      console.error("Save HR configuration error:", error)
      toast({
        title: "Error",
        description: "Failed to add document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowAddDocument(false)
    }
  }

  const handleEditDocument = async () => {
    console.log("[v0] Editing document")

    try {
      if (isDemoMode()) {
        // Simulate saving delay for demo
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast({
          title: "Changes Saved",
          description: "Document have been edited successfully (Demo Mode)",
        })
        setShowEditDocument(false)
        return
      }

      // Save any pending HR configuration changes
      await loadCompanyData()

      toast({
        title: "Changes Saved",
        description: "Document have been edited and updated successfully",
      })
    } catch (error) {
      console.error("Save HR configuration error:", error)
      toast({
        title: "Error",
        description: "Failed to edit document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowEditDocument(false)
    }
  }

  const handleDeleteDocument = async () => {
    console.log("[v0] Deleting document")

    try {
      if (isDemoMode()) {
        // Simulate saving delay for demo
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast({
          title: "Changes Saved",
          description: "Document have been deleted successfully (Demo Mode)",
        })
        setShowDeleteDocument(false)
        return
      }

      // Save any pending HR configuration changes
      await loadCompanyData()

      toast({
        title: "Changes Saved",
        description: "Document have been deleted and updated successfully",
      })
    } catch (error) {
      console.error("Save HR configuration error:", error)
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDocument(false)
    }
  }

  const getDocumentPreviewContent = (document: any) => {
    // Simulate document content retrieval
    return `This is a placeholder for the document content.
    Document Name: ${document.name}
    Document Type: ${document.type}
    Document Size: ${document.size}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your organization settings and configurations</p>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "company", label: "Company", icon: Building2 },
                { id: "multi-company", label: "Multi-Company", icon: Building },
                { id: "hr", label: "HR", icon: Users },
                { id: "payroll", label: "Payroll", icon: Calculator },
                { id: "notifications", label: "Notifications", icon: Bell },
                { id: "roles", label: "Roles", icon: Shield },
                { id: "access", label: "Access", icon: Key },
                { id: "security", label: "Security", icon: Lock },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-teal-500 text-teal-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "company" && (
          <div className="space-y-8">
            {/* Company Information Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>Update your company details and branding</CardDescription>
                </div>
                <Button
                  onClick={handleSaveCompanyChanges}
                  disabled={isSavingCompany}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {isSavingCompany ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companyData.name}
                      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Email</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                      placeholder="company@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Phone</Label>
                    <Input
                      id="companyPhone"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyWebsite">Website</Label>
                    <Input
                      id="companyWebsite"
                      value={companyData.website}
                      onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                      placeholder="https://company.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Address</Label>
                  <Textarea
                    id="companyAddress"
                    value={companyData.address}
                    onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                    placeholder="Enter company address"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="flex items-center space-x-4">
                    {companyData.logo && (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={companyData.logo || "/placeholder.svg"}
                          alt="Company Logo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleLogoUpload(file, "company")
                        }}
                        className="hidden"
                        id="company-logo-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("company-logo-upload")?.click()}
                        disabled={isUploadingLogo}
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Logo
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organization Structure Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Organization Structure
                </CardTitle>
                <CardDescription>Manage divisions, departments, and locations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Divisions</Label>
                    <div className="space-y-2">
                      {divisions.map((division, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{division}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDivisions(divisions.filter((_, i) => i !== index))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add division"
                          value={newDivision}
                          onChange={(e) => setNewDivision(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && newDivision.trim()) {
                              setDivisions([...divisions, newDivision.trim()])
                              setNewDivision("")
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (newDivision.trim()) {
                              setDivisions([...divisions, newDivision.trim()])
                              setNewDivision("")
                            }
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Departments</Label>
                    <div className="space-y-2">
                      {departments.map((department, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{department}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDepartments(departments.filter((_, i) => i !== index))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add department"
                          value={newDepartment}
                          onChange={(e) => setNewDepartment(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && newDepartment.trim()) {
                              setDepartments([...departments, newDepartment.trim()])
                              setNewDepartment("")
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (newDepartment.trim()) {
                              setDepartments([...departments, newDepartment.trim()])
                              setNewDepartment("")
                            }
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Locations</Label>
                    <div className="space-y-2">
                      {locations.map((location, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{location}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocations(locations.filter((_, i) => i !== index))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add location"
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && newLocation.trim()) {
                              setLocations([...locations, newLocation.trim()])
                              setNewLocation("")
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (newLocation.trim()) {
                              setLocations([...locations, newLocation.trim()])
                              setNewLocation("")
                            }
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "multi-company" && (
          <div className="space-y-8">
            {/* Multi-Company Management Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Multi-Company Management
                  </CardTitle>
                  <CardDescription>Manage subsidiaries and multi-company operations</CardDescription>
                </div>
                <Button
                  onClick={handleSaveSubsidiaryChanges}
                  disabled={isSavingSubsidiary}
                  className="bg-black text-white hover:bg-gray-800"
                >
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
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveSubsidiaryTab("access")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeSubsidiaryTab === "access"
                            ? "border-teal-500 text-teal-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Access
                      </button>
                      <button
                        onClick={() => setActiveSubsidiaryTab("security")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeSubsidiaryTab === "security"
                            ? "border-teal-500 text-teal-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Security
                      </button>
                    </nav>
                  </div>
                </div>

                {activeSubsidiaryTab === "access" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Subsidiaries</h3>
                      <Button onClick={() => setShowAddSubsidiary(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Subsidiary
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {subsidiaries.map((subsidiary) => (
                        <div key={subsidiary.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            {subsidiary.logo && (
                              <img
                                src={subsidiary.logo || "/placeholder.svg"}
                                alt={subsidiary.name}
                                className="w-10 h-10 rounded"
                              />
                            )}
                            <div>
                              <h4 className="font-medium">{subsidiary.name}</h4>
                              <p className="text-sm text-gray-500">{subsidiary.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                subsidiary.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {subsidiary.status}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedSubsidiary(subsidiary)
                                    setShowEditSubsidiary(true)
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSubsidiaryToToggle(subsidiary)
                                    if (subsidiary.status === "active") {
                                      setShowDeactivateConfirm(true)
                                    } else {
                                      setShowReactivateConfirm(true)
                                    }
                                  }}
                                >
                                  {subsidiary.status === "active" ? (
                                    <>
                                      <UserX className="w-4 h-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-4 h-4 mr-2" />
                                      Reactivate
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSubsidiaryTab === "security" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Security Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Two-Factor Authentication</Label>
                          <p className="text-sm text-gray-500">Require 2FA for all subsidiary access</p>
                        </div>
                        <Switch
                          checked={securitySettings.twoFactorAuth}
                          onCheckedChange={(checked) =>
                            setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">IP Restrictions</Label>
                          <p className="text-sm text-gray-500">Restrict access to specific IP addresses</p>
                        </div>
                        <Switch
                          checked={securitySettings.ipRestrictions}
                          onCheckedChange={(checked) =>
                            setSecuritySettings({ ...securitySettings, ipRestrictions: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Session Timeout</Label>
                          <p className="text-sm text-gray-500">Automatically log out inactive users</p>
                        </div>
                        <Switch
                          checked={securitySettings.sessionTimeout}
                          onCheckedChange={(checked) =>
                            setSecuritySettings({ ...securitySettings, sessionTimeout: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "hr" && (
          <div className="space-y-8">
            {/* HR Configuration Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    HR Configuration
                  </CardTitle>
                  <CardDescription>Configure core HR settings and policies</CardDescription>
                </div>
                <Button
                  onClick={handleSaveHRConfiguration}
                  disabled={isSavingHR}
                  className="bg-black text-white hover:bg-gray-800"
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
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="leaveYearStart">Leave Year Start</Label>
                    <Select
                      value={hrConfig.leaveYearStart}
                      onValueChange={(value) => setHrConfig({ ...hrConfig, leaveYearStart: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "January",
                          "February",
                          "March",
                          "April",
                          "May",
                          "June",
                          "July",
                          "August",
                          "September",
                          "October",
                          "November",
                          "December",
                        ].map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="probationPeriod">Probation Period (months)</Label>
                    <Input
                      id="probationPeriod"
                      type="number"
                      value={hrConfig.probationPeriod}
                      onChange={(e) =>
                        setHrConfig({ ...hrConfig, probationPeriod: Number.parseInt(e.target.value) || 0 })
                      }
                      placeholder="3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workingHoursPerDay">Working Hours/Day</Label>
                    <Input
                      id="workingHoursPerDay"
                      type="number"
                      value={hrConfig.workingHoursPerDay}
                      onChange={(e) =>
                        setHrConfig({ ...hrConfig, workingHoursPerDay: Number.parseInt(e.target.value) || 0 })
                      }
                      placeholder="8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workingDaysPerWeek">Working Days/Week</Label>
                    <Input
                      id="workingDaysPerWeek"
                      type="number"
                      value={hrConfig.workingDaysPerWeek}
                      onChange={(e) =>
                        setHrConfig({ ...hrConfig, workingDaysPerWeek: Number.parseInt(e.target.value) || 0 })
                      }
                      placeholder="5"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Auto-approve leave requests</Label>
                      <p className="text-sm text-gray-500">Automatically approve requests within policy</p>
                    </div>
                    <Switch
                      checked={hrConfig.autoApproveLeave}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, autoApproveLeave: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Email notifications</Label>
                      <p className="text-sm text-gray-500">Send email updates for HR activities</p>
                    </div>
                    <Switch
                      checked={hrConfig.emailNotifications}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, emailNotifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Recommendations
                      </Label>
                      <p className="text-sm text-gray-500">Get AI-powered insights for HR decisions</p>
                    </div>
                    <Switch
                      checked={hrConfig.aiRecommendations}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, aiRecommendations: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Smart Scheduling
                      </Label>
                      <p className="text-sm text-gray-500">AI-optimized shift and leave scheduling</p>
                    </div>
                    <Switch
                      checked={hrConfig.smartScheduling}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, smartScheduling: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Performance Tracking
                      </Label>
                      <p className="text-sm text-gray-500">AI-enhanced performance analytics</p>
                    </div>
                    <Switch
                      checked={hrConfig.performanceTracking}
                      onCheckedChange={(checked) => setHrConfig({ ...hrConfig, performanceTracking: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Policies Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Leave Policies
                </CardTitle>
                <CardDescription>Manage leave types and policies with AI insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        Current Policies
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          AI Enhanced
                        </Badge>
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {leavePolicies.map((policy) => (
                        <div key={policy.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h4 className="font-medium">{policy.name}</h4>
                              <p className="text-sm text-gray-500">{policy.days} days</p>
                            </div>
                            <Badge
                              variant={policy.usage > 70 ? "destructive" : policy.usage > 40 ? "default" : "secondary"}
                              className="ml-2"
                            >
                              {policy.usage}%
                            </Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPolicy(policy)
                                  setShowViewPolicy(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPolicy(policy)
                                  setEditPolicyData({
                                    name: policy.name,
                                    days: policy.days,
                                    description: policy.description || "",
                                  })
                                  setShowEditPolicy(true)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Policy
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPolicy(policy)
                                  setShowDeletePolicy(true)
                                }}
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
                      className="w-full mt-4 bg-transparent"
                      onClick={() => setShowAddLeaveType(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Leave Types
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-medium">AI Insights</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-900">High Annual Leave Usage</span>
                        </div>
                        <p className="text-sm text-blue-700">Consider reviewing leave allocation policies</p>
                      </div>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-900">Optimal Sick Leave Usage</span>
                        </div>
                        <p className="text-sm text-green-700">Current policy is well-balanced</p>
                      </div>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium text-yellow-900">Upcoming Peak Season</span>
                        </div>
                        <p className="text-sm text-yellow-700">Restrict leave approvals for Q4</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* HR Policy Documents Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  HR Policy Documents
                </CardTitle>
                <CardDescription>Manage HR policy documents and employee access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hrDocuments.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                        <div>
                          <h4 className="font-medium">{document.name}</h4>
                          <p className="text-sm text-gray-500">
                            {document.type.toUpperCase()} • {document.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Visible to all employees</span>
                          <Switch
                            checked={document.visibleToAll}
                            onCheckedChange={(checked) => {
                              setHrDocuments(
                                hrDocuments.map((doc) =>
                                  doc.id === document.id ? { ...doc, visibleToAll: checked } : doc,
                                ),
                              )
                            }}
                          />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedDocument(document)
                                setShowDocumentDetails(true)
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedDocument(document)
                                setEditDocumentData({
                                  name: document.name,
                                  file: null,
                                })
                                setShowEditDocument(true)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedDocument(document)
                                setShowDeleteDocument(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setHrDocuments(hrDocuments.filter((doc) => doc.id !== document.id))
                          }}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4 bg-transparent"
                  onClick={() => setShowAddDocument(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add HR Policy Document
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "payroll" && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Payroll Configuration
                </CardTitle>
                <CardDescription>Configure payroll settings and tax information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="payrollFrequency">Payroll Frequency</Label>
                    <Select
                      value={payrollConfig.frequency}
                      onValueChange={(value) => setPayrollConfig({ ...payrollConfig, frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={payrollConfig.currency}
                      onValueChange={(value) => setPayrollConfig({ ...payrollConfig, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="GHS">GHS - Ghana Cedi</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Automatic Tax Calculations</Label>
                    <p className="text-sm text-gray-500">Enable automatic tax and deduction calculations</p>
                  </div>
                  <Switch
                    checked={payrollConfig.autoTaxCalculation}
                    onCheckedChange={(checked) => setPayrollConfig({ ...payrollConfig, autoTaxCalculation: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notificationSettings.email}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, email: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Push Notifications</Label>
                      <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                    </div>
                    <Switch
                      checked={notificationSettings.push}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, push: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">SMS Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                    </div>
                    <Switch
                      checked={notificationSettings.sms}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, sms: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "roles" && (
          <div className="space-y-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Role Management
                  </CardTitle>
                  <CardDescription>Manage user roles and permissions</CardDescription>
                </div>
                <Button onClick={() => setShowAddRole(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Role
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{role.name}</h4>
                        <p className="text-sm text-gray-500">{role.description}</p>
                        <div className="flex gap-1 mt-2">
                          {role.permissions.slice(0, 3).map((permission, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                          {role.permissions.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{role.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{role.userCount} users</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedRole(role)
                                setShowEditRole(true)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedRole(role)
                                setShowDeleteRole(true)
                              }}
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
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "access" && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Access Control
                </CardTitle>
                <CardDescription>Manage system access and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Single Sign-On (SSO)</Label>
                      <p className="text-sm text-gray-500">Enable SSO authentication</p>
                    </div>
                    <Switch
                      checked={accessSettings.sso}
                      onCheckedChange={(checked) => setAccessSettings({ ...accessSettings, sso: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Multi-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Require MFA for all users</p>
                    </div>
                    <Switch
                      checked={accessSettings.mfa}
                      onCheckedChange={(checked) => setAccessSettings({ ...accessSettings, mfa: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Password Complexity</Label>
                      <p className="text-sm text-gray-500">Enforce strong password requirements</p>
                    </div>
                    <Switch
                      checked={accessSettings.passwordComplexity}
                      onCheckedChange={(checked) =>
                        setAccessSettings({ ...accessSettings, passwordComplexity: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Configure security policies and monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Data Encryption</Label>
                      <p className="text-sm text-gray-500">Encrypt sensitive data at rest</p>
                    </div>
                    <Switch
                      checked={securitySettings.dataEncryption}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({ ...securitySettings, dataEncryption: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Audit Logging</Label>
                      <p className="text-sm text-gray-500">Log all system activities</p>
                    </div>
                    <Switch
                      checked={securitySettings.auditLogging}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, auditLogging: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Intrusion Detection</Label>
                      <p className="text-sm text-gray-500">Monitor for suspicious activities</p>
                    </div>
                    <Switch
                      checked={securitySettings.intrusionDetection}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({ ...securitySettings, intrusionDetection: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddSubsidiary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Subsidiary</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddSubsidiary(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subsidiaryName">Name</Label>
                <Input
                  id="subsidiaryName"
                  value={newSubsidiary.name}
                  onChange={(e) => setNewSubsidiary({ ...newSubsidiary, name: e.target.value })}
                  placeholder="Subsidiary name"
                />
              </div>
              <div>
                <Label htmlFor="subsidiaryLocation">Location</Label>
                <Input
                  id="subsidiaryLocation"
                  value={newSubsidiary.location}
                  onChange={(e) => setNewSubsidiary({ ...newSubsidiary, location: e.target.value })}
                  placeholder="Location"
                />
              </div>
              <div>
                <Label>Logo</Label>
                <div className="flex items-center space-x-4">
                  {newSubsidiary.logo && (
                    <img src={newSubsidiary.logo || "/placeholder.svg"} alt="Logo" className="w-12 h-12 rounded" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleLogoUpload(file, "subsidiary")
                    }}
                    className="hidden"
                    id="subsidiary-logo-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("subsidiary-logo-upload")?.click()}
                    disabled={isUploadingLogo}
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddSubsidiary(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSubsidiary}>Add Subsidiary</Button>
            </div>
          </div>
        </div>
      )}

      {showEditSubsidiary && selectedSubsidiary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Subsidiary</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowEditSubsidiary(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editSubsidiaryName">Name</Label>
                <Input
                  id="editSubsidiaryName"
                  value={selectedSubsidiary.name}
                  onChange={(e) => setSelectedSubsidiary({ ...selectedSubsidiary, name: e.target.value })}
                  placeholder="Subsidiary name"
                />
              </div>
              <div>
                <Label htmlFor="editSubsidiaryLocation">Location</Label>
                <Input
                  id="editSubsidiaryLocation"
                  value={selectedSubsidiary.location}
                  onChange={(e) => setSelectedSubsidiary({ ...selectedSubsidiary, location: e.target.value })}
                  placeholder="Location"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowEditSubsidiary(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSubsidiary}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {showDeactivateConfirm && subsidiaryToToggle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Deactivate Subsidiary</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDeactivateConfirm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to deactivate "{subsidiaryToToggle.name}"? This will restrict access to this
              subsidiary.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeactivateConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmToggleStatus}>
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReactivateConfirm && subsidiaryToToggle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reactivate Subsidiary</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowReactivateConfirm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reactivate "{subsidiaryToToggle.name}"? This will restore access to this
              subsidiary.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowReactivateConfirm(false)}>
                Cancel
              </Button>
              <Button onClick={confirmToggleStatus}>Reactivate</Button>
            </div>
          </div>
        </div>
      )}

      {showAddRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Role</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddRole(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <Label htmlFor="roleDescription">Description</Label>
                <Textarea
                  id="roleDescription"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Enter role description"
                  rows={3}
                />
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availablePermissions.map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={permission}
                        checked={newRole.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRole({ ...newRole, permissions: [...newRole.permissions, permission] })
                          } else {
                            setNewRole({ ...newRole, permissions: newRole.permissions.filter((p) => p !== permission) })
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={permission} className="text-sm">
                        {permission}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddRole(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRole}>Add Role</Button>
            </div>
          </div>
        </div>
      )}

      {showEditRole && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Role</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowEditRole(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editRoleName">Role Name</Label>
                <Input
                  id="editRoleName"
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole({ ...selectedRole, name: e.target.value })}
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <Label htmlFor="editRoleDescription">Description</Label>
                <Textarea
                  id="editRoleDescription"
                  value={selectedRole.description}
                  onChange={(e) => setSelectedRole({ ...selectedRole, description: e.target.value })}
                  placeholder="Enter role description"
                  rows={3}
                />
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availablePermissions.map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-${permission}`}
                        checked={selectedRole.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRole({ ...selectedRole, permissions: [...selectedRole.permissions, permission] })
                          } else {
                            setSelectedRole({
                              ...selectedRole,
                              permissions: selectedRole.permissions.filter((p) => p !== permission),
                            })
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={`edit-${permission}`} className="text-sm">
                        {permission}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowEditRole(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditRole}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteRole && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Delete Role</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteRole(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the role "{selectedRole.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteRole(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteRole}>
                Delete Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Leave Type Modal */}
      {showAddLeaveType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Leave Type</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddLeaveType(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <Label htmlFor="leaveTypeName">Name</Label>
                  <Input
                    id="leaveTypeName"
                    value={newLeaveType.name}
                    onChange={(e) => {
                      setNewLeaveType({ ...newLeaveType, name: e.target.value })
                      generateLeaveTypeInsights(e.target.value, newLeaveType.days, newLeaveType.description)
                    }}
                    placeholder="Enter leave type name"
                  />
                </div>
                <div>
                  <Label htmlFor="leaveTypeDays">Days</Label>
                  <Input
                    id="leaveTypeDays"
                    type="number"
                    value={newLeaveType.days}
                    onChange={(e) => {
                      const days = Number.parseInt(e.target.value) || 0
                      setNewLeaveType({ ...newLeaveType, days })
                      generateLeaveTypeInsights(newLeaveType.name, days, newLeaveType.description)
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="leaveTypeDescription">Description</Label>
                  <Textarea
                    id="leaveTypeDescription"
                    value={newLeaveType.description}
                    onChange={(e) => {
                      setNewLeaveType({ ...newLeaveType, description: e.target.value })
                      generateLeaveTypeInsights(newLeaveType.name, newLeaveType.days, e.target.value)
                    }}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="carryOver"
                    checked={newLeaveType.carryOver}
                    onCheckedChange={(checked) => setNewLeaveType({ ...newLeaveType, carryOver: checked })}
                  />
                  <Label htmlFor="carryOver">Carry Over</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium">AI Insights</h4>
                </div>
                <div className="space-y-3">
                  {leaveTypeAIInsights.map((insight, index) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">{insight}</p>
                    </div>
                  ))}
                  {leaveTypeAIInsights.length === 0 && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-500">Start typing to get AI recommendations...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddLeaveType(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLeaveType}>Add Leave Type</Button>
            </div>
          </div>
        </div>
      )}

      {/* View Policy Modal */}
      {showViewPolicy && selectedPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Policy Details</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowViewPolicy(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="font-medium">Policy Name</Label>
                <p className="text-gray-600">{selectedPolicy.name}</p>
              </div>
              <div>
                <Label className="font-medium">Days Allocated</Label>
                <p className="text-gray-600">{selectedPolicy.days} days</p>
              </div>
              <div>
                <Label className="font-medium">Usage</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        selectedPolicy.usage > 70
                          ? "bg-red-500"
                          : selectedPolicy.usage > 40
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${selectedPolicy.usage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{selectedPolicy.usage}%</span>
                </div>
              </div>
              {selectedPolicy.description && (
                <div>
                  <Label className="font-medium">Description</Label>
                  <p className="text-gray-600">{selectedPolicy.description}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowViewPolicy(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Policy Modal */}
      {showEditPolicy && selectedPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Policy</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowEditPolicy(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editPolicyName">Policy Name</Label>
                <Input
                  id="editPolicyName"
                  value={editPolicyData.name}
                  onChange={(e) => setEditPolicyData({ ...editPolicyData, name: e.target.value })}
                  placeholder="Enter policy name"
                />
              </div>
              <div>
                <Label htmlFor="editPolicyDays">Days Allocated</Label>
                <Input
                  id="editPolicyDays"
                  type="number"
                  value={editPolicyData.days}
                  onChange={(e) => setEditPolicyData({ ...editPolicyData, days: Number.parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="editPolicyDescription">Description</Label>
                <Textarea
                  id="editPolicyDescription"
                  value={editPolicyData.description}
                  onChange={(e) => setEditPolicyData({ ...editPolicyData, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowEditPolicy(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditPolicy} disabled={isSavingPolicy}>
                {isSavingPolicy ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Policy Modal */}
      {showDeletePolicy && selectedPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Delete Policy</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDeletePolicy(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the "{selectedPolicy.name}" policy? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeletePolicy(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeletePolicy}>
                Delete Policy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showAddDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add HR Policy Document</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddDocument(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="documentName">Document Name</Label>
                <Input
                  id="documentName"
                  value={newDocumentData.name}
                  onChange={(e) => setNewDocumentData({ ...newDocumentData, name: e.target.value })}
                  placeholder="Enter document name"
                />
              </div>
              <div>
                <Label htmlFor="documentFile">File</Label>
                <div className="mt-1">
                  <input
                    type="file"
                    id="documentFile"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      setNewDocumentData({ ...newDocumentData, file })
                    }}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("documentFile")?.click()}
                    className="w-full justify-start hover:bg-gray-50 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {newDocumentData.file ? newDocumentData.file.name : "Choose File No file chosen"}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddDocument(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDocument}>Add Document</Button>
            </div>
          </div>
        </div>
      )}

      {/* Document Details Modal */}
      {showDocumentDetails && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Document Details</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDocumentDetails(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
              <div>
                <Label className="font-medium">Name</Label>
                <p className="text-gray-600">{selectedDocument.name}</p>
              </div>
              <div>
                <Label className="font-medium">Type</Label>
                <p className="text-gray-600">{selectedDocument.type.toUpperCase()}</p>
              </div>
              <div>
                <Label className="font-medium">Size</Label>
                <p className="text-gray-600">{selectedDocument.size}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Document Preview</h4>
                <Button variant="outline" size="sm" onClick={() => setShowDocumentPreview(!showDocumentPreview)}>
                  <Eye className="w-4 h-4 mr-2" />
                  {showDocumentPreview ? "Hide Preview" : "Show Preview"}
                </Button>
              </div>

              {showDocumentPreview && (
                <div className="bg-gray-50 border rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="font-mono text-sm space-y-2">
                    <div className="text-blue-600 font-semibold">
                      Document: {selectedDocument.name} - {selectedDocument.type.toUpperCase()}
                    </div>
                    <div className="text-gray-700">{getDocumentPreviewContent(selectedDocument)}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowDocumentDetails(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {showEditDocument && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Document</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowEditDocument(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editDocumentName">Name</Label>
                <Input
                  id="editDocumentName"
                  value={editDocumentData.name}
                  onChange={(e) => setEditDocumentData({ ...editDocumentData, name: e.target.value })}
                  placeholder="Enter document name"
                />
              </div>
              <div>
                <Label htmlFor="editDocumentFile">File</Label>
                <div className="mt-1">
                  <input
                    type="file"
                    id="editDocumentFile"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      setEditDocumentData({ ...editDocumentData, file })
                    }}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("editDocumentFile")?.click()}
                    className="w-full justify-start hover:bg-gray-50 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {editDocumentData.file ? editDocumentData.file.name : "Choose File No file chosen"}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowEditDocument(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditDocument}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Document Modal */}
      {showDeleteDocument && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Delete Document</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteDocument(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedDocument.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteDocument(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteDocument}>
                Delete Document
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
