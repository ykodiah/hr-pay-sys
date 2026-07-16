/**
 * GET /api/payroll/runs/[id]/payslips
 * List payslips for a payroll run (for history downloads).
 */

import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { getPayrollRunPayslips } from "@/lib/services/payslip-service"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { data, error } = await getPayrollRunPayslips(id)
    if (error) return NextResponse.json({ error }, { status: 500 })

    return NextResponse.json({ success: true, payslips: data, count: data.length })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load payslips" },
      { status: 500 },
    )
  }
}
