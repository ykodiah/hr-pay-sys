import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Eye, CreditCard } from "lucide-react"
import { getInvoices } from "@/lib/actions/finance"
import { getGrades, getCurrentTerms } from "@/lib/actions/academic"
import { InvoiceGenerator } from "@/components/finance/invoice-generator"
import Link from "next/link"

async function InvoicesList() {
  const { invoices, error } = await getInvoices()

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading invoices: {error}</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Invoices</CardTitle>
        <CardDescription>{invoices.length} invoices found</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices.map((invoice: any) => (
            <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {invoice.students?.first_name} {invoice.students?.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">ID: {invoice.students?.student_no}</p>
                  <p className="text-xs text-gray-400">
                    {invoice.terms?.academic_yr} - Term {invoice.terms?.term_no}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-medium">
                    {invoice.currency_code} {invoice.total_amount}
                  </p>
                  <p className="text-sm text-gray-500">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-400">
                    Balance: {invoice.currency_code} {invoice.balance_due}
                  </p>
                </div>
                <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                <div className="flex space-x-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/finance/invoices/${invoice.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Link>
                  </Button>
                  {invoice.status !== "paid" && (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/finance/invoices/${invoice.id}/payment`}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {invoices.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No invoices found. Generate invoices below.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

async function InvoiceGenerationForm() {
  const { grades } = await getGrades()
  const { terms } = await getCurrentTerms()

  return <InvoiceGenerator grades={grades} terms={terms} />
}

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-2">Manage student fee invoices</p>
        </div>
      </div>

      {/* Invoices List */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <p>Loading invoices...</p>
            </CardContent>
          </Card>
        }
      >
        <InvoicesList />
      </Suspense>

      {/* Invoice Generator */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <p>Loading generator...</p>
            </CardContent>
          </Card>
        }
      >
        <InvoiceGenerationForm />
      </Suspense>
    </div>
  )
}
