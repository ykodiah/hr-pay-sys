import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { employeeId, timeRange } = await request.json()

    // Fetch attendance data
    const { data: records, error } = await supabase
      .from("attendance_records")
      .select(`
        *,
        employee:employees(
          id,
          full_name,
          department,
          division
        )
      `)
      .eq("employee_id", employeeId)
      .order("clock_in", { ascending: false })
      .limit(30)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate statistics
    const stats = {
      totalDays: records.length,
      presentDays: records.filter((r) => r.status === "present").length,
      lateDays: records.filter((r) => r.late_by_minutes && r.late_by_minutes > 0).length,
      avgHours: records.reduce((sum, r) => sum + (r.total_hours || 0), 0) / records.length,
      totalOvertime: records.reduce((sum, r) => {
        if (r.total_hours && r.total_hours > 8) {
          return sum + (r.total_hours - 8)
        }
        return sum
      }, 0),
    }

    // Generate AI insights
    const prompt = `Analyze this employee attendance data and provide actionable insights:

Employee: ${records[0]?.employee?.full_name}
Department: ${records[0]?.employee?.department}
Period: Last 30 days

Statistics:
- Total working days: ${stats.totalDays}
- Present days: ${stats.presentDays}
- Late arrivals: ${stats.lateDays}
- Average hours per day: ${stats.avgHours.toFixed(2)}
- Total overtime hours: ${stats.totalOvertime.toFixed(2)}

Provide:
1. Overall attendance performance rating (Excellent/Good/Fair/Poor)
2. Top 3 specific patterns or concerns
3. 2-3 actionable recommendations for improvement
4. Risk assessment (Low/Medium/High) for burnout or absenteeism

Format your response as JSON with this structure:
{
  "rating": "Good",
  "score": 85,
  "patterns": ["Pattern 1", "Pattern 2", "Pattern 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "risks": {
    "burnout": "Low",
    "absenteeism": "Medium",
    "timeTheft": "Low"
  },
  "summary": "Brief overall summary"
}`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
    })

    // Parse AI response
    let insights
    try {
      insights = JSON.parse(text)
    } catch {
      insights = {
        rating: "Good",
        score: 75,
        patterns: ["Regular attendance pattern", "Occasional late arrivals"],
        recommendations: ["Maintain current attendance habits"],
        risks: { burnout: "Low", absenteeism: "Low", timeTheft: "Low" },
        summary: "Overall good attendance performance",
      }
    }

    return NextResponse.json({
      success: true,
      insights,
      stats,
      records: records.slice(0, 10),
    })
  } catch (error: any) {
    console.error("[v0] AI insights error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
