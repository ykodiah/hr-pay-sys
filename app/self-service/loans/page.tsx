"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Plus, CreditCard, Calendar, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react"

const initialLoans = [
  {
    id: 1,
    type: "Personal Loan",
    amount: 5000,
    requestDate: "2024-12-15",
    status: "Approved",
    approvedAmount: 5000,
    monthlyDeduction: 500,
    remainingBalance: 2500,
    approver: "HR Manager",
    reason: "Medical emergency",
  },
  {
    id: 2,
    type: "Salary Advance",
    amount: 2000,
    requestDate: "2024-11-20",
    status: "Completed",
    approvedAmount: 2000,
    monthlyDeduction: 400,
    remainingBalance: 0,
    approver: "Finance Officer",
    reason: "School fees payment",
  },
]

export default function LoansPage() {
  const [loans, setLoans] = useState(initialLoans)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [loanRequest, setLoanRequest] = useState({
    type: "",
    amount: "",
    reason: "",
    repaymentPeriod: "",
  })

  const handleSubmitRequest = () => {
    const newLoan = {
      id: loans.length + 1,
      type: loanRequest.type,
      amount: Number.parseFloat(loanRequest.amount),
      requestDate: new Date().toISOString().split("T")[0],
      status: "Pending",
      approvedAmount: 0,
      monthlyDeduction: 0,
      remainingBalance: 0,
      approver: "Pending Review",
      reason: loanRequest.reason,
    }

    setLoans([newLoan, ...loans])
    setIsRequestDialogOpen(false)
    setLoanRequest({ type: "", amount: "", reason: "", repaymentPeriod: "" })

    toast({
      title: "Loan Request Submitted",
      description: "Your loan request has been submitted for approval. You will be notified once reviewed.",
    })
  }

  const totalOutstanding = loans
    .filter((loan) => loan.status === "Approved")
    .reduce((sum, loan) => sum + loan.remainingBalance, 0)

  const monthlyDeductions = loans
    .filter((loan) => loan.status === "Approved" && loan.remainingBalance > 0)
    .reduce((sum, loan) => sum + loan.monthlyDeduction, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Requests</h1>
          <p className="text-gray-600">Manage your loan applications and track repayments</p>
        </div>
        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Request Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Loan Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="loanType">Loan Type</Label>
                <Select
                  value={loanRequest.type}
                  onValueChange={(value) => setLoanRequest({ ...loanRequest, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personal Loan">Personal Loan</SelectItem>
                    <SelectItem value="Salary Advance">Salary Advance</SelectItem>
                    <SelectItem value="Emergency Loan">Emergency Loan</SelectItem>
                    <SelectItem value="Education Loan">Education Loan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount (GHS)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={loanRequest.amount}
                  onChange={(e) => setLoanRequest({ ...loanRequest, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <Label htmlFor="repaymentPeriod">Repayment Period</Label>
                <Select
                  value={loanRequest.repaymentPeriod}
                  onValueChange={(value) => setLoanRequest({ ...loanRequest, repaymentPeriod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                    <SelectItem value="24">24 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reason">Reason for Loan</Label>
                <Textarea
                  id="reason"
                  value={loanRequest.reason}
                  onChange={(e) => setLoanRequest({ ...loanRequest, reason: e.target.value })}
                  placeholder="Explain why you need this loan"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Loan requests will be reviewed by HR and Finance teams. Approval depends on
                  your employment status and salary history.
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitRequest} className="bg-emerald-600 hover:bg-emerald-700">
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">GHS {totalOutstanding.toLocaleString()}</div>
                <p className="text-sm text-gray-600">Outstanding Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">GHS {monthlyDeductions.toLocaleString()}</div>
                <p className="text-sm text-gray-600">Monthly Deductions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{loans.length}</div>
                <p className="text-sm text-gray-600">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan History */}
      <Card>
        <CardHeader>
          <CardTitle>Loan History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loans.map((loan) => (
              <div key={loan.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      loan.status === "Approved"
                        ? "bg-emerald-100"
                        : loan.status === "Completed"
                          ? "bg-blue-100"
                          : loan.status === "Pending"
                            ? "bg-yellow-100"
                            : "bg-red-100"
                    }`}
                  >
                    {loan.status === "Approved" ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    ) : loan.status === "Completed" ? (
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    ) : loan.status === "Pending" ? (
                      <Clock className="w-6 h-6 text-yellow-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{loan.type}</h3>
                    <p className="text-sm text-gray-600">{loan.reason}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {loan.requestDate}
                      </div>
                      <div className="text-xs text-gray-500">Approver: {loan.approver}</div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-semibold text-gray-900">GHS {loan.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Requested</p>
                    </div>
                    {loan.status === "Approved" && (
                      <div>
                        <p className="font-semibold text-red-600">GHS {loan.remainingBalance.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Remaining</p>
                      </div>
                    )}
                    <Badge
                      variant={
                        loan.status === "Approved"
                          ? "default"
                          : loan.status === "Completed"
                            ? "secondary"
                            : loan.status === "Pending"
                              ? "outline"
                              : "destructive"
                      }
                      className={
                        loan.status === "Approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : loan.status === "Completed"
                            ? "bg-blue-100 text-blue-800"
                            : loan.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                      }
                    >
                      {loan.status}
                    </Badge>
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
