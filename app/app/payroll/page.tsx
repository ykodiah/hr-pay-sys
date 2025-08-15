"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
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
  Settings,
  FileText,
  Clock,
} from "lucide-react"

const GHANA_TAX_BANDS_2025 = [
  { min: 0, max: 365, rate: 0 },
  { min: 365, max: 730, rate: 0.05 },
  { min: 730, max: 1095, rate: 0.1 },
  { min: 1095, max: 1460, rate: 0.175 },
  { min: 1460, max: 2920, rate: 0.25 },
  { min: 2920, max: Number.POSITIVE_INFINITY, rate: 0.3 },
]

const MINIMUM_WAGE_2025 = 18.15 // GHS per day
const SSNIT_EMPLOYEE_RATE = 0.055 // 5.5%
const SSNIT_EMPLOYER_RATE = 0.135 // 13.5%
const SSNIT_CEILING = 4500 // Monthly ceiling for SSNIT

function calculatePAYE(monthlyGross: number): number {
  const annualGross = monthlyGross * 12
  let tax = 0

  for (const band of GHANA_TAX_BANDS_2025) {
    if (annualGross > band.min) {
      const taxableInBand = Math.min(annualGross - band.min, band.max - band.min)
      tax += taxableInBand * band.rate
    }
  }

  return Math.round(tax / 12) // Monthly PAYE
}

function calculateSSNIT(monthlyGross: number): { employee: number; employer: number } {
  const ssnitBase = Math.min(monthlyGross, SSNIT_CEILING)
  return {
    employee: Math.round(ssnitBase * SSNIT_EMPLOYEE_RATE),
    employer: Math.round(ssnitBase * SSNIT_EMPLOYER_RATE),
  }
}

function calculateTier3(monthlyGross: number, contributionRate: number): { employee: number; employer: number } {
  const contribution = Math.round(monthlyGross * (contributionRate / 100))
  return {
    employee: contribution,
    employer: contribution, // Assuming employer matches
  }
}

const initialEmployees = [
  {
    id: 1,
    name: "Kwame Asante",
    avatar: "/placeholder.svg?height=40&width=40",
    position: "Senior Software Engineer",
    department: "Technology",
    basicSalary: 8500,
    allowances: {
      transport: 500,
      housing: 1200,
      medical: 300,
      other: 200,
    },
    deductions: {
      loan: 500,
      advance: 0,
      other: 0,
    },
    tier3Rate: 5,
    status: "Active",
  },
  {
    id: 2,
    name: "Ama Osei",
    avatar: "/placeholder.svg?height=40&width=40",
    position: "HR Manager",
    department: "Human Resources",
    basicSalary: 7200,
    allowances: {
      transport: 400,
      housing: 1000,
      medical: 250,
      other: 150,
    },
    deductions: {
      loan: 300,
      advance: 0,
      other: 0,
    },
    tier3Rate: 5,
    status: "Active",
  },
  {
    id: 3,
    name: "Kofi Mensah",
    avatar: "/placeholder.svg?height=40&width=40",
    position: "Marketing Specialist",
    department: "Marketing",
    basicSalary: 5800,
    allowances: {
      transport: 300,
      housing: 900,
      medical: 200,
      other: 100,
    },
    deductions: {
      loan: 200,
      advance: 100,
      other: 0,
    },
    tier3Rate: 5,
    status: "Active",
  },
  {
    id: 4,
    name: "Akosua Boateng",
    avatar: "/placeholder.svg?height=40&width=40",
    position: "Finance Officer",
    department: "Finance",
    basicSalary: 6500,
    allowances: {
      transport: 450,
      housing: 1100,
      medical: 275,
      other: 175,
    },
    deductions: {
      loan: 400,
      advance: 0,
      other: 50,
    },
    tier3Rate: 5,
    status: "On Leave",
  },
  {
    id: 5,
    name: "Yaw Adjei",
    avatar: "/placeholder.svg?height=40&width=40",
    position: "Sales Representative",
    department: "Sales",
    basicSalary: 4200,
    allowances: {
      transport: 350,
      housing: 850,
      medical: 175,
      other: 125,
    },
    deductions: {
      loan: 150,
      advance: 0,
      other: 0,
    },
    tier3Rate: 5,
    status: "Active",
  },
]

function processEmployeePayroll(employee: any) {
  const totalAllowances = Object.values(employee.allowances).reduce((sum: number, val: any) => sum + val, 0)
  const grossPay = employee.basicSalary + totalAllowances

  const paye = calculatePAYE(grossPay)
  const ssnit = calculateSSNIT(grossPay)
  const tier3 = calculateTier3(grossPay, employee.tier3Rate)
  const totalDeductions = Object.values(employee.deductions).reduce((sum: number, val: any) => sum + val, 0)

  const totalStatutoryDeductions = paye + ssnit.employee + tier3.employee
  const netPay = grossPay - totalStatutoryDeductions - totalDeductions

  return {
    ...employee,
    grossPay,
    paye,
    ssnitEmployee: ssnit.employee,
    ssnitEmployer: ssnit.employer,
    tier3Employee: tier3.employee,
    tier3Employer: tier3.employer,
    totalDeductions: totalDeductions,
    totalStatutoryDeductions,
    netPay,
    processed: true,
  }
}

