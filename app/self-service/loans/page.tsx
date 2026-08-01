"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoanApplication } from "@/components/loans/loan-application"
import { MyLoans } from "@/components/loans/my-loans"
import { Loader2, FileText, PlusCircle } from "lucide-react"

export default function LoansPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [employee, setEmployee] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("my-loans")

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true)

        // Get current user
        const { data: { user: userData } } = await supabase.auth.getUser()
        if (!userData) {
          router.push("/auth/login")
          return
        }
        setUser(userData)

        // Get employee record
        const { data: empData } = await supabase
          .from("employees")
          .select("*, company_id")
          .eq("id", userData.id)
          .limit(1)
          .single()

        if (empData) {
          setEmployee(empData)

          // Get company
          const { data: compData } = await supabase
            .from("companies")
            .select("*")
            .eq("id", empData.company_id)
            .limit(1)
            .single()

          if (compData) {
            setCompany(compData)
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching user data:", error)
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

  if (!employee || !company) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              Unable to load loan information. Please contact support.
            </p>
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
