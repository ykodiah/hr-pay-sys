"use client"

import { useState, useEffect } from "react"
import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { Search, Filter, Plus, Edit, FileText, Download, Upload, X } from "lucide-react"

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
    salary: "",
    startDate: "",
    dateOfBirth: "",
    address: "",
    emergencyContactName: "",
    emergencyContactTel: "",
    educationalLevel: "",
    gender: "",
    bankName: "",
    bankAccount: "",
    ssnit: "",
    ghanaCard: "",
    documents: [],
    profilePicture: "",
    profilePictureFile: null,
  })

  useEffect(() => {
    loadEmployees()
    loadSubsidiaries()
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

  useEffect(() => {
    const loadCompanyData = () => {
      const companyData = localStorage.getItem("companySettings")
      const subsidiaryData = localStorage.getItem("subsidiaries")

      if (companyData) {
        const company = JSON.parse(companyData)
        setCompanySettings(company)
        // Set default data from main company
        setDivisions(company.divisions || ["Head Office", "Regional Office"])
        setDepartments(
          company.departments || ["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"],
        )
        setLocations(company.locations || ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"])
      }

      if (subsidiaryData) {
        const subs = JSON.parse(subsidiaryData)
        setSubsidiaries(subs)
      } else {
        // Default subsidiaries if none exist
        setSubsidiaries([
          {
            id: "1",
            name: "Akwaaba Tech Solutions",
            divisions: ["Software Development", "IT Consulting"],
            departments: ["Engineering", "Sales", "Support"],
            locations: ["Accra Main", "Accra Branch"],
          },
          {
            id: "2",
            name: "Akwaaba Consulting",
            divisions: ["Business Consulting", "HR Consulting"],
            departments: ["Consulting", "Research", "Training"],
            locations: ["Kumasi Main", "Kumasi North"],
          },
        ])
      }
    }

    loadCompanyData()
  }, [])

  useEffect(() => {
    if (formData.subsidiary) {
      const selectedSubsidiary = subsidiaries.find((s) => s.id === formData.subsidiary)
      if (selectedSubsidiary) {
        setDivisions(selectedSubsidiary.divisions || [])
        setDepartments(selectedSubsidiary.departments || [])
        setLocations(selectedSubsidiary.locations || [])
      }
    } else if (companySettings) {
      setDivisions(companySettings.divisions || ["Head Office", "Regional Office"])
      setDepartments(
        companySettings.departments || ["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"],
      )
      setLocations(companySettings.locations || ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"])
    }
  }, [formData.subsidiary, subsidiaries, companySettings])

  const loadSubsidiaries = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("subsidiaries").select("*")

      if (error) {
        console.error("Error loading subsidiaries:", error)
        // Fallback to localStorage
        const savedSubsidiaries = localStorage.getItem("subsidiaries")
        if (savedSubsidiaries) {
          setSubsidiaries(JSON.parse(savedSubsidiaries))
        }
      } else {
        setSubsidiaries(data || [])
      }
    } catch (error) {
      console.error("Error loading subsidiaries:", error)
      // Fallback to localStorage
      const savedSubsidiaries = localStorage.getItem("subsidiaries")
      if (savedSubsidiaries) {
        setSubsidiaries(JSON.parse(savedSubsidiaries))
      }
    }
  }

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

  const generateEmployeeId = (subsidiaryId?: string) => {
    const companyInitials = "AKWA" // First 4 initials of main company
    let prefix = companyInitials

    if (subsidiaryId && subsidiaries.length > 0) {
      const subsidiary = subsidiaries.find((s) => s.id === subsidiaryId)
      if (subsidiary) {
        const companyFirst2 = companyInitials.substring(0, 2)
        const subsidiaryFirst2 = subsidiary.name.substring(0, 2).toUpperCase()
        prefix = companyFirst2 + subsidiaryFirst2
      }
    }

    const nextNumber = employees.length + 1
    return `${prefix}${String(nextNumber).padStart(4, "0")}`
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
}: {
  employee?: any
  onSubmit: (data: any) => void
  onClose: () => void
  subsidiaries: any[]
  setFormData: (data: any) => void
  formData: any
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

  // const [formData, setFormData] = useState({
  //   employeeId: "",
  //   prefix: employee?.prefix || "",
  //   firstName: employee?.firstName || "",
  //   otherNames: employee?.otherNames || "",
  //   lastName: employee?.lastName || "",
  //   maritalStatus: employee?.maritalStatus || "",
  //   corporateEmail: employee?.corporateEmail || "",
  //   personalEmail: employee?.personalEmail || "",
  //   phone: employee?.phone || "",
  //   position: employee?.position || "",
  //   subsidiary: employee?.subsidiary || "",
  //   division: employee?.division || "",
  //   department: employee?.department || "",
  //   location: employee?.location || "",
  //   contractType: employee?.contractType || "Permanent",
  //   dateOfJoining: employee?.dateOfJoining || "",
  //   dateOfExit: employee?.dateOfExit || "",
  //   status: employee?.status || "Active",
  //   probationPeriod: employee?.probationPeriod || "6",
  //   confirmationDate: employee?.confirmationDate || "",
  //   noticePeriod: employee?.noticePeriod || "",
  //   salary: employee?.salary || "",
  //   startDate: employee?.startDate || "",
  //   dateOfBirth: employee?.dateOfBirth || "",
  //   address: employee?.address || "",
  //   emergencyContactName: employee?.emergencyContactName || "",
  //   emergencyContactTel: employee?.emergencyContactTel || "",
  //   educationalLevel: employee?.educationalLevel || "",
  //   gender: employee?.gender || "",
  //   bankName: employee?.bankName || "",
  //   bankAccount: employee?.bankAccount || "",
  //   ssnit: employee?.ssnit || "",
  //   ghanaCard: employee?.ghanaCard || "",
  //   documents: employee?.documents || [],
  //   profilePicture: employee?.profilePicture || "",
  //   profilePictureFile: null,
  // })

  useEffect(() => {
    if (formData.subsidiary) {
      const selectedSubsidiary = subsidiaries.find((s) => s.id === formData.subsidiary)
      if (selectedSubsidiary) {
        setDivisions(selectedSubsidiary.divisions || [])
        setDepartments(selectedSubsidiary.departments || [])
        setLocations(selectedSubsidiary.locations || [])
      }
    } else {
      // Load main company divisions, departments, locations
      const companyData = localStorage.getItem("companySettings")
      if (companyData) {
        const company = JSON.parse(companyData)
        setDivisions(company.divisions || ["Head Office", "Regional Office"])
        setDepartments(
          company.departments || ["Technology", "Human Resources", "Finance", "Marketing", "Sales", "Operations"],
        )
        setLocations(company.locations || ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"])
      }
    }
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

      const nextNumber = Math.floor(Math.random() * 9999) + 1
      return `${prefix}${String(nextNumber).padStart(4, "0")}`
    }

    setFormData((prev) => ({ ...prev, employeeId: generateId() }))
  }, [formData.subsidiary, subsidiaries])

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
    if (!formData.startDate) newErrors.startDate = "Start date is required"
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

  const handleSubmit = (e: React.FormEvent) => {
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

      setFormData({
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
        salary: "",
        startDate: "",
        dateOfBirth: "",
        address: "",
        emergencyContactName: "",
        emergencyContactTel: "",
        educationalLevel: "",
        gender: "",
        bankName: "",
        bankAccount: "",
        ssnit: "",
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

      // Track document in central system
      await CentralDocumentService.trackUpload({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadSource: "employee-onboarding",
        category: documentType,
        employeeId: formData.firstName ? `${formData.firstName} ${formData.lastName}` : "New Employee",
        metadata: {
          documentType: documentType,
          uploadDate: new Date().toISOString(),
        },
      })

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
    <form onSubmit={handleSubmit} className="space-y-8">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">1. Prefix</Label>
              <Select value={formData.prefix} onValueChange={(value) => handleInputChange("prefix", value)}>
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Select prefix" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mr">Mr</SelectItem>
                  <SelectItem value="Mrs">Mrs</SelectItem>
                  <SelectItem value="Miss">Miss</SelectItem>
                  <SelectItem value="Ms">Ms</SelectItem>
                  <SelectItem value="Dr">Dr</SelectItem>
                  <SelectItem value="Prof">Prof</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">2. First Name *</Label>
              <div className="flex-1">
                <Input
                  value={formData.firstName ?? ""}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Enter first name"
                  className={`form-input ${errors.firstName ? "border-red-500" : ""}`}
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">3. Other Name(s)</Label>
              <Input
                value={formData.otherNames ?? ""}
                onChange={(e) => handleInputChange("otherNames", e.target.value)}
                placeholder="Middle names"
                className="form-input flex-1"
              />
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">4. Last Name *</Label>
              <div className="flex-1">
                <Input
                  value={formData.lastName ?? ""}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Enter last name"
                  className={`form-input ${errors.lastName ? "border-red-500" : ""}`}
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">5. Marital Status</Label>
              <Select
                value={formData.maritalStatus ?? ""}
                onValueChange={(value) => handleInputChange("maritalStatus", value)}
              >
                <SelectTrigger className="form-input flex-1">
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                  <SelectItem value="Separated">Separated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">6. Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger className="form-input flex-1">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">7. Corporate Email Address</Label>
              <div className="flex-1">
                <Input
                  type="email"
                  value={formData.corporateEmail}
                  onChange={(e) => handleInputChange("corporateEmail", e.target.value)}
                  placeholder="employee@company.com"
                  className={`form-input ${errors.corporateEmail ? "border-red-500" : ""}`}
                />
                {errors.corporateEmail && <p className="text-red-500 text-sm mt-1">{errors.corporateEmail}</p>}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">8. Personal Email Address *</Label>
              <div className="flex-1">
                <Input
                  type="email"
                  value={formData.personalEmail}
                  onChange={(e) => handleInputChange("personalEmail", e.target.value)}
                  placeholder="personal@email.com"
                  className={`form-input ${errors.personalEmail ? "border-red-500" : ""}`}
                />
                {errors.personalEmail && <p className="text-red-500 text-sm mt-1">{errors.personalEmail}</p>}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">9. Phone Number *</Label>
              <div className="flex-1">
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+233 XX XXX XXXX"
                  className={`form-input ${errors.phone ? "border-red-500" : ""}`}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">10. Date of Birth</Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                className="form-input flex-1"
              />
            </div>

            <div className="flex items-start gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48 pt-2">11. Address</Label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Full address"
                className="form-input flex-1 min-h-[80px] max-h-[120px] resize-none overflow-y-auto"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">12. Educational Level</Label>
              <Select
                value={formData.educationalLevel}
                onChange={(value) => handleInputChange("educationalLevel", value)}
              >
                <SelectTrigger className="form-input flex-1">
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JHS">JHS</SelectItem>
                  <SelectItem value="SHS">SHS</SelectItem>
                  <SelectItem value="Diploma">Diploma</SelectItem>
                  <SelectItem value="HND">HND</SelectItem>
                  <SelectItem value="Degree">Degree</SelectItem>
                  <SelectItem value="Masters">Masters</SelectItem>
                  <SelectItem value="Doctorate">Doctorate</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Other Certificate">Other Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">13. Emergency Contact Name</Label>
              <Input
                value={formData.emergencyContactName}
                onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                placeholder="Contact person name"
                className="form-input flex-1"
              />
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">14. Emergency Contact Tel</Label>
              <Input
                value={formData.emergencyContactTel}
                onChange={(e) => handleInputChange("emergencyContactTel", e.target.value)}
                placeholder="+233 XX XXX XXXX"
                className="form-input flex-1"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="employment" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">Employee ID</Label>
              <Input
                value={formData.employeeId}
                readOnly
                className="form-input flex-1 bg-gray-50"
                placeholder="Auto-generated"
              />
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">1. Position *</Label>
              <Input
                value={formData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                placeholder="Enter position/job title"
                className={`form-input ${errors.position ? "border-red-500" : ""}`}
              />
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">2. Subsidiary</Label>
              <Select value={formData.subsidiary} onValueChange={(value) => handleInputChange("subsidiary", value)}>
                <SelectTrigger className="form-input flex-1">
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

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">3. Division / Branch</Label>
              <Select value={formData.division} onValueChange={(value) => handleInputChange("division", value)}>
                <SelectTrigger className="form-input flex-1">
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

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">4. Department *</Label>
              <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                <SelectTrigger className={`form-input flex-1 ${errors.department ? "border-red-500" : ""}`}>
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
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">5. Location *</Label>
              <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                <SelectTrigger className={`form-input flex-1 ${errors.location ? "border-red-500" : ""}`}>
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
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">6. Contract Type *</Label>
              <Select value={formData.contractType} onValueChange={(value) => handleInputChange("contractType", value)}>
                <SelectTrigger className="form-input flex-1">
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Permanent">Permanent</SelectItem>
                  <SelectItem value="Temporary">Temporary</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Outsourced">Outsourced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">7. Date of Joining *</Label>
              <Input
                type="date"
                value={formData.dateOfJoining}
                onChange={(e) => handleInputChange("dateOfJoining", e.target.value)}
                className="form-input flex-1"
              />
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">8. Date of Exit</Label>
              <Input
                type="date"
                value={formData.dateOfExit}
                onChange={(e) => handleInputChange("dateOfExit", e.target.value)}
                className="form-input flex-1"
              />
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">9. Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className="form-input flex-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.status === "Inactive" && (
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium text-gray-700 w-48">Reason for Inactive Status</Label>
                <Select onValueChange={(value) => handleInputChange("inactiveReason", value)}>
                  <SelectTrigger className="form-input flex-1">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Resignation">Resignation</SelectItem>
                    <SelectItem value="Termination">Termination</SelectItem>
                    <SelectItem value="Death">Death</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                    <SelectItem value="Leave without pay">Leave without pay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">10. Probation Period (months)</Label>
              <Select
                value={formData.probationPeriod}
                onValueChange={(value) => handleInputChange("probationPeriod", value)}
              >
                <SelectTrigger className="form-input flex-1">
                  <SelectValue placeholder="Select probation period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="9">9 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">11. Confirmation Date</Label>
              <Input
                type="date"
                value={formData.confirmationDate}
                onChange={(e) => handleInputChange("confirmationDate", e.target.value)}
                className="form-input flex-1"
              />
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">12. Notice Period</Label>
              <Input
                value={formData.noticePeriod}
                onChange={(e) => handleInputChange("noticePeriod", e.target.value)}
                placeholder="e.g., 1 month, 3 months"
                className="form-input flex-1"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="salary" className="text-base font-medium mb-2 block">
                Monthly Salary (GHS) *
              </Label>
              <Input
                id="salary"
                type="number"
                value={formData.salary}
                onChange={(e) => handleInputChange("salary", Number.parseFloat(e.target.value))}
                placeholder="5000"
                className={`h-12 ${errors.salary ? "border-red-500" : ""}`}
              />
              {errors.salary && <p className="text-red-500 text-sm mt-1">{errors.salary}</p>}
            </div>
            <div>
              <Label htmlFor="bankName" className="text-base font-medium mb-2 block">
                Bank Name
              </Label>
              <Select value={formData.bankName} onValueChange={(value) => handleInputChange("bankName", value)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GT Bank">GT Bank</SelectItem>
                  <SelectItem value="Ecobank">Ecobank</SelectItem>
                  <SelectItem value="Standard Chartered">Standard Chartered</SelectItem>
                  <SelectItem value="Fidelity Bank">Fidelity Bank</SelectItem>
                  <SelectItem value="Access Bank">Access Bank</SelectItem>
                  <SelectItem value="Absa Bank">Absa Bank</SelectItem>
                  <SelectItem value="Stanbic Bank">Stanbic Bank</SelectItem>
                  <SelectItem value="UMB Bank">UMB Bank</SelectItem>
                  <SelectItem value="CAL Bank">CAL Bank</SelectItem>
                  <SelectItem value="GCB Bank">GCB Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="bankAccount" className="text-base font-medium mb-2 block">
                Bank Account Number
              </Label>
              <Input
                id="bankAccount"
                value={formData.bankAccount}
                onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                placeholder="Account number"
                className="h-12"
              />
            </div>
            <div>
              <Label htmlFor="ssnit" className="text-base font-medium mb-2 block">
                SSNIT Number
              </Label>
              <Input
                id="ssnit"
                value={formData.ssnit}
                onChange={(e) => handleInputChange("ssnit", e.target.value)}
                placeholder="GHA-123456789-0"
                className="h-12"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ghanaCard" className="text-base font-medium mb-2 block">
              Ghana Card Number
            </Label>
            <Input
              id="ghanaCard"
              value={formData.ghanaCard}
              onChange={(e) => handleInputChange("ghanaCard", e.target.value)}
              placeholder="GHA-123456789-0"
              className="h-12"
            />
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>

            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">1. Academic Certificate(s)</span>
                  <p className="text-sm text-gray-500">Educational certificates and transcripts</p>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    id="academic-certificates"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleDocumentUpload("Academic Certificate(s)", file)
                      }
                    }}
                  />
                  <Button type="button" variant="outline" className="bg-transparent">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">2. Passport Picture</span>
                  <p className="text-sm text-gray-500">Professional passport-sized photograph</p>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    id="passport-picture"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleDocumentUpload("Passport Picture", file)
                      }
                    }}
                  />
                  <Button type="button" variant="outline" className="bg-transparent">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">3. Resume & Application Letter</span>
                  <p className="text-sm text-gray-500">Current CV and cover letter</p>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    id="resume-application"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleDocumentUpload("Resume & Application Letter", file)
                      }
                    }}
                  />
                  <Button type="button" variant="outline" className="bg-transparent">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">4. Passport</span>
                  <p className="text-sm text-gray-500">Valid passport copy</p>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    id="passport-copy"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleDocumentUpload("Passport", file)
                      }
                    }}
                  />
                  <Button type="button" variant="outline" className="bg-transparent">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">5. National ID</span>
                  <p className="text-sm text-gray-500">Ghana Card or Voter's ID</p>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    id="national-id"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleDocumentUpload("National ID", file)
                      }
                    }}
                  />
                  <Button type="button" variant="outline" className="bg-transparent">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">6. Medical Report</span>
                  <p className="text-sm text-gray-500">Health clearance certificate</p>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    id="medical-report"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleDocumentUpload("Medical Report", file)
                      }
                    }}
                  />
                  <Button type="button" variant="outline" className="bg-transparent">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">7. Police Report</span>
                  <p className="text-sm text-gray-500">Criminal background check</p>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    id="police-report"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleDocumentUpload("Police Report", file)
                      }
                    }}
                  />
                  <Button type="button" variant="outline" className="bg-transparent">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">8. Other Uploads</span>
                  <p className="text-sm text-gray-500">Additional supporting documents</p>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    id="other-uploads"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      if (files.length > 0) {
                        console.log(
                          "[v0] Other documents selected:",
                          files.map((f) => f.name),
                        )
                        files.forEach((file) => {
                          handleDocumentUpload("Other Uploads", file)
                        })
                      }
                    }}
                  />
                  <Button type="button" variant="outline" className="bg-transparent">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>
            </div>

            {formData.documents && formData.documents.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Uploaded Documents</h4>
                <div className="space-y-2">
                  {formData.documents.map((doc: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm">{doc.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({doc.type})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            documents: prev.documents?.filter((_, i) => i !== index) || [],
                          }))
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Documents are stored securely in the employee's document vault. Supported file
                formats: PDF, DOC, DOCX, JPG, PNG. Maximum file size: 5MB per document.
              </p>
            </div>
          </div>
        </TabsContent>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose} className="px-6 bg-transparent">
            Cancel
          </Button>
          {currentTab === "documents" ? (
            <Button
              type="submit"
              className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSubmit}
            >
              Save Employee
            </Button>
          ) : (
            <Button type="button" className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </Tabs>
    </form>
  )
}

