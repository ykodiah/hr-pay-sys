"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Download, Eye, Calendar, DollarSign, Calculator, TrendingDown } from "lucide-react"

const payslips = [
  {
    id: 1,
    period: "January 2025",
    date: "31/1/2025",
    printDate: "02/02/2025",
    employeeName: "KWAME ASANTE",
    jobTitle: "SENIOR SOFTWARE ENGINEER",
    employeeId: "EMP001",
    ssfNo: "GHA-001689781-4",
    bankName: "GT BANK",
    accountNumber: "20610953414",
    basicSalary: 8500,
    allowances: {
      transport: 500,
      housing: 600,
      medical: 100,
      total: 1200,
    },
    grossSalary: 9700,
    deductions: {
      ssnitEmployee: 467.5, // 5.5% of basic salary
      paye: 1248.98,
      providentFundEmployee: 425.0, // 5% of basic salary
      providentFundEmployer: 425.0, // 5% of basic salary
      welfare: 20,
      loans: 0,
      other: 0,
    },
    ssnitEmployer: 1105.0, // 13% of basic salary
    totalDeductions: 2161.48,
    netPay: 7538.52,
    payDate: "2025-01-31",
    status: "Paid",
  },
  {
    id: 2,
    period: "December 2024",
    date: "31/12/2024",
    printDate: "02/01/2025",
    employeeName: "KWAME ASANTE",
    jobTitle: "SENIOR SOFTWARE ENGINEER",
    employeeId: "EMP001",
    ssfNo: "GHA-001689781-4",
    bankName: "GT BANK",
    accountNumber: "20610953414",
    basicSalary: 8500,
    allowances: {
      transport: 400,
      housing: 500,
      medical: 100,
      total: 1000,
    },
    grossSalary: 9500,
    deductions: {
      ssnitEmployee: 467.5,
      paye: 1198.75,
      providentFundEmployee: 425.0,
      providentFundEmployer: 425.0,
      welfare: 20,
      loans: 0,
      other: 0,
    },
    ssnitEmployer: 1105.0,
    totalDeductions: 2111.25,
    netPay: 7388.75,
    payDate: "2024-12-31",
    status: "Paid",
  },
]

