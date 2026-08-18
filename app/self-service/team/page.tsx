"use client"

import useSWR from "swr"
import { Check, ExternalLink, UsersRound, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  StatusBadge,
} from "@/components/self-service/portal-ui"
import { fetcher, formatDate, formatMoney, patchJson } from "@/lib/self-service/use-portal"

export default function TeamPage() {
  const { data, error, isLoading, mutate } = useSWR<any>("/api/self-service/team", fetcher)

  async function decide(type: string, id: string, action: "approve" | "reject") {
    const reason =
      action === "reject" ? window.prompt("Reason for rejection (shared with the employee):") || "" : ""
    if (action === "reject" && !reason.trim()) return
    try {
      await patchJson("/api/self-service/team", { type, id, action, reason })
      toast.success(`Request ${action === "approve" ? "approved" : "rejected"}`)
      mutate()
    } catch (e: any) {
      toast.error(e?.message || "Could not process request")
    }
  }

  if (isLoading) return <LoadingBlock label="Loading team workspace" />
  if (error) return <ErrorBlock message={(error as Error).message} onRetry={() => mutate()} />
  const team = data?.team || []

  const requestList = (type: string, rows: any[]) =>
    !rows.length ? (
      <EmptyState title="No pending requests" description={`No ${type} requests currently need your approval.`} />
    ) : (
      <ul className="divide-y">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <p className="font-medium">{row.employee_name}</p>
              <p className="text-sm text-muted-foreground">
                {type === "leave"
                  ? `${row.leave_type_name || "Leave"} · ${formatDate(row.start_date)} – ${formatDate(row.end_date)}`
                  : type === "overtime"
                    ? `${formatDate(row.date)} · ${Number(row.hours_requested || 0)} hours`
                    : `${row.loan_type || "Loan"} · ${formatMoney(row.principal_amount ?? row.principal)}`}
              </p>
              {row.reason || row.purpose ? <p className="mt-1 text-xs text-muted-foreground">{row.reason || row.purpose}</p> : null}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => decide(type, row.id, "reject")}>
                <X className="mr-1 h-4 w-4" /> Reject
              </Button>
              <Button size="sm" onClick={() => decide(type, row.id, "approve")}>
                <Check className="mr-1 h-4 w-4" /> Approve
              </Button>
            </div>
          </li>
        ))}
      </ul>
    )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="My team & approvals"
        description="Role-based workspace for managers, supervisors, team leads and heads of department."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><UsersRound className="h-4 w-4" /> My authority line</CardTitle>
          <CardDescription>{team.length} employee(s) currently report through your approval line.</CardDescription>
        </CardHeader>
        <CardContent>
          {!team.length ? (
            <EmptyState title="No direct reports" description="HR can assign direct reports and approval authority from employee records." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((person: any) => (
                <div key={person.id} className="rounded-lg border p-4">
                  <p className="font-medium">{person.full_name || `${person.first_name || ""} ${person.last_name || ""}`.trim()}</p>
                  <p className="text-sm text-muted-foreground">{[person.position, person.department].filter(Boolean).join(" · ")}</p>
                  <div className="mt-2"><StatusBadge status={person.status} /></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="leave">
        <TabsList>
          <TabsTrigger value="leave">Leave ({data?.leave?.length || 0})</TabsTrigger>
          <TabsTrigger value="overtime">Overtime ({data?.overtime?.length || 0})</TabsTrigger>
          <TabsTrigger value="loans">Loans ({data?.loans?.length || 0})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({data?.documents?.length || 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="leave"><Card><CardContent>{requestList("leave", data?.leave || [])}</CardContent></Card></TabsContent>
        <TabsContent value="overtime"><Card><CardContent>{requestList("overtime", data?.overtime || [])}</CardContent></Card></TabsContent>
        <TabsContent value="loans"><Card><CardContent>{requestList("loan", data?.loans || [])}</CardContent></Card></TabsContent>
        <TabsContent value="documents">
          <Card><CardContent>
            {!data?.documents?.length ? (
              <EmptyState title="No submitted documents" description="Documents sent to your role will appear here." />
            ) : (
              <ul className="divide-y">
                {data.documents.map((document: any) => (
                  <li key={document.id} className="flex items-center justify-between gap-3 py-4">
                    <div>
                      <p className="font-medium">{document.employee_name} · {document.file_name}</p>
                      <p className="text-sm text-muted-foreground">{document.document_type} · {formatDate(document.upload_date)}</p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <a href={document.file_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Open</a>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
