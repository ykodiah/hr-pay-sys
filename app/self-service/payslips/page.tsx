"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Download, Eye, Calendar, DollarSign, Calculator, TrendingDown } from "lucide-react"

// Mock payslip data
const payslips = [
  {
    id: 1,
    period: "January 2025",
    basicSalary: 8500,
    allowances: 1200,
    grossPay: 9700,
    paye: 1455,
    ssnit: 873,
    otherDeductions: 0,
    netPay: 7372,
    payDate: "2025-01-31",
    status: "Paid",
  },
  {
    id: 2,
    period: "December 2024",
    basicSalary: 8500,
    allowances: 1000,
    grossPay: 9500,
    paye: 1425,
    ssnit: 855,
    otherDeductions: 0,
    netPay: 7220,
    payDate: "2024-12-31",
    status: "Paid",
  },
  {
    id: 3,
    period: "November 2024",
    basicSalary: 8500,
    allowances: 800,
    grossPay: 9300,
    paye: 1395,
    ssnit: 837,
    otherDeductions: 0,
    netPay: 7068,
    payDate: "2024-11-30",
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
                  GHS {filteredPayslips.reduce((sum, p) => sum + p.grossPay, 0).toLocaleString()}
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
                  GHS {filteredPayslips.reduce((sum, p) => sum + p.paye, 0).toLocaleString()}
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
                  GHS {filteredPayslips.reduce((sum, p) => sum + p.ssnit, 0).toLocaleString()}
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
                    <p className="font-medium text-gray-900">GHS {payslip.grossPay.toLocaleString()}</p>
                    <p className="text-gray-500">Gross Pay</p>
                  </div>
                  <div>
                    <p className="font-medium text-red-600">-GHS {payslip.paye.toLocaleString()}</p>
                    <p className="text-gray-500">PAYE</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-600">-GHS {payslip.ssnit.toLocaleString()}</p>
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
                    <DialogContent className="max-w-2xl">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">AkwaabaHRPay</h2>
        <p className="text-gray-600">Payslip for {payslip.period}</p>
      </div>

      {/* Employee Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Employee Name</p>
          <p className="text-lg font-semibold text-gray-900">Kwame Asante</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Employee ID</p>
          <p className="text-lg font-semibold text-gray-900">EMP-001</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Department</p>
          <p className="text-lg font-semibold text-gray-900">Technology</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Pay Date</p>
          <p className="text-lg font-semibold text-gray-900">{new Date(payslip.payDate).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Earnings */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Earnings</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Basic Salary</span>
            <span className="font-medium">GHS {payslip.basicSalary.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Allowances</span>
            <span className="font-medium">GHS {payslip.allowances.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Gross Pay</span>
            <span>GHS {payslip.grossPay.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Deductions */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Deductions</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">PAYE Tax</span>
            <span className="font-medium text-red-600">GHS {payslip.paye.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">SSNIT (Employee)</span>
            <span className="font-medium text-blue-600">GHS {payslip.ssnit.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total Deductions</span>
            <span className="text-red-600">GHS {(payslip.paye + payslip.ssnit).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Net Pay */}
      <div className="bg-emerald-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Net Pay</span>
          <span className="text-2xl font-bold text-emerald-600">GHS {payslip.netPay.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
