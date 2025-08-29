import { type NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

let groq: Groq | null = null

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

async function initializeGroq() {
  if (!groq) {
    try {
      groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      })
      console.log("[v0] Groq SDK initialized successfully")
    } catch (error) {
      console.error("[v0] Failed to initialize Groq SDK:", error)
      throw new Error("AI service initialization failed")
    }
  }
  return groq
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Chat API called")

    const groqClient = await initializeGroq()

    if (!process.env.GROQ_API_KEY) {
      console.error("[v0] GROQ_API_KEY not found")
      return NextResponse.json({ error: "AI service configuration error" }, { status: 503 })
    }

    const { message, conversationHistory = [] } = await request.json()
    console.log("[v0] Received message:", message)

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Prepare conversation with system context
    const messages = [
      {
        role: "system" as const,
        content: SYSTEM_CONTEXT,
      },
      ...conversationHistory,
      {
        role: "user" as const,
        content: message,
      },
    ]

    console.log("[v0] Calling Groq API...")

    const completion = await Promise.race([
      groqClient.chat.completions.create({
        messages,
        model: "llama-3.1-70b-versatile",
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        stream: false,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 30000)),
    ])

    console.log("[v0] Groq API response received")

    const response =
      completion.choices[0]?.message?.content || "I apologize, but I could not generate a response. Please try again."

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
      } else if (error.message.includes("initialization")) {
        errorMessage = "AI service initialization failed"
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
