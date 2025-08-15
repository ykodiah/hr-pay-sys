"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  CreditCard,
  Plus,
  Calendar,
  DollarSign,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Check,
  X,
} from "lucide-react"

// Mock loan data
const loans = [
  {
    id: 1,
    employeeName: "Kwame Asante",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    loanType: "Personal Loan",
    amount: 15000,
    balance: 8500,
    monthlyDeduction: 750,
    startDate: "2024-06-01",
    endDate: "2025-12-01",
    status: "Active",
    interestRate: 12,
  },
  {
    id: 2,
    employeeName: "Ama Osei",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    loanType: "Emergency Loan",
    amount: 5000,
    balance: 1200,
    monthlyDeduction: 400,
    startDate: "2024-09-01",
    endDate: "2025-03-01",
    status: "Active",
    interestRate: 8,
  },
  {
    id: 3,
    employeeName: "Kofi Mensah",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    loanType: "Salary Advance",
    amount: 3000,
    balance: 0,
    monthlyDeduction: 0,
    startDate: "2024-08-01",
    endDate: "2024-12-01",
    status: "Completed",
    interestRate: 0,
  },
  {
    id: 4,
    employeeName: "Akosua Boateng",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    loanType: "Equipment Loan",
    amount: 8000,
    balance: 6400,
    monthlyDeduction: 400,
    startDate: "2024-10-01",
    endDate: "2026-10-01",
    status: "Active",
    interestRate: 10,
  },
]

const loanRequests = [
  {
    id: 1,
    employeeName: "Kwame Asante",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    employeeId: "EMP001",
    loanType: "Personal Loan",
    amount: 5000,
    purpose: "Medical Emergency",
    requestDate: "2025-01-15",
    status: "Pending",
    monthlyDeduction: 500,
    duration: 10,
    interestRate: 5,
    justification:
      "Need funds for urgent medical treatment for family member. Have been with company for 3 years with good payment history.",
  },
  {
    id: 2,
    employeeName: "Ama Osei",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    employeeId: "EMP002",
    loanType: "Salary Advance",
    amount: 2000,
    purpose: "School Fees",
    requestDate: "2025-01-10",
    status: "Pending",
    monthlyDeduction: 400,
    duration: 5,
    interestRate: 0,
    justification: "Need advance for children's school fees for new term starting next week.",
  },
  {
    id: 3,
    employeeName: "Kofi Mensah",
    employeeAvatar: "/placeholder.svg?height=40&width=40",
    employeeId: "EMP003",
    loanType: "Emergency Loan",
    amount: 1500,
    purpose: "Car Repair",
    requestDate: "2025-01-08",
    status: "Approved",
    monthlyDeduction: 300,
    duration: 5,
    interestRate: 3,
    justification: "Car broke down and need repairs to get to work. Essential for daily commute.",
    approvedDate: "2025-01-09",
    approvedBy: "John Doe",
  },
]

