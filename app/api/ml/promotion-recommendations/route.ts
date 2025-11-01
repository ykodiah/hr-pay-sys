import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employee_id')
    const companyId = searchParams.get('company_id')
    const includeDetails = searchParams.get('include_details') === 'true'

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

    const { data: analytics, error } = await query.order('promotion_readiness_score', { ascending: false })

    if (error) {
      console.error('Error fetching promotion recommendations:', error)
      return NextResponse.json({ error: "Failed to fetch promotion recommendations" }, { status: 500 })
    }

    // Get additional data for detailed analysis
    const promotionData = includeDetails ? await getPromotionContext(employeeId, companyId, supabase) : null

    const recommendations = analytics?.map(analytic => {
      const readinessLevel = getReadinessLevel(analytic.promotion_readiness_score)
      const timeToPromotion = estimateTimeToPromotion(analytic)
      
      return {
        ...analytic,
        readiness_level: readinessLevel,
        time_to_promotion_months: timeToPromotion,
        promotion_benefits: generatePromotionBenefits(analytic),
        development_plan: generateDevelopmentPlan(analytic),
        risk_factors: identifyRiskFactors(analytic),
        next_steps: generateNextSteps(analytic, readinessLevel)
      }
    })

    return NextResponse.json({
      success: true,
      data: recommendations,
      promotion_context: promotionData,
      summary: generatePromotionSummary(recommendations)
    })

  } catch (error) {
    console.error('Promotion recommendations API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { employee_id, company_id, promotion_data } = await request.json()
    
    if (!employee_id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Calculate promotion readiness
    const readinessScore = await calculatePromotionReadiness(employee_id, promotion_data, supabase)
    const nextPromotionProbability = await calculatePromotionProbability(employee_id, supabase)

    // Generate promotion recommendations
    const recommendations = await generatePromotionRecommendations(employee_id, readinessScore, supabase)

    // Update analytics
    const { error: upsertError } = await supabase
      .from('employee_analytics')
      .upsert({
        employee_id,
        company_id,
        promotion_readiness_score: readinessScore,
        next_promotion_probability: nextPromotionProbability,
        promotion_recommendations: recommendations,
        last_promotion_analysis: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Error updating promotion analytics:', upsertError)
      return NextResponse.json({ error: "Failed to update promotion analytics" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      promotion_readiness_score: readinessScore,
      next_promotion_probability: nextPromotionProbability,
      recommendations: recommendations,
      message: "Promotion analysis updated successfully"
    })

  } catch (error) {
    console.error('Promotion recommendations POST error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function getPromotionContext(employeeId: string | null, companyId: string | null, supabase: any) {
  // Get career progression predictions
  let careerQuery = supabase
    .from('career_progression_predictions')
    .select('*')

  if (employeeId) {
    careerQuery = careerQuery.eq('employee_id', employeeId)
  }

  const { data: careerData } = await careerQuery

  // Get skill assessments
  let skillsQuery = supabase
    .from('employee_skill_assessments')
    .select('skill_category, skill_name, current_level, target_level')

  if (employeeId) {
    skillsQuery = skillsQuery.eq('employee_id', employeeId)
  }

  const { data: skillsData } = await skillsQuery

  return {
    career_predictions: careerData,
    skill_assessments: skillsData
  }
}

async function calculatePromotionReadiness(employeeId: string, promotionData: any, supabase: any): Promise<number> {
  // Get performance data
  const { data: performance } = await supabase
    .from('performance_reviews')
    .select('rating, created_at')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(6)

  // Get skill data
  const { data: skills } = await supabase
    .from('employee_skill_assessments')
    .select('current_level, target_level')
    .eq('employee_id', employeeId)

  // Get tenure
  const { data: employee } = await supabase
    .from('employees')
    .select('hire_date')
    .eq('id', employeeId)
    .single()

  let readinessScore = 0

  // Performance factor (40%)
  if (performance && performance.length > 0) {
    const avgRating = performance.reduce((sum: number, p: any) => sum + p.rating, 0) / performance.length
    readinessScore += (avgRating / 5) * 40
  }

  // Skills factor (30%)
  if (skills && skills.length > 0) {
    const avgCurrentLevel = skills.reduce((sum: number, s: any) => sum + s.current_level, 0) / skills.length
    const avgTargetLevel = skills.reduce((sum: number, s: any) => sum + s.target_level, 0) / skills.length
    const skillProgress = (avgCurrentLevel / avgTargetLevel) * 30
    readinessScore += skillProgress
  }

  // Tenure factor (20%)
  if (employee?.hire_date) {
    const tenureMonths = Math.floor((Date.now() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 30))
    const tenureScore = Math.min(tenureMonths / 24, 1) * 20 // 2 years = full score
    readinessScore += tenureScore
  }

  // Leadership factor (10%)
  const leadershipScore = promotionData?.leadership_experience ? 10 : 0
  readinessScore += leadershipScore

  return Math.min(100, Math.max(0, readinessScore))
}

async function calculatePromotionProbability(employeeId: string, supabase: any): Promise<number> {
  // This would typically use a trained ML model
  // For now, we'll use a simplified calculation based on readiness score
  
  const { data: analytics } = await supabase
    .from('employee_analytics')
    .select('promotion_readiness_score')
    .eq('employee_id', employeeId)
    .single()

  if (!analytics) return 0

  // Convert readiness score to probability (0-100%)
  return Math.min(100, analytics.promotion_readiness_score)
}

async function generatePromotionRecommendations(employeeId: string, readinessScore: number, supabase: any): Promise<any[]> {
  const recommendations = []

  if (readinessScore >= 80) {
    recommendations.push({
      type: 'immediate_promotion',
      title: 'Ready for Immediate Promotion',
      description: 'Employee demonstrates strong readiness for promotion',
      priority: 'high',
      timeline: '1-3 months'
    })
  } else if (readinessScore >= 60) {
    recommendations.push({
      type: 'development_promotion',
      title: 'Promotion with Development Plan',
      description: 'Employee ready for promotion with targeted development',
      priority: 'medium',
      timeline: '3-6 months'
    })
  } else if (readinessScore >= 40) {
    recommendations.push({
      type: 'skill_development',
      title: 'Focus on Skill Development',
      description: 'Employee needs skill development before promotion consideration',
      priority: 'medium',
      timeline: '6-12 months'
    })
  } else {
    recommendations.push({
      type: 'performance_improvement',
      title: 'Performance Improvement Required',
      description: 'Employee needs performance improvement before promotion consideration',
      priority: 'low',
      timeline: '12+ months'
    })
  }

  return recommendations
}

function getReadinessLevel(score: number): string {
  if (score >= 80) return 'ready'
  if (score >= 60) return 'almost_ready'
  if (score >= 40) return 'developing'
  return 'not_ready'
}

function estimateTimeToPromotion(analytic: any): number {
  const score = analytic.promotion_readiness_score
  
  if (score >= 80) return 1-3
  if (score >= 60) return 3-6
  if (score >= 40) return 6-12
  return 12
}

function generatePromotionBenefits(analytic: any): string[] {
  const benefits = []
  
  if (analytic.performance_trend_score >= 70) {
    benefits.push("Strong performance track record")
  }
  
  if (analytic.performance_potential_score >= 70) {
    benefits.push("High growth potential")
  }
  
  if (analytic.overall_sentiment_score >= 0.2) {
    benefits.push("Positive attitude and engagement")
  }

  return benefits
}

function generateDevelopmentPlan(analytic: any): string[] {
  const plan = []
  
  if (analytic.performance_potential_score < 60) {
    plan.push("Complete leadership training program")
    plan.push("Take on mentoring responsibilities")
  }
  
  if (analytic.performance_trend_score < 60) {
    plan.push("Focus on core competency improvement")
    plan.push("Regular performance coaching sessions")
  }

  return plan
}

function identifyRiskFactors(analytic: any): string[] {
  const risks = []
  
  if (analytic.retention_risk_score > 60) {
    risks.push("High retention risk")
  }
  
  if (analytic.overall_sentiment_score < -0.2) {
    risks.push("Negative sentiment indicators")
  }
  
  if (analytic.performance_trend_score < 50) {
    risks.push("Declining performance trend")
  }

  return risks
}

function generateNextSteps(analytic: any, readinessLevel: string): string[] {
  const steps = []
  
  switch (readinessLevel) {
    case 'ready':
      steps.push("Schedule promotion discussion with HR")
      steps.push("Prepare promotion documentation")
      steps.push("Plan role transition")
      break
    case 'almost_ready':
      steps.push("Create 90-day development plan")
      steps.push("Assign stretch projects")
      steps.push("Provide leadership opportunities")
      break
    case 'developing':
      steps.push("Identify specific skill gaps")
      steps.push("Create learning path")
      steps.push("Set regular check-ins")
      break
    default:
      steps.push("Focus on performance improvement")
      steps.push("Address underlying issues")
      steps.push("Regular feedback sessions")
  }

  return steps
}

function generatePromotionSummary(recommendations: any[]): any {
  if (!recommendations || recommendations.length === 0) {
    return { total_employees: 0, ready: 0, almost_ready: 0, developing: 0 }
  }

  const ready = recommendations.filter(r => r.readiness_level === 'ready').length
  const almostReady = recommendations.filter(r => r.readiness_level === 'almost_ready').length
  const developing = recommendations.filter(r => r.readiness_level === 'developing').length

  return {
    total_employees: recommendations.length,
    ready,
    almost_ready: almostReady,
    developing,
    average_readiness_score: recommendations.reduce((sum, r) => sum + r.promotion_readiness_score, 0) / recommendations.length,
    immediate_promotion_candidates: ready
  }
}
