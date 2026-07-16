// @ts-nocheck
"use client"

import { DialogDescription } from "@/components/ui/dialog"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useCurrency } from "@/lib/currency-context"
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Mail,
  X,
  CheckCircle,
  FileText,
} from "lucide-react"

import { CentralDocumentService } from "@/lib/storage/centralDocumentService"
import { useToast } from "@/hooks/use-toast"
import {
  employeeToFormData,
  extractOrgOptions,
  formToApiPayload,
  listDisplayName,
  listEmployeeCode,
  listMonthlySalary,
  toSelectedFinancialRows,
  toUploadedDocumentsState,
} from "@/lib/employees/form-mapper"
// import { EmployeeProfile } from "@/components/employee-profile"

const isDemoMode = () => {
  if (typeof window !== "undefined") {
    // Check localStorage first
    if (localStorage.getItem("demo_mode") === "true") {
      return true
    }
    // Also check for demo-session cookie
    const cookies = document.cookie.split(";")
    const demoSessionCookie = cookies.find((cookie) => cookie.trim().startsWith("demo-session="))
    if (demoSessionCookie && demoSessionCookie.includes("active")) {
      return true
    }
  }
  return false
}

const mockEmployees = [
  {
    id: "1",
    employee_id: "AKHR0001",
    first_name: "John",
    last_name: "Doe",
    full_name: "John Doe",
    display_name: "John Doe",
    personal_email: "john.doe@email.com",
    corporate_email: "john.doe@akwaabahrpay.com",
    phone: "+233 24 123 4567",
    position: "HR Manager",
    department: "Human Resources",
    location: "Accra",
    status: "Active",
    date_of_joining: "2023-01-15",
    contract_type: "Permanent",
    subsidiaries: { name: "Main Office", id: "1" },
    created_at: "2023-01-15T00:00:00Z",
  },
  {
    id: "2",
    employee_id: "AKHR0002",
    first_name: "Jane",
    last_name: "Smith",
    full_name: "Jane Smith",
    display_name: "Jane Smith",
    personal_email: "jane.smith@email.com",
    corporate_email: "jane.smith@akwaabahrpay.com",
    phone: "+233 24 987 6543",
    position: "Software Developer",
    department: "Technology",
    location: "Kumasi",
    status: "Active",
    date_of_joining: "2023-03-01",
    contract_type: "Permanent",
    subsidiaries: { name: "Tech Hub", id: "2" },
    created_at: "2023-03-01T00:00:00Z",
  },
]

const mockSubsidiaries = [
  { id: "1", name: "Main Office", status: "active" },
  { id: "2", name: "Tech Hub", status: "active" },
]

const initialEmployees = [
  {
    id: 1,
    name: "Kwame Asante",
    email: "kwame.asante@company.com",
    phone: "+233 24 123 4567",
    position: "Senior Software Engineer",
    department: "Technology",
    location: "Accra",
    salary: 8500,
    startDate: "2022-03-15",
    status: "Active",
    avatar: "/placeholder.svg?height=40&width=40",
    employeeId: "EMP001",
    dateOfBirth: "1990-05-15",
    address: "East Legon, Accra",
    emergencyContact: "Akosua Asante - +233 20 111 2222",
    bankName: "GT Bank",
    bankAccount: "20610953414",
    ssnit: "GHA-001689781-4",
    ghanaCard: "GHA-123456789-0",
    leaveBalance: { annual: 15, sick: 10, casual: 5 },
    documents: ["Contract", "ID Copy", "CV"],
  },
  {
    id: 2,
    name: "Ama Osei",
    email: "ama.osei@company.com",
    phone: "+233 20 987 6543",
    position: "HR Manager",
    department: "Human Resources",
    location: "Kumasi",
    salary: 7200,
    startDate: "2021-08-20",
    status: "Active",
    avatar: "/placeholder.svg?height=40&width=40",
    employeeId: "EMP002",
    dateOfBirth: "1985-07-22",
    address: "Kumasi Central",
    emergencyContact: "Kofi Osei - +233 20 222 3333",
    bankName: "Ecobank",
    bankAccount: "0987654321",
    ssnit: "GHA-002345678-9",
    ghanaCard: "GHA-234567890-1",
    leaveBalance: { annual: 21, sick: 10, casual: 5 },
    documents: ["Contract", "ID Copy"],
  },
  {
    id: 3,
    name: "Kofi Mensah",
    email: "kofi.mensah@company.com",
    phone: "+233 26 555 7890",
    position: "Marketing Specialist",
    department: "Marketing",
    location: "Takoradi",
    salary: 5800,
    startDate: "2023-01-10",
    status: "Active",
    avatar: "/placeholder.svg?height=40&width=40",
    employeeId: "EMP003",
    dateOfBirth: "1992-03-12",
    address: "Takoradi Beach",
    emergencyContact: "Ama Mensah - +233 20 333 4444",
    bankName: "Standard Chartered",
    bankAccount: "1122334455",
    ssnit: "GHA-003456789-0",
    ghanaCard: "GHA-345678901-2",
    leaveBalance: { annual: 21, sick: 10, casual: 5 },
    documents: ["CV"],
  },
  {
    id: 4,
    name: "Akosua Boateng",
    email: "akosua.boateng@company.com",
    phone: "+233 24 444 3333",
    position: "Finance Officer",
    department: "Finance",
    location: "Accra",
    salary: 6500,
    startDate: "2022-11-05",
    status: "On Leave",
    avatar: "/placeholder.svg?height=40&width=40",
    employeeId: "EMP004",
    dateOfBirth: "1988-11-11",
    address: "Accra Mall",
    emergencyContact: "Yaw Boateng - +233 20 444 5555",
    bankName: "Fidelity Bank",
    bankAccount: "5566778899",
    ssnit: "GHA-004567890-1",
    ghanaCard: "GHA-456789012-3",
    leaveBalance: { annual: 21, sick: 10, casual: 5 },
    documents: [],
  },
  {
    id: 5,
    name: "Yaw Adjei",
    email: "yaw.adjei@company.com",
    phone: "+233 27 222 1111",
    position: "Sales Representative",
    department: "Sales",
    location: "Tamale",
    salary: 4200,
    startDate: "2023-06-12",
    status: "Active",
    avatar: "/placeholder.svg?height=40&width=40",
    employeeId: "EMP005",
    dateOfBirth: "1995-06-06",
    address: "Tamale Town",
    emergencyContact: "Ama Adjei - +233 20 555 6666",
    bankName: "Access Bank",
    bankAccount: "6677889900",
    ssnit: "GHA-005678901-2",
    ghanaCard: "GHA-567890123-4",
    leaveBalance: { annual: 21, sick: 10, casual: 5 },
    documents: [],
  },
]

const departments = ["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"]

