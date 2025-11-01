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
          department
        )
      `)

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    } else if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data: analytics, error } = await query.order('performance_trend_score', { ascending: false })

    if (error) {
      console.error('Error fetching performance predictions:', error)
      return NextResponse.json({ error: "Failed to fetch performance predictions" }, { status: 500 })
    }

    // Get recent performance reviews for context
    const performanceData = await getPerformanceContext(employeeId, companyId, supabase)

    const insights = analytics?.map(analytic => ({
      ...analytic,
      performance_level: getPerformanceLevel(analytic.performance_trend_score),
      potential_level: getPotentialLevel(analytic.performance_potential_score),
      improvement_areas: generateImprovementAreas(analytic),
      strengths: generateStrengths(analytic),
      next_review_recommendations: generateReviewRecommendations(analytic)
    }))

    return NextResponse.json({
      success: true,
      data: insights,
      performance_context: performanceData,
      summary: generatePerformanceSummary(insights)
    })

  } catch (error) {
    console.error('Performance prediction API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { employee_id, company_id, performance_data } = await request.json()
    
    if (!employee_id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Calculate performance predictions
    const performanceScore = await calculatePerformanceScore(employee_id, performance_data, supabase)
    const potentialScore = await calculatePotentialScore(employee_id, performance_data, supabase)

    // Update analytics
    const { error: upsertError } = await supabase
      .from('employee_analytics')
      .upsert({
        employee_id,
        company_id,
        performance_trend_score: performanceScore,
        performance_potential_score: potentialScore,
        last_performance_analysis: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Error updating performance analytics:', upsertError)
      return NextResponse.json({ error: "Failed to update performance analytics" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      performance_trend_score: performanceScore,
      performance_potential_score: potentialScore,
      message: "Performance prediction updated successfully"
    })

  } catch (error) {
    console.error('Performance prediction POST error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function getPerformanceContext(employeeId: string | null, companyId: string | null, supabase: any) {
  let query = supabase
    .from('performance_reviews')
    .select(`
      *,
      employees (
        first_name,
        last_name,
        position
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  if (employeeId) {
    query = query.eq('employee_id', employeeId)
  } else if (companyId) {
    query = query.in('employee_id', 
      supabase.from('employees').select('id').eq('company_id', companyId)
    )
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching performance context:', error)
    return []
  }

  return data || []
}

async function calculatePerformanceScore(employeeId: string, performanceData: any, supabase: any): Promise<number> {
  // Get historical performance data
  const { data: reviews } = await supabase
    .from('performance_reviews')
    .select('rating, created_at')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(12)

  if (!reviews || reviews.length === 0) {
    return 50 // Default score if no data
  }

  // Calculate weighted average (recent reviews have more weight)
  let weightedSum = 0
  let totalWeight = 0

  reviews.forEach((review: any, index: number) => {
    const weight = Math.pow(0.9, index) // Decreasing weight for older reviews
    weightedSum += review.rating * weight * 20 // Convert 1-5 scale to 0-100
    totalWeight += weight
  })

  return totalWeight > 0 ? weightedSum / totalWeight : 50
}

async function calculatePotentialScore(employeeId: string, performanceData: any, supabase: any): Promise<number> {
  // Get skill assessments
  const { data: skills } = await supabase
    .from('employee_skill_assessments')
    .select('current_level, target_level')
    .eq('employee_id', employeeId)

  // Get learning activities
  const { data: learning } = await supabase
    .from('learning_path_recommendations')
    .select('status, progress_percentage')
    .eq('employee_id', employeeId)

  let potentialScore = 50 // Base score

  // Factor in skill gap progress
  if (skills && skills.length > 0) {
    const avgCurrentLevel = skills.reduce((sum: number, skill: any) => sum + skill.current_level, 0) / skills.length
    const avgTargetLevel = skills.reduce((sum: number, skill: any) => sum + skill.target_level, 0) / skills.length
    const skillProgress = (avgCurrentLevel / avgTargetLevel) * 30
    potentialScore += skillProgress
  }

  // Factor in learning completion
  if (learning && learning.length > 0) {
    const completedLearning = learning.filter((l: any) => l.status === 'completed').length
    const totalLearning = learning.length
    const learningProgress = (completedLearning / totalLearning) * 20
    potentialScore += learningProgress
  }

  return Math.min(100, Math.max(0, potentialScore))
}

function getPerformanceLevel(score: number): string {
  if (score >= 80) return 'excellent'
  if (score >= 65) return 'good'
  if (score >= 50) return 'satisfactory'
  if (score >= 35) return 'needs_improvement'
  return 'unsatisfactory'
}

function getPotentialLevel(score: number): string {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium-high'
  if (score >= 40) return 'medium'
  if (score >= 20) return 'low-medium'
  return 'low'
}

function generateImprovementAreas(analytic: any): string[] {
  const areas = []
  
  if (analytic.performance_trend_score < 50) {
    areas.push("Core job responsibilities")
  }
  
  if (analytic.performance_potential_score < 60) {
    areas.push("Skill development")
    areas.push("Learning and growth")
  }
  
  if (analytic.overall_sentiment_score < -0.1) {
    areas.push("Work satisfaction")
    areas.push("Team collaboration")
  }

  return areas
}

function generateStrengths(analytic: any): string[] {
  const strengths = []
  
  if (analytic.performance_trend_score >= 70) {
    strengths.push("Consistent performance")
  }
  
  if (analytic.performance_potential_score >= 70) {
    strengths.push("High growth potential")
    strengths.push("Learning agility")
  }
  
  if (analytic.overall_sentiment_score >= 0.3) {
    strengths.push("Positive attitude")
    strengths.push("Good team spirit")
  }

  return strengths
}

function generateReviewRecommendations(analytic: any): string[] {
  const recommendations = []
  
  if (analytic.performance_trend_score < 60) {
    recommendations.push("Set clear performance goals")
    recommendations.push("Provide additional training")
    recommendations.push("Increase feedback frequency")
  }
  
  if (analytic.performance_potential_score >= 70) {
    recommendations.push("Consider advancement opportunities")
    recommendations.push("Assign challenging projects")
    recommendations.push("Provide mentorship opportunities")
  }

  return recommendations
}

function generatePerformanceSummary(insights: any[]): any {
  if (!insights || insights.length === 0) {
    return { total_employees: 0, excellent: 0, good: 0, needs_improvement: 0 }
  }

  const excellent = insights.filter(i => i.performance_level === 'excellent').length
  const good = insights.filter(i => i.performance_level === 'good').length
  const needsImprovement = insights.filter(i => i.performance_level === 'needs_improvement' || i.performance_level === 'unsatisfactory').length

  return {
    total_employees: insights.length,
    excellent,
    good,
    needs_improvement: needsImprovement,
    average_performance_score: insights.reduce((sum, i) => sum + i.performance_trend_score, 0) / insights.length,
    high_potential_count: insights.filter(i => i.potential_level === 'high').length
  }
}
