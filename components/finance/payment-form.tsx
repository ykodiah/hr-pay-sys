"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CreditCard } from "lucide-react"
import { recordPayment } from "@/lib/actions/finance"

interface PaymentFormProps {
  invoice: any
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Recording...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Record Payment
        </>
      )}
    </Button>
  )
}

export function PaymentForm({ invoice }: PaymentFormProps) {
  const [state, formAction] = useActionState(recordPayment, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Payment</CardTitle>
        <CardDescription>
          Record a payment for {invoice.students?.first_name} {invoice.students?.last_name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="invoice_id" value={invoice.id} />

          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{state.error}</div>
          )}

          {state?.success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {state.success}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Amount:</span> {invoice.currency_code} {invoice.total_amount}
              </div>
              <div>
                <span className="font-medium">Balance Due:</span> {invoice.currency_code} {invoice.balance_due}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                max={invoice.balance_due}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="txn_reference">Transaction Reference</Label>
              <Input id="txn_reference" name="txn_reference" placeholder="e.g., CHQ001, TXN123456" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payer_name">Payer Name</Label>
              <Input id="payer_name" name="payer_name" placeholder="Name of person making payment" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payer_phone">Payer Phone</Label>
              <Input id="payer_phone" name="payer_phone" placeholder="Phone number" />
            </div>
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
