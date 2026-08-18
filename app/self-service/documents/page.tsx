"use client"

import { useRef, useState } from "react"
import useSWR from "swr"
import { Download, FileText, FolderLock, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  StatusBadge,
} from "@/components/self-service/portal-ui"
import { fetcher, formatDate } from "@/lib/self-service/use-portal"

const RECIPIENTS = [
  ["manager", "Manager"],
  ["supervisor", "Supervisor / team lead"],
  ["head_of_department", "Head of department"],
  ["hr", "HR"],
] as const

export default function DocumentsPage() {
  const { data, error, isLoading, mutate } = useSWR<any>("/api/self-service/documents", fetcher)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [documentType, setDocumentType] = useState("other")
  const [notes, setNotes] = useState("")
  const [recipients, setRecipients] = useState<string[]>(["hr"])

  function toggleRecipient(value: string) {
    setRecipients((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    )
  }

  async function upload() {
    const file = fileRef.current?.files?.[0]
    if (!file) return toast.error("Choose a document")
    if (!recipients.length) return toast.error("Choose at least one recipient")
    setUploading(true)
    try {
      const form = new FormData()
      form.set("file", file)
      form.set("document_type", documentType)
      form.set("notes", notes)
      form.set("recipients", recipients.join(","))
      const response = await fetch("/api/self-service/documents", { method: "POST", body: form })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "Upload failed")
      toast.success("Document uploaded and routed")
      if (fileRef.current) fileRef.current.value = ""
      setNotes("")
      mutate()
    } catch (e: any) {
      toast.error(e?.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  if (isLoading) return <LoadingBlock label="Opening document vault" />
  if (error) return <ErrorBlock message={(error as Error).message} onRetry={() => mutate()} />
  const documents = data?.documents || []

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Document vault"
        description="Keep personal employment documents together and submit them securely to your authority line or HR."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4 text-emerald-600" /> Upload a document
          </CardTitle>
          <CardDescription>Maximum file size is 10MB. Access is restricted to you and selected recipients.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="vault-file">Document</Label>
            <Input ref={fileRef} id="vault-file" type="file" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Document type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="identification">Identification</SelectItem>
                <SelectItem value="qualification">Qualification / certificate</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="banking">Banking</SelectItem>
                <SelectItem value="correspondence">Correspondence</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label>Send to</Label>
            <div className="flex flex-wrap gap-4 rounded-md border p-3">
              {RECIPIENTS.map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={recipients.includes(value)}
                    onChange={() => toggleRecipient(value)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="vault-notes">Message or notes</Label>
            <Textarea id="vault-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button onClick={upload} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderLock className="mr-2 h-4 w-4" />}
              Upload securely
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">My documents</CardTitle>
          <CardDescription>{documents.length} document(s) in your vault</CardDescription>
        </CardHeader>
        <CardContent>
          {!documents.length ? (
            <EmptyState icon={FileText} title="Your vault is empty" description="Uploaded documents will appear here." />
          ) : (
            <ul className="divide-y">
              {documents.map((document: any) => (
                <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{document.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(document.document_type || "other").replace(/_/g, " ")} · {formatDate(document.upload_date)}
                      {document.submitted_to_roles?.length
                        ? ` · Sent to ${document.submitted_to_roles.map((r: string) => r.replace(/_/g, " ")).join(", ")}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={document.status} />
                    {document.file_url ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={document.file_url} target="_blank" rel="noreferrer">
                          <Download className="mr-2 h-4 w-4" /> Open
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
