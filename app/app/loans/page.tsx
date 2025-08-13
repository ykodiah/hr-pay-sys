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
import { CreditCard, Plus, Calendar, DollarSign, TrendingDown, AlertCircle, CheckCircle, Clock } from "lucide-react"

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

export default function LoansPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const totalLoansAmount = loans.reduce((sum, loan) => sum + loan.amount, 0)
  const totalOutstanding = loans.reduce((sum, loan) => sum + loan.balance, 0)
  const activeLoans = loans.filter((loan) => loan.status === "Active").length
  const completedLoans = loans.filter((loan) => loan.status === "Completed").length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <Clock className="w-4 h-4 text-orange-600" />
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "Overdue":
        return <AlertCircle className="w-4 h-4 text-red-600" />
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

      {/* Loan Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Loans List */}
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