export default function EmployeesPage() {
  const { currencySymbol, formatAmount } = useCurrency()

  const [employees, setEmployees] = useState<any[]>([])
  const [companyId, setCompanyId] = useState<string>("")
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const [companySettings, setCompanySettings] = useState<any>(null)
  const [subsidiaries, setSubsidiaries] = useState<any[]>([])
  const [divisions, setDivisions] = useState<string[]>([])
  const [departmentsList, setDepartments] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [supervisors, setSupervisors] = useState<any[]>([])
  const [headsOfDepartment, setHeadsOfDepartment] = useState<any[]>([])
  const [currentTab, setCurrentTab] = useState("personal")
  const [formData, setFormData] = useState<any>({
    employeeId: "",
    prefix: "",
    firstName: "",
    otherNames: "",
    lastName: "",
    maritalStatus: "",
    corporateEmail: "",
    personalEmail: "",
    phone: "",
    position: "",
    specialRole: "No Role",
    hasSubsidiary: "No",
    // </CHANGE>
    subsidiary: "",
    division: "",
    department: "",
    location: "",
    contractType: "Permanent",
    dateOfJoining: "",
    dateOfExit: "",
    status: "Active",
    inactiveReason: "",
    // </CHANGE>
    probationPeriod: "6",
    confirmationDate: "",
    noticePeriod: "",
    directSupervisor: "",
    headOfDepartment: "",
    annualSalary: "",
    salary: "",
    transportAllowance: "",
    housingAllowance: "",
    medicalAllowance: "",
    mealAllowance: "",
    uniformAllowance: "",
    communicationAllowance: "",
    otherAllowances: "",
    taxDeduction: "",
    ssnit: "",
    tier3: "",
    loanDeduction: "",
    advanceDeduction: "",
    otherDeductions: "",
    loanAmount: "",
    loanBalance: "",
    loanInstallment: "",
    loanStartDate: "",
    loanEndDate: "",
    startDate: "",
    dateOfBirth: "",
    address: "",
    emergencyContactName: "",
    emergencyContactTel: "",
    educationalLevel: "",
    gender: "",
    bankName: "",
    bankBranch: "",
    bankAccount: "",
    ghanaCard: "",
    providentFundEnrolled: "No",
    providentFundRate: "",
    documents: [],
    profilePicture: "",
    profilePictureFile: null,
  })

  const [companyAllowances, setCompanyAllowances] = useState([
    { code: "TRANS", description: "Transport Allowance", taxable: true, recurring: true },
    { code: "HOUSE", description: "Housing Allowance", taxable: true, recurring: true },
    { code: "MED", description: "Medical Allowance", taxable: false, recurring: true },
    { code: "MEAL", description: "Meal Allowance", taxable: false, recurring: true },
    { code: "UNIFORM", description: "Uniform Allowance", taxable: false, recurring: true },
    { code: "COMM", description: "Communication Allowance", taxable: false, recurring: true },
  ])

  const [companyDeductions, setCompanyDeductions] = useState([
    { code: "TAX", description: "Tax Deduction", recurring: true },
    { code: "SSNIT", description: "SSNIT Deduction", recurring: true },
    { code: "TIER3", description: "Tier 3 Contribution", recurring: true },
    { code: "LOAN", description: "Loan Deduction", recurring: true },
    { code: "ADVANCE", description: "Advance Deduction", recurring: true },
  ])

  const [selectedAllowances, setSelectedAllowances] = useState<
    Array<{
      id: string
      code: string
      description: string
      taxable: boolean
      recurring: boolean
      amount: string
      percentage: string
      calculationType: "AMOUNT" | "PERCENTAGE"
      effectiveDate: string
      endDate?: string
    }>
  >([])
  const [selectedDeductions, setSelectedDeductions] = useState<
    Array<{
      id: string
      code: string
      description: string
      taxable: boolean
      recurring: boolean
      amount: string
      percentage: string
      calculationType: "AMOUNT" | "PERCENTAGE"
      effectiveDate: string
      endDate?: string
    }>
  >([])
  const [showAllowanceSelector, setShowAllowanceSelector] = useState(false)
  const [showDeductionSelector, setShowDeductionSelector] = useState(false)

  // Document upload states
  const [uploadedDocuments, setUploadedDocuments] = useState([])
  const [uploadingDocuments, setUploadingDocuments] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewDocument, setPreviewDocument] = useState(null)
  const fileInputRefs = useRef({})

  // Required documents configuration
  const requiredDocuments = [
    {
      id: "academic",
      title: "1. Academic Certificate(s)",
      description: "Educational certificates and transcripts",
      acceptTypes: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
    },
    {
      id: "passport-picture",
      title: "2. Passport Picture",
      description: "Professional passport-sized photograph",
      acceptTypes: ".jpg,.jpeg,.png",
    },
    {
      id: "resume",
      title: "3. Resume & Application Letter",
      description: "Current CV and cover letter",
      acceptTypes: ".pdf,.doc,.docx",
    },
    {
      id: "passport",
      title: "4. Passport",
      description: "Valid passport copy",
      acceptTypes: ".pdf,.jpg,.jpeg,.png",
    },
    {
      id: "national-id",
      title: "5. National ID",
      description: "Ghana Card or Voter ID",
      acceptTypes: ".pdf,.jpg,.jpeg,.png",
    },
    {
      id: "medical",
      title: "6. Medical Report",
      description: "Health clearance certificate",
      acceptTypes: ".pdf,.jpg,.jpeg,.png",
    },
    {
      id: "police",
      title: "7. Police Report",
      description: "Criminal background check",
      acceptTypes: ".pdf,.jpg,.jpeg,.png",
    },
    {
      id: "other",
      title: "8. Other Uploads",
      description: "Additional supporting documents",
      acceptTypes: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
    },
  ]

  const handleAddAllowance = (allowanceCode: string) => {
    const allowance = companyAllowances.find((a) => a.code === allowanceCode)
    if (allowance && !selectedAllowances.find((a) => a.code === allowanceCode)) {
      const newAllowance = {
        id: allowance.id,
        code: allowance.code,
        description: allowance.description,
        taxable: allowance.taxable,
        recurring: allowance.recurring,
        amount: "0",
        percentage: "0",
        calculationType: "AMOUNT" as "AMOUNT" | "PERCENTAGE",
        effectiveDate: new Date().toISOString().split("T")[0],
        endDate: undefined,
      }
      setSelectedAllowances([...selectedAllowances, newAllowance])
      setShowAllowanceSelector(false)
    }
  }

  const handleRemoveAllowance = (allowanceCode: string) => {
    setSelectedAllowances(selectedAllowances.filter((a) => a.code !== allowanceCode))
  }

  const handleAllowanceChange = (allowanceCode: string, field: string, value: any) => {
    setSelectedAllowances(selectedAllowances.map((a) => (a.code === allowanceCode ? { ...a, [field]: value } : a)))
  }

  const handleAddDeduction = (deductionCode: string) => {
    const deduction = companyDeductions.find((d) => d.code === deductionCode)
    if (deduction && !selectedDeductions.find((d) => d.code === deductionCode)) {
      const newDeduction = {
        id: deduction.id,
        code: deduction.code,
        description: deduction.description,
        taxable: deduction.taxable,
        recurring: deduction.recurring,
        amount: "0",
        percentage: "0",
        calculationType: "AMOUNT" as "AMOUNT" | "PERCENTAGE",
        effectiveDate: new Date().toISOString().split("T")[0],
        endDate: undefined,
      }
      setSelectedDeductions([...selectedDeductions, newDeduction])
      setShowDeductionSelector(false)
    }
  }

  const handleRemoveDeduction = (deductionCode: string) => {
    setSelectedDeductions(selectedDeductions.filter((d) => d.code !== deductionCode))
  }

  const handleDeductionChange = (deductionCode: string, field: string, value: any) => {
    setSelectedDeductions(selectedDeductions.map((d) => (d.code === deductionCode ? { ...d, [field]: value } : d)))
  }
  // </CHANGE>

  const loadParentCompanyData = useCallback(() => {
    console.log("[v0] Loading parent company data...")
    const org = extractOrgOptions(companySettings, companySettings?.settings_data)
    setDivisions(org.divisions)
    setDepartments(org.departments)
    setLocations(org.locations)
    console.log("[v0] Parent company data loaded:", org)
  }, [companySettings])

  const loadSubsidiaries = async (cid?: string) => {
    try {
      const supabase = createClient()
      let query = supabase.from("subsidiaries").select("*").eq("status", "active")
      if (cid) query = query.eq("company_id", cid)
      const { data, error } = await query

      if (error) {
        console.error("Error loading subsidiaries:", error)
        if (isDemoMode()) {
          setSubsidiaries(mockSubsidiaries)
          return
        }
        toast({
          title: "Error",
          description: "Failed to load subsidiaries from database.",
          variant: "destructive",
        })
        return
      }

      setSubsidiaries(data?.length ? data : isDemoMode() ? mockSubsidiaries : [])
    } catch (error) {
      console.error("Error loading subsidiaries:", error)
      if (isDemoMode()) setSubsidiaries(mockSubsidiaries)
      else {
        toast({
          title: "Error",
          description: "Failed to load subsidiaries. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  useEffect(() => {
    void (async () => {
      const cid = await loadCompanyData()
      await Promise.all([loadEmployees(cid), loadSubsidiaries(cid)])
    })()
  }, [])

  useEffect(() => {
    if (isDemoMode()) {
      console.log("[v0] Demo mode: Skipping Supabase subscription")
      return
    }

    const supabase = createClient()

    const subscription = supabase
      .channel("employees_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, (payload) => {
        console.log("[v0] Employee data changed:", payload)
        loadEmployees() // Reload employees when data changes
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const buildEmployeeIdPrefix = useCallback(() => {
    const companyName = companySettings?.name || "AKHR"
    if (formData.hasSubsidiary === "Yes" && formData.subsidiary) {
      const selectedSubsidiary = subsidiaries.find((s) => s.id === formData.subsidiary)
      if (selectedSubsidiary) {
        const companyInitials = companyName
          .split(" ")
          .map((word: string) => word[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
        const subsidiaryInitials = selectedSubsidiary.name
          .split(" ")
          .map((word: string) => word[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
        return (companyInitials + subsidiaryInitials).slice(0, 4).padEnd(4, "X")
      }
    }
    return companyName
      .split(" ")
      .map((word: string) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 4)
      .padEnd(4, "X")
  }, [companySettings, formData.hasSubsidiary, formData.subsidiary, subsidiaries])

  // Sequential employee ID from DB (max existing suffix + 1), not list length
  useEffect(() => {
    if (isEditDialogOpen && selectedEmployee?.employee_id) return
    if (!isAddDialogOpen) return
    if (!companyId) return

    let cancelled = false
    const prefix = buildEmployeeIdPrefix()
    ;(async () => {
      try {
        const res = await fetch(
          `/api/employees/next-id?company_id=${encodeURIComponent(companyId)}&prefix=${encodeURIComponent(prefix)}`,
          { cache: "no-store" },
        )
        const json = await res.json()
        if (cancelled) return
        if (res.ok && json.employee_id) {
          setFormData((prev: any) => ({ ...prev, employeeId: json.employee_id }))
          return
        }
      } catch {
        /* fall through */
      }
      if (cancelled) return
      // Local fallback: max numeric suffix for prefix among loaded employees
      let max = 0
      for (const emp of employees) {
        const code = String(emp.employee_id || "")
        if (!code.startsWith(prefix)) continue
        const num = Number(code.slice(prefix.length))
        if (Number.isFinite(num) && num > max) max = num
      }
      setFormData((prev: any) => ({
        ...prev,
        employeeId: `${prefix}${String(max + 1).padStart(4, "0")}`,
      }))
    })()

    return () => {
      cancelled = true
    }
  }, [
    companyId,
    buildEmployeeIdPrefix,
    isEditDialogOpen,
    isAddDialogOpen,
    selectedEmployee,
    formData.hasSubsidiary,
    formData.subsidiary,
    employees,
  ])
  // </CHANGE>

  const loadCompanyData = async () => {
    try {
      console.log("[v0] Loading company data...")
      const metaRes = await fetch("/api/employees/meta", { cache: "no-store" })
      const meta = await metaRes.json()
      if (metaRes.ok && meta.company_id) {
        setCompanyId(meta.company_id)
        setCompanySettings({
          ...(meta.company || {}),
          id: meta.company_id,
          name: meta.company?.name,
          divisions: meta.divisions,
          departments: meta.departments,
          locations: meta.locations,
        })
        setDivisions(meta.divisions || [])
        setDepartments(meta.departments || [])
        setLocations(meta.locations || [])
        if (Array.isArray(meta.allowances) && meta.allowances.length) {
          setCompanyAllowances(meta.allowances)
        }
        if (Array.isArray(meta.deductions) && meta.deductions.length) {
          setCompanyDeductions(meta.deductions)
        }
        if (Array.isArray(meta.subsidiaries)) {
          setSubsidiaries(meta.subsidiaries)
        }
        return meta.company_id as string
      }

      // Fallback: companies + company_settings
      const supabase = createClient()
      const { data, error } = await supabase.from("companies").select("*").limit(1).maybeSingle()
      if (error) console.error("[v0] Error loading company data:", error)
      if (data) {
        const { data: settings } = await supabase
          .from("company_settings")
          .select("settings_data")
          .eq("company_id", data.id)
          .maybeSingle()
        const org = extractOrgOptions(data, settings?.settings_data)
        setCompanySettings({ ...data, ...org })
        setCompanyId(data.id)
        setDivisions(org.divisions)
        setDepartments(org.departments)
        setLocations(org.locations)
        return data.id as string
      }

      setDivisions(["Head Office", "Regional Office"])
      setDepartments(["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"])
      setLocations(["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"])
    } catch (error) {
      console.error("[v0] Error in loadCompanyData:", error)
    }
    return ""
  }

  useEffect(() => {
    console.log("[v0] Subsidiary selection changed:", {
      hasSubsidiary: formData.hasSubsidiary,
      subsidiary: formData.subsidiary,
    })

    if (formData.hasSubsidiary === "Yes" && formData.subsidiary) {
      const selectedSubsidiary = subsidiaries.find((s) => s.id === formData.subsidiary)
      if (selectedSubsidiary) {
        const org = extractOrgOptions(selectedSubsidiary)
        setDivisions(org.divisions)
        setDepartments(org.departments)
        setLocations(org.locations)
      }
    } else {
      loadParentCompanyData()
    }
  }, [formData.hasSubsidiary, formData.subsidiary, subsidiaries, loadParentCompanyData])
  // </CHANGE>

  // Load supervisors and heads of department based on department selection
  useEffect(() => {
    const loadSupervisorsAndHeads = () => {
      const activeEmployees = employees.filter(
        (emp) => String(emp.status ?? "").toLowerCase() === "active",
      )
      const departmentEmployees = formData.department
        ? activeEmployees.filter((emp) => emp.department === formData.department)
        : activeEmployees

      const roleOf = (emp: any) => String(emp.special_role || emp.specialRole || "").toLowerCase()
      const supervisorsList = departmentEmployees.filter(
        (emp) => roleOf(emp).includes("supervisor") || roleOf(emp).includes("direct"),
      )
      const headsList = departmentEmployees.filter(
        (emp) => roleOf(emp).includes("head") || roleOf(emp).includes("hod"),
      )

      // Prefer role-matched; else all department (or all active) employees
      let finalSupervisors = supervisorsList.length > 0 ? supervisorsList : departmentEmployees
      let finalHeads = headsList.length > 0 ? headsList : departmentEmployees

      // Always include currently saved supervisor/HOD so edit form can show the value
      const ensureIncluded = (list: any[], id: string | undefined | null) => {
        if (!id) return list
        if (list.some((e) => e.id === id)) return list
        const found = employees.find((e) => e.id === id)
        return found ? [found, ...list] : list
      }
      finalSupervisors = ensureIncluded(
        finalSupervisors,
        formData.directSupervisor || selectedEmployee?.direct_supervisor,
      )
      finalHeads = ensureIncluded(
        finalHeads,
        formData.headOfDepartment || selectedEmployee?.head_of_department,
      )

      setSupervisors(finalSupervisors)
      setHeadsOfDepartment(finalHeads)
    }

    if (employees.length > 0) {
      loadSupervisorsAndHeads()
    }
  }, [
    formData.department,
    formData.directSupervisor,
    formData.headOfDepartment,
    employees,
    selectedEmployee,
  ])

  // Removed the duplicate loadParentCompanyData function. The useCallback version above is used.

  const loadEmployees = async (cid?: string) => {
    try {
      console.log("[v0] Loading employees from database...")
      setIsLoading(true)

      const params = new URLSearchParams()
      if (cid || companyId) params.set("company_id", cid || companyId)
      params.set("include_financial", "true")
      params.set("limit", "1000")

      const res = await fetch(`/api/employees?${params.toString()}`, { cache: "no-store" })
      const json = await res.json()

      if (!res.ok) {
        // Fallback: direct supabase query scoped by company when available
        const supabase = createClient()
        let query = supabase
          .from("employees")
          .select(`*, subsidiaries:subsidiary_id(name, id), financial:employee_financial(*)`)
          .order("created_at", { ascending: false })
        if (cid || companyId) query = query.eq("company_id", cid || companyId)
        const { data, error } = await query
        if (error) throw new Error(json.error || error.message)
        const rows = data || []
        if (!rows.length && isDemoMode()) {
          setEmployees(mockEmployees)
        } else {
          setEmployees(rows)
        }
        return
      }

      const rows = json.employees ?? json.data ?? []
      if (json.meta?.company_id && !companyId) setCompanyId(json.meta.company_id)
      if (!rows.length && isDemoMode()) {
        console.log("[v0] No DB employees yet — demo fallback list")
        setEmployees(mockEmployees)
      } else {
        console.log("[v0] Loaded employees:", rows.length)
        setEmployees(rows)
      }
    } catch (error) {
      console.error("Error loading employees:", error)
      if (isDemoMode()) {
        setEmployees(mockEmployees)
      } else {
        toast({
          title: "Error",
          description: "Failed to load employees from database.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }

  const handleAddEmployee = async (employeeData: any) => {
    try {
      console.log("[v0] Adding employee:", employeeData)
      const payload = formToApiPayload(employeeData, companyId || companySettings?.id)
      if (!payload.company_id && !companyId) {
        toast({
          title: "Company required",
          description: "No company found in the database. Create a company first.",
          variant: "destructive",
        })
        return
      }

      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to add employee")

      await loadEmployees(companyId || json.employee?.company_id || payload.company_id)
      setIsAddDialogOpen(false)
      toast({
        title: "Success",
        description: `Employee ${payload.display_name} has been added successfully!`,
      })
    } catch (error) {
      console.error("Error adding employee:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add employee. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditEmployee = async (employeeData: any) => {
    try {
      if (!selectedEmployee?.id) {
        toast({ title: "Error", description: "No employee selected.", variant: "destructive" })
        return
      }

      const payload = formToApiPayload(employeeData, companyId || companySettings?.id)
      const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update employee")

      await loadEmployees(companyId)
      setIsEditDialogOpen(false)
      setSelectedEmployee(null)
      toast({
        title: "Employee Updated Successfully",
        description: `${payload.display_name} has been successfully updated.`,
      })
    } catch (error) {
      console.error("Error updating employee:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update employee in database.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEmployee = async (employeeId: string | number) => {
    try {
      if (isDemoMode() && String(employeeId).length < 10) {
        setEmployees(employees.filter((emp) => emp.id !== employeeId))
        toast({
          title: "Employee Removed",
          description: "Employee removed (demo).",
          variant: "destructive",
        })
        return
      }

      const res = await fetch(`/api/employees/${employeeId}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to deactivate employee")

      await loadEmployees(companyId)
      toast({
        title: "Employee Deactivated",
        description: "Employee status set to Inactive in the database.",
        variant: "destructive",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not deactivate employee",
        variant: "destructive",
      })
    }
  }

  const handleImportEmployees = async (importedData: any[], filename?: string) => {
    try {
      const res = await fetch("/api/employees/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: importedData,
          filename: filename || "import.csv",
          company_id: companyId || companySettings?.id,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Import failed")

      setIsImportDialogOpen(false)
      await loadEmployees(companyId)
      toast({
        title: "Import Successful",
        description: `${json.success_rows} of ${json.total_rows} employees imported successfully.${json.error_rows > 0 ? ` ${json.error_rows} rows had errors.` : ""}`,
      })
      // Refresh employee list
      window.location.reload()
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" })
    }
  }

  const downloadTemplate = (templateType: string) => {
    let csvContent = ""
    let filename = ""

    switch (templateType) {
      case "employees":
        csvContent = generateEmployeeTemplate()
        filename = "Employee_Import_Template.csv"
        break
      case "payroll":
        csvContent = generatePayrollTemplate()
        filename = "Payroll_Import_Template.csv"
        break
      case "allowances":
        csvContent = generateAllowancesTemplate()
        filename = "Allowances_Import_Template.csv"
        break
      case "leave":
        csvContent = generateLeaveTemplate()
        filename = "Leave_Import_Template.csv"
        break
      default:
        return
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Template Downloaded",
      description: `${filename} has been downloaded successfully.`,
    })
  }

  const generateEmployeeTemplate = () => {
    const headers = [
      "name",
      "email",
      "phone",
      "position",
      "department",
      "location",
      "salary",
      "startDate",
      "dateOfBirth",
      "address",
      "emergencyContact",
      "bankName",
      "bankAccount",
      "ssnit",
      "ghanaCard",
      "status",
    ]

    const sampleData = [
      "John Doe",
      "john.doe@company.com",
      "+233 24 123 4567",
      "Software Engineer",
      "Technology",
      "Accra",
      "6500",
      "2024-01-15",
      "1990-05-15",
      "East Legon, Accra",
      "Jane Doe - +233 20 111 2222",
      "GT Bank",
      "1234567890",
      "GHA-123456789-0",
      "GHA-987654321-0",
      "Active",
    ]

    return `${headers.join(",")}\n${sampleData.join(",")}\n`
  }

  const generatePayrollTemplate = () => {
    const headers = [
      "employeeId",
      "employeeName",
      "basicSalary",
      "transportAllowance",
      "housingAllowance",
      "medicalAllowance",
      "otherAllowances",
      "overtimeHours",
      "overtimeRate",
      "loans",
      "advances",
      "otherDeductions",
      "payPeriod",
    ]

    const sampleData = [
      "EMP001",
      "John Doe",
      "6500",
      "500",
      "600",
      "100",
      "0",
      "10",
      "50",
      "200",
      "0",
      "0",
      "January 2025",
    ]

    return `${headers.join(",")}\n${sampleData.join(",")}\n`
  }

  const generateAllowancesTemplate = () => {
    const headers = [
      "employeeId",
      "employeeName",
      "transportAllowance",
      "housingAllowance",
      "medicalAllowance",
      "mealAllowance",
      "uniformAllowance",
      "trainingAllowance",
      "toolsAllowance",
      "communicationAllowance",
      "effectiveDate",
      "notes",
    ]

    const sampleData = [
      "EMP001",
      "John Doe",
      "500",
      "600",
      "100",
      "200",
      "50",
      "100",
      "75",
      "150",
      "2025-01-01",
      "Monthly allowances",
    ]

    return `${headers.join(",")}\n${sampleData.join(",")}\n`
  }

  const generateLeaveTemplate = () => {
    const headers = [
      "employeeId",
      "employeeName",
      "leaveType",
      "startDate",
      "endDate",
      "days",
      "reason",
      "status",
      "approvedBy",
      "appliedDate",
    ]

    const sampleData = [
      "EMP001",
      "John Doe",
      "Annual Leave",
      "2025-02-15",
      "2025-02-20",
      "5",
      "Family vacation",
      "Approved",
      "Jane Smith",
      "2025-01-15",
    ]

    return `${headers.join(",")}\n${sampleData.join(",")}\n`
  }

  const filteredEmployees = employees.filter((employee) => {
    if (!searchTerm && selectedDepartment === "all") return true

    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      listDisplayName(employee).toLowerCase().includes(searchLower) ||
      listEmployeeCode(employee).toLowerCase().includes(searchLower) ||
      employee.display_name?.toLowerCase().includes(searchLower) ||
      employee.full_name?.toLowerCase().includes(searchLower) ||
      employee.employee_id?.toLowerCase().includes(searchLower) ||
      employee.personal_email?.toLowerCase().includes(searchLower) ||
      employee.corporate_email?.toLowerCase().includes(searchLower) ||
      employee.department?.toLowerCase().includes(searchLower) ||
      employee.position?.toLowerCase().includes(searchLower) ||
      employee.location?.toLowerCase().includes(searchLower) ||
      employee.division?.toLowerCase().includes(searchLower) ||
      employee.status?.toLowerCase().includes(searchLower) ||
      employee.contract_type?.toLowerCase().includes(searchLower) ||
      employee.first_name?.toLowerCase().includes(searchLower) ||
      employee.last_name?.toLowerCase().includes(searchLower) ||
      employee.other_names?.toLowerCase().includes(searchLower) ||
      employee.phone?.toLowerCase().includes(searchLower) ||
      employee.phone_number?.toLowerCase().includes(searchLower) ||
      employee.ghana_card_number?.toLowerCase().includes(searchLower)

    const matchesDepartment = selectedDepartment === "all" || employee.department === selectedDepartment

    return matchesSearch && matchesDepartment
  })

  const handleNext = () => {
    if (currentTab === "personal") {
      setCurrentTab("employment")
    } else if (currentTab === "employment") {
      setCurrentTab("financial")
    } else if (currentTab === "financial") {
      setCurrentTab("documents")
    }
  }

  const handleTabChange = (value: string) => {
    setCurrentTab(value)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600 mt-1">Manage your workforce and employee information</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" className="bg-transparent">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>Enter the employee's information below.</DialogDescription>
              </DialogHeader>
              <AddEmployeeForm
                onSubmit={handleAddEmployee}
                onClose={() => setIsAddDialogOpen(false)}
                subsidiaries={subsidiaries}
                setFormData={setFormData}
                formData={formData}
                supervisors={supervisors}
                headsOfDepartment={headsOfDepartment}
                employees={employees}
                selectedEmployee={selectedEmployee}
                companySettings={companySettings}
                companyAllowancesCatalog={companyAllowances}
                companyDeductionsCatalog={companyDeductions}
                companyId={companyId}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by name, email, position, employee ID, phone, Ghana card, etc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departmentsList.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Search Options */}
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="text-muted-foreground">Quick searches:</span>
              <Button variant="outline" size="sm" onClick={() => setSearchTerm("active")} className="h-6 px-2 text-xs">
                Active
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("on leave")}
                className="h-6 px-2 text-xs"
              >
                On Leave
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("permanent")}
                className="h-6 px-2 text-xs"
              >
                Permanent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("contract")}
                className="h-6 px-2 text-xs"
              >
                Contract
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedDepartment("all")
                }}
                className="h-6 px-2 text-xs"
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
            <p className="text-sm text-gray-600">Total Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {employees.filter((emp) => emp.status === "Active").length}
            </div>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {employees.filter((emp) => emp.status === "On Leave").length}
            </div>
            <p className="text-sm text-gray-600">On Leave</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{departmentsList.length}</div>
            <p className="text-sm text-gray-600">Departments</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Employee Directory ({filteredEmployees.length} employees)</span>
            {searchTerm && <div className="text-sm text-muted-foreground">Showing results for "{searchTerm}"</div>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? `No employees match your search "${searchTerm}"` : "No employees available"}
                </p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedDepartment("all")
                    }}
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredEmployees.map((employee) => (
                  <Card key={employee.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage
                              src={
                                employee.profile_picture ||
                                employee.profilePicture ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${listDisplayName(employee)}`
                              }
                            />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700">
                              {listDisplayName(employee)
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{listDisplayName(employee)}</h3>
                            <p className="text-gray-600">{employee.position}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500">{employee.department}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">ID: {listEmployeeCode(employee)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Monthly Salary</p>
                            <p className="text-sm font-medium">{formatAmount(listMonthlySalary(employee))}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Status</p>
                            <Badge
                              variant={employee.status === "Active" ? "default" : "secondary"}
                              className={
                                employee.status === "Active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {employee.status}
                            </Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/employees/${employee.id}?include_financial=true`, {
                                      cache: "no-store",
                                    })
                                    const json = await res.json()
                                    setSelectedEmployee(json.employee || employee)
                                  } catch {
                                    setSelectedEmployee(employee)
                                  }
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/employees/${employee.id}?include_financial=true`, {
                                      cache: "no-store",
                                    })
                                    const json = await res.json()
                                    setSelectedEmployee(json.employee || employee)
                                  } catch {
                                    setSelectedEmployee(employee)
                                  }
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Employee
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Employee
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employee Profile Dialog - Currently disabled */}
      {/* <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Profile</DialogTitle>
          </DialogHeader>
          {selectedEmployee && <EmployeeProfile employee={selectedEmployee} />}
        </DialogContent>
      </Dialog> */}

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Edit Employee</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <AddEmployeeForm
              employee={selectedEmployee}
              onSubmit={handleEditEmployee}
              onClose={() => {
                setIsEditDialogOpen(false)
                setSelectedEmployee(null)
              }}
              subsidiaries={subsidiaries}
              setFormData={setFormData}
              formData={formData}
              supervisors={supervisors}
              headsOfDepartment={headsOfDepartment}
              employees={employees}
              selectedEmployee={selectedEmployee}
              companySettings={companySettings}
              companyAllowancesCatalog={companyAllowances}
              companyDeductionsCatalog={companyDeductions}
              companyId={companyId}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Import Data Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Employee Data</DialogTitle>
            <DialogDescription>Import employee data from a CSV file.</DialogDescription>
          </DialogHeader>
          <ImportDataDialog
            onImport={handleImportEmployees}
            onDownloadTemplate={downloadTemplate}
            onClose={() => setIsImportDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Action Bar */}
      <div className="flex justify-end space-x-2">
        <Button onClick={() => setIsImportDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Upload className="w-4 h-4 mr-2" />
          Import Data
        </Button>
      </div>
    </div>
  )
}

function ImportDataDialog({
  onImport,
  onDownloadTemplate,
  onClose,
}: {
  onImport: (data: any[]) => void
  onDownloadTemplate: (type: string) => void
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState("employees")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])

  const handleCSVFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const documentService = CentralDocumentService.getInstance()
      documentService.uploadDocument({
        file,
        documentType: "employee-csv",
        source: "employee-onboarding",
        uploadedBy: "HR Admin",
        notes: "Employee data import CSV file",
      })

      setSelectedFile(file)
      console.log("[v0] CSV file selected:", file.name)
    }
  }

  // Document upload handlers - now handleFileSelect is defined above
  const handleUploadClick = (documentType: string) => {
    // Create a new file input dynamically for better mobile compatibility
    const tempInput = document.createElement("input")
    tempInput.type = "file"
    tempInput.accept = requiredDocuments.find((doc) => doc.id === documentType)?.acceptTypes || "*/*"
    tempInput.style.position = "absolute"
    tempInput.style.left = "-9999px"
    tempInput.style.opacity = "0"

    // Add to DOM temporarily
    document.body.appendChild(tempInput)

    // Set up change handler
    tempInput.onchange = (e) => {
      console.log("[v0] handleUploadClick tempInput onchange triggered for:", documentType)
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        console.log("[v0] File selected via handleUploadClick:", file.name)
        // Create a synthetic event for handleFileSelect
        const syntheticEvent = {
          target: { files: [file] },
        } as React.ChangeEvent<HTMLInputElement>
        handleFileSelect(documentType, syntheticEvent)
      } else {
        console.log("[v0] No file selected via handleUploadClick")
      }
      // Clean up
      document.body.removeChild(tempInput)
    }

    // Trigger click with a small delay for mobile
    setTimeout(() => {
      tempInput.click()
    }, 10)
  }
  // </CHANGE>

  const handleFileSelect = async (documentType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[v0] handleFileSelect called for:", documentType, "Files:", event.target.files)
    const file = event.target.files?.[0]
    if (!file) {
      console.log("[v0] No file selected")
      return
    }

    console.log("[v0] File selected:", file.name, "Size:", file.size, "Type:", file.type)

    // Validate file type
    const doc = requiredDocuments.find((d) => d.id === documentType)
    if (!doc) {
      console.log("[v0] Document type not found:", documentType)
      return
    }

    const acceptedTypes = doc.acceptTypes.split(",").map((type) => type.trim())
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
    const mimeType = file.type

    const isValidType = acceptedTypes.some((type) =>
      type.startsWith(".") ? fileExtension === type : mimeType.includes(type.replace(".", "")),
    )

    if (!isValidType) {
      toast({
        title: "Invalid File Type",
        description: `Please select a file with one of these types: ${doc.acceptTypes}`,
        variant: "destructive",
      })
      return
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    // Start upload process
    setUploadingDocuments((prev) => [...prev, documentType])
    setUploadProgress((prev) => ({ ...prev, [documentType]: 0 }))

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadProgress((prev) => ({ ...prev, [documentType]: progress }))
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // Upload to document service
      const documentService = CentralDocumentService.getInstance()
      const documentId = await documentService.uploadDocument({
        file,
        employeeId: formData.employee_id || "temp-id",
        employeeName: `${formData.first_name} ${formData.last_name}`.trim() || "New Employee",
        documentType,
        source: "employee-onboarding",
        uploadedBy: "HR Admin",
        notes: `Uploaded during employee onboarding - ${doc.title}`,
      })

      // Add to uploaded documents
      const uploadedDoc = {
        id: documentId,
        documentType,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadDate: new Date(),
        uploadedBy: "HR Admin",
      }

      setUploadedDocuments((prev) => {
        const filtered = prev.filter((doc) => doc.documentType !== documentType)
        return [...filtered, uploadedDoc]
      })

      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded successfully`,
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingDocuments((prev) => prev.filter((doc) => doc !== documentType))
      setUploadProgress((prev) => ({ ...prev, [documentType]: 0 }))
    }
  }

  const handleRemoveDocument = (documentType: string) => {
    setUploadedDocuments((prev) => prev.filter((doc) => doc.documentType !== documentType))
    toast({
      title: "Document Removed",
      description: "Document has been removed successfully",
    })
  }

  const handleReplaceDocument = (documentType: string) => {
    const fileInput = fileInputRefs.current[documentType]
    if (fileInput) {
      fileInput.click()
    }
  }

  const handlePreviewDocument = (document: any) => {
    setPreviewDocument(document)
    setIsPreviewOpen(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const processFile = (file: File) => {
    setIsProcessing(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string
        const lines = csv.split("\n").filter((line) => line.trim())

        if (lines.length < 2) {
          throw new Error("CSV file must contain at least a header row and one data row")
        }

        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
        const data = lines.slice(1).map((line, index) => {
          const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
          const row: any = {}

          headers.forEach((header, i) => {
            row[header] = values[i] || ""
          })

          row._rowIndex = index + 2 // +2 because we start from line 2 (after header)
          return row
        })

        // Validate data based on import type
        const errors = validateImportData(data, activeTab)
        setImportErrors(errors)
        setPreviewData(data.slice(0, 10)) // Show first 10 rows for preview
      } catch (error) {
        toast({
          title: "File Processing Error",
          description: error instanceof Error ? error.message : "Failed to process the CSV file",
          variant: "destructive",
        })
        setPreviewData([])
        setImportErrors([])
      } finally {
        setIsProcessing(false)
      }
    }

    reader.readAsText(file)
  }

  const validateImportData = (data: any[], type: string): string[] => {
    const errors: string[] = []

    switch (type) {
      case "employees":
        data.forEach((row, index) => {
          if (!row.name) errors.push(`Row ${row._rowIndex}: Name is required`)
          if (!row.email) errors.push(`Row ${row._rowIndex}: Email is required`)
          if (!row.position) errors.push(`Row ${row._rowIndex}: Position is required`)
          if (!row.department) errors.push(`Row ${row._rowIndex}: Department is required`)
          if (!row.salary || isNaN(Number(row.salary))) errors.push(`Row ${row._rowIndex}: Valid salary is required`)

          // Email validation
          if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
            errors.push(`Row ${row._rowIndex}: Invalid email format`)
          }

          // Phone validation
          if (row.phone && !/^\+233\s\d{2}\s\d{3}\s\d{4}$/.test(row.phone)) {
            errors.push(`Row ${row._rowIndex}: Phone must be in format +233 XX XXX XXXX`)
          }
        })
        break

      case "payroll":
        data.forEach((row) => {
          if (!row.employeeId) errors.push(`Row ${row._rowIndex}: Employee ID is required`)
          if (!row.employeeName) errors.push(`Row ${row._rowIndex}: Employee Name is required`)
          if (!row.basicSalary || isNaN(Number(row.basicSalary)))
            errors.push(`Row ${row._rowIndex}: Valid basic salary is required`)
          if (!row.payPeriod) errors.push(`Row ${row._rowIndex}: Pay period is required`)
        })
        break

      case "allowances":
        data.forEach((row) => {
          if (!row.employeeId) errors.push(`Row ${row._rowIndex}: Employee ID is required`)
          if (!row.employeeName) errors.push(`Row ${row._rowIndex}: Employee Name is required`)
          if (!row.effectiveDate) errors.push(`Row ${row._rowIndex}: Effective date is required`)
        })
        break

      case "leave":
        data.forEach((row) => {
          if (!row.employeeId) errors.push(`Row ${row._rowIndex}: Employee ID is required`)
          if (!row.employeeName) errors.push(`Row ${row._rowIndex}: Employee Name is required`)
          if (!row.leaveType) errors.push(`Row ${row._rowIndex}: Leave type is required`)
          if (!row.startDate) errors.push(`Row ${row._rowIndex}: Start date is required`)
          if (!row.endDate) errors.push(`Row ${row._rowIndex}: End date is required`)
          if (!row.days || isNaN(Number(row.days)))
            errors.push(`Row ${row._rowIndex}: Valid number of days is required`)
        })
        break
    }

    return errors
  }

  const handleImport = () => {
    if (!selectedFile || previewData.length === 0) {
      toast({
        title: "No Data to Import",
        description: "Please select and process a CSV file first.",
        variant: "destructive",
      })
      return
    }

    if (importErrors.length > 0) {
      toast({
        title: "Validation Errors",
        description: "Please fix all validation errors before importing.",
        variant: "destructive",
      })
      return
    }

    // Process all data (not just preview)
    const reader = new FileReader()
    reader.onload = (e) => {
      const csv = e.target?.result as string
      const lines = csv.split("\n").filter((line) => line.trim())
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
      const allData = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
        const row: any = {}
        headers.forEach((header, i) => {
          row[header] = values[i] || ""
        })
        return row
      })

      handleImportEmployees(allData, selectedFile.name)
    }
    reader.readAsText(selectedFile)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="allowances">Allowances</TabsTrigger>
          <TabsTrigger value="leave">Leave Records</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Employee Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-blue-900">Download Template First</h4>
                  <p className="text-sm text-blue-700">Use our template to ensure proper data format</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => onDownloadTemplate("employees")}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-gray-600">Upload your employee CSV file</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVFileSelect}
                      className="hidden"
                      id="employee-file-upload"
                    />
                    <label htmlFor="employee-file-upload">
                      <Button variant="outline" className="cursor-pointer bg-transparent" asChild>
                        <span>Choose CSV File</span>
                      </Button>
                    </label>
                    <p className="text-xs text-gray-500">Supported format: CSV (Max 10MB)</p>
                  </div>
                </div>
              </div>

              {selectedFile && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    {isProcessing && <div className="text-sm text-blue-600">Processing...</div>}
                  </div>
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">Validation Errors ({importErrors.length})</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importErrors.slice(0, 10).map((error, index) => (
                      <p key={index} className="text-sm text-red-700">
                        • {error}
                      </p>
                    ))}
                    {importErrors.length > 10 && (
                      <p className="text-sm text-red-600 font-medium">... and {importErrors.length - 10} more errors</p>
                    )}
                  </div>
                </div>
              )}

              {previewData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Data Preview (First 10 rows)</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(previewData[0])
                              .filter((key) => key !== "_rowIndex")
                              .map((header) => (
                                <th key={header} className="px-3 py-2 text-left font-medium text-gray-900 border-b">
                                  {header}
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, index) => (
                            <tr key={index} className="border-b">
                              {Object.entries(row)
                                .filter(([key]) => key !== "_rowIndex")
                                .map(([key, value]) => (
                                  <td key={key} className="px-3 py-2 text-gray-700">
                                    {String(value)}
                                  </td>
                                ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Payroll Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-green-900">Payroll Import Template</h4>
                  <p className="text-sm text-green-700">Import salary, allowances, and deduction data</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => onDownloadTemplate("payroll")}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Template Fields</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-yellow-800">
                  <div>• Employee ID (Required)</div>
                  <div>• Employee Name (Required)</div>
                  <div>• Basic Salary (Required)</div>
                  <div>• Transport Allowance</div>
                  <div>• Housing Allowance</div>
                  <div>• Medical Allowance</div>
                  <div>• Other Allowances</div>
                  <div>• Overtime Hours</div>
                  <div>• Overtime Rate</div>
                  <div>• Loans</div>
                  <div>• Advances</div>
                  <div>• Other Deductions</div>
                  <div>• Pay Period (Required)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allowances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Allowances Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-purple-900">Allowances Import Template</h4>
                  <p className="text-sm text-purple-700">Import employee allowances and benefits</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => onDownloadTemplate("allowances")}
                  className="bg-purple-600 text-white hover:bg-purple-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Template Fields</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-yellow-800">
                  <div>• Employee ID (Required)</div>
                  <div>• Employee Name (Required)</div>
                  <div>• Transport Allowance</div>
                  <div>• Housing Allowance</div>
                  <div>• Medical Allowance</div>
                  <div>• Meal Allowance</div>
                  <div>• Uniform Allowance</div>
                  <div>• Training Allowance</div>
                  <div>• Tools Allowance</div>
                  <div>• Communication Allowance</div>
                  <div>• Effective Date (Required)</div>
                  <div>• Notes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Leave Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-orange-900">Leave Records Import Template</h4>
                  <p className="text-sm text-orange-700">Import employee leave applications and history</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => onDownloadTemplate("leave")}
                  className="bg-orange-600 text-white hover:bg-orange-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Template Fields</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-yellow-800">
                  <div>• Employee ID (Required)</div>
                  <div>• Employee Name (Required)</div>
                  <div>• Leave Type (Required)</div>
                  <div>• Start Date (Required)</div>
                  <div>• End Date (Required)</div>
                  <div>• Days (Required)</div>
                  <div>• Reason</div>
                  <div>• Status</div>
                  <div>• Approved By</div>
                  <div>• Applied Date</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose} className="border-gray-300 hover:bg-gray-50 bg-transparent">
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={!selectedFile || previewData.length === 0 || importErrors.length > 0}
          className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import Data ({previewData.length} records)
        </Button>
      </div>
    </div>
  )
}

function AddEmployeeForm({
  employee,
  onSubmit,
  onClose,
  subsidiaries,
  setFormData,
  formData,
  employees,
  selectedEmployee,
  companySettings,
  supervisors = [],
  headsOfDepartment = [],
  companyAllowancesCatalog = [],
  companyDeductionsCatalog = [],
  companyId = "",
}: {
  employee?: any
  onSubmit: (data: any) => void
  onClose: () => void
  subsidiaries: any[]
  setFormData: (data: any) => void
  formData: any
  employees: any[]
  selectedEmployee: any
  companySettings: any
  supervisors?: any[]
  headsOfDepartment?: any[]
  companyAllowancesCatalog?: any[]
  companyDeductionsCatalog?: any[]
  companyId?: string
}) {
  const [divisions, setDivisions] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState("")
  const [divisionSearchTerm, setDivisionSearchTerm] = useState("")
  const [locationSearchTerm, setLocationSearchTerm] = useState("")
  const [supervisorSearchTerm, setSupervisorSearchTerm] = useState("")
  const [headSearchTerm, setHeadSearchTerm] = useState("")
  const [subsidiarySearchTerm, setSubsidiarySearchTerm] = useState("")
  const { toast } = useToast()
  const [currentTab, setCurrentTab] = useState("personal")

  const [phoneCountryCode, setPhoneCountryCode] = useState("+233")
  const [emergencyCountryCode, setEmergencyCountryCode] = useState("+233")

  const [companyAllowances, setCompanyAllowances] = useState(
    companyAllowancesCatalog.length
      ? companyAllowancesCatalog
      : [
          { code: "TRANS", description: "Transport Allowance", taxable: true, recurring: true },
          { code: "HOUSE", description: "Housing Allowance", taxable: true, recurring: true },
          { code: "MED", description: "Medical Allowance", taxable: false, recurring: true },
          { code: "MEAL", description: "Meal Allowance", taxable: false, recurring: true },
          { code: "UNIFORM", description: "Uniform Allowance", taxable: false, recurring: true },
          { code: "COMM", description: "Communication Allowance", taxable: false, recurring: true },
        ],
  )

  const [companyDeductions, setCompanyDeductions] = useState(
    companyDeductionsCatalog.length
      ? companyDeductionsCatalog
      : [
          { code: "TAX", description: "Tax Deduction", recurring: true, taxable: false },
          { code: "SSNIT", description: "SSNIT Deduction", recurring: true, taxable: false },
          { code: "TIER3", description: "Tier 3 Contribution", recurring: true, taxable: false },
          { code: "LOAN", description: "Loan Deduction", recurring: true, taxable: false },
          { code: "ADVANCE", description: "Advance Deduction", recurring: true, taxable: false },
        ],
  )

  const [selectedAllowances, setSelectedAllowances] = useState<
    Array<{
      id: string
      code: string
      description: string
      taxable: boolean
      recurring: boolean
      amount: string
      percentage: string
      calculationType: "AMOUNT" | "PERCENTAGE"
      effectiveDate: string
      endDate?: string
    }>
  >([])
  const [selectedDeductions, setSelectedDeductions] = useState<
    Array<{
      id: string
      code: string
      description: string
      taxable: boolean
      recurring: boolean
      amount: string
      percentage: string
      calculationType: "AMOUNT" | "PERCENTAGE"
      effectiveDate: string
      endDate?: string
    }>
  >([])
  const [showAllowanceSelector, setShowAllowanceSelector] = useState(false)
  const [showDeductionSelector, setShowDeductionSelector] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [showInactiveReason, setShowInactiveReason] = useState(false)

  // Document upload states
  const [uploadedDocuments, setUploadedDocuments] = useState([])
  const [uploadingDocuments, setUploadingDocuments] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewDocument, setPreviewDocument] = useState(null)
  const fileInputRefs = useRef({})

  // Required documents configuration
  const requiredDocuments = [
    {
      id: "academic",
      title: "1. Academic Certificate(s)",
      description: "Educational certificates and transcripts",
      acceptTypes: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
    },
    {
      id: "passport-picture",
      title: "2. Passport Picture",
      description: "Professional passport-sized photograph",
      acceptTypes: ".jpg,.jpeg,.png",
    },
    {
      id: "resume",
      title: "3. Resume & Application Letter",
      description: "Current CV and cover letter",
      acceptTypes: ".pdf,.doc,.docx",
    },
    {
      id: "passport",
      title: "4. Passport",
      description: "Valid passport copy",
      acceptTypes: ".pdf,.jpg,.jpeg,.png",
    },
    {
      id: "national-id",
      title: "5. National ID",
      description: "Ghana Card or Voter ID",
      acceptTypes: ".pdf,.jpg,.jpeg,.png",
    },
    {
      id: "medical",
      title: "6. Medical Report",
      description: "Health clearance certificate",
      acceptTypes: ".pdf,.jpg,.jpeg,.png",
    },
    {
      id: "police",
      title: "7. Police Report",
      description: "Criminal background check",
      acceptTypes: ".pdf,.jpg,.jpeg,.png",
    },
    {
      id: "other",
      title: "8. Other Uploads",
      description: "Additional supporting documents",
      acceptTypes: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
    },
  ]

  const handleAddAllowance = (allowanceCode: string) => {
    const allowance = companyAllowances.find((a) => a.code === allowanceCode)
    if (allowance && !selectedAllowances.find((a) => a.code === allowanceCode)) {
      const newAllowance = {
        id: allowance.id,
        code: allowance.code,
        description: allowance.description,
        taxable: allowance.taxable,
        recurring: allowance.recurring,
        amount: "0",
        percentage: "0",
        calculationType: "AMOUNT" as "AMOUNT" | "PERCENTAGE",
        effectiveDate: new Date().toISOString().split("T")[0],
        endDate: undefined,
      }
      setSelectedAllowances([...selectedAllowances, newAllowance])
      setShowAllowanceSelector(false)
    }
  }

  const handleRemoveAllowance = (allowanceCode: string) => {
    setSelectedAllowances(selectedAllowances.filter((a) => a.code !== allowanceCode))
  }

  const handleAllowanceChange = (allowanceCode: string, field: string, value: any) => {
    setSelectedAllowances(selectedAllowances.map((a) => (a.code === allowanceCode ? { ...a, [field]: value } : a)))
  }

  const handleAddDeduction = (deductionCode: string) => {
    const deduction = companyDeductions.find((d) => d.code === deductionCode)
    if (deduction && !selectedDeductions.find((d) => d.code === deductionCode)) {
      const newDeduction = {
        id: deduction.id,
        code: deduction.code,
        description: deduction.description,
        taxable: deduction.taxable,
        recurring: deduction.recurring,
        amount: "0",
        percentage: "0",
        calculationType: "AMOUNT" as "AMOUNT" | "PERCENTAGE",
        effectiveDate: new Date().toISOString().split("T")[0],
        endDate: undefined,
      }
      setSelectedDeductions([...selectedDeductions, newDeduction])
      setShowDeductionSelector(false)
    }
  }

  const handleRemoveDeduction = (deductionCode: string) => {
    setSelectedDeductions(selectedDeductions.filter((d) => d.code !== deductionCode))
  }

  const handleDeductionChange = (deductionCode: string, field: string, value: any) => {
    setSelectedDeductions(selectedDeductions.map((d) => (d.code === deductionCode ? { ...d, [field]: value } : d)))
  }
  // </CHANGE>

  const loadParentCompanyData = useCallback(() => {
    console.log("[v0] Loading parent company data...")
    const org = extractOrgOptions(companySettings, companySettings?.settings_data)
    setDivisions(org.divisions)
    setDepartments(org.departments)
    setLocations(org.locations)
    console.log("[v0] Parent company data loaded:", org)
  }, [companySettings])

  // Load parent org options + payroll catalogs when form opens / 2a = No
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const qs = companyId ? `?company_id=${encodeURIComponent(companyId)}` : ""
        const res = await fetch(`/api/employees/meta${qs}`, { cache: "no-store" })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "meta failed")
        setDivisions(json.divisions || [])
        setDepartments(json.departments || [])
        setLocations(json.locations || [])
        if (json.allowances?.length) setCompanyAllowances(json.allowances)
        if (json.deductions?.length) setCompanyDeductions(json.deductions)
      } catch {
        loadParentCompanyData()
        if (companyAllowancesCatalog?.length) setCompanyAllowances(companyAllowancesCatalog)
        if (companyDeductionsCatalog?.length) setCompanyDeductions(companyDeductionsCatalog)
      }
    }
    void loadMeta()
  }, [companyId, loadParentCompanyData, companyAllowancesCatalog, companyDeductionsCatalog])

  useEffect(() => {
    if (formData.hasSubsidiary !== "Yes") {
      loadParentCompanyData()
    }
  }, [formData.hasSubsidiary, loadParentCompanyData])

  // Document upload handlers (must live inside this form — UI binds to these)
  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const handleFileSelect = async (documentType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const doc = requiredDocuments.find((d) => d.id === documentType)
    if (!doc) return

    const acceptedTypes = doc.acceptTypes.split(",").map((type) => type.trim())
    const fileExtension = "." + (file.name.split(".").pop()?.toLowerCase() || "")
    const isValidType = acceptedTypes.some((type) =>
      type.startsWith(".") ? fileExtension === type : file.type.includes(type.replace(".", "")),
    )
    if (!isValidType) {
      toast({
        title: "Invalid File Type",
        description: `Please select a file with one of these types: ${doc.acceptTypes}`,
        variant: "destructive",
      })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Please select a file smaller than 10MB", variant: "destructive" })
      return
    }

    setUploadingDocuments((prev) => [...prev, documentType])
    setUploadProgress((prev) => ({ ...prev, [documentType]: 10 }))
    try {
      const body = new FormData()
      body.append("file", file)
      body.append("document_type", documentType)
      body.append("employee_id", selectedEmployee?.id || formData.employeeId || "temp-id")
      body.append(
        "employee_name",
        `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || "New Employee",
      )
      if (companyId) body.append("company_id", companyId)
      body.append("notes", `Uploaded during employee onboarding - ${doc.title}`)

      setUploadProgress((prev) => ({ ...prev, [documentType]: 55 }))
      const res = await fetch("/api/employees/documents/upload", { method: "POST", body })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Upload failed")

      setUploadProgress((prev) => ({ ...prev, [documentType]: 100 }))
      const uploadedDoc = {
        id: json.document.id,
        vaultDocumentId: json.document.vault_document_id || json.document.id,
        documentType,
        fileName: json.document.fileName || file.name,
        fileSize: json.document.fileSize || file.size,
        fileType: json.document.fileType || file.type,
        fileUrl: json.document.fileUrl,
        file_content: json.document.file_content || null,
        uploadDate: new Date(json.document.uploadDate || Date.now()),
        uploadedBy: json.document.uploadedBy || "HR Admin",
      }
      setUploadedDocuments((prev) => {
        const filtered = prev.filter((d) => d.documentType !== documentType)
        return [...filtered, uploadedDoc]
      })

      // Passport picture becomes the employee profile photo across the system
      if (
        (documentType === "passport-picture" || documentType === "passport_picture") &&
        uploadedDoc.fileUrl
      ) {
        setFormData((prev: any) => ({ ...prev, profilePicture: uploadedDoc.fileUrl }))
        const empUuid = selectedEmployee?.id
        if (empUuid && String(empUuid).length > 20) {
          fetch(`/api/employees/${empUuid}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile_picture: uploadedDoc.fileUrl }),
          }).catch(() => {})
        }
      }

      toast({ title: "Upload Successful", description: `${file.name} saved to document vault` })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingDocuments((prev) => prev.filter((d) => d !== documentType))
      setUploadProgress((prev) => ({ ...prev, [documentType]: 0 }))
      event.target.value = ""
    }
  }

  const handleUploadClick = (documentType: string) => {
    const existing = fileInputRefs.current[documentType]
    if (existing) {
      existing.value = ""
      existing.click()
      return
    }
    const tempInput = document.createElement("input")
    tempInput.type = "file"
    const doc = requiredDocuments.find((d) => d.id === documentType)
    if (doc) tempInput.accept = doc.acceptTypes
    tempInput.onchange = (e) => handleFileSelect(documentType, e as any)
    tempInput.click()
  }

  const handleRemoveDocument = (documentType: string) => {
    setUploadedDocuments((prev) => prev.filter((d) => d.documentType !== documentType))
    toast({ title: "Document Removed", description: "Document has been removed successfully" })
  }

  const handleReplaceDocument = (documentType: string) => {
    handleUploadClick(documentType)
  }

  const handlePreviewDocument = (document: any) => {
    setPreviewDocument(document)
    setIsPreviewOpen(true)
  }

  // Filtered lists for searchable dropdowns
  const filteredDepartments = departments.filter((dept) =>
    dept.toLowerCase().includes(departmentSearchTerm.toLowerCase()),
  )

  const filteredDivisions = divisions.filter((div) => div.toLowerCase().includes(divisionSearchTerm.toLowerCase()))

  const filteredLocations = locations.filter((loc) => loc.toLowerCase().includes(locationSearchTerm.toLowerCase()))

  const filteredSupervisors = supervisors.filter(
    (supervisor) =>
      supervisor.display_name?.toLowerCase().includes(supervisorSearchTerm.toLowerCase()) ||
      supervisor.position?.toLowerCase().includes(supervisorSearchTerm.toLowerCase()) ||
      supervisor.employee_id?.toLowerCase().includes(supervisorSearchTerm.toLowerCase()),
  )

  const filteredHeads = headsOfDepartment.filter(
    (head) =>
      head.display_name?.toLowerCase().includes(headSearchTerm.toLowerCase()) ||
      head.position?.toLowerCase().includes(headSearchTerm.toLowerCase()) ||
      head.employee_id?.toLowerCase().includes(headSearchTerm.toLowerCase()),
  )

  const filteredSubsidiaries = subsidiaries.filter(
    (subsidiary) =>
      subsidiary.name?.toLowerCase().includes(subsidiarySearchTerm.toLowerCase()) ||
      subsidiary.industry?.toLowerCase().includes(subsidiarySearchTerm.toLowerCase()) ||
      subsidiary.location?.toLowerCase().includes(subsidiarySearchTerm.toLowerCase()),
  )

  const countryCodes = [
    { code: "+93", country: "Afghanistan", flag: "🇦🇫" },
    { code: "+355", country: "Albania", flag: "🇦🇱" },
    { code: "+213", country: "Algeria", flag: "🇩🇿" },
    { code: "+1", country: "United States", flag: "🇺🇸" },
    { code: "+376", country: "Andorra", flag: "🇦🇩" },
    { code: "+244", country: "Angola", flag: "🇦🇴" },
    { code: "+54", country: "Argentina", flag: "🇦🇷" },
    { code: "+374", country: "Armenia", flag: "🇦🇲" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
    { code: "+43", country: "Austria", flag: "🇦🇹" },
    { code: "+994", country: "Azerbaijan", flag: "🇦🇿" },
    { code: "+973", country: "Bahrain", flag: "🇧🇭" },
    { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
    { code: "+375", country: "Belarus", flag: "🇧🇾" },
    { code: "+32", country: "Belgium", flag: "🇧🇪" },
    { code: "+501", country: "Belize", flag: "🇧🇿" },
    { code: "+229", country: "Benin", flag: "🇧🇯" },
    { code: "+975", country: "Bhutan", flag: "🇧🇹" },
    { code: "+591", country: "Bolivia", flag: "🇧🇴" },
    { code: "+387", country: "Bosnia and Herzegovina", flag: "🇧🇦" },
    { code: "+267", country: "Botswana", flag: "🇧🇼" },
    { code: "+55", country: "Brazil", flag: "🇧🇷" },
    { code: "+673", country: "Brunei", flag: "🇧🇳" },
    { code: "+359", country: "Bulgaria", flag: "🇧🇬" },
    { code: "+226", country: "Burkina Faso", flag: "🇧🇫" },
    { code: "+257", country: "Burundi", flag: "🇧🇮" },
    { code: "+855", country: "Cambodia", flag: "🇰🇭" },
    { code: "+237", country: "Cameroon", flag: "🇨🇲" },
    { code: "+1", country: "Canada", flag: "🇨🇦" },
    { code: "+238", country: "Cape Verde", flag: "🇨🇻" },
    { code: "+236", country: "Central African Republic", flag: "🇨🇫" },
    { code: "+235", country: "Chad", flag: "🇹🇩" },
    { code: "+56", country: "Chile", flag: "🇨🇱" },
    { code: "+86", country: "China", flag: "🇨🇳" },
    { code: "+57", country: "Colombia", flag: "🇨🇴" },
    { code: "+269", country: "Comoros", flag: "🇰🇲" },
    { code: "+242", country: "Congo", flag: "🇨🇬" },
    { code: "+243", country: "Congo (DRC)", flag: "🇨🇩" },
    { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
    { code: "+225", country: "Côte d'Ivoire", flag: "🇨🇮" },
    { code: "+385", country: "Croatia", flag: "🇭🇷" },
    { code: "+53", country: "Cuba", flag: "🇨🇺" },
    { code: "+357", country: "Cyprus", flag: "🇨🇾" },
    { code: "+420", country: "Czech Republic", flag: "🇨🇿" },
    { code: "+45", country: "Denmark", flag: "🇩🇰" },
    { code: "+253", country: "Djibouti", flag: "🇩🇯" },
    { code: "+593", country: "Ecuador", flag: "🇪🇨" },
    { code: "+20", country: "Egypt", flag: "🇪🇬" },
    { code: "+503", country: "El Salvador", flag: "🇸🇻" },
    { code: "+240", country: "Equatorial Guinea", flag: "🇬🇶" },
    { code: "+291", country: "Eritrea", flag: "🇪🇷" },
    { code: "+372", country: "Estonia", flag: "🇪🇪" },
    { code: "+251", country: "Ethiopia", flag: "🇪🇹" },
    { code: "+679", country: "Fiji", flag: "🇫🇯" },
    { code: "+358", country: "Finland", flag: "🇫🇮" },
    { code: "+33", country: "France", flag: "🇫🇷" },
    { code: "+241", country: "Gabon", flag: "🇬🇦" },
    { code: "+220", country: "Gambia", flag: "🇬🇲" },
    { code: "+995", country: "Georgia", flag: "🇬🇪" },
    { code: "+49", country: "Germany", flag: "🇩🇪" },
    { code: "+233", country: "Ghana", flag: "🇬🇭" },
    { code: "+30", country: "Greece", flag: "🇬🇷" },
    { code: "+502", country: "Guatemala", flag: "🇬🇹" },
    { code: "+224", country: "Guinea", flag: "🇬🇳" },
    { code: "+245", country: "Guinea-Bissau", flag: "🇬🇼" },
    { code: "+592", country: "Guyana", flag: "🇬🇾" },
    { code: "+509", country: "Haiti", flag: "🇭🇹" },
    { code: "+504", country: "Honduras", flag: "🇭🇳" },
    { code: "+36", country: "Hungary", flag: "🇭🇺" },
    { code: "+354", country: "Iceland", flag: "🇮🇸" },
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+62", country: "Indonesia", flag: "🇮🇩" },
    { code: "+98", country: "Iran", flag: "🇮🇷" },
    { code: "+964", country: "Iraq", flag: "🇮🇶" },
    { code: "+353", country: "Ireland", flag: "🇮🇪" },
    { code: "+972", country: "Israel", flag: "🇮🇱" },
    { code: "+39", country: "Italy", flag: "🇮🇹" },
    { code: "+81", country: "Japan", flag: "🇯🇵" },
    { code: "+962", country: "Jordan", flag: "🇯🇴" },
    { code: "+7", country: "Kazakhstan", flag: "🇰🇿" },
    { code: "+254", country: "Kenya", flag: "🇰🇪" },
    { code: "+965", country: "Kuwait", flag: "🇰🇼" },
    { code: "+996", country: "Kyrgyzstan", flag: "🇰🇬" },
    { code: "+856", country: "Laos", flag: "🇱🇦" },
    { code: "+371", country: "Latvia", flag: "🇱🇻" },
    { code: "+961", country: "Lebanon", flag: "🇱🇧" },
    { code: "+266", country: "Lesotho", flag: "🇱🇸" },
    { code: "+231", country: "Liberia", flag: "🇱🇷" },
    { code: "+218", country: "Libya", flag: "🇱🇾" },
    { code: "+370", country: "Lithuania", flag: "🇱🇹" },
    { code: "+352", country: "Luxembourg", flag: "🇱🇺" },
    { code: "+261", country: "Madagascar", flag: "🇲🇬" },
    { code: "+265", country: "Malawi", flag: "🇲🇼" },
    { code: "+60", country: "Malaysia", flag: "🇲🇾" },
    { code: "+960", country: "Maldives", flag: "🇲🇻" },
    { code: "+223", country: "Mali", flag: "🇲🇱" },
    { code: "+356", country: "Malta", flag: "🇲🇹" },
    { code: "+222", country: "Mauritania", flag: "🇲🇷" },
    { code: "+230", country: "Mauritius", flag: "🇲🇺" },
    { code: "+52", country: "Mexico", flag: "🇲🇽" },
    { code: "+373", country: "Moldova", flag: "🇲🇩" },
    { code: "+377", country: "Monaco", flag: "🇲🇨" },
    { code: "+976", country: "Mongolia", flag: "🇲🇳" },
    { code: "+382", country: "Montenegro", flag: "🇲🇪" },
    { code: "+212", country: "Morocco", flag: "🇲🇦" },
    { code: "+258", country: "Mozambique", flag: "🇲🇿" },
    { code: "+95", country: "Myanmar", flag: "🇲🇲" },
    { code: "+264", country: "Namibia", flag: "🇳🇦" },
    { code: "+977", country: "Nepal", flag: "🇳🇵" },
    { code: "+31", country: "Netherlands", flag: "🇳🇱" },
    { code: "+64", country: "New Zealand", flag: "🇳🇿" },
    { code: "+505", country: "Nicaragua", flag: "🇳🇮" },
    { code: "+227", country: "Niger", flag: "🇳🇪" },
    { code: "+234", country: "Nigeria", flag: "🇳🇬" },
    { code: "+47", country: "Norway", flag: "🇳🇴" },
    { code: "+968", country: "Oman", flag: "🇴🇲" },
    { code: "+92", country: "Pakistan", flag: "🇵🇰" },
    { code: "+507", country: "Panama", flag: "🇵🇦" },
    { code: "+595", country: "Paraguay", flag: "🇵🇾" },
    { code: "+51", country: "Peru", flag: "🇵🇪" },
    { code: "+63", country: "Philippines", flag: "🇵🇭" },
    { code: "+48", country: "Poland", flag: "🇵🇱" },
    { code: "+351", country: "Portugal", flag: "🇵🇹" },
    { code: "+974", country: "Qatar", flag: "🇶🇦" },
    { code: "+40", country: "Romania", flag: "🇷🇴" },
    { code: "+7", country: "Russia", flag: "🇷🇺" },
    { code: "+250", country: "Rwanda", flag: "🇷🇼" },
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
    { code: "+221", country: "Senegal", flag: "🇸🇳" },
    { code: "+381", country: "Serbia", flag: "🇷🇸" },
    { code: "+248", country: "Seychelles", flag: "🇸🇨" },
    { code: "+232", country: "Sierra Leone", flag: "🇸🇱" },
    { code: "+65", country: "Singapore", flag: "🇸🇬" },
    { code: "+421", country: "Slovakia", flag: "🇸🇰" },
    { code: "+386", country: "Slovenia", flag: "🇸🇮" },
    { code: "+252", country: "Somalia", flag: "🇸🇴" },
    { code: "+27", country: "South Africa", flag: "🇿🇦" },
    { code: "+82", country: "South Korea", flag: "🇰🇷" },
    { code: "+211", country: "South Sudan", flag: "🇸🇸" },
    { code: "+34", country: "Spain", flag: "���🇸" },
    { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
    { code: "+249", country: "Sudan", flag: "🇸🇩" },
    { code: "+597", country: "Suriname", flag: "🇸🇷" },
    { code: "+268", country: "Eswatini", flag: "🇸🇿" },
    { code: "+46", country: "Sweden", flag: "🇸🇪" },
    { code: "+41", country: "Switzerland", flag: "🇨🇭" },
    { code: "+963", country: "Syria", flag: "🇸🇾" },
    { code: "+992", country: "Tajikistan", flag: "🇹🇯" },
    { code: "+255", country: "Tanzania", flag: "🇹🇿" },
    { code: "+66", country: "Thailand", flag: "🇹🇭" },
    { code: "+228", country: "Togo", flag: "🇹🇬" },
    { code: "+216", country: "Tunisia", flag: "🇹🇳" },
    { code: "+90", country: "Turkey", flag: "🇹🇷" },
    { code: "+993", country: "Turkmenistan", flag: "🇹🇲" },
    { code: "+256", country: "Uganda", flag: "🇺🇬" },
    { code: "+380", country: "Ukraine", flag: "🇺🇦" },
    { code: "+971", country: "UAE", flag: "🇦🇪" },
    { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
    { code: "+598", country: "Uruguay", flag: "🇺🇾" },
    { code: "+998", country: "Uzbekistan", flag: "🇺🇿" },
    { code: "+58", country: "Venezuela", flag: "🇻🇪" },
    { code: "+84", country: "Vietnam", flag: "🇻🇳" },
    { code: "+967", country: "Yemen", flag: "🇾🇪" },
    { code: "+260", country: "Zambia", flag: "🇿🇲" },
    { code: "+263", country: "Zimbabwe", flag: "🇿🇼" },
  ]

  useEffect(() => {
    if (employee) {
      setFormData(employeeToFormData(employee))
      setSelectedAllowances(toSelectedFinancialRows(employee.allowances))
      setSelectedDeductions(toSelectedFinancialRows(employee.deductions))
      setUploadedDocuments(toUploadedDocumentsState(employee.documents))
    }
  }, [employee, setFormData])

  useEffect(() => {
    if (formData.hasSubsidiary === "Yes" && formData.subsidiary) {
      const selectedSubsidiary = subsidiaries.find((s) => s.id === formData.subsidiary)
      if (selectedSubsidiary) {
        const org = extractOrgOptions(selectedSubsidiary)
        setDivisions(org.divisions)
        setDepartments(org.departments)
        setLocations(org.locations)
      }
    } else if (formData.hasSubsidiary !== "Yes") {
      loadParentCompanyData()
    }
  }, [formData.subsidiary, formData.hasSubsidiary, subsidiaries, loadParentCompanyData])

  const validateForm = () => {
    let isValid = true
    const newErrors: Record<string, string> = {}

    if (!formData.firstName) {
      newErrors.firstName = "First name is required"
      isValid = false
    }

    if (!formData.lastName) {
      newErrors.lastName = "Last name is required"
      isValid = false
    }

    if (!formData.personalEmail) {
      newErrors.personalEmail = "Personal email is required"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.personalEmail)) {
      newErrors.personalEmail = "Personal email is invalid"
      isValid = false
    }

    if (!formData.corporateEmail) {
      newErrors.corporateEmail = "Corporate email is required"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.corporateEmail)) {
      newErrors.corporateEmail = "Corporate email is invalid"
      isValid = false
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required"
      isValid = false
    }

    if (!formData.position) {
      newErrors.position = "Position is required"
      isValid = false
    }

    if (!formData.department) {
      newErrors.department = "Department is required"
      isValid = false
    }

    if (!formData.location) {
      newErrors.location = "Location is required"
      isValid = false
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of Birth is required"
      isValid = false
    }

    if (!formData.status) {
      newErrors.status = "Status is required"
      isValid = false
    }

    if (formData.status === "Inactive" && !formData.inactiveReason) {
      newErrors.inactiveReason = "Inactive reason is required when status is Inactive"
      isValid = false
    }

    const monthly = Number(formData.salary)
    const annual = Number(formData.annualSalary)
    if ((!formData.salary && !formData.annualSalary) || (Number.isNaN(monthly) && Number.isNaN(annual))) {
      newErrors.salary = "Monthly or annual salary is required"
      isValid = false
    } else if (formData.salary && (Number.isNaN(monthly) || monthly < 0)) {
      newErrors.salary = "Monthly salary must be a valid number"
      isValid = false
    } else if (formData.annualSalary && (Number.isNaN(annual) || annual < 0)) {
      newErrors.annualSalary = "Annual salary must be a valid number"
      isValid = false
    }

    if (formData.providentFundEnrolled === "Yes") {
      const pfRate = Number(formData.providentFundRate)
      if (!formData.providentFundRate || Number.isNaN(pfRate) || pfRate <= 0) {
        newErrors.providentFundRate = "Enter a provident fund rate greater than 0"
        isValid = false
      } else if (pfRate > 16.5) {
        newErrors.providentFundRate = "Provident fund rate cannot exceed 16.5%"
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async () => {
    if (validateForm()) {
      const fullName = `${formData.firstName} ${formData.otherNames || ""} ${formData.lastName}`.replace(/\s+/g, " ").trim()
      const displayName = `${formData.firstName} ${formData.lastName}`.trim()
      const monthly =
        formData.salary && Number(formData.salary) > 0
          ? formData.salary
          : formData.annualSalary
            ? String(Number(formData.annualSalary) / 12)
            : formData.salary
      const annual =
        formData.annualSalary && Number(formData.annualSalary) > 0
          ? formData.annualSalary
          : monthly
            ? String(Number(monthly) * 12)
            : formData.annualSalary

      const employeeData = {
        ...formData,
        fullName,
        displayName,
        employeeId: formData.employeeId,
        salary: monthly,
        annualSalary: annual,
        selectedAllowances,
        selectedDeductions,
        uploadedDocuments,
        documents: uploadedDocuments.map((d) => ({
          documentType: d.documentType,
          fileName: d.fileName,
          fileSize: d.fileSize,
          fileType: d.fileType,
          fileUrl: d.fileUrl,
          file_url: d.fileUrl,
          file_content: d.file_content || null,
          vaultDocumentId: d.vaultDocumentId || d.id,
          vault_document_id: d.vaultDocumentId || d.id,
          uploadedBy: d.uploadedBy,
        })),
      }

      onSubmit(employeeData)
    } else {
      toast({
        title: "Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const clearErrorsForTab = (tab: string) => {
    const fieldsToClear: string[] = []

    if (tab === "personal") {
      fieldsToClear.push("firstName", "lastName", "personalEmail", "corporateEmail", "phone", "dateOfBirth")
    } else if (tab === "employment") {
      fieldsToClear.push("position", "department", "location", "status")
    }

    const newErrors = { ...errors }
    fieldsToClear.forEach((field) => {
      if (newErrors[field]) {
        delete newErrors[field]
      }
    })
    setErrors(newErrors)
  }

  const handleNext = () => {
    // Validate current tab before moving to next
    if (currentTab === "personal") {
      // Validate personal information
      const personalErrors: Record<string, string> = {}
      let hasPersonalErrors = false

      if (!formData.firstName) {
        personalErrors.firstName = "First name is required"
        hasPersonalErrors = true
      }
      if (!formData.lastName) {
        personalErrors.lastName = "Last name is required"
        hasPersonalErrors = true
      }
      if (!formData.personalEmail) {
        personalErrors.personalEmail = "Personal email is required"
        hasPersonalErrors = true
      } else if (!/\S+@\S+\.\S+/.test(formData.personalEmail)) {
        personalErrors.personalEmail = "Personal email is invalid"
        hasPersonalErrors = true
      }
      if (!formData.corporateEmail) {
        personalErrors.corporateEmail = "Corporate email is required"
        hasPersonalErrors = true
      } else if (!/\S+@\S+\.\S+/.test(formData.corporateEmail)) {
        personalErrors.corporateEmail = "Corporate email is invalid"
        hasPersonalErrors = true
      }
      if (!formData.phone) {
        personalErrors.phone = "Phone number is required"
        hasPersonalErrors = true
      }
      if (!formData.dateOfBirth) {
        personalErrors.dateOfBirth = "Date of birth is required"
        hasPersonalErrors = true
      }

      if (hasPersonalErrors) {
        setErrors(personalErrors)
        toast({
          title: "Validation Error",
          description: "Please fill in all required personal information fields correctly.",
          variant: "destructive",
        })
        return
      }
      clearErrorsForTab("personal")
      setCurrentTab("employment")
    } else if (currentTab === "employment") {
      // Validate employment information
      const employmentErrors: Record<string, string> = {}
      let hasEmploymentErrors = false

      if (!formData.position) {
        employmentErrors.position = "Position is required"
        hasEmploymentErrors = true
      }
      if (!formData.department) {
        employmentErrors.department = "Department is required"
        hasEmploymentErrors = true
      }
      if (!formData.location) {
        employmentErrors.location = "Location is required"
        hasEmploymentErrors = true
      }
      if (!formData.status) {
        employmentErrors.status = "Status is required"
        hasEmploymentErrors = true
      }

      if (hasEmploymentErrors) {
        setErrors(employmentErrors)
        toast({
          title: "Validation Error",
          description: "Please fill in all required employment information fields correctly.",
          variant: "destructive",
        })
        return
      }
      clearErrorsForTab("employment")
      setCurrentTab("financial")
    } else if (currentTab === "financial") {
      // Financial information is optional, so we can proceed
      setCurrentTab("documents")
    }
  }

  const handlePrevious = () => {
    if (currentTab === "employment") {
      clearErrorsForTab("employment")
      setCurrentTab("personal")
    } else if (currentTab === "financial") {
      setCurrentTab("employment")
    } else if (currentTab === "documents") {
      setCurrentTab("financial")
    }
  }

  const ghanaianBanks = [
    "Access Bank",
    "Agricultural Development Bank",
    "Bank of Africa",
    "CalBank",
    "Consolidated Bank Ghana",
    "Ecobank Ghana",
    "Fidelity Bank Ghana",
    "First Atlantic Bank",
    "First National Bank Ghana Limited",
    "GCB Bank Limited",
    "Guaranty Trust Bank Ghana",
    "National Investment Bank",
    "OmniBSIC Bank",
    "Prudential Bank Ghana",
    "Republic Bank Ghana",
    "Societe Generale Ghana",
    "Stanbic Bank Ghana",
    "Standard Chartered Bank Ghana",
    "United Bank for Africa Ghana",
    "Zenith Bank Ghana",
  ]

  const [customBanks, setCustomBanks] = useState<string[]>([])
  const [showAddBank, setShowAddBank] = useState(false)
  const [newBankName, setNewBankName] = useState("")
  const [isAddingBank, setIsAddingBank] = useState(false)

  // Load custom banks for the company
  const loadCustomBanks = async () => {
    try {
      if (isDemoMode()) {
        console.log("[v0] Demo mode: Using empty custom banks")
        setCustomBanks([])
        return
      }

      const { data: customBanksData, error } = await createClient() // Fixed: supabase variable declared
        .from("custom_banks")
        .select("bank_name")
        .eq("company_id", companySettings?.id)

      if (error) {
        console.error("Error loading custom banks:", error)
        return
      }

      const bankNames = customBanksData?.map((bank) => bank.bank_name) || []
      setCustomBanks(bankNames)
    } catch (error) {
      console.error("Error loading custom banks:", error)
    }
  }

  // Add new custom bank
  const addCustomBank = async () => {
    if (!newBankName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a bank name.",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] Starting addCustomBank:", { newBankName: newBankName.trim(), isDemoMode: isDemoMode() })
    setIsAddingBank(true)

    try {
      const bankToAdd = newBankName.trim()

      // Check if we're in demo mode
      if (isDemoMode()) {
        console.log("[v0] Demo mode: Adding custom bank:", bankToAdd)

        // Add to custom banks list
        setCustomBanks((prev) => {
          const newBanks = [...prev, bankToAdd]
          console.log("[v0] Updated customBanks list (demo):", newBanks)
          return newBanks
        })

        // Set the newly added bank as selected
        handleInputChange("bankName", bankToAdd)

        // Clear form and hide
        setNewBankName("")
        setShowAddBank(false)
        setIsAddingBank(false)

        toast({
          title: "✅ Bank Added Successfully!",
          description: `"${bankToAdd}" has been added to your company's bank list and is now selected.`,
        })

        console.log("[v0] Demo bank added successfully")
        return
      }

      // Get current user
      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      console.log("[v0] Auth check:", { hasUser: !!user, userError: userError?.message })

      // If no user but we have company settings, treat as demo mode
      if (!user && companySettings?.id) {
        console.log("[v0] No auth user but have company settings, treating as demo mode")

        // Add to custom banks list
        setCustomBanks((prev) => {
          const newBanks = [...prev, bankToAdd]
          console.log("[v0] Updated customBanks list (fallback demo):", newBanks)
          return newBanks
        })

        // Set the newly added bank as selected
        handleInputChange("bankName", bankToAdd)

        // Clear form and hide
        setNewBankName("")
        setShowAddBank(false)
        setIsAddingBank(false)

        toast({
          title: "✅ Bank Added Successfully!",
          description: `"${bankToAdd}" has been added to your company's bank list and is now selected.`,
        })

        console.log("[v0] Bank added and form cleared successfully")
        return
      }

      if (userError || !user) {
        console.error("[v0] Error getting user:", userError)
        toast({
          title: "Error",
          description: "Unable to verify user. Please try again.",
          variant: "destructive",
        })
        setIsAddingBank(false)
        return
      }

      console.log("[v0] User verified:", { userId: user.id })

      // Check if company settings exist
      if (!companySettings?.id) {
        console.error("[v0] No company settings found")
        toast({
          title: "Error",
          description: "Company settings not found. Please refresh the page.",
          variant: "destructive",
        })
        setIsAddingBank(false)
        return
      }

      console.log("[v0] Inserting custom bank:", {
        company_id: companySettings.id,
        bank_name: bankToAdd,
        created_by: user.id,
      })

      // Insert the custom bank
      const { data: insertedBank, error: insertError } = await supabase
        .from("custom_banks")
        .insert({
          company_id: companySettings.id,
          bank_name: bankToAdd,
          created_by: user.id,
        })
        .select()
        .single()

      if (insertError) {
        console.error("[v0] Error adding custom bank:", insertError)
        toast({
          title: "Error",
          description: `Failed to add custom bank: ${insertError.message}`,
          variant: "destructive",
        })
        setIsAddingBank(false)
        return
      }

      console.log("[v0] Custom bank inserted successfully:", insertedBank)

      // Add to custom banks list
      setCustomBanks((prev) => {
        const newBanks = [...prev, bankToAdd]
        console.log("[v0] Updated customBanks list (Supabase):", newBanks)
        return newBanks
      })

      // Set the newly added bank as selected
      handleInputChange("bankName", bankToAdd)

      // Clear form and hide
      setNewBankName("")
      setShowAddBank(false)
      setIsAddingBank(false)

      toast({
        title: "✅ Bank Added Successfully!",
        description: `"${bankToAdd}" has been added to your company's bank list and is now selected.`,
      })

      console.log("[v0] Bank added and form cleared successfully")
    } catch (error) {
      console.error("[v0] Unexpected error adding custom bank:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setIsAddingBank(false)
    }
  }

  // Calculate monthly salary from annual salary
  const calculateMonthlySalary = (annualSalary: string) => {
    if (!annualSalary || isNaN(Number(annualSalary)) || Number(annualSalary) <= 0) return ""
    const monthly = Number(annualSalary) / 12
    return monthly.toFixed(2)
  }

  // Handle annual salary change
  const handleAnnualSalaryChange = (value: string) => {
    // Update annual salary
    setFormData((prev) => ({
      ...prev,
      annualSalary: value,
    }))

    // Calculate and update monthly salary
    const monthlySalary = calculateMonthlySalary(value)
    setFormData((prev) => ({
      ...prev,
      salary: monthlySalary,
    }))

    // Clear any existing errors for annual salary
    if (errors.annualSalary) {
      setErrors((prev) => ({
        ...prev,
        annualSalary: "",
      }))
    }
  }

  // Handle bank selection change
  const handleBankSelectionChange = (value: string) => {
    if (value === "add_new_bank") {
      setShowAddBank(true)
      // Reset the select value to show placeholder
      setFormData((prev) => ({
        ...prev,
        bankName: "",
      }))
    } else {
      handleInputChange("bankName", value)
      setShowAddBank(false)
    }
  }

  // Load custom banks on component mount
  useEffect(() => {
    if (companySettings?.id) {
      loadCustomBanks()
    }
  }, [companySettings?.id])

  return (
    <div className="space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="flex justify-between">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="personal" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prefix">1. Prefix</Label>
              <Select value={formData.prefix} onValueChange={(value) => handleInputChange("prefix", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select prefix" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mr.">Mr.</SelectItem>
                  <SelectItem value="Mrs.">Mrs.</SelectItem>
                  <SelectItem value="Ms.">Ms.</SelectItem>
                  <SelectItem value="Dr.">Dr.</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">2. First Name *</Label>
              <Input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className={errors.firstName ? "border-red-500" : ""}
                required
              />
              {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherNames">3. Other Names</Label>
              <Input
                type="text"
                id="otherNames"
                value={formData.otherNames}
                onChange={(e) => handleInputChange("otherNames", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">4. Last Name *</Label>
              <Input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className={errors.lastName ? "border-red-500" : ""}
                required
              />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maritalStatus">5. Marital Status</Label>
              <Select
                value={formData.maritalStatus}
                onValueChange={(value) => handleInputChange("maritalStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                  <SelectItem value="Separated">Separated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">6. Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalEmail">7. Personal Email *</Label>
              <Input
                type="email"
                id="personalEmail"
                value={formData.personalEmail}
                onChange={(e) => handleInputChange("personalEmail", e.target.value)}
                className={errors.personalEmail ? "border-red-500" : ""}
                required
              />
              {errors.personalEmail && <p className="text-red-500 text-sm mt-1">{errors.personalEmail}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="corporateEmail">8. Corporate Email *</Label>
              <Input
                type="email"
                id="corporateEmail"
                value={formData.corporateEmail}
                onChange={(e) => handleInputChange("corporateEmail", e.target.value)}
                className={errors.corporateEmail ? "border-red-500" : ""}
                required
              />
              {errors.corporateEmail && <p className="text-red-500 text-sm mt-1">{errors.corporateEmail}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">9. Phone Number *</Label>
              <div className="flex">
                <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="+233" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-auto">
                    {countryCodes.map((country) => (
                      <SelectItem key={`${country.code}-${country.country}`} value={country.code}>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{country.flag}</span>
                          <span className="text-sm">{country.code}</span>
                          <span className="text-xs text-gray-500">{country.country}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={`flex-1 ${errors.phone ? "border-red-500" : ""}`}
                  required
                />
              </div>
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">10. Date of Birth *</Label>
              <Input
                type="date"
                id="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                className={errors.dateOfBirth ? "border-red-500" : ""}
                required
              />
              {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">11. Address</Label>
              <Input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="educationalLevel">12. Educational Level</Label>
              <Select
                value={formData.educationalLevel}
                onValueChange={(value) => handleInputChange("educationalLevel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select educational level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Certificate">Certificate</SelectItem>
                  <SelectItem value="Diploma">Diploma</SelectItem>
                  <SelectItem value="Degree">Degree</SelectItem>
                  <SelectItem value="Masters">Masters</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">13. Emergency Contact Name</Label>
              <Input
                type="text"
                id="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactTel">14. Emergency Contact Tel</Label>
              <div className="flex">
                <Select value={emergencyCountryCode} onValueChange={setEmergencyCountryCode}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="+233" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-auto">
                    {countryCodes.map((country) => (
                      <SelectItem key={`${country.code}-${country.country}`} value={country.code}>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{country.flag}</span>
                          <span className="text-sm">{country.code}</span>
                          <span className="text-xs text-gray-500">{country.country}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  id="emergencyContactTel"
                  value={formData.emergencyContactTel}
                  onChange={(e) => handleInputChange("emergencyContactTel", e.target.value)}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="employment" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">1. Position *</Label>
              <Input
                type="text"
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                className={errors.position ? "border-red-500" : ""}
                required
              />
              {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeId">1a. Employee ID *</Label>
              <Input
                type="text"
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => handleInputChange("employeeId", e.target.value)}
                className="bg-muted"
                readOnly
                placeholder="Auto-generated"
              />
              <p className="text-xs text-muted-foreground">Auto-generated based on company/subsidiary</p>
            </div>
            {/* </CHANGE> */}

            <div className="space-y-2">
              <Label htmlFor="specialRole">1b. Special Role</Label>
              <Select value={formData.specialRole} onValueChange={(value) => handleInputChange("specialRole", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select special role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Head of Department">Head of Department</SelectItem>
                  <SelectItem value="Direct Supervisor">Direct Supervisor</SelectItem>
                  <SelectItem value="No Role">No Role</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* </CHANGE> */}

            <div className="space-y-2">
              <Label htmlFor="hasSubsidiary">2a. Select Subsidiary</Label>
              <Select
                value={formData.hasSubsidiary}
                onValueChange={(value) => {
                  console.log("[v0] hasSubsidiary changed to:", value)
                  setFormData((prev: any) => ({
                    ...prev,
                    hasSubsidiary: value,
                    subsidiary: value === "No" ? "" : prev.subsidiary,
                  }))
                  if (value === "No") {
                    console.log("[v0] Clearing subsidiary selection and loading parent company data")
                    loadParentCompanyData()
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.hasSubsidiary === "Yes" && (
              <div className="space-y-2">
                <Label htmlFor="subsidiary">2b. Subsidiary</Label>
                <Select
                  value={formData.subsidiary}
                  onValueChange={(value) => {
                    console.log("[v0] Subsidiary changed to:", value)
                    handleInputChange("subsidiary", value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subsidiary" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Search subsidiaries..."
                        value={subsidiarySearchTerm}
                        onChange={(e) => setSubsidiarySearchTerm(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    {filteredSubsidiaries.length === 0 ? (
                      <SelectItem value="__no_subsidiaries__" disabled>
                        No subsidiaries found
                      </SelectItem>
                    ) : (
                      filteredSubsidiaries.map((subsidiary) => (
                        <SelectItem key={subsidiary.id} value={subsidiary.id}>
                          <div className="flex flex-col">
                            <span>{subsidiary.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {subsidiary.industry} • {subsidiary.location}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* </CHANGE> */}

            <div className="space-y-2">
              <Label htmlFor="division">3. Division</Label>
              <Select value={formData.division} onValueChange={(value) => handleInputChange("division", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search divisions..."
                      value={divisionSearchTerm}
                      onChange={(e) => setDivisionSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {filteredDivisions.length === 0 ? (
                    <SelectItem value="__no_divisions__" disabled>
                      No divisions found
                    </SelectItem>
                  ) : (
                    filteredDivisions.map((division) => (
                      <SelectItem key={division} value={division}>
                        {division}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">4. Department *</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => handleInputChange("department", value)}
                required
              >
                <SelectTrigger className={errors.department ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search departments..."
                      value={departmentSearchTerm}
                      onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {filteredDepartments.length === 0 ? (
                    <SelectItem value="__no_departments__" disabled>
                      No departments found
                    </SelectItem>
                  ) : (
                    filteredDepartments.map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">5. Location *</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => handleInputChange("location", value)}
                required
              >
                <SelectTrigger className={errors.location ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search locations..."
                      value={locationSearchTerm}
                      onChange={(e) => setLocationSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {filteredLocations.length === 0 ? (
                    <SelectItem value="__no_locations__" disabled>
                      No locations found
                    </SelectItem>
                  ) : (
                    filteredLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractType">6. Contract Type</Label>
              <Select value={formData.contractType} onValueChange={(value) => handleInputChange("contractType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Permanent">Permanent</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Intern">Intern</SelectItem>
                  <SelectItem value="Consultant">Consultant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfJoining">7. Date of Joining</Label>
              <Input
                type="date"
                id="dateOfJoining"
                value={formData.dateOfJoining}
                onChange={(e) => handleInputChange("dateOfJoining", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfExit">8. Date of Exit</Label>
              <Input
                type="date"
                id="dateOfExit"
                value={formData.dateOfExit}
                onChange={(e) => handleInputChange("dateOfExit", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">9. Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => {
                  handleInputChange("status", value)

                  // Force state update for inactive reason
                  if (value === "Active") {
                    handleInputChange("inactiveReason", "")
                    // Clear any validation errors for inactive reason
                    setErrors((prev) => ({
                      ...prev,
                      inactiveReason: "",
                    }))
                    // Force re-render by updating state
                    setShowInactiveReason(false)
                  } else if (value === "Inactive") {
                    setShowInactiveReason(true)
                  }
                }}
              >
                <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
            </div>

            {formData.status === "Inactive" && (
              <div className="space-y-2" key={`inactive-reason-${formData.status}-${Date.now()}`}>
                <Label htmlFor="inactiveReason">9a. Inactive Reason *</Label>
                <Select
                  value={formData.inactiveReason}
                  onValueChange={(value) => {
                    handleInputChange("inactiveReason", value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Resigned">Resigned</SelectItem>
                    <SelectItem value="Terminated">Terminated</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* </CHANGE> */}

            <div className="space-y-2">
              <Label htmlFor="probationPeriod">10. Probation Period (Months)</Label>
              <Input
                type="number"
                id="probationPeriod"
                value={formData.probationPeriod}
                onChange={(e) => handleInputChange("probationPeriod", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmationDate">11. Confirmation Date</Label>
              <Input
                type="date"
                id="confirmationDate"
                value={formData.confirmationDate}
                onChange={(e) => handleInputChange("confirmationDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="noticePeriod">12. Notice Period</Label>
              <Input
                type="text"
                id="noticePeriod"
                value={formData.noticePeriod}
                onChange={(e) => handleInputChange("noticePeriod", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="directSupervisor">13. Direct Supervisor</Label>
              <Select
                value={formData.directSupervisor}
                onValueChange={(value) => handleInputChange("directSupervisor", value)}
                disabled={supervisors.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={supervisors.length === 0 ? "No data available" : "Select supervisor"} />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.length === 0 ? (
                    <SelectItem value="__no_supervisors__" disabled>
                      No supervisors available for this department
                    </SelectItem>
                  ) : (
                    <>
                      <div className="p-2">
                        <Input
                          placeholder="Search supervisors..."
                          value={supervisorSearchTerm}
                          onChange={(e) => setSupervisorSearchTerm(e.target.value)}
                          className="mb-2"
                        />
                      </div>
                      {filteredSupervisors.length === 0 ? (
                        <SelectItem value="__no_supervisors_filtered__" disabled>
                          No supervisors found
                        </SelectItem>
                      ) : (
                        filteredSupervisors.map((supervisor) => (
                          <SelectItem key={supervisor.id} value={supervisor.id}>
                            <div className="flex flex-col">
                              <span>{supervisor.display_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {supervisor.position} • {supervisor.employee_id}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
              {supervisors.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No employees with "Direct Supervisor" role found in this department
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="headOfDepartment">14. Head of Department</Label>
              <Select
                value={formData.headOfDepartment}
                onValueChange={(value) => handleInputChange("headOfDepartment", value)}
                disabled={headsOfDepartment.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={headsOfDepartment.length === 0 ? "No data available" : "Select head"} />
                </SelectTrigger>
                <SelectContent>
                  {headsOfDepartment.length === 0 ? (
                    <SelectItem value="__no_heads__" disabled>
                      No heads available for this department
                    </SelectItem>
                  ) : (
                    <>
                      <div className="p-2">
                        <Input
                          placeholder="Search heads..."
                          value={headSearchTerm}
                          onChange={(e) => setHeadSearchTerm(e.target.value)}
                          className="mb-2"
                        />
                      </div>
                      {filteredHeads.length === 0 ? (
                        <SelectItem value="__no_heads_filtered__" disabled>
                          No heads found
                        </SelectItem>
                      ) : (
                        filteredHeads.map((head) => (
                          <SelectItem key={head.id} value={head.id}>
                            <div className="flex flex-col">
                              <span>{head.display_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {head.position} • {head.employee_id}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
              {headsOfDepartment.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No employees with "Head of Department" role found in this department
                </p>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="financial" className="space-y-4">
          <div className="space-y-6">
            {/* Basic Financial Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annualSalary">Annual Salary (GHS) *</Label>
                <Input
                  type="number"
                  id="annualSalary"
                  value={formData.annualSalary}
                  onChange={(e) => handleAnnualSalaryChange(e.target.value)}
                  placeholder="60000"
                />
                {errors.annualSalary && <p className="text-red-500 text-sm mt-1">{errors.annualSalary}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Monthly Salary (GHS) *</Label>
                <div className="relative">
                  <Input
                    type="number"
                    id="salary"
                    value={formData.salary}
                    onChange={(e) => handleInputChange("salary", e.target.value)}
                    placeholder="5000"
                    readOnly
                    className="bg-gray-50 pr-8"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <div className="w-4 h-4 text-green-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {formData.annualSalary
                    ? `Auto-calculated from annual salary (${formData.annualSalary} ÷ 12)`
                    : "Auto-calculated from annual salary"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Select value={formData.bankName} onValueChange={handleBankSelectionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {ghanaianBanks.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                    {customBanks.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                    <SelectItem value="add_new_bank" className="text-blue-600 font-medium">
                      + Add Custom Bank
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddBank(!showAddBank)}
                  className="w-full justify-center text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300 px-3 py-2 h-auto font-medium"
                >
                  {showAddBank ? "− Hide Custom Bank Form" : "+ Add Custom Bank"}
                </Button>

                {showAddBank && (
                  <div className="mt-2 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
                    <Label htmlFor="newBankName" className="text-sm font-medium">
                      Bank Name
                    </Label>
                    <Input
                      id="newBankName"
                      type="text"
                      placeholder="Enter bank name"
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && newBankName.trim()) {
                          e.preventDefault()
                          addCustomBank()
                        }
                      }}
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          addCustomBank()
                        }}
                        disabled={isAddingBank || !newBankName.trim()}
                        className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isAddingBank ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Adding...
                          </>
                        ) : (
                          "Add Bank"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddBank(false)
                          setNewBankName("")
                        }}
                        className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">This bank will be added to your company's bank list</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankBranch">Bank Branch</Label>
                <Input
                  type="text"
                  id="bankBranch"
                  value={formData.bankBranch || ""}
                  onChange={(e) => handleInputChange("bankBranch", e.target.value)}
                  placeholder="e.g. Accra Main"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccount">Bank Account Number</Label>
                <Input
                  type="text"
                  id="bankAccount"
                  value={formData.bankAccount}
                  onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                  placeholder="Account number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ssnit">SSNIT Number</Label>
                <Input
                  type="text"
                  id="ssnit"
                  value={formData.ssnit}
                  onChange={(e) => handleInputChange("ssnit", e.target.value)}
                  placeholder="GHA-123456789-0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ghanaCard">Ghana Card Number</Label>
                <Input
                  type="text"
                  id="ghanaCard"
                  value={formData.ghanaCard}
                  onChange={(e) => handleInputChange("ghanaCard", e.target.value)}
                  placeholder="GHA-123456789-0"
                />
              </div>
            </div>

            {/* Provident Fund / Tier 3 */}
            <div className="space-y-4 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Provident Fund</h3>
                <p className="text-sm text-muted-foreground">
                  Optional Tier 3 contribution used in PAYE/payroll computation (max 16.5% of basic).
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="providentFundEnrolled">Contribute to Provident Fund?</Label>
                  <Select
                    value={formData.providentFundEnrolled || "No"}
                    onValueChange={(value) => {
                      setFormData((prev: any) => ({
                        ...prev,
                        providentFundEnrolled: value,
                        providentFundRate: value === "No" ? "" : prev.providentFundRate || "",
                      }))
                    }}
                  >
                    <SelectTrigger id="providentFundEnrolled">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.providentFundEnrolled === "Yes" && (
                  <div className="space-y-2">
                    <Label htmlFor="providentFundRate">Employee PF Rate (%)</Label>
                    <Input
                      type="number"
                      id="providentFundRate"
                      min={0}
                      max={16.5}
                      step={0.1}
                      value={formData.providentFundRate || ""}
                      onChange={(e) => {
                        const raw = e.target.value
                        const n = Number(raw)
                        if (raw !== "" && Number.isFinite(n) && n > 16.5) {
                          handleInputChange("providentFundRate", "16.5")
                          return
                        }
                        handleInputChange("providentFundRate", raw)
                      }}
                      placeholder="e.g. 5"
                      className={errors.providentFundRate ? "border-red-500" : ""}
                    />
                    <p className="text-xs text-muted-foreground">Maximum allowed rate is 16.5%.</p>
                    {errors.providentFundRate && (
                      <p className="text-red-500 text-sm">{errors.providentFundRate}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Allowances Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Allowances</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllowanceSelector(!showAllowanceSelector)}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Allowance
                </Button>
              </div>

              {showAllowanceSelector && (
                <Card className="p-4 bg-emerald-50 border-emerald-200">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-emerald-900">Select Allowance Type</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {companyAllowances
                        .filter((allowance) => !selectedAllowances.find((a) => a.code === allowance.code))
                        .map((allowance) => (
                          <button
                            key={allowance.code}
                            type="button"
                            onClick={() => handleAddAllowance(allowance.code)}
                            className="flex items-center justify-between p-4 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-left"
                          >
                            <div>
                              <div className="font-medium text-sm text-emerald-900">{allowance.description}</div>
                              <div className="text-xs text-emerald-600">{allowance.code}</div>
                            </div>
                            <Plus className="w-4 h-4 text-emerald-600" />
                          </button>
                        ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllowanceSelector(false)}
                      className="w-full text-emerald-600 hover:text-emerald-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </Card>
              )}

              {selectedAllowances.length > 0 && (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-gray-700">
                    Selected Allowances ({selectedAllowances.length})
                  </div>
                  <div className="space-y-4">
                    {selectedAllowances.map((selectedAllowance) => {
                      const allowance = companyAllowances.find((a) => a.code === selectedAllowance.code)
                      return (
                        <Card key={selectedAllowance.code} className="p-4 border border-emerald-200">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-emerald-900">{allowance?.description}</h4>
                                <p className="text-sm text-emerald-600">{allowance?.code}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveAllowance(selectedAllowance.code)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Taxable/Non-taxable Toggle */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Tax Status</Label>
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleAllowanceChange(selectedAllowance.code, "taxable", true)}
                                    className={`px-3 py-2 text-sm rounded-md border ${
                                      selectedAllowance.taxable
                                        ? "bg-red-100 text-red-700 border-red-300"
                                        : "bg-gray-100 text-gray-700 border-gray-300"
                                    }`}
                                  >
                                    Taxable
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAllowanceChange(selectedAllowance.code, "taxable", false)}
                                    className={`px-3 py-2 text-sm rounded-md border ${
                                      !selectedAllowance.taxable
                                        ? "bg-green-100 text-green-700 border-green-300"
                                        : "bg-gray-100 text-gray-700 border-gray-300"
                                    }`}
                                  >
                                    Non-taxable
                                  </button>
                                </div>
                              </div>

                              {/* Recurring/Non-recurring Toggle */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Frequency</Label>
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleAllowanceChange(selectedAllowance.code, "recurring", true)}
                                    className={`px-3 py-2 text-sm rounded-md border ${
                                      selectedAllowance.recurring
                                        ? "bg-blue-100 text-blue-700 border-blue-300"
                                        : "bg-gray-100 text-gray-700 border-gray-300"
                                    }`}
                                  >
                                    Recurring
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAllowanceChange(selectedAllowance.code, "recurring", false)}
                                    className={`px-3 py-2 text-sm rounded-md border ${
                                      !selectedAllowance.recurring
                                        ? "bg-orange-100 text-orange-700 border-orange-300"
                                        : "bg-gray-100 text-gray-700 border-gray-300"
                                    }`}
                                  >
                                    One-time
                                  </button>
                                </div>
                              </div>

                              {/* Amount/Percentage Toggle */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Calculation Type</Label>
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAllowanceChange(selectedAllowance.code, "calculationType", "AMOUNT")
                                    }
                                    className={`px-3 py-2 text-sm rounded-md border ${
                                      selectedAllowance.calculationType === "AMOUNT"
                                        ? "bg-purple-100 text-purple-700 border-purple-300"
                                        : "bg-gray-100 text-gray-700 border-gray-300"
                                    }`}
                                  >
                                    Amount
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAllowanceChange(selectedAllowance.code, "calculationType", "PERCENTAGE")
                                    }
                                    className={`px-3 py-2 text-sm rounded-md border ${
                                      selectedAllowance.calculationType === "PERCENTAGE"
                                        ? "bg-purple-100 text-purple-700 border-purple-300"
                                        : "bg-gray-100 text-gray-700 border-gray-300"
                                    }`}
                                  >
                                    Percentage
                                  </button>
                                </div>
                              </div>

                              {/* Value Input */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  {selectedAllowance.calculationType === "AMOUNT" ? "Amount (GHS)" : "Percentage (%)"}
                                </Label>
                                <Input
                                  type="number"
                                  step={selectedAllowance.calculationType === "PERCENTAGE" ? "0.01" : "1"}
                                  value={
                                    selectedAllowance.calculationType === "AMOUNT"
                                      ? selectedAllowance.amount
                                      : selectedAllowance.percentage
                                  }
                                  onChange={(e) =>
                                    handleAllowanceChange(
                                      selectedAllowance.code,
                                      selectedAllowance.calculationType === "AMOUNT" ? "amount" : "percentage",
                                      e.target.value,
                                    )
                                  }
                                  placeholder={selectedAllowance.calculationType === "AMOUNT" ? "0" : "0.00"}
                                />
                              </div>

                              {/* Effective Date */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Effective Date</Label>
                                <Input
                                  type="date"
                                  value={selectedAllowance.effectiveDate}
                                  onChange={(e) =>
                                    handleAllowanceChange(selectedAllowance.code, "effectiveDate", e.target.value)
                                  }
                                />
                              </div>

                              {/* End Date (if not recurring) */}
                              {!selectedAllowance.recurring && (
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">End Date</Label>
                                  <Input
                                    type="date"
                                    value={selectedAllowance.endDate || ""}
                                    onChange={(e) =>
                                      handleAllowanceChange(selectedAllowance.code, "endDate", e.target.value)
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {selectedAllowances.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm">No allowances added yet</p>
                  <p className="text-xs text-gray-400">Click "Add Allowance" to get started</p>
                </div>
              )}
            </div>

            {/* Enhanced Deductions Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Deductions</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeductionSelector(!showDeductionSelector)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Deduction
                </Button>
              </div>

              {showDeductionSelector && (
                <Card className="p-4 bg-red-50 border-red-200">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-red-900">Select Deduction Type</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {companyDeductions
                        .filter((deduction) => !selectedDeductions.find((d) => d.code === deduction.code))
                        .map((deduction) => (
                          <button
                            key={deduction.code}
                            type="button"
                            onClick={() => handleAddDeduction(deduction.code)}
                            className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors text-left"
                          >
                            <div>
                              <div className="font-medium text-sm text-red-900">{deduction.description}</div>
                              <div className="text-xs text-red-600">{deduction.code}</div>
                            </div>
                            <Plus className="w-4 h-4 text-red-600" />
                          </button>
                        ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeductionSelector(false)}
                      className="w-full text-red-600 hover:text-red-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </Card>
              )}

              {selectedDeductions.length > 0 && (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-gray-700">
                    Selected Deductions ({selectedDeductions.length})
                  </div>
                  <div className="space-y-4">
                    {selectedDeductions.map((selectedDeduction) => {
                      const deduction = companyDeductions.find((d) => d.code === selectedDeduction.code)
                      return (
                        <Card key={selectedDeduction.code} className="p-4 border border-red-200">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-red-900">{deduction?.description}</h4>
                                <p className="text-sm text-red-600">{deduction?.code}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveDeduction(selectedDeduction.code)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Taxable/Non-taxable Toggle */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Tax Status</Label>
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDeductionChange(selectedDeduction.code, "taxable", true)}
                                    className={`px-3 py-2 text-sm rounded-md border ${
                                      selectedDeduction.taxable
                                        ? "bg-red-100 text-red-700 border-red-300"
                                        : "bg-gray-100 text-gray-700 border-gray-300"
                                    }`}
                                  >
                                    Taxable
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeductionChange(selectedDeduction.code, "taxable", false)}
                                    className={`px-3 py-2 text-sm rounded-md border ${
                                      !selectedDeduction.taxable
                                        ? "bg-green-100 text-green-700 border-green-300"
                                        : "bg-gray-100 text-gray-700 border-gray-300"
                                    }`}
                                  >
                                    Non-taxable
                                  </button>
                                </div>
                              </div>

                              {/* Recurring/Non-recurring Toggle */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Frequency</Label>
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDeductionChange(selectedDeduction.code, "recurring", true)}
                                    className={`px-3 py-2 text-sm rounded-md border ${
                                      selectedDeduction.recurring
                                        ? "bg-blue-100 text-blue-700 border-blue-300"
                                        : "bg-gray-100 text-gray-700 border-gray-300"
                                    }`}
                                  >
                                    Recurring
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeductionChange(selectedDeduction.code, "recurring", false)}
                                    className={`px-3 py-2 text-sm rounded-md border ${
                                      !selectedDeduction.recurring
                                        ? "bg-orange-100 text-orange-700 border-orange-300"
                                        : "bg-gray-100 text-gray-700 border-gray-300"
                                    }`}
                                  >
                                    One-time
                                  </button>
                                </div>
                              </div>

                              {/* Amount/Percentage Toggle */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Calculation Type</Label>
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeductionChange(selectedDeduction.code, "calculationType", "AMOUNT")
                                    }
                                    className={`px-3 py-2 text-sm rounded-md border ${
                                      selectedDeduction.calculationType === "AMOUNT"
                                        ? "bg-purple-100 text-purple-700 border-purple-300"
                                        : "bg-gray-100 text-gray-700 border-gray-300"
                                    }`}
                                  >
                                    Amount
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeductionChange(selectedDeduction.code, "calculationType", "PERCENTAGE")
                                    }
                                    className={`px-3 py-2 text-sm rounded-md border ${
                                      selectedDeduction.calculationType === "PERCENTAGE"
                                        ? "bg-purple-100 text-purple-700 border-purple-300"
                                        : "bg-gray-100 text-gray-700 border-gray-300"
                                    }`}
                                  >
                                    Percentage
                                  </button>
                                </div>
                              </div>

                              {/* Value Input */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  {selectedDeduction.calculationType === "AMOUNT" ? "Amount (GHS)" : "Percentage (%)"}
                                </Label>
                                <Input
                                  type="number"
                                  step={selectedDeduction.calculationType === "PERCENTAGE" ? "0.01" : "1"}
                                  value={
                                    selectedDeduction.calculationType === "AMOUNT"
                                      ? selectedDeduction.amount
                                      : selectedDeduction.percentage
                                  }
                                  onChange={(e) =>
                                    handleDeductionChange(
                                      selectedDeduction.code,
                                      selectedDeduction.calculationType === "AMOUNT" ? "amount" : "percentage",
                                      e.target.value,
                                    )
                                  }
                                  placeholder={selectedDeduction.calculationType === "AMOUNT" ? "0" : "0.00"}
                                />
                              </div>

                              {/* Effective Date */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Effective Date</Label>
                                <Input
                                  type="date"
                                  value={selectedDeduction.effectiveDate}
                                  onChange={(e) =>
                                    handleDeductionChange(selectedDeduction.code, "effectiveDate", e.target.value)
                                  }
                                />
                              </div>

                              {/* End Date (if not recurring) */}
                              {!selectedDeduction.recurring && (
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">End Date</Label>
                                  <Input
                                    type="date"
                                    value={selectedDeduction.endDate || ""}
                                    onChange={(e) =>
                                      handleDeductionChange(selectedDeduction.code, "endDate", e.target.value)
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {selectedDeductions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm">No deductions added yet</p>
                  <p className="text-xs text-gray-400">Click "Add Deduction" to get started</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="documents" className="space-y-6 max-w-none">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Required Documents</h3>
              <div className="text-sm text-gray-500">
                {uploadedDocuments.length} of {requiredDocuments.length} documents uploaded
              </div>
            </div>

            <div className="space-y-6">
              {requiredDocuments.map((doc) => {
                const uploadedDoc = uploadedDocuments.find((d) => d.documentType === doc.id)
                const isUploaded = !!uploadedDoc
                const isUploading = uploadingDocuments.includes(doc.id)

                return (
                  <Card
                    key={doc.id}
                    className={`p-6 border-2 transition-all ${
                      isUploaded
                        ? "border-green-200 bg-green-50 shadow-sm"
                        : isUploading
                          ? "border-blue-200 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isUploaded
                                ? "bg-green-100 text-green-600"
                                : isUploading
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {isUploaded ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : isUploading ? (
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FileText className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{doc.title}</h4>
                            <p className="text-sm text-gray-600">{doc.description}</p>
                            {isUploaded && uploadedDoc && (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-green-700 border-green-300 bg-green-50 text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {uploadedDoc.fileName}
                                </Badge>
                                <span className="text-xs text-gray-500">{formatFileSize(uploadedDoc.fileSize)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDocument(doc.id)}
                                  className="text-red-500 hover:text-red-700 text-xs hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {isUploaded ? (
                          <div className="flex items-center space-x-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewDocument(uploadedDoc!)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 min-w-[80px]"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleReplaceDocument(doc.id)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 min-w-[90px]"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Replace
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            {/* Hidden file input for desktop */}
                            <input
                              ref={(el) => {
                                if (el) {
                                  fileInputRefs.current[doc.id] = el
                                }
                              }}
                              type="file"
                              accept={doc.acceptTypes}
                              onChange={(e) => handleFileSelect(doc.id, e)}
                              className="hidden md:block"
                              id={`file-input-${doc.id}`}
                              style={{ position: "absolute", left: "-9999px", opacity: 0 }}
                            />

                            {/* Mobile file input - visible but styled */}
                            <input
                              type="file"
                              accept={doc.acceptTypes}
                              onChange={(e) => handleFileSelect(doc.id, e)}
                              className="block md:hidden w-full min-h-[44px] text-sm text-blue-600 border border-blue-300 rounded-md bg-white hover:bg-blue-50 active:bg-blue-100 file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              id={`mobile-file-input-${doc.id}`}
                            />

                            {/* Desktop button */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log("[v0] Desktop upload button clicked for:", doc.id)

                                // Try the hidden input first
                                const hiddenInput = document.getElementById(`file-input-${doc.id}`) as HTMLInputElement
                                if (hiddenInput) {
                                  console.log("[v0] Using hidden input for:", doc.id)
                                  hiddenInput.value = ""
                                  hiddenInput.click()
                                } else {
                                  console.log("[v0] Using handleUploadClick for:", doc.id)
                                  // Fallback to dynamic creation
                                  handleUploadClick(doc.id)
                                }
                              }}
                              onTouchEnd={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log("[v0] Desktop upload button touch end for:", doc.id)

                                // Try the hidden input first
                                const hiddenInput = document.getElementById(`file-input-${doc.id}`) as HTMLInputElement
                                if (hiddenInput) {
                                  console.log("[v0] Using hidden input (touch) for:", doc.id)
                                  hiddenInput.value = ""
                                  hiddenInput.click()
                                } else {
                                  console.log("[v0] Using handleUploadClick (touch) for:", doc.id)
                                  // Fallback to dynamic creation
                                  handleUploadClick(doc.id)
                                }
                              }}
                              disabled={isUploading}
                              className="hidden md:flex text-blue-600 hover:text-blue-700 hover:bg-blue-50 active:bg-blue-100 touch-manipulation min-h-[44px] min-w-[140px] text-sm font-medium border-2 hover:border-blue-400"
                            >
                              {isUploading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Choose File
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Upload progress and document confirmation - shown for all devices */}
                    {isUploading && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Uploading...</span>
                          <span>{uploadProgress[doc.id] || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress[doc.id] || 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Show uploaded document info - enhanced for full-screen desktop visibility */}
                    {isUploaded && uploadedDoc && (
                      <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg shadow-sm">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-green-900 truncate">✓ {uploadedDoc.fileName}</p>
                            <p className="text-xs text-green-700 mt-1">
                              {(uploadedDoc.fileSize / 1024 / 1024).toFixed(2)} MB • Uploaded on{" "}
                              {uploadedDoc.uploadDate.toLocaleDateString()}
                            </p>
                            <div className="mt-2 flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handlePreviewDocument(uploadedDoc)}
                                className="text-green-700 border-green-300 hover:bg-green-100 text-xs h-7"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Preview
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleReplaceDocument(doc.id)}
                                className="text-orange-700 border-orange-300 hover:bg-orange-100 text-xs h-7"
                              >
                                <Upload className="w-3 h-3 mr-1" />
                                Replace
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveDocument(doc.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>

            {uploadedDocuments.length > 0 && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900">Documents Ready for Review</h4>
                    <p className="text-sm text-blue-700">
                      {uploadedDocuments.length} document{uploadedDocuments.length !== 1 ? "s" : ""} uploaded
                      successfully. All documents will be saved to the document vault and labeled with the employee's
                      name.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        {currentTab !== "personal" && (
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="border-gray-300 hover:bg-gray-50 bg-transparent"
          >
            Previous
          </Button>
        )}
        {currentTab !== "documents" ? (
          <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white">
            Next
          </Button>
        ) : (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} className="border-gray-300 hover:bg-gray-50 bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Submit
            </Button>
          </div>
        )}
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {previewDocument && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  {(previewDocument.fileType || "").startsWith("image/") ? (
                    <img
                      src={previewDocument.fileUrl || "/placeholder.svg"}
                      alt={previewDocument.fileName}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{previewDocument.fileName}</h3>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <span>{formatFileSize(previewDocument.fileSize)}</span>
                    <span>{previewDocument.fileType}</span>
                    <span>{new Date(previewDocument.uploadDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {(previewDocument.fileType || "").startsWith("image/") && previewDocument.fileUrl ? (
                <div className="border rounded-lg p-4 bg-slate-50">
                  <img
                    src={previewDocument.fileUrl}
                    alt={previewDocument.fileName}
                    className="max-w-full max-h-[60vh] h-auto rounded mx-auto"
                  />
                </div>
              ) : (previewDocument.fileType || "").includes("pdf") && previewDocument.fileUrl ? (
                <div className="border rounded-lg overflow-hidden bg-slate-50">
                  <iframe
                    title={previewDocument.fileName}
                    src={previewDocument.fileUrl}
                    className="w-full h-[60vh]"
                  />
                </div>
              ) : previewDocument.fileUrl ? (
                <div className="rounded-lg border bg-slate-50 p-4 text-sm text-muted-foreground">
                  Preview is not available for this file type. Use Download to open{" "}
                  <span className="font-medium text-foreground">{previewDocument.fileName}</span>.
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  No stored file URL was found for this attachment.
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    if (!previewDocument.fileUrl) {
                      toast({
                        title: "Download unavailable",
                        description: "No file URL is stored for this document.",
                        variant: "destructive",
                      })
                      return
                    }
                    const a = document.createElement("a")
                    a.href = previewDocument.fileUrl
                    a.download = previewDocument.fileName || "document"
                    a.target = "_blank"
                    a.rel = "noopener noreferrer"
                    a.click()
                    toast({
                      title: "Download Started",
                      description: `${previewDocument.fileName} is opening.`,
                    })
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
