"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Bot,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Maximize2,
  MessageCircle,
  Minimize2,
  Send,
  Sparkles,
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

interface EmployeePrompt {
  id: string
  label: string
  helper: string
  message: string
}

interface KnowledgeArticle {
  id: string
  title: string
  summary: string
  keywords: string[]
  response: string
}

interface WellbeingNudge {
  id: string
  title: string
  detail: string
  action: string
  sentiment: "positive" | "neutral" | "attention"
  confidence: number
}

const EMPLOYEE_PROMPTS: EmployeePrompt[] = [
  {
    id: "check-leave",
    label: "Leave balance",
    helper: "See current days remaining",
    message: "How many leave days do I have left and what is the fastest way to request more time off?",
  },
  {
    id: "download-payslip",
    label: "Latest payslip",
    helper: "Download instructions",
    message: "Where can I download my latest payslip and what deductions should I double check?",
  },
  {
    id: "performance-goals",
    label: "Performance goals",
    helper: "Track goals & reviews",
    message: "Show my current performance goals, progress, and the next review milestone I should prepare for.",
  },
  {
    id: "skills-growth",
    label: "Learning plan",
    helper: "Courses + mentors",
    message: "Recommend learning courses or mentors aligned with my growth track and project needs.",
  },
  {
    id: "loan-status",
    label: "Loan status",
    helper: "Outstanding requests",
    message: "Give me an update on my salary advance/loan request, including approvals and expected payout date.",
  },
]

const EMPLOYEE_KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: "self-service-overview",
    title: "What can I do here?",
    summary: "Portal modules & quick wins",
    keywords: ["overview", "portal", "self-service", "what can", "everything"],
    response:
      "Your portal is the personalised side of AkwaabaHRPay. You can request leave, download payslips, track attendance streaks, review performance goals, access learning plans, submit reimbursements, update personal details, and chat with HR support. Each widget on the dashboard mirrors a live module, so any action here reflects in the core system instantly.",
  },
  {
    id: "leave-workflows",
    title: "Leave & time off",
    summary: "Balances, approvals, escalations",
    keywords: ["leave", "time off", "vacation", "sick", "holidays"],
    response:
      "You can request annual, sick, study, parental, or compassionate leave directly from the Leave card. Balances update after every approval. Once you submit, the workflow notifies your manager, HR, and any delegates. Auto-escalation kicks in if approvals stagnate. You can also attach supporting documents and see the audit trail on the Leave history tab.",
  },
  {
    id: "payslip-guidance",
    title: "Payslips & payroll",
    summary: "Download, taxes, discrepancies",
    keywords: ["payslip", "salary", "payroll", "tax", "deduction"],
    response:
      "Payslips are published after payroll finalisation. Download them from the Payslip tile or the Quick actions drawer. Each payslip explains gross pay, PAYE, SSNIT, Tier 2/3, loans, and allowances. If numbers look off, ask the assistant to flag discrepancies—it can draft a ticket for payroll with the right attachments.",
  },
  {
    id: "learning-growth",
    title: "Growth & learning",
    summary: "Courses, mentors, nudges",
    keywords: ["learning", "training", "growth", "courses", "career"],
    response:
      "The Growth cockpit shows mandatory and elective learning mapped to your role family. You can enrol in courses, request mentors, and mark milestones as complete. AI nudges highlight skills gaps, recommend micro-learning, and connect you to peers who recently completed similar paths.",
  },
  {
    id: "benefits-support",
    title: "Benefits & support",
    summary: "Loans, medical, wellness",
    keywords: ["benefits", "loan", "medical", "wellness", "support"],
    response:
      "Benefits live in the Support hub: medical enrolments, wellness sessions, salary advances, and reimbursements. The assistant can surface policy documents, status of approvals, and point you to the right HR contact if human intervention is required.",
  },
]

