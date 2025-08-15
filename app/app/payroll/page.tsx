"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import {
  Calculator,
  Calendar,
  Download,
  Eye,
  Play,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Users,
  Edit,
  Save,
  RefreshCw,
  Filter,
  Search,
} from "lucide-react"

const calculatePAYE = (grossPay: number) => {
  // Ghana PAYE tax bands for 2025
  const taxBands = [
    { min: 0, max: 365, rate: 0 },
    { min: 365, max: 730, rate: 0.05 },
    { min: 730, max: 1095, rate: 0.1 },
    { min: 1095, max: 1460, rate: 0.175 },
    { min: 1460, max: 3650, rate: 0.25 },
    { min: 3650, max: Number.POSITIVE_INFINITY, rate: 0.3 },
  ]

  let tax = 0
  for (const band of taxBands) {
    if (grossPay > band.min) {
      const taxableAmount = Math.min(grossPay, band.max) - band.min
      tax += taxableAmount * band.rate
    }
  }
  return Math.round(tax)
}

const calculateSSNIT = (grossPay: number) => {
  const maxSSNITSalary = 4500 // Maximum SSNIT salary ceiling
  const ssnitSalary = Math.min(grossPay, maxSSNITSalary)
  return {
    employee: Math.round(ssnitSalary * 0.055), // 5.5%
    employer: Math.round(ssnitSalary * 0.135), // 13.5%
    total: Math.round(ssnitSalary * 0.19),
  }
}

const calculateTier3 = (grossPay: number, contributionRate = 0.05) => {
  return Math.round(grossPay * contributionRate)
}

const initialPayrollPeriods = [
  {
    id: 1,
    period: "January 2025",
    status: "Processing",
    employees: 247,
    grossPay: 485200,
    paye: 72780,
    ssnit: 43668,
    tier3: 24260,
    netPay: 344492,
    processedDate: null,
    progress: 65,
    locked: false,
  },
  {
    id: 2,
    period: "December 2024",
    status: "Completed",
    employees: 245,
    grossPay: 478900,
    paye: 71835,
    ssnit: 43101,
    tier3: 23945,
    netPay: 340019,
    processedDate: "2024-12-31",
    progress: 100,
    locked: true,
  },
  {
    id: 3,
    period: "November 2024",
    status: "Completed",
    employees: 243,
    grossPay: 472100,
    paye: 70815,
    ssnit: 42489,
    tier3: 23605,
    netPay: 335191,
    processedDate: "2024-11-30",
    progress: 100,
    locked: true,
  },
]

const initialEmployeePayroll = [
  {
    id: 1,
    name: "Kwame Asante",
    avatar: "/placeholder.svg?height=40&width=40",
    position: "Senior Software Engineer",
    employeeId: "EMP001",
    basicSalary: 8500,
    allowances: {
      transport: 500,
      housing: 600,
      medical: 100,
      total: 1200,
    },
    deductions: {
      loans: 200,
      advances: 0,
      other: 0,
      total: 200,
    },
    grossPay: 9700,
    paye: 0,
    ssnit: { employee: 0, employer: 0 },
    tier3: { employee: 0, employer: 0, rate: 0.05 },
    netPay: 0,
    status: "Pending",
    overtimeHours: 8,
    overtimeRate: 50,
    selected: false,
  },
  {
    id: 2,
    name: "Ama Osei",
    avatar: "/placeholder.svg?height=40&width=40",
    position: "HR Manager",
    employeeId: "EMP002",
    basicSalary: 7200,
    allowances: {
      transport: 400,
      housing: 350,
      medical: 50,
      total: 800,
    },
    deductions: {
      loans: 150,
      advances: 50,
      other: 0,
      total: 200,
    },
    grossPay: 8000,
    paye: 0,
    ssnit: { employee: 0, employer: 0 },
    tier3: { employee: 0, employer: 0, rate: 0.05 },
    netPay: 0,
    status: "Pending",
    overtimeHours: 4,
    overtimeRate: 45,
    selected: false,
  },
  {
    id: 3,
    name: "Kofi Mensah",
    avatar: "/placeholder.svg?height=40&width=40",
    position: "Marketing Specialist",
    employeeId: "EMP003",
    basicSalary: 5800,
    allowances: {
      transport: 300,
      housing: 100,
      medical: 0,
      total: 400,
    },
    deductions: {
      loans: 100,
      advances: 0,
      other: 25,
      total: 125,
    },
    grossPay: 6200,
    paye: 0,
    ssnit: { employee: 0, employer: 0 },
    tier3: { employee: 0, employer: 0, rate: 0.03 },
    netPay: 0,
    status: "Pending",
    overtimeHours: 0,
    overtimeRate: 35,
    selected: false,
  },
]

