"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"

import { AuthGuard } from "@/components/auth-guard"
import { RoleGuard } from "@/components/role-guard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { listChangeRequests, updateChangeRequestStatus as updateChangeRequestStatusApi } from "@/lib/api/change-requests-service"
import { ChangeFieldDiff, ChangeRequest } from "@/lib/change-requests-store"
import { cn } from "@/lib/utils"

import {
  ArrowUpRight,
  Download,
  FileText,
  Filter,
  Hourglass,
  MailCheck,
  ShieldAlert,
  ShieldCheck,
  UserSearch,
  XCircle,
} from "lucide-react"

const statusLabels: Record<ChangeRequest["status"], { label: string; className: string }> = {
  pending: { label: "Pending triage", className: "bg-amber-50 text-amber-700 border border-amber-100" },
  verifying: { label: "Verifying", className: "bg-blue-50 text-blue-700 border border-blue-100" },
  approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
  declined: { label: "Declined", className: "bg-red-50 text-red-700 border border-red-100" },
}

export default function ChangeRequestsReviewPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ChangeRequest["status"] | "all">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogId, setDialogId] = useState<string | null>(null)
  const pushToast = toast

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const payload = await listChangeRequests()
        setRequests(payload)
      } catch (error) {
        console.error("Failed to load change requests", error)
        pushToast({
          variant: "destructive",
          title: "Unable to load change requests",
          description: "Showing cached entries while the API is unavailable.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    bootstrap()
  }, [pushToast])

  const filtered = useMemo(() => {
    return requests.filter((request) => {
      const matchesStatus = statusFilter === "all" || request.status === statusFilter
      const text = `${request.employeeName} ${request.employeeId} ${request.reason}`.toLowerCase()
      const matchesSearch = text.includes(searchTerm.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [requests, searchTerm, statusFilter])

  const stats = useMemo(() => {
    const groupByStatus = requests.reduce(
      (accumulator, request) => {
        accumulator[request.status] += 1
        return accumulator
      },
      { pending: 0, verifying: 0, approved: 0, declined: 0 } as Record<ChangeRequest["status"], number>,
    )
    return groupByStatus
  }, [requests])

  const selectedRequest = dialogId ? requests.find((request) => request.id === dialogId) ?? null : null

  const refresh = async () => {
    try {
      const payload = await listChangeRequests()
      setRequests(payload)
    } catch (error) {
      console.error("Failed to refresh change requests", error)
      pushToast({
        variant: "destructive",
        title: "Refresh failed",
        description: "Could not refresh from the backend. View may be stale.",
      })
    }
  }

  const handleDecision = async (requestId: string, status: ChangeRequest["status"], notes?: string) => {
    const reviewer = { name: "HR Verification", notes }
    try {
      await updateChangeRequestStatusApi(requestId, status, reviewer)
      await refresh()
      pushToast({
        title: status === "approved" ? "Change request approved" : status === "declined" ? "Request declined" : "Marked for verification",
        description: status === "approved" ? "Records will update overnight after payroll sync." : undefined,
        variant: status === "declined" ? "destructive" : "default",
      })
    } catch (error) {
      console.error("Failed to update change request", error)
      pushToast({
        variant: "destructive",
        title: "Decision failed",
        description: "Could not persist the decision. Please retry.",
      })
    }
  }

  return (
    <AuthGuard>
      <RoleGuard requiredRoles={["hr-admin", "compliance", "payroll-manager"]}>
        <div className="space-y-6">
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Employee change requests</h1>
              <p className="text-sm text-muted-foreground">Verify self-service updates before they reach payroll and statutory filings.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Export audit file
              </Button>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <ArrowUpRight className="h-4 w-4" /> Route to shared inbox
              </Button>
            </div>
          </header>

          <Tabs value={statusFilter === "all" ? "all" : statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="verifying">Verifying ({stats.verifying})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="declined">Declined ({stats.declined})</TabsTrigger>
            </TabsList>
            <TabsContent value={statusFilter === "all" ? "all" : statusFilter} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Filter className="h-4 w-4" /> Quick filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="relative md:w-80">
                    <Input
                      placeholder="Search by employee name, ID, or reason"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="pl-8"
                    />
                    <UserSearch className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="gap-1">
                      <ShieldAlert className="h-3 w-3" /> Bank updates require dual approval
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <MailCheck className="h-3 w-3" /> Auto notify employee on decision
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {isLoading ? (
                  <Card>
                    <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading change requests…</CardContent>
                  </Card>
                ) : filtered.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-sm text-muted-foreground">
                      No change requests match the current filters.
                    </CardContent>
                  </Card>
                ) : (
                  filtered.map((request) => (
                    <ChangeRequestCard key={request.id} request={request} onOpen={() => setDialogId(request.id)} />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => !open && setDialogId(null)}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              {selectedRequest && (
                <ChangeRequestDetail
                  request={selectedRequest}
                  onDecision={handleDecision}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </RoleGuard>
    </AuthGuard>
  )
}

function ChangeRequestCard({ request, onOpen }: { request: ChangeRequest; onOpen: () => void }) {
  const headline = request.diffs[0]
  return (
    <Card className="border border-muted-foreground/10">
      <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">{request.employeeName}</h3>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {request.employeeId} • Submitted {format(new Date(request.submittedAt), "dd MMM yyyy, HH:mm")}
          </p>
          <p className="mt-2 text-sm text-foreground">{request.reason}</p>
          {headline && (
            <p className="mt-1 text-xs text-muted-foreground">
              Key change: {headline.label} → <span className="font-medium text-emerald-600">{mask(headline.newValue, headline.pii)}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {request.sections.map((section) => (
              <Badge key={section} variant="outline">
                {section}
              </Badge>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={onOpen}>
            <ArrowUpRight className="h-4 w-4" /> Review case
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ChangeRequestDetail({
  request,
  onDecision,
}: {
  request: ChangeRequest
  onDecision: (id: string, status: ChangeRequest["status"], notes?: string) => void
}) {
  const [notes, setNotes] = useState("")

  const diffsBySection = useMemo(() => {
    return request.diffs.reduce((accumulator, diff) => {
      const section = diff.path.split(".")[0]
      accumulator[section] = accumulator[section] ? [...accumulator[section], diff] : [diff]
      return accumulator
    }, {} as Record<string, ChangeFieldDiff[]>)
  }, [request.diffs])

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold text-foreground">{request.employeeName}</DialogTitle>
        <p className="text-sm text-muted-foreground">
          {request.employeeId} • Submitted {format(new Date(request.submittedAt), "dd MMM yyyy, HH:mm")}
        </p>
      </DialogHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Request summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Status" value={<StatusBadge status={request.status} />} />
          <Row label="Reason" value={<span className="text-muted-foreground">{request.reason}</span>} />
          <Row
            label="Impacted sections"
            value={
              <div className="flex flex-wrap gap-2">
                {request.sections.map((section) => (
                  <Badge key={section} variant="outline">
                    {section}
                  </Badge>
                ))}
              </div>
            }
          />
          <Row
            label="Attachments"
            value={
              request.attachments.length === 0 ? (
                <span className="text-muted-foreground">No documents uploaded</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {request.attachments.map((attachment) => (
                    <Badge key={attachment.id} variant="outline" className="gap-1 text-xs">
                      <FileText className="h-3 w-3" /> {attachment.name}
                    </Badge>
                  ))}
                </div>
              )
            }
          />
          {request.approvedBy && request.approvedAt && (
            <Row
              label="Last action"
              value={
                <span className="text-muted-foreground">
                  {request.approvedBy} on {format(new Date(request.approvedAt), "dd MMM yyyy HH:mm")}
                </span>
              }
            />
          )}
        </CardContent>
      </Card>

      {Object.entries(diffsBySection).map(([section, diffs]) => (
        <Card key={section}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold capitalize">{section} updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {diffs.map((diff) => (
              <DiffRow key={diff.path} diff={diff} />
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs uppercase text-muted-foreground">
              Add reviewer notes (optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Capture outcome, verification steps or follow-up reminders"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => onDecision(request.id, "verifying", notes || undefined)}
            >
              <Hourglass className="h-4 w-4" /> Flag for verification
            </Button>
            <Button
              type="button"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onDecision(request.id, "approved", notes || undefined)}
            >
              <ShieldCheck className="h-4 w-4" /> Approve changes
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => onDecision(request.id, "declined", notes || undefined)}
            >
              <XCircle className="h-4 w-4" /> Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DiffRow({ diff }: { diff: ChangeFieldDiff }) {
  return (
    <div className="rounded-lg border p-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium text-foreground">{diff.label}</p>
        <Badge variant="outline" className="text-[10px] uppercase">
          {diff.path.split(".")[0]}
        </Badge>
      </div>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Current</p>
          <p className="font-medium text-muted-foreground">{mask(diff.previousValue, diff.pii)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Proposed</p>
          <p className="font-semibold text-emerald-600">{mask(diff.newValue, diff.pii)}</p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 text-sm md:flex-row md:items-center md:justify-between">
      <p className="text-muted-foreground">{label}</p>
      <div className="md:text-right">{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: ChangeRequest["status"] }) {
  const config = statusLabels[status]
  return <Badge className={cn("px-2 py-1 text-xs", config.className)}>{config.label}</Badge>
}

function mask(value: string | null | undefined, pii?: boolean) {
  if (!value) return "—"
  if (!pii) return value
  if (value.length <= 4) return "••••"
  return `${"•".repeat(value.length - 4)}${value.slice(-4)}`
}
