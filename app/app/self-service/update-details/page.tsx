"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"

import { AuthGuard } from "@/components/auth-guard"
import { RoleGuard } from "@/components/role-guard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { submitChangeRequest } from "@/lib/api/change-requests-service"
import { ChangeFieldDiff } from "@/lib/change-requests-store"

import { CheckCircle, FileText, ShieldCheck, Upload, UserCog } from "lucide-react"

const currentProfile = {
  identity: {
    legalName: "Ama Osei",
    preferredName: "Ama O.",
    dateOfBirth: "1993-06-14",
    address: "12 Ring Road East, Accra",
    ghanaCard: "GHA-233-002-456-789-0",
  },
  contact: {
    corporateEmail: "ama.osei@akwaaba.com",
    personalEmail: "ama.osei@gmail.com",
    phone: "+233 20 444 5566",
  },
  bank: {
    bankName: "GCB Bank",
    branch: "Liberia Road",
    accountNumber: "233001234567",
  },
  kyc: {
    tin: "P0001234567",
    ssnit: "SSA00987654",
  },
  family: {
    dependants: "1",
    emergencyContactName: "Nana Osei",
    emergencyContactPhone: "+233 50 777 4422",
    relationship: "Sibling",
  },
}

type FieldConfig = {
  section: string
  path: (keyof typeof currentProfile | string)[]
  label: string
  pii?: boolean
}

const fieldCatalog: FieldConfig[] = [
  { section: "identity", path: ["identity", "legalName"], label: "Legal name" },
  { section: "identity", path: ["identity", "preferredName"], label: "Preferred name" },
  { section: "identity", path: ["identity", "address"], label: "Residential address" },
  { section: "identity", path: ["identity", "ghanaCard"], label: "Ghana Card", pii: true },
  { section: "contact", path: ["contact", "corporateEmail"], label: "Corporate email" },
  { section: "contact", path: ["contact", "personalEmail"], label: "Personal email" },
  { section: "contact", path: ["contact", "phone"], label: "Mobile number", pii: true },
  { section: "bank", path: ["bank", "bankName"], label: "Bank name" },
  { section: "bank", path: ["bank", "branch"], label: "Branch" },
  { section: "bank", path: ["bank", "accountNumber"], label: "Account number", pii: true },
  { section: "kyc", path: ["kyc", "tin"], label: "Tax identification", pii: true },
  { section: "kyc", path: ["kyc", "ssnit"], label: "SSNIT", pii: true },
  { section: "family", path: ["family", "dependants"], label: "Dependants" },
  { section: "family", path: ["family", "emergencyContactName"], label: "Emergency contact name" },
  { section: "family", path: ["family", "emergencyContactPhone"], label: "Emergency contact phone", pii: true },
  { section: "family", path: ["family", "relationship"], label: "Relationship" },
]

type ProfileDraft = typeof currentProfile

