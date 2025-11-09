import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const analysisType = searchParams.get("type") || "all"
  const days = Number.parseInt(searchParams.get("days") || "30")

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: records, error } = await supabase
      .from("attendance_records")
      .select("*, employees(*)")
      .gte("date", startDate.toISOString().split("T")[0])
      .order("date", { ascending: true })

    if (error) throw error

    const analytics = {
      absenteeismTrends: calculateAbsenteeismTrends(records),
      fatigueAnalysis: calculateFatigueRisks(records),
      predictiveAbsences: predictFutureAbsences(records),
      departmentPatterns: analyzeDepartmentPatterns(records),
      riskEmployees: identifyRiskEmployees(records),
      overtimePatterns: analyzeOvertimePatterns(records),
      recommendations: generateRecommendations(records),
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("[v0] Analytics error:", error)
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 })
  }
}

function calculateAbsenteeismTrends(records: any[]) {
  const dailyStats = new Map<string, { present: number; absent: number; total: number }>()

  records.forEach((record) => {
    const date = record.date
    if (!dailyStats.has(date)) {
      dailyStats.set(date, { present: 0, absent: 0, total: 0 })
    }
    const stats = dailyStats.get(date)!
    stats.total++
    if (record.status === "present") {
      stats.present++
    } else {
      stats.absent++
    }
  })

  const dates = Array.from(dailyStats.keys()).sort()
  const absenteeismRates = dates.map((date) => {
    const stats = dailyStats.get(date)!
    return (stats.absent / stats.total) * 100
  })

  // Calculate trend using linear regression
  const trend = calculateTrend(absenteeismRates)
  const weeklyAvg = absenteeismRates.slice(-7).reduce((a, b) => a + b, 0) / 7
  const monthlyAvg = absenteeismRates.reduce((a, b) => a + b, 0) / absenteeismRates.length

  return {
    trend: trend > 0.5 ? "increasing" : trend < -0.5 ? "decreasing" : "stable",
    weeklyRate: weeklyAvg.toFixed(2),
    monthlyRate: monthlyAvg.toFixed(2),
    change: (((weeklyAvg - monthlyAvg) / monthlyAvg) * 100).toFixed(1),
    dailyRates: absenteeismRates.slice(-14),
  }
}

function calculateFatigueRisks(records: any[]) {
  const employeeFatigue = new Map<string, { hours: number[]; overtime: number[]; consecutive: number }>()

  records.forEach((record) => {
    if (!employeeFatigue.has(record.employee_id)) {
      employeeFatigue.set(record.employee_id, { hours: [], overtime: [], consecutive: 0 })
    }
    const fatigue = employeeFatigue.get(record.employee_id)!

    if (record.total_hours) {
      fatigue.hours.push(record.total_hours)
      if (record.total_hours > 8) fatigue.consecutive++
      else fatigue.consecutive = 0
    }
    if (record.overtime_hours) {
      fatigue.overtime.push(record.overtime_hours)
    }
  })

  const riskAssessments = Array.from(employeeFatigue.entries()).map(([empId, data]) => {
    const avgHours = data.hours.reduce((a, b) => a + b, 0) / data.hours.length
    const totalOT = data.overtime.reduce((a, b) => a + b, 0)
    const recentHours = data.hours.slice(-7)
    const recentAvg = recentHours.reduce((a, b) => a + b, 0) / recentHours.length

    let riskScore = 0
    if (avgHours > 10) riskScore += 3
    else if (avgHours > 8.5) riskScore += 2
    if (totalOT > 20) riskScore += 3
    else if (totalOT > 10) riskScore += 2
    if (data.consecutive > 5) riskScore += 3
    if (recentAvg > avgHours * 1.2) riskScore += 2

    return {
      employeeId: empId,
      riskLevel: riskScore > 7 ? "high" : riskScore > 4 ? "medium" : "low",
      riskScore,
      avgHours: avgHours.toFixed(1),
      totalOvertime: totalOT.toFixed(1),
      consecutiveLongDays: data.consecutive,
    }
  })

  return {
    highRisk: riskAssessments.filter((r) => r.riskLevel === "high"),
    mediumRisk: riskAssessments.filter((r) => r.riskLevel === "medium"),
    lowRisk: riskAssessments.filter((r) => r.riskLevel === "low"),
    totalAtRisk: riskAssessments.filter((r) => r.riskLevel !== "low").length,
  }
}

