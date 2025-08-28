"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { Search, Filter, Plus, Edit, Download, Upload } from "lucide-react"

import { CentralDocumentService } from "@/lib/storage/centralDocumentService"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

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

  const [companySettings, setCompanySettings] = useState<any>(null)
  const [subsidiaries, setSubsidiaries] = useState<any[]>([])
  const [divisions, setDivisions] = useState<string[]>([])
  const [departmentsList, setDepartments] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
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
    subsidiary: "",
    division: "",
    department: "",
    location: "",
    contractType: "Permanent",
    dateOfJoining: "",
    dateOfExit: "",
    status: "Active",
    probationPeriod: "6",
    confirmationDate: "",
    noticePeriod: "",
    directSupervisor: "",
    headOfDepartment: "",
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

  const loadSubsidiaries = async () => {
    try {
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

  const generateEmployeeId = async () => {
    try {
      const supabase = createClient()
      const { data: employees, error } = await supabase
        .from("employees")
        .select("employee_id")
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("[v0] Error fetching last employee:", error)
        return "AKWA0001" // Default first ID
      }

      let nextNumber = 1
      if (employees && employees.length > 0) {
        const lastId = employees[0].employee_id
        const lastNumber = Number.parseInt(lastId.slice(-4)) // Extract last 4 digits
        nextNumber = lastNumber + 1
      }

      const companyPrefix = formData.subsidiary
        ? `${companySettings?.name?.substring(0, 2)?.toUpperCase() || "AK"}${
            subsidiaries
              .find((s) => s.id === formData.subsidiary)
              ?.name?.substring(0, 2)
              ?.toUpperCase() || "WA"
          }`
        : companySettings?.name?.substring(0, 4)?.toUpperCase() || "AKWA"

      return `${companyPrefix}${nextNumber.toString().padStart(4, "0")}`
    } catch (error) {
      console.error("[v0] Error generating employee ID:", error)
      return "AKWA0001"
    }
  }

  const loadCompanyData = async () => {
    try {
      console.log("[v0] Loading company data...")
      const supabase = createClient()

      // Load company settings
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", MAIN_COMPANY_ID)
        .maybeSingle()

      if (companyError) {
        console.error("[v0] Error loading company data:", companyError)
      } else if (companyData) {
        setCompanySettings(companyData)
        console.log("[v0] Company data loaded:", companyData)

        const companyDivisions = Array.isArray(companyData.divisions)
          ? companyData.divisions
          : companyData.divisions
            ? JSON.parse(companyData.divisions)
            : ["Head Office", "Regional Office"]

        const companyDepartments = Array.isArray(companyData.departments)
          ? companyData.departments
          : companyData.departments
            ? JSON.parse(companyData.departments)
            : ["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"]

        const companyLocations = Array.isArray(companyData.locations)
          ? companyData.locations
          : companyData.locations
            ? JSON.parse(companyData.locations)
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
    if (formData.subsidiary) {
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
    } else if (companySettings) {
      console.log("[v0] Loading company data (no subsidiary selected)")

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
  }, [formData.subsidiary, subsidiaries, companySettings])

  const loadEmployees = async () => {
    try {
      console.log("[v0] Loading employees from database...")
      const supabase = createClient()
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          subsidiaries (
            name,
            id
          )
        `)
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

      const newEmployee = {
        ...employeeData,
        employee_id: employeeId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("employees").insert([newEmployee]).select().single()

      if (error) {
        console.error("Error adding employee:", error)
        toast({
          title: "Error",
          description: "Failed to add employee to database.",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Employee added successfully:", data)

      // Immediately update local state
      setEmployees((prev) => [data, ...prev])

      toast({
        title: "Success",
        description: `Employee ${employeeData.display_name} has been added successfully!`,
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
      const supabase = createClient()

      const updatedEmployee = {
        prefix: employeeData.prefix,
        first_name: employeeData.firstName,
        other_names: employeeData.otherNames,
        last_name: employeeData.lastName,
        display_name: employeeData.displayName,
        personal_email: employeeData.personalEmail,
        corporate_email: employeeData.corporateEmail,
        phone_number: employeeData.phone,
        address: employeeData.address,
        date_of_birth: employeeData.dateOfBirth || null,
        gender: employeeData.gender,
        marital_status: employeeData.maritalStatus,
        educational_level: employeeData.educationalLevel,
        emergency_contact_name: employeeData.emergencyContactName,
        emergency_contact_tel: employeeData.emergencyContactTel,
        department: employeeData.department,
        position: employeeData.position,
        salary: Number.parseFloat(employeeData.salary) || 0,
        status: employeeData.status || "Active",
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
    const matchesSearch =
      employee.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.personal_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase())

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
          <p className="text-muted-foreground">Manage your team members and their information</p>
        </div>
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
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, email, position, or employee ID..."
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
          <CardTitle>Employee Directory ({filteredEmployees.length} employees)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-6">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.display_name}`} />
                        <AvatarFallback>
                          {employee.display_name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{employee.display_name}</h3>
                        <p className="text-sm text-muted-foreground">{employee.position}</p>
                        <p className="text-sm text-muted-foreground">{employee.personal_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={employee.status === "Active" ? "default" : "secondary"}>{employee.status}</Badge>
                      <Badge variant="outline">{employee.department}</Badge>
                      <p className="text-sm font-medium">GHS {employee.salary?.toLocaleString()}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployee(employee)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Profile Dialog */}
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Profile</DialogTitle>
          </DialogHeader>
          {selectedEmployee && <EmployeeProfile employee={selectedEmployee} />}
        </DialogContent>
      </Dialog>

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
                      onChange={handleFileSelect}
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
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={!selectedFile || previewData.length === 0 || importErrors.length > 0}
          className="bg-emerald-600 hover:bg-emerald-700"
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
}) {
  const [divisions, setDivisions] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [currentTab, setCurrentTab] = useState("personal")
  const [errors, setErrors] = useState<any>({})

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

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        console.log("[v0] Loading company data for dropdowns...")
        const supabase = createClient()

        if (formData.subsidiary) {
          const selectedSubsidiary = subsidiaries.find((s) => s.id === formData.subsidiary)
          if (selectedSubsidiary) {
            console.log("[v0] Loading subsidiary data:", selectedSubsidiary.name)
            const parseDivisions = (data: any) =>
              Array.isArray(data) ? data : typeof data === "string" ? JSON.parse(data) : []
            const parseDepartments = (data: any) =>
              Array.isArray(data) ? data : typeof data === "string" ? JSON.parse(data) : []
            const parseLocations = (data: any) =>
              Array.isArray(data) ? data : typeof data === "string" ? JSON.parse(data) : []

            setDivisions(parseDivisions(selectedSubsidiary.divisions) || [])
            setDepartments(parseDepartments(selectedSubsidiary.departments) || [])
            setLocations(parseLocations(selectedSubsidiary.locations) || [])
          }
        } else {
          // Load main company data from database
          const MAIN_COMPANY_ID = "00000000-0000-0000-0000-000000000001"
          const { data: companyData, error: companyError } = await supabase
            .from("companies")
            .select("*")
            .eq("id", MAIN_COMPANY_ID)
            .maybeSingle()

          if (companyError) {
            console.error("[v0] Error loading company data:", companyError)
          }

          if (companyData) {
            console.log("[v0] Loaded company data from database:", companyData)
            const parseDivisions = (data: any) =>
              Array.isArray(data)
                ? data
                : typeof data === "string"
                  ? JSON.parse(data)
                  : ["Head Office", "Regional Office"]
            const parseDepartments = (data: any) =>
              Array.isArray(data)
                ? data
                : typeof data === "string"
                  ? JSON.parse(data)
                  : ["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"]
            const parseLocations = (data: any) =>
              Array.isArray(data)
                ? data
                : typeof data === "string"
                  ? JSON.parse(data)
                  : ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"]

            setDivisions(parseDivisions(companyData.divisions))
            setDepartments(parseDepartments(companyData.departments))
            setLocations(parseLocations(companyData.locations))
          } else {
            // Fallback to default values
            console.log("[v0] No company data found, using defaults")
            setDivisions(["Head Office", "Regional Office"])
            setDepartments(["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"])
            setLocations(["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"])
          }
        }
      } catch (error) {
        console.error("[v0] Error loading company data:", error)
        // Fallback to default values
        setDivisions(["Head Office", "Regional Office"])
        setDepartments(["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"])
        setLocations(["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"])
      }
    }

    loadCompanyData()
  }, [formData.subsidiary, subsidiaries])

  useEffect(() => {
    const generateId = () => {
      const companyInitials = "AKWA"
      let prefix = companyInitials

      if (formData.subsidiary && subsidiaries.length > 0) {
        const subsidiary = subsidiaries.find((s) => s.id === formData.subsidiary)
        if (subsidiary) {
          const companyFirst2 = companyInitials.substring(0, 2)
          const subsidiaryFirst2 = subsidiary.name.substring(0, 2).toUpperCase()
          prefix = companyFirst2 + subsidiaryFirst2
        }
      }

      // Generate sequential number starting from 0001
      const existingEmployees = employees || []
      const nextNumber = existingEmployees.length + 1
      const paddedNumber = nextNumber.toString().padStart(4, "0")

      return `${prefix}${paddedNumber}`
    }

    if (!formData.employeeId) {
      setFormData((prev: any) => ({
        ...prev,
        employeeId: generateId(),
      }))
    }
  }, [formData.subsidiary, subsidiaries, employees, formData.employeeId, setFormData])

  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.personalEmail.trim()) newErrors.personalEmail = "Personal email is required"
    if (!formData.phone.trim()) newErrors.phone = "Phone is required"
    if (!formData.position.trim()) newErrors.position = "Position is required"
    if (!formData.department) newErrors.department = "Department is required"
    if (!formData.salary) newErrors.salary = "Salary is required"
    if (!formData.location) newErrors.location = "Location is required"
    if (!formData.dateOfJoining) newErrors.dateOfJoining = "Date of joining is required"
    if (!formData.bankName) newErrors.bankName = "Bank Name is required"
    if (!formData.bankAccount) newErrors.bankAccount = "Bank Account Number is required"
    if (!formData.ssnit) newErrors.ssnit = "SSNIT Number is required"
    if (!formData.ghanaCard) newErrors.ghanaCard = "Ghana Card Number is required"

    // Email validation for both emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.personalEmail && !emailRegex.test(formData.personalEmail)) {
      newErrors.personalEmail = "Invalid email format"
    }
    if (formData.corporateEmail && !emailRegex.test(formData.corporateEmail)) {
      newErrors.corporateEmail = "Invalid email format"
    }

    // Phone validation
    const phoneRegex = /^\+233\s\d{2}\s\d{3}\s\d{4}$/
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Phone must be in format: +233 XX XXX XXXX"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      const fullName = [formData.prefix, formData.firstName, formData.otherNames, formData.lastName]
        .filter(Boolean)
        .join(" ")

      const employeeData = {
        ...formData,
        name: fullName,
        fullName: fullName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        email: formData.personalEmail, // Primary email for system use
      }

      console.log("[v0] Submitting employee data:", employeeData)
      onSubmit(employeeData)

      // Reset form after successful submission
      setFormData({
        employeeId: "",
        prefix: "",
        firstName: "",
        otherNames: "",
        lastName: "",
        maritalStatus: "",
        gender: "",
        corporateEmail: "",
        personalEmail: "",
        phone: "",
        dateOfBirth: "",
        address: "",
        educationalLevel: "",
        emergencyContactName: "",
        emergencyContactTel: "",
        position: "",
        directSupervisor: "",
        headOfDepartment: "",
        subsidiary: "",
        division: "",
        department: "",
        location: "",
        contractType: "Permanent",
        dateOfJoining: "",
        dateOfExit: "",
        status: "Active",
        probationPeriod: "6",
        confirmationDate: "",
        noticePeriod: "",
        salary: "",
        transportAllowance: "",
        housingAllowance: "",
        medicalAllowance: "",
        mealAllowance: "",
        uniformAllowance: "",
        communicationAllowance: "",
        otherAllowances: "",
        taxDeduction: "",
        tier3: "",
        loanDeduction: "",
        advanceDeduction: "",
        otherDeductions: "",
        loanAmount: "",
        loanBalance: "",
        loanInstallment: "",
        loanStartDate: "",
        loanEndDate: "",
        bankName: "",
        bankAccount: "",
        ghanaCard: "",
        documents: [],
        profilePicture: "",
        profilePictureFile: null,
      })
      setErrors({})
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: "" }))
    }
  }

  const handleDocumentUpload = async (documentType: string, file: File) => {
    try {
      console.log(`[v0] Uploading ${documentType}:`, file.name)

      // Store the file in form data
      const updatedDocuments = [...formData.documents]
      const existingIndex = updatedDocuments.findIndex((doc) => doc.type === documentType)

      const documentData = {
        type: documentType,
        name: file.name,
        size: file.size,
        uploadDate: new Date().toISOString(),
        file: file,
      }

      if (existingIndex >= 0) {
        updatedDocuments[existingIndex] = documentData
      } else {
        updatedDocuments.push(documentData)
      }

      if (documentType === "Passport Picture") {
        const imageUrl = URL.createObjectURL(file)
        setFormData((prev) => ({
          ...prev,
          documents: updatedDocuments,
          profilePicture: imageUrl,
          profilePictureFile: file,
        }))
      } else {
        setFormData((prev) => ({ ...prev, documents: updatedDocuments }))
      }

      console.log(`[v0] Document ${documentType} stored in form data successfully`)

      toast({
        title: "Document Uploaded",
        description: `${documentType} has been uploaded successfully.`,
      })
    } catch (error) {
      console.error(`Error uploading ${documentType}:`, error)
      toast({
        title: "Upload Error",
        description: `Failed to upload ${documentType}. Please try again.`,
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prefix">1. Prefix</Label>
                <Select value={formData.prefix} onValueChange={(value) => handleInputChange("prefix", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select prefix" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr">Mr</SelectItem>
                    <SelectItem value="Mrs">Mrs</SelectItem>
                    <SelectItem value="Ms">Ms</SelectItem>
                    <SelectItem value="Dr">Dr</SelectItem>
                    <SelectItem value="Prof">Prof</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="firstName">2. First Name *</Label>
                <Input
                  type="text"
                  id="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <Label htmlFor="otherNames">3. Other Name(s)</Label>
                <Input
                  type="text"
                  id="otherNames"
                  placeholder="Middle names"
                  value={formData.otherNames}
                  onChange={(e) => handleInputChange("otherNames", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">4. Last Name *</Label>
                <Input
                  type="text"
                  id="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>
              <div>
                <Label htmlFor="maritalStatus">5. Marital Status</Label>
                <Select
                  value={formData.maritalStatus}
                  onValueChange={(value) => handleInputChange("maritalStatus", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="gender">6. Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="corporateEmail">7. Corporate Email Address</Label>
                <Input
                  type="email"
                  id="corporateEmail"
                  placeholder="employee@company.com"
                  value={formData.corporateEmail}
                  onChange={(e) => handleInputChange("corporateEmail", e.target.value)}
                />
                {errors.corporateEmail && <p className="text-red-500 text-sm mt-1">{errors.corporateEmail}</p>}
              </div>
              <div>
                <Label htmlFor="personalEmail">8. Personal Email Address *</Label>
                <Input
                  type="email"
                  id="personalEmail"
                  placeholder="personal@email.com"
                  value={formData.personalEmail}
                  onChange={(e) => handleInputChange("personalEmail", e.target.value)}
                />
                {errors.personalEmail && <p className="text-red-500 text-sm mt-1">{errors.personalEmail}</p>}
              </div>
              <div>
                <Label htmlFor="phone">9. Phone Number *</Label>
                <Input
                  type="tel"
                  id="phone"
                  placeholder="+233 XX XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="dateOfBirth">10. Date of Birth</Label>
                <Input
                  type="date"
                  id="dateOfBirth"
                  placeholder="mm/dd/yyyy"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">11. Address</Label>
              <textarea
                id="address"
                placeholder="Full address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="educationalLevel">12. Educational Level</Label>
                <Select
                  value={formData.educationalLevel}
                  onValueChange={(value) => handleInputChange("educationalLevel", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High School">High School</SelectItem>
                    <SelectItem value="Diploma">Diploma</SelectItem>
                    <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                    <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="emergencyContactName">13. Emergency Contact Name</Label>
                <Input
                  type="text"
                  id="emergencyContactName"
                  placeholder="Contact person name"
                  value={formData.emergencyContactName}
                  onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="emergencyContactTel">14. Emergency Contact Tel</Label>
                <Input
                  type="tel"
                  id="emergencyContactTel"
                  placeholder="+233 XX XXX XXXX"
                  value={formData.emergencyContactTel}
                  onChange={(e) => handleInputChange("emergencyContactTel", e.target.value)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="employment">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  type="text"
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => handleInputChange("employeeId", e.target.value)}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="position">1. Position *</Label>
                <Input
                  type="text"
                  id="position"
                  placeholder="Enter position/job title"
                  value={formData.position}
                  onChange={(e) => handleInputChange("position", e.target.value)}
                />
                {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position}</p>}
              </div>
              <div>
                <Label htmlFor="directSupervisor">1a. Direct Supervisor *</Label>
                <Select
                  value={formData.directSupervisor}
                  onValueChange={(value) => handleInputChange("directSupervisor", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select direct supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter((emp) => emp.id !== selectedEmployee?.id)
                      .map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name || `${employee.firstName} ${employee.lastName}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="headOfDepartment">1b. Head of Department *</Label>
                <Select
                  value={formData.headOfDepartment}
                  onValueChange={(value) => handleInputChange("headOfDepartment", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select head of department" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter((emp) => emp.id !== selectedEmployee?.id)
                      .map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name || `${employee.firstName} ${employee.lastName}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subsidiary">2. Subsidiary</Label>
                <Select value={formData.subsidiary} onValueChange={(value) => handleInputChange("subsidiary", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select subsidiary (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {subsidiaries.map((subsidiary) => (
                      <SelectItem key={subsidiary.id} value={subsidiary.id}>
                        {subsidiary.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="division">3. Division / Branch</Label>
                <Select value={formData.division} onValueChange={(value) => handleInputChange("division", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select division/branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((division) => (
                      <SelectItem key={division} value={division}>
                        {division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department">4. Department *</Label>
                <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
              </div>
              <div>
                <Label htmlFor="location">5. Location *</Label>
                <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
              <div>
                <Label htmlFor="contractType">6. Contract Type *</Label>
                <Select
                  value={formData.contractType}
                  onValueChange={(value) => handleInputChange("contractType", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Permanent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Permanent">Permanent</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Intern">Intern</SelectItem>
                    <SelectItem value="Temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dateOfJoining">7. Date of Joining *</Label>
                <Input
                  type="date"
                  id="dateOfJoining"
                  placeholder="mm/dd/yyyy"
                  value={formData.dateOfJoining}
                  onChange={(e) => handleInputChange("dateOfJoining", e.target.value)}
                />
                {errors.dateOfJoining && <p className="text-red-500 text-sm mt-1">{errors.dateOfJoining}</p>}
              </div>
              <div>
                <Label htmlFor="dateOfExit">8. Date of Exit</Label>
                <Input
                  type="date"
                  id="dateOfExit"
                  placeholder="mm/dd/yyyy"
                  value={formData.dateOfExit}
                  onChange={(e) => handleInputChange("dateOfExit", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">9. Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Active" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="probationPeriod">10. Probation Period (months)</Label>
                <Select
                  value={formData.probationPeriod}
                  onValueChange={(value) => handleInputChange("probationPeriod", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="6 months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="confirmationDate">11. Confirmation Date</Label>
                <Input
                  type="date"
                  id="confirmationDate"
                  placeholder="mm/dd/yyyy"
                  value={formData.confirmationDate}
                  onChange={(e) => handleInputChange("confirmationDate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="noticePeriod">12. Notice Period</Label>
                <Input
                  type="text"
                  id="noticePeriod"
                  placeholder="e.g. 1 month, 3 months"
                  value={formData.noticePeriod}
                  onChange={(e) => handleInputChange("noticePeriod", e.target.value)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financial">
          <div className="space-y-6">
            {/* Basic Financial Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary">Monthly Salary (GHS) *</Label>
                <Input
                  type="number"
                  id="salary"
                  placeholder="5000"
                  value={formData.salary}
                  onChange={(e) => handleInputChange("salary", e.target.value)}
                />
                {errors.salary && <p className="text-red-500 text-sm mt-1">{errors.salary}</p>}
              </div>
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Select value={formData.bankName} onValueChange={(value) => handleInputChange("bankName", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GCB Bank">GCB Bank</SelectItem>
                    <SelectItem value="Ecobank">Ecobank</SelectItem>
                    <SelectItem value="Standard Chartered">Standard Chartered</SelectItem>
                    <SelectItem value="Absa Bank">Absa Bank</SelectItem>
                    <SelectItem value="Fidelity Bank">Fidelity Bank</SelectItem>
                    <SelectItem value="Zenith Bank">Zenith Bank</SelectItem>
                    <SelectItem value="Stanbic Bank">Stanbic Bank</SelectItem>
                  </SelectContent>
                </Select>
                {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
              </div>
              <div>
                <Label htmlFor="bankAccount">Bank Account Number</Label>
                <Input
                  type="text"
                  id="bankAccount"
                  placeholder="Account number"
                  value={formData.bankAccount}
                  onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                />
                {errors.bankAccount && <p className="text-red-500 text-sm mt-1">{errors.bankAccount}</p>}
              </div>
              <div>
                <Label htmlFor="ssnit">SSNIT Number</Label>
                <Input
                  type="text"
                  id="ssnit"
                  placeholder="GHA-123456789-0"
                  value={formData.ssnit}
                  onChange={(e) => handleInputChange("ssnit", e.target.value)}
                />
                {errors.ssnit && <p className="text-red-500 text-sm mt-1">{errors.ssnit}</p>}
              </div>
              <div>
                <Label htmlFor="ghanaCard">Ghana Card Number</Label>
                <Input
                  type="text"
                  id="ghanaCard"
                  placeholder="GHA-123456789-0"
                  value={formData.ghanaCard}
                  onChange={(e) => handleInputChange("ghanaCard", e.target.value)}
                />
                {errors.ghanaCard && <p className="text-red-500 text-sm mt-1">{errors.ghanaCard}</p>}
              </div>
            </div>

            {/* Allowances Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Allowances</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transportAllowance">Transport Allowance (GHS)</Label>
                  <Input
                    type="number"
                    id="transportAllowance"
                    placeholder="0"
                    value={formData.transportAllowance}
                    onChange={(e) => handleInputChange("transportAllowance", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="housingAllowance">Housing Allowance (GHS)</Label>
                  <Input
                    type="number"
                    id="housingAllowance"
                    placeholder="0"
                    value={formData.housingAllowance}
                    onChange={(e) => handleInputChange("housingAllowance", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="medicalAllowance">Medical Allowance (GHS)</Label>
                  <Input
                    type="number"
                    id="medicalAllowance"
                    placeholder="0"
                    value={formData.medicalAllowance}
                    onChange={(e) => handleInputChange("medicalAllowance", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="mealAllowance">Meal Allowance (GHS)</Label>
                  <Input
                    type="number"
                    id="mealAllowance"
                    placeholder="0"
                    value={formData.mealAllowance}
                    onChange={(e) => handleInputChange("mealAllowance", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="uniformAllowance">Uniform Allowance (GHS)</Label>
                  <Input
                    type="number"
                    id="uniformAllowance"
                    placeholder="0"
                    value={formData.uniformAllowance}
                    onChange={(e) => handleInputChange("uniformAllowance", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="communicationAllowance">Communication Allowance (GHS)</Label>
                  <Input
                    type="number"
                    id="communicationAllowance"
                    placeholder="0"
                    value={formData.communicationAllowance}
                    onChange={(e) => handleInputChange("communicationAllowance", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="otherAllowances">Other Allowances (GHS)</Label>
                  <Input
                    type="number"
                    id="otherAllowances"
                    placeholder="0"
                    value={formData.otherAllowances}
                    onChange={(e) => handleInputChange("otherAllowances", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Deductions Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Deductions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxDeduction">Tax Deduction (GHS)</Label>
                  <Input
                    type="number"
                    id="taxDeduction"
                    placeholder="0"
                    value={formData.taxDeduction}
                    onChange={(e) => handleInputChange("taxDeduction", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tier3">Tier 3 Contribution (GHS)</Label>
                  <Input
                    type="number"
                    id="tier3"
                    placeholder="0"
                    value={formData.tier3}
                    onChange={(e) => handleInputChange("tier3", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="loanDeduction">Loan Deduction (GHS)</Label>
                  <Input
                    type="number"
                    id="loanDeduction"
                    placeholder="0"
                    value={formData.loanDeduction}
                    onChange={(e) => handleInputChange("loanDeduction", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="advanceDeduction">Advance Deduction (GHS)</Label>
                  <Input
                    type="number"
                    id="advanceDeduction"
                    placeholder="0"
                    value={formData.advanceDeduction}
                    onChange={(e) => handleInputChange("advanceDeduction", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="otherDeductions">Other Deductions (GHS)</Label>
                  <Input
                    type="number"
                    id="otherDeductions"
                    placeholder="0"
                    value={formData.otherDeductions}
                    onChange={(e) => handleInputChange("otherDeductions", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Loan Details Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Loan Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="loanAmount">Loan Amount (GHS)</Label>
                  <Input
                    type="number"
                    id="loanAmount"
                    placeholder="0"
                    value={formData.loanAmount}
                    onChange={(e) => handleInputChange("loanAmount", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="loanBalance">Loan Balance (GHS)</Label>
                  <Input
                    type="number"
                    id="loanBalance"
                    placeholder="0"
                    value={formData.loanBalance}
                    onChange={(e) => handleInputChange("loanBalance", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="loanInstallment">Monthly Installment (GHS)</Label>
                  <Input
                    type="number"
                    id="loanInstallment"
                    placeholder="0"
                    value={formData.loanInstallment}
                    onChange={(e) => handleInputChange("loanInstallment", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="loanStartDate">Loan Start Date</Label>
                  <Input
                    type="date"
                    id="loanStartDate"
                    value={formData.loanStartDate}
                    onChange={(e) => handleInputChange("loanStartDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="loanEndDate">Loan End Date</Label>
                  <Input
                    type="date"
                    id="loanEndDate"
                    value={formData.loanEndDate}
                    onChange={(e) => handleInputChange("loanEndDate", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Required Documents</h3>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">1. Academic Certificate(s)</h4>
                    <p className="text-sm text-gray-600">Educational certificates and transcripts</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("academic-cert")?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    id="academic-cert"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleDocumentUpload("Academic Certificate(s)", e.target.files[0])
                      }
                    }}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">2. Passport Picture</h4>
                    <p className="text-sm text-gray-600">Professional passport-sized photograph</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("passport-picture")?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    id="passport-picture"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleDocumentUpload("Passport Picture", e.target.files[0])
                      }
                    }}
                  />
                </div>
                {formData.profilePicture && (
                  <div className="mt-2">
                    <img
                      src={formData.profilePicture || "/placeholder.svg"}
                      alt="Profile"
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">3. Resume & Application Letter</h4>
                    <p className="text-sm text-gray-600">Current CV and cover letter</p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => document.getElementById("resume-cv")?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    id="resume-cv"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleDocumentUpload("Resume & Application Letter", e.target.files[0])
                      }
                    }}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">4. Passport</h4>
                    <p className="text-sm text-gray-600">Valid passport copy</p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => document.getElementById("passport")?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    id="passport"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleDocumentUpload("Passport", e.target.files[0])
                      }
                    }}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">5. National ID</h4>
                    <p className="text-sm text-gray-600">Ghana Card or Voter's ID</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("national-id")?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    id="national-id"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleDocumentUpload("National ID", e.target.files[0])
                      }
                    }}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">6. Medical Report</h4>
                    <p className="text-sm text-gray-600">Health clearance certificate</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("medical-report")?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    id="medical-report"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleDocumentUpload("Medical Report", e.target.files[0])
                      }
                    }}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">7. Police Report</h4>
                    <p className="text-sm text-gray-600">Criminal background check</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("police-report")?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    id="police-report"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleDocumentUpload("Police Report", e.target.files[0])
                      }
                    }}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">8. Other Uploads</h4>
                    <p className="text-sm text-gray-600">Additional supporting documents</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("other-uploads")?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    id="other-uploads"
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleDocumentUpload("Other Uploads", e.target.files[0])
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {currentTab !== "personal" && (
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setCurrentTab(
                currentTab === "employment" ? "personal" : currentTab === "financial" ? "employment" : "financial",
              )
            }
          >
            Previous
          </Button>
        )}
        {currentTab !== "documents" ? (
          <Button type="button" onClick={handleNext} className="bg-teal-600 hover:bg-teal-700">
            Next
          </Button>
        ) : (
          <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
            Submit
          </Button>
        )}
      </div>
    </form>
  )
}

function EmployeeProfile({ employee }: { employee: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.display_name}`} />
          <AvatarFallback>
            {employee.display_name
              ?.split(" ")
              .map((n: string) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-semibold">{employee.display_name}</h2>
          <p className="text-muted-foreground">{employee.position}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Email</Label>
            <p className="font-medium">{employee.personal_email}</p>
          </div>
          <div>
            <Label>Phone</Label>
            <p className="font-medium">{employee.phone_number}</p>
          </div>
          <div>
            <Label>Date of Birth</Label>
            <p className="font-medium">{employee.date_of_birth}</p>
          </div>
          <div>
            <Label>Address</Label>
            <p className="font-medium">{employee.address}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employment Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Employee ID</Label>
            <p className="font-medium">{employee.employee_id}</p>
          </div>
          <div>
            <Label>Department</Label>
            <p className="font-medium">{employee.department}</p>
          </div>
          <div>
            <Label>Position</Label>
            <p className="font-medium">{employee.position}</p>
          </div>
          <div>
            <Label>Status</Label>
            <Badge variant={employee.status === "Active" ? "default" : "secondary"}>{employee.status}</Badge>
          </div>
          <div>
            <Label>Salary</Label>
            <p className="font-medium">GHS {employee.salary?.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
