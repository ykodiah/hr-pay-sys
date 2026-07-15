import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { action, hours_approved, rejection_reason } = body

    if (action === "approve") {
      const { error } = await supabase
        .from("overtime_requests")
        .update({
          status: "approved",
          hours_approved: hours_approved ?? null,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
      if (error) throw new Error(error.message)
      return NextResponse.json({ success: true, message: "Overtime approved" })
    }

    if (action === "reject") {
      const { error } = await supabase
        .from("overtime_requests")
        .update({
          status: "rejected",
          rejection_reason: rejection_reason ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
      if (error) throw new Error(error.message)
      return NextResponse.json({ success: true, message: "Overtime rejected" })
    }

    return NextResponse.json({ error: "Invalid action. Use: approve | reject" }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
