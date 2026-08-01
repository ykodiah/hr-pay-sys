import { NextRequest, NextResponse } from "next/server"
import { approveLoan, rejectLoan } from "@/lib/services/loan-advanced-service"
import { createClient as createServiceClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const serverClient = await createServiceClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get("company_id")

    if (!companyId) {
      return NextResponse.json({ error: "company_id required" }, { status: 400 })
    }

    // Get pending approvals
    const { data, error } = await serverClient
      .from("v_pending_loan_approvals")
      .select("*")
      .eq("company_id", companyId)

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Get pending approvals error:", error)
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const serverClient = await createServiceClient()
    const { data: { user }, error: authError } = await serverClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    if (body.action === "approve") {
      const loan = await approveLoan(body.loan_id, user.id, body.notes)
      return NextResponse.json({ status: "approved", loan })
    } else if (body.action === "reject") {
      const loan = await rejectLoan(body.loan_id, user.id, body.reason)
      return NextResponse.json({ status: "rejected", loan })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Approval action error:", error)
    return NextResponse.json({ error: error.message || "Failed to process approval" }, { status: 500 })
  }
}
