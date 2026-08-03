"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoanTypeForm } from "@/components/loans/loan-type-form"
import { useToast } from "@/hooks/use-toast"
import { resolveClientCompanyId } from "@/lib/tenant/resolve-company-client"
import type { LoanType } from "@/lib/services/loan-advanced-service"
import { interestTypeLabel } from "@/lib/services/loan-calculations"
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
        const response = await fetch(
          `/api/loans/loan-types?company_id=${encodeURIComponent(cId)}&include_inactive=true`,
          {
            cache: "no-store",
            credentials: "include",
          },
        )
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="list">Loan Types</TabsTrigger>
            <TabsTrigger value="create">
              {selectedLoanType ? "Edit Loan Type" : "New Loan Type"}
            </TabsTrigger>
          </TabsList>
          <Button
            size="sm"
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => {
              setSelectedLoanType(null)
              setActiveTab("create")
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Loan Type
          </Button>
        </div>

        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-4">
            {loanTypes.length === 0 ? (
              <Card>
                <CardContent className="space-y-3 pt-6 text-center">
                  <p className="text-gray-600">No loan types found in the database.</p>
                  <Button
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={() => setActiveTab("create")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create first loan type
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {loanTypes.map((loanType) => (
                  <Card
                    key={loanType.id}
                    className={`shadow-none ring-1 ring-slate-200 ${loanType.is_active ? "" : "opacity-70"}`}
                  >
                    <CardHeader className="space-y-0 p-3 pb-1">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <CardTitle className="truncate text-sm font-semibold leading-tight">
                            {loanType.name}
                          </CardTitle>
                          <CardDescription className="truncate text-[11px] leading-snug">
                            {loanType.code}
                            {loanType.description ? ` · ${loanType.description}` : ""}
                          </CardDescription>
                        </div>
                        <div className="flex shrink-0 gap-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-100"
                            onClick={() => {
                              setSelectedLoanType(loanType)
                              setActiveTab("create")
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                            onClick={() => void handleDeleteLoanType(loanType.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1.5 p-3 pt-1">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                        <div>
                          <p className="text-slate-500">Interest</p>
                          <p className="font-semibold text-slate-800">
                            {interestTypeLabel(loanType.interest_type)} · {loanType.annual_interest_rate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Status</p>
                          <p
                            className={`font-semibold ${loanType.is_active ? "text-emerald-700" : "text-slate-500"}`}
                          >
                            {loanType.is_active ? "Active" : "Inactive"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Amount</p>
                          <p className="font-semibold text-slate-800">
                            {Number(loanType.min_amount).toLocaleString()}–
                            {Number(loanType.max_amount).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Tenure</p>
                          <p className="font-semibold text-slate-800">
                            {loanType.min_tenure_months}–{loanType.max_tenure_months} mo
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                  onCancel={() => {
                    setSelectedLoanType(null)
                    setActiveTab("list")
                  }}
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
