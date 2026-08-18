"use client"

import { useState } from "react"
import useSWR from "swr"
import { Scale, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  StatusBadge,
} from "@/components/self-service/portal-ui"
import { fetcher, formatDate, patchJson } from "@/lib/self-service/use-portal"

export default function DisciplinaryPage() {
  const { data, error, isLoading, mutate } = useSWR<any>("/api/self-service/disciplinary", fetcher)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  async function acknowledge(id: string, type: "case" | "action") {
    setSaving(id)
    try {
      await patchJson("/api/self-service/disciplinary", {
        id,
        type,
        response: responses[id] || "",
      })
      toast.success(type === "case" ? "Response submitted" : "Action acknowledged")
      mutate()
    } catch (e: any) {
      toast.error(e?.message || "Could not save acknowledgement")
    } finally {
      setSaving(null)
    }
  }

  if (isLoading) return <LoadingBlock label="Loading employee relations records" />
  if (error) return <ErrorBlock message={(error as Error).message} onRetry={() => mutate()} />
  const cases = data?.cases || []
  const actions = data?.actions || []

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Disciplinary actions"
        description="View formal cases and actions disclosed to you, submit a response and acknowledge receipt."
      />

      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="flex gap-3 p-5 text-sm text-blue-900">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            This page is your confidential employee record. Grievances you initiate remain under
            <strong> Grievances</strong>; formal actions issued by HR appear here.
          </p>
        </CardContent>
      </Card>

      {!cases.length && !actions.length ? (
        <Card>
          <CardContent>
            <EmptyState icon={Scale} title="No disciplinary records" description="There are no visible cases or actions on your employee record." />
          </CardContent>
        </Card>
      ) : null}

      {cases.map((item: any) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{item.title || item.case_number || "Disciplinary case"}</CardTitle>
                <CardDescription>
                  {item.case_number ? `${item.case_number} · ` : ""}{item.category || "Employee relations"} · opened {formatDate(item.created_at)}
                </CardDescription>
              </div>
              <StatusBadge status={item.status} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <p className="whitespace-pre-wrap text-slate-700">{item.description || "No case description supplied."}</p>
            {item.hearing_date ? <p><strong>Hearing:</strong> {formatDate(item.hearing_date)}</p> : null}
            {item.resolution ? <p><strong>Resolution:</strong> {item.resolution}</p> : null}
            {item.employee_response ? (
              <div className="rounded-md bg-slate-50 p-3"><strong>Your response:</strong> {item.employee_response}</div>
            ) : (
              <div className="flex flex-col gap-2">
                <Textarea
                  placeholder="Enter your formal response to this case"
                  value={responses[item.id] || ""}
                  onChange={(e) => setResponses((current) => ({ ...current, [item.id]: e.target.value }))}
                />
                <Button className="self-start" onClick={() => acknowledge(item.id, "case")} disabled={saving === item.id || !responses[item.id]?.trim()}>
                  Submit response
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {actions.map((item: any) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base capitalize">{String(item.action_type || "Action").replace(/_/g, " ")}</CardTitle>
                <CardDescription>Issued {formatDate(item.issued_at)}{item.issued_by ? ` by ${item.issued_by}` : ""}</CardDescription>
              </div>
              <StatusBadge status={item.acknowledged ? "acknowledged" : item.status || "issued"} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="whitespace-pre-wrap">{item.description || item.notes || "No additional details supplied."}</p>
            {!item.acknowledged ? (
              <>
                <Textarea
                  placeholder="Optional acknowledgement note"
                  value={responses[item.id] || ""}
                  onChange={(e) => setResponses((current) => ({ ...current, [item.id]: e.target.value }))}
                />
                <Button className="self-start" onClick={() => acknowledge(item.id, "action")} disabled={saving === item.id}>
                  Acknowledge receipt
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
