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

const KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: "platform-overview",
    title: "AkwaabaHRPay overview",
    summary: "Modules, AI copilots, compliance, analytics",
    keywords: ["overview", "software", "what is", "platform", "everything"],
    response:
      "AkwaabaHRPay is an end-to-end HR, payroll, and compliance suite tuned for Ghana. It manages employee records, attendance (biometric + geo), leave, performance, promotions, learning, disciplinary cases, payroll with PAYE/SSNIT/Tier 3, analytics dashboards, document storage, communications, and integrations. AI assistants support both administrators and employees across modules.",
  },
  {
    id: "attendance-module",
    title: "Attendance & overtime AI",
    summary: "Risk scoring, geo capture, device sync",
    keywords: ["attendance", "overtime", "geo", "clock", "missed"],
    response:
      "Attendance now includes predictive risk scoring, overtime forecasting, geo-fence capture, missed-check-in escalations, and biometric device orchestration. HR can configure alerts, pause/activate devices, sync fingerprint/face/card readers, and export filtered reports by location, department, division, subsidiary, and capture method.",
  },
  {
    id: "employee-portal",
    title: "Employee portal upgrades",
    summary: "AI highlights, wellbeing, growth cockpit",
    keywords: ["employee", "portal", "self-service", "my portal", "employee hub"],
    response:
      "Employees see personalised AI highlights (leave balance, payslip availability, attendance streaks), adaptive nudges, wellbeing recommendations, a growth cockpit, and quick actions for leave, courses, feedback, and details updates. The employee assistant answers questions about leave, payslips, goals, learning, loans, and benefits.",
  },
  {
    id: "admin-assistant",
    title: "Admin AI assistant",
    summary: "Strategic prompts, analytics, playbooks",
    keywords: ["assistant", "chatbot", "control room", "ai"],
    response:
      "The admin AI assistant synthesises data across attendance, payroll, recruitment, performance, learning, compliance, and integrations. Use strategic prompts like attendance digest, payroll variance, or attrition watch. It surfaces control-room insights, drafts summaries, and recommends follow-up actions and playbooks.",
  },
  {
    id: "integrations",
    title: "Integrations",
    summary: "Biometrics, Supabase, GRA, reporting hooks",
    keywords: ["integration", "biometric", "supabase", "gra", "api"],
    response:
      "Integrations include biometric devices (REST, SDK, CSV), Supabase storage and auth, GRA submissions, payroll exports, and webhook-ready reporting. Device health, sync, and onboarding are managed within the Attendance and Integrations modules.",
  },
]

export function AIChatbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isTTSEnabled, setIsTTSEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your HR & Payroll assistant. I understand the full AkwaabaHRPay platform—attendance AI, payroll, analytics, compliance, integrations, and the employee portal. Ask me for an overview, run a strategic prompt, or request templates and summaries.",
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
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.8

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
      messagesContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      })
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
      content: `${article.response}\n\nNeed more detail? Ask about ${article.summary.toLowerCase()}.`,
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
      const knowledgeHit = KNOWLEDGE_BASE.find((article) =>
        article.keywords.some((keyword) => userMessage.content.toLowerCase().includes(keyword)),
      )

      if (knowledgeHit) {
        injectKnowledgeResponse(knowledgeHit)
        return
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.slice(-10).map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
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
          errorMessage = "AI service is temporarily unavailable."
        } else if (error.message.includes("authentication")) {
          errorMessage = "AI service authentication error."
        }
      }

      toast.error(errorMessage)

      const errorAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment, or contact your system administrator if the problem persists.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorAssistantMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
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
          "Hello! I'm your HR & Payroll assistant. I understand the full AkwaabaHRPay platform—attendance AI, payroll, analytics, compliance, integrations, and the employee portal. Ask me for an overview, run a strategic prompt, or request templates and summaries.",
        timestamp: new Date(),
      },
    ])
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-blue-600 shadow-lg hover:bg-blue-700"
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 rounded-t-lg bg-blue-600 pb-2 text-white">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Bot className="h-5 w-5" /> HR Assistant
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTTS}
            className={`h-8 w-8 text-white hover:bg-blue-700 ${isTTSEnabled ? "bg-blue-700" : ""}`}
            title={isTTSEnabled ? "Disable voice" : "Enable voice"}
          >
            {isTTSEnabled ? (isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />) : <VolumeX className="h-4 w-4 opacity-50" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 text-white hover:bg-blue-700"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-white hover:bg-blue-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="flex h-[calc(600px-80px)] flex-col p-0">
          <div className="flex items-center justify-between border-b bg-gray-50 p-3">
            {isTTSEnabled ? (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <Volume2 className="h-3 w-3" /> {isSpeaking ? "Speaking..." : "Voice enabled"}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Voice disabled</div>
            )}
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs text-gray-500 hover:text-gray-700">
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
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                      message.role === "user" ? "bg-blue-600 text-white" : "bg-white text-gray-900"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className={`text-xs opacity-70 ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
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
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0.1s" }}></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0.2s" }}></div>
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
                placeholder="Ask about HR, payroll, attendance, analytics..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={!inputMessage.trim() || isLoading} size="icon" className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
