"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  MoreHorizontal,
  Users,
  TrendingUp,
  Download,
  Filter,
  Eye,
  Edit,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
} from "lucide-react"

// Mock employee data
const mockEmployees = [
  {
    id: "EMP001",
    firstName: "Kwame",
    lastName: "Asante",
    email: "kwame.asante@company.com",
    phone: "+233 24 123 4567",
    avatar: "/placeholder.svg?height=40&width=40",
    department: "Technology",
    position: "Senior Software Engineer",
    employeeType: "full_time",
    status: "active",
    hireDate: new Date("2022-03-15"),
    salary: 8500,
    manager: "John Manager",
    location: "Accra",
    skills: ["React", "Node.js", "TypeScript"],
    emergencyContact: {
      name: "Ama Asante",
      relationship: "Spouse",
      phone: "+233 24 987 6543",
    },
  },
  {
    id: "EMP002",
    firstName: "Ama",
    lastName: "Osei",
    email: "ama.osei@company.com",
    phone: "+233 20 234 5678",
    avatar: "/placeholder.svg?height=40&width=40",
    department: "Human Resources",
    position: "HR Manager",
    employeeType: "full_time",
    status: "active",
    hireDate: new Date("2021-08-10"),
    salary: 7200,
    manager: "CEO",
    location: "Accra",
    skills: ["HR Management", "Recruitment", "Employee Relations"],
    emergencyContact: {
      name: "Kofi Osei",
      relationship: "Brother",
      phone: "+233 24 876 5432",
    },
  },
  {
    id: "EMP003",
    firstName: "Kofi",
    lastName: "Mensah",
    email: "kofi.mensah@company.com",
    phone: "+233 26 345 6789",
    avatar: "/placeholder.svg?height=40&width=40",
    department: "Finance",
    position: "Financial Analyst",
    employeeType: "full_time",
    status: "on_leave",
    hireDate: new Date("2023-01-20"),
    salary: 5800,
    manager: "Finance Director",
    location: "Kumasi",
    skills: ["Financial Analysis", "Excel", "SAP"],
    emergencyContact: {
      name: "Akosua Mensah",
      relationship: "Mother",
      phone: "+233 24 765 4321",
    },
  },
  {
    id: "EMP004",
    firstName: "Akosua",
    lastName: "Boateng",
    email: "akosua.boateng@company.com",
    phone: "+233 27 456 7890",
    avatar: "/placeholder.svg?height=40&width=40",
    department: "Marketing",
    position: "Marketing Coordinator",
    employeeType: "contract",
    status: "active",
    hireDate: new Date("2023-06-01"),
    salary: 4500,
    manager: "Marketing Manager",
    location: "Accra",
    skills: ["Digital Marketing", "Content Creation", "Social Media"],
    emergencyContact: {
      name: "Yaw Boateng",
      relationship: "Father",
      phone: "+233 24 654 3210",
    },
  },
]

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  on_leave: "bg-yellow-100 text-yellow-800",
  terminated: "bg-red-100 text-red-800",
}

