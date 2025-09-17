"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, MoreHorizontal, Mail, Phone, MapPin, Calendar, Users } from "lucide-react"

// Mock employee data
const employees = [
  {
    id: "emp_001",
    firstName: "Akosua",
    lastName: "Mensah",
    email: "akosua.mensah@akwaabatech.com",
    phone: "+233244123456",
    position: "HR Manager",
    department: "Human Resources",
    location: "Head Office",
    hireDate: "2023-01-15",
    baseSalary: 4500,
    status: "ACTIVE",
  },
  {
    id: "emp_002",
    firstName: "Kwame",
    lastName: "Asante",
    email: "kwame.asante@akwaabatech.com",
    phone: "+233244234567",
    position: "Software Developer",
    department: "Information Technology",
    location: "Head Office",
    hireDate: "2023-03-01",
    baseSalary: 3800,
    status: "ACTIVE",
  },
  {
    id: "emp_003",
    firstName: "Ama",
    lastName: "Osei",
    email: "ama.osei@akwaabatech.com",
    phone: "+233244345678",
    position: "Accountant",
    department: "Finance",
    location: "Kumasi Branch",
    hireDate: "2023-02-10",
    baseSalary: 3200,
    status: "ACTIVE",
  },
  {
    id: "emp_004",
    firstName: "Kofi",
    lastName: "Boateng",
    email: "kofi.boateng@akwaabatech.com",
    phone: "+233244456789",
    position: "Operations Coordinator",
    department: "Operations",
    location: "Head Office",
    hireDate: "2023-04-20",
    baseSalary: 2800,
    status: "SUSPENDED",
  },
]

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartment = selectedDepartment === "all" || employee.department === selectedDepartment

    return matchesSearch && matchesDepartment
  })

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-3xl text-gray-900">Employees</h1>
          <p className="text-gray-600 mt-2">Manage your workforce and employee information</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
            </select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">3</div>
            <p className="text-sm text-gray-600">Active Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">1</div>
            <p className="text-sm text-gray-600">Suspended</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">GHS 14,300</div>
            <p className="text-sm text-gray-600">Total Monthly Salary</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">4</div>
            <p className="text-sm text-gray-600">Departments</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <div className="grid gap-6">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                    {employee.firstName[0]}
                    {employee.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-serif font-semibold text-lg">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <Badge
                        variant={employee.status === "ACTIVE" ? "default" : "secondary"}
                        className={employee.status === "ACTIVE" ? "bg-green-100 text-green-800" : ""}
                      >
                        {employee.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 font-medium">{employee.position}</p>
                    <p className="text-sm text-gray-500">{employee.department}</p>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{employee.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{employee.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{employee.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Hired {new Date(employee.hireDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold text-lg">GHS {employee.baseSalary.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Monthly Salary</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No employees found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or add a new employee.</p>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
