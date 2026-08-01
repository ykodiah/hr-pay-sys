"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { LoanType } from "@/lib/services/loan-advanced-service"

interface LoanTypeFormProps {
  companyId: string
  initialData?: LoanType
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

export function LoanTypeForm({ companyId, initialData, onSubmit, isLoading }: LoanTypeFormProps) {
  const [formData, setFormData] = useState({
    code: initialData?.code || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    interest_type: initialData?.interest_type || "reducing_balance",
    annual_interest_rate: initialData?.annual_interest_rate || 10,
    min_amount: initialData?.min_amount || 0,
    max_amount: initialData?.max_amount || 100000,
    min_tenure_months: initialData?.min_tenure_months || 3,
    max_tenure_months: initialData?.max_tenure_months || 60,
    default_tenure_months: initialData?.default_tenure_months || 12,
    processing_fee_type: initialData?.processing_fee_type || "fixed",
    processing_fee_amount: initialData?.processing_fee_amount || 0,
    insurance_fee_type: initialData?.insurance_fee_type || "percentage",
    insurance_fee_amount: initialData?.insurance_fee_amount || 0,
    admin_fee_type: initialData?.admin_fee_type || "fixed",
    admin_fee_amount: initialData?.admin_fee_amount || 0,
    requires_approval: initialData?.requires_approval ?? true,
    auto_approve_max_amount: initialData?.auto_approve_max_amount || 0,
    min_service_months: initialData?.min_service_months || 0,
    min_monthly_salary: initialData?.min_monthly_salary || 0,
    max_loan_multiplier: initialData?.max_loan_multiplier || 3,
  })

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      company_id: companyId,
      ...formData,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Basic Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="code">Loan Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              placeholder="e.g., PERSONAL, HOUSING"
              required
            />
          </div>
          <div>
            <Label htmlFor="name">Loan Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Personal Loan"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Loan description and terms"
          />
        </div>
      </div>

      {/* Interest Configuration */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Interest Configuration</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="interest_type">Interest Type</Label>
            <Select
              value={formData.interest_type}
              onValueChange={(value) => handleChange("interest_type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed Interest</SelectItem>
                <SelectItem value="reducing_balance">Reducing Balance</SelectItem>
                <SelectItem value="daily_compound">Daily Compound</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="annual_interest_rate">Annual Interest Rate (%)</Label>
            <Input
              id="annual_interest_rate"
              type="number"
              step="0.01"
              value={formData.annual_interest_rate}
              onChange={(e) => handleChange("annual_interest_rate", parseFloat(e.target.value))}
              required
            />
          </div>
        </div>
      </div>

      {/* Loan Amount Constraints */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Loan Amount Constraints</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="min_amount">Minimum Amount</Label>
            <Input
              id="min_amount"
              type="number"
              value={formData.min_amount}
              onChange={(e) => handleChange("min_amount", parseFloat(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="max_amount">Maximum Amount</Label>
            <Input
              id="max_amount"
              type="number"
              value={formData.max_amount}
              onChange={(e) => handleChange("max_amount", parseFloat(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="max_loan_multiplier">Max Loan Multiplier (× Salary)</Label>
            <Input
              id="max_loan_multiplier"
              type="number"
              step="0.1"
              value={formData.max_loan_multiplier}
              onChange={(e) => handleChange("max_loan_multiplier", parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Tenure */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Tenure (Months)</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="min_tenure_months">Minimum</Label>
            <Input
              id="min_tenure_months"
              type="number"
              value={formData.min_tenure_months}
              onChange={(e) => handleChange("min_tenure_months", parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="max_tenure_months">Maximum</Label>
            <Input
              id="max_tenure_months"
              type="number"
              value={formData.max_tenure_months}
              onChange={(e) => handleChange("max_tenure_months", parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="default_tenure_months">Default</Label>
            <Input
              id="default_tenure_months"
              type="number"
              value={formData.default_tenure_months}
              onChange={(e) => handleChange("default_tenure_months", parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Charges & Fees */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Charges & Fees</h3>

        <div className="space-y-4">
          {["processing", "insurance", "admin"].map((feeType) => (
            <div key={feeType} className="grid grid-cols-3 gap-4">
              <div>
                <Label>{feeType.charAt(0).toUpperCase() + feeType.slice(1)} Fee Type</Label>
                <Select
                  value={formData[`${feeType}_fee_type` as keyof typeof formData] as string}
                  onValueChange={(value) => handleChange(`${feeType}_fee_type`, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>{feeType.charAt(0).toUpperCase() + feeType.slice(1)} Fee Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData[`${feeType}_fee_amount` as keyof typeof formData]}
                  onChange={(e) => handleChange(`${feeType}_fee_amount`, parseFloat(e.target.value))}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Approval Settings */}
      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Approval Settings</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requires_approval"
              checked={formData.requires_approval}
              onChange={(e) => handleChange("requires_approval", e.target.checked)}
            />
            <Label htmlFor="requires_approval" className="cursor-pointer">
              Requires Approval
            </Label>
          </div>
          <div>
            <Label htmlFor="auto_approve_max_amount">Auto-Approve Max Amount</Label>
            <Input
              id="auto_approve_max_amount"
              type="number"
              value={formData.auto_approve_max_amount}
              onChange={(e) => handleChange("auto_approve_max_amount", parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Eligibility */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Eligibility Criteria</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="min_service_months">Minimum Service (Months)</Label>
            <Input
              id="min_service_months"
              type="number"
              value={formData.min_service_months}
              onChange={(e) => handleChange("min_service_months", parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="min_monthly_salary">Minimum Monthly Salary</Label>
            <Input
              id="min_monthly_salary"
              type="number"
              value={formData.min_monthly_salary}
              onChange={(e) => handleChange("min_monthly_salary", parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Loan Type"}
      </Button>
    </form>
  )
}
