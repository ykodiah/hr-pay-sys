"use client"

import { useState, useEffect } from "react"
import { AlertCircle, DollarSign, FileText, Loader2, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"

interface FinancialData {
  id: string
  bank_name: string
  bank_branch: string
  bank_account_number: string
  bank_account_type: string
  account_holder_name: string
  ssnit_number: string
  ssnit_registered_date: string
  monthly_salary: number
  salary_currency: string
  tax_id: string
  tax_status: string
  pension_id: string
  pension_provider: string
  health_insurance_provider: string
  health_insurance_number: string
  insurance_beneficiary: string
  insurance_relationship: string
  synced_to_employee_at: string
  synced_by?: { first_name: string; last_name: string }
}

interface FinancialDataDisplayProps {
  employeeId: string
  isReadOnly?: boolean
  companyId?: string
}

export function FinancialDataDisplay({
  employeeId,
  isReadOnly = true,
  companyId,
}: FinancialDataDisplayProps) {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [syncedAt, setSyncedAt] = useState<string | null>(null)

  // Fetch latest financial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const params = new URLSearchParams()
        params.append("employee_id", employeeId)
        params.append("latest_only", "true")
        if (companyId) params.append("company_id", companyId)

        const res = await fetch(`/api/employees/financial-data-sync?${params}`)
        if (!res.ok) throw new Error("Failed to fetch financial data")

        const data = await res.json()
        if (data.financial_data && data.financial_data.length > 0) {
          const latest = data.financial_data[0]
          setFinancialData(latest)
          setSyncedAt(latest.synced_to_employee_at)
        }
      } catch (err) {
        // Not an error - employee may not have financial data yet
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [employeeId, companyId])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Financial Information
            <Loader2 className="w-4 h-4 ml-auto animate-spin" />
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (!financialData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Financial Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No financial information available yet.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const maskAccountNumber = (account: string) => {
    if (!account) return "—"
    return account.slice(-4).padStart(account.length, "*")
  }

  const maskSSNIT = (ssnit: string) => {
    if (!ssnit) return "—"
    return ssnit.slice(-4).padStart(ssnit.length, "*")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Information
              {isReadOnly && (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
            </CardTitle>
            {isReadOnly && (
              <CardDescription className="text-xs">
                Read-only view. Contact HR to update.
              </CardDescription>
            )}
          </div>
          {syncedAt && (
            <Badge variant="outline" className="text-xs">
              Last updated: {new Date(syncedAt).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="payroll" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="bank">Bank Details</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
          </TabsList>

          {/* Payroll Tab */}
          <TabsContent value="payroll" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Monthly Salary</p>
                <p className="text-lg font-semibold">
                  {financialData.monthly_salary?.toLocaleString() || "—"}{" "}
                  <span className="text-sm text-muted-foreground">
                    {financialData.salary_currency}
                  </span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tax Status</p>
                <p className="font-medium">{financialData.tax_status || "—"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tax ID</p>
                <p className="font-medium font-mono text-sm">{financialData.tax_id || "—"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Pension ID</p>
                <p className="font-medium font-mono text-sm">{financialData.pension_id || "—"}</p>
              </div>

              {financialData.pension_provider && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Pension Provider</p>
                  <p className="font-medium">{financialData.pension_provider}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Bank Details Tab */}
          <TabsContent value="bank" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Bank Name</p>
                <p className="font-medium">{financialData.bank_name || "—"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Branch</p>
                <p className="font-medium">{financialData.bank_branch || "—"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Account Type</p>
                <p className="font-medium">{financialData.bank_account_type || "—"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Account Holder</p>
                <p className="font-medium">{financialData.account_holder_name || "—"}</p>
              </div>
            </div>

            {/* Bank Account Number (Masked) */}
            <div className="bg-muted p-3 rounded-lg space-y-1">
              <p className="text-xs text-muted-foreground">Account Number (Masked)</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-medium">
                  {maskAccountNumber(financialData.bank_account_number)}
                </p>
                {isReadOnly && (
                  <Lock className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {isReadOnly ? "Only last 4 digits visible" : "Full account number"}
              </p>
            </div>
          </TabsContent>

          {/* Insurance Tab */}
          <TabsContent value="insurance" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Insurance Provider</p>
                <p className="font-medium">{financialData.health_insurance_provider || "—"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">SSNIT Number (Masked)</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-medium">
                    {maskSSNIT(financialData.ssnit_number)}
                  </p>
                  {isReadOnly && (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Insurance Number</p>
                <p className="font-medium font-mono text-sm">
                  {financialData.health_insurance_number || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">SSNIT Registration Date</p>
                <p className="font-medium">
                  {financialData.ssnit_registered_date
                    ? new Date(financialData.ssnit_registered_date).toDateString()
                    : "—"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Insurance Beneficiary</p>
                <p className="font-medium">{financialData.insurance_beneficiary || "—"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Relationship</p>
                <p className="font-medium">{financialData.insurance_relationship || "—"}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Sync Metadata */}
        {syncedAt && (
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            <p>
              Last synced: {new Date(syncedAt).toLocaleString()}
            </p>
            {isReadOnly && (
              <p className="mt-1 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Updated by HR during onboarding
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
