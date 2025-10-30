import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { text, employee_id, feedback_source } = await request.json()
    
    if (!text || !employee_id) {
      return NextResponse.json({ error: "Text and employee_id are required" }, { status: 400 })
    }

    // Simple sentiment analysis (in production, you'd use a proper ML model)
    const sentimentScore = analyzeSentiment(text)
    const emotionLabels = extractEmotions(text)
    const keyTopics = extractTopics(text)
    const actionItems = generateActionItems(text, sentimentScore)

    const supabase = createClient()

    // Save analysis to database
    const { data, error } = await supabase
      .from('employee_feedback_analysis')
      .insert({
        employee_id,
        feedback_source: feedback_source || 'general',
        feedback_text: text,
        sentiment_score: sentimentScore,
        emotion_labels: emotionLabels,
        key_topics: keyTopics,
        action_items: actionItems,
        priority_level: determinePriority(sentimentScore, keyTopics),
        analysis_confidence: calculateConfidence(text),
        model_version: '1.0',
        processing_time_ms: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving sentiment analysis:', error)
      return NextResponse.json({ error: "Failed to save analysis" }, { status: 500 })
    }

    // Update employee analytics with sentiment data
    await updateEmployeeSentiment(employee_id, sentimentScore, supabase)

    return NextResponse.json({
      success: true,
      analysis: data,
      insights: {
        sentiment_trend: getSentimentTrend(sentimentScore),
        recommended_actions: generateRecommendedActions(sentimentScore, keyTopics),
        risk_indicators: identifyRiskIndicators(sentimentScore, emotionLabels)
      }
    })

  } catch (error) {
    console.error('Sentiment analysis API error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employee_id')
    const companyId = searchParams.get('company_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('employee_feedback_analysis')
      .select(`
        *,
        employees (
          first_name,
          last_name,
          position,
          department
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    } else if (companyId) {
      query = query.in('employee_id', 
        supabase.from('employees').select('id').eq('company_id', companyId)
      )
    }

    const { data: analyses, error } = await query

    if (error) {
      console.error('Error fetching sentiment analyses:', error)
      return NextResponse.json({ error: "Failed to fetch analyses" }, { status: 500 })
    }

    // Calculate summary statistics
    const summary = calculateSentimentSummary(analyses || [])

    return NextResponse.json({
      success: true,
      data: analyses,
      summary
    })

  } catch (error) {
    console.error('Sentiment analysis GET error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function analyzeSentiment(text: string): number {
  // Simple keyword-based sentiment analysis
  // In production, use a proper ML model or API like OpenAI, AWS Comprehend, etc.
  
  const positiveWords = [
    'excellent', 'great', 'good', 'amazing', 'wonderful', 'fantastic', 'love', 'enjoy',
    'happy', 'satisfied', 'pleased', 'excited', 'motivated', 'engaged', 'productive',
    'successful', 'achievement', 'progress', 'improvement', 'growth', 'opportunity'
  ]
  
  const negativeWords = [
    'terrible', 'awful', 'bad', 'horrible', 'hate', 'disappointed', 'frustrated',
    'angry', 'upset', 'stressed', 'overwhelmed', 'burnout', 'exhausted', 'demotivated',
    'unhappy', 'dissatisfied', 'concerned', 'worried', 'problem', 'issue', 'challenge'
  ]

  const words = text.toLowerCase().split(/\s+/)
  let positiveCount = 0
  let negativeCount = 0

  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) positiveCount++
    if (negativeWords.some(nw => word.includes(nw))) negativeCount++
  })

  const totalWords = words.length
  if (totalWords === 0) return 0

  const positiveRatio = positiveCount / totalWords
  const negativeRatio = negativeCount / totalWords

  // Return sentiment score between -1 (very negative) and 1 (very positive)
  return Math.max(-1, Math.min(1, positiveRatio - negativeRatio))
}

function extractEmotions(text: string): string[] {
  const emotions = []
  const lowerText = text.toLowerCase()

  const emotionKeywords = {
    'joy': ['happy', 'excited', 'thrilled', 'delighted', 'elated'],
    'sadness': ['sad', 'disappointed', 'upset', 'down', 'depressed'],
    'anger': ['angry', 'frustrated', 'mad', 'irritated', 'annoyed'],
    'fear': ['worried', 'anxious', 'concerned', 'nervous', 'scared'],
    'surprise': ['surprised', 'shocked', 'amazed', 'astonished'],
    'disgust': ['disgusted', 'revolted', 'repulsed', 'sickened']
  }

  Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      emotions.push(emotion)
    }
  })

  return emotions
}

function extractTopics(text: string): string[] {
  const topics = []
  const lowerText = text.toLowerCase()

  const topicKeywords = {
    'workload': ['workload', 'busy', 'overwhelmed', 'too much work', 'heavy load'],
    'management': ['manager', 'boss', 'leadership', 'supervisor', 'management'],
    'compensation': ['salary', 'pay', 'compensation', 'benefits', 'bonus', 'raise'],
    'career': ['career', 'promotion', 'advancement', 'growth', 'development'],
    'workplace': ['office', 'environment', 'culture', 'atmosphere', 'colleagues'],
    'work_life_balance': ['balance', 'hours', 'overtime', 'flexibility', 'remote'],
    'recognition': ['recognition', 'appreciation', 'credit', 'acknowledgment'],
    'training': ['training', 'learning', 'skills', 'development', 'education']
  }

  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      topics.push(topic)
    }
  })

  return topics
}

function generateActionItems(text: string, sentimentScore: number): string[] {
  const actionItems = []

  if (sentimentScore < -0.3) {
    actionItems.push('Schedule one-on-one meeting to address concerns')
    actionItems.push('Investigate underlying issues mentioned in feedback')
  }

  if (text.toLowerCase().includes('workload') || text.toLowerCase().includes('overwhelmed')) {
    actionItems.push('Review and adjust workload distribution')
  }

  if (text.toLowerCase().includes('manager') || text.toLowerCase().includes('leadership')) {
    actionItems.push('Provide management training and support')
  }

  if (text.toLowerCase().includes('salary') || text.toLowerCase().includes('compensation')) {
    actionItems.push('Review compensation and benefits package')
  }

  if (sentimentScore > 0.3) {
    actionItems.push('Recognize and celebrate positive feedback')
    actionItems.push('Use as example for best practices')
  }

  return actionItems
}

function determinePriority(sentimentScore: number, keyTopics: string[]): string {
  if (sentimentScore < -0.5) return 'critical'
  if (sentimentScore < -0.2 || keyTopics.includes('workload') || keyTopics.includes('management')) return 'high'
  if (sentimentScore < 0.2) return 'medium'
  return 'low'
}

function calculateConfidence(text: string): number {
  // Simple confidence calculation based on text length and keyword density
  const wordCount = text.split(/\s+/).length
  const confidence = Math.min(95, Math.max(60, wordCount * 2))
  return confidence
}

async function updateEmployeeSentiment(employeeId: string, sentimentScore: number, supabase: any) {
  try {
    // Update or insert employee analytics with sentiment data
    await supabase
      .from('employee_analytics')
      .upsert({
        employee_id: employeeId,
        overall_sentiment_score: sentimentScore,
        last_sentiment_analysis: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error updating employee sentiment:', error)
  }
}

function getSentimentTrend(sentimentScore: number): string {
  if (sentimentScore > 0.3) return 'positive'
  if (sentimentScore > -0.2) return 'neutral'
  return 'negative'
}

function generateRecommendedActions(sentimentScore: number, keyTopics: string[]): string[] {
  const actions = []

  if (sentimentScore < -0.3) {
    actions.push('Immediate intervention required')
    actions.push('Schedule emergency meeting with employee')
  }

  if (keyTopics.includes('workload')) {
    actions.push('Redistribute workload')
    actions.push('Provide additional resources')
  }

  if (keyTopics.includes('management')) {
    actions.push('Management training program')
    actions.push('Leadership coaching')
  }

  if (keyTopics.includes('compensation')) {
    actions.push('Compensation review')
    actions.push('Benefits analysis')
  }

  return actions
}

function identifyRiskIndicators(sentimentScore: number, emotionLabels: string[]): string[] {
  const risks = []

  if (sentimentScore < -0.5) {
    risks.push('High retention risk')
  }

  if (emotionLabels.includes('anger') || emotionLabels.includes('disgust')) {
    risks.push('Potential conflict situation')
  }

  if (emotionLabels.includes('sadness') || emotionLabels.includes('fear')) {
    risks.push('Employee wellbeing concern')
  }

  return risks
}

function calculateSentimentSummary(analyses: any[]): any {
  if (analyses.length === 0) {
    return {
      total_analyses: 0,
      average_sentiment: 0,
      positive_count: 0,
      negative_count: 0,
      neutral_count: 0,
      top_topics: [],
      priority_actions: 0
    }
  }

  const sentiments = analyses.map(a => a.sentiment_score)
  const averageSentiment = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length

  const positiveCount = analyses.filter(a => a.sentiment_score > 0.2).length
  const negativeCount = analyses.filter(a => a.sentiment_score < -0.2).length
  const neutralCount = analyses.length - positiveCount - negativeCount

  // Count topics
  const topicCounts: { [key: string]: number } = {}
  analyses.forEach(a => {
    if (a.key_topics) {
      a.key_topics.forEach((topic: string) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1
      })
    }
  })

  const topTopics = Object.entries(topicCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }))

  const priorityActions = analyses.filter(a => a.priority_level === 'high' || a.priority_level === 'critical').length

  return {
    total_analyses: analyses.length,
    average_sentiment: Math.round(averageSentiment * 100) / 100,
    positive_count: positiveCount,
    negative_count: negativeCount,
    neutral_count: neutralCount,
    top_topics: topTopics,
    priority_actions: priorityActions
  }
}