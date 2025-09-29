"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Calendar, DollarSign, Users, TrendingUp, Filter, X } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface PayrollRun {
  id: string
  pay_period_start: string
  pay_period_end: string
  pay_date: string
  status: string
  total_gross_pay: number
  total_deductions: number
  total_net_pay: number
  created_at: string
  approved_at: string | null
  payroll_items: Array<{
    id: string
    employee_id: string
    employees: {
      full_name: string
      employee_id: string
    }
  }>
}

interface PayrollHistoryClientProps {
  initialData: PayrollRun[]
}

export function PayrollHistoryClient({ initialData }: PayrollHistoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalRuns = initialData.length
    const totalEmployees = new Set(
      initialData.flatMap((run) => run.payroll_items?.map((item) => item.employee_id) || []),
    ).size
    const totalPaid = initialData
      .filter((run) => run.status === "approved")
      .reduce((sum, run) => sum + (run.total_net_pay || 0), 0)
    const avgPayroll =
      initialData.length > 0
        ? initialData.reduce((sum, run) => sum + (run.total_net_pay || 0), 0) / initialData.length
        : 0

    return { totalRuns, totalEmployees, totalPaid, avgPayroll }
  }, [initialData])

  // Filter payroll runs
  const filteredData = useMemo(() => {
    return initialData.filter((run) => {
      // Status filter
      if (statusFilter !== "all" && run.status !== statusFilter) {
        return false
      }

      // Date filter
      if (dateFilter !== "all") {
        const payDate = new Date(run.pay_date)
        const now = new Date()
        const monthsAgo = new Date(now.setMonth(now.getMonth() - Number.parseInt(dateFilter)))
        if (payDate < monthsAgo) {
          return false
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const payPeriod = `${run.pay_period_start} to ${run.pay_period_end}`.toLowerCase()
        const employeeNames = run.payroll_items?.map((item) => item.employees?.full_name?.toLowerCase() || "") || []
        return (
          payPeriod.includes(query) ||
          run.status.toLowerCase().includes(query) ||
          employeeNames.some((name) => name.includes(query))
        )
      }

      return true
    })
  }, [initialData, searchQuery, statusFilter, dateFilter])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      approved: { variant: "default", label: "Approved" },
      pending: { variant: "secondary", label: "Pending" },
      draft: { variant: "outline", label: "Draft" },
      rejected: { variant: "destructive", label: "Rejected" },
    }
    const config = variants[status] || { variant: "outline" as const, label: status }
    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const hasActiveFilters = statusFilter !== "all" || dateFilter !== "all" || searchQuery !== ""

  const clearFilters = () => {
    setStatusFilter("all")
    setDateFilter("all")
    setSearchQuery("")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll History</h1>
            <p className="text-gray-600 mt-1">Review and manage past payment records</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Link href="/payroll/new">
              <Button className="bg-cyan-800 hover:bg-cyan-900 gap-2">
                <DollarSign className="w-4 h-4" />
                New Payroll Run
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Runs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRuns}</p>
                </div>
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-cyan-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPaid)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Payroll</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.avgPayroll)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Filter Payroll Records</CardTitle>
                <CardDescription>Search and filter by status, date, or employee</CardDescription>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by period or employee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="3">Last 3 Months</SelectItem>
                  <SelectItem value="6">Last 6 Months</SelectItem>
                  <SelectItem value="12">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Records</CardTitle>
            <CardDescription>
              Showing {filteredData.length} of {initialData.length} payroll runs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Pay Period</TableHead>
                    <TableHead className="font-semibold">Pay Date</TableHead>
                    <TableHead className="font-semibold">Employees</TableHead>
                    <TableHead className="font-semibold text-right">Gross Pay</TableHead>
                    <TableHead className="font-semibold text-right">Deductions</TableHead>
                    <TableHead className="font-semibold text-right">Net Pay</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                        <Filter className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No payroll records found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or search query</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((run) => (
                      <TableRow key={run.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {format(new Date(run.pay_period_start), "MMM d")} -{" "}
                          {format(new Date(run.pay_period_end), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{format(new Date(run.pay_date), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{run.payroll_items?.length || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(run.total_gross_pay || 0)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(run.total_deductions || 0)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          {formatCurrency(run.total_net_pay || 0)}
                        </TableCell>
                        <TableCell>{getStatusBadge(run.status)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/payroll-history/${run.id}`}>
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
