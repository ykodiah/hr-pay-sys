"use client"

import { useState, useCallback, useEffect } from "react"
import { Check, Mail, MessageSquare, Bell, Loader2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

interface StaffMember {
  id: string
  name: string
  department?: string
  position?: string
  email: string
  phone?: string
}

interface InterviewStaffSelectorProps {
  interviewId: string
  candidateName?: string
  jobTitle?: string
  scheduledAt?: string
  companyId?: string
  onStaffTagged?: (staffIds: string[]) => void
}

export function InterviewStaffSelector({
  interviewId,
  candidateName,
  jobTitle,
  scheduledAt,
  companyId,
  onStaffTagged,
}: InterviewStaffSelectorProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [interviewSummary, setInterviewSummary] = useState("")
  const [notificationType, setNotificationType] = useState<"email" | "sms" | "notification" | "all">(
    "all",
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  // Fetch staff list
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setIsLoading(true)
        const params = new URLSearchParams()
        if (companyId) params.append("company_id", companyId)

        const res = await fetch(`/api/recruitment/interviews/staff-tagging?${params}`)
        if (!res.ok) throw new Error("Failed to fetch staff")

        const data = await res.json()
        setStaff(data.staff || [])
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

    fetchStaff()
  }, [companyId])

  const filteredStaff = staff.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleToggleStaff = useCallback((staffId: string) => {
    setSelectedStaff((prev) => {
      const updated = new Set(prev)
      if (updated.has(staffId)) {
        updated.delete(staffId)
      } else {
        updated.add(staffId)
      }
      return updated
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedStaff.size === filteredStaff.length) {
      setSelectedStaff(new Set())
    } else {
      setSelectedStaff(new Set(filteredStaff.map((s) => s.id)))
    }
  }, [filteredStaff, selectedStaff.size])

  const handleSendNotifications = async () => {
    if (selectedStaff.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one staff member",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSending(true)
      const res = await fetch("/api/recruitment/interviews/staff-tagging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_id: interviewId,
          staff_ids: Array.from(selectedStaff),
          interview_summary: interviewSummary,
          notification_type: notificationType,
          company_id: companyId,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to tag staff")
      }

      const data = await res.json()
      toast({
        title: "Success",
        description: data.message,
      })

      onStaffTagged?.(Array.from(selectedStaff))
      setSelectedStaff(new Set())
      setInterviewSummary("")
      setShowDialog(false)
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tag Staff Members for Interview</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Interview Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Interview Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {candidateName && (
                  <div>
                    <span className="font-medium">Candidate:</span> {candidateName}
                  </div>
                )}
                {jobTitle && (
                  <div>
                    <span className="font-medium">Position:</span> {jobTitle}
                  </div>
                )}
                {scheduledAt && (
                  <div>
                    <span className="font-medium">Scheduled:</span>{" "}
                    {new Date(scheduledAt).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interview Summary */}
            <div className="space-y-2">
              <Label htmlFor="summary">Applicant Summary (Brief Profile)</Label>
              <Textarea
                id="summary"
                placeholder="Enter a brief summary about the applicant for interviewers (e.g., background, key strengths, interview focus areas)"
                value={interviewSummary}
                onChange={(e) => setInterviewSummary(e.target.value)}
                className="min-h-24"
              />
              <p className="text-xs text-muted-foreground">
                This summary will be included in all interview notifications
              </p>
            </div>

            {/* Notification Type */}
            <div className="space-y-3">
              <Label>Notification Channels</Label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: "email", label: "Email", icon: Mail },
                    { value: "sms", label: "SMS", icon: MessageSquare },
                    { value: "notification", label: "In-App", icon: Bell },
                    { value: "all", label: "All", icon: Users },
                  ] as const
                ).map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={notificationType === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNotificationType(value)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Staff Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Interviewers ({selectedStaff.size})</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedStaff.size === filteredStaff.length ? "Deselect All" : "Select All"}
                </Button>
              </div>

              {/* Search */}
              <Input
                placeholder="Search staff by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-3"
              />

              {/* Staff List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No staff members found
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                  {filteredStaff.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg cursor-pointer"
                      onClick={() => handleToggleStaff(s.id)}
                    >
                      <Checkbox
                        checked={selectedStaff.has(s.id)}
                        onCheckedChange={() => handleToggleStaff(s.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {s.position} {s.department && `• ${s.department}`}
                        </div>
                      </div>
                      {selectedStaff.has(s.id) && <Check className="w-4 h-4 text-green-600" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendNotifications}
                disabled={selectedStaff.size === 0 || isSending}
              >
                {isSending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Tag & Send Notifications ({selectedStaff.size})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trigger Button */}
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
      >
        <Users className="w-4 h-4 mr-2" />
        Tag Staff Members
      </Button>
    </>
  )
}
