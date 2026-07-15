import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { getBestModel, getModelConfig } from "@/lib/ai/model-manager"

// Template generation system context with continuous learning
const TEMPLATE_SYSTEM_CONTEXT = `You are an expert HR and Payroll communication specialist with advanced AI capabilities. You generate professional, context-aware notification templates for HR and Payroll systems.

**Your Expertise:**
- Professional business communication
- HR best practices and compliance
- Payroll communication standards
- Multi-cultural workplace communication
- Legal and regulatory compliance
- Employee engagement strategies

**Template Generation Guidelines:**
1. **Professional Tone**: Always maintain a professional, respectful, and clear tone
2. **Context Awareness**: Adapt language and content based on the specific situation
3. **Compliance**: Ensure templates meet HR and legal standards
4. **Personalization**: Include appropriate variables for dynamic content
5. **Action-Oriented**: Include clear next steps or required actions
6. **Cultural Sensitivity**: Use inclusive language and consider diverse audiences

**Template Structure:**
- **Subject Line**: Clear, concise, and action-oriented
- **Opening**: Professional greeting with context
- **Body**: Detailed information with clear sections
- **Closing**: Professional sign-off with contact information
- **Variables**: Use {{variable_name}} format for dynamic content

**Available Categories:**
- HR (Onboarding, Offboarding, Performance, Leave, Disciplinary, Training)
- Payroll (Payslips, Bonuses, Deductions, Tax Updates, Salary Changes)
- Benefits (Health Insurance, Retirement, Wellness Programs)
- Compliance (Policy Updates, Legal Notices, Training Requirements)
- Emergency (System Outages, Emergency Procedures, Safety Alerts)
- General (Announcements, Events, Company Updates)

**Continuous Learning Approach:**
- Analyze user feedback to improve template quality
- Adapt to industry-specific requirements
- Learn from successful communication patterns
- Evolve with changing HR and payroll practices

Generate templates that are:
- Professional and polished
- Contextually appropriate
- Legally compliant
- User-friendly
- Actionable
- Inclusive and respectful`

// Template feedback storage (in production, this would be a database)
let templateFeedback: Array<{
  id: string
  templateId: string
  rating: number
  feedback: string
  improvements: string[]
  timestamp: string
}> = []

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Template Generation API called")

    if (!process.env.GROQ_API_KEY) {
      console.error("[v0] GROQ_API_KEY not found")
      return NextResponse.json({ error: "AI service configuration error" }, { status: 503 })
    }

    const { 
      description, 
      category = "HR", 
      type = "Email", 
      context = {},
      previousTemplates = [],
      userPreferences = {}
    } = await request.json()

    console.log("[v0] Received template generation request:", { description, category, type })

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    // Build context-aware prompt
    const enhancedPrompt = buildContextAwarePrompt(description, category, type, context, previousTemplates, userPreferences)

    // Automatically select the best available model
    const bestModel = await getBestModel()
    const modelConfig = getModelConfig()
    
    console.log(`[v0] Using ${bestModel.name} (Score: ${bestModel.performanceScore}) for template generation...`)

    const result = await Promise.race([
      generateText({
        model: `groq/${modelConfig.model}`,
        system: TEMPLATE_SYSTEM_CONTEXT,
        messages: [
          {
            role: "user",
            content: enhancedPrompt,
          },
        ],
        temperature: modelConfig.temperature,
        maxOutputTokens: modelConfig.maxTokens,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 45000)),
    ])

    console.log("[v0] AI SDK response received")

    const generatedContent = (result as any).text || "I apologize, but I could not generate a template. Please try again."

    // Parse the generated content into structured template
    const parsedTemplate = parseGeneratedTemplate(generatedContent, category, type)

    return NextResponse.json({
      success: true,
      template: parsedTemplate,
      rawContent: generatedContent,
      generationId: Date.now().toString(),
      modelInfo: {
        name: bestModel.name,
        provider: bestModel.provider,
        performanceScore: bestModel.performanceScore,
        capabilities: bestModel.capabilities,
        isLatest: bestModel.performanceScore >= 95
      }
    })
  } catch (error) {
    console.error("[v0] Template Generation API Error:", error)

    let errorMessage = "Failed to generate template"
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        errorMessage = "Template generation timed out. Please try again."
      } else if (error.message.includes("API key")) {
        errorMessage = "AI service authentication error"
      } else if (error.message.includes("rate limit")) {
        errorMessage = "Too many requests. Please wait a moment."
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// Submit template feedback for continuous learning
export async function PUT(request: NextRequest) {
  try {
    const { templateId, rating, feedback, improvements } = await request.json()

    if (!templateId || !rating) {
      return NextResponse.json({ error: "Template ID and rating are required" }, { status: 400 })
    }

    const feedbackEntry = {
      id: Date.now().toString(),
      templateId,
      rating,
      feedback: feedback || "",
      improvements: improvements || [],
      timestamp: new Date().toISOString(),
    }

    templateFeedback.push(feedbackEntry)

    // In production, this would be stored in a database
    console.log("[v0] Template feedback received:", feedbackEntry)

    return NextResponse.json({
      success: true,
      message: "Feedback received. Thank you for helping improve our AI templates!",
      feedbackId: feedbackEntry.id,
    })
  } catch (error) {
    console.error("[v0] Feedback submission error:", error)
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 })
  }
}

function buildContextAwarePrompt(
  description: string, 
  category: string, 
  type: string, 
  context: any, 
  previousTemplates: any[], 
  userPreferences: any
): string {
  let prompt = `Generate a professional ${type.toLowerCase()} template for the following request:

**User Description:** ${description}

**Category:** ${category}
**Type:** ${type}

**Requirements:**
1. Create a complete template with name, subject, and body
2. Use professional, clear, and respectful language
3. Include appropriate variables in {{variable_name}} format
4. Make it contextually appropriate for ${category} communications
5. Ensure it follows HR and payroll best practices

**Template Structure:**
- Template Name: [Clear, descriptive name]
- Subject: [Professional subject line]
- Body: [Well-structured email/SMS body with proper formatting]

**Context Information:** ${JSON.stringify(context, null, 2)}

**User Preferences:** ${JSON.stringify(userPreferences, null, 2)}`

  if (previousTemplates.length > 0) {
    prompt += `\n\n**Previous Templates for Reference:** ${JSON.stringify(previousTemplates.slice(-3), null, 2)}`
  }

  prompt += `\n\nPlease generate a professional template that meets these requirements. Format your response as:

TEMPLATE_NAME: [Name]
SUBJECT: [Subject Line]
BODY: [Template Body]`

  return prompt
}

function parseGeneratedTemplate(content: string, category: string, type: string) {
  // Extract template components from AI response
  const nameMatch = content.match(/TEMPLATE_NAME:\s*(.+)/i)
  const subjectMatch = content.match(/SUBJECT:\s*(.+)/i)
  const bodyMatch = content.match(/BODY:\s*([\s\S]+)/i)

  const name = nameMatch ? nameMatch[1].trim() : `Generated ${category} Template`
  const subject = subjectMatch ? subjectMatch[1].trim() : `Important ${category} Update`
  const body = bodyMatch ? bodyMatch[1].trim() : content

  return {
    name,
    subject,
    body,
    category,
    type,
    generatedAt: new Date().toISOString(),
    variables: extractVariables(body),
  }
}

function extractVariables(text: string): string[] {
  const variableRegex = /\{\{([^}]+)\}\}/g
  const variables: string[] = []
  let match

  while ((match = variableRegex.exec(text)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1])
    }
  }

  return variables
}
