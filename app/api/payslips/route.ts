/**
 * GET /api/payslips
 *
 * Returns all issued/viewed payslips for the authenticated employee.
 * Query params:
 *   employee_id  (required)
 *   year         (optional – filter by calendar year, e.g. 2025)
 *
 * Used by: self-service payslips page
 */

import { NextResponse } from "next/server"
import { getEmployeePayslips, getEmployeePayslipSummary } from "@/lib/services/payslip-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employee_id")
    const yearParam  = searchParams.get("year")

    if (!employeeId) {
      return NextResponse.json({ error: "employee_id is required" }, { status: 400 })
    }

    const year = yearParam ? Number.parseInt(yearParam, 10) : undefined

    const [payslipsResult, summaryResult] = await Promise.all([
      getEmployeePayslips(employeeId, year),
      getEmployeePayslipSummary(employeeId, year ?? new Date().getFullYear()),
    ])

    if (payslipsResult.error) {
      return NextResponse.json({ error: payslipsResult.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: payslipsResult.data,
      summary: {
        totalGross: summaryResult.totalGross,
        totalNet: summaryResult.totalNet,
        totalPaye: summaryResult.totalPaye,
        totalSsnit: summaryResult.totalSsnit,
        payslipCount: summaryResult.payslipCount,
        latestPayDate: summaryResult.latestPayDate,
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch payslips"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
