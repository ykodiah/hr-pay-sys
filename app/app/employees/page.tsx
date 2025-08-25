"use client"
import { useState } from "react"
import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  User,
  FileText,
  Download,
  Upload,
} from "lucide-react"

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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState(initialEmployees)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || employee.department === selectedDepartment
    return matchesSearch && matchesDepartment
  })

  const departments = [...new Set(employees.map((emp) => emp.department))]

  const handleAddEmployee = (employeeData: any) => {
    const newEmployee = {
      ...employeeData,
      id: employees.length + 1,
      employeeId: `EMP${String(employees.length + 1).padStart(3, "0")}`,
      leaveBalance: { annual: 21, sick: 10, casual: 5 },
      documents: [],
    }
    setEmployees([...employees, newEmployee])
    setIsAddDialogOpen(false)
    toast({
      title: "Employee Added",
      description: `${employeeData.name} has been successfully added to the system.`,
    })
  }

  const handleEditEmployee = (employeeData: any) => {
    setEmployees(employees.map((emp) => (emp.id === selectedEmployee.id ? { ...emp, ...employeeData } : emp)))
    setIsEditDialogOpen(false)
    setSelectedEmployee(null)
    toast({
      title: "Employee Updated",
      description: "Employee information has been successfully updated.",
    })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600">Manage your team members and their information</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Data</DialogTitle>
              </DialogHeader>
              <ImportDataDialog
                onImport={handleImportEmployees}
                onDownloadTemplate={downloadTemplate}
                onClose={() => setIsImportDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="text-white hover:opacity-90"
                style={{
                  backgroundColor: "var(--theme-primary-600)",
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] overflow-y-auto p-12">
              <DialogHeader className="mb-8">
                <DialogTitle className="text-3xl font-semibold">Add New Employee</DialogTitle>
              </DialogHeader>
              <AddEmployeeForm onSubmit={handleAddEmployee} onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
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
                {departments.map((dept) => (
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
            <div className="text-2xl font-bold text-gray-900">{departments.length}</div>
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
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={employee.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {employee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {employee.employeeId}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{employee.position}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <Mail className="w-3 h-3 mr-1" />
                        {employee.email}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Phone className="w-3 h-3 mr-1" />
                        {employee.phone}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="w-3 h-3 mr-1" />
                        {employee.location}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">GHS {employee.salary?.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{employee.department}</p>
                  </div>
                  <Badge
                    variant={employee.status === "Active" ? "default" : "secondary"}
                    className={
                      employee.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800"
                    }
                  >
                    {employee.status}
                  </Badge>
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
                          setIsProfileDialogOpen(true)
                        }}
                      >
                        <User className="w-4 h-4 mr-2" />
                        View Profile
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
                        <Calendar className="w-4 h-4 mr-2" />
                        Leave History
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Briefcase className="w-4 h-4 mr-2" />
                        Payroll Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteEmployee(employee.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Employee
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Employee Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
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
            />
          )}
        </DialogContent>
      </Dialog>
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
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file.",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file)
      processFile(file)
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
}: {
  employee?: any
  onSubmit: (data: any) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    prefix: employee?.prefix || "",
    firstName: employee?.firstName || "",
    otherNames: employee?.otherNames || "",
    lastName: employee?.lastName || "",
    maritalStatus: employee?.maritalStatus || "",
    corporateEmail: employee?.corporateEmail || "",
    personalEmail: employee?.personalEmail || "",
    phone: employee?.phone || "",
    position: employee?.position || "",
    department: employee?.department || "",
    salary: employee?.salary || "",
    location: employee?.location || "",
    startDate: employee?.startDate || "",
    dateOfBirth: employee?.dateOfBirth || "",
    address: employee?.address || "",
    emergencyContactName: employee?.emergencyContactName || "",
    emergencyContactTel: employee?.emergencyContactTel || "",
    educationalLevel: employee?.educationalLevel || "",
    gender: employee?.gender || "",
    bankName: employee?.bankName || "",
    bankAccount: employee?.bankAccount || "",
    ssnit: employee?.ssnit || "",
    ghanaCard: employee?.ghanaCard || "",
    status: employee?.status || "Active",
  })

  const [errors, setErrors] = useState<any>({})

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
      onSubmit(formData)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Tabs defaultValue="personal" className="w-full">
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
                  value={formData.firstName}
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
                value={formData.otherNames}
                onChange={(e) => handleInputChange("otherNames", e.target.value)}
                placeholder="Middle names"
                className="form-input flex-1"
              />
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700 w-48">4. Last Name *</Label>
              <div className="flex-1">
                <Input
                  value={formData.lastName}
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
                value={formData.maritalStatus}
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
                onValueChange={(value) => handleInputChange("educationalLevel", value)}
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
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="position" className="text-base font-medium mb-2 block">
                Position *
              </Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                placeholder="Job title"
                className={`h-12 ${errors.position ? "border-red-500" : ""}`}
              />
              {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position}</p>}
            </div>
            <div>
              <Label htmlFor="department" className="text-base font-medium mb-2 block">
                Department *
              </Label>
              <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                <SelectTrigger className={`h-12 ${errors.department ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Human Resources">Human Resources</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
              {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="location" className="text-base font-medium mb-2 block">
                Location *
              </Label>
              <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                <SelectTrigger className={`h-12 ${errors.location ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Accra">Accra</SelectItem>
                  <SelectItem value="Kumasi">Kumasi</SelectItem>
                  <SelectItem value="Takoradi">Takoradi</SelectItem>
                  <SelectItem value="Tamale">Tamale</SelectItem>
                  <SelectItem value="Cape Coast">Cape Coast</SelectItem>
                </SelectContent>
              </Select>
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>
            <div>
              <Label htmlFor="startDate" className="text-base font-medium mb-2 block">
                Start Date *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className={`h-12 ${errors.startDate ? "border-red-500" : ""}`}
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="status" className="text-base font-medium mb-2 block">
              Employment Status
            </Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
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
                <Button type="button" variant="outline" className="bg-transparent">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">2. Passport Picture</span>
                  <p className="text-sm text-gray-500">Professional passport-sized photograph</p>
                </div>
                <Button type="button" variant="outline" className="bg-transparent">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">3. Resume & Application Letter</span>
                  <p className="text-sm text-gray-500">Current CV and cover letter</p>
                </div>
                <Button type="button" variant="outline" className="bg-transparent">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">4. Passport</span>
                  <p className="text-sm text-gray-500">Valid passport copy</p>
                </div>
                <Button type="button" variant="outline" className="bg-transparent">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">5. National ID</span>
                  <p className="text-sm text-gray-500">Ghana Card or Voter's ID</p>
                </div>
                <Button type="button" variant="outline" className="bg-transparent">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
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
                        console.log("[v0] Medical Report file selected:", file.name)
                        // Handle file upload logic here
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
                <Button type="button" variant="outline" className="bg-transparent">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">8. Other Uploads</span>
                  <p className="text-sm text-gray-500">Additional supporting documents</p>
                </div>
                <Button type="button" variant="outline" className="bg-transparent">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Supported file formats: PDF, DOC, DOCX, JPG, PNG. Maximum file size: 5MB per
                document.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onClose} className="px-6 bg-transparent">
          Cancel
        </Button>
        <Button type="submit" className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit}>
          {employee ? "Update Employee" : "Add Employee"}
        </Button>
      </div>
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
                employee.documents.map((doc: string, index: number) => (
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
