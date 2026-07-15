import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: "groq/llama-3.3-70b-versatile",
      prompt: prompt,
      maxOutputTokens: 1500,
      temperature: 0.7,
    })

    return NextResponse.json({ insights: text })
  } catch (error) {
    console.error("Error generating AI insights:", error)
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}
