"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Clock, Loader2, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"

interface QueueItem {
  id: string
  application_id: string
  candidate_name: string
  candidate_email: string
  job_title: string
  department: string
  status: string
  current_stage: string
  stage_entered_at: string
  completed_stages: any[]
  queue_position: number
}

interface OnboardingQueueProps {
  companyId?: string
  selectedChecklistId?: string
  onSelectChecklist?: (checklistId: string) => void
  onClose?: () => void
}

export function OnboardingQueue({
  companyId,
  selectedChecklistId,
  onSelectChecklist,
  onClose,
}: OnboardingQueueProps) {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Fetch onboarding queue
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setIsLoading(true)
        const params = new URLSearchParams()
        if (companyId) params.append("company_id", companyId)

        const res = await fetch(`/api/recruitment/onboarding/queue?${params}`)
        if (!res.ok) throw new Error("Failed to fetch queue")

        const data = await res.json()
        setQueue(data.queue || [])
      } catch (err) {
        toast({
          title: "Error",
          description: (err as Error).message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchQueue()
  }, [companyId])

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h3 className="font-semibold text-base">Onboarding Queue</h3>
          <p className="text-xs text-muted-foreground">{queue.length} applicant(s)</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Queue List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : queue.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-center">
            <div className="text-muted-foreground">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No applicants in onboarding</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {queue.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => onSelectChecklist?.(item.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedChecklistId === item.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:bg-accent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Expand Arrow */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpanded(item.id)
                      }}
                      className="mt-1"
                    >
                      {expandedItems.has(item.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium truncate text-sm">
                          {item.candidate_name}
                        </div>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(item.status)}`}>
                          {item.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-1">
                        {item.job_title}
                        {item.department && ` • ${item.department}`}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Current: {item.current_stage}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedItems.has(item.id) && (
                  <div className="ml-4 mt-2 p-3 bg-muted/50 rounded-lg text-xs space-y-2">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="break-all">{item.candidate_email}</p>
                    </div>

                    {item.completed_stages && item.completed_stages.length > 0 && (
                      <div>
                        <span className="text-muted-foreground block mb-1">
                          Completed Stages ({item.completed_stages.length}):
                        </span>
                        <div className="space-y-1">
                          {item.completed_stages.map((stage: any, idx: number) => (
                            <div
                              key={idx}
                              className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs"
                            >
                              ✓ {stage.stage}
                              {stage.signed_off_at && (
                                <span className="text-green-600 text-xs ml-1">
                                  ({new Date(stage.signed_off_at).toLocaleDateString()})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-muted-foreground">Queue Position:</span>
                      <p>#{item.queue_position || "—"}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  )
}
