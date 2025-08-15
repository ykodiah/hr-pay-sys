"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { CreditCard, Plus, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react"

export default function LoansPage() {
  const [isNewLoanDialogOpen, setIsNewLoanDialogOpen] = useState(false)
  const [loanRequests, setLoanRequests] = useState([
    {
      id: 1,
      type: "Personal Loan",
      amount: 5000,
      purpose: "Medical Emergency",
      requestDate: "2025-01-15",
      status: "Pending",
      approver: "John Doe - HR Manager",
      monthlyDeduction: 500,
      duration: 10,
      interestRate: 5,
    },
    {
      id: 2,
      type: "Salary Advance",
      amount: 2000,
      purpose: "School Fees",
      requestDate: "2024-12-20",
      status: "Approved",
      approver: "John Doe - HR Manager",
      monthlyDeduction: 400,
      duration: 5,
      interestRate: 0,
      approvedDate: "2024-12-22",
    },
    {
      id: 3,
      type: "Emergency Loan",
      amount: 1500,
      purpose: "Car Repair",
      requestDate: "2024-11-10",
      status: "Completed",
      approver: "John Doe - HR Manager",
      monthlyDeduction: 300,
      duration: 5,
      interestRate: 3,
      completedDate: "2024-12-15",
    },
  ])

  const [newLoanData, setNewLoanData] = useState({
    type: "",
    amount: "",
    purpose: "",
    duration: "",
    justification: "",
  })

  const handleSubmitLoan = () => {
    const newLoan = {
      id: loanRequests.length + 1,
      type: newLoanData.type,
      amount: Number.parseFloat(newLoanData.amount),
      purpose: newLoanData.purpose,
      requestDate: new Date().toISOString().split("T")[0],
      status: "Pending",
      approver: "John Doe - HR Manager",
      monthlyDeduction: Math.ceil(Number.parseFloat(newLoanData.amount) / Number.parseInt(newLoanData.duration)),
      duration: Number.parseInt(newLoanData.duration),
      interestRate: newLoanData.type === "Salary Advance" ? 0 : 5,
    }

    setLoanRequests([newLoan, ...loanRequests])
    setNewLoanData({ type: "", amount: "", purpose: "", duration: "", justification: "" })
    setIsNewLoanDialogOpen(false)
    toast({
      title: "Loan Request Submitted",
      description: "Your loan request has been submitted for approval. You will be notified once reviewed.",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Approved":
        return "bg-green-100 text-green-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      case "Completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4" />
      case "Approved":
        return <CheckCircle className="w-4 h-4" />
      case "Rejected":
        return <XCircle className="w-4 h-4" />
      case "Completed":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const totalActiveLoans = loanRequests.filter((loan) => loan.status === "Approved").length
  const totalOutstanding = loanRequests
    .filter((loan) => loan.status === "Approved")
    .reduce((sum, loan) => sum + loan.amount, 0)
  const monthlyDeductions = loanRequests
    .filter((loan) => loan.status === "Approved")
    .reduce((sum, loan) => sum + loan.monthlyDeduction, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Requests</h1>
          <p className="text-gray-600">Manage your loan applications and track repayments</p>
        </div>
        <Dialog open={isNewLoanDialogOpen} onOpenChange={setIsNewLoanDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              New Loan Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Loan Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="loanType">Loan Type</Label>
                <Select
                  value={newLoanData.type}
                  onValueChange={(value) => setNewLoanData({ ...newLoanData, type: value })}
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
                  placeholder="Enter amount"
                  value={newLoanData.amount}
                  onChange={(e) => setNewLoanData({ ...newLoanData, amount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="duration">Repayment Duration (months)</Label>
                <Select
                  value={newLoanData.duration}
                  onValueChange={(value) => setNewLoanData({ ...newLoanData, duration: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="18">18 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  placeholder="Brief purpose of loan"
                  value={newLoanData.purpose}
                  onChange={(e) => setNewLoanData({ ...newLoanData, purpose: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="justification">Justification</Label>
                <Textarea
                  id="justification"
                  placeholder="Provide detailed justification for the loan request"
                  value={newLoanData.justification}
                  onChange={(e) => setNewLoanData({ ...newLoanData, justification: e.target.value })}
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Loan requests will be reviewed by your HR Manager (John Doe). You will receive
                  notification once your request is processed.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsNewLoanDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitLoan} className="bg-emerald-600 hover:bg-emerald-700">
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalActiveLoans}</p>
                <p className="text-sm text-gray-600">Active Loans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">GHS {totalOutstanding.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Outstanding Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">GHS {monthlyDeductions.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Monthly Deductions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Loan History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loanRequests.map((loan) => (
              <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{loan.type}</h3>
                      <Badge className={getStatusColor(loan.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(loan.status)}
                          <span>{loan.status}</span>
                        </div>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{loan.purpose}</p>
                    <p className="text-xs text-gray-500">
                      Requested on {new Date(loan.requestDate).toLocaleDateString()} • Approver: {loan.approver}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">GHS {loan.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">
                    GHS {loan.monthlyDeduction}/month × {loan.duration} months
                  </p>
                  {loan.interestRate > 0 && <p className="text-xs text-gray-500">{loan.interestRate}% interest</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
