"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  Download,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import Link from "next/link"

interface PayrollItem {
  id: string
  employee_id: string
  basic_salary: number
  gross_pay: number
  total_deductions: number
  net_pay: number
  tax_deduction: number
  ssnit_employee: number
  ssnit_employer: number
  allowances: any
  deductions: any
  employees: {
    full_name: string
    employee_id: string
    position: string
    department: string
  }
}

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
  created_by: {
    full_name: string
    employee_id: string
  } | null
  approved_by: {
    full_name: string
    employee_id: string
  } | null
  payroll_items: PayrollItem[]
}

interface PayrollDetailClientProps {
  payrollRun: PayrollRun
}

export function PayrollDetailClient({ payrollRun }: PayrollDetailClientProps) {
  const [sortField, setSortField] = useState<keyof PayrollItem>("employees")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
    }).format(amount || 0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: any }
    > = {
      approved: { variant: "default", label: "Approved", icon: CheckCircle },
      pending: { variant: "secondary", label: "Pending", icon: Clock },
      draft: { variant: "outline", label: "Draft", icon: FileText },
    }
    const config = variants[status] || { variant: "outline" as const, label: status, icon: FileText }
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="capitalize gap-1.5">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const sortedItems = [...payrollRun.payroll_items].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]

    if (sortField === "employees") {
      aValue = a.employees?.full_name || ""
      bValue = b.employees?.full_name || ""
    }

    if (typeof aValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return sortDirection === "asc" ? aValue - bValue : bValue - aValue
  })

  const handleSort = (field: keyof PayrollItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Calculate summary statistics
  const totalEmployees = payrollRun.payroll_items.length
  const totalTax = payrollRun.payroll_items.reduce((sum, item) => sum + (item.tax_deduction || 0), 0)
  const totalSSNIT = payrollRun.payroll_items.reduce(
    (sum, item) => sum + (item.ssnit_employee || 0) + (item.ssnit_employer || 0),
    0,
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/payroll-history">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payroll Details</h1>
              <p className="text-gray-600 mt-1">
                {formatDate(payrollRun.pay_period_start)} - {formatDate(payrollRun.pay_period_end)}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Status and Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Status</p>
                {getStatusBadge(payrollRun.status)}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Pay Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="font-medium">{formatDate(payrollRun.pay_date)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Created By</p>
                <p className="font-medium">{payrollRun.created_by?.full_name || "System"}</p>
              </div>
              {payrollRun.approved_by && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Approved By</p>
                  <p className="font-medium">{payrollRun.approved_by.full_name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Gross Pay</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(payrollRun.total_gross_pay)}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Deductions</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(payrollRun.total_deductions)}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Net Pay</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(payrollRun.total_net_pay)}</p>
                </div>
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-cyan-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown Card */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Breakdown</CardTitle>
            <CardDescription>Detailed breakdown of taxes and contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Total Tax (PAYE)</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalTax)}</p>
                <p className="text-xs text-gray-500">
                  {((totalTax / payrollRun.total_gross_pay) * 100).toFixed(1)}% of gross pay
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Total SSNIT</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSSNIT)}</p>
                <p className="text-xs text-gray-500">Employee + Employer contributions</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Other Deductions</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(payrollRun.total_deductions - totalTax - totalSSNIT)}
                </p>
                <p className="text-xs text-gray-500">Loans, advances, and other deductions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Payroll Details</CardTitle>
            <CardDescription>Individual employee payment breakdown for this pay period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold cursor-pointer" onClick={() => handleSort("employees")}>
                      Employee
                    </TableHead>
                    <TableHead className="font-semibold">Position</TableHead>
                    <TableHead className="font-semibold">Department</TableHead>
                    <TableHead
                      className="font-semibold text-right cursor-pointer"
                      onClick={() => handleSort("basic_salary")}
                    >
                      Basic Salary
                    </TableHead>
                    <TableHead
                      className="font-semibold text-right cursor-pointer"
                      onClick={() => handleSort("gross_pay")}
                    >
                      Gross Pay
                    </TableHead>
                    <TableHead
                      className="font-semibold text-right cursor-pointer"
                      onClick={() => handleSort("total_deductions")}
                    >
                      Deductions
                    </TableHead>
                    <TableHead
                      className="font-semibold text-right cursor-pointer"
                      onClick={() => handleSort("net_pay")}
                    >
                      Net Pay
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div>
                          <p className="font-medium">{item.employees?.full_name}</p>
                          <p className="text-xs text-gray-500">{item.employees?.employee_id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{item.employees?.position || "-"}</TableCell>
                      <TableCell className="text-sm">{item.employees?.department || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.basic_salary)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.gross_pay)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(item.total_deductions)}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        {formatCurrency(item.net_pay)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
