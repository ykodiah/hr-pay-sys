"use client"

import { useState } from "react"
import { EmployeeCardWithTaxReliefs } from "./employee-card-with-tax-reliefs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Receipt, Users, Calculator, TrendingUp } from "lucide-react"

// Sample tax reliefs data (same as in settings)
const sampleTaxReliefs = [
  {
    id: 1,
    name: "Personal Relief",
    description: "Basic personal tax relief for all taxpayers",
    amount: 402,
    currency: "GHS",
    isActive: true,
    category: "Personal",
    graCode: "PR001",
    isMandatory: true
  },
  {
    id: 2,
    name: "Child Relief",
    description: "Tax relief for dependent children (per child)",
    amount: 150,
    currency: "GHS",
    isActive: true,
    category: "Family",
    graCode: "CR001",
    isMandatory: false,
    maxChildren: 4
  },
  {
    id: 3,
    name: "Spouse Relief",
    description: "Tax relief for dependent spouse",
    amount: 200,
    currency: "GHS",
    isActive: true,
    category: "Family",
    graCode: "SR001",
    isMandatory: false
  },
  {
    id: 4,
    name: "Old Age Relief",
    description: "Tax relief for elderly citizens (65+)",
    amount: 200,
    currency: "GHS",
    isActive: true,
    category: "Age",
    graCode: "OAR001",
    isMandatory: false,
    minAge: 65
  },
  {
    id: 5,
    name: "Disability Relief",
    description: "Tax relief for persons with disabilities",
    amount: 100,
    currency: "GHS",
    isActive: true,
    category: "Disability",
    graCode: "DR001",
    isMandatory: false
  },
  {
    id: 6,
    name: "Education Relief",
    description: "Tax relief for education expenses (per child)",
    amount: 200,
    currency: "GHS",
    isActive: true,
    category: "Education",
    graCode: "ER001",
    isMandatory: false,
    maxChildren: 3
  },
  {
    id: 7,
    name: "Medical Relief",
    description: "Tax relief for medical expenses",
    amount: 300,
    currency: "GHS",
    isActive: true,
    category: "Medical",
    graCode: "MR001",
    isMandatory: false
  },
  {
    id: 8,
    name: "Pension Relief",
    description: "Tax relief for pension contributions",
    amount: 400,
    currency: "GHS",
    isActive: true,
    category: "Investment",
    graCode: "PR002",
    isMandatory: false
  }
]

// Sample employees with different profiles
const sampleEmployees = [
  {
    id: "emp-001",
    employee_id: "EMP001",
    first_name: "Kwame",
    last_name: "Asante",
    full_name: "Kwame Asante",
    position: "Software Engineer",
    department: "IT",
    corporate_email: "kwame.asante@company.com",
    phone: "+233 24 123 4567",
    status: "Active",
    salary: 5000,
    monthly_salary: 5000,
    age: 28,
    children_count: 2,
    is_married: true,
    has_disability: false,
    is_blind: false,
    assigned_tax_reliefs: [
      sampleTaxReliefs[0], // Personal Relief
      sampleTaxReliefs[1], // Child Relief
      sampleTaxReliefs[2], // Spouse Relief
      sampleTaxReliefs[5], // Education Relief
    ]
  },
  {
    id: "emp-002",
    employee_id: "EMP002",
    first_name: "Ama",
    last_name: "Osei",
    full_name: "Ama Osei",
    position: "HR Manager",
    department: "Human Resources",
    corporate_email: "ama.osei@company.com",
    phone: "+233 24 234 5678",
    status: "Active",
    salary: 8000,
    monthly_salary: 8000,
    age: 45,
    children_count: 3,
    is_married: true,
    has_disability: false,
    is_blind: false,
    assigned_tax_reliefs: [
      sampleTaxReliefs[0], // Personal Relief
      sampleTaxReliefs[1], // Child Relief
      sampleTaxReliefs[2], // Spouse Relief
      sampleTaxReliefs[5], // Education Relief
      sampleTaxReliefs[6], // Medical Relief
      sampleTaxReliefs[7], // Pension Relief
    ]
  },
  {
    id: "emp-003",
    employee_id: "EMP003",
    first_name: "Kofi",
    last_name: "Mensah",
    full_name: "Kofi Mensah",
    position: "Senior Accountant",
    department: "Finance",
    corporate_email: "kofi.mensah@company.com",
    phone: "+233 24 345 6789",
    status: "Active",
    salary: 6000,
    monthly_salary: 6000,
    age: 35,
    children_count: 1,
    is_married: false,
    has_disability: true,
    is_blind: false,
    assigned_tax_reliefs: [
      sampleTaxReliefs[0], // Personal Relief
      sampleTaxReliefs[1], // Child Relief
      sampleTaxReliefs[4], // Disability Relief
      sampleTaxReliefs[5], // Education Relief
    ]
  },
  {
    id: "emp-004",
    employee_id: "EMP004",
    first_name: "Efua",
    last_name: "Adjei",
    full_name: "Efua Adjei",
    position: "Retired Consultant",
    department: "Consulting",
    corporate_email: "efua.adjei@company.com",
    phone: "+233 24 456 7890",
    status: "Active",
    salary: 4000,
    monthly_salary: 4000,
    age: 68,
    children_count: 0,
    is_married: true,
    has_disability: false,
    is_blind: false,
    assigned_tax_reliefs: [
      sampleTaxReliefs[0], // Personal Relief
      sampleTaxReliefs[2], // Spouse Relief
      sampleTaxReliefs[3], // Old Age Relief
      sampleTaxReliefs[7], // Pension Relief
    ]
  }
]

