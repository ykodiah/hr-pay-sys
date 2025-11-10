import { generateObject, generateText } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// Schema for AI-generated insights
const attendanceInsightSchema = z.object({
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  riskFactors: z.array(z.string()),
  predictions: z.object({
    absenteeismRisk: z.number().min(0).max(100),
    burnoutRisk: z.number().min(0).max(100),
    timeTheftRisk: z.number().min(0).max(100),
  }),
  recommendations: z.array(
    z.object({
      action: z.string(),
      priority: z.enum(["low", "medium", "high"]),
      expectedImpact: z.string(),
    }),
  ),
  trendAnalysis: z.object({
    direction: z.enum(["improving", "stable", "declining"]),
    summary: z.string(),
  }),
})

const anomalyDetectionSchema = z.object({
  anomalies: z.array(
    z.object({
      type: z.enum(["location", "timing", "frequency", "duration"]),
      severity: z.enum(["low", "medium", "high"]),
      description: z.string(),
      affectedRecords: z.array(z.string()),
    }),
  ),
  overallScore: z.number().min(0).max(100),
  recommendation: z.string(),
})

// Predictive analytics for employee attendance
export async function predictAttendanceRisk(employeeId: string) {
  const supabase = await createClient()

  // Get employee's attendance history (last 90 days)
  const { data: records } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("date", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order("date", { ascending: false })

  if (!records || records.length === 0) {
    return null
  }

  // Calculate key metrics
  const totalDays = records.length
  const lateDays = records.filter((r) => r.late_minutes > 0).length
  const absentDays = records.filter((r) => r.status === "absent").length
  const overtimeDays = records.filter((r) => r.overtime_minutes > 0).length
  const avgLateMinutes = records.reduce((sum, r) => sum + (r.late_minutes || 0), 0) / totalDays
  const avgOvertimeMinutes = records.reduce((sum, r) => sum + (r.overtime_minutes || 0), 0) / totalDays

  // Use AI to analyze patterns and generate insights
  const { object: insights } = await generateObject({
    model: "openai/gpt-5-mini",
    schema: attendanceInsightSchema,
    prompt: `Analyze this employee's attendance data and provide insights:
    
    Total working days (last 90 days): ${totalDays}
    Late arrivals: ${lateDays} (${((lateDays / totalDays) * 100).toFixed(1)}%)
    Absences: ${absentDays} (${((absentDays / totalDays) * 100).toFixed(1)}%)
    Average late minutes: ${avgLateMinutes.toFixed(1)}
    Overtime days: ${overtimeDays} (${((overtimeDays / totalDays) * 100).toFixed(1)}%)
    Average overtime minutes: ${avgOvertimeMinutes.toFixed(1)}
    
    Recent attendance pattern (last 30 days):
    ${records
      .slice(0, 30)
      .map((r) => `${r.date}: ${r.status}, Late: ${r.late_minutes}min, OT: ${r.overtime_minutes}min`)
      .join("\n")}
    
    Provide risk assessment, predictions, recommendations for HR intervention, and trend analysis.`,
  })

  return insights
}

// Detect anomalies in attendance records
export async function detectAttendanceAnomalies(employeeId: string, companyId: string) {
  const supabase = await createClient()

  // Get employee's recent records with location data
  const { data: records } = await supabase
    .from("attendance_records")
    .select("*, employees(first_name, last_name, department)")
    .eq("employee_id", employeeId)
    .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("date", { ascending: false })

  if (!records || records.length === 0) {
    return null
  }

  // Use AI to detect anomalies
  const { object: anomalies } = await generateObject({
    model: "openai/gpt-5-mini",
    schema: anomalyDetectionSchema,
    prompt: `Analyze these attendance records for anomalies and suspicious patterns:
    
    ${records
      .map(
        (r) => `
    Date: ${r.date}
    Clock In: ${r.clock_in_time} (GPS: ${r.clock_in_location?.coordinates?.[0]}, ${r.clock_in_location?.coordinates?.[1]})
    Clock Out: ${r.clock_out_time} (GPS: ${r.clock_out_location?.coordinates?.[0]}, ${r.clock_out_location?.coordinates?.[1]})
    Total Hours: ${r.total_hours}
    Status: ${r.status}
    `,
      )
      .join("\n")}
    
    Look for:
    1. Unusual clock-in/out times compared to typical patterns
    2. GPS location anomalies (too far from usual location, impossible travel speed)
    3. Suspicious patterns suggesting time theft or buddy punching
    4. Irregular working hours or duration patterns
    
    Provide detailed anomaly detection with severity levels and recommendations.`,
  })

  return anomalies
}

// Generate department-wide attendance insights
export async function generateDepartmentInsights(department: string, companyId: string) {
  const supabase = await createClient()

  // Get department's attendance data
  const { data: records } = await supabase
    .from("attendance_records")
    .select(`
      *,
      employees!inner(department, first_name, last_name)
    `)
    .eq("employees.department", department)
    .eq("company_id", companyId)
    .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  if (!records || records.length === 0) {
    return null
  }

  const totalRecords = records.length
  const uniqueEmployees = new Set(records.map((r) => r.employee_id)).size
  const avgAttendanceRate = (records.filter((r) => r.status === "present").length / totalRecords) * 100
  const avgLateRate = (records.filter((r) => r.late_minutes > 0).length / totalRecords) * 100
  const avgOvertimeHours = records.reduce((sum, r) => sum + (r.overtime_minutes || 0), 0) / totalRecords / 60

  const { text: insights } = await generateText({
    model: "openai/gpt-5-mini",
    prompt: `Generate executive insights for the ${department} department's attendance performance:
    
    Metrics (last 30 days):
    - Total employees: ${uniqueEmployees}
    - Total attendance records: ${totalRecords}
    - Attendance rate: ${avgAttendanceRate.toFixed(1)}%
    - Late arrival rate: ${avgLateRate.toFixed(1)}%
    - Average overtime hours per record: ${avgOvertimeHours.toFixed(1)}
    
    Provide:
    1. Overall performance summary
    2. Key strengths and concerns
    3. Comparison to typical industry benchmarks
    4. Actionable recommendations for department manager
    5. Focus areas for improvement
    
    Format as a professional executive summary (2-3 paragraphs).`,
  })

  return {
    insights: insights.text,
    metrics: {
      uniqueEmployees,
      totalRecords,
      avgAttendanceRate: Number.parseFloat(avgAttendanceRate.toFixed(1)),
      avgLateRate: Number.parseFloat(avgLateRate.toFixed(1)),
      avgOvertimeHours: Number.parseFloat(avgOvertimeHours.toFixed(1)),
    },
  }
}

// Analyze overtime request text with NLP
export async function analyzeOvertimeRequest(requestText: string, employeeHistory: any) {
  const { object: analysis } = await generateObject({
    model: "openai/gpt-5-mini",
    schema: z.object({
      urgency: z.enum(["low", "medium", "high", "critical"]),
      category: z.enum(["project_deadline", "staff_shortage", "emergency", "planned", "other"]),
      sentiment: z.enum(["positive", "neutral", "negative"]),
      legitimacyScore: z.number().min(0).max(100),
      redFlags: z.array(z.string()),
      recommendation: z.enum(["approve", "review", "reject"]),
      reasoning: z.string(),
    }),
    prompt: `Analyze this overtime request:
    
    Request: "${requestText}"
    
    Employee's recent overtime history:
    - Total overtime requests this month: ${employeeHistory.monthlyRequests || 0}
    - Average overtime hours per month: ${employeeHistory.avgOvertimeHours || 0}
    - Previous request approval rate: ${employeeHistory.approvalRate || 0}%
    
    Analyze for:
    1. Urgency level
    2. Request category
    3. Sentiment/tone
    4. Legitimacy (is this a valid business need?)
    5. Any red flags or suspicious patterns
    6. Recommendation for manager
    
    Provide detailed analysis with reasoning.`,
  })

  return analysis
}

// Predict optimal shift scheduling
export async function predictOptimalShifts(companyId: string, department: string) {
  const supabase = await createClient()

  // Get historical attendance patterns
  const { data: records } = await supabase
    .from("attendance_records")
    .select(`
      *,
      employees!inner(department)
    `)
    .eq("employees.department", department)
    .eq("company_id", companyId)
    .gte("date", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

  if (!records || records.length === 0) {
    return null
  }

  // Group by day of week
  const dayPatterns: { [key: string]: number[] } = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  }

  records.forEach((record) => {
    const day = new Date(record.date).toLocaleDateString("en-US", { weekday: "long" })
    if (record.total_hours) {
      dayPatterns[day].push(record.total_hours)
    }
  })

  const { text: recommendations } = await generateText({
    model: "openai/gpt-5-mini",
    prompt: `Based on historical attendance data, recommend optimal shift schedules for ${department}:
    
    Average hours worked per day:
    ${Object.entries(dayPatterns)
      .map(([day, hours]) => {
        const avg = hours.length > 0 ? hours.reduce((a, b) => a + b, 0) / hours.length : 0
        return `${day}: ${avg.toFixed(1)} hours (${hours.length} records)`
      })
      .join("\n")}
    
    Provide:
    1. Recommended shift start/end times for each day
    2. Suggested staffing levels
    3. Considerations for peak/off-peak periods
    4. Flexibility recommendations
    
    Format as actionable shift schedule recommendations.`,
  })

  return recommendations.text
}

// Calculate AI-based attendance score
export function calculateAIAttendanceScore(record: any): number {
  let score = 100

  // Deduct points for lateness
  if (record.late_minutes > 0) {
    score -= Math.min(record.late_minutes / 2, 20)
  }

  // Deduct points for absence
  if (record.status === "absent") {
    score -= 50
  }

  // Deduct points for suspicious patterns
  if (record.clock_out_time && record.clock_in_time) {
    const duration = new Date(record.clock_out_time).getTime() - new Date(record.clock_in_time).getTime()
    const hours = duration / (1000 * 60 * 60)

    // Unusual duration (too short or too long)
    if (hours < 4 || hours > 16) {
      score -= 10
    }
  }

  // GPS location consistency check
  if (record.clock_in_location && record.clock_out_location) {
    const coords1 = record.clock_in_location.coordinates
    const coords2 = record.clock_out_location.coordinates

    if (coords1 && coords2) {
      // If coordinates are identical (suspicious)
      if (coords1[0] === coords2[0] && coords1[1] === coords2[1]) {
        score -= 5
      }
    }
  }

  return Math.max(0, Math.round(score))
}

// Identify employees at risk of burnout
export async function identifyBurnoutRisks(companyId: string) {
  const supabase = await createClient()

  // Get employees with high overtime
  const { data: employees } = await supabase
    .from("employees")
    .select(`
      id,
      first_name,
      last_name,
      department,
      attendance_records(
        overtime_minutes,
        total_hours,
        date
      )
    `)
    .eq("company_id", companyId)

  if (!employees) return []

  const atRiskEmployees = employees.filter((emp) => {
    const recentRecords =
      emp.attendance_records?.filter((r: any) => {
        const recordDate = new Date(r.date)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        return recordDate >= thirtyDaysAgo
      }) || []

    const totalOvertimeMinutes = recentRecords.reduce((sum: number, r: any) => sum + (r.overtime_minutes || 0), 0)
    const avgDailyHours =
      recentRecords.reduce((sum: number, r: any) => sum + (r.total_hours || 0), 0) / (recentRecords.length || 1)

    // Risk factors: >40 hours overtime in 30 days OR avg >10 hours/day
    return totalOvertimeMinutes > 2400 || avgDailyHours > 10
  })

  return atRiskEmployees.map((emp) => ({
    id: emp.id,
    name: `${emp.first_name} ${emp.last_name}`,
    department: emp.department,
    riskLevel: "high" as const,
  }))
}
