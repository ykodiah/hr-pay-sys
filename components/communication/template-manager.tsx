"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Loader2, Plus, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"

type TemplateChannel = "email" | "sms" | "whatsapp" | "push" | "teams" | "slack" | "webhook"

interface TemplateSummary {
  id: string
  template_key: string
  name: string
  description?: string | null
  channel_type: TemplateChannel
  category?: string | null
  tags?: string[] | null
  status?: string | null
  version_number?: number | null
  is_active?: boolean
  updated_at?: string | null
  created_at?: string | null
}

interface TemplateVersion {
  id: string
  template_id: string
  version_number: number
  status: "draft" | "published" | "archived"
  subject?: string | null
  content_text?: string | null
  content_html?: string | null
  variables?: Array<Record<string, unknown>> | null
  created_at?: string | null
  updated_at?: string | null
  published_at?: string | null
}

interface TemplateDetailResponse {
  template: TemplateSummary
  versions: TemplateVersion[]
}

interface TemplateWarnings {
  missingDefinitions: string[]
  unusedDefinitions: string[]
}

const channelLabels: Record<TemplateChannel, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
  push: "Push",
  teams: "Microsoft Teams",
  slack: "Slack",
  webhook: "Webhook",
}

const defaultTemplateForm = {
  name: "",
  templateKey: "",
  channelType: "email" as TemplateChannel,
  subject: "",
  text: "",
  html: "",
  description: "",
}

