"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Paperclip, Upload } from "lucide-react"
import {
  getOnboardingTaskArtifactConfig,
  type TaskArtifactConfig,
} from "@/lib/recruitment/task-artifacts"

type TaskLike = {
  id: string
  title: string
  stage?: string | null
  description?: string | null
  status?: string | null
  response_data?: Record<string, string> | null
  attachment_url?: string | null
  attachment_name?: string | null
  vault_document_id?: string | null
  document_type?: string | null
}

type Props = {
  task: TaskLike
  companyId?: string | null
  offerSignatures?: {
    candidate?: string | null
    hr?: string | null
    vaultId?: string | null
  } | null
  disabled?: boolean
  onSaved: () => void | Promise<void>
  onError: (message: string) => void
}

export function OnboardingTaskArtifactPanel({
  task,
  companyId,
  offerSignatures,
  disabled,
  onSaved,
  onError,
}: Props) {
  const config: TaskArtifactConfig = useMemo(() => getOnboardingTaskArtifactConfig(task), [task])
  const done = task.status === "completed" || task.status === "skipped"
  const [fields, setFields] = useState<Record<string, string>>(() => ({
    ...(task.response_data || {}),
  }))
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const hasInputs =
    config.fields.length > 0 || config.requiresUpload || config.linkedOfferSignature

  if (!hasInputs) return null

  if (config.linkedOfferSignature) {
    const candidateOk = Boolean(offerSignatures?.candidate)
    const hrOk = Boolean(offerSignatures?.hr)
    const both = candidateOk && hrOk
    return (
      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-sm space-y-2">
        <p className="font-medium text-slate-800">Offer letter signatures</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant={candidateOk ? "default" : "outline"} className={candidateOk ? "bg-emerald-600" : ""}>
            Candidate {candidateOk ? `· ${offerSignatures?.candidate}` : "· pending"}
          </Badge>
          <Badge variant={hrOk ? "default" : "outline"} className={hrOk ? "bg-emerald-600" : ""}>
            HR Head {hrOk ? `· ${offerSignatures?.hr}` : "· pending"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {both
            ? "Both parties signed — a copy is filed in Document Vault and linked here."
            : "Candidate signs on the offer portal; HR Head signs in the Offers editor. When both sign, this task completes automatically."}
        </p>
        {task.attachment_name || offerSignatures?.vaultId ? (
          <p className="text-xs text-emerald-800 flex items-center gap-1">
            <Paperclip className="h-3.5 w-3.5" />
            {task.attachment_name || "Signed offer letter on file"}
          </p>
        ) : null}
      </div>
    )
  }

  if (done && !task.attachment_name && !(task.response_data && Object.keys(task.response_data).length)) {
    return null
  }

  const submit = async (complete: boolean) => {
    setSaving(true)
    try {
      const form = new FormData()
      form.set("task_id", task.id)
      if (companyId) form.set("company_id", companyId)
      form.set("fields", JSON.stringify(fields))
      form.set("complete", complete ? "true" : "false")
      if (file) form.set("file", file)
      const res = await fetch("/api/recruitment/onboarding/artifact", {
        method: "POST",
        credentials: "include",
        body: form,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Could not save task details")
      setFile(null)
      await onSaved()
    } catch (err) {
      onError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50/40 p-3 space-y-3">
      {config.fields.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {config.fields.map((field) => (
            <div
              key={field.key}
              className={`space-y-1 ${field.type === "textarea" ? "sm:col-span-2" : ""}`}
            >
              <Label className="text-xs">
                {field.label}
                {field.required ? " *" : ""}
              </Label>
              {field.type === "textarea" ? (
                <Textarea
                  rows={2}
                  disabled={disabled || done || saving}
                  placeholder={field.placeholder}
                  value={fields[field.key] || ""}
                  onChange={(e) => setFields({ ...fields, [field.key]: e.target.value })}
                />
              ) : (
                <Input
                  type={field.type}
                  disabled={disabled || done || saving}
                  placeholder={field.placeholder}
                  value={fields[field.key] || ""}
                  onChange={(e) => setFields({ ...fields, [field.key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
      ) : null}

      {config.requiresUpload ? (
        <div className="space-y-1.5">
          <Label className="text-xs">{config.uploadLabel || "Upload document"} *</Label>
          <Input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,image/*,application/pdf"
            disabled={disabled || done || saving}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {task.attachment_name ? (
            <p className="text-xs text-emerald-800 flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5" /> On file: {task.attachment_name}
            </p>
          ) : null}
          {file ? <p className="text-xs text-slate-600">Selected: {file.name}</p> : null}
        </div>
      ) : null}

      {!done ? (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || saving}
            onClick={() => void submit(false)}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Save draft
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={disabled || saving}
            onClick={() => void submit(true)}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Save &amp; complete
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Details saved · copy filed to Document Vault</p>
      )}
    </div>
  )
}