function predictFutureAbsences(records: any[]) {
  const dailyAbsences = new Map<string, number>()

  records.forEach((record) => {
    if (record.status === "absent") {
      dailyAbsences.set(record.date, (dailyAbsences.get(record.date) || 0) + 1)
    }
  })

  const absenceValues = Array.from(dailyAbsences.values())
  const avgAbsences = absenceValues.reduce((a, b) => a + b, 0) / absenceValues.length || 0
  const variance = absenceValues.reduce((sum, val) => sum + Math.pow(val - avgAbsences, 2), 0) / absenceValues.length
  const stdDev = Math.sqrt(variance)

  // Simple prediction based on moving average and trend
  const recentAbsences = absenceValues.slice(-7)
  const recentAvg = recentAbsences.reduce((a, b) => a + b, 0) / recentAbsences.length
  const trend = calculateTrend(recentAbsences)

  const predictions = {
    tomorrow: Math.round(recentAvg + trend),
    nextWeek: Math.round((recentAvg + trend * 3) * 5),
    confidence: Math.max(0, Math.min(100, 100 - (stdDev / avgAbsences) * 100)),
    pattern: trend > 0.5 ? "increasing" : trend < -0.5 ? "decreasing" : "stable",
  }

  return predictions
}

function analyzeDepartmentPatterns(records: any[]) {
  const deptStats = new Map<string, { present: number; absent: number; overtime: number; avgHours: number[] }>()

  records.forEach((record) => {
    const dept = record.employees?.department || "Unknown"
    if (!deptStats.has(dept)) {
      deptStats.set(dept, { present: 0, absent: 0, overtime: 0, avgHours: [] })
    }
    const stats = deptStats.get(dept)!

    if (record.status === "present") stats.present++
    else stats.absent++
    if (record.overtime_hours) stats.overtime += record.overtime_hours
    if (record.total_hours) stats.avgHours.push(record.total_hours)
  })

  return Array.from(deptStats.entries()).map(([dept, stats]) => ({
    department: dept,
    attendanceRate: ((stats.present / (stats.present + stats.absent)) * 100).toFixed(1),
    totalOvertime: stats.overtime.toFixed(1),
    avgHours: (stats.avgHours.reduce((a, b) => a + b, 0) / stats.avgHours.length).toFixed(1),
    employeeCount: stats.present + stats.absent,
  }))
}

function identifyRiskEmployees(records: any[]) {
  const employeeMetrics = new Map<
    string,
    {
      absences: number
      lateArrivals: number
      overtime: number
      longDays: number
      inconsistent: boolean
    }
  >()

  records.forEach((record) => {
    if (!employeeMetrics.has(record.employee_id)) {
      employeeMetrics.set(record.employee_id, {
        absences: 0,
        lateArrivals: 0,
        overtime: 0,
        longDays: 0,
        inconsistent: false,
      })
    }
    const metrics = employeeMetrics.get(record.employee_id)!

    if (record.status === "absent") metrics.absences++
    if (record.status === "late") metrics.lateArrivals++
    if ((record.overtime_hours || 0) > 2) metrics.overtime++
    if ((record.total_hours || 0) > 10) metrics.longDays++
  })

  const riskEmployees = Array.from(employeeMetrics.entries())
    .map(([empId, metrics]) => {
      let riskScore = 0
      const reasons = []

      if (metrics.absences > 3) {
        riskScore += 3
        reasons.push(`${metrics.absences} absences`)
      }
      if (metrics.lateArrivals > 3) {
        riskScore += 2
        reasons.push(`${metrics.lateArrivals} late arrivals`)
      }
      if (metrics.overtime > 5) {
        riskScore += 2
        reasons.push(`Frequent overtime`)
      }
      if (metrics.longDays > 5) {
        riskScore += 3
        reasons.push(`${metrics.longDays} long workdays`)
      }

      return {
        employeeId: empId,
        riskScore,
        reasons,
        metrics,
      }
    })
    .filter((e) => e.riskScore >= 4)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10)

  return riskEmployees
}

