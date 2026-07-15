import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

let groq: any = null

// Employee-specific system context
const EMPLOYEE_SYSTEM_CONTEXT = `You are a personal HR assistant for employees in the "Akwaaba HR & Payroll" system. You help employees with their personal HR needs and questions.

**Employee Self-Service Modules:**
- Dashboard (overview, quick actions)
- Profile Management (personal information, emergency contacts)
- Payslips (view, download monthly payslips)
- Leave Requests (apply, check balance, view history)
- Loan Applications (apply for loans, check status)
- Performance Goals (view goals, track progress)
- Learning & Development (courses, certifications)
- Grievances (submit complaints, track resolution)

**What you can help with:**
- How to request leave and check leave balance
- Understanding payslip details and deductions
- Applying for loans and checking loan status
- Setting and tracking performance goals
- Finding and enrolling in training courses
- Updating personal information and emergency contacts
- Submitting grievances and tracking their status
- General HR policies and procedures

**Important Guidelines:**
- Always provide step-by-step instructions
- Reference specific sections in the employee portal
- Be supportive and professional
- If you don't know something, direct them to contact HR
- Focus only on employee self-service features
- Do not provide information about admin/management functions

**Current Employee Context:**
- Employee ID: {employeeId}
- Name: {employeeName}
- Department: {department}
- Position: {position}
- Leave Balance: {leaveBalance} days
- Current Module: {currentModule}`

async function initializeGroq() {
  if (!groq) {
    try {
      const { default: Groq } = await import("groq-sdk")
      groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      })
      console.log("[v0] Employee Groq SDK initialized successfully")
    } catch (error) {
      console.error("[v0] Failed to initialize Employee Groq SDK:", error)
      throw new Error("AI service initialization failed")
    }
  }
  return groq
}

async function logInteraction(employeeId: string, question: string, response: string, helpful = true) {
  try {
    const supabase = await createClient()

    await supabase.from("ai_chat_logs").insert({
      employee_id: employeeId,
      question: question,
      response: response,
      helpful: helpful,
      module_context: "employee_portal",
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Failed to log interaction:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Employee Chat API called")

    const groqClient = await initializeGroq()

    if (!process.env.GROQ_API_KEY) {
      console.error("[v0] GROQ_API_KEY not found")
      return NextResponse.json({ error: "AI service configuration error" }, { status: 503 })
    }

    const { message, conversationHistory = [], employeeContext } = await request.json()
    console.log("[v0] Received employee message:", message)

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Personalize system context with employee information
    const personalizedContext = EMPLOYEE_SYSTEM_CONTEXT.replace(
      "{employeeId}",
      employeeContext?.employeeId || "Unknown",
    )
      .replace("{employeeName}", employeeContext?.name || "Employee")
      .replace("{department}", employeeContext?.department || "Unknown")
      .replace("{position}", employeeContext?.position || "Unknown")
      .replace("{leaveBalance}", employeeContext?.leaveBalance?.toString() || "0")
      .replace("{currentModule}", employeeContext?.currentModule || "dashboard")

    // Prepare conversation with personalized context
    const messages = [
      {
        role: "system" as const,
        content: personalizedContext,
      },
      ...conversationHistory,
      {
        role: "user" as const,
        content: message,
      },
    ]

    console.log("[v0] Calling Groq API for employee...")

    const completion = await Promise.race([
      groqClient.chat.completions.create({
        messages,
        model: "llama-3.1-70b-versatile",
        temperature: 0.7,
        max_tokens: 800,
        top_p: 1,
        stream: false,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 30000)),
    ])

    console.log("[v0] Employee Groq API response received")

    const response =
      completion.choices[0]?.message?.content || "I apologize, but I could not generate a response. Please try again."

    // Log interaction for learning
    await logInteraction(employeeContext?.employeeId || "unknown", message, response, true)

    return NextResponse.json({
      response,
      conversationId: Date.now().toString(),
    })
  } catch (error) {
    console.error("[v0] Employee Chat API Error:", error)

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
