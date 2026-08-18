"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { Building2, CreditCard, Loader2, Save, Send, ShieldAlert, User, X, Network } from "lucide-react"
import {
  usePortalMe,
  usePortalResource,
  portalMutate,
  formatDate,
  formatMoney,
} from "@/lib/self-service/use-portal"
import {
  PageHeader,
  StatusBadge,
  LoadingBlock,
  ErrorBlock,
} from "@/components/self-service/portal-ui"

type SelfForm = {
  phone: string
  personal_email: string
  address: string
  emergency_contact_name: string
  emergency_contact_tel: string
}

const EMPTY_FORM: SelfForm = {
  phone: "",
  personal_email: "",
  address: "",
  emergency_contact_name: "",
  emergency_contact_tel: "",
}

const REQUEST_FIELDS = [
  { key: "first_name", label: "First name", type: "text" },
  { key: "other_names", label: "Other names", type: "text" },
  { key: "last_name", label: "Last name", type: "text" },
  { key: "date_of_birth", label: "Date of birth", type: "date" },
  { key: "marital_status", label: "Marital status", type: "text" },
  { key: "ghana_card_number", label: "Ghana Card number", type: "text" },
  { key: "educational_level", label: "Highest education", type: "text" },
] as const

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-sm text-slate-900">{value || "—"}</span>
    </div>
  )
}

