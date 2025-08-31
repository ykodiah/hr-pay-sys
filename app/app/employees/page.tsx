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
// import { EmployeeProfile } from "@/components/employee-profile"

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
        probation_period: employeeData.probationPeriod ? Number.parseInt(employeeData.probationPeriod) : null,
        confirmation_date: employeeData.confirmationDate || null,
        notice_period: employeeData.noticePeriod || null,
        direct_supervisor: employeeData.directSupervisor || null,
        head_of_department: employeeData.headOfDepartment || null,
        ghana_card_number: employeeData.ghanaCard || null,
        profile_picture: employeeData.profilePicture || null,
        company_id: "00000000-0000-0000-0000-000000000001", // Main company ID
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
        loan_amount: employeeData.loanAmount ? Number.parseFloat(employeeData.loanAmount) : null,
        loan_balance: employeeData.loanBalance ? Number.parseFloat(employeeData.loanBalance) : null,
        loan_installment: employeeData.loanInstallment ? Number.parseFloat(employeeData.loanInstallment) : null,
        loan_start_date: employeeData.loanStartDate || null,
        loan_end_date: employeeData.loanEndDate || null,
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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [supervisors, setSupervisors] = useState<any[]>([])
  const [headsOfDepartment, setHeadsOfDepartment] = useState<any[]>([])
  const { toast } = useToast()
  const [currentTab, setCurrentTab] = useState("personal")

  const [phoneCountryCode, setPhoneCountryCode] = useState("+233")
  const [emergencyCountryCode, setEmergencyCountryCode] = useState("+233")

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
    { code: "+34", country: "Spain", flag: "🇪🇸" },
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

  const handleInputChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      [key]: value,
    })
  }

  useEffect(() => {
    if (employee) {
      setFormData({
        prefix: employee.prefix || "",
        firstName: employee.first_name || "",
        otherNames: employee.other_names || "",
        lastName: employee.last_name || "",
        maritalStatus: employee.marital_status || "",
        corporateEmail: employee.corporate_email || "",
        personalEmail: employee.personal_email || "",
        phone: employee.phone || "",
        position: employee.position || "",
        subsidiary: employee.subsidiary_id || "",
        division: employee.division || "",
        department: employee.department || "",
        location: employee.location || "",
        contractType: employee.contract_type || "Permanent",
        dateOfJoining: employee.date_of_joining || "",
        dateOfExit: employee.date_of_exit || "",
        status: employee.status || "Active",
        probationPeriod: employee.probation_period || "6",
        confirmationDate: employee.confirmation_date || "",
        noticePeriod: employee.notice_period || "",
        directSupervisor: employee.direct_supervisor || "",
        headOfDepartment: employee.head_of_department || "",
        salary: employee.salary || "",
        transportAllowance: employee.transport_allowance || "",
        housingAllowance: employee.housing_allowance || "",
        medicalAllowance: employee.medical_allowance || "",
        mealAllowance: employee.meal_allowance || "",
        uniformAllowance: employee.uniform_allowance || "",
        communicationAllowance: employee.communication_allowance || "",
        otherAllowances: employee.other_allowances || "",
        taxDeduction: employee.tax_deduction || "",
        ssnit: employee.ssnit_number || "",
        tier3: employee.tier3_contribution || "",
        loanDeduction: employee.loan_deduction || "",
        advanceDeduction: employee.advance_deduction || "",
        otherDeductions: employee.other_deductions || "",
        loanAmount: employee.loan_amount || "",
        loanBalance: employee.loan_balance || "",
        loanInstallment: employee.loan_installment || "",
        loanStartDate: employee.loan_start_date || "",
        loanEndDate: employee.loan_end_date || "",
        startDate: employee.start_date || "",
        dateOfBirth: employee.date_of_birth || "",
        address: employee.address || "",
        emergencyContactName: employee.emergency_contact_name || "",
        emergencyContactTel: employee.emergency_contact_tel || "",
        educationalLevel: employee.educational_level || "",
        gender: employee.gender || "",
        bankName: employee.bank_name || "",
        bankAccount: employee.bank_account_number || "",
        ghanaCard: employee.ghana_card_number || "",
        documents: employee.documents || [],
        profilePicture: employee.profile_picture || "",
        profilePictureFile: null,
      })
    }
  }, [employee])

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
    }
  }, [formData.subsidiary, subsidiaries])

  useEffect(() => {
    const filteredSupervisors = employees.filter((emp) => emp.department === formData.department)
    setSupervisors(filteredSupervisors)

    const filteredHeads = employees.filter((emp) => emp.department === formData.department)
    setHeadsOfDepartment(filteredHeads)
  }, [formData.department, employees])

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

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = () => {
    if (validateForm()) {
      const fullName = `${formData.firstName} ${formData.otherNames} ${formData.lastName}`
      const displayName = `${formData.firstName} ${formData.lastName}`

      const employeeData = {
        ...formData,
        fullName: fullName,
        displayName: displayName,
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

  const handleNext = () => {
    if (currentTab === "personal") {
      setCurrentTab("employment")
    } else if (currentTab === "employment") {
      setCurrentTab("financial")
    } else if (currentTab === "financial") {
      setCurrentTab("documents")
    }
  }

  const handlePrevious = () => {
    if (currentTab === "employment") {
      setCurrentTab("personal")
    } else if (currentTab === "financial") {
      setCurrentTab("employment")
    } else if (currentTab === "documents") {
      setCurrentTab("financial")
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={currentTab} onValueChange={handleInputChange}>
        <TabsList className="flex justify-between">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          {/* <TabsTrigger value="documents">Documents</TabsTrigger> */}
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
                  <SelectItem value="Other">Other</SelectItem>
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
              <Input
                type="text"
                id="educationalLevel"
                value={formData.educationalLevel}
                onChange={(e) => handleInputChange("educationalLevel", e.target.value)}
              />
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
              <Label htmlFor="subsidiary">2. Subsidiary</Label>
              <Select value={formData.subsidiary} onValueChange={(value) => handleInputChange("subsidiary", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subsidiary" />
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

            <div className="space-y-2">
              <Label htmlFor="division">3. Division</Label>
              <Select value={formData.division} onValueChange={(value) => handleInputChange("division", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
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
                  {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
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
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
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
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On leave">On leave</SelectItem>
                  <SelectItem value="Resigned">Resigned</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
                  <SelectItem value="Suspend">Suspend</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
            </div>

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
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map((supervisor) => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headOfDepartment">14. Head of Department</Label>
              <Select
                value={formData.headOfDepartment}
                onValueChange={(value) => handleInputChange("headOfDepartment", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select head" />
                </SelectTrigger>
                <SelectContent>
                  {headsOfDepartment.map((head) => (
                    <SelectItem key={head.id} value={head.id}>
                      {head.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary">1. Monthly Salary</Label>
              <Input
                type="number"
                id="salary"
                value={formData.salary}
                onChange={(e) => handleInputChange("salary", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transportAllowance">2. Transport Allowance</Label>
              <Input
                type="number"
                id="transportAllowance"
                value={formData.transportAllowance}
                onChange={(e) => handleInputChange("transportAllowance", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="housingAllowance">3. Housing Allowance</Label>
              <Input
                type="number"
                id="housingAllowance"
                value={formData.housingAllowance}
                onChange={(e) => handleInputChange("housingAllowance", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalAllowance">4. Medical Allowance</Label>
              <Input
                type="number"
                id="medicalAllowance"
                value={formData.medicalAllowance}
                onChange={(e) => handleInputChange("medicalAllowance", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mealAllowance">5. Meal Allowance</Label>
              <Input
                type="number"
                id="mealAllowance"
                value={formData.mealAllowance}
                onChange={(e) => handleInputChange("mealAllowance", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uniformAllowance">6. Uniform Allowance</Label>
              <Input
                type="number"
                id="uniformAllowance"
                value={formData.uniformAllowance}
                onChange={(e) => handleInputChange("uniformAllowance", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="communicationAllowance">7. Communication Allowance</Label>
              <Input
                type="number"
                id="communicationAllowance"
                value={formData.communicationAllowance}
                onChange={(e) => handleInputChange("communicationAllowance", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherAllowances">8. Other Allowances</Label>
              <Input
                type="number"
                id="otherAllowances"
                value={formData.otherAllowances}
                onChange={(e) => handleInputChange("otherAllowances", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxDeduction">9. Tax Deduction</Label>
              <Input
                type="number"
                id="taxDeduction"
                value={formData.taxDeduction}
                onChange={(e) => handleInputChange("taxDeduction", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ssnit">10. SSNIT Number</Label>
              <Input
                type="text"
                id="ssnit"
                value={formData.ssnit}
                onChange={(e) => handleInputChange("ssnit", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier3">11. Tier 3 Contribution</Label>
              <Input
                type="number"
                id="tier3"
                value={formData.tier3}
                onChange={(e) => handleInputChange("tier3", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanDeduction">12. Loan Deduction</Label>
              <Input
                type="number"
                id="loanDeduction"
                value={formData.loanDeduction}
                onChange={(e) => handleInputChange("loanDeduction", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="advanceDeduction">13. Advance Deduction</Label>
              <Input
                type="number"
                id="advanceDeduction"
                value={formData.advanceDeduction}
                onChange={(e) => handleInputChange("advanceDeduction", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherDeductions">14. Other Deductions</Label>
              <Input
                type="number"
                id="otherDeductions"
                value={formData.otherDeductions}
                onChange={(e) => handleInputChange("otherDeductions", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanAmount">15. Loan Amount</Label>
              <Input
                type="number"
                id="loanAmount"
                value={formData.loanAmount}
                onChange={(e) => handleInputChange("loanAmount", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanBalance">16. Loan Balance</Label>
              <Input
                type="number"
                id="loanBalance"
                value={formData.loanBalance}
                onChange={(e) => handleInputChange("loanBalance", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanInstallment">17. Loan Installment</Label>
              <Input
                type="number"
                id="loanInstallment"
                value={formData.loanInstallment}
                onChange={(e) => handleInputChange("loanInstallment", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanStartDate">18. Loan Start Date</Label>
              <Input
                type="date"
                id="loanStartDate"
                value={formData.loanStartDate}
                onChange={(e) => handleInputChange("loanStartDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanEndDate">19. Loan End Date</Label>
              <Input
                type="date"
                id="loanEndDate"
                value={formData.loanEndDate}
                onChange={(e) => handleInputChange("loanEndDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">20. Bank Name</Label>
              <Input
                type="text"
                id="bankName"
                value={formData.bankName}
                onChange={(e) => handleInputChange("bankName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccount">21. Bank Account Number</Label>
              <Input
                type="text"
                id="bankAccount"
                value={formData.bankAccount}
                onChange={(e) => handleInputChange("bankAccount", e.target.value)}
              />
            </div>
          </div>
        </TabsContent>

        {/* <TabsContent value="documents" className="space-y-4">
          <div>
            <Label>Upload Documents</Label>
            <Input type="file" multiple />
          </div>
        </TabsContent> */}
      </Tabs>

      <div className="flex justify-between">
        {currentTab !== "personal" && (
          <Button variant="secondary" onClick={handlePrevious}>
            Previous
          </Button>
        )}
        {currentTab !== "financial" ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
              Submit
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
