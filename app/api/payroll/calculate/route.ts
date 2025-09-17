import { type NextRequest, NextResponse } from "next/server"
import { calculatePayroll } from "@/lib/ghana-rules"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { baseSalary, allowances = {}, preDeductions = {}, postDeductions = {} } = body

    if (!baseSalary || baseSalary <= 0) {
      return NextResponse.json({ error: "Valid base salary is required" }, { status: 400 })
    }

    const calculation = calculatePayroll(baseSalary, allowances, preDeductions, postDeductions)

    return NextResponse.json({
      success: true,
      calculation,
      breakdown: {
        earnings: {
          baseSalary,
          totalAllowances: Object.values(allowances).reduce((sum, amount) => sum + amount, 0),
          grossPay: calculation.grossPay,
        },
        deductions: {
          paye: calculation.paye,
          ssnitEmployee: calculation.ssnitEmployee,
          totalPreDeductions: Object.values(preDeductions).reduce((sum, amount) => sum + amount, 0),
          totalPostDeductions: Object.values(postDeductions).reduce((sum, amount) => sum + amount, 0),
        },
        employer: {
          ssnitEmployer: calculation.ssnitEmployer,
        },
        net: {
          taxableIncome: calculation.taxableIncome,
          netPay: calculation.netPay,
        },
      },
    })
  } catch (error) {
    console.error("Payroll calculation error:", error)
    return NextResponse.json({ error: "Failed to calculate payroll" }, { status: 500 })
  }
}
