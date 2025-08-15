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
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
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
  Building,
  CreditCard,
  FileText,
  Download,
  Upload,
  Eye,
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
    address: "123 Liberation Road, Accra",
    emergencyContact: "Akosua Asante - +233 20 111 2222",
    bankAccount: "1234567890",
    bankName: "GCB Bank",
    ssnit: "C123456789012",
    tier2Provider: "GLICO Pensions",
    tier3Contribution: 5, // percentage
    allowances: {
      transport: 500,
      housing: 1200,
      medical: 300,
    },
    taxableAllowances: 800,
    nonTaxableAllowances: 1200,
    leaveBalance: 21,
    notes: "Excellent performer, due for promotion review",
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
    address: "456 Unity Avenue, Kumasi",
    emergencyContact: "Kofi Osei - +233 20 222 3333",
    bankAccount: "0987654321",
    bankName: "Ecobank Ghana",
    ssnit: "C234567890123",
    tier2Provider: "Enterprise Trustees",
    tier3Contribution: 5,
    allowances: {
      transport: 400,
      housing: 1000,
      medical: 250,
    },
    taxableAllowances: 750,
    nonTaxableAllowances: 1100,
    leaveBalance: 25,
    notes: "Highly experienced in HR management",
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
    dateOfBirth: "1992-03-18",
    address: "789 Freedom Street, Takoradi",
    emergencyContact: "Ama Mensah - +233 20 333 4444",
    bankAccount: "1122334455",
    bankName: "Standard Chartered",
    ssnit: "C345678901234",
    tier2Provider: "Petra Trust",
    tier3Contribution: 5,
    allowances: {
      transport: 300,
      housing: 900,
      medical: 200,
    },
    taxableAllowances: 600,
    nonTaxableAllowances: 1000,
    leaveBalance: 20,
    notes: "Strong digital marketing skills",
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
    dateOfBirth: "1988-11-05",
    address: "101 Independence Lane, Accra",
    emergencyContact: "Yaw Boateng - +233 20 444 5555",
    bankAccount: "5566778899",
    bankName: "Absa Bank Ghana",
    ssnit: "C456789012345",
    tier2Provider: "Dalex Finance",
    tier3Contribution: 5,
    allowances: {
      transport: 450,
      housing: 1100,
      medical: 275,
    },
    taxableAllowances: 700,
    nonTaxableAllowances: 950,
    leaveBalance: 18,
    notes: "Skilled in financial analysis",
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
    dateOfBirth: "1995-06-12",
    address: "222 Unity Road, Tamale",
    emergencyContact: "Akosua Adjei - +233 20 555 6666",
    bankAccount: "9988776655",
    bankName: "Fidelity Bank",
    ssnit: "C567890123456",
    tier2Provider: "Metropolitan Pensions",
    tier3Contribution: 5,
    allowances: {
      transport: 350,
      housing: 850,
      medical: 175,
    },
    taxableAllowances: 650,
    nonTaxableAllowances: 900,
    leaveBalance: 22,
    notes: "Outstanding sales record",
  },
]