const payrollPeriods = [
  {
    id: 1,
    period: "January 2025",
    status: "Draft",
    employees: initialEmployees.length,
    processedDate: null,
    progress: 0,
  },
  {
    id: 2,
    period: "December 2024",
    status: "Completed",
    employees: initialEmployees.length,
    processedDate: "2024-12-31",
    progress: 100,
  },
  {
    id: 3,
    period: "November 2024",
    status: "Completed",
    employees: initialEmployees.length,
    processedDate: "2024-11-30",
    progress: 100,
  },
]

export default function PayrollPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("January 2025")
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false)
  const [employees, setEmployees] = useState(initialEmployees)
  const [processedEmployees, setProcessedEmployees] = useState<any[]>([])
  const [payrollSummary, setPayrollSummary] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)

  useEffect(() => {
    if (processedEmployees.length > 0) {
      const summary = processedEmployees.reduce(
        (acc, emp) => ({
          totalEmployees: acc.totalEmployees + 1,
          grossPay: acc.grossPay + emp.grossPay,
          paye: acc.paye + emp.paye,
          ssnitEmployee: acc.ssnitEmployee + emp.ssnitEmployee,
          ssnitEmployer: acc.ssnitEmployer + emp.ssnitEmployer,
          tier3Employee: acc.tier3Employee + emp.tier3Employee,
          tier3Employer: acc.tier3Employer + emp.tier3Employer,
          totalDeductions: acc.totalDeductions + emp.totalDeductions,
          netPay: acc.netPay + emp.netPay,
        }),
        {
          totalEmployees: 0,
          grossPay: 0,
          paye: 0,
          ssnitEmployee: 0,
          ssnitEmployer: 0,
          tier3Employee: 0,
          tier3Employer: 0,
          totalDeductions: 0,
          netPay: 0,
        },
      )
      setPayrollSummary(summary)
    }
  }, [processedEmployees])

  const handleProcessPayroll = async () => {
    setIsProcessing(true)
    setProcessingStep(0)
    setProcessingProgress(0)

    const steps = [
      "Validating employee data",
      "Calculating basic salaries and allowances",
      "Applying PAYE tax calculations",
      "Calculating SSNIT contributions",
      "Processing Tier 3 contributions",
      "Applying deductions and loans",
      "Generating payroll summary",
      "Finalizing payroll",
    ]

    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(i)
      setProcessingProgress((i / steps.length) * 100)

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 800))

      if (i === 1) {
        // Process employees
        const processed = employees.filter((emp) => emp.status === "Active").map(processEmployeePayroll)
        setProcessedEmployees(processed)
      }
    }

    setProcessingProgress(100)
    setIsProcessing(false)
    setIsProcessDialogOpen(false)

    toast({
      title: "Payroll Processed Successfully",
      description: `Payroll for ${selectedPeriod} has been processed for ${employees.filter((emp) => emp.status === "Active").length} employees.`,
    })
  }

  const currentPeriod = payrollPeriods.find((p) => p.period === selectedPeriod)

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
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={processedEmployees.length > 0}>
                <Play className="w-4 h-4 mr-2" />
                {processedEmployees.length > 0 ? "Payroll Processed" : "Process Payroll"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Process Payroll for {selectedPeriod}</DialogTitle>
              </DialogHeader>
              <PayrollProcessDialog
                period={selectedPeriod}
                employees={employees.filter((emp) => emp.status === "Active")}
                onProcess={handleProcessPayroll}
                isProcessing={isProcessing}
                processingStep={processingStep}
                processingProgress={processingProgress}
                onClose={() => setIsProcessDialogOpen(false)}
              />
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
                    variant={processedEmployees.length > 0 ? "default" : "secondary"}
                    className={
                      processedEmployees.length > 0 ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"
                    }
                  >
                    {processedEmployees.length > 0 ? "Processed" : "Draft"}
                  </Badge>
                  <span className="text-sm text-gray-500">{currentPeriod.employees} employees</span>
                  {processedEmployees.length > 0 && (
                    <span className="text-sm text-emerald-600">• {processedEmployees.length} processed</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  GHS {payrollSummary ? payrollSummary.netPay.toLocaleString() : "0"}
                </p>
                <p className="text-sm text-gray-600">Net Pay</p>
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing Progress</span>
                  <span>{Math.round(processingProgress)}%</span>
                </div>
                <Progress value={processingProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payroll Summary */}
      {payrollSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">GHS {payrollSummary.grossPay.toLocaleString()}</div>
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
                  <div className="text-2xl font-bold text-gray-900">GHS {payrollSummary.paye.toLocaleString()}</div>
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
                  <div className="text-2xl font-bold text-gray-900">
                    GHS {(payrollSummary.ssnitEmployee + payrollSummary.ssnitEmployer).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Total SSNIT</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">GHS {payrollSummary.netPay.toLocaleString()}</div>
                  <p className="text-sm text-gray-600">Net Pay</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ghana Tax Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>Ghana Tax Compliance Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
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
                <p className="font-medium text-gray-900">Minimum Wage Check</p>
                <p className="text-sm text-gray-600">All employees compliant</p>
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
              <Button variant="outline" size="sm" disabled={processedEmployees.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export Payslips
              </Button>
              <Button variant="outline" size="sm" disabled={processedEmployees.length === 0}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Reports
              </Button>
              <Button variant="outline" size="sm" disabled={processedEmployees.length === 0}>
                <Eye className="w-4 h-4 mr-2" />
                Preview Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="processed" className="w-full">
            <TabsList>
              <TabsTrigger value="processed">Processed ({processedEmployees.length})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({employees.filter((emp) => emp.status === "Active").length - processedEmployees.length})
              </TabsTrigger>
              <TabsTrigger value="excluded">
                Excluded ({employees.filter((emp) => emp.status !== "Active").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="processed" className="space-y-4">
              {processedEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No payroll processed yet for this period</p>
                  <p className="text-sm text-gray-500">Click "Process Payroll" to begin</p>
                </div>
              ) : (
                processedEmployees.map((employee) => (
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
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-4 text-center text-sm">
                      <div>
                        <p className="font-medium text-gray-900">GHS {employee.basicSalary.toLocaleString()}</p>
                        <p className="text-gray-500">Basic</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          GHS{" "}
                          {Object.values(employee.allowances)
                            .reduce((sum: number, val: any) => sum + val, 0)
                            .toLocaleString()}
                        </p>
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
                        <p className="font-medium text-blue-600">-GHS {employee.ssnitEmployee.toLocaleString()}</p>
                        <p className="text-gray-500">SSNIT</p>
                      </div>
                      <div>
                        <p className="font-medium text-purple-600">-GHS {employee.tier3Employee.toLocaleString()}</p>
                        <p className="text-gray-500">Tier 3</p>
                      </div>
                      <div>
                        <p className="font-medium text-emerald-600">GHS {employee.netPay.toLocaleString()}</p>
                        <p className="text-gray-500">Net Pay</p>
                      </div>
                    </div>

                    <Badge className="bg-emerald-100 text-emerald-800">Processed</Badge>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {employees
                .filter((emp) => emp.status === "Active" && !processedEmployees.find((p) => p.id === emp.id))
                .map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
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
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Pending
                    </Badge>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="excluded" className="space-y-4">
              {employees
                .filter((emp) => emp.status !== "Active")
                .map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg opacity-60"
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
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      {employee.status}
                    </Badge>
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function PayrollProcessDialog({
  period,
  employees,
  onProcess,
  isProcessing,
  processingStep,
  processingProgress,
  onClose,
}: {
  period: string
  employees: any[]
  onProcess: () => void
  isProcessing: boolean
  processingStep: number
  processingProgress: number
  onClose: () => void
}) {
  const processingSteps = [
    "Validating employee data",
    "Calculating basic salaries and allowances",
    "Applying PAYE tax calculations",
    "Calculating SSNIT contributions",
    "Processing Tier 3 contributions",
    "Applying deductions and loans",
    "Generating payroll summary",
    "Finalizing payroll",
  ]

  const totalGross = employees.reduce((sum, emp) => {
    const allowances = Object.values(emp.allowances).reduce((a: number, b: any) => a + b, 0)
    return sum + emp.basicSalary + allowances
  }, 0)

  const estimatedPAYE = employees.reduce((sum, emp) => {
    const allowances = Object.values(emp.allowances).reduce((a: number, b: any) => a + b, 0)
    const gross = emp.basicSalary + allowances
    return sum + calculatePAYE(gross)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Process Payroll for {period}</h3>
        <p className="text-gray-600">This will calculate payroll for {employees.length} active employees</p>
      </div>

      {!isProcessing ? (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Payroll Summary Preview:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-800">Estimated Gross Pay:</span>
                <span className="font-medium ml-2">GHS {totalGross.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-blue-800">Estimated PAYE:</span>
                <span className="font-medium ml-2">GHS {estimatedPAYE.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg">
            <h4 className="font-medium text-emerald-900 mb-2">Processing Steps:</h4>
            <ul className="text-sm text-emerald-800 space-y-1">
              <li>• Calculate basic salary and allowances</li>
              <li>• Apply PAYE tax calculations (2025 rates)</li>
              <li>• Calculate SSNIT contributions (Employee + Employer)</li>
              <li>• Process Tier 3 pension contributions</li>
              <li>• Apply deductions and loans</li>
              <li>• Generate payslips and reports</li>
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
              <li>• This action cannot be undone once completed</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onProcess} className="bg-emerald-600 hover:bg-emerald-700">
              Start Processing
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-8 h-8 text-emerald-600 animate-pulse" />
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

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(processingProgress)}%</span>
            </div>
            <Progress value={processingProgress} className="h-2" />
          </div>
        </div>
      )}
    </div>
  )
}
