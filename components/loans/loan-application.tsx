"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { LoanType } from "@/lib/services/loan-advanced-service"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

interface LoanApplicationProps {
  companyId: string
  employeeId: string
  onSuccess?: () => void
}

export function LoanApplication({ companyId, employeeId, onSuccess }: LoanApplicationProps) {
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([])
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType | null>(null)
  const [formData, setFormData] = useState({
    loan_type_id: "",
    principal_amount: "",
    tenure_months: "",
    reason: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLoanTypes()
  }, [])

  const fetchLoanTypes = async () => {
    try {
      const response = await fetch(`/api/loans/loan-types?company_id=${companyId}`)
      if (response.ok) {
        const data = await response.json()
        setLoanTypes(data)
      }
    } catch (err) {
      console.error("[v0] Error fetching loan types:", err)
      setError("Failed to load loan types")
    }
  }

  const handleLoanTypeChange = (loanTypeId: string) => {
    setFormData((prev) => ({ ...prev, loan_type_id: loanTypeId }))
    const loanType = loanTypes.find((lt) => lt.id === loanTypeId)
    setSelectedLoanType(loanType || null)
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setError(null)
  }

  const calculateMonthlyPayment = () => {
    if (!selectedLoanType || !formData.principal_amount || !formData.tenure_months) {
      return null
    }

    const principal = parseFloat(formData.principal_amount)
    const months = parseInt(formData.tenure_months)
    const rate = selectedLoanType.annual_interest_rate / 100 / 12

    if (selectedLoanType.interest_type === "fixed") {
      const totalInterest = principal * (selectedLoanType.annual_interest_rate / 100 / 12) * months
      return (principal + totalInterest) / months
    } else {
      // Reducing balance approximation
      return (principal * (rate * Math.pow(1 + rate, months))) / (Math.pow(1 + rate, months) - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.loan_type_id || !formData.principal_amount || !formData.tenure_months) {
      setError("Please fill in all required fields")
      return
    }

    const principal = parseFloat(formData.principal_amount)
    const tenure = parseInt(formData.tenure_months)

    if (!selectedLoanType) return

    // Validate against loan type constraints
    if (principal < selectedLoanType.min_amount || principal > selectedLoanType.max_amount) {
      setError(
        `Loan amount must be between ${selectedLoanType.min_amount} and ${selectedLoanType.max_amount}`
      )
      return
    }

    if (tenure < selectedLoanType.min_tenure_months || tenure > selectedLoanType.max_tenure_months) {
      setError(
        `Tenure must be between ${selectedLoanType.min_tenure_months} and ${selectedLoanType.max_tenure_months} months`
      )
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch("/api/loans/employee-loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          employee_id: employeeId,
          loan_type_id: formData.loan_type_id,
          principal_amount: principal,
          tenure_months: tenure,
          reason: formData.reason,
          initiated_by_role: "employee",
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setFormData({ loan_type_id: "", principal_amount: "", tenure_months: "", reason: "" })
        setSelectedLoanType(null)
        setTimeout(() => {
          onSuccess?.()
          setSuccess(false)
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to submit loan application")
      }
    } catch (err: any) {
      console.error("[v0] Error submitting loan application:", err)
      setError(err.message || "Failed to submit loan application")
    } finally {
      setIsLoading(false)
    }
  }

  const monthlyPayment = calculateMonthlyPayment()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Loan application submitted successfully! Awaiting approval.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="loan_type">Loan Type *</Label>
          <Select value={formData.loan_type_id} onValueChange={handleLoanTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a loan type" />
            </SelectTrigger>
            <SelectContent>
              {loanTypes.map((loanType) => (
                <SelectItem key={loanType.id} value={loanType.id}>
                  {loanType.name} ({loanType.annual_interest_rate}% interest)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedLoanType && (
            <p className="text-sm text-gray-600 mt-2">{selectedLoanType.description}</p>
          )}
        </div>

        {selectedLoanType && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Amount Range:</span>
              <span className="font-semibold">
                {selectedLoanType.min_amount.toLocaleString()} - {selectedLoanType.max_amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tenure Range:</span>
              <span className="font-semibold">
                {selectedLoanType.min_tenure_months} - {selectedLoanType.max_tenure_months} months
              </span>
            </div>
            <div className="flex justify-between">
              <span>Interest Rate:</span>
              <span className="font-semibold">{selectedLoanType.annual_interest_rate}% per annum</span>
            </div>
            <div className="flex justify-between">
              <span>Interest Type:</span>
              <span className="font-semibold capitalize">{selectedLoanType.interest_type}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="principal_amount">Loan Amount *</Label>
            <Input
              id="principal_amount"
              type="number"
              step="100"
              value={formData.principal_amount}
              onChange={(e) => handleChange("principal_amount", e.target.value)}
              placeholder="e.g., 5000"
              required
            />
          </div>
          <div>
            <Label htmlFor="tenure_months">Tenure (Months) *</Label>
            <Input
              id="tenure_months"
              type="number"
              value={formData.tenure_months}
              onChange={(e) => handleChange("tenure_months", e.target.value)}
              placeholder="e.g., 12"
              required
            />
          </div>
        </div>

        {monthlyPayment && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Estimated Monthly Payment</p>
              <p className="text-2xl font-bold text-blue-600">
                {monthlyPayment.toLocaleString("en-US", {
                  style: "currency",
                  currency: "GHS",
                  minimumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>
        )}

        <div>
          <Label htmlFor="reason">Reason for Loan (Optional)</Label>
          <Textarea
            id="reason"
            value={formData.reason}
            onChange={(e) => handleChange("reason", e.target.value)}
            placeholder="Tell us why you need this loan"
            rows={4}
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading || !formData.loan_type_id}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Loan Application"
        )}
      </Button>
    </form>
  )
}
