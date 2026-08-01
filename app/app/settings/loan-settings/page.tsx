"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoanTypeForm } from "@/components/loans/loan-type-form"
import { useToast } from "@/hooks/use-toast"
import { resolveClientCompanyId } from "@/lib/tenant/resolve-company-client"
import type { LoanType } from "@/lib/services/loan-advanced-service"
import { Plus, Edit2, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LoanSettingsPage() {
  const { toast } = useToast()
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([])
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("list")
  const [companyId, setCompanyId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserAndCompany = async () => {
      try {
        const cid = await resolveClientCompanyId()
        setCompanyId(cid)
        await fetchLoanTypes(cid)
      } catch (error) {
        console.error("[v0] Error fetching company:", error)
        toast({
          title: "Could not resolve company",
          description: error instanceof Error ? error.message : "Open Company settings first",
          variant: "destructive",
        })
      }
    }

    fetchUserAndCompany()
  }, [])

  const fetchLoanTypes = async (cId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/loans/loan-types?company_id=${cId}`)
      if (response.ok) {
        const data = await response.json()
        setLoanTypes(data)
      } else {
        toast({ title: "Error", description: "Failed to fetch loan types", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error fetching loan types:", error)
      toast({ title: "Error", description: "Failed to fetch loan types", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (companyId) {
      fetchLoanTypes(companyId)
    }
  }, [companyId])

  const handleCreateLoanType = async (formData: any) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/loans/loan-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Loan type created successfully" })
        if (companyId) await fetchLoanTypes(companyId)
        setActiveTab("list")
        setSelectedLoanType(null)
      } else {
        toast({ title: "Error", description: "Failed to create loan type", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error creating loan type:", error)
      toast({ title: "Error", description: "Failed to create loan type", variant: "destructive" })
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
      })

      if (response.ok) {
        toast({ title: "Success", description: "Loan type deleted successfully" })
        if (companyId) await fetchLoanTypes(companyId)
      } else {
        toast({ title: "Error", description: "Failed to delete loan type", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error deleting loan type:", error)
      toast({ title: "Error", description: "Failed to delete loan type", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loan Settings</h1>
          <p className="text-gray-600">Manage loan types and configurations</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/app/loans">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Loans
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Loan Types</TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="w-4 h-4 mr-2" />
            New Loan Type
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-4">
            {loanTypes.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600">No loan types found. Create your first loan type.</p>
                </CardContent>
              </Card>
            ) : (
              loanTypes.map((loanType) => (
                <Card key={loanType.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{loanType.name}</CardTitle>
                        <CardDescription>{loanType.description}</CardDescription>
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
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteLoanType(loanType.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
              <CardTitle>
                {selectedLoanType ? "Edit Loan Type" : "Create New Loan Type"}
              </CardTitle>
              <CardDescription>
                {selectedLoanType
                  ? "Update loan type settings"
                  : "Add a new loan type to your system"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoanTypeForm
                companyId={companyId || ""}
                initialData={selectedLoanType || undefined}
                onSubmit={handleCreateLoanType}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