const employeeTypeColors = {
  full_time: "bg-blue-100 text-blue-800",
  part_time: "bg-purple-100 text-purple-800",
  contract: "bg-orange-100 text-orange-800",
  intern: "bg-pink-100 text-pink-800",
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState(mockEmployees)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedDepartment, setSelectedDepartment] = useState("all")

  const [newEmployeeForm, setNewEmployeeForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    employeeType: "",
    hireDate: "",
    salary: "",
    manager: "",
    location: "",
  })

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartment = selectedDepartment === "all" || employee.department === selectedDepartment
    const matchesTab = activeTab === "all" || employee.status === activeTab

    return matchesSearch && matchesDepartment && matchesTab
  })

  const handleAddEmployee = () => {
    const newEmployee = {
      id: `EMP${String(employees.length + 1).padStart(3, "0")}`,
      firstName: newEmployeeForm.firstName,
      lastName: newEmployeeForm.lastName,
      email: newEmployeeForm.email,
      phone: newEmployeeForm.phone,
      avatar: "/placeholder.svg?height=40&width=40",
      department: newEmployeeForm.department,
      position: newEmployeeForm.position,
      employeeType: newEmployeeForm.employeeType,
      status: "active",
      hireDate: new Date(newEmployeeForm.hireDate),
      salary: Number.parseInt(newEmployeeForm.salary),
      manager: newEmployeeForm.manager,
      location: newEmployeeForm.location,
      skills: [],
      emergencyContact: {
        name: "",
        relationship: "",
        phone: "",
      },
    }

    setEmployees([...employees, newEmployee])
    setIsAddEmployeeOpen(false)
    setNewEmployeeForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "",
      position: "",
      employeeType: "",
      hireDate: "",
      salary: "",
      manager: "",
      location: "",
    })
    toast({
      title: "Employee Added",
      description: `${newEmployee.firstName} ${newEmployee.lastName} has been added successfully.`,
    })
  }

  const getEmployeeStats = () => {
    const total = employees.length
    const active = employees.filter((emp) => emp.status === "active").length
    const onLeave = employees.filter((emp) => emp.status === "on_leave").length
    const newHires = employees.filter((emp) => {
      const hireDate = new Date(emp.hireDate)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return hireDate >= thirtyDaysAgo
    }).length

    return { total, active, onLeave, newHires }
  }

  const stats = getEmployeeStats()
  const departments = [...new Set(employees.map((emp) => emp.department))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600">Manage employee information, records, and organizational structure</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      placeholder="Kwame"
                      value={newEmployeeForm.firstName}
                      onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      placeholder="Asante"
                      value={newEmployeeForm.lastName}
                      onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      type="email"
                      placeholder="kwame.asante@company.com"
                      value={newEmployeeForm.email}
                      onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      placeholder="+233 24 123 4567"
                      value={newEmployeeForm.phone}
                      onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={newEmployeeForm.department}
                      onValueChange={(value) => setNewEmployeeForm({ ...newEmployeeForm, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Human Resources">Human Resources</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      placeholder="Software Engineer"
                      value={newEmployeeForm.position}
                      onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, position: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="employeeType">Employee Type</Label>
                    <Select
                      value={newEmployeeForm.employeeType}
                      onValueChange={(value) => setNewEmployeeForm({ ...newEmployeeForm, employeeType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="hireDate">Hire Date</Label>
                    <Input
                      type="date"
                      value={newEmployeeForm.hireDate}
                      onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, hireDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary">Monthly Salary (GH₵)</Label>
                    <Input
                      type="number"
                      placeholder="5000"
                      value={newEmployeeForm.salary}
                      onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, salary: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manager">Manager</Label>
                    <Input
                      placeholder="John Manager"
                      value={newEmployeeForm.manager}
                      onChange={(e) => setNewEmployeeForm({ ...newEmployeeForm, manager: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Select
                      value={newEmployeeForm.location}
                      onValueChange={(value) => setNewEmployeeForm({ ...newEmployeeForm, location: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Accra">Accra</SelectItem>
                        <SelectItem value="Kumasi">Kumasi</SelectItem>
                        <SelectItem value="Tamale">Tamale</SelectItem>
                        <SelectItem value="Cape Coast">Cape Coast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddEmployeeOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddEmployee}>Add Employee</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <p className="text-sm text-gray-600">Total Employees</p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <p className="text-sm text-gray-600">Active</p>
              </div>
              <UserPlus className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.onLeave}</div>
                <p className="text-sm text-gray-600">On Leave</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.newHires}</div>
                <p className="text-sm text-gray-600">New Hires (30d)</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search employees by name, email, ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Department" />
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
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Employees ({employees.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
          <TabsTrigger value="on_leave">On Leave ({stats.onLeave})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={employee.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {employee.firstName[0]}
                          {employee.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </h3>
                          <Badge className={statusColors[employee.status as keyof typeof statusColors]}>
                            {employee.status.replace("_", " ").toUpperCase()}
                          </Badge>
                          <Badge
                            className={employeeTypeColors[employee.employeeType as keyof typeof employeeTypeColors]}
                          >
                            {employee.employeeType.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600">{employee.id}</span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {employee.position}
                          </span>
                          <span className="text-sm text-gray-500">{employee.department}</span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {employee.location}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {employee.email}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {employee.phone}
                          </span>
                          <span className="text-sm text-gray-500">Hired: {employee.hireDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedEmployee(employee)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Employee
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Download Profile
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Employee Profile Modal */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Employee Profile - {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={selectedEmployee.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl">
                    {selectedEmployee.firstName[0]}
                    {selectedEmployee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h2>
                  <p className="text-lg text-gray-600">{selectedEmployee.position}</p>
                  <p className="text-gray-500">{selectedEmployee.department}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={statusColors[selectedEmployee.status as keyof typeof statusColors]}>
                      {selectedEmployee.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <Badge
                      className={employeeTypeColors[selectedEmployee.employeeType as keyof typeof employeeTypeColors]}
                    >
                      {selectedEmployee.employeeType.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{selectedEmployee.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{selectedEmployee.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{selectedEmployee.location}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Employment Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Employee ID:</span>
                      <span>{selectedEmployee.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hire Date:</span>
                      <span>{selectedEmployee.hireDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Manager:</span>
                      <span>{selectedEmployee.manager}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Salary:</span>
                      <span>GH₵ {selectedEmployee.salary.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedEmployee.skills && selectedEmployee.skills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployee.skills.map((skill: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Emergency Contact</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">{selectedEmployee.emergencyContact.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Relationship:</span>
                      <p className="font-medium">{selectedEmployee.emergencyContact.relationship}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <p className="font-medium">{selectedEmployee.emergencyContact.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedEmployee(null)}>
                  Close
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Profile
                </Button>
                <Button>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Employee
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