export default function EmployeesPage() {
  const [employees, setEmployees] = useState(initialEmployees)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const handleAddEmployee = (employeeData: any) => {
    const newEmployee = {
      ...employeeData,
      id: Math.max(...employees.map((e) => e.id)) + 1,
      employeeId: `EMP${String(Math.max(...employees.map((e) => Number.parseInt(e.employeeId.slice(3)))) + 1).padStart(3, "0")}`,
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
      description: `${employeeData.name}'s information has been updated.`,
    })
  }

  const handleDeleteEmployee = (employeeId: number) => {
    setEmployees(employees.filter((emp) => emp.id !== employeeId))
    toast({
      title: "Employee Removed",
      description: "Employee has been removed from the system.",
      variant: "destructive",
    })
  }

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || employee.department === selectedDepartment
    return matchesSearch && matchesDepartment
  })

  const departments = [...new Set(employees.map((emp) => emp.department))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600">Manage your team members and their information</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <EmployeeForm onSubmit={handleAddEmployee} onClose={() => setIsAddDialogOpen(false)} />
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
                placeholder="Search employees by name, email, or position..."
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
          <CardTitle>Employee Directory</CardTitle>
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
                    <h3 className="font-semibold text-gray-900">{employee.name}</h3>
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
                          setIsViewDialogOpen(true)
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
                        <Calendar className="w-4 h-4 mr-2" />
                        View Leave History
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Briefcase className="w-4 h-4 mr-2" />
                        Payroll Details
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove Employee
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently remove {employee.name} from the
                              system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remove Employee
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && <EmployeeDetails employee={selectedEmployee} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <EmployeeForm
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

function EmployeeForm({
  employee,
  onSubmit,
  onClose,
}: { employee?: any; onSubmit: (data: any) => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: employee?.name || "",
    email: employee?.email || "",
    phone: employee?.phone || "",
    position: employee?.position || "",
    department: employee?.department || "",
    location: employee?.location || "",
    salary: employee?.salary || "",
    startDate: employee?.startDate || "",
    dateOfBirth: employee?.dateOfBirth || "",
    address: employee?.address || "",
    emergencyContact: employee?.emergencyContact || "",
    bankAccount: employee?.bankAccount || "",
    bankName: employee?.bankName || "",
    ssnit: employee?.ssnit || "",
    tier2Provider: employee?.tier2Provider || "",
    tier3Contribution: employee?.tier3Contribution || 5,
    transportAllowance: employee?.allowances?.transport || 0,
    housingAllowance: employee?.allowances?.housing || 0,
    medicalAllowance: employee?.allowances?.medical || 0,
    taxableAllowances: employee?.taxableAllowances || 0,
    nonTaxableAllowances: employee?.nonTaxableAllowances || 0,
    notes: employee?.notes || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      allowances: {
        transport: Number.parseFloat(formData.transportAllowance) || 0,
        housing: Number.parseFloat(formData.housingAllowance) || 0,
        medical: Number.parseFloat(formData.medicalAllowance) || 0,
      },
      salary: Number.parseFloat(formData.salary) || 0,
      taxableAllowances: Number.parseFloat(formData.taxableAllowances) || 0,
      nonTaxableAllowances: Number.parseFloat(formData.nonTaxableAllowances) || 0,
      tier3Contribution: Number.parseFloat(formData.tier3Contribution) || 5,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="payroll">Payroll & Benefits</TabsTrigger>
          <TabsTrigger value="additional">Additional Info</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="employee@company.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+233 XX XXX XXXX"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address"
            />
          </div>

          <div>
            <Label htmlFor="emergencyContact">Emergency Contact</Label>
            <Input
              id="emergencyContact"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              placeholder="Name - Phone Number"
            />
          </div>
        </TabsContent>

        <TabsContent value="employment" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Job title"
                required
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
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
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
              >
                <SelectTrigger>
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
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salary">Monthly Salary (GHS)</Label>
              <Input
                id="salary"
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="5000"
                required
              />
            </div>
            <div>
              <Label htmlFor="tier3Contribution">Tier 3 Contribution (%)</Label>
              <Input
                id="tier3Contribution"
                type="number"
                min="0"
                max="16.5"
                value={formData.tier3Contribution}
                onChange={(e) => setFormData({ ...formData, tier3Contribution: e.target.value })}
                placeholder="5"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Allowances</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="transportAllowance">Transport (GHS)</Label>
                <Input
                  id="transportAllowance"
                  type="number"
                  value={formData.transportAllowance}
                  onChange={(e) => setFormData({ ...formData, transportAllowance: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="housingAllowance">Housing (GHS)</Label>
                <Input
                  id="housingAllowance"
                  type="number"
                  value={formData.housingAllowance}
                  onChange={(e) => setFormData({ ...formData, housingAllowance: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="medicalAllowance">Medical (GHS)</Label>
                <Input
                  id="medicalAllowance"
                  type="number"
                  value={formData.medicalAllowance}
                  onChange={(e) => setFormData({ ...formData, medicalAllowance: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxableAllowances">Other Taxable Allowances (GHS)</Label>
              <Input
                id="taxableAllowances"
                type="number"
                value={formData.taxableAllowances}
                onChange={(e) => setFormData({ ...formData, taxableAllowances: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="nonTaxableAllowances">Non-Taxable Allowances (GHS)</Label>
              <Input
                id="nonTaxableAllowances"
                type="number"
                value={formData.nonTaxableAllowances}
                onChange={(e) => setFormData({ ...formData, nonTaxableAllowances: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Select
                value={formData.bankName}
                onValueChange={(value) => setFormData({ ...formData, bankName: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GCB Bank">GCB Bank</SelectItem>
                  <SelectItem value="Ecobank Ghana">Ecobank Ghana</SelectItem>
                  <SelectItem value="Standard Chartered">Standard Chartered</SelectItem>
                  <SelectItem value="Absa Bank Ghana">Absa Bank Ghana</SelectItem>
                  <SelectItem value="Fidelity Bank">Fidelity Bank</SelectItem>
                  <SelectItem value="Zenith Bank">Zenith Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bankAccount">Bank Account Number</Label>
              <Input
                id="bankAccount"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                placeholder="Account number"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="additional" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ssnit">SSNIT Number</Label>
              <Input
                id="ssnit"
                value={formData.ssnit}
                onChange={(e) => setFormData({ ...formData, ssnit: e.target.value })}
                placeholder="C123456789012"
              />
            </div>
            <div>
              <Label htmlFor="tier2Provider">Tier 2 Provider</Label>
              <Select
                value={formData.tier2Provider}
                onValueChange={(value) => setFormData({ ...formData, tier2Provider: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLICO Pensions">GLICO Pensions</SelectItem>
                  <SelectItem value="Enterprise Trustees">Enterprise Trustees</SelectItem>
                  <SelectItem value="Petra Trust">Petra Trust</SelectItem>
                  <SelectItem value="Dalex Finance">Dalex Finance</SelectItem>
                  <SelectItem value="Metropolitan Pensions">Metropolitan Pensions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information..."
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          {employee ? "Update Employee" : "Add Employee"}
        </Button>
      </div>
    </form>
  )
}

function EmployeeDetails({ employee }: { employee: any }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="payroll">Payroll</TabsTrigger>
        <TabsTrigger value="leave">Leave</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Employee ID:</span>
                <span className="font-medium">{employee.employeeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Full Name:</span>
                <span className="font-medium">{employee.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date of Birth:</span>
                <span className="font-medium">{employee.dateOfBirth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{employee.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{employee.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="font-medium text-right">{employee.address}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Position:</span>
                <span className="font-medium">{employee.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Department:</span>
                <span className="font-medium">{employee.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{employee.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium">{employee.startDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant={employee.status === "Active" ? "default" : "secondary"}>{employee.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Leave Balance:</span>
                <span className="font-medium">{employee.leaveBalance} days</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact & Banking</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Emergency Contact</h4>
              <p className="text-gray-600">{employee.emergencyContact}</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Banking Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank:</span>
                  <span className="font-medium">{employee.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account:</span>
                  <span className="font-medium">{employee.bankAccount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {employee.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{employee.notes}</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="payroll" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Salary & Allowances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Salary:</span>
                <span className="font-medium">GHS {employee.salary?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transport Allowance:</span>
                <span className="font-medium">GHS {employee.allowances?.transport?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Housing Allowance:</span>
                <span className="font-medium">GHS {employee.allowances?.housing?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Medical Allowance:</span>
                <span className="font-medium">GHS {employee.allowances?.medical?.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total Gross:</span>
                  <span>
                    GHS{" "}
                    {(
                      employee.salary +
                      (employee.allowances?.transport || 0) +
                      (employee.allowances?.housing || 0) +
                      (employee.allowances?.medical || 0) +
                      (employee.taxableAllowances || 0) +
                      (employee.nonTaxableAllowances || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pension Contributions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">SSNIT Number:</span>
                <span className="font-medium">{employee.ssnit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tier 2 Provider:</span>
                <span className="font-medium">{employee.tier2Provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tier 3 Contribution:</span>
                <span className="font-medium">{employee.tier3Contribution}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="leave">
        <Card>
          <CardHeader>
            <CardTitle>Leave Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">{employee.leaveBalance}</div>
                <div className="text-sm text-gray-600">Days Remaining</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">5</div>
                <div className="text-sm text-gray-600">Days Used</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">26</div>
                <div className="text-sm text-gray-600">Total Allocation</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Employee Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Employment Contract</span>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-gray-500" />
                  <span>ID Copy</span>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-gray-500" />
                  <span>CV/Resume</span>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
