"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import {
  Calendar,
  Download,
  Search,
  Filter,
  Eye,
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  Calculator,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface PayrollRun {
  id: string
  pay_period_start: string
  pay_period_end: string
  pay_date: string
  total_gross_pay: number
  total_deductions: number
  total_net_pay: number
  status: string
  created_at: string
  employee_count: number
}

export default function PayrollHistoryPage() {
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
  const [filteredRuns, setFilteredRuns] = useState<PayrollRun[]>([])
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [yearFilter, setYearFilter] = useState("2025")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const itemsPerPage = 10

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchPayrollHistory = async () => {
      setIsLoading(true)
      // Simulate API call
      setTimeout(() => {
        const mockData: PayrollRun[] = [
          {
            id: "1",
            pay_period_start: "2025-01-01",
            pay_period_end: "2025-01-31",
            pay_date: "2025-02-05",
            total_gross_pay: 485200,
            total_deductions: 97040,
            total_net_pay: 388160,
            status: "completed",
            created_at: "2025-02-05T10:30:00Z",
            employee_count: 247,
          },
          {
            id: "2",
            pay_period_start: "2024-12-01",
            pay_period_end: "2024-12-31",
            pay_date: "2025-01-05",
            total_gross_pay: 472800,
            total_deductions: 94560,
            total_net_pay: 378240,
            status: "completed",
            created_at: "2025-01-05T10:30:00Z",
            employee_count: 245,
          },
          {
            id: "3",
            pay_period_start: "2024-11-01",
            pay_period_end: "2024-11-30",
            pay_date: "2024-12-05",
            total_gross_pay: 468500,
            total_deductions: 93700,
            total_net_pay: 374800,
            status: "completed",
            created_at: "2024-12-05T10:30:00Z",
            employee_count: 243,
          },
          {
            id: "4",
            pay_period_start: "2024-10-01",
            pay_period_end: "2024-10-31",
            pay_date: "2024-11-05",
            total_gross_pay: 461200,
            total_deductions: 92240,
            total_net_pay: 368960,
            status: "completed",
            created_at: "2024-11-05T10:30:00Z",
            employee_count: 240,
          },
          {
            id: "5",
            pay_period_start: "2024-09-01",
            pay_period_end: "2024-09-30",
            pay_date: "2024-10-05",
            total_gross_pay: 455800,
            total_deductions: 91160,
            total_net_pay: 364640,
            status: "completed",
            created_at: "2024-10-05T10:30:00Z",
            employee_count: 238,
          },
        ]
        setPayrollRuns(mockData)
        setFilteredRuns(mockData)
        setIsLoading(false)
      }, 500)
    }

    fetchPayrollHistory()
  }, [])

  // Filter payroll runs
  useEffect(() => {
    let filtered = [...payrollRuns]

    // Year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter((run) => run.pay_date.startsWith(yearFilter))
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((run) => run.status === statusFilter)
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (run) =>
          run.pay_period_start.includes(searchQuery) ||
          run.pay_period_end.includes(searchQuery) ||
          run.pay_date.includes(searchQuery),
      )
    }

    setFilteredRuns(filtered)
    setCurrentPage(1)
  }, [yearFilter, statusFilter, searchQuery, payrollRuns])

  // Calculate summary statistics
  const totalProcessed = filteredRuns.length
  const totalGrossPay = filteredRuns.reduce((sum, run) => sum + run.total_gross_pay, 0)
  const totalNetPay = filteredRuns.reduce((sum, run) => sum + run.total_net_pay, 0)
  const avgEmployees =
    filteredRuns.length > 0
      ? Math.round(filteredRuns.reduce((sum, run) => sum + run.employee_count, 0) / filteredRuns.length)
      : 0

  // Pagination
  const totalPages = Math.ceil(filteredRuns.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRuns = filteredRuns.slice(startIndex, endIndex)

  const formatCurrency = (amount: number) => {
    return `GHS ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800" },
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      draft: { label: "Draft", className: "bg-gray-100 text-gray-800" },
      failed: { label: "Failed", className: "bg-red-100 text-red-800" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft

    return <Badge className={config.className}>{config.label}</Badge>
  }

  const handleExportAll = () => {
    toast({
      title: "Export Started",
      description: "Payroll history is being exported to Excel.",
    })
  }

  const handleExportSingle = (run: PayrollRun) => {
    toast({
      title: "Export Started",
      description: `Exporting payroll for ${formatDate(run.pay_period_start)} - ${formatDate(run.pay_period_end)}`,
    })
  }

  const handleViewDetails = (run: PayrollRun) => {
    setSelectedRun(run)
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
          <Button variant="outline" onClick={handleExportAll}>
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Processed</p>
                <p className="text-2xl font-bold text-gray-900">{totalProcessed}</p>
                <p className="text-xs text-gray-500 mt-1">Payroll runs</p>
              </div>
              <FileText className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gross Pay</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalGrossPay)}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 text-emerald-600 mr-1" />
                  <span className="text-xs text-emerald-600">All periods</span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Net Pay</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalNetPay)}</p>
                <p className="text-xs text-gray-500 mt-1">After deductions</p>
              </div>
              <Calculator className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Employees</p>
                <p className="text-2xl font-bold text-gray-900">{avgEmployees}</p>
                <p className="text-xs text-gray-500 mt-1">Per payroll run</p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full md:w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payroll History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading payroll history...</p>
            </div>
          ) : currentRuns.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No payroll records found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pay Period</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pay Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Employees</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Gross Pay</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Deductions</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Net Pay</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRuns.map((run) => (
                      <tr key={run.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-gray-900">{formatDate(run.pay_period_start)}</div>
                          <div className="text-xs text-gray-500">to {formatDate(run.pay_period_end)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-900">{formatDate(run.pay_date)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-900">{run.employee_count}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(run.total_gross_pay)}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="text-sm text-gray-900">{formatCurrency(run.total_deductions)}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="text-sm font-semibold text-emerald-600">
                            {formatCurrency(run.total_net_pay)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">{getStatusBadge(run.status)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(run)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportSingle(run)}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredRuns.length)} of {filteredRuns.length}{" "}
                    records
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={currentPage === page ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payroll Details</DialogTitle>
            <DialogDescription>
              {selectedRun && (
                <>
                  Pay Period: {formatDate(selectedRun.pay_period_start)} - {formatDate(selectedRun.pay_period_end)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedRun && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Pay Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(selectedRun.pay_date)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Employees</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedRun.employee_count}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Total Gross Pay</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(selectedRun.total_gross_pay)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Total Deductions</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(selectedRun.total_deductions)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Total Net Pay</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(selectedRun.total_net_pay)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedRun.status)}</div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(selectedRun.created_at)}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setSelectedRun(null)}>
                  Close
                </Button>
                <Button onClick={() => handleExportSingle(selectedRun)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
