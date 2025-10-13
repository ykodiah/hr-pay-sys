"use client"

import { DialogDescription } from "@/components/ui/dialog"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useCurrency } from "@/lib/currency-context"
import { Plus, Search, Filter, Download, Upload, MoreHorizontal, Edit, Trash2, Eye, Mail } from "lucide-react"

import { CentralDocumentService } from "@/lib/storage/centralDocumentService"
import { useToast } from "@/hooks/use-toast"
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

const MAIN_COMPANY_ID = "f44f079e-1779-446d-9194-199994111111"

export default function EmployeesPage() {
  const { currencySymbol, formatAmount } = useCurrency()

  const [employees, setEmployees] = useState<any[]>([])
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
  // </CHANGE>

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
    bankAccount: "",
    ghanaCard: "",
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
  // const [isAddDialogOpen, setIsAddDialogOpen] = useState(false) // Redeclared, removed
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

  // Document upload functions
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

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

      // Create uploaded document object
      const uploadedDoc = {
        id: `doc-${Date.now()}`,
        documentType,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadDate: new Date(),
        uploadedBy: "HR Admin",
        fileUrl: URL.createObjectURL(file), // Create preview URL
      }

      setUploadedDocuments((prev) => {
        const filtered = prev.filter((doc: any) => doc.documentType !== documentType)
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
      setUploadProgress((prev) => {
        const newProgress = { ...prev }
        delete newProgress[documentType]
        return newProgress
      })
    }
  }

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

  const handleRemoveDocument = (documentType: string) => {
    setUploadedDocuments((prev) => prev.filter((doc: any) => doc.documentType !== documentType))
    toast({
      title: "Document Removed",
      description: "Document has been removed successfully",
    })
  }

  const handleReplaceDocument = (documentType: string) => {
    const fileInput = fileInputRefs.current[documentType]
    if (fileInput) {
      fileInput.click()
    } else {
      handleUploadClick(documentType)
    }
  }

  const handlePreviewDocument = (document: any) => {
    setPreviewDocument(document)
    setIsPreviewOpen(true)
  }

  // Removed duplicate formatFileSize function

  const loadParentCompanyData = useCallback(() => {
    console.log("[v0] Loading parent company data...")

    if (companySettings) {
      const companyDivisions = Array.isArray(companySettings.divisions)
        ? companySettings.divisions
        : companySettings.divisions
          ? JSON.parse(companySettings.divisions)
          : ["Head Office", "Regional Office"]

      const companyDepartments = Array.isArray(companySettings.departments)
        ? companySettings.departments
        : companySettings.departments
          ? JSON.parse(companySettings.departments)
          : ["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"]

      const companyLocations = Array.isArray(companySettings.locations)
        ? companySettings.locations
        : companySettings.locations
          ? JSON.parse(companySettings.locations)
          : ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"]

      setDivisions(companyDivisions)
      setDepartments(companyDepartments)
      setLocations(companyLocations)

      console.log("[v0] Parent company data loaded:", {
        divisions: companyDivisions,
        departments: companyDepartments,
        locations: companyLocations,
      })
    } else {
      console.log("[v0] No company settings available, using defaults")
      setDivisions(["Head Office", "Regional Office"])
      setDepartments(["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"])
      setLocations(["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"])
    }
  }, [companySettings])

  const loadSubsidiaries = async () => {
    try {
      if (isDemoMode()) {
        console.log("[v0] Demo mode: Using mock subsidiaries")
        setSubsidiaries(mockSubsidiaries)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase.from("subsidiaries").select("*").eq("status", "active")

      if (error) {
        console.error("Error loading subsidiaries:", error)
        toast({
          title: "Error",
          description: "Failed to load subsidiaries from database.",
          variant: "destructive",
        })
        return
      }

      setSubsidiaries(data || [])
    } catch (error) {
      console.error("Error loading subsidiaries:", error)
      toast({
        title: "Error",
        description: "Failed to load subsidiaries. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadEmployees()
    loadSubsidiaries()
    loadCompanyData()
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

  const generateEmployeeId = useCallback(() => {
    // Get company name initials
    const companyName = companySettings?.name || "AKHR"
    let letterPart = ""

    if (formData.hasSubsidiary === "Yes" && formData.subsidiary) {
      // Get subsidiary name
      const selectedSubsidiary = subsidiaries.find((s) => s.id === formData.subsidiary)
      if (selectedSubsidiary) {
        // First 2 initials of parent company
        const companyInitials = companyName
          .split(" ")
          .map((word) => word[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)

        // First 2 initials of subsidiary
        const subsidiaryInitials = selectedSubsidiary.name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)

        letterPart = (companyInitials + subsidiaryInitials).slice(0, 4).padEnd(4, "X")
      } else {
        // Fallback to company initials
        letterPart = companyName
          .split(" ")
          .map((word) => word[0])
          .join("")
          .toUpperCase()
          .slice(0, 4)
          .padEnd(4, "X")
      }
    } else {
      // Use first 4 initials of parent company
      letterPart = companyName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 4)
        .padEnd(4, "X")
    }

    // Generate sequential 4-digit number based on existing employees
    const numberPart = String(employees.length + 1).padStart(4, "0")

    return `${letterPart}${numberPart}`
  }, [companySettings, formData.hasSubsidiary, formData.subsidiary, subsidiaries, employees.length])

  useEffect(() => {
    const newEmployeeId = generateEmployeeId()
    console.log("[v0] Generating Employee ID:", {
      hasSubsidiary: formData.hasSubsidiary,
      subsidiary: formData.subsidiary,
      newEmployeeId,
    })
    setFormData((prev: any) => ({
      ...prev,
      employeeId: newEmployeeId,
    }))
  }, [formData.hasSubsidiary, formData.subsidiary, generateEmployeeId])
  // </CHANGE>

  const loadCompanyData = async () => {
    try {
      console.log("[v0] Loading company data...")
      const supabase = createClient()

      // Load company settings
      const { data, error } = await supabase.from("companies").select("*").eq("id", MAIN_COMPANY_ID).maybeSingle()

      if (error) {
        console.error("[v0] Error loading company data:", error)
      } else if (data) {
        setCompanySettings(data)
        console.log("[v0] Company data loaded:", data)

        const companyDivisions = Array.isArray(data.divisions)
          ? data.divisions
          : data.divisions
            ? JSON.parse(data.divisions)
            : ["Head Office", "Regional Office"]

        const companyDepartments = Array.isArray(data.departments)
          ? data.departments
          : data.departments
            ? JSON.parse(data.departments)
            : ["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"]

        const companyLocations = Array.isArray(data.locations)
          ? data.locations
          : data.locations
            ? JSON.parse(data.locations)
            : ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"]

        setDivisions(companyDivisions)
        setDepartments(companyDepartments)
        setLocations(companyLocations)

        console.log("[v0] Set company divisions:", companyDivisions)
        console.log("[v0] Set company departments:", companyDepartments)
        console.log("[v0] Set company locations:", companyLocations)
      } else {
        console.log("[v0] No company data found, using default values")
        setDivisions(["Head Office", "Regional Office"])
        setDepartments(["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"])
        setLocations(["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"])
      }
    } catch (error) {
      console.error("[v0] Error in loadCompanyData:", error)
    }
  }

  useEffect(() => {
    console.log("[v0] Subsidiary selection changed:", {
      hasSubsidiary: formData.hasSubsidiary,
      subsidiary: formData.subsidiary,
    })

    // If "Yes" is selected and a subsidiary is chosen, load subsidiary data
    if (formData.hasSubsidiary === "Yes" && formData.subsidiary) {
      const selectedSubsidiary = subsidiaries.find((s) => s.id === formData.subsidiary)
      if (selectedSubsidiary) {
        console.log("[v0] Loading subsidiary data:", selectedSubsidiary.name)

        const subDivisions = Array.isArray(selectedSubsidiary.divisions)
          ? selectedSubsidiary.divisions
          : selectedSubsidiary.divisions
            ? JSON.parse(selectedSubsidiary.divisions)
            : []

        const subDepartments = Array.isArray(selectedSubsidiary.departments)
          ? selectedSubsidiary.departments
          : selectedSubsidiary.departments
            ? JSON.parse(selectedSubsidiary.departments)
            : []

        const subLocations = Array.isArray(selectedSubsidiary.locations)
          ? selectedSubsidiary.locations
          : selectedSubsidiary.locations
            ? JSON.parse(selectedSubsidiary.locations)
            : []

        setDivisions(subDivisions)
        setDepartments(subDepartments)
        setLocations(subLocations)

        console.log("[v0] Set subsidiary divisions:", subDivisions)
        console.log("[v0] Set subsidiary departments:", subDepartments)
        console.log("[v0] Set subsidiary locations:", subLocations)
      }
    }
    // If "No" is selected or no subsidiary is chosen, load parent company data
    else if (companySettings) {
      console.log("[v0] Loading parent company data (no subsidiary selected)")

      const companyDivisions = Array.isArray(companySettings.divisions)
        ? companySettings.divisions
        : companySettings.divisions
          ? JSON.parse(companySettings.divisions)
          : ["Head Office", "Regional Office"]

      const companyDepartments = Array.isArray(companySettings.departments)
        ? companySettings.departments
        : companySettings.departments
          ? JSON.parse(companySettings.departments)
          : ["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"]

      const companyLocations = Array.isArray(companySettings.locations)
        ? companySettings.locations
        : companySettings.locations
          ? JSON.parse(companySettings.locations)
          : ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"]

      setDivisions(companyDivisions)
      setDepartments(companyDepartments)
      setLocations(companyLocations)

      console.log("[v0] Set company divisions:", companyDivisions)
      console.log("[v0] Set company departments:", companyDepartments)
      console.log("[v0] Set company locations:", companyLocations)
    }
  }, [formData.hasSubsidiary, formData.subsidiary, subsidiaries, companySettings])
  // </CHANGE>

  // Load supervisors and heads of department based on department selection
  useEffect(() => {
    const loadSupervisorsAndHeads = () => {
      console.log("[v0] Loading supervisors and heads for department:", formData.department)

      // Filter employees based on department and special roles
      const departmentEmployees = employees.filter(
        (emp) => emp.department === formData.department && emp.status === "Active",
      )

      // Get employees with "Direct Supervisor" special role
      const supervisorsList = departmentEmployees.filter((emp) => emp.specialRole === "Direct Supervisor")

      // Get employees with "Head of Department" special role
      const headsList = departmentEmployees.filter((emp) => emp.specialRole === "Head of Department")

      // If no specific roles found, show all department employees as options
      const finalSupervisors = supervisorsList.length > 0 ? supervisorsList : departmentEmployees
      const finalHeads = headsList.length > 0 ? headsList : departmentEmployees

      setSupervisors(finalSupervisors)
      setHeadsOfDepartment(finalHeads)

      console.log("[v0] Loaded supervisors:", finalSupervisors.length)
      console.log("[v0] Loaded heads of department:", finalHeads.length)

      // Show "No data" message if no employees found
      if (departmentEmployees.length === 0) {
        console.log("[v0] No employees found for department:", formData.department)
        setSupervisors([])
        setHeadsOfDepartment([])
      }
    }

    if (formData.department && employees.length > 0) {
      loadSupervisorsAndHeads()
    }
  }, [formData.department, employees])

  // Removed the duplicate loadParentCompanyData function. The useCallback version above is used.

  const loadEmployees = async () => {
    try {
      console.log("[v0] Loading employees from database...")

      if (isDemoMode()) {
        console.log("[v0] Demo mode: Using mock employees")
        setEmployees(mockEmployees)
        setIsLoading(false)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("employees")
        .select(
          `
          *,
          subsidiaries (
            name,
            id
          )
        `,
        )
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading employees:", error)
        toast({
          title: "Error",
          description: "Failed to load employees from database.",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Loaded employees:", data?.length || 0)
      setEmployees(data || [])
    } catch (error) {
      console.error("Error loading employees:", error)
      toast({
        title: "Error",
        description: "Failed to load employees from database.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEmployee = async (employeeData: any) => {
    try {
      console.log("[v0] Adding employee:", employeeData)

      if (isDemoMode()) {
        console.log("[v0] Demo mode: Simulating employee creation")
        const newEmployee = {
          id: String(mockEmployees.length + 1),
          employee_id: `AKHR${String(mockEmployees.length + 1).padStart(4, "0")}`,
          first_name: employeeData.firstName,
          last_name: employeeData.lastName,
          full_name: `${employeeData.firstName} ${employeeData.lastName}`,
          display_name: `${employeeData.firstName} ${employeeData.lastName}`,
          personal_email: employeeData.personalEmail,
          corporate_email: employeeData.corporateEmail,
          phone: employeeData.phone,
          position: employeeData.position,
          department: employeeData.department,
          location: employeeData.location,
          status: "Active",
          date_of_joining: employeeData.dateOfJoining,
          contract_type: employeeData.contractType || "Permanent",
          subsidiaries: { name: "Demo Office", id: "1" },
          created_at: new Date().toISOString(),
        }

        mockEmployees.push(newEmployee)
        setEmployees([...mockEmployees])
        setShowAddEmployee(false)

        toast({
          title: "Success",
          description: "Employee added successfully (Demo Mode)",
        })
        return
      }

      const supabase = createClient()

      // Generate employee ID
      const companyName = "Akwaaba Technologies Ltd" // This should come from company settings
      const subsidiary = subsidiaries.find((s) => s.id === employeeData.subsidiary_id)

      let employeeId = ""
      if (subsidiary) {
        const companyInitials = companyName
          .split(" ")
          .slice(0, 2)
          .map((word) => word.substring(0, 2))
          .join("")
          .toUpperCase()
        const subsidiaryInitials = subsidiary.name
          .split(" ")
          .slice(0, 2)
          .map((word) => word.substring(0, 2))
          .join("")
          .toUpperCase()
        const sequence = String(employees.length + 1).padStart(4, "0")
        employeeId = `${companyInitials}${subsidiaryInitials}${sequence}`
      } else {
        const companyInitials = companyName
          .split(" ")
          .slice(0, 4)
          .map((word) => word.substring(0, 1))
          .join("")
          .toUpperCase()
        const sequence = String(employees.length + 1).padStart(4, "0")
        employeeId = `${companyInitials}${sequence}`
      }

      const employeeRecord = {
        employee_id: employeeId,
        prefix: employeeData.prefix || null,
        first_name: employeeData.firstName,
        other_names: employeeData.otherNames || null,
        last_name: employeeData.lastName,
        full_name: employeeData.fullName,
        display_name: employeeData.displayName,
        marital_status: employeeData.maritalStatus || null,
        gender: employeeData.gender || null,
        personal_email: employeeData.personalEmail,
        corporate_email: employeeData.corporateEmail || null,
        phone: employeeData.phone,
        date_of_birth: employeeData.dateOfBirth || null,
        address: employeeData.address || null,
        educational_level: employeeData.educationalLevel || null,
        emergency_contact_name: employeeData.emergencyContactName || null,
        emergency_contact_tel: employeeData.emergencyContactTel || null,
        position: employeeData.position,
        special_role: employeeData.specialRole || null,
        subsidiary_id: employeeData.subsidiary || null,
        division: employeeData.division || null,
        department: employeeData.department,
        location: employeeData.location,
        contract_type: employeeData.contractType || "Permanent",
        date_of_joining: employeeData.dateOfJoining || null,
        date_of_exit: employeeData.dateOfExit || null,
        status: employeeData.status || "Active",
        inactive_reason: employeeData.inactiveReason || null, // Added inactive_reason
        probation_period: employeeData.probationPeriod ? Number.parseInt(employeeData.probationPeriod) : null,
        confirmation_date: employeeData.confirmationDate || null,
        notice_period: employeeData.noticePeriod || null,
        direct_supervisor: employeeData.directSupervisor || null,
        head_of_department: employeeData.headOfDepartment || null,
        ghana_card_number: employeeData.ghanaCard || null,
        profile_picture: employeeData.profilePicture || null,
        // company_id: "00000000-0000-0000-0000-000000000001", // Main company ID (This might need to be dynamic based on logged in user's company)
        company_id: MAIN_COMPANY_ID, // Use the constant defined earlier
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Insert employee record
      const { data: employeeResult, error: employeeError } = await supabase
        .from("employees")
        .insert([employeeRecord])
        .select()
        .single()

      if (employeeError) {
        console.error("Error adding employee:", employeeError)
        toast({
          title: "Error",
          description: "Failed to add employee to database.",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Employee added successfully:", employeeResult)

      const financialRecord = {
        employee_id: employeeResult.id,
        annual_salary: employeeData.annualSalary ? Number.parseFloat(employeeData.annualSalary) : null,
        monthly_salary: employeeData.salary ? Number.parseFloat(employeeData.salary) : null,
        transport_allowance: employeeData.transportAllowance
          ? Number.parseFloat(employeeData.transportAllowance)
          : null,
        housing_allowance: employeeData.housingAllowance ? Number.parseFloat(employeeData.housingAllowance) : null,
        medical_allowance: employeeData.medicalAllowance ? Number.parseFloat(employeeData.medicalAllowance) : null,
        meal_allowance: employeeData.mealAllowance ? Number.parseFloat(employeeData.mealAllowance) : null,
        uniform_allowance: employeeData.uniformAllowance ? Number.parseFloat(employeeData.uniformAllowance) : null,
        communication_allowance: employeeData.communicationAllowance
          ? Number.parseFloat(employeeData.communicationAllowance)
          : null,
        other_allowances: employeeData.otherAllowances ? Number.parseFloat(employeeData.otherAllowances) : null,
        tax_deduction: employeeData.taxDeduction ? Number.parseFloat(employeeData.taxDeduction) : null,
        ssnit_number: employeeData.ssnit || null,
        tier3_contribution: employeeData.tier3 ? Number.parseFloat(employeeData.tier3) : null,
        loan_deduction: employeeData.loanDeduction ? Number.parseFloat(employeeData.loanDeduction) : null,
        advance_deduction: employeeData.advanceDeduction ? Number.parseFloat(employeeData.advanceDeduction) : null,
        other_deductions: employeeData.otherDeductions ? Number.parseFloat(employeeData.otherDeductions) : null,
        bank_name: employeeData.bankName || null,
        bank_account_number: employeeData.bankAccount || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: financialError } = await supabase.from("employee_financial").insert([financialRecord])

      if (financialError) {
        console.error("Error adding financial data:", financialError)
        // Don't fail the entire operation, just log the error
      }

      if (employeeData.documents && employeeData.documents.length > 0) {
        const documentRecords = employeeData.documents.map((doc: any) => ({
          employee_id: employeeResult.id,
          document_type: doc.type,
          document_name: doc.name,
          file_path: doc.path || null,
          file_size: doc.size || null,
          upload_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        const { error: documentsError } = await supabase.from("employee_documents").insert(documentRecords)

        if (documentsError) {
          console.error("Error adding documents:", documentsError)
          // Don't fail the entire operation, just log the error
        }
      }

      // Immediately update local state
      setEmployees((prev) => [employeeResult, ...prev])

      toast({
        title: "Success",
        description: `Employee ${employeeData.displayName} has been added successfully!`,
      })

      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding employee:", error)
      toast({
        title: "Error",
        description: "Failed to add employee. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditEmployee = async (employeeData: any) => {
    try {
      if (isDemoMode()) {
        console.log("[v0] Demo mode: Simulating employee update")
        const updatedEmployees = mockEmployees.map((emp) =>
          emp.id === selectedEmployee.id
            ? { ...emp, ...employeeData, full_name: `${employeeData.firstName} ${employeeData.lastName}` }
            : emp,
        )
        setEmployees(updatedEmployees)
        setShowEditDialog(false)
        setSelectedEmployee(null)

        toast({
          title: "Success",
          description: "Employee updated successfully (Demo Mode)",
        })
        return
      }

      const supabase = createClient()

      const updatedEmployee = {
        prefix: employeeData.prefix,
        first_name: employeeData.firstName,
        other_names: employeeData.otherNames,
        last_name: employeeData.lastName,
        display_name: employeeData.displayName,
        personal_email: employeeData.personalEmail,
        corporate_email: employeeData.corporateEmail,
        phone_number: employeeData.phone, // Ensure this matches your schema
        address: employeeData.address,
        date_of_birth: employeeData.dateOfBirth || null,
        gender: employeeData.gender,
        marital_status: employeeData.maritalStatus,
        educational_level: employeeData.educationalLevel,
        emergency_contact_name: employeeData.emergencyContactName,
        emergency_contact_tel: employeeData.emergencyContactTel,
        department: employeeData.department,
        position: employeeData.position,
        special_role: employeeData.specialRole, // Update special role
        subsidiary_id: employeeData.subsidiary, // Update subsidiary
        has_subsidiary: employeeData.hasSubsidiary, // Update hasSubsidiary
        division: employeeData.division,
        location: employeeData.location,
        contract_type: employeeData.contractType,
        date_of_joining: employeeData.dateOfJoining || null,
        date_of_exit: employeeData.dateOfExit || null,
        status: employeeData.status || "Active",
        inactive_reason: employeeData.inactiveReason || null, // Update inactive reason
        probation_period: employeeData.probationPeriod ? Number.parseInt(employeeData.probationPeriod) : null,
        confirmation_date: employeeData.confirmationDate || null,
        notice_period: employeeData.noticePeriod || null,
        direct_supervisor: employeeData.directSupervisor,
        head_of_department: employeeData.headOfDepartment,
        ghana_card_number: employeeData.ghanaCard || null,
        salary: Number.parseFloat(employeeData.salary) || 0, // Ensure this is handled correctly
        // ... include other fields as needed
      }

      const { error } = await supabase.from("employees").update(updatedEmployee).eq("id", selectedEmployee.id)

      if (error) {
        console.error("Error updating employee:", error)
        toast({
          title: "Error",
          description: "Failed to update employee in database.",
          variant: "destructive",
        })
        return
      }

      // Reload employees from database
      await loadEmployees()

      setIsEditDialogOpen(false)
      toast({
        title: "Employee Updated Successfully",
        description: `${employeeData.displayName} has been successfully updated.`,
      })
    } catch (error) {
      console.error("Error updating employee:", error)
      toast({
        title: "Error",
        description: "Failed to update employee in database.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEmployee = (employeeId: number) => {
    setEmployees(employees.filter((emp) => emp.id !== employeeId))
    toast({
      title: "Employee Removed",
      description: "Employee has been successfully removed from the system.",
      variant: "destructive",
    })
  }

  const handleImportEmployees = (importedData: any[]) => {
    const newEmployees = importedData.map((data, index) => ({
      ...data,
      id: employees.length + index + 1,
      employeeId: data.employeeId || `EMP${String(employees.length + index + 1).padStart(3, "0")}`,
      leaveBalance: { annual: 21, sick: 10, casual: 5 },
      documents: [],
      avatar: "/placeholder.svg?height=40&width=40",
    }))

    setEmployees([...employees, ...newEmployees])
    setIsImportDialogOpen(false)

    toast({
      title: "Import Successful",
      description: `${importedData.length} employees have been imported successfully.`,
    })
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
      employee.display_name?.toLowerCase().includes(searchLower) ||
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
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
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
                employees={employees}
                selectedEmployee={selectedEmployee}
                companySettings={companySettings}
                supervisors={supervisors}
                headsOfDepartment={headsOfDepartment}
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
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.display_name}`}
                            />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700">
                              {employee.display_name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{employee.display_name}</h3>
                            <p className="text-gray-600">{employee.position}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500">{employee.department}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">ID: {employee.employeeId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Monthly Salary</p>
                            <p className="text-sm font-medium">{formatAmount(employee.salary || 0)}</p>
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
                                onClick={() => {
                                  setSelectedEmployee(employee)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEmployee(employee)
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
              employees={employees}
              selectedEmployee={selectedEmployee}
              companySettings={companySettings}
              supervisors={supervisors}
              headsOfDepartment={headsOfDepartment}
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
      processFile(file)
      console.log("[v0] CSV file selected:", file.name)
    }
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

      onImport(allData)
    }
    reader.readAsText(selectedFile)
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
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
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
                employees={employees}
                selectedEmployee={selectedEmployee}
                companySettings={companySettings}
                supervisors={supervisors}
                headsOfDepartment={headsOfDepartment}
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
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.display_name}`}
                            />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700">
                              {employee.display_name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{employee.display_name}</h3>
                            <p className="text-gray-600">{employee.position}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500">{employee.department}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">ID: {employee.employeeId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Monthly Salary</p>
                            <p className="text-sm font-medium">{formatAmount(employee.salary || 0)}</p>
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
                                onClick={() => {
                                  setSelectedEmployee(employee)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEmployee(employee)
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
              employees={employees}
              selectedEmployee={selectedEmployee}
              companySettings={companySettings}
              supervisors={supervisors}
              headsOfDepartment={headsOfDepartment}
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
      processFile(file)
      console.log("[v0] CSV file selected:", file.name)
    }
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

      onImport(allData)
    }
    reader.readAsText(selectedFile)
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
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
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
                employees={employees}
                selectedEmployee={selectedEmployee}
                companySettings={companySettings}
                supervisors={supervisors}
                headsOfDepartment={headsOfDepartment}
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
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.display_name}`}
                            />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700">
                              {employee.display_name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{employee.display_name}</h3>
                            <p className="text-gray-600">{employee.position}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500">{employee.department}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">ID: {employee.employeeId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Monthly Salary</p>
                            <p className="text-sm font-medium">{formatAmount(employee.salary || 0)}</p>
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
                                onClick={() => {
                                  setSelectedEmployee(employee)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEmployee(employee)
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
              employees={employees}
              selectedEmployee={selectedEmployee}
              companySettings={companySettings}
              supervisors={supervisors}
              headsOfDepartment={headsOfDepartment}
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
      processFile(file)
      console.log("[v0] CSV file selected:", file.name)
    }
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

      onImport(allData)
    }
    reader.readAsText(selectedFile)
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
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
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
                employees={employees}
                selectedEmployee={selectedEmployee}
                companySettings={companySettings}
                supervisors={supervisors}
                headsOfDepartment={headsOfDepartment}
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
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.display_name}`}
                            />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700">
                              {employee.display_name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{employee.display_name}</h3>
                            <p className="text-gray-600">{employee.position}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500">{employee.department}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">ID: {employee.employeeId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Monthly Salary</p>
                            <p className="text-sm font-medium">{formatAmount(employee.salary || 0)}</p>
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
                                onClick={() => {
                                  setSelectedEmployee(employee)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEmployee(employee)
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
              employees={employees}
              selectedEmployee={selectedEmployee}
              companySettings={companySettings}
              supervisors={supervisors}
              headsOfDepartment={headsOfDepartment}
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
      processFile(file)
      console.log("[v0] CSV file selected:", file.name)
    }
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

      onImport(allData)
    }
    reader.readAsText(selectedFile)
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
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
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
                employees={employees}
                selectedEmployee={selectedEmployee}
                companySettings={companySettings}
                supervisors={supervisors}
                headsOfDepartment={headsOfDepartment}
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
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.display_name}`}
                            />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700">
                              {employee.display_name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{employee.display_name}</h3>
                            <p className="text-gray-600">{employee.position}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500">{employee.department}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">ID: {employee.employeeId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Monthly Salary</p>
                            <p className="text-sm font-medium">{formatAmount(employee.salary || 0)}</p>
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
                                onClick={() => {
                                  setSelectedEmployee(employee)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEmployee(employee)
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
              employees={employees}
              selectedEmployee={selectedEmployee}
              companySettings={companySettings}
              supervisors={supervisors}
              headsOfDepartment={headsOfDepartment}
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
      processFile(file)
      console.log("[v0] CSV file selected:", file.name)
    }
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

      onImport(allData)
    }
    reader.readAsText(selectedFile)
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
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
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
                employees={employees}
                selectedEmployee={selectedEmployee}
                companySettings={companySettings}
                supervisors={supervisors}
                headsOfDepartment={headsOfDepartment}
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
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.display_name}`}
                            />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700">
                              {employee.display_name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{employee.display_name}</h3>
                            <p className="text-gray-600">{employee.position}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500">{employee.department}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">ID: {employee.employeeId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Monthly Salary</p>
                            <p className="text-sm font-medium">{formatAmount(employee.salary || 0)}</p>
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
                                onClick={() => {
                                  setSelectedEmployee(employee)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEmployee(employee)
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
              employees={employees}
              selectedEmployee={selectedEmployee}
              companySettings={companySettings}
              supervisors={supervisors}
              headsOfDepartment={headsOfDepartment}
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
      processFile(file)
      console.log("[v0] CSV file selected:", file.name)
    }
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

      onImport(allData)
    }
    reader.readAsText(selectedFile)
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
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
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
                employees={employees}
                selectedEmployee={selectedEmployee}
                companySettings={companySettings}
                supervisors={supervisors}
                headsOfDepartment={headsOfDepartment}
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
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.display_name}`}
                            />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700">
                              {employee.display_name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{employee.display_name}</h3>
                            <p className="text-gray-600">{employee.position}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500">{employee.department}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">ID: {employee.employeeId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Monthly Salary</p>
                            <p className="text-sm font-medium">{formatAmount(employee.salary || 0)}</p>
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
                                onClick={() => {
                                  setSelectedEmployee(employee)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEmployee(employee)
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
              employees={employees}
              selectedEmployee={selectedEmployee}
              companySettings={companySettings}
              supervisors={supervisors}
              headsOfDepartment={headsOfDepartment}
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
      processFile(file)
      console.log("[v0] CSV file selected:", file.name)
    }
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

      onImport(allData)
    }
    reader.readAsText(selectedFile)
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
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
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
                employees={employees}
                selectedEmployee={selectedEmployee}
                companySettings={companySettings}
                supervisors={supervisors}
                headsOfDepartment={headsOfDepartment}
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
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.display_name}`}
                            />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700">
                              {employee.display_name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{employee.display_name}</h3>
                            <p className="text-gray-600">{employee.position}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500">{employee.department}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">ID: {employee.employeeId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Monthly Salary</p>
                            <p className="text-sm font-medium">{formatAmount(employee.salary || 0)}</p>
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
                                onClick={() => {
                                  setSelectedEmployee(employee)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEmployee(employee)
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
              employees={employees}
              selectedEmployee={selectedEmployee}
              companySettings={companySettings}
              supervisors={supervisors}
              headsOfDepartment={headsOfDepartment}
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
      processFile(file)
      console.log("[v0] CSV file selected:", file.name)
    }
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

      onImport(allData)
    }
    reader.readAsText(selectedFile)
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
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
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
                employees={employees}
                selectedEmployee={selectedEmployee}
                companySettings={companySettings}
                supervisors={supervisors}
                headsOfDepartment={headsOfDepartment}
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
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.display_name}`}
                            />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700">
                              {employee.display_name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{employee.display_name}</h3>
                            <p className="text-gray-600">{employee.position}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500">{employee.department}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">ID: {employee.employeeId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Monthly Salary</p>
                            <p className="text-sm font-medium">{formatAmount(employee.salary || 0)}</p>
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
                                onClick={() => {
                                  setSelectedEmployee(employee)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEmployee(employee)
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
              employees={employees}
              selectedEmployee={selectedEmployee}
              companySettings={companySettings}
              supervisors={supervisors}
              headsOfDepartment={headsOfDepartment}
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
      processFile(file)
      console.log("[v0] CSV file selected:", file.name)
    }
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

      onImport(allData)
    }
    reader.readAsText(selectedFile)
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
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
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
                employees={employees}
                selectedEmployee={selectedEmployee}
                companySettings={companySettings}
                supervisors={supervisors}
                headsOfDepartment={headsOfDepartment}
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
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.display_name}`}
                            />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700">
                              {employee.display_name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{employee.display_name}</h3>
                            <p className="text-gray-600">{employee.position}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500">{employee.department}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">ID: {employee.employeeId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Monthly Salary</p>
                            <p className="text-sm font-medium">{formatAmount(employee.salary || 0)}</p>
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
                                onClick={() => {
                                  setSelectedEmployee(employee)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEmployee(employee)
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
              employees={employees}
              selectedEmployee={selectedEmployee}
              companySettings={companySettings}
              supervisors={supervisors}
              headsOfDepartment={headsOfDepartment}
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
      processFile(file)
      console.log("[v0] CSV file selected:", file.name)
    }
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

      onImport(allData)
    }
    reader.readAsText(selectedFile)
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
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
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
                employees={employees}
                selectedEmployee={selectedEmployee}
                companySettings={companySettings}
                supervisors={supervisors}
                headsOfDepartment={headsOfDepartment}
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
            <div className="flex flex-wrap gap-2\
