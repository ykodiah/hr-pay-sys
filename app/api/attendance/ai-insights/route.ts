import { type NextRequest, NextResponse } from "next/server"
import {
  predictAttendanceRisk,
  detectAttendanceAnomalies,
  generateDepartmentInsights,
  identifyBurnoutRisks,
} from "@/lib/attendance/ml-engine"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's company
    const { data: profile } = await supabase.from("user_profiles").select("company_id").eq("user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const { action, employeeId, department } = await req.json()

    switch (action) {
      case "predict-risk":
        if (!employeeId) {
          return NextResponse.json({ error: "Employee ID required" }, { status: 400 })
        }
        const riskPrediction = await predictAttendanceRisk(employeeId)
        return NextResponse.json(riskPrediction)

      case "detect-anomalies":
        if (!employeeId) {
          return NextResponse.json({ error: "Employee ID required" }, { status: 400 })
        }
        const anomalies = await detectAttendanceAnomalies(employeeId, profile.company_id)
        return NextResponse.json(anomalies)

      case "department-insights":
        if (!department) {
          return NextResponse.json({ error: "Department required" }, { status: 400 })
        }
        const insights = await generateDepartmentInsights(department, profile.company_id)
        return NextResponse.json(insights)

      case "burnout-risks":
        const atRisk = await identifyBurnoutRisks(profile.company_id)
        return NextResponse.json({ employees: atRisk })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] AI insights error:", error)
    return NextResponse.json({ error: "Failed to generate AI insights" }, { status: 500 })
  }
}
