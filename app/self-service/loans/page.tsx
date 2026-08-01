"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoanApplication } from "@/components/loans/loan-application"
import { MyLoans } from "@/components/loans/my-loans"
import { Loader2, FileText, PlusCircle, AlertCircle } from "lucide-react"

export default function LoansPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [employee, setEmployee] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [activeTab, setActiveTab] = useState("my-loans")

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true)
        setError("")

        // Get current user
        const { data: { user: userData } } = await supabase.auth.getUser()
        if (!userData) {
          console.error("[v0] No authenticated user found")
          router.push("/auth/login")
          return
        }
        console.log("[v0] Authenticated user:", userData.id)
        setUser(userData)

        // Try method 1: Direct employee lookup by user ID
        console.log("[v0] Attempting employee lookup by ID:", userData.id)
        let { data: empData, error: empError } = await supabase
          .from("employees")
          .select("id, first_name, last_name, company_id, email")
          .eq("id", userData.id)
          .single()

        if (!empData && userData.email) {
          // Try method 2: Lookup by email
          console.log("[v0] Attempting employee lookup by email:", userData.email)
          const { data: empByEmail } = await supabase
            .from("employees")
            .select("id, first_name, last_name, company_id, email")
            .eq("email", userData.email)
            .limit(1)
            .single()
          empData = empByEmail
        }

        if (!empData) {
          const msg = `No employee record found for user ${userData.id}`
          console.error("[v0]", msg)
          setError(msg)
          return
        }

        console.log("[v0] Employee found:", empData.id)
        setEmployee(empData)

        // Get company
        if (!empData.company_id) {
          setError("No company assigned to employee")
          return
        }

        console.log("[v0] Fetching company:", empData.company_id)
        const { data: compData, error: compError } = await supabase
          .from("companies")
          .select("id, name")
          .eq("id", empData.company_id)
          .single()

        if (compError || !compData) {
          console.error("[v0] Company fetch error:", compError)
          setError("Failed to load company information")
          return
        }

        console.log("[v0] Company loaded:", compData.name)
        setCompany(compData)
      } catch (error) {
        console.error("[v0] Error fetching user data:", error)
        setError(error instanceof Error ? error.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !employee || !company) {
    return (
      <div className="container mx-auto py-12">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">Unable to Load Loans</p>
                <p className="text-sm text-red-700 mt-1">
                  {error || "Unable to load loan information. Please contact support."}
                </p>
                {process.env.NODE_ENV === "development" && (
                  <details className="mt-3 text-xs text-gray-600">
                    <summary className="cursor-pointer">Debug Info</summary>
                    <p className="mt-2 font-mono">
                      Employee: {employee ? "Found" : "Not Found"}
                      <br />
                      Company: {company ? "Found" : "Not Found"}
                      <br />
                      User: {user ? user.id : "Not Found"}
                    </p>
                  </details>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const employeeName = `${employee.first_name} ${employee.last_name}`

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Loans</h1>
        <p className="text-gray-600">Manage your loans and view payment schedules</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="my-loans" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            My Loans
          </TabsTrigger>
          <TabsTrigger value="apply" className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Apply for Loan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-loans" className="space-y-4">
          <MyLoans
            companyId={company.id}
            employeeId={employee.id}
            employeeName={employeeName}
          />
        </TabsContent>

        <TabsContent value="apply">
          <Card>
            <CardHeader>
              <CardTitle>Apply for a New Loan</CardTitle>
              <CardDescription>
                Select a loan type, amount, and tenure to apply for a new loan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoanApplication
                companyId={company.id}
                employeeId={employee.id}
                onSuccess={() => {
                  setActiveTab("my-loans")
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
