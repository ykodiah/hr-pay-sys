import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

// HR/Payroll system knowledge base
const SYSTEM_CONTEXT = `You are an AI assistant for an HR and Payroll Management System called "Akwaaba HR & Payroll". You help users with:

**Core Modules:**
- Employee Management (Personal Info, Employment, Financial, Documents)
- Multi-Company Management (Subsidiaries, Divisions, Departments)
- Payroll Settings (Allowances, Deductions, Loan Settings)
- Organizational Charts
- Leave Management
- Performance Reviews
- Reports & Analytics

**Key Features:**
- Employee profiles with dual line manager setup (Direct Supervisor & Head of Department)
- Comprehensive financial data (allowances, deductions, loans)
- Document management (Academic certificates, passport, resume, etc.)
- Multi-subsidiary support
- Organizational chart generation
- Payroll computations

**Common Tasks:**
- Adding new employees with sequential ID (AKWA0001, AKWA0002, etc.)
- Setting up company subsidiaries and organizational structure
- Configuring payroll settings (allowances, deductions, loan terms)
- Managing employee documents and verification
- Generating organizational charts
- Processing leave requests through management hierarchy

Always provide step-by-step instructions and reference specific sections of the system when helping users.`

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Chat API called")

    if (!process.env.GROQ_API_KEY) {
      console.error("[v0] GROQ_API_KEY not found")
      return NextResponse.json({ error: "AI service configuration error" }, { status: 503 })
    }

    const { message, conversationHistory = [] } = await request.json()
    console.log("[v0] Received message:", message)

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    console.log("[v0] Calling Groq API via AI SDK...")

    const result = await Promise.race([
      generateText({
        model: groq("llama-3.1-70b-versatile"),
        system: SYSTEM_CONTEXT,
        messages: [
          ...conversationHistory,
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        maxTokens: 1000,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 30000)),
    ])

    console.log("[v0] AI SDK response received")

    const response = result.text || "I apologize, but I could not generate a response. Please try again."

    return NextResponse.json({
      response,
      conversationId: Date.now().toString(),
    })
  } catch (error) {
    console.error("[v0] Chat API Error:", error)

    let errorMessage = "Failed to process chat request"
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        errorMessage = "Request timed out. Please try again."
      } else if (error.message.includes("API key")) {
        errorMessage = "AI service authentication error"
      } else if (error.message.includes("rate limit")) {
        errorMessage = "Too many requests. Please wait a moment."
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
