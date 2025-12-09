import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { policy } = await request.json()

    if (!policy) {
      return NextResponse.json({ error: "Policy data is required" }, { status: 400 })
    }

    const prompt = `Analyze this leave policy and provide a concise professional insight:

Policy: ${policy.name}
Days Allocated: ${policy.days}
Current Usage: ${policy.usage}
Description: ${policy.description}

Provide a brief, actionable insight (2-3 sentences) focusing on:
- Usage pattern analysis
- Optimization recommendation
- Risk assessment or opportunity

Keep the response professional and under 100 words.`

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      maxTokens: 150,
      temperature: 0.7,
    })

    return NextResponse.json({ insight: text })
  } catch (error) {
    console.error("Error generating policy insight:", error)
    return NextResponse.json({ error: "Failed to generate insight" }, { status: 500 })
  }
}
