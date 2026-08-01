"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { EmployeeLoan, LoanSchedule } from "@/lib/services/loan-advanced-service"
import { Calendar, DollarSign, TrendingDown, Eye, Download, Loader2 } from "lucide-react"
import { exportTableToPDF } from "@/lib/utils/pdf-export"

interface MyLoansProps {
  companyId: string
  employeeId: string
  employeeName: string
}

export function MyLoans({ companyId, employeeId, employeeName }: MyLoansProps) {
  const [loans, setLoans] = useState<EmployeeLoan[]>([])
  const [schedules, setSchedules] = useState<{ [key: string]: LoanSchedule[] }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchLoans()
  }, [employeeId, companyId])

  const fetchLoans = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/loans/employee-loans?employee_id=${employeeId}&company_id=${companyId}`
      )
      if (response.ok) {
        const data = await response.json()
        setLoans(data)
        if (data.length > 0 && !selectedLoanId) {
          setSelectedLoanId(data[0].id)
          await fetchSchedules(data[0].id)
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching loans:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSchedules = async (loanId: string) => {
    try {
      const response = await fetch(
        `/api/loans/schedules?employee_id=${employeeId}&loan_id=${loanId}`
      )
      if (response.ok) {
        const data = await response.json()
        setSchedules((prev) => ({ ...prev, [loanId]: data }))
      }
    } catch (error) {
      console.error("[v0] Error fetching schedules:", error)
    }
  }

  const handleLoanSelect = (loanId: string) => {
    setSelectedLoanId(loanId)
    if (!schedules[loanId]) {
      fetchSchedules(loanId)
    }
  }

  const handleExportSchedule = async () => {
    if (!selectedLoanId) return

    try {
      setIsExporting(true)
      const loan = loans.find((l) => l.id === selectedLoanId)
      if (!loan) return

      await exportTableToPDF(`schedule-table-${selectedLoanId}`, {
        filename: `Loan-Schedule-${loan.id.slice(0, 8)}.pdf`,
        title: `Loan Schedule - ${employeeName}`,
        orientation: "landscape",
      })
    } catch (error) {
      console.error("[v0] Error exporting schedule:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; color: string } } = {
      active: { label: "Active", color: "bg-green-100 text-green-800" },
      disbursed: { label: "Disbursed", color: "bg-blue-100 text-blue-800" },
      completed: { label: "Completed", color: "bg-gray-100 text-gray-800" },
      pending_approval: { label: "Pending Approval", color: "bg-yellow-100 text-yellow-800" },
      defaulted: { label: "Defaulted", color: "bg-red-100 text-red-800" },
    }

    const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-800" }
    return <Badge className={config.color}>{config.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (loans.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">No loans found. Apply for a loan to get started.</p>
        </CardContent>
      </Card>
    )
  }

  const selectedLoan = loans.find((l) => l.id === selectedLoanId)
  const loanSchedules = selectedLoanId ? schedules[selectedLoanId] || [] : []

  return (
    <div className="space-y-6">
      {/* Loan Cards */}
      <div className="grid gap-4">
        {loans.map((loan) => (
          <Card
            key={loan.id}
            className={`cursor-pointer transition-all ${
              selectedLoanId === loan.id ? "ring-2 ring-blue-500" : "hover:shadow-lg"
            }`}
            onClick={() => handleLoanSelect(loan.id)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Loan #{loan.id.slice(0, 8)}</CardTitle>
                  <CardDescription>Applied on {new Date(loan.created_at).toLocaleDateString()}</CardDescription>
                </div>
                {getStatusBadge(loan.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Principal Amount</p>
                  <p className="text-lg font-semibold">
                    {loan.principal_amount?.toLocaleString("en-US", {
                      style: "currency",
                      currency: "GHS",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Payment</p>
                  <p className="text-lg font-semibold">
                    {loan.monthly_installment?.toLocaleString("en-US", {
                      style: "currency",
                      currency: "GHS",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Outstanding Balance</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {loan.outstanding_balance?.toLocaleString("en-US", {
                      style: "currency",
                      currency: "GHS",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tenure</p>
                  <p className="text-lg font-semibold">{loan.tenure_months} months</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Loan Details */}
      {selectedLoan && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loan Details</CardTitle>
              <CardDescription>Complete information about your loan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Principal
                  </p>
                  <p className="text-xl font-bold">
                    {selectedLoan.principal_amount?.toLocaleString("en-US", {
                      style: "currency",
                      currency: "GHS",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Outstanding
                  </p>
                  <p className="text-xl font-bold text-orange-600">
                    {selectedLoan.outstanding_balance?.toLocaleString("en-US", {
                      style: "currency",
                      currency: "GHS",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Interest Rate</p>
                  <p className="text-xl font-bold">{selectedLoan.interest_rate}% p.a.</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Interest</p>
                  <p className="text-xl font-bold">
                    {selectedLoan.total_interest?.toLocaleString("en-US", {
                      style: "currency",
                      currency: "GHS",
                    })}
                  </p>
                </div>
              </div>

              {selectedLoan.disbursement_date && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Disbursed On:</span>
                    <span className="font-semibold">
                      {new Date(selectedLoan.disbursement_date).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedLoan.first_payment_date && (
                    <div className="flex justify-between">
                      <span>First Payment:</span>
                      <span className="font-semibold">
                        {new Date(selectedLoan.first_payment_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {selectedLoan.final_payment_date && (
                    <div className="flex justify-between">
                      <span>Final Payment:</span>
                      <span className="font-semibold">
                        {new Date(selectedLoan.final_payment_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Schedule */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payment Schedule</CardTitle>
                <CardDescription>Your amortization schedule</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleExportSchedule}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {loanSchedules.length === 0 ? (
                <p className="text-center text-gray-600 py-6">No payment schedule available yet.</p>
              ) : (
                <div id={`schedule-table-${selectedLoanId}`} className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">Payment #</th>
                        <th className="px-4 py-2 text-right">Due Date</th>
                        <th className="px-4 py-2 text-right">Principal</th>
                        <th className="px-4 py-2 text-right">Interest</th>
                        <th className="px-4 py-2 text-right">Total Payment</th>
                        <th className="px-4 py-2 text-right">Paid</th>
                        <th className="px-4 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanSchedules.map((schedule) => (
                        <tr key={schedule.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2">{schedule.payment_number}</td>
                          <td className="px-4 py-2 text-right">
                            {new Date(schedule.due_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {schedule.principal_amount.toLocaleString("en-US", {
                              style: "currency",
                              currency: "GHS",
                            })}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {schedule.interest_amount.toLocaleString("en-US", {
                              style: "currency",
                              currency: "GHS",
                            })}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold">
                            {schedule.total_payment.toLocaleString("en-US", {
                              style: "currency",
                              currency: "GHS",
                            })}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {schedule.paid_amount.toLocaleString("en-US", {
                              style: "currency",
                              currency: "GHS",
                            })}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {schedule.payment_status === "paid" ? (
                              <Badge className="bg-green-100 text-green-800">Paid</Badge>
                            ) : schedule.payment_status === "pending" ? (
                              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                            ) : (
                              <Badge className="bg-orange-100 text-orange-800">{schedule.payment_status}</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
