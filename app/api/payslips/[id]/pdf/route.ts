/**
 * GET /api/payslips/[id]/pdf
 * Returns printable HTML payslip (browser → Save as PDF).
 */

import { NextResponse } from "next/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { getPayslipById } from "@/lib/services/payslip-service"
import { renderPayslipHtml } from "@/lib/payroll/payslip-html"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { data, error } = await getPayslipById(id)
    if (error || !data) {
      return NextResponse.json({ error: error ?? "Payslip not found" }, { status: 404 })
    }

    const html = renderPayslipHtml(data, { autoPrint: true })
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="payslip-${data.pay_period}-${data.snapshot_employee_id_no || data.employee_id}.html"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to render payslip" },
      { status: 500 },
    )
  }
}