export default function SelfServiceUpdateDetailsPage() {
  const [activeTab, setActiveTab] = useState("identity")
  const [draft, setDraft] = useState<ProfileDraft>(structuredClone(currentProfile))
  const [reason, setReason] = useState("")
  const [attachments, setAttachments] = useState<string[]>([])
  const [attachmentInput, setAttachmentInput] = useState("")
  const pushToast = toast

  const diffs: ChangeFieldDiff[] = useMemo(() => {
    return fieldCatalog
      .map((field) => {
        const previousValue = getValue(currentProfile, field.path)
        const newValue = getValue(draft, field.path)
        if ((previousValue ?? "") === (newValue ?? "")) {
          return null
        }
        return {
          path: field.path.join("."),
          label: field.label,
          previousValue: previousValue ?? null,
          newValue: newValue ?? null,
          pii: field.pii,
        }
      })
      .filter(Boolean) as ChangeFieldDiff[]
  }, [draft])

  const sectionsTouched = Array.from(new Set(diffs.map((diff) => diff.path.split(".")[0])))

  const handleFieldChange = (path: string[], value: string) => {
    setDraft((previous) => {
      const clone = structuredClone(previous)
      setValue(clone, path, value)
      return clone
    })
  }

  const handleSubmit = async () => {
    if (diffs.length === 0) {
      pushToast({
        variant: "destructive",
        title: "No changes detected",
        description: "Update at least one field before submitting a change request.",
      })
      return
    }

    const requestId = `CR-${Date.now()}`

    try {
      await submitChangeRequest({
        id: requestId,
        employeeId: "EMP002",
        employeeName: "Ama Osei",
        submittedAt: new Date().toISOString(),
        status: "pending",
        reason: reason || "Self-service record update",
        sections: sectionsTouched,
        diffs,
        attachments: attachments.map((name, index) => ({ id: `${requestId}-att-${index}`, name, type: "Supporting document" })),
      })

      pushToast({
        title: "Change request submitted",
        description: "HR will verify your updates and notify you once processed.",
      })

      setReason("")
      setAttachments([])
      setAttachmentInput("")
      setDraft(structuredClone(currentProfile))
    } catch (error) {
      console.error("Failed to submit change request", error)
      pushToast({
        variant: "destructive",
        title: "Submission failed",
        description: "We could not submit your update right now. Please try again later.",
      })
    }
  }

  const handleAddAttachment = () => {
    const trimmed = attachmentInput.trim()
    if (!trimmed) return
    setAttachments((previous) => [...previous, trimmed])
    setAttachmentInput("")
  }

  return (
    <AuthGuard>
      <RoleGuard requiredRoles={["employee", "hr-admin"]}>
        <div className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Update my details</h1>
            <p className="text-sm text-muted-foreground">
              Submit secure change requests for HR to review. Sensitive changes (e.g. bank details) require supporting documents.
            </p>
          </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
        </TabsList>

        <TabsContent value="identity">
          <SectionCard
            title="Identity information"
            description="Update official names and residential address."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Legal name"
                value={draft.identity.legalName}
                onChange={(value) => handleFieldChange(["identity", "legalName"], value)}
              />
              <Field
                label="Preferred name"
                value={draft.identity.preferredName}
                onChange={(value) => handleFieldChange(["identity", "preferredName"], value)}
              />
              <Field
                label="Residential address"
                value={draft.identity.address}
                onChange={(value) => handleFieldChange(["identity", "address"], value)}
                className="md:col-span-2"
              />
              <Field
                label="Ghana Card"
                value={draft.identity.ghanaCard}
                onChange={(value) => handleFieldChange(["identity", "ghanaCard"], value)}
              />
              <Field label="Date of birth" value={format(new Date(draft.identity.dateOfBirth), "dd MMM yyyy")} disabled />
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="contact">
          <SectionCard title="Contact" description="Keep your contact channels current so HR can reach you when necessary.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Corporate email" value={draft.contact.corporateEmail} disabled helper="Managed by IT" />
              <Field
                label="Personal email"
                value={draft.contact.personalEmail}
                onChange={(value) => handleFieldChange(["contact", "personalEmail"], value)}
              />
              <Field
                label="Mobile number"
                value={draft.contact.phone}
                onChange={(value) => handleFieldChange(["contact", "phone"], value)}
              />
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="bank">
          <SectionCard
            title="Bank details"
            description="Changes trigger a temporary payroll hold until HR verifies your documents."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <Field
                label="Bank name"
                value={draft.bank.bankName}
                onChange={(value) => handleFieldChange(["bank", "bankName"], value)}
              />
              <Field
                label="Branch"
                value={draft.bank.branch}
                onChange={(value) => handleFieldChange(["bank", "branch"], value)}
              />
              <Field
                label="Account number"
                value={draft.bank.accountNumber}
                onChange={(value) => handleFieldChange(["bank", "accountNumber"], value)}
              />
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="kyc">
          <SectionCard
            title="KYC & statutory IDs"
            description="Provide updated statutory numbers as issued by the authorities."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Tax identification (TIN)"
                value={draft.kyc.tin}
                onChange={(value) => handleFieldChange(["kyc", "tin"], value)}
              />
              <Field
                label="SSNIT"
                value={draft.kyc.ssnit}
                onChange={(value) => handleFieldChange(["kyc", "ssnit"], value)}
              />
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="family">
          <SectionCard
            title="Family & beneficiaries"
            description="Update dependants and emergency contacts to ensure benefits coverage."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Number of dependants"
                value={draft.family.dependants}
                onChange={(value) => handleFieldChange(["family", "dependants"], value)}
              />
              <Field
                label="Emergency contact name"
                value={draft.family.emergencyContactName}
                onChange={(value) => handleFieldChange(["family", "emergencyContactName"], value)}
              />
              <Field
                label="Emergency contact phone"
                value={draft.family.emergencyContactPhone}
                onChange={(value) => handleFieldChange(["family", "emergencyContactPhone"], value)}
              />
              <Field
                label="Relationship"
                value={draft.family.relationship}
                onChange={(value) => handleFieldChange(["family", "relationship"], value)}
              />
            </div>
          </SectionCard>
        </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Supporting documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <Input
                    placeholder="Upload reference (e.g. bank_letter.pdf)"
                    value={attachmentInput}
                    onChange={(event) => setAttachmentInput(event.target.value)}
                    className="md:w-80"
                  />
                  <Button type="button" variant="outline" className="gap-2" onClick={handleAddAttachment}>
                    <Upload className="h-4 w-4" /> Add attachment
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Accepted: bank letters, Ghana Card scans, statutory forms.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {attachments.length === 0 && <span className="text-muted-foreground">No documents added yet.</span>}
                  {attachments.map((file) => (
                    <Badge key={file} variant="outline">
                      <FileText className="mr-1 h-3 w-3" /> {file}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Request review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for update</Label>
                  <Textarea
                    id="reason"
                    placeholder="Provide context – e.g. moved house, new bank account, married, etc."
                    rows={3}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {diffs.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      No differences detected yet – edit your details using the tabs above.
                    </div>
                  ) : (
                    diffs.map((diff) => (
                      <div key={diff.path} className="rounded-lg border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{diff.label}</span>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {diff.path.split(".")[0]}
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">Current</p>
                        <p className="text-sm font-medium text-muted-foreground">
                          {maskIfNeeded(diff.previousValue, diff.pii)}
                        </p>
                        <Separator className="my-2" />
                        <p className="text-xs text-muted-foreground">New</p>
                        <p className="text-sm font-semibold text-emerald-600">
                          {maskIfNeeded(diff.newValue, diff.pii)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                  <ShieldCheck className="mr-2 inline h-3 w-3" /> Submissions are encrypted. HR verifies identity-sensitive updates before payroll is
                  released.
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                <CheckCircle className="mr-1 inline h-3 w-3 text-emerald-600" /> {diffs.length} field(s) changed • {attachments.length} attachment(s)
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setDraft(structuredClone(currentProfile))}>
                  Reset
                </Button>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit}>
                  <UserCog className="h-4 w-4" /> Submit change request
                </Button>
              </div>
            </div>
          </div>
      </RoleGuard>
    </AuthGuard>
  )
}

function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

function Field({
  label,
  value,
  onChange,
  disabled,
  helper,
  className,
}: {
  label: string
  value: string
  onChange?: (value: string) => void
  disabled?: boolean
  helper?: string
  className?: string
}) {
  return (
    <div className={className}>
      <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
      <Input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
      />
      {helper && <p className="text-[10px] text-muted-foreground">{helper}</p>}
    </div>
  )
}

function getValue(object: any, path: string[]) {
  return path.reduce((accumulator, key) => (accumulator ? accumulator[key] : undefined), object)
}

function setValue(object: any, path: string[], value: string) {
  let pointer = object
  path.forEach((key, index) => {
    if (index === path.length - 1) {
      pointer[key] = value
    } else {
      pointer = pointer[key]
    }
  })
}

function maskIfNeeded(value: string | null, pii?: boolean) {
  if (!value) return "—"
  if (!pii) return value
  if (value.length <= 4) return "••••"
  return `${"•".repeat(value.length - 4)}${value.slice(-4)}`
}
