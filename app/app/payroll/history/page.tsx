"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  Download,
  Eye,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  ChevronRight,
  CheckCircle,
  Clock,
} from "lucide-react"
import Link from "next/link"

// Mock data - In production, this would come from the database
const mockPayrollHistory = [
  {
    id: "pr_2025_01",
    period: "January 2025",
    pay_period_start: "2025-01-01",
    pay_period_end: "2025-01-31",
    pay_date: "2025-01-31",
    status: "approved",
    total_employees: 247,
    total_gross_pay: 485200,
    total_deductions: 140708,
    total_net_pay: 344492,
    total_paye: 72780,
    total_ssnit: 43668,
    total_tier3: 24260,
    created_at: "2025-01-25T10:30:00Z",
    approved_at: "2025-01-30T14:20:00Z",
    approved_by: "John Doe",
  },
  {
    id: "pr_2024_12",
    period: "December 2024",
    pay_period_start: "2024-12-01",
    pay_period_end: "2024-12-31",
    pay_date: "2024-12-31",
    status: "approved",
    total_employees: 245,
    total_gross_pay: 478900,
    total_deductions: 138881,
    total_net_pay: 340019,
    total_paye: 71835,
    total_ssnit: 43101,
    total_tier3: 23945,
    created_at: "2024-12-20T09:15:00Z",
    approved_at: "2024-12-28T16:45:00Z",
    approved_by: "Jane Smith",
  },
  {
    id: "pr_2024_11",
    period: "November 2024",
    pay_period_start: "2024-11-01",
    pay_period_end: "2024-11-30",
    pay_date: "2024-11-30",
    status: "approved",
    total_employees: 243,
    total_gross_pay: 472100,
    total_deductions: 136909,
    total_net_pay: 335191,
    total_paye: 70815,
    total_ssnit: 42489,
    total_tier3: 23605,
    created_at: "2024-11-18T11:00:00Z",
    approved_at: "2024-11-27T13:30:00Z",
    approved_by: "John Doe",
  },
  {
    id: "pr_2024_10",
    period: "October 2024",
    pay_period_start: "2024-10-01",
    pay_period_end: "2024-10-31",
    pay_date: "2024-10-31",
    status: "approved",
    total_employees: 240,
    total_gross_pay: 465800,
    total_deductions: 134820,
    total_net_pay: 330980,
    total_paye: 69870,
    total_ssnit: 41922,
    total_tier3: 23028,
    created_at: "2024-10-19T10:45:00Z",
    approved_at: "2024-10-29T15:10:00Z",
    approved_by: "Jane Smith",
  },
  {
    id: "pr_2024_09",
    period: "September 2024",
    pay_period_start: "2024-09-01",
    pay_period_end: "2024-09-30",
    pay_date: "2024-09-30",
    status: "approved",
    total_employees: 238,
    total_gross_pay: 459200,
    total_deductions: 132890,
    total_net_pay: 326310,
    total_paye: 68940,
    total_ssnit: 41328,
    total_tier3: 22622,
    created_at: "2024-09-17T09:30:00Z",
    approved_at: "2024-09-28T14:00:00Z",
    approved_by: "John Doe",
  },
  {
    id: "pr_2024_08",
    period: "August 2024",
    pay_period_start: "2024-08-01",
    pay_period_end: "2024-08-31",
    pay_date: "2024-08-31",
    status: "approved",
    total_employees: 235,
    total_gross_pay: 452600,
    total_deductions: 130980,
    total_net_pay: 321620,
    total_paye: 68010,
    total_ssnit: 40734,
    total_tier3: 22236,
    created_at: "2024-08-16T10:00:00Z",
    approved_at: "2024-08-29T16:30:00Z",
    approved_by: "Jane Smith",
  },
]

