"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Maximize2,
  MessageCircle,
  Minimize2,
  Send,
  User,
  Volume2,
  VolumeX,
  X,
} from "lucide-react"
import { toast } from "sonner"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface KnowledgeArticle {
  id: string
  title: string
  summary: string
  keywords: string[]
  response: string
}

const EMPLOYEE_KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: "self-service-overview",
    title: "What can I do here?",
    summary: "Portal modules & quick wins",
    keywords: ["overview", "portal", "self-service", "what can", "everything"],
    response:
      "Your portal is the personalised side of AkwaabaHRPay. You can request leave, download payslips, track attendance streaks, review performance goals, access learning plans, submit reimbursements, update personal details, and chat with HR support. Each widget mirrors a live module so every action syncs back instantly.",
  },
  {
    id: "leave-workflows",
    title: "Leave & time off",
    summary: "Balances, approvals, escalations",
    keywords: ["leave", "time off", "vacation", "sick", "holidays"],
    response:
      "Request annual, sick, parental, study, or compassionate leave directly from the Leave tile. Balances update in real time once approvals land. The workflow notifies your manager and HR, supports attachments, and escalates automatically if responses lag.",
  },
  {
    id: "payslip-guidance",
    title: "Payslips & payroll",
    summary: "Download, taxes, discrepancies",
    keywords: ["payslip", "salary", "payroll", "tax", "deduction"],
    response:
      "Payslips publish after payroll closes. Download them from the Payslip tile or Quick actions drawer. Each slip explains gross pay, PAYE, SSNIT, Tier 2/3, loans, and allowances. If something looks off, ask me to draft a ticket for payroll with the right context.",
  },
  {
    id: "learning-growth",
    title: "Growth & learning",
    summary: "Courses, mentors, nudges",
    keywords: ["learning", "training", "growth", "courses", "career"],
    response:
      "The Growth cockpit shows required and elective learning mapped to your role. Enrol in courses, request mentors, tick milestones, and get AI nudges that highlight skill gaps, micro-learning, and peers who recently completed the same journey.",
  },
  {
    id: "benefits-support",
    title: "Benefits & support",
    summary: "Loans, medical, wellness",
    keywords: ["benefits", "loan", "medical", "wellness", "support"],
    response:
      "The Support hub covers medical enrolments, wellness sessions, salary advances, reimbursements, and policy documents. I can surface status updates, next steps, or point you to the right HR contact when human intervention is needed.",
  },
  {
    id: "attendance-checkins",
    title: "Attendance & check-ins",
    summary: "Geo clocking, biometrics, streaks",
    keywords: ["attendance", "clock in", "check in", "geo", "biometric"],
    response:
      "You can clock in from mobile or web with geo verification if HR enables it. If you use a biometric device, the sync runs every few minutes and updates your portal history. I can remind you of your current streak, missed check-ins, and how to submit corrections if you forgot to clock.",
  },
  {
    id: "performance-feedback",
    title: "Performance & feedback",
    summary: "Goals, 1:1s, reviews",
    keywords: ["performance", "feedback", "review", "goal", "check-in"],
    response:
      "Track goals, quarterly reviews, and 1:1 notes from the Performance tile. You can request feedback, log achievements, and preview upcoming review cycles. Ask me for preparation tips or to draft a self-evaluation outline based on your recent progress.",
  },
  {
    id: "personal-data-updates",
    title: "Update my details",
    summary: "Personal info, documents",
    keywords: ["update", "details", "address", "documents", "profile"],
    response:
      "Head to Update My Details to change your address, emergency contacts, dependent info, or upload IDs. Requests route to HR for approval with a full audit trail. I can help list the documents you need or draft a change request message.",
  },
  {
    id: "expenses-reimbursements",
    title: "Expenses & reimbursements",
    summary: "Claims, receipts, approvals",
    keywords: ["expense", "reimbursement", "claim", "allowance", "receipt"],
    response:
      "Submit travel, meal, or allowance claims from the Expenses quick action. Attach receipts, pick the cost centre, and check approval status from the history tab. I can outline the policy limits, help you prepare a summary for finance, or flag overdue approvals.",
  },
]

