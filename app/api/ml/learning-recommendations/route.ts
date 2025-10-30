import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employee_id')
    const companyId = searchParams.get('company_id')
    const category = searchParams.get('category')

    if (!employeeId && !companyId) {
      return NextResponse.json({ error: "Employee ID or Company ID is required" }, { status: 400 })
    }

    let query = supabase
      .from('learning_path_recommendations')
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
      query = query.in('employee_id', 
        supabase.from('employees').select('id').eq('company_id', companyId)
      )
    }

    if (category) {
      query = query.eq('recommendation_type', category)
    }

    const { data: recommendations, error } = await query.order('priority_score', { ascending: false })

    if (error) {
      console.error('Error fetching learning recommendations:', error)
      return NextResponse.json({ error: "Failed to fetch learning recommendations" }, { status: 500 })
    }

    // Get skill gaps and career goals for enhanced recommendations
    const enhancedRecommendations = await enhanceRecommendations(recommendations, employeeId, companyId, supabase)

    return NextResponse.json({
      success: true,
      data: enhancedRecommendations,
      summary: generateLearningSummary(enhancedRecommendations)
    })

  } catch (error) {
    console.error('Learning recommendations API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { employee_id, company_id, learning_preferences, career_goals } = await request.json()
    
    if (!employee_id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Generate personalized learning recommendations
    const recommendations = await generatePersonalizedRecommendations(
      employee_id, 
      company_id, 
      learning_preferences, 
      career_goals, 
      supabase
    )

    // Save recommendations to database
    const { error: insertError } = await supabase
      .from('learning_path_recommendations')
      .insert(recommendations)

    if (insertError) {
      console.error('Error saving learning recommendations:', insertError)
      return NextResponse.json({ error: "Failed to save learning recommendations" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      recommendations: recommendations,
      message: "Learning recommendations generated successfully"
    })

  } catch (error) {
    console.error('Learning recommendations POST error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function enhanceRecommendations(recommendations: any[], employeeId: string | null, companyId: string | null, supabase: any) {
  if (!recommendations) return []

  return Promise.all(recommendations.map(async (rec) => {
    // Get skill gaps for this employee
    const { data: skillGaps } = await supabase
      .from('employee_skill_assessments')
      .select('skill_name, current_level, target_level')
      .eq('employee_id', rec.employee_id)
      .lt('current_level', 'target_level')

    // Get career progression data
    const { data: careerData } = await supabase
      .from('career_progression_predictions')
      .select('next_role_probability, critical_skills_gaps')
      .eq('employee_id', rec.employee_id)
      .single()

    // Get learning progress
    const { data: progress } = await supabase
      .from('learning_path_recommendations')
      .select('status, progress_percentage')
      .eq('employee_id', rec.employee_id)
      .eq('recommendation_type', rec.recommendation_type)

    return {
      ...rec,
      skill_gaps: skillGaps || [],
      career_insights: careerData || {},
      learning_progress: progress || [],
      personalized_insights: generatePersonalizedInsights(rec, skillGaps, careerData)
    }
  }))
}

async function generatePersonalizedRecommendations(
  employeeId: string, 
  companyId: string, 
  learningPreferences: any, 
  careerGoals: any, 
  supabase: any
): Promise<any[]> {
  const recommendations = []

  // Get employee's current skills and performance
  const { data: skills } = await supabase
    .from('employee_skill_assessments')
    .select('skill_category, skill_name, current_level, target_level')
    .eq('employee_id', employeeId)

  const { data: performance } = await supabase
    .from('employee_analytics')
    .select('performance_trend_score, performance_potential_score')
    .eq('employee_id', employeeId)
    .single()

  // Get company's learning resources
  const { data: learningResources } = await supabase
    .from('learning_resources')
    .select('*')
    .eq('company_id', companyId)

  // Generate skill development recommendations
  if (skills && skills.length > 0) {
    const skillGaps = skills.filter(s => s.current_level < s.target_level)
    
    skillGaps.forEach(skill => {
      const priorityScore = calculateSkillPriority(skill, performance, careerGoals)
      
      recommendations.push({
        employee_id: employeeId,
        recommendation_type: 'skill_development',
        title: `Improve ${skill.skill_name}`,
        description: `Develop ${skill.skill_name} from level ${skill.current_level} to ${skill.target_level}`,
        priority_score: priorityScore,
        estimated_duration_days: calculateDuration(skill.current_level, skill.target_level),
        difficulty_level: getDifficultyLevel(skill.target_level),
        recommended_courses: findRelevantCourses(skill.skill_name, learningResources),
        learning_objectives: generateLearningObjectives(skill),
        status: 'pending'
      })
    })
  }

  // Generate career advancement recommendations
  if (careerGoals?.target_role) {
    recommendations.push({
      employee_id: employeeId,
      recommendation_type: 'career_advancement',
      title: `Prepare for ${careerGoals.target_role}`,
      description: `Develop skills and experience needed for ${careerGoals.target_role} role`,
      priority_score: 85,
      estimated_duration_days: 180,
      difficulty_level: 'advanced',
      learning_objectives: generateCareerObjectives(careerGoals),
      status: 'pending'
    })
  }

  // Generate leadership development recommendations
  if (performance?.performance_potential_score > 70) {
    recommendations.push({
      employee_id: employeeId,
      recommendation_type: 'leadership_development',
      title: 'Leadership Development Program',
      description: 'Develop leadership skills for future management roles',
      priority_score: 80,
      estimated_duration_days: 120,
      difficulty_level: 'intermediate',
      learning_objectives: generateLeadershipObjectives(),
      status: 'pending'
    })
  }

  return recommendations
}

function calculateSkillPriority(skill: any, performance: any, careerGoals: any): number {
  let priority = 50 // Base priority

  // Factor in skill gap size
  const gap = skill.target_level - skill.current_level
  priority += gap * 10

  // Factor in performance potential
  if (performance?.performance_potential_score > 70) {
    priority += 20
  }

  // Factor in career goals alignment
  if (careerGoals?.target_skills?.includes(skill.skill_name)) {
    priority += 30
  }

  return Math.min(100, Math.max(0, priority))
}

function calculateDuration(currentLevel: number, targetLevel: number): number {
  const gap = targetLevel - currentLevel
  return gap * 30 // 30 days per level
}

function getDifficultyLevel(targetLevel: number): string {
  if (targetLevel <= 2) return 'beginner'
  if (targetLevel <= 3) return 'intermediate'
  if (targetLevel <= 4) return 'advanced'
  return 'expert'
}

function findRelevantCourses(skillName: string, resources: any[]): any[] {
  if (!resources) return []
  
  return resources
    .filter(resource => 
      resource.title.toLowerCase().includes(skillName.toLowerCase()) ||
      resource.tags?.some((tag: string) => tag.toLowerCase().includes(skillName.toLowerCase()))
    )
    .slice(0, 3) // Limit to top 3 recommendations
}

function generateLearningObjectives(skill: any): string[] {
  return [
    `Understand core concepts of ${skill.skill_name}`,
    `Apply ${skill.skill_name} in practical scenarios`,
    `Demonstrate proficiency at level ${skill.target_level}`
  ]
}

function generateCareerObjectives(careerGoals: any): string[] {
  return [
    `Develop skills required for ${careerGoals.target_role}`,
    `Build relevant experience and portfolio`,
    `Network with professionals in target field`
  ]
}

function generateLeadershipObjectives(): string[] {
  return [
    'Develop team management skills',
    'Learn strategic thinking and planning',
    'Improve communication and presentation skills',
    'Build conflict resolution capabilities'
  ]
}

function generatePersonalizedInsights(recommendation: any, skillGaps: any[], careerData: any): any {
  const insights = {
    alignment_score: 0,
    feasibility_score: 0,
    impact_potential: 'medium',
    suggested_timeline: 'flexible'
  }

  // Calculate alignment with skill gaps
  if (skillGaps && skillGaps.length > 0) {
    const relevantGaps = skillGaps.filter(gap => 
      recommendation.title.toLowerCase().includes(gap.skill_name.toLowerCase())
    ).length
    insights.alignment_score = (relevantGaps / skillGaps.length) * 100
  }

  // Calculate feasibility based on difficulty and duration
  const difficultyMultiplier = {
    'beginner': 1.0,
    'intermediate': 0.8,
    'advanced': 0.6,
    'expert': 0.4
  }
  
  insights.feasibility_score = 100 * difficultyMultiplier[recommendation.difficulty_level as keyof typeof difficultyMultiplier]

  // Determine impact potential
  if (recommendation.priority_score > 80) {
    insights.impact_potential = 'high'
  } else if (recommendation.priority_score > 60) {
    insights.impact_potential = 'medium'
  } else {
    insights.impact_potential = 'low'
  }

  return insights
}

function generateLearningSummary(recommendations: any[]): any {
  if (!recommendations || recommendations.length === 0) {
    return { total_recommendations: 0, by_type: {}, by_status: {} }
  }

  const byType = recommendations.reduce((acc, rec) => {
    acc[rec.recommendation_type] = (acc[rec.recommendation_type] || 0) + 1
    return acc
  }, {})

  const byStatus = recommendations.reduce((acc, rec) => {
    acc[rec.status] = (acc[rec.status] || 0) + 1
    return acc
  }, {})

  const highPriority = recommendations.filter(r => r.priority_score > 80).length
  const inProgress = recommendations.filter(r => r.status === 'in_progress').length

  return {
    total_recommendations: recommendations.length,
    by_type: byType,
    by_status: byStatus,
    high_priority_count: highPriority,
    in_progress_count: inProgress,
    average_priority_score: recommendations.reduce((sum, r) => sum + r.priority_score, 0) / recommendations.length
  }
}