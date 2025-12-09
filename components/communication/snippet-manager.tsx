"use client"

import { useCallback, useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Loader2, Plus, Trash, Eye } from "lucide-react"

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

interface SnippetRecord {
  id: string
  snippet_key: string
  name: string
  description?: string | null
  category?: string | null
  language?: string | null
  content_text?: string | null
  content_html?: string | null
  variables?: Array<Record<string, unknown>> | null
  metadata?: Record<string, unknown> | null
  is_active?: boolean
  created_at?: string | null
  updated_at?: string | null
}

const defaultSnippetForm = {
  name: "",
  snippetKey: "",
  category: "",
  language: "en",
  text: "",
  html: "",
  description: "",
}

export function SnippetManager() {
  const { toast } = useToast()

  const [snippets, setSnippets] = useState<SnippetRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(defaultSnippetForm)
  const [submitting, setSubmitting] = useState(false)

  const [viewOpen, setViewOpen] = useState(false)
  const [selectedSnippet, setSelectedSnippet] = useState<SnippetRecord | null>(null)

  const loadSnippets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/communication/snippets")
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load snippets")
      }
      setSnippets(Array.isArray(payload?.data) ? payload.data : [])
    } catch (err: any) {
      console.error("[SnippetManager] loadSnippets", err)
      setError(err?.message || "Unable to load snippets")
      toast({
        title: "Unable to load snippets",
        description: err?.message || "Check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSnippets()
  }, [loadSnippets])

  const resetForm = () => setCreateForm(defaultSnippetForm)

  const handleCreateSnippet = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!createForm.name.trim() || !createForm.snippetKey.trim()) {
      toast({
        title: "Name and key required",
        description: "Provide a display name and unique key before saving a snippet.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/communication/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          snippetKey: createForm.snippetKey.trim(),
          category: createForm.category || undefined,
          language: createForm.language || "en",
          description: createForm.description?.trim() || undefined,
          text: createForm.text || undefined,
          html: createForm.html || undefined,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to create snippet")
      }

      toast({ title: "Snippet saved", description: `${createForm.name} is ready to reuse.` })
      setCreateOpen(false)
      resetForm()
      await loadSnippets()
    } catch (error: any) {
      console.error("[SnippetManager] create snippet", error)
      toast({
        title: "Unable to create snippet",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSnippet = async (snippet: SnippetRecord) => {
    const confirmed = confirm(`Remove snippet ?${snippet.name}??`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/communication/snippets/${snippet.id}`, { method: "DELETE" })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete snippet")
      }

      toast({ title: "Snippet removed", description: `${snippet.name} was deleted.` })
      await loadSnippets()
    } catch (error: any) {
      console.error("[SnippetManager] delete snippet", error)
      toast({
        title: "Unable to delete snippet",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      })
    }
  }

  const openSnippetDetail = (snippet: SnippetRecord) => {
    setSelectedSnippet(snippet)
    setViewOpen(true)
  }

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-xl">Reusable snippets</CardTitle>
          <CardDescription>
            Store disclaimers, footers, and localized fragments to drop into templates across channels.
          </CardDescription>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New snippet
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading snippets...
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : snippets.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            No snippets yet. Capture your first footer, compliance note, or localization fragment.
          </div>
        ) : (
          <div className="space-y-3">
            {snippets.map((snippet) => (
              <div
                key={snippet.id}
                className="rounded-lg border border-slate-200 bg-card/80 p-4 shadow-sm transition hover:border-primary/50"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <h4 className="font-semibold text-foreground">{snippet.name}</h4>
                      <Badge variant="outline" className="uppercase tracking-wide text-[10px]">
                        {snippet.snippet_key}
                      </Badge>
                      {snippet.category && <Badge variant="secondary">{snippet.category}</Badge>}
                      {snippet.language && <Badge variant="outline">{snippet.language.toUpperCase()}</Badge>}
                    </div>
                    {snippet.description && (
                      <p className="text-xs text-muted-foreground">{snippet.description}</p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Updated {snippet.updated_at ? formatDistanceToNow(new Date(snippet.updated_at), { addSuffix: true }) : "never"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => openSnippetDetail(snippet)}>
                      <Eye className="h-4 w-4" /> View
                    </Button>
                    <Button variant="destructive" size="sm" className="gap-2" onClick={() => handleDeleteSnippet(snippet)}>
                      <Trash className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={createOpen} onOpenChange={(open) => !submitting && setCreateOpen(open)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create snippet</DialogTitle>
            <DialogDescription>
              Snippets can be embedded inside templates or rendered dynamically when composing communications.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSnippet} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display name</label>
                <Input
                  value={createForm.name}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Payroll footer"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Snippet key</label>
                <Input
                  value={createForm.snippetKey}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, snippetKey: event.target.value.toUpperCase() }))
                  }
                  placeholder="FOOTER.PAYROLL"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category (optional)</label>
                <Input
                  value={createForm.category}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, category: event.target.value }))}
                  placeholder="compliance"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <Input
                  value={createForm.language}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, language: event.target.value }))}
                  placeholder="en"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                value={createForm.description}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Shown to admins only"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Plain text</label>
                <Textarea
                  rows={6}
                  value={createForm.text}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, text: event.target.value }))}
                  placeholder="Payroll processed by Akwaaba HR..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">HTML (optional)</label>
                <Textarea
                  rows={6}
                  value={createForm.html}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, html: event.target.value }))}
                  placeholder="<small>Payroll processed by...</small>"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save snippet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={(open) => setViewOpen(open)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Snippet preview</DialogTitle>
            <DialogDescription>Review localized or channel-specific content before inserting into templates.</DialogDescription>
          </DialogHeader>
          {selectedSnippet ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline" className="uppercase tracking-wide text-[10px]">
                    {selectedSnippet.snippet_key}
                  </Badge>
                  {selectedSnippet.category && <Badge variant="secondary">{selectedSnippet.category}</Badge>}
                  {selectedSnippet.language && <Badge variant="outline">{selectedSnippet.language.toUpperCase()}</Badge>}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{selectedSnippet.name}</h3>
                {selectedSnippet.description && (
                  <p className="text-sm text-muted-foreground">{selectedSnippet.description}</p>
                )}
              </div>

              <ScrollArea className="max-h-[320px] rounded-md border">
                <div className="space-y-4 p-4 text-sm">
                  {selectedSnippet.content_text && (
                    <div className="space-y-1">
                      <p className="text-xs uppercase text-muted-foreground">Text</p>
                      <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                        {selectedSnippet.content_text}
                      </pre>
                    </div>
                  )}
                  {selectedSnippet.content_html && (
                    <div className="space-y-1">
                      <p className="text-xs uppercase text-muted-foreground">HTML</p>
                      <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                        {selectedSnippet.content_html}
                      </pre>
                    </div>
                  )}
                  {!selectedSnippet.content_text && !selectedSnippet.content_html && (
                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No content stored for this snippet.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Select a snippet to preview.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
