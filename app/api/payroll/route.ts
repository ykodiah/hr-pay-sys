import { type NextRequest, NextResponse } from "next/server"
import { PayrollEngine, type PayrollRunData } from "@/lib/payroll-engine"

// Mock employee data - in production, this would come from the database
const mockEmployees = [
  {
    id: "emp_001",
    firstName: "Akosua",
    lastName: "Mensah",
    baseSalary: 4500,
    allowances: { transport: 200, lunch: 150 },
    preDeductions: {},
    postDeductions: { loan: 400, insurance: 50 },
    ssnitNumber: "C123456789012",
    tin: "P0012345678",
  },
  {
    id: "emp_002",
    firstName: "Kwame",
    lastName: "Asante",
    baseSalary: 3800,
    allowances: { transport: 200, housing: 500 },
    preDeductions: {},
    postDeductions: { loan: 300 },
    ssnitNumber: "C123456789013",
    tin: "P0012345679",
  },
  {
    id: "emp_003",
    firstName: "Ama",
    lastName: "Osei",
    baseSalary: 3200,
    allowances: { transport: 200 },
    preDeductions: {},
    postDeductions: { insurance: 30 },
    ssnitNumber: "C123456789014",
    tin: "P0012345680",
  },
  {
    id: "emp_004",
    firstName: "Kofi",
    lastName: "Boateng",
    baseSalary: 2800,
    allowances: { transport: 200, meal: 100 },
    preDeductions: {},
    postDeductions: {},
    ssnitNumber: "C123456789015",
    tin: "P0012345681",
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { period, startDate, endDate, employeeIds } = body

    // Filter employees based on provided IDs or use all
    const selectedEmployees = employeeIds ? mockEmployees.filter((emp) => employeeIds.includes(emp.id)) : mockEmployees

    const payrollRun: PayrollRunData = {
      id: `run_${Date.now()}`,
      period,
      startDate,
      endDate,
      employees: selectedEmployees,
      status: "DRAFT",
    }

    // Validate payroll run
    const validationErrors = PayrollEngine.validatePayrollRun(payrollRun)
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: validationErrors }, { status: 400 })
    }

    // Process payroll
    const results = PayrollEngine.processPayrollRun(payrollRun)
    const summary = PayrollEngine.calculatePayrollSummary(results)

    // Generate payslips
    const payslips = results.map((result) => PayrollEngine.generatePayslip(result))

    return NextResponse.json({
      success: true,
      payrollRun: {
        ...payrollRun,
        status: "CALCULATED",
      },
      summary,
      results,
      payslips,
    })
  } catch (error) {
    console.error("Payroll processing error:", error)
    return NextResponse.json({ error: "Failed to process payroll" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period")
    const employeeId = searchParams.get("employeeId")

    // Mock payroll history - in production, this would come from the database
    const mockPayrollHistory = [
      {
        id: "run_001",
        period: "December 2024",
        startDate: "2024-12-01",
        endDate: "2024-12-31",
        status: "POSTED",
        summary: {
          totalEmployees: 4,
          totalGrossPay: 15850,
          totalNetPay: 12045,
          totalPaye: 2380,
          totalSsnitEmployee: 872.75,
          totalSsnitEmployer: 2129.25,
          totalDeductions: 3252.75,
        },
        processedDate: "2024-12-28",
      },
      {
        id: "run_002",
        period: "November 2024",
        startDate: "2024-11-01",
        endDate: "2024-11-30",
        status: "POSTED",
        summary: {
          totalEmployees: 4,
          totalGrossPay: 15850,
          totalNetPay: 12045,
          totalPaye: 2380,
          totalSsnitEmployee: 872.75,
          totalSsnitEmployer: 2129.25,
          totalDeductions: 3252.75,
        },
        processedDate: "2024-11-28",
      },
    ]

    if (period) {
      const filteredHistory = mockPayrollHistory.filter((run) =>
        run.period.toLowerCase().includes(period.toLowerCase()),
      )
      return NextResponse.json({ payrollRuns: filteredHistory })
    }

    if (employeeId) {
      // Return payslips for specific employee
      const mockPayslips = [
        {
          id: "payslip_001",
          employeeId,
          period: "December 2024",
          payDate: "2024-12-31",
          grossPay: 4850,
          netPay: 3420,
          paye: 675,
          ssnitEmployee: 266.75,
          breakdown: {
            earnings: {
              basicSalary: 4500,
              allowances: { transport: 200, lunch: 150 },
            },
            deductions: {
              paye: 675,
              ssnit: 266.75,
              other: { loan: 400, insurance: 50 },
            },
          },
        },
      ]
      return NextResponse.json({ payslips: mockPayslips })
    }

    return NextResponse.json({ payrollRuns: mockPayrollHistory })
  } catch (error) {
    console.error("Error fetching payroll data:", error)
    return NextResponse.json({ error: "Failed to fetch payroll data" }, { status: 500 })
  }
}
