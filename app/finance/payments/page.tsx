import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, Download, Eye } from "lucide-react"
import { getPayments } from "@/lib/actions/finance"

async function PaymentsList() {
  const { payments, error } = await getPayments()

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading payments: {error}</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>{payments.length} payments recorded</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.map((payment: any) => (
            <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {payment.invoices?.students?.first_name} {payment.invoices?.students?.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Invoice #{payment.invoice_id} • {payment.payment_channels?.name}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(payment.payment_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-medium">
                    {payment.currency_code} {payment.amount}
                  </p>
                  <p className="text-sm text-gray-500">Ref: {payment.reference}</p>
                </div>
                <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Receipt
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {payments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No payments recorded yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-2">View payment history and receipts</p>
        </div>
      </div>

      {/* Payments List */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <p>Loading payments...</p>
            </CardContent>
          </Card>
        }
      >
        <PaymentsList />
      </Suspense>
    </div>
  )
}
