/**
 * GET  /api/payslips/[id]  – fetch a single payslip (also marks it as viewed)
 * POST /api/payslips/[id]  – update status (e.g. mark viewed, archive)
 */

import { NextResponse } from "next/server"
import { getPayslipById, markPayslipViewed } from "@/lib/services/payslip-service"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data, error } = await getPayslipById(id)

    if (error || !data) {
      return NextResponse.json({ error: error ?? "Payslip not found" }, { status: 404 })
    }

    // Auto-mark viewed if currently issued
    if (data.status === "issued") {
      await markPayslipViewed(id)
      data.status = "viewed"
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch payslip"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.action === "mark_viewed") {
      const { success, error } = await markPayslipViewed(id)
      if (!success) return NextResponse.json({ error }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update payslip"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
