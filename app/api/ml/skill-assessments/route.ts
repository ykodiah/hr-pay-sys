import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employee_id')
    const companyId = searchParams.get('company_id')
    const category = searchParams.get('category')

    if (!employeeId && !companyId) {
      return NextResponse.json({ error: "Employee ID or Company ID is required" }, { status: 400 })
    }

    let query = supabase
      .from('employee_skill_assessments')
      .select(`
        *,
        employees (
          first_name,
          last_name,
          position,
          department
        )
      `)

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    } else if (companyId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.in('employee_id', supabase.from('employees').select('id').eq('company_id', companyId) as any)
    }

    if (category) {
      query = query.eq('skill_category', category)
    }

    const { data: assessments, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching skill assessments:', error)
      return NextResponse.json({ error: "Failed to fetch skill assessments" }, { status: 500 })
    }

    // Enhance assessments with ML predictions
    const enhancedAssessments = await enhanceAssessmentsWithML(assessments || [], supabase)

    return NextResponse.json({
      success: true,
      data: enhancedAssessments,
      summary: generateSkillSummary(enhancedAssessments)
    })

  } catch (error) {
    console.error('Skill assessments API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      employee_id, 
      skill_category, 
      skill_name, 
      current_level, 
      target_level, 
      assessment_method = 'self_assessment',
      assessor_id 
    } = await request.json()
    
    if (!employee_id || !skill_category || !skill_name || !current_level || !target_level) {
      return NextResponse.json({ 
        error: "Employee ID, skill category, skill name, current level, and target level are required" 
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Generate ML predictions
    const mlPredictions = await generateMLPredictions(employee_id, skill_name, current_level, supabase)

    // Create skill assessment
    const { data, error } = await supabase
      .from('employee_skill_assessments')
      .insert({
        employee_id,
        skill_category,
        skill_name,
        current_level,
        target_level,
        assessment_method,
        assessor_id,
        predicted_level: mlPredictions.predicted_level,
        confidence_score: mlPredictions.confidence_score,
        improvement_potential: mlPredictions.improvement_potential,
        learning_recommendations: mlPredictions.learning_recommendations,
        assessment_date: new Date().toISOString().split('T')[0],
        next_assessment_due: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating skill assessment:', error)
      return NextResponse.json({ error: "Failed to create skill assessment" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data,
      ml_predictions: mlPredictions,
      message: "Skill assessment created successfully"
    })

  } catch (error) {
    console.error('Skill assessments POST error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function enhanceAssessmentsWithML(assessments: any[], supabase: any): Promise<any[]> {
  return Promise.all(assessments.map(async (assessment) => {
    // If ML predictions don't exist, generate them
    if (!assessment.predicted_level) {
      const mlPredictions = await generateMLPredictions(
        assessment.employee_id, 
        assessment.skill_name, 
        assessment.current_level, 
        supabase
      )
      
      // Update the assessment with ML predictions
      const { error } = await supabase
        .from('employee_skill_assessments')
        .update({
          predicted_level: mlPredictions.predicted_level,
          confidence_score: mlPredictions.confidence_score,
          improvement_potential: mlPredictions.improvement_potential,
          learning_recommendations: mlPredictions.learning_recommendations
        })
        .eq('id', assessment.id)

      if (!error) {
        return { ...assessment, ...mlPredictions }
      }
    }

    return assessment
  }))
}

async function generateMLPredictions(employeeId: string, skillName: string, currentLevel: number, supabase: any) {
  // Get employee's performance data
  const { data: performance } = await supabase
    .from('employee_analytics')
    .select('performance_trend_score, performance_potential_score')
    .eq('employee_id', employeeId)
    .single()

  // Get historical skill progression
  const { data: skillHistory } = await supabase
    .from('employee_skill_assessments')
    .select('current_level, target_level, created_at')
    .eq('employee_id', employeeId)
    .eq('skill_name', skillName)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get learning activities
  const { data: learningActivities } = await supabase
    .from('learning_path_recommendations')
    .select('status, progress_percentage')
    .eq('employee_id', employeeId)
    .ilike('title', `%${skillName}%`)

  // Calculate predicted level based on various factors
  let predictedLevel = currentLevel
  let confidenceScore = 60 // Base confidence

  // Factor in performance potential
  if (performance?.performance_potential_score) {
    const potentialFactor = performance.performance_potential_score / 100
    predictedLevel += potentialFactor * 0.5
    confidenceScore += 20
  }

  // Factor in historical progression
  if (skillHistory && skillHistory.length > 1) {
    const progressionRate = calculateProgressionRate(skillHistory)
    predictedLevel += progressionRate * 0.3
    confidenceScore += 15
  }

  // Factor in learning activities
  if (learningActivities && learningActivities.length > 0) {
    const completedLearning = learningActivities.filter((l: any) => l.status === 'completed').length
    const totalLearning = learningActivities.length
    const learningProgress = completedLearning / totalLearning
    predictedLevel += learningProgress * 0.4
    confidenceScore += 10
  }

  // Cap predicted level at 5
  predictedLevel = Math.min(5, Math.max(1, predictedLevel))

  // Calculate improvement potential
  const improvementPotential = Math.min(100, ((predictedLevel - currentLevel) / (5 - currentLevel)) * 100)

  // Generate learning recommendations
  const learningRecommendations = generateLearningRecommendations(skillName, currentLevel, predictedLevel)

  return {
    predicted_level: Math.round(predictedLevel * 10) / 10,
    confidence_score: Math.min(95, confidenceScore),
    improvement_potential: Math.max(0, improvementPotential),
    learning_recommendations: learningRecommendations
  }
}

function calculateProgressionRate(skillHistory: any[]): number {
  if (skillHistory.length < 2) return 0

  const firstAssessment = skillHistory[skillHistory.length - 1]
  const lastAssessment = skillHistory[0]
  
  const timeDiff = new Date(lastAssessment.created_at).getTime() - new Date(firstAssessment.created_at).getTime()
  const monthsDiff = timeDiff / (1000 * 60 * 60 * 24 * 30)
  
  if (monthsDiff === 0) return 0
  
  const levelDiff = lastAssessment.current_level - firstAssessment.current_level
  return levelDiff / monthsDiff
}

function generateLearningRecommendations(skillName: string, currentLevel: number, predictedLevel: number): string[] {
  const recommendations = []
  const gap = predictedLevel - currentLevel

  if (gap > 0) {
    recommendations.push(`Complete ${skillName} fundamentals course`)
    
    if (currentLevel < 2) {
      recommendations.push(`Practice basic ${skillName} exercises daily`)
      recommendations.push(`Find a mentor in ${skillName}`)
    } else if (currentLevel < 3) {
      recommendations.push(`Work on intermediate ${skillName} projects`)
      recommendations.push(`Join ${skillName} community groups`)
    } else if (currentLevel < 4) {
      recommendations.push(`Take advanced ${skillName} certification`)
      recommendations.push(`Teach ${skillName} to others`)
    } else {
      recommendations.push(`Lead ${skillName} initiatives`)
      recommendations.push(`Contribute to ${skillName} open source projects`)
    }

    if (gap > 1) {
      recommendations.push(`Create a 90-day ${skillName} improvement plan`)
      recommendations.push(`Set up regular progress check-ins`)
    }
  }

  return recommendations
}

function generateSkillSummary(assessments: any[]): any {
  if (assessments.length === 0) {
    return {
      total_skills: 0,
      skill_gaps: 0,
      critical_gaps: 0,
      average_current_level: 0,
      average_target_level: 0,
      ml_predictions: 0
    }
  }

  const skillGaps = assessments.filter(a => a.current_level < a.target_level)
  const criticalGaps = skillGaps.filter(a => (a.target_level - a.current_level) >= 2)
  const averageCurrentLevel = assessments.reduce((sum, a) => sum + a.current_level, 0) / assessments.length
  const averageTargetLevel = assessments.reduce((sum, a) => sum + a.target_level, 0) / assessments.length
  const mlPredictions = assessments.filter(a => a.predicted_level).length

  return {
    total_skills: assessments.length,
    skill_gaps: skillGaps.length,
    critical_gaps: criticalGaps.length,
    average_current_level: Math.round(averageCurrentLevel * 10) / 10,
    average_target_level: Math.round(averageTargetLevel * 10) / 10,
    ml_predictions: mlPredictions,
    gap_percentage: Math.round((skillGaps.length / assessments.length) * 100)
  }
}
