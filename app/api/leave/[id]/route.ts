import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { action, rejection_reason } = body

    if (!action) return NextResponse.json({ error: "action required" }, { status: 400 })

    if (action === "approve") {
      const { error } = await supabase
        .from("leave_requests")
        .update({ status: "approved", approved_by: user.id, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw new Error(error.message)
      return NextResponse.json({ success: true, message: "Leave request approved" })
    }

    if (action === "reject") {
      const { error } = await supabase
        .from("leave_requests")
        .update({ status: "rejected", rejection_reason: rejection_reason ?? null, updated_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw new Error(error.message)
      return NextResponse.json({ success: true, message: "Leave request rejected" })
    }

    if (action === "cancel") {
      const { error } = await supabase
        .from("leave_requests")
        .update({ status: "cancelled", cancelled_by: user.id, cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("status", "pending")
      if (error) throw new Error(error.message)
      return NextResponse.json({ success: true, message: "Leave request cancelled" })
    }

    return NextResponse.json({ error: "Invalid action. Use: approve | reject | cancel" }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("leave_requests")
      .select(`*, employees!leave_requests_employee_id_fkey(first_name,last_name,employee_id,department,position), leave_types!leave_requests_leave_type_id_fkey(name)`)
      .eq("id", id)
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ request: data })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
