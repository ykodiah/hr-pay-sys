import { type NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

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
    const { message, conversationHistory = [] } = await request.json()

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

    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.1-70b-versatile",
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      stream: false,
    })

    const response =
      completion.choices[0]?.message?.content || "I apologize, but I could not generate a response. Please try again."

    return NextResponse.json({
      response,
      conversationId: Date.now().toString(),
    })
  } catch (error) {
    console.error("Chat API Error:", error)
    return NextResponse.json({ error: "Failed to process chat request" }, { status: 500 })
  }
}
