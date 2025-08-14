import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, FileText, CreditCard, GraduationCap, TrendingUp } from "lucide-react"
import { getFinancialSummary } from "@/lib/actions/finance"
import Link from "next/link"

export default async function FinancePage() {
  const { summary, error } = await getFinancialSummary()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finance Management</h1>
        <p className="text-gray-600 mt-2">Manage fees, invoices, payments, and financial reporting</p>
      </div>

      {/* Financial Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.totalInvoiced.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{summary.invoiceStats.total} invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.totalCollected.toLocaleString()}</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                {summary.collectionRate.toFixed(1)}% collection rate
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.totalOutstanding.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{summary.invoiceStats.pending} pending invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.invoiceStats.paid}</div>
              <p className="text-xs text-muted-foreground">{summary.invoiceStats.partial} partially paid</p>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading financial summary: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Fee Structure
            </CardTitle>
            <CardDescription>Set up fee types and amounts for different grades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button asChild size="sm">
                <Link href="/finance/structure">Manage Structure</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Invoices
            </CardTitle>
            <CardDescription>Generate and manage student invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button asChild size="sm">
                <Link href="/finance/invoices">View Invoices</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
              Payments
            </CardTitle>
            <CardDescription>Record and track fee payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button asChild size="sm">
                <Link href="/finance/payments">View Payments</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="h-5 w-5 mr-2 text-orange-600" />
              Scholarships
            </CardTitle>
            <CardDescription>Manage student scholarships and fee waivers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button asChild size="sm">
                <Link href="/finance/scholarships">Manage Scholarships</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
