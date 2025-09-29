"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Download, FileText, ChevronLeft, ChevronRight } from "lucide-react"

// Mock data - in production, this would come from your Supabase database
const mockPayrollData = [
  {
    id: "1",
    payPeriod: "Jan 1 - Jan 31, 2025",
    payDate: "2025-01-31",
    employeeCount: 156,
    grossPay: 842500,
    netPay: 663450,
    status: "completed",
  },
  {
    id: "2",
    payPeriod: "Dec 1 - Dec 31, 2024",
    payDate: "2024-12-31",
    employeeCount: 154,
    grossPay: 825000,
    netPay: 650200,
    status: "completed",
  },
  {
    id: "3",
    payPeriod: "Nov 1 - Nov 30, 2024",
    payDate: "2024-11-30",
    employeeCount: 152,
    grossPay: 815000,
    netPay: 642100,
    status: "completed",
  },
  {
    id: "4",
    payPeriod: "Oct 1 - Oct 31, 2024",
    payDate: "2024-10-31",
    employeeCount: 150,
    grossPay: 805000,
    netPay: 634500,
    status: "completed",
  },
  {
    id: "5",
    payPeriod: "Sep 1 - Sep 30, 2024",
    payDate: "2024-09-30",
    employeeCount: 148,
    grossPay: 795000,
    netPay: 626800,
    status: "completed",
  },
]

const statusColors = {
  completed: "bg-green-100 text-green-800 hover:bg-green-100",
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  approved: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  draft: "bg-gray-100 text-gray-800 hover:bg-gray-100",
}

export function PayrollHistoryTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(mockPayrollData.length / itemsPerPage)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Pay Period</TableHead>
              <TableHead className="font-semibold text-gray-700">Pay Date</TableHead>
              <TableHead className="font-semibold text-gray-700">Employees</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">Gross Pay</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">Net Pay</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPayrollData.map((payroll, index) => (
              <TableRow key={payroll.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <TableCell className="font-medium text-gray-900">{payroll.payPeriod}</TableCell>
                <TableCell className="text-gray-600">{formatDate(payroll.payDate)}</TableCell>
                <TableCell className="text-gray-600">{payroll.employeeCount}</TableCell>
                <TableCell className="text-right text-gray-900 font-medium">
                  {formatCurrency(payroll.grossPay)}
                </TableCell>
                <TableCell className="text-right text-gray-900 font-semibold">
                  {formatCurrency(payroll.netPay)}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[payroll.status as keyof typeof statusColors]}>
                    {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download Report
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        Export Payslips
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{" "}
          <span className="font-medium">{mockPayrollData.length}</span> results
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="bg-white"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-white"}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="bg-white"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
