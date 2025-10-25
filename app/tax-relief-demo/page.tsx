"use client"

import { EmployeeCardWithTaxReliefs } from "@/components/employee-card-with-tax-reliefs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Receipt, Users, Calculator } from "lucide-react"
import { useState } from "react"

// Sample employees with different profiles for tax relief demonstration
const sampleEmployees = [
  {
    id: "emp-001",
    employee_id: "EMP001",
    display_name: "John Doe",
    position: "Software Engineer",
    department: "Engineering",
    status: "Active",
    monthly_salary: 5000,
    maritalStatus: "married" as const,
    numberOfChildren: 2,
    age: 35,
    isDisabled: false,
    assignedReliefs: ["relief-001", "relief-002", "relief-003"],
    customReliefAmounts: {
      "relief-001": 402,
      "relief-002": 402,
      "relief-003": 180 // 2 children × 90
    }
  },
  {
    id: "emp-002",
    employee_id: "EMP002",
    display_name: "Sarah Johnson",
    position: "HR Manager",
    department: "Human Resources",
    status: "Active",
    monthly_salary: 4500,
    maritalStatus: "single" as const,
    numberOfChildren: 0,
    age: 28,
    isDisabled: false,
    assignedReliefs: ["relief-001"],
    customReliefAmounts: {
      "relief-001": 402
    }
  },
  {
    id: "emp-003",
    employee_id: "EMP003",
    display_name: "Michael Brown",
    position: "Senior Developer",
    department: "Engineering",
    status: "Active",
    monthly_salary: 6000,
    maritalStatus: "married" as const,
    numberOfChildren: 1,
    age: 65,
    isDisabled: false,
    isPensioner: true,
    assignedReliefs: ["relief-001", "relief-002", "relief-003", "relief-004"],
    customReliefAmounts: {
      "relief-001": 402,
      "relief-002": 402,
      "relief-003": 90,
      "relief-004": 402
    }
  },
  {
    id: "emp-004",
    employee_id: "EMP004",
    display_name: "Grace Wilson",
    position: "Accountant",
    department: "Finance",
    status: "Active",
    monthly_salary: 4000,
    maritalStatus: "single" as const,
    numberOfChildren: 0,
    age: 30,
    isDisabled: true,
    assignedReliefs: ["relief-001", "relief-005"],
    customReliefAmounts: {
      "relief-001": 402,
      "relief-005": 402
    }
  }
]

