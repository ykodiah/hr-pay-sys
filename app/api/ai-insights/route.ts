import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    let prompt: string

    if (body.type === "individual_policy") {
      const { policyName, policyData } = body
      prompt = `Analyze this leave policy and provide actionable insights:

Policy: ${policyName}
Days Allocated: ${policyData.days}
Current Usage: ${policyData.usage}
Description: ${policyData.description}

Please provide a brief, actionable insight (2-3 sentences) focusing on:
- Usage patterns and trends
- Recommendations for optimization
- Potential concerns or opportunities

Keep the response concise and professional.`
    } else {
      // Legacy format for backward compatibility
      prompt = body.prompt
    }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: prompt,
      maxTokens: 1500,
      temperature: 0.7,
    })

    if (body.type === "individual_policy") {
      return NextResponse.json({ insight: text })
    } else {
      return NextResponse.json({ insights: text })
    }
  } catch (error) {
    console.error("Error generating AI insights:", error)
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}
