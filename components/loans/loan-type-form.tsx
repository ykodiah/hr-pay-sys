"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { LoanType } from "@/lib/services/loan-advanced-service"
import { Loader2, Save } from "lucide-react"

interface LoanTypeFormProps {
  companyId: string
  initialData?: LoanType
  onSubmit: (data: any) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

const DEFAULT_APPROVAL_ROLES = ["admin", "finance_manager"]

export function LoanTypeForm({
  companyId,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: LoanTypeFormProps) {
  const [formData, setFormData] = useState({
    code: initialData?.code || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    interest_type: initialData?.interest_type || "reducing_balance",
    annual_interest_rate: initialData?.annual_interest_rate ?? 10,
    min_amount: initialData?.min_amount ?? 0,
    max_amount: initialData?.max_amount ?? 100000,
    min_tenure_months: initialData?.min_tenure_months ?? 3,
    max_tenure_months: initialData?.max_tenure_months ?? 60,
    default_tenure_months: initialData?.default_tenure_months ?? 12,
    processing_fee_type: initialData?.processing_fee_type || "fixed",
    processing_fee_amount: initialData?.processing_fee_amount ?? 0,
    insurance_fee_type: initialData?.insurance_fee_type || "percentage",
    insurance_fee_amount: initialData?.insurance_fee_amount ?? 0,
    admin_fee_type: initialData?.admin_fee_type || "fixed",
    admin_fee_amount: initialData?.admin_fee_amount ?? 0,
    requires_approval: initialData?.requires_approval ?? true,
    auto_approve_max_amount: initialData?.auto_approve_max_amount ?? 0,
    approval_roles: Array.isArray(initialData?.approval_roles)
      ? initialData!.approval_roles.join(", ")
      : DEFAULT_APPROVAL_ROLES.join(", "),
    min_service_months: initialData?.min_service_months ?? 0,
    min_monthly_salary: initialData?.min_monthly_salary ?? 0,
    max_loan_multiplier: initialData?.max_loan_multiplier ?? 3,
    is_active: initialData?.is_active ?? true,
  })

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const roles = String(formData.approval_roles || "")
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean)

    await onSubmit({
      company_id: companyId,
      ...formData,
      approval_roles: roles.length ? roles : DEFAULT_APPROVAL_ROLES,
      is_active: Boolean(formData.is_active),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-emerald-900">Active status</p>
          <p className="text-xs text-emerald-800/80">
            Inactive types stay in the database but are hidden from new loan applications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => handleChange("is_active", checked)}
          />
          <Label htmlFor="is_active" className="cursor-pointer text-sm font-medium">
            {formData.is_active ? "Active" : "Inactive"}
          </Label>
        </div>
      </div>

      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Basic Information</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Interest Configuration</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="interest_type">Interest Type</Label>
            <Select
              value={formData.interest_type}
              onValueChange={(value) => handleChange("interest_type", value)}
            >
              <SelectTrigger id="interest_type">
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

      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Loan Amount Constraints</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Tenure (Months)</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Charges & Fees</h3>

        <div className="space-y-4">
          {(["processing", "insurance", "admin"] as const).map((feeType) => (
            <div key={feeType} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              <div className="sm:col-span-2">
                <Label>{feeType.charAt(0).toUpperCase() + feeType.slice(1)} Fee Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData[`${feeType}_fee_amount` as keyof typeof formData] as number}
                  onChange={(e) => handleChange(`${feeType}_fee_amount`, parseFloat(e.target.value))}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 border-b pb-4">
        <h3 className="text-sm font-semibold">Approval Settings</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center space-x-2 rounded-lg border px-3 py-2">
            <Switch
              id="requires_approval"
              checked={formData.requires_approval}
              onCheckedChange={(checked) => handleChange("requires_approval", checked)}
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

        <div>
          <Label htmlFor="approval_roles">Approval Roles (comma-separated)</Label>
          <Input
            id="approval_roles"
            value={formData.approval_roles}
            onChange={(e) => handleChange("approval_roles", e.target.value)}
            placeholder="admin, finance_manager"
          />
          <p className="mt-1 text-xs text-muted-foreground">Saved to loan_types.approval_roles</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Eligibility Criteria</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {initialData ? "Update Loan Type" : "Save Loan Type"}
            </>
          )}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  )
}
