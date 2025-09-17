"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Play, FileText, Download, CheckCircle } from "lucide-react"

// Mock employee data
const employees = [
  {
    id: "emp_001",
    name: "Akosua Mensah",
    position: "HR Manager",
    baseSalary: 4500,
    allowances: 350,
    deductions: 450,
    selected: true,
  },
  {
    id: "emp_002",
    name: "Kwame Asante",
    position: "Software Developer",
    baseSalary: 3800,
    allowances: 700,
    deductions: 300,
    selected: true,
  },
  {
    id: "emp_003",
    name: "Ama Osei",
    position: "Accountant",
    baseSalary: 3200,
    allowances: 200,
    deductions: 30,
    selected: true,
  },
  {
    id: "emp_004",
    name: "Kofi Boateng",
    position: "Operations Coordinator",
    baseSalary: 2800,
    allowances: 300,
    deductions: 0,
    selected: false,
  },
]

interface PayrollResult {
  employeeId: string
  employeeName: string
  grossPay: number
  netPay: number
  paye: number
  ssnitEmployee: number
  ssnitEmployer: number
}

export default function ProcessPayrollPage() {
  const [period, setPeriod] = useState("January 2025")
  const [startDate, setStartDate] = useState("2025-01-01")
  const [endDate, setEndDate] = useState("2025-01-31")
  const [selectedEmployees, setSelectedEmployees] = useState(employees)
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<PayrollResult[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [step, setStep] = useState<"setup" | "processing" | "results">("setup")

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(
      selectedEmployees.map((emp) => (emp.id === employeeId ? { ...emp, selected: !emp.selected } : emp)),
    )
  }

  const processPayroll = async () => {
    setProcessing(true)
    setStep("processing")

    try {
      const selectedIds = selectedEmployees.filter((emp) => emp.selected).map((emp) => emp.id)

      const response = await fetch("/api/payroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          period,
          startDate,
          endDate,
          employeeIds: selectedIds,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.results)
        setSummary(data.summary)
        setStep("results")
      }
    } catch (error) {
      console.error("Payroll processing error:", error)
    } finally {
      setProcessing(false)
    }
  }

  const selectedCount = selectedEmployees.filter((emp) => emp.selected).length
  const totalBaseSalary = selectedEmployees.filter((emp) => emp.selected).reduce((sum, emp) => sum + emp.baseSalary, 0)

  if (step === "processing") {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <h2 className="font-serif font-bold text-2xl mb-2">Processing Payroll</h2>
          <p className="text-gray-600">Calculating salaries for {selectedCount} employees...</p>
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Validating employee data</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Calculating PAYE taxes</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Computing SSNIT contributions</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin h-5 w-5 border-2 border-cyan-600 border-t-transparent rounded-full"></div>
              <span className="text-sm">Generating payslips</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === "results") {
    return (
      <div className="space-y-8">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif font-bold text-3xl text-gray-900">Payroll Results</h1>
            <p className="text-gray-600 mt-2">{period} payroll processing completed</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setStep("setup")} className="bg-transparent">
              Process Another
            </Button>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Download className="mr-2 h-4 w-4" />
              Export Results
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{summary?.totalEmployees}</div>
              <p className="text-sm text-gray-600">Employees Processed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">GHS {summary?.totalGrossPay.toLocaleString()}</div>
              <p className="text-sm text-gray-600">Total Gross Pay</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">GHS {summary?.totalDeductions.toLocaleString()}</div>
              <p className="text-sm text-gray-600">Total Deductions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">GHS {summary?.totalNetPay.toLocaleString()}</div>
              <p className="text-sm text-gray-600">Total Net Pay</p>
            </CardContent>
          </Card>
        </div>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Employee Payroll Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.employeeId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{result.employeeName}</h3>
                    <p className="text-sm text-gray-600">Employee ID: {result.employeeId}</p>
                  </div>
                  <div className="grid grid-cols-5 gap-4 text-center text-sm">
                    <div>
                      <p className="font-medium">GHS {result.grossPay.toLocaleString()}</p>
                      <p className="text-gray-600">Gross</p>
                    </div>
                    <div>
                      <p className="font-medium text-red-600">GHS {result.paye.toLocaleString()}</p>
                      <p className="text-gray-600">PAYE</p>
                    </div>
                    <div>
                      <p className="font-medium text-red-600">GHS {result.ssnitEmployee.toLocaleString()}</p>
                      <p className="text-gray-600">SSNIT</p>
                    </div>
                    <div>
                      <p className="font-medium text-blue-600">GHS {result.netPay.toLocaleString()}</p>
                      <p className="text-gray-600">Net Pay</p>
                    </div>
                    <div>
                      <Button size="sm" variant="outline" className="bg-transparent">
                        <FileText className="mr-1 h-3 w-3" />
                        Payslip
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-serif font-bold text-3xl text-gray-900">Process Payroll</h1>
        <p className="text-gray-600 mt-2">Run payroll for selected employees with Ghana tax calculations</p>
      </div>

      {/* Payroll Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Payroll Period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Period Name</label>
                <Input value={period} onChange={(e) => setPeriod(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Selected Employees:</span>
                  <span className="font-medium">{selectedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Base Salary:</span>
                  <span className="font-medium">GHS {totalBaseSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="font-medium">Estimated Processing:</span>
                  <span className="font-medium text-cyan-600">~2 minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={processPayroll}
            disabled={selectedCount === 0 || processing}
            className="w-full bg-cyan-600 hover:bg-cyan-700"
          >
            <Play className="mr-2 h-4 w-4" />
            Process Payroll
          </Button>
        </div>

        {/* Employee Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif">Select Employees</CardTitle>
                <Badge variant="outline">
                  {selectedCount} of {employees.length} selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      employee.selected ? "bg-cyan-50 border-cyan-200" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox checked={employee.selected} onCheckedChange={() => toggleEmployee(employee.id)} />
                      <div>
                        <h3 className="font-semibold">{employee.name}</h3>
                        <p className="text-sm text-gray-600">{employee.position}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <p className="font-medium">GHS {employee.baseSalary.toLocaleString()}</p>
                        <p className="text-gray-600">Base Salary</p>
                      </div>
                      <div>
                        <p className="font-medium text-green-600">+GHS {employee.allowances}</p>
                        <p className="text-gray-600">Allowances</p>
                      </div>
                      <div>
                        <p className="font-medium text-red-600">-GHS {employee.deductions}</p>
                        <p className="text-gray-600">Deductions</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