export function TaxReliefDemo() {
  const [employees, setEmployees] = useState(sampleEmployees)

  const handleAssignTaxReliefs = (employeeId: string, reliefs: any[]) => {
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, assigned_tax_reliefs: reliefs }
          : emp
      )
    )
  }

  const handleRemoveTaxRelief = (employeeId: string, reliefId: number) => {
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === employeeId
          ? { 
              ...emp, 
              assigned_tax_reliefs: emp.assigned_tax_reliefs?.filter(r => r.id !== reliefId) || []
            }
          : emp
      )
    )
  }

  const calculateTotalSavings = () => {
    return employees.reduce((total, emp) => {
      const empReliefs = emp.assigned_tax_reliefs || []
      const empTotal = empReliefs.reduce((sum, relief) => sum + relief.amount, 0)
      return total + empTotal
    }, 0)
  }

  const getEligibleReliefsCount = (employee: any) => {
    return sampleTaxReliefs.filter(relief => {
      if (!relief.isActive) return false
      
      // Check age requirements
      if (relief.minAge && employee.age && employee.age < relief.minAge) return false
      
      // Check disability requirements
      if (relief.category === "Disability" && !employee.has_disability) return false
      if (relief.name === "Blind Relief" && !employee.is_blind) return false
      
      // Check family requirements
      if (relief.category === "Family" && relief.name === "Spouse Relief" && !employee.is_married) return false
      if (relief.category === "Family" && relief.name === "Child Relief" && (!employee.children_count || employee.children_count === 0)) return false
      
      return true
    }).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Employee Tax Relief Management</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Manage tax reliefs for employees with automatic eligibility checking and GRA compliance.
          Each employee can be assigned reliefs based on their personal circumstances.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Available Reliefs</p>
                <p className="text-2xl font-bold">{sampleTaxReliefs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Total Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  GH₵ {calculateTotalSavings().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Avg. Reliefs/Employee</p>
                <p className="text-2xl font-bold">
                  {(employees.reduce((sum, emp) => sum + (emp.assigned_tax_reliefs?.length || 0), 0) / employees.length).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Employee Tax Relief Assignments</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {employees.map((employee) => (
            <div key={employee.id} className="space-y-2">
              <EmployeeCardWithTaxReliefs
                employee={employee}
                availableTaxReliefs={sampleTaxReliefs}
                onAssignTaxReliefs={handleAssignTaxReliefs}
                onRemoveTaxRelief={handleRemoveTaxRelief}
                variant="full"
                showTaxReliefs={true}
                showSalary={true}
                showActions={true}
                onView={(emp) => console.log("View employee:", emp)}
                onEdit={(emp) => console.log("Edit employee:", emp)}
                onEmail={(emp) => console.log("Email employee:", emp)}
                onDelete={(emp) => console.log("Delete employee:", emp)}
              />
              
              {/* Employee Eligibility Info */}
              <div className="ml-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">
                    Eligible for {getEligibleReliefsCount(employee)} reliefs
                  </span>
                  <div className="flex space-x-2">
                    {employee.is_married && (
                      <Badge variant="outline" className="text-xs">Married</Badge>
                    )}
                    {employee.children_count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {employee.children_count} child{employee.children_count !== 1 ? 'ren' : ''}
                      </Badge>
                    )}
                    {employee.has_disability && (
                      <Badge variant="outline" className="text-xs">Disability</Badge>
                    )}
                    {employee.age >= 65 && (
                      <Badge variant="outline" className="text-xs">Senior (65+)</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="w-5 h-5" />
            <span>How to Use Tax Relief Management</span>
          </CardTitle>
          <CardDescription>
            Step-by-step guide to managing employee tax reliefs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">For HR Managers:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Click "Manage Tax Reliefs" on any employee card</li>
                <li>Review eligible reliefs based on employee profile</li>
                <li>Select appropriate reliefs for the employee</li>
                <li>Adjust amounts if needed (within GRA limits)</li>
                <li>Save changes to apply to payroll</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">Automatic Eligibility:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Age-based reliefs (e.g., Old Age Relief for 65+)</li>
                <li>Family reliefs (spouse, children count)</li>
                <li>Disability reliefs (based on employee status)</li>
                <li>Mandatory reliefs (always applied)</li>
                <li>GRA compliance validation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