export default function PayslipsPage() {
  const [selectedYear, setSelectedYear] = useState("2025")
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null)

  const filteredPayslips = payslips.filter((payslip) => payslip.period.includes(selectedYear))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Payslips</h1>
          <p className="text-gray-600">View and download your salary statements</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Year Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  GHS {filteredPayslips.reduce((sum, p) => sum + p.grossSalary, 0).toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">Total Gross Pay</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  GHS {filteredPayslips.reduce((sum, p) => sum + p.deductions.paye, 0).toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">Total PAYE</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  GHS {filteredPayslips.reduce((sum, p) => sum + p.deductions.ssnitEmployee, 0).toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">Total SSNIT</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  GHS {filteredPayslips.reduce((sum, p) => sum + p.netPay, 0).toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">Total Net Pay</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payslips List */}
      <Card>
        <CardHeader>
          <CardTitle>Payslips for {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayslips.map((payslip) => (
              <div
                key={payslip.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{payslip.period}</h3>
                    <p className="text-sm text-gray-600">Paid on {new Date(payslip.payDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 text-center text-sm">
                  <div>
                    <p className="font-medium text-gray-900">GHS {payslip.grossSalary.toLocaleString()}</p>
                    <p className="text-gray-500">Gross Pay</p>
                  </div>
                  <div>
                    <p className="font-medium text-red-600">-GHS {payslip.deductions.paye.toLocaleString()}</p>
                    <p className="text-gray-500">PAYE</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-600">
                      -GHS {payslip.deductions.ssnitEmployee.toLocaleString()}
                    </p>
                    <p className="text-gray-500">SSNIT</p>
                  </div>
                  <div>
                    <p className="font-medium text-emerald-600">GHS {payslip.netPay.toLocaleString()}</p>
                    <p className="text-gray-500">Net Pay</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge className="bg-emerald-100 text-emerald-800">{payslip.status}</Badge>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPayslip(payslip)}
                        className="bg-transparent"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Payslip - {payslip.period}</DialogTitle>
                      </DialogHeader>
                      {selectedPayslip && <PayslipDetail payslip={selectedPayslip} />}
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      // Simulate PDF download
                      const link = document.createElement("a")
                      link.href = "#"
                      link.download = `Payslip_${payslip.period.replace(" ", "_")}.pdf`
                      link.click()
                      // Show success message
                      alert(`Payslip for ${payslip.period} downloaded successfully!`)
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PayslipDetail({ payslip }: { payslip: any }) {
  return (
    <div className="bg-white p-8 font-mono text-sm" style={{ fontFamily: "monospace" }}>
      {/* Company Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">MIKADDO HOLDINGS LIMITED</h1>
        <h2 className="text-xl font-semibold text-gray-800">Payslip</h2>
      </div>

      {/* Header Information */}
      <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
        <div className="space-y-1">
          <div className="flex">
            <span className="w-16">Date:</span>
            <span className="font-semibold">{payslip.date}</span>
          </div>
          <div className="flex">
            <span className="w-16">Period:</span>
            <span className="font-semibold">{payslip.period}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex">
            <span className="w-20">SSF No.</span>
            <span className="font-semibold">{payslip.ssfNo}</span>
          </div>
          <div className="flex">
            <span className="w-20">Bank:</span>
            <span className="font-semibold">{payslip.bankName}</span>
          </div>
        </div>
      </div>

      {/* Employee Information */}
      <div className="mb-6 text-sm">
        <div className="mb-2">
          <span className="font-semibold">Employee Name: </span>
          <span className="font-bold">{payslip.employeeName}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Job Title: </span>
          <span className="font-semibold">{payslip.jobTitle}</span>
        </div>
        <div>
          <span className="font-semibold">Acc. Number: </span>
          <span className="font-semibold">{payslip.accountNumber}</span>
        </div>
      </div>

      {/* Main Payslip Table */}
      <div className="border-2 border-gray-800 mb-6">
        {/* Table Header */}
        <div className="grid grid-cols-4 border-b-2 border-gray-800 bg-gray-100">
          <div className="p-3 border-r border-gray-800 font-bold text-center">EARNINGS</div>
          <div className="p-3 border-r border-gray-800 font-bold text-center">AMT(GH¢)</div>
          <div className="p-3 border-r border-gray-800 font-bold text-center">DEDUCTIONS</div>
          <div className="p-3 font-bold text-center">AMT(GH¢)</div>
        </div>

        {/* Basic Salary Row */}
        <div className="grid grid-cols-4 border-b border-gray-400">
          <div className="p-3 border-r border-gray-800 font-semibold">BASIC SALARY</div>
          <div className="p-3 border-r border-gray-800 text-right font-semibold">{payslip.basicSalary.toFixed(2)}</div>
          <div className="p-3 border-r border-gray-800 font-semibold">SSNIT EMPLOYEE(5.5%)</div>
          <div className="p-3 text-right font-semibold">{payslip.deductions.ssnitEmployee.toFixed(2)}</div>
        </div>

        {/* Empty row for spacing */}
        <div className="grid grid-cols-4 border-b border-gray-400">
          <div className="p-3 border-r border-gray-800"></div>
          <div className="p-3 border-r border-gray-800"></div>
          <div className="p-3 border-r border-gray-800 font-semibold">INCOME TAX</div>
          <div className="p-3 text-right font-semibold">{payslip.deductions.paye.toFixed(2)}</div>
        </div>

        {/* Empty row for spacing */}
        <div className="grid grid-cols-4 border-b border-gray-400">
          <div className="p-3 border-r border-gray-800"></div>
          <div className="p-3 border-r border-gray-800"></div>
          <div className="p-3 border-r border-gray-800 font-semibold">PROVIDENT FUND (5%)</div>
          <div className="p-3 text-right font-semibold">{payslip.deductions.providentFundEmployee.toFixed(2)}</div>
        </div>

        {/* Welfare row */}
        <div className="grid grid-cols-4 border-b border-gray-400">
          <div className="p-3 border-r border-gray-800"></div>
          <div className="p-3 border-r border-gray-800"></div>
          <div className="p-3 border-r border-gray-800 font-semibold">WELFARE</div>
          <div className="p-3 text-right font-semibold">{payslip.deductions.welfare.toFixed(2)}</div>
        </div>

        {/* SSNIT Employer row */}
        <div className="grid grid-cols-4 border-b border-gray-400">
          <div className="p-3 border-r border-gray-800"></div>
          <div className="p-3 border-r border-gray-800"></div>
          <div className="p-3 border-r border-gray-800 font-semibold">SSNIT - EMPLOYER (13%)</div>
          <div className="p-3 text-right font-semibold">{payslip.ssnitEmployer.toFixed(2)}</div>
        </div>

        {/* Provident Fund Employer row */}
        <div className="grid grid-cols-4 border-b-2 border-gray-800">
          <div className="p-3 border-r border-gray-800"></div>
          <div className="p-3 border-r border-gray-800"></div>
          <div className="p-3 border-r border-gray-800 font-semibold">PROVIDENT FUND - EMPLOYER (5%)</div>
          <div className="p-3 text-right font-semibold">{payslip.deductions.providentFundEmployer.toFixed(2)}</div>
        </div>

        {/* Totals Row */}
        <div className="grid grid-cols-4 bg-gray-100">
          <div className="p-3 border-r border-gray-800 font-bold">GROSS SALARY</div>
          <div className="p-3 border-r border-gray-800 text-right font-bold">{payslip.grossSalary.toFixed(2)}</div>
          <div className="p-3 border-r border-gray-800 font-bold">TOTAL DEDUCTIONS</div>
          <div className="p-3 text-right font-bold">{payslip.totalDeductions.toFixed(2)}</div>
        </div>
      </div>

      {/* Net Pay */}
      <div className="text-center mb-8">
        <div className="inline-block border-2 border-gray-800 bg-gray-100 px-8 py-4">
          <span className="font-bold text-lg">NET PAY: {payslip.netPay.toFixed(2)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-gray-600 border-t pt-4">
        <div>
          <span className="font-semibold">akwaabahrpay - Welcome to Growth</span>
        </div>
        <div>
          <span>Print date: {payslip.printDate}</span>
        </div>
      </div>
    </div>
  )
}
