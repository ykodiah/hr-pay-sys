"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Download, Eye, Search, FileText, DollarSign } from "lucide-react"

// Mock payslip data
const payslips = [
  {
    id: "payslip_001",
    period: "December 2024",
    payDate: "2024-12-31",
    grossPay: 4500,
    netPay: 3420,
    paye: 675,
    ssnit: 247.5,
    allowances: { transport: 200, lunch: 150 },
    deductions: { loan: 400, insurance: 50 },
    status: "PAID",
  },
  {
    id: "payslip_002",
    period: "November 2024",
    payDate: "2024-11-30",
    grossPay: 4500,
    netPay: 3420,
    paye: 675,
    ssnit: 247.5,
    allowances: { transport: 200, lunch: 150 },
    deductions: { loan: 400, insurance: 50 },
    status: "PAID",
  },
  {
    id: "payslip_003",
    period: "October 2024",
    payDate: "2024-10-31",
    grossPay: 4500,
    netPay: 3420,
    paye: 675,
    ssnit: 247.5,
    allowances: { transport: 200, lunch: 150 },
    deductions: { loan: 400, insurance: 50 },
    status: "PAID",
  },
  {
    id: "payslip_004",
    period: "September 2024",
    payDate: "2024-09-30",
    grossPay: 4500,
    netPay: 3420,
    paye: 675,
    ssnit: 247.5,
    allowances: { transport: 200, lunch: 150 },
    deductions: { loan: 400, insurance: 50 },
    status: "PAID",
  },
]

export default function PayslipsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedYear, setSelectedYear] = useState("2024")

  const filteredPayslips = payslips.filter((payslip) => {
    const matchesSearch = payslip.period.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesYear = payslip.period.includes(selectedYear)
    return matchesSearch && matchesYear
  })

  const totalGross = payslips.reduce((sum, p) => sum + p.grossPay, 0)
  const totalNet = payslips.reduce((sum, p) => sum + p.netPay, 0)
  const totalTax = payslips.reduce((sum, p) => sum + p.paye + p.ssnit, 0)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-3xl text-gray-900">My Payslips</h1>
          <p className="text-gray-600 mt-2">View and download your salary statements</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Download className="mr-2 h-4 w-4" />
          Download All
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gross Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {totalGross.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Year to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {totalNet.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">After deductions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {totalTax.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Tax + SSNIT + Others</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search payslips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Payslips List */}
      <div className="space-y-4">
        {filteredPayslips.map((payslip) => (
          <Card key={payslip.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-lg">{payslip.period}</h3>
                    <p className="text-gray-600">Paid on {new Date(payslip.payDate).toLocaleDateString()}</p>
                    <Badge className="mt-1 bg-green-100 text-green-800">{payslip.status}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Gross Pay</p>
                    <p className="font-semibold text-lg">GHS {payslip.grossPay.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Deductions</p>
                    <p className="font-semibold text-lg text-red-600">
                      GHS{" "}
                      {(
                        payslip.paye +
                        payslip.ssnit +
                        Object.values(payslip.deductions).reduce((a, b) => a + b, 0)
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Net Pay</p>
                    <p className="font-semibold text-lg text-green-600">GHS {payslip.netPay.toLocaleString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="bg-transparent">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900">Allowances</h4>
                    {Object.entries(payslip.allowances).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key}:</span>
                        <span className="font-medium">GHS {value}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900">Tax & Statutory</h4>
                    <div className="flex justify-between">
                      <span className="text-gray-600">PAYE:</span>
                      <span className="font-medium">GHS {payslip.paye}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SSNIT:</span>
                      <span className="font-medium">GHS {payslip.ssnit}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900">Other Deductions</h4>
                    {Object.entries(payslip.deductions).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key}:</span>
                        <span className="font-medium">GHS {value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPayslips.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No payslips found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or year filter.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