export default function TaxReliefDemoPage() {
  const [employees, setEmployees] = useState(sampleEmployees)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)

  const handleTaxReliefChange = (employeeId: string, reliefs: string[], customAmounts: { [reliefId: string]: number }) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId 
        ? { ...emp, assignedReliefs: reliefs, customReliefAmounts: customAmounts }
        : emp
    ))
  }

  const handleViewEmployee = (employee: any) => {
    setSelectedEmployee(employee)
  }

  const handleEditEmployee = (employee: any) => {
    console.log("Edit employee:", employee)
  }

  const handleDeleteEmployee = (employee: any) => {
    console.log("Delete employee:", employee)
  }

  const handleEmailEmployee = (employee: any) => {
    console.log("Email employee:", employee)
  }

  const formatCurrency = (amount: number) => `GH₵ ${amount.toLocaleString()}`

  // Calculate total tax reliefs for all employees
  const totalTaxReliefs = employees.reduce((total, emp) => {
    const reliefs = emp.assignedReliefs || []
    const customAmounts = emp.customReliefAmounts || {}
    let employeeTotal = 0
    
    reliefs.forEach((reliefId: string) => {
      const customAmount = customAmounts[reliefId]
      if (customAmount !== undefined) {
        employeeTotal += customAmount
      } else {
        // Default amounts based on relief type
        switch (reliefId) {
          case "relief-001": employeeTotal += 402; break
          case "relief-002": employeeTotal += 402; break
          case "relief-003": employeeTotal += 90; break
          case "relief-004": employeeTotal += 402; break
          case "relief-005": employeeTotal += 402; break
          case "relief-006": employeeTotal += 90; break
        }
      }
    })
    
    return total + employeeTotal
  }, 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tax Relief Management Demo</h1>
          <p className="text-gray-600 mt-2">
            Manage tax reliefs for employees with different profiles and eligibility criteria
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-xl font-bold">{employees.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-600">Total Tax Reliefs</p>
                <p className="text-xl font-bold">{formatCurrency(totalTaxReliefs)}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Employee Cards with Tax Reliefs</h2>
          <div className="space-y-4">
            {employees.map((employee) => (
              <EmployeeCardWithTaxReliefs
                key={employee.id}
                employee={employee}
                variant="full"
                showActions={true}
                showSalary={true}
                showTaxReliefs={true}
                onView={handleViewEmployee}
                onEdit={handleEditEmployee}
                onDelete={handleDeleteEmployee}
                onEmail={handleEmailEmployee}
                onTaxReliefChange={handleTaxReliefChange}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Employee Details</h2>
          {selectedEmployee ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>{selectedEmployee.display_name}</span>
                </CardTitle>
                <CardDescription>
                  {selectedEmployee.position} • {selectedEmployee.department}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Employee ID</p>
                    <p className="font-medium">{selectedEmployee.employee_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Salary</p>
                    <p className="font-medium">{formatCurrency(selectedEmployee.monthly_salary)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Marital Status</p>
                    <p className="font-medium capitalize">{selectedEmployee.maritalStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Children</p>
                    <p className="font-medium">{selectedEmployee.numberOfChildren}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-medium">{selectedEmployee.age} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant={selectedEmployee.status === "Active" ? "default" : "secondary"}>
                      {selectedEmployee.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Assigned Tax Reliefs</h3>
                  <div className="space-y-2">
                    {selectedEmployee.assignedReliefs?.map((reliefId: string) => {
                      const reliefs = [
                        { id: "relief-001", name: "Personal Relief", amount: 402 },
                        { id: "relief-002", name: "Marriage Relief", amount: 402 },
                        { id: "relief-003", name: "Child Relief", amount: 90 },
                        { id: "relief-004", name: "Old Age Relief", amount: 402 },
                        { id: "relief-005", name: "Disability Relief", amount: 402 },
                        { id: "relief-006", name: "Dependent Relative Relief", amount: 90 }
                      ]
                      const relief = reliefs.find(r => r.id === reliefId)
                      const customAmount = selectedEmployee.customReliefAmounts?.[reliefId]
                      const amount = customAmount !== undefined ? customAmount : relief?.amount || 0
                      
                      return (
                        <div key={reliefId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{relief?.name}</span>
                          <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select an employee to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5" />
            <span>Tax Relief Summary</span>
          </CardTitle>
          <CardDescription>
            Overview of tax reliefs assigned to all employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {employees.map((employee) => {
              const reliefs = employee.assignedReliefs || []
              const customAmounts = employee.customReliefAmounts || {}
              let employeeTotal = 0
              
              reliefs.forEach((reliefId: string) => {
                const customAmount = customAmounts[reliefId]
                if (customAmount !== undefined) {
                  employeeTotal += customAmount
                } else {
                  switch (reliefId) {
                    case "relief-001": employeeTotal += 402; break
                    case "relief-002": employeeTotal += 402; break
                    case "relief-003": employeeTotal += 90; break
                    case "relief-004": employeeTotal += 402; break
                    case "relief-005": employeeTotal += 402; break
                    case "relief-006": employeeTotal += 90; break
                  }
                }
              })
              
              return (
                <div key={employee.id} className="p-4 border rounded-lg">
                  <h3 className="font-medium">{employee.display_name}</h3>
                  <p className="text-sm text-gray-600">{employee.position}</p>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Tax Reliefs: {reliefs.length}</p>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(employeeTotal)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