export default function PayrollPage() {
  const [payrollPeriods, setPayrollPeriods] = useState(initialPayrollPeriods)
  const [employeePayroll, setEmployeePayroll] = useState(initialEmployeePayroll)
  const [selectedPeriod, setSelectedPeriod] = useState("January 2025")
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectAll, setSelectAll] = useState(false)

  const currentPeriod = payrollPeriods.find((p) => p.period === selectedPeriod)

  const calculateEmployeePayroll = (employee: any) => {
    const grossPay = employee.basicSalary + employee.allowances.total + employee.overtimeHours * employee.overtimeRate
    const paye = calculatePAYE(grossPay)
    const ssnit = calculateSSNIT(grossPay)
    const tier3Employee = calculateTier3(grossPay, employee.tier3.rate)
    const tier3Employer = calculateTier3(grossPay, employee.tier3.rate)
    const totalDeductions = paye + ssnit.employee + tier3Employee + employee.deductions.total
    const netPay = grossPay - totalDeductions

    return {
      ...employee,
      grossPay,
      paye,
      ssnit: { employee: ssnit.employee, employer: ssnit.employer },
      tier3: { ...employee.tier3, employee: tier3Employee, employer: tier3Employer },
      netPay,
      status: "Calculated",
    }
  }

  const handleCalculateSelected = () => {
    const updatedEmployees = employeePayroll.map((emp) => (emp.selected ? calculateEmployeePayroll(emp) : emp))
    setEmployeePayroll(updatedEmployees)
    toast({
      title: "Payroll Calculated",
      description: `Calculated payroll for ${employeePayroll.filter((e) => e.selected).length} employees.`,
    })
  }

  const handleCalculateAll = () => {
    const updatedEmployees = employeePayroll.map(calculateEmployeePayroll)
    setEmployeePayroll(updatedEmployees)
    toast({
      title: "Payroll Calculated",
      description: "Calculated payroll for all employees.",
    })
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    setEmployeePayroll(employeePayroll.map((emp) => ({ ...emp, selected: checked })))
  }

  const handleSelectEmployee = (employeeId: number, checked: boolean) => {
    setEmployeePayroll(employeePayroll.map((emp) => (emp.id === employeeId ? { ...emp, selected: checked } : emp)))
  }

  const filteredEmployees = employeePayroll.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || employee.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const selectedCount = employeePayroll.filter((e) => e.selected).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Processing</h1>
          <p className="text-gray-600">Manage payroll calculations with Ghana tax compliance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {payrollPeriods.map((period) => (
                <SelectItem key={period.id} value={period.period}>
                  {period.period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleCalculateAll}>
            <Calculator className="w-4 h-4 mr-2" />
            Calculate All
          </Button>
          <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Play className="w-4 h-4 mr-2" />
                Process Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Process Payroll for {selectedPeriod}</DialogTitle>
              </DialogHeader>
              <PayrollProcessDialog period={selectedPeriod} onClose={() => setIsProcessDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Current Period Status */}
      {currentPeriod && (
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{currentPeriod.period} Payroll</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge
                    variant={currentPeriod.status === "Completed" ? "default" : "secondary"}
                    className={
                      currentPeriod.status === "Completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-orange-100 text-orange-800"
                    }
                  >
                    {currentPeriod.status}
                  </Badge>
                  <span className="text-sm text-gray-500">{currentPeriod.employees} employees</span>
                  {currentPeriod.locked && (
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      Locked
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">GHS {currentPeriod.netPay.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Net Pay</p>
              </div>
            </div>

            {currentPeriod.status === "Processing" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing Progress</span>
                  <span>{currentPeriod.progress}%</span>
                </div>
                <Progress value={currentPeriod.progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payroll Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">GHS {currentPeriod?.grossPay.toLocaleString()}</div>
                <p className="text-sm text-gray-600">Gross Pay</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">GHS {currentPeriod?.paye.toLocaleString()}</div>
                <p className="text-sm text-gray-600">PAYE Tax</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">GHS {currentPeriod?.ssnit.toLocaleString()}</div>
                <p className="text-sm text-gray-600">SSNIT</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">GHS {currentPeriod?.tier3.toLocaleString()}</div>
                <p className="text-sm text-gray-600">Tier 3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">GHS {currentPeriod?.netPay.toLocaleString()}</div>
                <p className="text-sm text-gray-600">Net Pay</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ghana Tax Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>Ghana Tax Compliance Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-medium text-gray-900">PAYE Calculations</p>
                <p className="text-sm text-gray-600">2025 tax bands applied</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-medium text-gray-900">SSNIT Contributions</p>
                <p className="text-sm text-gray-600">13.5% employer + 5.5% employee</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-medium text-gray-900">Tier 3 Provident</p>
                <p className="text-sm text-gray-600">Employee + Employer contributions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900">Minimum Wage Check</p>
                <p className="text-sm text-gray-600">3 employees need review</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Payroll Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Employee Payroll Details - {selectedPeriod}</CardTitle>
            <div className="flex space-x-2">
              {selectedCount > 0 && (
                <Button onClick={handleCalculateSelected} variant="outline" size="sm">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Selected ({selectedCount})
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Payslips
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="calculated">Calculated</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Select All */}
          <div className="flex items-center space-x-2 mb-4 p-3 bg-gray-50 rounded-lg">
            <Checkbox id="select-all" checked={selectAll} onCheckedChange={handleSelectAll} />
            <Label htmlFor="select-all" className="text-sm font-medium">
              Select All ({filteredEmployees.length} employees)
            </Label>
          </div>

          <div className="space-y-4">
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  employee.selected ? "border-emerald-200 bg-emerald-50" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={employee.selected}
                    onCheckedChange={(checked) => handleSelectEmployee(employee.id, checked as boolean)}
                  />
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
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {employee.employeeId}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{employee.position}</p>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-4 text-center text-sm">
                  <div>
                    <p className="font-medium text-gray-900">GHS {employee.basicSalary.toLocaleString()}</p>
                    <p className="text-gray-500">Basic</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">GHS {employee.allowances.total.toLocaleString()}</p>
                    <p className="text-gray-500">Allowances</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">GHS {employee.grossPay.toLocaleString()}</p>
                    <p className="text-gray-500">Gross</p>
                  </div>
                  <div>
                    <p className="font-medium text-red-600">-GHS {employee.paye.toLocaleString()}</p>
                    <p className="text-gray-500">PAYE</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-600">-GHS {employee.ssnit.employee.toLocaleString()}</p>
                    <p className="text-gray-500">SSNIT</p>
                  </div>
                  <div>
                    <p className="font-medium text-purple-600">-GHS {employee.tier3.employee.toLocaleString()}</p>
                    <p className="text-gray-500">Tier 3</p>
                  </div>
                  <div>
                    <p className="font-medium text-emerald-600">GHS {employee.netPay.toLocaleString()}</p>
                    <p className="text-gray-500">Net Pay</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      employee.status === "Processed"
                        ? "default"
                        : employee.status === "Calculated"
                          ? "secondary"
                          : "outline"
                    }
                    className={
                      employee.status === "Processed"
                        ? "bg-emerald-100 text-emerald-800"
                        : employee.status === "Calculated"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }
                  >
                    {employee.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedEmployee(employee)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Employee Payroll Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payroll - {selectedEmployee?.name}</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <EditEmployeePayrollForm
              employee={selectedEmployee}
              onSave={(updatedEmployee) => {
                setEmployeePayroll(
                  employeePayroll.map((emp) => (emp.id === updatedEmployee.id ? updatedEmployee : emp)),
                )
                setIsEditDialogOpen(false)
                toast({
                  title: "Payroll Updated",
                  description: `Updated payroll for ${updatedEmployee.name}.`,
                })
              }}
              onClose={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PayrollProcessDialog({ period, onClose }: { period: string; onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)

  const processingSteps = [
    "Validating employee data",
    "Calculating basic salaries and allowances",
    "Applying PAYE tax calculations",
    "Calculating SSNIT contributions",
    "Processing Tier 3 contributions",
    "Applying deductions and loans",
    "Generating payslips and reports",
    "Finalizing payroll",
  ]

  const handleProcess = () => {
    setIsProcessing(true)
    setProcessingStep(0)

    // Simulate processing steps
    const interval = setInterval(() => {
      setProcessingStep((prev) => {
        if (prev >= processingSteps.length - 1) {
          clearInterval(interval)
          setTimeout(() => {
            setIsProcessing(false)
            onClose()
            toast({
              title: "Payroll Processed",
              description: `Successfully processed payroll for ${period}.`,
            })
          }, 1000)
          return prev
        }
        return prev + 1
      })
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Process Payroll for {period}</h3>
        <p className="text-gray-600">This will calculate and finalize payroll for all 247 employees</p>
      </div>

      {!isProcessing ? (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Processing Steps:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {processingSteps.map((step, index) => (
                <li key={index}>• {step}</li>
              ))}
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="font-medium text-yellow-900">Important Notes:</p>
            </div>
            <ul className="text-sm text-yellow-800 mt-2 space-y-1">
              <li>• Ensure all employee data is up to date</li>
              <li>• Review minimum wage compliance before processing</li>
              <li>• This action will lock the payroll period</li>
              <li>• Payslips will be automatically generated</li>
            </ul>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg">
            <h4 className="font-medium text-emerald-900 mb-2">Summary:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-emerald-800">Total Employees: 247</p>
                <p className="text-emerald-800">Gross Pay: GHS 485,200</p>
              </div>
              <div>
                <p className="text-emerald-800">Total Deductions: GHS 140,708</p>
                <p className="text-emerald-800">Net Pay: GHS 344,492</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleProcess} className="bg-emerald-600 hover:bg-emerald-700">
              Start Processing
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Processing Payroll...</h4>
            <p className="text-sm text-gray-600">{processingSteps[processingStep]}</p>
          </div>

          <div className="space-y-3">
            {processingSteps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 ${
                  index <= processingStep ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>

          <Progress value={((processingStep + 1) / processingSteps.length) * 100} className="h-2" />
        </div>
      )}
    </div>
  )
}

function EditEmployeePayrollForm({
  employee,
  onSave,
  onClose,
}: {
  employee: any
  onSave: (employee: any) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState(employee)

  const handleSave = () => {
    // Recalculate payroll with updated data
    const grossPay = formData.basicSalary + formData.allowances.total + formData.overtimeHours * formData.overtimeRate
    const paye = calculatePAYE(grossPay)
    const ssnit = calculateSSNIT(grossPay)
    const tier3Employee = calculateTier3(grossPay, formData.tier3.rate)
    const tier3Employer = calculateTier3(grossPay, formData.tier3.rate)
    const totalDeductions = paye + ssnit.employee + tier3Employee + formData.deductions.total
    const netPay = grossPay - totalDeductions

    const updatedEmployee = {
      ...formData,
      grossPay,
      paye,
      ssnit: { employee: ssnit.employee, employer: ssnit.employer },
      tier3: { ...formData.tier3, employee: tier3Employee, employer: tier3Employer },
      netPay,
      status: "Calculated",
    }

    onSave(updatedEmployee)
  }

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="allowances">Allowances</TabsTrigger>
        <TabsTrigger value="deductions">Deductions</TabsTrigger>
        <TabsTrigger value="calculations">Calculations</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="basicSalary">Basic Salary (GHS)</Label>
            <Input
              id="basicSalary"
              type="number"
              value={formData.basicSalary}
              onChange={(e) => setFormData({ ...formData, basicSalary: Number.parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label htmlFor="overtimeRate">Overtime Rate (GHS/hour)</Label>
            <Input
              id="overtimeRate"
              type="number"
              value={formData.overtimeRate}
              onChange={(e) => setFormData({ ...formData, overtimeRate: Number.parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="overtimeHours">Overtime Hours</Label>
          <Input
            id="overtimeHours"
            type="number"
            value={formData.overtimeHours}
            onChange={(e) => setFormData({ ...formData, overtimeHours: Number.parseFloat(e.target.value) || 0 })}
          />
        </div>
      </TabsContent>

      <TabsContent value="allowances" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="transport">Transport Allowance</Label>
            <Input
              id="transport"
              type="number"
              value={formData.allowances.transport}
              onChange={(e) => {
                const transport = Number.parseFloat(e.target.value) || 0
                setFormData({
                  ...formData,
                  allowances: {
                    ...formData.allowances,
                    transport,
                    total: transport + formData.allowances.housing + formData.allowances.medical,
                  },
                })
              }}
            />
          </div>
          <div>
            <Label htmlFor="housing">Housing Allowance</Label>
            <Input
              id="housing"
              type="number"
              value={formData.allowances.housing}
              onChange={(e) => {
                const housing = Number.parseFloat(e.target.value) || 0
                setFormData({
                  ...formData,
                  allowances: {
                    ...formData.allowances,
                    housing,
                    total: formData.allowances.transport + housing + formData.allowances.medical,
                  },
                })
              }}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="medical">Medical Allowance</Label>
          <Input
            id="medical"
            type="number"
            value={formData.allowances.medical}
            onChange={(e) => {
              const medical = Number.parseFloat(e.target.value) || 0
              setFormData({
                ...formData,
                allowances: {
                  ...formData.allowances,
                  medical,
                  total: formData.allowances.transport + formData.allowances.housing + medical,
                },
              })
            }}
          />
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="font-medium">Total Allowances: GHS {formData.allowances.total.toLocaleString()}</p>
        </div>
      </TabsContent>

      <TabsContent value="deductions" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="loans">Loan Deductions</Label>
            <Input
              id="loans"
              type="number"
              value={formData.deductions.loans}
              onChange={(e) => {
                const loans = Number.parseFloat(e.target.value) || 0
                setFormData({
                  ...formData,
                  deductions: {
                    ...formData.deductions,
                    loans,
                    total: loans + formData.deductions.advances + formData.deductions.other,
                  },
                })
              }}
            />
          </div>
          <div>
            <Label htmlFor="advances">Salary Advances</Label>
            <Input
              id="advances"
              type="number"
              value={formData.deductions.advances}
              onChange={(e) => {
                const advances = Number.parseFloat(e.target.value) || 0
                setFormData({
                  ...formData,
                  deductions: {
                    ...formData.deductions,
                    advances,
                    total: formData.deductions.loans + advances + formData.deductions.other,
                  },
                })
              }}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="other">Other Deductions</Label>
          <Input
            id="other"
            type="number"
            value={formData.deductions.other}
            onChange={(e) => {
              const other = Number.parseFloat(e.target.value) || 0
              setFormData({
                ...formData,
                deductions: {
                  ...formData.deductions,
                  other,
                  total: formData.deductions.loans + formData.deductions.advances + other,
                },
              })
            }}
          />
        </div>
        <div>
          <Label htmlFor="tier3Rate">Tier 3 Contribution Rate (%)</Label>
          <Input
            id="tier3Rate"
            type="number"
            step="0.01"
            max="0.20"
            value={formData.tier3.rate * 100}
            onChange={(e) =>
              setFormData({
                ...formData,
                tier3: { ...formData.tier3, rate: (Number.parseFloat(e.target.value) || 0) / 100 },
              })
            }
          />
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="font-medium">Total Deductions: GHS {formData.deductions.total.toLocaleString()}</p>
        </div>
      </TabsContent>

      <TabsContent value="calculations" className="space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Gross Pay Calculation</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span>GHS {formData.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allowances:</span>
                    <span>GHS {formData.allowances.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime:</span>
                    <span>GHS {(formData.overtimeHours * formData.overtimeRate).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Gross Pay:</span>
                    <span>
                      GHS{" "}
                      {(
                        formData.basicSalary +
                        formData.allowances.total +
                        formData.overtimeHours * formData.overtimeRate
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Tax Calculations</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>PAYE Tax:</span>
                    <span className="text-red-600">
                      GHS{" "}
                      {calculatePAYE(
                        formData.basicSalary +
                          formData.allowances.total +
                          formData.overtimeHours * formData.overtimeRate,
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>SSNIT (Employee):</span>
                    <span className="text-blue-600">
                      GHS{" "}
                      {calculateSSNIT(
                        formData.basicSalary +
                          formData.allowances.total +
                          formData.overtimeHours * formData.overtimeRate,
                      ).employee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tier 3 ({(formData.tier3.rate * 100).toFixed(1)}%):</span>
                    <span className="text-purple-600">
                      GHS{" "}
                      {calculateTier3(
                        formData.basicSalary +
                          formData.allowances.total +
                          formData.overtimeHours * formData.overtimeRate,
                        formData.tier3.rate,
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Deductions:</span>
                    <span className="text-gray-600">GHS {formData.deductions.total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-emerald-200">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2 text-emerald-800">Net Pay Summary</h4>
              <div className="text-2xl font-bold text-emerald-600">
                GHS{" "}
                {(
                  formData.basicSalary +
                  formData.allowances.total +
                  formData.overtimeHours * formData.overtimeRate -
                  calculatePAYE(
                    formData.basicSalary + formData.allowances.total + formData.overtimeHours * formData.overtimeRate,
                  ) -
                  calculateSSNIT(
                    formData.basicSalary + formData.allowances.total + formData.overtimeHours * formData.overtimeRate,
                  ).employee -
                  calculateTier3(
                    formData.basicSalary + formData.allowances.total + formData.overtimeHours * formData.overtimeRate,
                    formData.tier3.rate,
                  ) -
                  formData.deductions.total
                ).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </Tabs>
  )
}