const WELLBEING_NUDGES: WellbeingNudge[] = [
  {
    id: "hydration",
    title: "Hydration reminder",
    detail: "You've been active in back-to-back meetings today. Take a 5-minute recharge and hydrate.",
    action: "Log a break",
    sentiment: "attention",
    confidence: 0.78,
  },
  {
    id: "learning",
    title: "Growth opportunity",
    detail: "A new AI compliance course aligns with your current project. Completing it boosts your competency score by +12%.",
    action: "Preview course",
    sentiment: "positive",
    confidence: 0.84,
  },
  {
    id: "attendance",
    title: "Attendance streak",
    detail: "You're on a 14-day punctuality streak. Keep it going to unlock recognition badges in the portal.",
    action: "View streak",
    sentiment: "positive",
    confidence: 0.9,
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
  const [recentPromptId, setRecentPromptId] = useState<string | null>(null)
  const [knowledgeMatches, setKnowledgeMatches] = useState<KnowledgeArticle[]>(EMPLOYEE_KNOWLEDGE_BASE)
  const [nudges, setNudges] = useState<WellbeingNudge[]>(WELLBEING_NUDGES)

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

  useEffect(() => {
    const query = inputMessage.toLowerCase().trim()
    if (!query) {
      setKnowledgeMatches(EMPLOYEE_KNOWLEDGE_BASE)
      return
    }
    setKnowledgeMatches(
      EMPLOYEE_KNOWLEDGE_BASE.filter((article) =>
        article.keywords.some((keyword) => keyword.includes(query) || query.includes(keyword)),
      ),
    )
  }, [inputMessage])

  const injectKnowledgeResponse = (article: KnowledgeArticle) => {
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `${article.response}\n\nWant more? Ask me about ${article.summary.toLowerCase()}.`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])
    setRecentPromptId(article.id)
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
            currentModule: typeof window !== "undefined" ? window.location.pathname.split("/").pop() || "dashboard" : "dashboard",
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

  const handlePromptSelect = (prompt: EmployeePrompt) => {
    setInputMessage(prompt.message)
    setRecentPromptId(prompt.id)
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
    setRecentPromptId(null)
    setKnowledgeMatches(EMPLOYEE_KNOWLEDGE_BASE)
    setNudges(WELLBEING_NUDGES)
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
          <div className="flex flex-col gap-3 border-b bg-white px-4 pb-2 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs">
                <Sparkles className="h-3 w-3" /> Quick answers
              </Badge>
              <span className="text-xs text-muted-foreground">Ask something or tap below to auto-fill a question.</span>
            </div>
            <div className="flex max-h-16 flex-wrap gap-2 overflow-y-auto pr-1">
              {knowledgeMatches.slice(0, 4).map((article) => (
                <Button
                  key={article.id}
                  variant={recentPromptId === article.id ? "default" : "outline"}
                  size="sm"
                  className={`h-7 text-xs ${recentPromptId === article.id ? "bg-emerald-600" : "bg-white"}`}
                  onClick={() => {
                    setInputMessage(article.title)
                    injectKnowledgeResponse(article)
                  }}
                >
                  {article.title}
                </Button>
              ))}
              {knowledgeMatches.length === 0 && (
                <span className="text-[11px] text-muted-foreground">No quick matches—try a prompt below or rephrase.</span>
              )}
            </div>
          </div>

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

          <div ref={messagesContainerRef} className="relative flex-1 overflow-y-auto px-4 py-3 pr-3">
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

          <div className="flex-shrink-0 border-t bg-white p-4">
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

            <div className="mt-3 flex flex-wrap gap-2">
              {EMPLOYEE_PROMPTS.map((prompt) => (
                <Button
                  key={prompt.id}
                  variant={recentPromptId === prompt.id ? "default" : "outline"}
                  size="sm"
                  className={`h-7 text-xs ${recentPromptId === prompt.id ? "bg-emerald-600" : "bg-white"}`}
                  onClick={() => handlePromptSelect(prompt)}
                  title={prompt.helper}
                >
                  {prompt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t bg-emerald-50/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <HeartPulse className="h-4 w-4" /> Personal wellbeing & nudges
            </div>
            <div className="mt-3 max-h-32 space-y-3 overflow-y-auto pr-1">
              {nudges.map((nudge) => (
                <div key={nudge.id} className="rounded-lg border border-emerald-100 bg-white p-3 text-xs shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-emerald-900">{nudge.title}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {(nudge.confidence * 100).toFixed(0)}% signal
                    </Badge>
                  </div>
                  <p className="mt-2 text-emerald-800">{nudge.detail}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-700">
                    <span className="capitalize">Sentiment: {nudge.sentiment}</span>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs text-emerald-700">
                      {nudge.action}
                    </Button>
                  </div>
                </div>
              ))}
              {nudges.length === 0 && <p className="text-[11px] text-emerald-700/70">No live nudges right now.</p>}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
