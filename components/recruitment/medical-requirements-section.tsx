"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle2, Clock, FileUp, Loader2, Upload, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

interface MedicalRequirementsProps {
  offerId: string
  candidateName?: string
  candidateEmail?: string
  onMedicalRequired?: (required: boolean, beforeOfferLetter: boolean) => void
  companyId?: string
}

export function MedicalRequirementsSection({
  offerId,
  candidateName = "",
  candidateEmail = "",
  onMedicalRequired,
  companyId,
}: MedicalRequirementsProps) {
  const [medicalRequired, setMedicalRequired] = useState(false)
  const [beforeOfferLetter, setBeforeOfferLetter] = useState(false)
  const [medicalStatus, setMedicalStatus] = useState<string>("pending")
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false)

  // Fetch medical requirements status
  const fetchMedicalStatus = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.append("offer_id", offerId)

      const res = await fetch(`/api/recruitment/offers/medical-requirements?${params}`)
      if (!res.ok) throw new Error("Failed to fetch medical requirements")

      const data = await res.json()
      const req = data.medical_requirements

      setMedicalRequired(req.required ?? false)
      setBeforeOfferLetter(req.required_before_offer_letter ?? false)
      setMedicalStatus(req.status ?? "pending")
      setSubmissions(data.submissions || [])
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

  useEffect(() => {
    fetchMedicalStatus()
  }, [offerId])

  const handleSaveMedicalRequirements = async () => {
    try {
      setIsSaving(true)
      const res = await fetch("/api/recruitment/offers/medical-requirements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: offerId,
          medical_required: medicalRequired,
          medical_required_before_offer_letter: beforeOfferLetter,
          company_id: companyId,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to save medical requirements")
      }

      const data = await res.json()
      toast({
        title: "Success",
        description: data.message,
      })

      onMedicalRequired?.(medicalRequired, beforeOfferLetter)
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusBadge = () => {
    switch (medicalStatus) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        )
      case "submitted":
        return (
          <Badge className="gap-1 bg-blue-600">
            <FileUp className="w-3 h-3" />
            Submitted
          </Badge>
        )
      case "verified":
        return (
          <Badge className="gap-1 bg-green-600">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="gap-1 bg-red-600">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        )
      case "not_required":
        return (
          <Badge variant="secondary" className="gap-1">
            Not Required
          </Badge>
        )
      default:
        return <Badge variant="outline">{medicalStatus}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Medical Requirements
            <Loader2 className="w-4 h-4 animate-spin" />
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Medical Requirements</CardTitle>
              <CardDescription>
                Configure if medical examination is needed for this offer
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Medical Required Checkbox */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="medical-required"
              checked={medicalRequired}
              onCheckedChange={(checked) => {
                setMedicalRequired(checked === true)
                if (!checked) setBeforeOfferLetter(false)
              }}
            />
            <div className="flex-1">
              <Label htmlFor="medical-required" className="font-medium cursor-pointer">
                Medical examination required
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Check this if the candidate needs to undergo medical screening
              </p>
            </div>
          </div>

          {/* Timing Options */}
          {medicalRequired && (
            <div className="pl-6 space-y-4 border-l-2 border-muted py-2">
              <Label className="font-medium">When should medical be completed?</Label>
              <RadioGroup value={beforeOfferLetter ? "before" : "after"}>
                <div className="flex items-start gap-3">
                  <RadioGroupItem
                    value="before"
                    id="before-offer"
                    onClick={() => setBeforeOfferLetter(true)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="before-offer" className="font-medium cursor-pointer">
                      Before Offer Letter
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Candidate must submit medical before offer letter can be generated. Offer
                      letter generation will be blocked until medical is received.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <RadioGroupItem
                    value="after"
                    id="after-offer"
                    onClick={() => setBeforeOfferLetter(false)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="after-offer" className="font-medium cursor-pointer">
                      After Offer Letter
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Offer letter can be sent immediately. Medical submission will be required
                      during the onboarding process.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Info Box */}
          {medicalRequired && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                {beforeOfferLetter
                  ? "An applicant communication will be sent requesting medical submission with an upload form or link."
                  : "The medical form will be added to the onboarding checklist for completion during onboarding."}
              </div>
            </div>
          )}

          {/* Medical Submissions */}
          {submissions.length > 0 && (
            <div className="space-y-3">
              <Label className="font-medium">Medical Submissions ({submissions.length})</Label>
              <div className="space-y-2">
                {submissions.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="border rounded-lg p-3 flex items-start justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        {sub.applicant_name}
                        {sub.status === "approved" && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                        {sub.status === "rejected" && (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Submitted: {new Date(sub.submitted_at).toLocaleString()}
                      </div>
                      {sub.verification_notes && (
                        <div className="text-xs mt-1 text-muted-foreground italic">
                          {sub.verification_notes}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={
                        sub.status === "approved"
                          ? "default"
                          : sub.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {sub.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSubmissionDialog(true)}
              disabled={!medicalRequired || medicalStatus === "not_required"}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Applicant Upload Form
            </Button>
            <Button onClick={handleSaveMedicalRequirements} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Medical Requirements
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Medical Submission Dialog */}
      <MedicalSubmissionDialog
        open={showSubmissionDialog}
        onOpenChange={setShowSubmissionDialog}
        offerId={offerId}
        candidateName={candidateName}
        candidateEmail={candidateEmail}
        companyId={companyId}
        onSubmitted={() => {
          fetchMedicalStatus()
          setShowSubmissionDialog(false)
        }}
      />
    </>
  )
}

function MedicalSubmissionDialog({
  open,
  onOpenChange,
  offerId,
  candidateName,
  candidateEmail,
  companyId,
  onSubmitted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  offerId: string
  candidateName: string
  candidateEmail: string
  companyId?: string
  onSubmitted: () => void
}) {
  const [applicantName, setApplicantName] = useState(candidateName)
  const [applicantEmail, setApplicantEmail] = useState(candidateEmail)
  const [fileUrl, setFileUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!applicantName || !applicantEmail || !fileUrl) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const res = await fetch("/api/recruitment/offers/medical-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: offerId,
          applicant_name: applicantName,
          applicant_email: applicantEmail,
          medical_file_path: fileUrl,
          company_id: companyId,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to submit medical")
      }

      toast({
        title: "Success",
        description: "Medical documents submitted successfully",
      })

      onSubmitted()
      setApplicantName("")
      setApplicantEmail("")
      setFileUrl("")
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Medical Documents</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Applicant Name</Label>
            <Input
              id="name"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              placeholder="Full name"
            />
          </div>

          <div>
            <Label htmlFor="email">Applicant Email</Label>
            <Input
              id="email"
              type="email"
              value={applicantEmail}
              onChange={(e) => setApplicantEmail(e.target.value)}
              placeholder="Email address"
            />
          </div>

          <div>
            <Label htmlFor="file">Medical Document Link/Path</Label>
            <Input
              id="file"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="e.g., /path/to/medical-report.pdf"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the path or URL to the uploaded medical document
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Medical
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
