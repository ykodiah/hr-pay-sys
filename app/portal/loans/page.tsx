"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, CreditCard, DollarSign, Calendar, TrendingDown, AlertCircle } from "lucide-react"

// Mock loan data
const activeLoans = [
  {
    id: "loan_001",
    type: "Personal Loan",
    principal: 5000,
    balance: 2400,
    monthlyPayment: 400,
    interestRate: 12,
    startDate: "2024-06-01",
    endDate: "2025-05-31",
    status: "ACTIVE",
    nextPaymentDate: "2025-02-01",
  },
]

const loanHistory = [
  {
    id: "loan_002",
    type: "Emergency Loan",
    principal: 2000,
    balance: 0,
    monthlyPayment: 200,
    interestRate: 10,
    startDate: "2023-08-01",
    endDate: "2024-07-31",
    status: "COMPLETED",
    completedDate: "2024-07-31",
  },
]

const paymentHistory = [
  {
    id: "payment_001",
    loanId: "loan_001",
    amount: 400,
    paymentDate: "2025-01-01",
    principal: 350,
    interest: 50,
    balance: 2400,
  },
  {
    id: "payment_002",
    loanId: "loan_001",
    amount: 400,
    paymentDate: "2024-12-01",
    principal: 345,
    interest: 55,
    balance: 2750,
  },
  {
    id: "payment_003",
    loanId: "loan_001",
    amount: 400,
    paymentDate: "2024-11-01",
    principal: 340,
    interest: 60,
    balance: 3095,
  },
]

export default function LoansPage() {
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [formData, setFormData] = useState({
    amount: "",
    purpose: "",
    term: "12",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Loan application submitted:", formData)
    setShowApplicationForm(false)
    setFormData({ amount: "", purpose: "", term: "12" })
  }

  const totalBorrowed = activeLoans.reduce((sum, loan) => sum + loan.principal, 0)
  const totalBalance = activeLoans.reduce((sum, loan) => sum + loan.balance, 0)
  const monthlyPayments = activeLoans.reduce((sum, loan) => sum + loan.monthlyPayment, 0)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-3xl text-gray-900">Loans & Advances</h1>
          <p className="text-gray-600 mt-2">Manage your loan applications and track payments</p>
        </div>
        <Button onClick={() => setShowApplicationForm(true)} className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="mr-2 h-4 w-4" />
          Apply for Loan
        </Button>
      </div>

      {/* Loan Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {totalBorrowed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Principal amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">GHS {totalBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Remaining to pay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {monthlyPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Next due: Feb 1, 2025</p>
          </CardContent>
        </Card>
      </div>

      {/* Loan Application Form */}
      {showApplicationForm && (
        <Card className="border-cyan-200 bg-cyan-50">
          <CardHeader>
            <CardTitle className="font-serif">Apply for Loan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Loan Amount (GHS)</label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Enter amount"
                    min="500"
                    max="10000"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum: GHS 10,000</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Repayment Term</label>
                  <select
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="18">18 months</option>
                    <option value="24">24 months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Purpose of Loan</label>
                <Textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Please describe the purpose of this loan..."
                  rows={3}
                  required
                />
              </div>

              {formData.amount && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Loan Calculation</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Principal:</span>
                      <span className="font-medium ml-2">GHS {Number(formData.amount).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Interest Rate:</span>
                      <span className="font-medium ml-2">12% per annum</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Monthly Payment:</span>
                      <span className="font-medium ml-2">
                        GHS {Math.round((Number(formData.amount) * 1.12) / Number(formData.term)).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Total Repayment:</span>
                      <span className="font-medium ml-2">
                        GHS {Math.round(Number(formData.amount) * 1.12).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                  Submit Application
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowApplicationForm(false)}
                  className="bg-transparent"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Loans */}
      {activeLoans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeLoans.map((loan) => (
                <div key={loan.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{loan.type}</h3>
                        <p className="text-sm text-gray-600">Started {new Date(loan.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{loan.status}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Principal</p>
                      <p className="font-semibold">GHS {loan.principal.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Balance</p>
                      <p className="font-semibold text-orange-600">GHS {loan.balance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monthly Payment</p>
                      <p className="font-semibold">GHS {loan.monthlyPayment.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Interest Rate</p>
                      <p className="font-semibold">{loan.interestRate}% p.a.</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{Math.round(((loan.principal - loan.balance) / loan.principal) * 100)}% paid</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-cyan-600 h-2 rounded-full"
                        style={{ width: `${((loan.principal - loan.balance) / loan.principal) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <p className="text-sm text-orange-800">
                        Next payment of GHS {loan.monthlyPayment} due on{" "}
                        {new Date(loan.nextPaymentDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paymentHistory.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">GHS {payment.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p>Principal: GHS {payment.principal}</p>
                  <p>Interest: GHS {payment.interest}</p>
                  <p className="text-gray-600">Balance: GHS {payment.balance.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loan History */}
      {loanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Completed Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loanHistory.map((loan) => (
                <div key={loan.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{loan.type}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(loan.startDate).toLocaleDateString()} -{" "}
                          {new Date(loan.completedDate!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-gray-100 text-gray-700">
                      {loan.status}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Principal:</span>
                      <span className="font-medium ml-2">GHS {loan.principal.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Monthly Payment:</span>
                      <span className="font-medium ml-2">GHS {loan.monthlyPayment.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="font-medium ml-2">{loan.interestRate}% p.a.</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