export default function LoansPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [requests, setRequests] = useState(loanRequests)

  const totalLoansAmount = loans.reduce((sum, loan) => sum + loan.amount, 0)
  const totalOutstanding = loans.reduce((sum, loan) => sum + loan.balance, 0)
  const activeLoans = loans.filter((loan) => loan.status === "Active").length
  const completedLoans = loans.filter((loan) => loan.status === "Completed").length

  const pendingRequests = requests.filter((req) => req.status === "Pending").length
  const approvedRequests = requests.filter((req) => req.status === "Approved").length

  const handleApproveRequest = (requestId: number, comments: string) => {
    setRequests(
      requests.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: "Approved",
              approvedDate: new Date().toISOString().split("T")[0],
              approvedBy: "John Doe",
              comments,
            }
          : req,
      ),
    )
    setIsApprovalDialogOpen(false)
    toast({
      title: "Loan Approved",
      description: "The loan request has been approved successfully.",
    })
  }

  const handleRejectRequest = (requestId: number, comments: string) => {
    setRequests(
      requests.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: "Rejected",
              rejectedDate: new Date().toISOString().split("T")[0],
              rejectedBy: "John Doe",
              comments,
            }
          : req,
      ),
    )
    setIsApprovalDialogOpen(false)
    toast({
      title: "Loan Rejected",
      description: "The loan request has been rejected.",
      variant: "destructive",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <Clock className="w-4 h-4 text-orange-600" />
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "Overdue":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case "Pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "Approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "Rejected":
        return <X className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-orange-100 text-orange-800">Active</Badge>
      case "Completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "Overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "Approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "Rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans & Advances</h1>
          <p className="text-gray-600">Manage employee loans and salary advances</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              New Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Loan</DialogTitle>
            </DialogHeader>
            <NewLoanForm onClose={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">GHS {totalLoansAmount.toLocaleString()}</div>
                <p className="text-sm text-gray-600">Total Loans Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
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
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{activeLoans}</div>
                <p className="text-sm text-gray-600">Active Loans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{completedLoans}</div>
                <p className="text-sm text-gray-600">Completed Loans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{pendingRequests}</div>
                <p className="text-sm text-gray-600">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{approvedRequests}</div>
                <p className="text-sm text-gray-600">Approved Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active-loans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active-loans">Active Loans</TabsTrigger>
          <TabsTrigger value="loan-requests">
            Loan Requests{" "}
            {pendingRequests > 0 && <Badge className="ml-2 bg-red-500 text-white">{pendingRequests}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active-loans">
          <Card>
            <CardHeader>
              <CardTitle>Employee Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loans.map((loan) => {
                  const progress = ((loan.amount - loan.balance) / loan.amount) * 100
                  return (
                    <div
                      key={loan.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={loan.employeeAvatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {loan.employeeName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900">{loan.employeeName}</h3>
                          <p className="text-sm text-gray-600">{loan.loanType}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(loan.startDate).toLocaleDateString()} -{" "}
                              {new Date(loan.endDate).toLocaleDateString()}
                            </div>
                            {loan.interestRate > 0 && (
                              <div className="flex items-center text-xs text-gray-500">
                                <DollarSign className="w-3 h-3 mr-1" />
                                {loan.interestRate}% interest
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-900">GHS {loan.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Loan Amount</p>
                        </div>

                        <div className="text-center">
                          <p className="text-lg font-semibold text-red-600">GHS {loan.balance.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Outstanding</p>
                        </div>

                        <div className="text-center">
                          <p className="text-lg font-semibold text-blue-600">
                            GHS {loan.monthlyDeduction.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">Monthly Deduction</p>
                        </div>

                        <div className="w-24">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        <div className="flex items-center space-x-2">
                          {getStatusIcon(loan.status)}
                          {getStatusBadge(loan.status)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loan-requests">
          <Card>
            <CardHeader>
              <CardTitle>Loan Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={request.employeeAvatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {request.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{request.employeeName}</h3>
                          <Badge variant="outline">{request.employeeId}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {request.loanType} - {request.purpose}
                        </p>
                        <p className="text-xs text-gray-500">
                          Requested on {new Date(request.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">GHS {request.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Amount</p>
                      </div>

                      <div className="text-center">
                        <p className="text-lg font-semibold text-blue-600">
                          GHS {request.monthlyDeduction.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Monthly Deduction</p>
                      </div>

                      <div className="text-center">
                        <p className="text-lg font-semibold text-purple-600">{request.duration} months</p>
                        <p className="text-xs text-gray-500">Duration</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request)
                            setIsApprovalDialogOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Loan Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <LoanApprovalForm
              request={selectedRequest}
              onApprove={handleApproveRequest}
              onReject={handleRejectRequest}
              onClose={() => setIsApprovalDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LoanApprovalForm({
  request,
  onApprove,
  onReject,
  onClose,
}: {
  request: any
  onApprove: (id: number, comments: string) => void
  onReject: (id: number, comments: string) => void
  onClose: () => void
}) {
  const [comments, setComments] = useState("")

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Employee</Label>
          <div className="flex items-center space-x-2 mt-1">
            <Avatar className="w-8 h-8">
              <AvatarImage src={request.employeeAvatar || "/placeholder.svg"} />
              <AvatarFallback>
                {request.employeeName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{request.employeeName}</p>
              <p className="text-sm text-gray-500">{request.employeeId}</p>
            </div>
          </div>
        </div>
        <div>
          <Label>Request Date</Label>
          <p className="mt-1 font-medium">{new Date(request.requestDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Loan Type</Label>
          <p className="mt-1 font-medium">{request.loanType}</p>
        </div>
        <div>
          <Label>Purpose</Label>
          <p className="mt-1 font-medium">{request.purpose}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Amount</Label>
          <p className="mt-1 font-medium text-lg">GHS {request.amount.toLocaleString()}</p>
        </div>
        <div>
          <Label>Duration</Label>
          <p className="mt-1 font-medium">{request.duration} months</p>
        </div>
        <div>
          <Label>Interest Rate</Label>
          <p className="mt-1 font-medium">{request.interestRate}%</p>
        </div>
      </div>

      <div>
        <Label>Justification</Label>
        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm">{request.justification}</p>
        </div>
      </div>

      <div>
        <Label>Monthly Deduction</Label>
        <p className="mt-1 font-medium text-lg text-blue-600">GHS {request.monthlyDeduction.toLocaleString()}</p>
      </div>

      <div>
        <Label htmlFor="comments">Comments (Optional)</Label>
        <Textarea
          id="comments"
          placeholder="Add any comments about this loan request..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </div>

      {request.status === "Pending" && (
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onReject(request.id, comments)}>
            <X className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onApprove(request.id, comments)}>
            <Check className="w-4 h-4 mr-2" />
            Approve
          </Button>
        </div>
      )}

      {request.status !== "Pending" && (
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  )
}

function NewLoanForm({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employee">Employee</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kwame">Kwame Asante</SelectItem>
              <SelectItem value="ama">Ama Osei</SelectItem>
              <SelectItem value="kofi">Kofi Mensah</SelectItem>
              <SelectItem value="akosua">Akosua Boateng</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="loanType">Loan Type</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select loan type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal Loan</SelectItem>
              <SelectItem value="emergency">Emergency Loan</SelectItem>
              <SelectItem value="advance">Salary Advance</SelectItem>
              <SelectItem value="equipment">Equipment Loan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Loan Amount (GHS)</Label>
          <Input id="amount" type="number" placeholder="10000" />
        </div>
        <div>
          <Label htmlFor="interestRate">Interest Rate (%)</Label>
          <Input id="interestRate" type="number" placeholder="10" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" type="date" />
        </div>
        <div>
          <Label htmlFor="duration">Duration (Months)</Label>
          <Input id="duration" type="number" placeholder="12" />
        </div>
      </div>

      <div>
        <Label htmlFor="purpose">Purpose</Label>
        <Textarea id="purpose" placeholder="Reason for loan request..." />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          Create Loan
        </Button>
      </div>
    </form>
  )
}
