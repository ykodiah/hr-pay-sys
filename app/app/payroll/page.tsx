"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
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
} from "lucide-react"

// Mock payroll data
const payrollPeriods = [
  {
    id: 1,
    period: "January 2025",
    status: "Processing",
    employees: 247,
    grossPay: 485200,
    paye: 72780,
    ssnit: 43668,
    netPay: 368752,
    processedDate: null,
    progress: 65,
  },
  {
    id: 2,
    period: "December 2024",
    status: "Completed",
    employees: 245,
    grossPay: 478900,
    paye: 71835,
    ssnit: 43101,
    netPay: 363964,
    processedDate: "2024-12-31",
    progress: 100,
  },
  {
    id: 3,
    period: "November 2024",
    status: "Completed",
    employees: 243,
    grossPay: 472100,
    paye: 70815,
    ssnit: 42489,
    netPay: 358796,
    processedDate: "2024-11-30",
    progress: 100,
  },
]

const employeePayroll = [
  {
    id: 1,
    name: "Kwame Asante",
    avatar: "/placeholder.svg?height=40&width=40",
    position: "Senior Software Engineer",
    basicSalary: 8500,
    allowances: 1200,
    grossPay: 9700,
    paye: 1455,
    ssnit: 873,
    netPay: 7372,
    status: "Processed",
  },
  {
    id: 2,
    name: "Ama Osei",
    avatar: "/placeholder.svg?height=40&width=40",
    position: "HR Manager",
    basicSalary: 7200,
    allowances: 800,
    grossPay: 8000,
    paye: 1200,
    ssnit: 720,
    netPay: 6080,
    status: "Processed",
  },
  {
    id: 3,
    name: "Kofi Mensah",
    avatar: "/placeholder.svg?height=40&width=40",
    position: "Marketing Specialist",
    basicSalary: 5800,
    allowances: 400,
    grossPay: 6200,
    paye: 930,
    ssnit: 558,
    netPay: 4712,
    status: "Processing",
  },
]

export default function PayrollPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("January 2025")
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false)

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
          <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Play className="w-4 h-4 mr-2" />
                Process Payroll
              </Button>
            </DialogTrigger>
            <DialogContent>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm text-gray-600">SSNIT Contributions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
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
          <div className="space-y-4">
            {employeePayroll.map((employee) => (
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

                <div className="grid grid-cols-6 gap-4 text-center text-sm">
                  <div>
                    <p className="font-medium text-gray-900">GHS {employee.basicSalary.toLocaleString()}</p>
                    <p className="text-gray-500">Basic</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">GHS {employee.allowances.toLocaleString()}</p>
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
                    <p className="font-medium text-blue-600">-GHS {employee.ssnit.toLocaleString()}</p>
                    <p className="text-gray-500">SSNIT</p>
                  </div>
                  <div>
                    <p className="font-medium text-emerald-600">GHS {employee.netPay.toLocaleString()}</p>
                    <p className="text-gray-500">Net Pay</p>
                  </div>
                </div>

                <Badge
                  variant={employee.status === "Processed" ? "default" : "secondary"}
                  className={
                    employee.status === "Processed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-orange-100 text-orange-800"
                  }
                >
                  {employee.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PayrollProcessDialog({ period, onClose }: { period: string; onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleProcess = () => {
    setIsProcessing(true)
    // Simulate processing steps
    setTimeout(() => setStep(2), 1000)
    setTimeout(() => setStep(3), 2000)
    setTimeout(() => setStep(4), 3000)
    setTimeout(() => {
      setIsProcessing(false)
      onClose()
    }, 4000)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Process Payroll for {period}</h3>
        <p className="text-gray-600">This will calculate payroll for all 247 employees</p>
      </div>

      {!isProcessing ? (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Processing Steps:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Calculate basic salary and allowances</li>
              <li>• Apply PAYE tax calculations (2025 rates)</li>
              <li>• Calculate SSNIT contributions (Employee + Employer)</li>
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
            <Button onClick={handleProcess} className="bg-emerald-600 hover:bg-emerald-700">
              Start Processing
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Processing Payroll...</h4>
          </div>

          <div className="space-y-3">
            <div className={`flex items-center space-x-3 ${step >= 1 ? "text-emerald-600" : "text-gray-400"}`}>
              <CheckCircle className="w-5 h-5" />
              <span>Calculating basic salaries and allowances</span>
            </div>
            <div className={`flex items-center space-x-3 ${step >= 2 ? "text-emerald-600" : "text-gray-400"}`}>
              <CheckCircle className="w-5 h-5" />
              <span>Applying PAYE tax calculations</span>
            </div>
            <div className={`flex items-center space-x-3 ${step >= 3 ? "text-emerald-600" : "text-gray-400"}`}>
              <CheckCircle className="w-5 h-5" />
              <span>Calculating SSNIT contributions</span>
            </div>
            <div className={`flex items-center space-x-3 ${step >= 4 ? "text-emerald-600" : "text-gray-400"}`}>
              <CheckCircle className="w-5 h-5" />
              <span>Generating payslips and reports</span>
            </div>
          </div>

          <Progress value={step * 25} className="h-2" />
        </div>
      )}
    </div>
  )
}