function FormRow({
  label,
  children,
  full = false,
  error,
}: {
  label: string
  children: React.ReactNode
  full?: boolean
  error?: string
}) {
  return (
    <div className={full ? "lg:col-span-2" : ""}>
      <div className="grid items-center gap-3 sm:grid-cols-[200px_1fr]">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        <div>
          {children}
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
      </div>
    </div>
  )
}

function EmployeeProfile({ employee }: { employee: any }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="employment">Employment</TabsTrigger>
        <TabsTrigger value="payroll">Payroll</TabsTrigger>
        <TabsTrigger value="leave">Leave</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={employee.avatar || "/placeholder.svg"} />
            <AvatarFallback className="text-lg">
              {employee.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{employee.name}</h2>
            <p className="text-gray-600">{employee.position}</p>
            <Badge className="mt-1">{employee.employeeId}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span>{employee.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span>{employee.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date of Birth:</span>
                <span>{employee.dateOfBirth || "Not provided"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="text-right">{employee.address || "Not provided"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Emergency Contact:</span>
                <span className="text-right">{employee.emergencyContact || "Not provided"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Department:</span>
                <span>{employee.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span>{employee.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span>{employee.startDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant={employee.status === "Active" ? "default" : "secondary"}>{employee.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Salary:</span>
                <span className="font-semibold">GHS {employee.salary?.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Bank Name:</span>
                <span>{employee.bankName || "Not provided"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Number:</span>
                <span>{employee.bankAccount || "Not provided"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SSNIT Number:</span>
                <span>{employee.ssnit || "Not provided"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ghana Card Number:</span>
                <span>{employee.ghanaCard || "Not provided"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="employment" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Employment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-2 border-emerald-500 pl-4">
                <h4 className="font-semibold">{employee.position}</h4>
                <p className="text-sm text-gray-600">{employee.department}</p>
                <p className="text-xs text-gray-500">{employee.startDate} - Present</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="payroll" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-emerald-600">GHS {employee.salary?.toLocaleString()}</div>
              <p className="text-sm text-gray-600">Monthly Salary</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">GHS {((employee.salary || 0) * 0.055).toFixed(0)}</div>
              <p className="text-sm text-gray-600">SSNIT (5.5%)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">GHS {((employee.salary || 0) * 0.05).toFixed(0)}</div>
              <p className="text-sm text-gray-600">Tier 3 (5%)</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="leave" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{employee.leaveBalance?.annual || 0}</div>
              <p className="text-sm text-gray-600">Annual Leave</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{employee.leaveBalance?.sick || 0}</div>
              <p className="text-sm text-gray-600">Sick Leave</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{employee.leaveBalance?.casual || 0}</div>
              <p className="text-sm text-gray-600">Casual Leave</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="documents" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Employee Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {employee.documents?.length > 0 ? (
                employee.documents.map((doc: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      <span>{doc}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No documents uploaded</p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
