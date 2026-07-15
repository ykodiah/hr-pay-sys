import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getLoanWithSchedule, approveLoan, rejectLoan, cancelLoan } from "@/lib/services/loan-service"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const result = await getLoanWithSchedule(id)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { action, rejection_reason } = body

    switch (action) {
      case "approve":
        await approveLoan(id, user.id)
        return NextResponse.json({ success: true, message: "Loan approved and amortization schedule generated" })
      case "reject":
        if (!rejection_reason) return NextResponse.json({ error: "rejection_reason required" }, { status: 400 })
        await rejectLoan(id, user.id, rejection_reason)
        return NextResponse.json({ success: true, message: "Loan rejected" })
      case "cancel":
        await cancelLoan(id)
        return NextResponse.json({ success: true, message: "Loan cancelled" })
      default:
        return NextResponse.json({ error: "Invalid action. Use: approve | reject | cancel" }, { status: 400 })
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
