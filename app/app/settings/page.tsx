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
      }

      toast({
        title: "Logo uploaded successfully",
        description: "Your logo has been uploaded and is ready to use.",
      })
    } catch (error) {
      console.error("Logo upload error:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your logo. Please try again.",
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
      toast({
        title: "Employee View",
        description: "Opening employee management for subsidiary (Demo Mode)",
      })
      // In a real app, this would navigate to the employees page with subsidiary filter
      return
    }

    try {
      // In a real implementation, this would navigate to employees page with filter
      toast({
        title: "Employee View",
        description: "Opening employee management for subsidiary",
      })
      // window.location.href = `/app/employees?subsidiary=${subsidiaryId}`
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
      }
      setSubsidiaries((prev) => [newSubsidiary, ...prev])
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
            logo_url: subsidiaryData.logo_url,
          },
        ])
        .select()

      if (error) throw error

      await loadSubsidiaries() // Reload the list
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
      setSubsidiaries((prev) =>
        prev.map((sub) =>
          sub.id === subsidiaryId ? { ...sub, ...updates, updated_at: new Date().toISOString() } : sub,
        ),
      )
      toast({
        title: "Subsidiary Updated",
        description: "Subsidiary information updated successfully (Demo Mode)",
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

      await loadSubsidiaries() // Reload the list
      toast({
        title: "Subsidiary Updated",
        description: "Subsidiary information updated successfully",
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

  const handleManageLeaveTypes = () => {
    toast({
      title: "Leave Types Management",
      description: "Opening leave types configuration...",
    })
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

  const handleSyncAllSettings = () => {
    toast({
      title: "Syncing Settings",
      description: "Synchronizing settings across all subsidiaries...",
    })
  }

  const handleExportSettingsTemplate = () => {
    toast({
      title: "Exporting Template",
      description: "Downloading settings template...",
    })
  }

  const handleImportSettings = () => {
    toast({
      title: "Import Settings",
      description: "Opening settings import dialog...",
    })
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
                <Button className="bg-emerald-600 hover:bg-emerald-700">Save Company Settings</Button>
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
                  <Button variant="outline" onClick={loadSubsidiaries}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
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
                    <Card key={subsidiary.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                {subsidiary.name.charAt(0)}
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
                                  <span>{subsidiary.divisions?.length || 0} Divisions</span>
                                  <span>{subsidiary.departments?.length || 0} Departments</span>
                                  <span>{subsidiary.locations?.length || 0} Locations</span>
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
                                View Employees
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
                              <DropdownMenuItem
                                onClick={() => handleToggleSubsidiaryStatus(subsidiary)}
                                className={subsidiary.status === "active" ? "text-orange-600" : "text-green-600"}
                              >
                                {subsidiary.status === "active" ? (
                                  <>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Reactivate
                                  </>
                                )}
                              </DropdownMenuItem>
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
                            onClick={handleSyncAllSettings}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Sync All Settings
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
                            onClick={handleImportSettings}
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

        {/* HR Settings */}
        <TabsContent value="hr">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>HR Settings</span>
              </CardTitle>
              <CardDescription>Configure human resources policies and employee management settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Leave Policies</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Annual Leave</span>
                      <span className="text-sm text-gray-600">21 days</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Sick Leave</span>
                      <span className="text-sm text-gray-600">10 days</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Maternity Leave</span>
                      <span className="text-sm text-gray-600">84 days</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleManageLeaveTypes}>
                    Manage Leave Types
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Employee Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>Total Employees</span>
                      <span className="font-semibold">{employees.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>Active Employees</span>
                      <span className="font-semibold">{employees.filter((emp) => emp.status === "active").length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span>Departments</span>
                      <span className="font-semibold">{departments.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Settings */}
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

        {/* Notifications */}
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

        {/* Roles */}
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

        {/* Access Control */}
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

        {/* Security */}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Subsidiary Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSubsidiaryDetails(false)
                  setSelectedSubsidiary(null)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Company Name</label>
                    <p className="text-sm">{selectedSubsidiary.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Legal Name</label>
                    <p className="text-sm">{selectedSubsidiary.legal_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tax ID</label>
                    <p className="text-sm">{selectedSubsidiary.tax_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">SSNIT Number</label>
                    <p className="text-sm">{selectedSubsidiary.ssnit_number || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Industry</label>
                    <p className="text-sm">{selectedSubsidiary.industry || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        selectedSubsidiary.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedSubsidiary.status}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <p className="text-sm">{selectedSubsidiary.address || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">City</label>
                    <p className="text-sm">{selectedSubsidiary.city || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Region</label>
                    <p className="text-sm">{selectedSubsidiary.region || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Country</label>
                    <p className="text-sm">{selectedSubsidiary.country || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-sm">{selectedSubsidiary.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-sm">{selectedSubsidiary.email || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Website</label>
                    <p className="text-sm">
                      {selectedSubsidiary.website ? (
                        <a
                          href={selectedSubsidiary.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {selectedSubsidiary.website}
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
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
                      <div className="text-2xl font-bold text-green-600">{selectedSubsidiary.divisions_count || 0}</div>
                      <div className="text-sm text-gray-600">Divisions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedSubsidiary.departments_count || 0}
                      </div>
                      <div className="text-sm text-gray-600">Departments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedSubsidiary.locations_count || 0}
                      </div>
                      <div className="text-sm text-gray-600">Locations</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSubsidiaryDetails(false)
                  setSelectedSubsidiary(null)
                  setShowEditSubsidiary(true)
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
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
        </div>
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
              <Button variant="destructive" onClick={confirmToggleStatus}>
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
              <Button variant="default" onClick={confirmToggleStatus} className="bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                Reactivate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
