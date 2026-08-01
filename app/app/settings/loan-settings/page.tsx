"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoanTypeForm } from "@/components/loans/loan-type-form"
import { useToast } from "@/hooks/use-toast"
import { resolveClientCompanyId } from "@/lib/tenant/resolve-company-client"
import type { LoanType } from "@/lib/services/loan-advanced-service"
import { Plus, Edit2, Trash2, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function LoanSettingsPage() {
  const { toast } = useToast()
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([])
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("list")
  const [companyId, setCompanyId] = useState<string | null>(null)

  const fetchLoanTypes = useCallback(
    async (cId: string) => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/loans/loan-types?company_id=${encodeURIComponent(cId)}`, {
          cache: "no-store",
          credentials: "include",
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch loan types")
        }
        setLoanTypes(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("[v0] Error fetching loan types:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch loan types",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        setPageLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    const fetchUserAndCompany = async () => {
      try {
        const cid = await resolveClientCompanyId()
        setCompanyId(cid)
        await fetchLoanTypes(cid)
      } catch (error) {
        console.error("[v0] Error fetching company:", error)
        setPageLoading(false)
        toast({
          title: "Could not resolve company",
          description: error instanceof Error ? error.message : "Open Company settings first",
          variant: "destructive",
        })
      }
    }

    void fetchUserAndCompany()
  }, [fetchLoanTypes, toast])

  const handleSaveLoanType = async (formData: any) => {
    if (!companyId) {
      toast({ title: "Company not loaded", variant: "destructive" })
      return
    }

    try {
      setIsLoading(true)
      const isEdit = Boolean(selectedLoanType?.id)
      const response = await fetch(
        isEdit ? `/api/loans/loan-types/${selectedLoanType!.id}` : "/api/loans/loan-types",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...formData, company_id: companyId }),
        },
      )
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEdit ? "update" : "create"} loan type`)
      }

      toast({
        title: "Success",
        description: isEdit ? "Loan type updated successfully" : "Loan type created successfully",
      })
      await fetchLoanTypes(companyId)
      setActiveTab("list")
      setSelectedLoanType(null)
    } catch (error) {
      console.error("[v0] Error saving loan type:", error)
      toast({
        title: "Unable to save loan type",
        description: error instanceof Error ? error.message : "Request failed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteLoanType = async (loanTypeId: string) => {
    if (!window.confirm("Are you sure you want to delete this loan type?")) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/loans/loan-types/${loanTypeId}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete loan type")
      }

      toast({ title: "Success", description: "Loan type deleted successfully" })
      if (companyId) await fetchLoanTypes(companyId)
    } catch (error) {
      console.error("[v0] Error deleting loan type:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete loan type",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loan Settings</h1>
          <p className="text-gray-600">Manage loan types stored in the database</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/app/loans">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Loans
          </Link>
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value)
          if (value === "create" && !selectedLoanType) {
            setSelectedLoanType(null)
          }
          if (value === "list") {
            setSelectedLoanType(null)
          }
        }}
      >
        <TabsList>
          <TabsTrigger value="list">Loan Types</TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="mr-2 h-4 w-4" />
            {selectedLoanType ? "Edit Loan Type" : "New Loan Type"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-4">
            {loanTypes.length === 0 ? (
              <Card>
                <CardContent className="space-y-3 pt-6 text-center">
                  <p className="text-gray-600">No loan types found in the database.</p>
                  <Button onClick={() => setActiveTab("create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create first loan type
                  </Button>
                </CardContent>
              </Card>
            ) : (
              loanTypes.map((loanType) => (
                <Card key={loanType.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{loanType.name}</CardTitle>
                        <CardDescription>
                          {loanType.code}
                          {loanType.description ? ` · ${loanType.description}` : ""}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLoanType(loanType)
                            setActiveTab("create")
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDeleteLoanType(loanType.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      <div>
                        <p className="text-gray-600">Interest Rate</p>
                        <p className="font-semibold">{loanType.annual_interest_rate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Amount Range</p>
                        <p className="font-semibold">
                          {loanType.min_amount} - {loanType.max_amount}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tenure Range</p>
                        <p className="font-semibold">
                          {loanType.min_tenure_months} - {loanType.max_tenure_months} months
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Status</p>
                        <p className="font-semibold">{loanType.is_active ? "Active" : "Inactive"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>{selectedLoanType ? "Edit Loan Type" : "Create New Loan Type"}</CardTitle>
              <CardDescription>
                {selectedLoanType
                  ? "Update loan type settings in the database"
                  : "Add a new loan type to the database"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companyId ? (
                <LoanTypeForm
                  key={selectedLoanType?.id || "new"}
                  companyId={companyId}
                  initialData={selectedLoanType || undefined}
                  onSubmit={handleSaveLoanType}
                  isLoading={isLoading}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Resolving company…</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