export function EmployeeAIChatbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isTTSEnabled, setIsTTSEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm your personal HR assistant. I can walk you through leave, payslips, performance goals, learning paths, loans, benefits, and wellbeing programs. What would you like help with first?",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollButtons, setShowScrollButtons] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const speakText = (text: string) => {
    if (!isTTSEnabled || !("speechSynthesis" in window)) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.volume = 0.85

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  const toggleTTS = () => {
    if (isTTSEnabled && isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
    setIsTTSEnabled(!isTTSEnabled)
  }

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  const scrollToTop = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  useEffect(() => {
    setShowScrollButtons(messages.length > 6)
  }, [messages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const injectKnowledgeResponse = (article: KnowledgeArticle) => {
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `${article.response}\n\nWant more? Ask me about ${article.summary.toLowerCase()}.`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])
    setIsLoading(false)
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const knowledgeHit = EMPLOYEE_KNOWLEDGE_BASE.find((article) =>
        article.keywords.some((keyword) => userMessage.content.toLowerCase().includes(keyword)),
      )

      if (knowledgeHit) {
        injectKnowledgeResponse(knowledgeHit)
        return
      }

      const response = await fetch("/api/employee-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.slice(-10).map((msg) => ({ role: msg.role, content: msg.content })),
          employeeContext: {
            employeeId: "EMP-001",
            name: "Kwame Asante",
            department: "Technology",
            position: "Senior Software Engineer",
            leaveBalance: 18,
            currentModule:
              typeof window !== "undefined" ? window.location.pathname.split("/").pop() || "dashboard" : "dashboard",
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      if (!data.response) {
        throw new Error("Invalid response format")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (isTTSEnabled) {
        speakText(data.response)
      }
    } catch (error) {
      let errorMessage = "Failed to send message. Please try again."
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again."
        } else if (error.message.includes("503")) {
          errorMessage = "Assistant service is temporarily unavailable."
        }
      }

      toast.error(errorMessage)

      const errorAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm having trouble connecting at the moment. Please try again shortly or reach out to HR if it's urgent.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorAssistantMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    stopSpeaking()
    setMessages([
      {
        id: "1",
        role: "assistant",
        content:
          "Hi! I'm your personal HR assistant. I can walk you through leave, payslips, performance goals, learning paths, loans, benefits, and wellbeing programs. What would you like help with first?",
        timestamp: new Date(),
      },
    ])
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-emerald-600 shadow-lg hover:bg-emerald-700"
        size="icon"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    )
  }

  return (
    <Card
      className={`fixed bottom-6 right-6 z-50 shadow-2xl transition-all duration-300 ${
        isMinimized ? "h-16 w-80" : "h-[600px] w-96"
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 rounded-t-lg bg-emerald-600 pb-2 text-white">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Bot className="h-5 w-5" /> Personal HR Assistant
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTTS}
            className={`h-8 w-8 text-white hover:bg-emerald-700 ${isTTSEnabled ? "bg-emerald-700" : ""}`}
            title={isTTSEnabled ? "Disable voice" : "Enable voice"}
          >
            {isTTSEnabled ? (isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />) : <VolumeX className="h-4 w-4 opacity-50" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 text-white hover:bg-emerald-700"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-white hover:bg-emerald-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="flex h-[calc(600px-80px)] flex-col p-0">
          <div className="flex items-center justify-between border-b bg-emerald-50 p-3">
            {isTTSEnabled ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700">
                <Volume2 className="h-3 w-3" /> {isSpeaking ? "Speaking..." : "Voice enabled"}
              </div>
            ) : (
              <div className="text-xs text-emerald-800/60">Voice disabled</div>
            )}
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs text-emerald-700 hover:text-emerald-900">
              Clear chat
            </Button>
          </div>

          <div
            ref={messagesContainerRef}
            className="relative flex-1 overflow-y-auto px-4 py-3 pr-3"
          >
            {showScrollButtons && (
              <div className="pointer-events-none absolute right-2 top-2 z-10 flex flex-col gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollToTop}
                  className="pointer-events-auto h-8 w-8 bg-white/90 shadow-sm hover:bg-white"
                  title="Scroll to top"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollToBottom}
                  className="pointer-events-auto h-8 w-8 bg-white/90 shadow-sm hover:bg-white"
                  title="Scroll to bottom"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="space-y-4 pb-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Bot className="h-4 w-4 text-emerald-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                      message.role === "user" ? "bg-emerald-600 text-white" : "bg-white text-slate-900"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className={`text-xs opacity-70 ${message.role === "user" ? "text-emerald-100" : "text-slate-500"}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {message.role === "assistant" && isTTSEnabled && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => speakText(message.content)}
                          className="h-6 w-6 opacity-60 hover:opacity-100"
                          title="Speak this message"
                        >
                          <Volume2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <User className="h-4 w-4 text-slate-600" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <Bot className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-500"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: "0.1s" }}></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t bg-white p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(event) => setInputMessage(event.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about leave, payslips, goals, wellbeing..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={!inputMessage.trim() || isLoading} size="icon" className="bg-emerald-600 hover:bg-emerald-700">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
