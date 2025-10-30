import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employee_id')
    const companyId = searchParams.get('company_id')

    if (!employeeId && !companyId) {
      return NextResponse.json({ error: "Employee ID or Company ID is required" }, { status: 400 })
    }

    let query = supabase
      .from('employee_analytics')
      .select(`
        *,
        employees (
          id,
          first_name,
          last_name,
          email,
          position,
          department,
          hire_date
        )
      `)

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    } else if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data: analytics, error } = await query.order('retention_risk_score', { ascending: false })

    if (error) {
      console.error('Error fetching retention analysis:', error)
      return NextResponse.json({ error: "Failed to fetch retention analysis" }, { status: 500 })
    }

    // Calculate additional insights
    const insights = analytics?.map(analytic => {
      const riskLevel = analytic.retention_risk_score > 70 ? 'high' : 
                       analytic.retention_risk_score > 40 ? 'medium' : 'low'
      
      return {
        ...analytic,
        risk_level: riskLevel,
        recommended_actions: generateRetentionRecommendations(analytic),
        urgency_score: calculateUrgencyScore(analytic)
      }
    })

    return NextResponse.json({
      success: true,
      data: insights,
      summary: generateRetentionSummary(insights)
    })

  } catch (error) {
    console.error('Retention analysis API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { employee_id, company_id } = await request.json()
    
    if (!employee_id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Trigger ML analysis
    const { data, error } = await supabase.rpc('calculate_retention_risk_score', {
      p_employee_id: employee_id
    })

    if (error) {
      console.error('Error calculating retention risk:', error)
      return NextResponse.json({ error: "Failed to calculate retention risk" }, { status: 500 })
    }

    // Update or insert analytics record
    const { error: upsertError } = await supabase
      .from('employee_analytics')
      .upsert({
        employee_id,
        company_id,
        retention_risk_score: data,
        last_retention_analysis: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Error updating analytics:', upsertError)
      return NextResponse.json({ error: "Failed to update analytics" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      retention_risk_score: data,
      message: "Retention analysis updated successfully"
    })

  } catch (error) {
    console.error('Retention analysis POST error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateRetentionRecommendations(analytic: any): string[] {
  const recommendations = []
  
  if (analytic.retention_risk_score > 70) {
    recommendations.push("Schedule one-on-one meeting with manager")
    recommendations.push("Review compensation and benefits")
    recommendations.push("Assess workload and work-life balance")
    recommendations.push("Provide career development opportunities")
  } else if (analytic.retention_risk_score > 40) {
    recommendations.push("Regular check-ins with direct supervisor")
    recommendations.push("Identify growth opportunities")
    recommendations.push("Gather feedback on job satisfaction")
  } else {
    recommendations.push("Maintain current engagement strategies")
    recommendations.push("Continue professional development")
  }

  if (analytic.overall_sentiment_score < -0.2) {
    recommendations.push("Address negative sentiment through feedback sessions")
  }

  return recommendations
}

function calculateUrgencyScore(analytic: any): number {
  let urgency = 0
  
  if (analytic.retention_risk_score > 80) urgency += 40
  else if (analytic.retention_risk_score > 60) urgency += 30
  else if (analytic.retention_risk_score > 40) urgency += 20
  
  if (analytic.overall_sentiment_score < -0.5) urgency += 30
  else if (analytic.overall_sentiment_score < -0.2) urgency += 20
  
  if (analytic.performance_trend_score < 30) urgency += 30
  
  return Math.min(100, urgency)
}

function generateRetentionSummary(insights: any[]): any {
  if (!insights || insights.length === 0) {
    return { total_employees: 0, high_risk: 0, medium_risk: 0, low_risk: 0 }
  }

  const highRisk = insights.filter(i => i.risk_level === 'high').length
  const mediumRisk = insights.filter(i => i.risk_level === 'medium').length
  const lowRisk = insights.filter(i => i.risk_level === 'low').length

  return {
    total_employees: insights.length,
    high_risk: highRisk,
    medium_risk: mediumRisk,
    low_risk: lowRisk,
    average_risk_score: insights.reduce((sum, i) => sum + i.retention_risk_score, 0) / insights.length,
    immediate_action_needed: highRisk
  }
}