export default function PayrollHistoryPage() {
  const [payrollHistory, setPayrollHistory] = useState(mockPayrollHistory)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null)

  // Calculate summary statistics
  const totalPayrollRuns = payrollHistory.length
  const totalEmployeesPaid = payrollHistory.reduce((sum, pr) => sum + pr.total_employees, 0)
  const totalGrossPaid = payrollHistory.reduce((sum, pr) => sum + pr.total_gross_pay, 0)
  const totalNetPaid = payrollHistory.reduce((sum, pr) => sum + pr.total_net_pay, 0)

  // Filter payroll history
  const filteredHistory = payrollHistory.filter((payroll) => {
    const matchesSearch =
      payroll.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || payroll.status === statusFilter
    const matchesYear =
      yearFilter === "all" || new Date(payroll.pay_period_start).getFullYear().toString() === yearFilter
    return matchesSearch && matchesStatus && matchesYear
  })

  // Get unique years for filter
  const years = Array.from(new Set(payrollHistory.map((pr) => new Date(pr.pay_period_start).getFullYear().toString())))

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return `GHS ${amount.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll History</h1>
          <p className="text-gray-600">View and manage historical payroll records</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <Link href="/app/payroll">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Calendar className="w-4 h-4 mr-2" />
              Current Payroll
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalPayrollRuns}</div>
                <p className="text-sm text-gray-600">Payroll Runs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalEmployeesPaid}</div>
                <p className="text-sm text-gray-600">Total Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalGrossPaid)}</div>
                <p className="text-sm text-gray-600">Total Gross</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalNetPaid)}</div>
                <p className="text-sm text-gray-600">Total Net</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by period or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-48">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payroll History List */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Records ({filteredHistory.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredHistory.map((payroll) => (
              <div
                key={payroll.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedPayroll(payroll)}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{payroll.period}</h3>
                      <Badge
                        variant="default"
                        className={
                          payroll.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : payroll.status === "pending"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                        }
                      >
                        {payroll.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {payroll.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                        {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {payroll.id}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span>
                        {formatDate(payroll.pay_period_start)} - {formatDate(payroll.pay_period_end)}
                      </span>
                      <span>•</span>
                      <span>{payroll.total_employees} employees</span>
                      <span>•</span>
                      <span>Paid on {formatDate(payroll.pay_date)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 text-center text-sm mr-4">
                  <div>
                    <p className="font-medium text-gray-900">{formatCurrency(payroll.total_gross_pay)}</p>
                    <p className="text-gray-500">Gross Pay</p>
                  </div>
                  <div>
                    <p className="font-medium text-red-600">-{formatCurrency(payroll.total_paye)}</p>
                    <p className="text-gray-500">PAYE</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-600">-{formatCurrency(payroll.total_ssnit)}</p>
                    <p className="text-gray-500">SSNIT</p>
                  </div>
                  <div>
                    <p className="font-medium text-emerald-600">{formatCurrency(payroll.total_net_pay)}</p>
                    <p className="text-gray-500">Net Pay</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}

            {filteredHistory.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payroll records found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payroll Details Modal */}
      {selectedPayroll && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPayroll(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPayroll.period} Payroll</h2>
                  <p className="text-gray-600 mt-1">
                    {formatDate(selectedPayroll.pay_period_start)} - {formatDate(selectedPayroll.pay_period_end)}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setSelectedPayroll(null)}>
                  Close
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Total Employees</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedPayroll.total_employees}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Gross Pay</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(selectedPayroll.total_gross_pay)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Total Deductions</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(selectedPayroll.total_deductions)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Net Pay</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(selectedPayroll.total_net_pay)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Tax Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax & Deductions Breakdown</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">PAYE Tax</p>
                      <p className="text-xl font-bold text-red-600">{formatCurrency(selectedPayroll.total_paye)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {((selectedPayroll.total_paye / selectedPayroll.total_gross_pay) * 100).toFixed(1)}% of gross
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">SSNIT Contributions</p>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(selectedPayroll.total_ssnit)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {((selectedPayroll.total_ssnit / selectedPayroll.total_gross_pay) * 100).toFixed(1)}% of gross
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-1">Tier 3 Pension</p>
                      <p className="text-xl font-bold text-purple-600">{formatCurrency(selectedPayroll.total_tier3)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {((selectedPayroll.total_tier3 / selectedPayroll.total_gross_pay) * 100).toFixed(1)}% of gross
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Approval Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Information</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Status</p>
                        <Badge
                          variant="default"
                          className={
                            selectedPayroll.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-orange-100 text-orange-800"
                          }
                        >
                          {selectedPayroll.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {selectedPayroll.status.charAt(0).toUpperCase() + selectedPayroll.status.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Approved By</p>
                        <p className="font-medium text-gray-900">{selectedPayroll.approved_by}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Created Date</p>
                        <p className="font-medium text-gray-900">{formatDate(selectedPayroll.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Approved Date</p>
                        <p className="font-medium text-gray-900">{formatDate(selectedPayroll.approved_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  View Payslips
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
