"use client"

import { useState, useEffect } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"

interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  position: string
  department: string
  probation_start_date: string
  probation_end_date: string
  probation_duration_months: number
}

interface ProbationReview {
  id: string
  probation_start_date: string
  probation_end_date: string
  review_status: string
  review_board_initiated_at?: string
}

interface ProbationReviewBoardProps {
  employeeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId?: string
  onDecisionSubmitted?: (confirmed: boolean) => void
}

export function ProbationReviewBoard({
  employeeId,
  open,
  onOpenChange,
  companyId,
  onDecisionSubmitted,
}: ProbationReviewBoardProps) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [probationReview, setProbationReview] = useState<ProbationReview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Review decision state
  const [confirmed, setConfirmed] = useState(true)
  const [payDecision, setPayDecision] = useState<"same_pay" | "pay_increase">("same_pay")
  const [newSalary, setNewSalary] = useState("")
  const [notes, setNotes] = useState("")

  // Fetch employee and probation data
  useEffect(() => {
    if (!open || !employeeId) return

    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch employee details
        const empRes = await fetch(
          `/api/recruitment/probation?employee_id=${employeeId}${companyId ? `&company_id=${companyId}` : ""}`,
        )
        if (empRes.ok) {
          const empData = await empRes.json()
          setEmployee(empData.employee)
          setProbationReview(empData.probation_review)
        }
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

    fetchData()
  }, [open, employeeId, companyId])

  const calculateTimeRemaining = () => {
    if (!probationReview?.probation_end_date) return null
    const endDate = new Date(probationReview.probation_end_date)
    const today = new Date()
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysRemaining
  }

  const handleSubmitDecision = async () => {
    if (!employee || !probationReview) return

    try {
      setIsSubmitting(true)

      const res = await fetch("/api/recruitment/confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          probation_review_id: probationReview.id,
          confirmed,
          pay_decision: payDecision,
          new_salary: payDecision === "pay_increase" ? parseFloat(newSalary) : null,
          notes,
          company_id: companyId,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to submit decision")
      }

      const data = await res.json()

      toast({
        title: "Success",
        description: data.message,
      })

      onDecisionSubmitted?.(confirmed)
      onOpenChange(false)
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const daysRemaining = calculateTimeRemaining()
  const isExpired = daysRemaining !== null && daysRemaining < 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Probation Review Board
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !employee || !probationReview ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Unable to load probation details. Please try again.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Employee Information Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Employee Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <div className="font-medium">
                      {employee.first_name} {employee.last_name}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <div className="font-medium">{employee.email}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Position:</span>
                    <div className="font-medium">{employee.position}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Department:</span>
                    <div className="font-medium">{employee.department}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Probation Timeline Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Probation Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {new Date(probationReview.probation_start_date).toDateString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="font-medium">
                      {new Date(probationReview.probation_end_date).toDateString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Days Remaining</p>
                    <div className="flex items-center gap-1">
                      {isExpired ? (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-red-600">Expired</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="font-medium text-orange-600">{daysRemaining} days</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Decision Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Review Decision</CardTitle>
                <CardDescription>Complete the probation review and make a confirmation decision</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Confirmation Decision (Mandatory) */}
                <div className="space-y-3">
                  <Label className="font-medium text-base">
                    Confirm vs Non-Confirm <span className="text-red-600">*</span>
                  </Label>
                  <RadioGroup
                    value={confirmed ? "confirmed" : "not_confirmed"}
                    onValueChange={(val) => setConfirmed(val === "confirmed")}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="confirmed" id="confirmed" />
                      <div className="flex-1">
                        <Label
                          htmlFor="confirmed"
                          className="font-medium cursor-pointer flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          Confirm Probation
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Employee has successfully completed probation and will be confirmed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="not_confirmed" id="not_confirmed" />
                      <div className="flex-1">
                        <Label
                          htmlFor="not_confirmed"
                          className="font-medium cursor-pointer flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4 text-red-600" />
                          Not Confirm
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Termination proceedings will be initiated
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Pay Decision (Only if Confirmed) */}
                {confirmed && (
                  <div className="space-y-3 border-t pt-6">
                    <Label className="font-medium text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Compensation Decision <span className="text-red-600">*</span>
                    </Label>
                    <RadioGroup
                      value={payDecision}
                      onValueChange={(val) => setPayDecision(val as "same_pay" | "pay_increase")}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="same_pay" id="same_pay" />
                        <Label htmlFor="same_pay" className="font-medium cursor-pointer">
                          Same Pay
                        </Label>
                      </div>

                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="pay_increase" id="pay_increase" />
                        <div className="flex-1">
                          <Label htmlFor="pay_increase" className="font-medium cursor-pointer">
                            Pay Increase
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>

                    {/* New Salary Input */}
                    {payDecision === "pay_increase" && (
                      <div className="ml-6 space-y-2">
                        <Label htmlFor="new_salary" className="text-sm">
                          New Monthly Salary <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          id="new_salary"
                          type="number"
                          placeholder="Enter new salary amount"
                          value={newSalary}
                          onChange={(e) => setNewSalary(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2 border-t pt-6">
                  <Label htmlFor="notes">Review Notes & Comments</Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter any additional notes or comments about the review (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-20"
                  />
                </div>

                {/* Info Alert */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Upon submission, the confirmation date will be auto-calculated as {employee.probation_duration_months}{" "}
                    months from the start date. The employee will receive a notification
                    automatically.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitDecision}
                disabled={
                  isSubmitting || (confirmed && payDecision === "pay_increase" && !newSalary)
                }
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Decision
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