function analyzeOvertimePatterns(records: any[]) {
  const dailyOT = new Map<string, number>()
  const employeeOT = new Map<string, number[]>()

  records.forEach((record) => {
    if (record.overtime_hours && record.overtime_hours > 0) {
      dailyOT.set(record.date, (dailyOT.get(record.date) || 0) + record.overtime_hours)

      if (!employeeOT.has(record.employee_id)) {
        employeeOT.set(record.employee_id, [])
      }
      employeeOT.get(record.employee_id)!.push(record.overtime_hours)
    }
  })

  const totalOT = Array.from(dailyOT.values()).reduce((a, b) => a + b, 0)
  const avgDailyOT = totalOT / dailyOT.size
  const topOTEmployees = Array.from(employeeOT.entries())
    .map(([empId, hours]) => ({
      employeeId: empId,
      totalOT: hours.reduce((a, b) => a + b, 0),
      avgOT: hours.reduce((a, b) => a + b, 0) / hours.length,
      frequency: hours.length,
    }))
    .sort((a, b) => b.totalOT - a.totalOT)
    .slice(0, 5)

  return {
    totalOvertime: totalOT.toFixed(1),
    avgDailyOvertime: avgDailyOT.toFixed(1),
    topEmployees: topOTEmployees,
    trend: calculateTrend(Array.from(dailyOT.values()).slice(-14)),
  }
}

function generateRecommendations(records: any[]) {
  const recommendations = []

  const recentAbsences = records.filter(
    (r) => r.status === "absent" && new Date(r.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  )
  if (recentAbsences.length > records.length * 0.15) {
    recommendations.push({
      priority: "high",
      category: "attendance",
      title: "High Absenteeism Detected",
      description: `Absenteeism rate is ${((recentAbsences.length / records.length) * 100).toFixed(1)}% this week, above the 15% threshold.`,
      actions: [
        "Conduct wellness check-ins with affected departments",
        "Review workload distribution",
        "Consider flexible work arrangements",
      ],
    })
  }

  const highOT = records.filter((r) => (r.overtime_hours || 0) > 4)
  if (highOT.length > 0) {
    recommendations.push({
      priority: "high",
      category: "overtime",
      title: "Excessive Overtime Identified",
      description: `${highOT.length} employees working >4 hours overtime. Risk of burnout.`,
      actions: [
        "Review workload and staffing levels",
        "Implement mandatory rest periods",
        "Consider hiring additional staff",
      ],
    })
  }

  const longDays = records.filter((r) => (r.total_hours || 0) > 10)
  if (longDays.length > records.length * 0.1) {
    recommendations.push({
      priority: "medium",
      category: "wellbeing",
      title: "Fatigue Risk Alert",
      description: `${longDays.length} instances of 10+ hour workdays detected.`,
      actions: ["Schedule wellness conversations", "Review shift patterns", "Ensure proper break compliance"],
    })
  }

  const lateArrivals = records.filter((r) => r.status === "late")
  if (lateArrivals.length > records.length * 0.2) {
    recommendations.push({
      priority: "medium",
      category: "punctuality",
      title: "Late Arrival Pattern",
      description: `${((lateArrivals.length / records.length) * 100).toFixed(1)}% late arrival rate detected.`,
      actions: ["Review shift start times", "Investigate commute challenges", "Consider flexible start times"],
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: "low",
      category: "performance",
      title: "Attendance Performance Good",
      description: "No significant attendance issues detected. Keep monitoring trends.",
      actions: ["Continue current practices", "Maintain regular wellness check-ins"],
    })
  }

  return recommendations
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0

  const n = values.length
  const sumX = (n * (n - 1)) / 2
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = values.reduce((sum, val, idx) => sum + idx * val, 0)
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  return slope
}