export function TemplateManager() {
  const { toast } = useToast()

  const [templates, setTemplates] = useState<TemplateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState(defaultTemplateForm)
  const [submitting, setSubmitting] = useState(false)

  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<TemplateDetailResponse | null>(null)
  const [detailWarnings, setDetailWarnings] = useState<TemplateWarnings | null>(null)

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/communication/templates")
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load templates")
      }
      setTemplates(Array.isArray(payload?.data) ? payload.data : [])
    } catch (err: any) {
      console.error("[TemplateManager] load templates", err)
      setError(err?.message || "Failed to load templates")
      toast({
        title: "Unable to load templates",
        description: err?.message || "Check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const resetCreateForm = () => setCreateForm(defaultTemplateForm)

  const handleCreateTemplate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!createForm.name.trim() || !createForm.templateKey.trim()) {
      toast({
        title: "Name and key required",
        description: "Provide a display name and a unique template key before saving.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/communication/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          templateKey: createForm.templateKey.trim(),
          channelType: createForm.channelType,
          description: createForm.description?.trim() || undefined,
          subject: createForm.subject || undefined,
          text: createForm.text || undefined,
          html: createForm.html || undefined,
          status: "published",
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to create template")
      }

      toast({
        title: "Template created",
        description: `${createForm.name} is ready for automations.`,
      })

      setCreateDialogOpen(false)
      resetCreateForm()
      await loadTemplates()
    } catch (error: any) {
      console.error("[TemplateManager] create template", error)
      toast({
        title: "Unable to create template",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openTemplateDetail = async (templateId: string) => {
    setViewDialogOpen(true)
    setViewLoading(true)
    setDetailWarnings(null)
    setSelectedDetail(null)

    try {
      const response = await fetch(`/api/communication/templates/${templateId}`)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load template details")
      }

      setSelectedDetail(payload?.data as TemplateDetailResponse)
      setDetailWarnings(payload?.warnings ?? null)
    } catch (error: any) {
      console.error("[TemplateManager] load detail", error)
      toast({
        title: "Unable to load template",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      })
      setViewDialogOpen(false)
    } finally {
      setViewLoading(false)
    }
  }

  const templatesByChannel = useMemo(() => {
    return templates.reduce<Record<TemplateChannel, TemplateSummary[]>>((acc, template) => {
      const channel = template.channel_type
      if (!acc[channel]) acc[channel] = []
      acc[channel].push(template)
      return acc
    }, { email: [], sms: [], whatsapp: [], push: [], teams: [], slack: [], webhook: [] })
  }, [templates])

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-xl">Template library</CardTitle>
          <CardDescription>
            Publish reusable omni-channel messages for automation events and manual broadcasts.
          </CardDescription>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New template
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading templates...
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            No templates yet. Create your first template to personalize automation events.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(templatesByChannel).map(([channel, items]) => {
              if (!items || items.length === 0) return null
              return (
                <div key={channel} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold capitalize">{channelLabels[channel as TemplateChannel]}</h3>
                    <Badge variant="outline">{items.length} templates</Badge>
                  </div>
                  <div className="space-y-3">
                    {items.map((template) => (
                      <div
                        key={template.id}
                        className="rounded-lg border border-slate-200 bg-card/80 p-4 shadow-sm hover:border-primary/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-foreground">{template.name}</h4>
                              {template.status && (
                                <Badge className="capitalize" variant={template.status === "published" ? "secondary" : "outline"}>
                                  {template.status}
                                </Badge>
                              )}
                              {template.is_active === false && <Badge variant="destructive">Inactive</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">Key: {template.template_key}</p>
                            {template.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 pt-1">
                              {(template.tags ?? []).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px] uppercase">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => openTemplateDetail(template.id)}>
                            <Eye className="h-4 w-4" /> View
                          </Button>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {template.version_number ? <span>v{template.version_number}</span> : null}
                          {template.updated_at && (
                            <span>
                              Updated {formatDistanceToNow(new Date(template.updated_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={createDialogOpen} onOpenChange={(open) => !submitting && setCreateDialogOpen(open)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create template</DialogTitle>
            <DialogDescription>
              Publish ready-to-send content for automation events. You can manage versions from the template detail
              panel later.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTemplate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display name</label>
                <Input
                  value={createForm.name}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Payslip release"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Template key</label>
                <Input
                  value={createForm.templateKey}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, templateKey: event.target.value.toUpperCase() }))
                  }
                  placeholder="PAYROLL.COMPLETED"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Channel</label>
                <select
                  value={createForm.channelType}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, channelType: event.target.value as TemplateChannel }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(channelLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optional)</label>
                <Input
                  value={createForm.description}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Short summary for admins"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject / title</label>
              <Input
                value={createForm.subject}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, subject: event.target.value }))}
                placeholder="Payslip for {{payroll.period_name}} ready"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Plain text body</label>
                <Textarea
                  rows={6}
                  value={createForm.text}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, text: event.target.value }))}
                  placeholder="Hi {{employee.first_name}}..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">HTML body (optional)</label>
                <Textarea
                  rows={6}
                  value={createForm.html}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, html: event.target.value }))}
                  placeholder="<p>Hi {{employee.first_name}}</p>"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={(open) => setViewDialogOpen(open)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Template details</DialogTitle>
            <DialogDescription>
              Review published content and available versions. Use the API or automations to deliver this template.
            </DialogDescription>
          </DialogHeader>
          {viewLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading template...
            </div>
          ) : selectedDetail ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline" className="uppercase tracking-wide text-[10px]">
                    {selectedDetail.template.template_key}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {channelLabels[selectedDetail.template.channel_type]}
                  </Badge>
                  {selectedDetail.template.status && (
                    <Badge variant={selectedDetail.template.status === "published" ? "default" : "outline"}>
                      {selectedDetail.template.status}
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{selectedDetail.template.name}</h3>
                {selectedDetail.template.description && (
                  <p className="text-sm text-muted-foreground">{selectedDetail.template.description}</p>
                )}
              </div>

              {detailWarnings && (detailWarnings.missingDefinitions.length > 0 || detailWarnings.unusedDefinitions.length > 0) && (
                <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <p className="font-medium">Template variable warnings</p>
                  {detailWarnings.missingDefinitions.length > 0 && (
                    <p>
                      Missing definitions: <span className="font-semibold">{detailWarnings.missingDefinitions.join(", ")}</span>
                    </p>
                  )}
                  {detailWarnings.unusedDefinitions.length > 0 && (
                    <p>
                      Unused definitions: <span className="font-semibold">{detailWarnings.unusedDefinitions.join(", ")}</span>
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-md border">
                <ScrollArea className="max-h-[300px]">
                  <div className="divide-y">
                    {selectedDetail.versions.map((version) => (
                      <div key={version.id} className="space-y-3 p-4 text-sm">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-medium">Version {version.version_number}</span>
                          <Badge variant={version.status === "published" ? "default" : version.status === "draft" ? "outline" : "secondary"}>
                            {version.status}
                          </Badge>
                          {version.published_at && (
                            <span className="text-xs text-muted-foreground">
                              Published {formatDistanceToNow(new Date(version.published_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        {version.subject && (
                          <div>
                            <p className="text-xs uppercase text-muted-foreground">Subject / title</p>
                            <p>{version.subject}</p>
                          </div>
                        )}
                        {version.content_text && (
                          <div className="space-y-1">
                            <p className="text-xs uppercase text-muted-foreground">Text body</p>
                            <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                              {version.content_text}
                            </pre>
                          </div>
                        )}
                        {version.content_html && (
                          <div className="space-y-1">
                            <p className="text-xs uppercase text-muted-foreground">HTML</p>
                            <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                              {version.content_html}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Template metadata unavailable.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