export default function ProfilePage() {
  const { data: me, error, isLoading, mutate } = usePortalMe()
  const { data: requestData, mutate: refreshRequests } = usePortalResource<any>(
    me ? "/api/self-service/profile-requests" : null,
  )

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<SelfForm>(EMPTY_FORM)

  const [requestOpen, setRequestOpen] = useState(false)
  const [requestForm, setRequestForm] = useState<Record<string, string>>({})
  const [requestNote, setRequestNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const employee = me?.employee
  const financial = me?.financial

  useEffect(() => {
    if (!employee) return
    setForm({
      phone: employee.phone || "",
      personal_email: employee.personal_email || "",
      address: employee.address || "",
      emergency_contact_name: employee.emergency_contact_name || "",
      emergency_contact_tel: employee.emergency_contact_tel || "",
    })
    setRequestForm({
      first_name: employee.first_name || "",
      other_names: employee.other_names || "",
      last_name: employee.last_name || "",
      date_of_birth: employee.date_of_birth || "",
      marital_status: employee.marital_status || "",
      ghana_card_number: employee.ghana_card_number || "",
      educational_level: employee.educational_level || "",
    })
  }, [employee])

  if (error) return <ErrorBlock error={error} />
  if (isLoading || !me || !employee) return <LoadingBlock rows={4} />

  const pendingRequest = (requestData?.requests || []).find((r: any) => r.status === "pending")

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await portalMutate<{ message: string }>("/api/self-service/me", "PATCH", form)
      toast({ title: "Profile updated", description: result.message })
      setEditing(false)
      mutate()
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Could not save your details",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRequest = async () => {
    setSubmitting(true)
    try {
      await portalMutate("/api/self-service/profile-requests", "POST", {
        changes: requestForm,
        note: requestNote,
      })
      toast({
        title: "Request submitted",
        description: "HR will review your requested changes.",
      })
      setRequestOpen(false)
      setRequestNote("")
      refreshRequests()
      mutate()
    } catch (err) {
      toast({
        title: "Could not submit",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const withdrawRequest = async (id: string) => {
    try {
      await portalMutate("/api/self-service/profile-requests", "PATCH", { id })
      toast({ title: "Request withdrawn" })
      refreshRequests()
    } catch (err) {
      toast({
        title: "Could not withdraw",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="My profile"
        description="Contact details you can change yourself. Everything else needs HR approval so the payroll audit trail stays intact."
        action={
          <Button variant="outline" onClick={() => setRequestOpen(true)} disabled={!!pendingRequest}>
            <Send className="mr-2 h-4 w-4" />
            {pendingRequest ? "Request pending" : "Request a change"}
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-5 p-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={employee.profile_picture || undefined} alt="" />
            <AvatarFallback className="text-lg">
              {(employee.first_name?.[0] || "") + (employee.last_name?.[0] || "")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-slate-900">{employee.full_name}</h2>
            <p className="text-sm text-slate-600">
              {employee.position || "Employee"}
              {employee.department ? ` · ${employee.department}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={employee.status} />
              <span className="text-xs text-slate-500">Staff ID {employee.employee_id || "—"}</span>
              <span className="text-xs text-slate-500">
                Joined {formatDate(employee.date_of_joining)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {pendingRequest && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-amber-900">
              <ShieldAlert className="h-4 w-4" />
              Change request awaiting HR review
            </CardTitle>
            <CardDescription className="text-amber-800">
              Submitted {formatDate(pendingRequest.created_at)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ul className="flex flex-col gap-1 text-sm text-amber-900">
              {Object.entries(pendingRequest.changes || {}).map(([key, change]: [string, any]) => (
                <li key={key}>
                  <span className="font-medium">{change.label}:</span> {change.from || "—"} →{" "}
                  {change.to || "—"}
                </li>
              ))}
            </ul>
            <div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => withdrawRequest(pendingRequest.id)}
              >
                <X className="mr-2 h-4 w-4" />
                Withdraw request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-emerald-600" />
              Contact details
            </CardTitle>
            <CardDescription>You can update these directly.</CardDescription>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save changes
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {editing ? (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="personal_email">Personal email</Label>
                <Input
                  id="personal_email"
                  type="email"
                  value={form.personal_email}
                  onChange={(e) => setForm({ ...form, personal_email: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="address">Residential address</Label>
                <Textarea
                  id="address"
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ec_name">Emergency contact name</Label>
                <Input
                  id="ec_name"
                  value={form.emergency_contact_name}
                  onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ec_tel">Emergency contact phone</Label>
                <Input
                  id="ec_tel"
                  value={form.emergency_contact_tel}
                  onChange={(e) => setForm({ ...form, emergency_contact_tel: e.target.value })}
                />
              </div>
            </>
          ) : (
            <>
              <Field label="Phone" value={employee.phone} />
              <Field label="Personal email" value={employee.personal_email} />
              <Field label="Corporate email" value={employee.corporate_email} />
              <Field label="Residential address" value={employee.address} />
              <Field label="Emergency contact" value={employee.emergency_contact_name} />
              <Field label="Emergency phone" value={employee.emergency_contact_tel} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-emerald-600" />
            Employment
          </CardTitle>
          <CardDescription>Managed by HR. Use "Request a change" to correct anything.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field label="Staff ID" value={employee.employee_id} />
          <Field label="Position" value={employee.position} />
          <Field label="Department" value={employee.department} />
          <Field label="Division" value={employee.division} />
          <Field label="Location" value={employee.location} />
          <Field label="Contract type" value={employee.contract_type} />
          <Field label="Date of joining" value={formatDate(employee.date_of_joining)} />
          <Field label="Date of birth" value={formatDate(employee.date_of_birth)} />
          <Field label="Ghana Card" value={employee.ghana_card_number} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Network className="h-4 w-4 text-emerald-600" />
            Reporting and approval lines
          </CardTitle>
          <CardDescription>
            Your line of authority and the people who review requests submitted through the portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(me.authority_lines || []).length ? (
            <ol className="grid gap-3 sm:grid-cols-2">
              {me.authority_lines.map((line: any) => {
                const person = line.approver || {}
                const name =
                  person.full_name ||
                  `${person.first_name || ""} ${person.last_name || ""}`.trim() ||
                  "Position currently vacant"
                return (
                  <li key={`${line.authority_type}-${line.sequence_no}`} className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Step {line.sequence_no} · {String(line.authority_type || "approver").replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 font-medium text-slate-900">{name}</p>
                    <p className="text-sm text-slate-500">
                      {[person.position, person.department].filter(Boolean).join(" · ") || "Authority assignment"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Approves: {(line.approval_scope || []).join(", ") || "assigned requests"}
                    </p>
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="text-sm text-slate-500">
              No supervisor or head of department has been assigned. Ask HR to update your employment record.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            Payroll and banking
          </CardTitle>
          <CardDescription>Contact HR or payroll to change bank details.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field
            label="Monthly salary"
            value={financial?.monthly_salary != null ? formatMoney(financial.monthly_salary) : null}
          />
          <Field label="Bank" value={financial?.bank_name} />
          <Field label="Branch" value={financial?.bank_branch} />
          <Field
            label="Account number"
            value={
              financial?.bank_account_number
                ? `••••${String(financial.bank_account_number).slice(-4)}`
                : null
            }
          />
          <Field label="SSNIT number" value={financial?.ssnit_number} />
          <Field
            label="Provident fund"
            value={financial?.provident_fund_enrolled ? "Enrolled" : "Not enrolled"}
          />
        </CardContent>
      </Card>

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Request a profile change</DialogTitle>
            <DialogDescription>
              Edit the values you want corrected. HR reviews every request before it takes effect.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {REQUEST_FIELDS.map((field) => (
              <div key={field.key} className="flex flex-col gap-2">
                <Label htmlFor={`req-${field.key}`}>{field.label}</Label>
                <Input
                  id={`req-${field.key}`}
                  type={field.type}
                  value={requestForm[field.key] || ""}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, [field.key]: e.target.value })
                  }
                />
              </div>
            ))}
            <Separator />
            <div className="flex flex-col gap-2">
              <Label htmlFor="req-note">Note to HR</Label>
              <Textarea
                id="req-note"
                rows={3}
                placeholder="Explain why this change is needed and attach documents to HR if required."
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleRequest} disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
