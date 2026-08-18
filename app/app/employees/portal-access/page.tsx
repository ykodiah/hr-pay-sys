"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Ban,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  UserPlus,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"

type PortalRow = {
  employee_id: string
  employee_code: string
  name: string
  department: string | null
  position: string | null
  employment_status: string | null
  suggested_email: string | null
  portal: {
    status: string
    login_email: string
    must_change_password: boolean
    invite_method: string | null
    invite_sent_at: string | null
    last_login_at: string | null
    login_count: number | null
    activated_at: string | null
  } | null
}

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-900",
  invited: "bg-sky-100 text-sky-900",
  suspended: "bg-amber-100 text-amber-900",
  disabled: "bg-red-100 text-red-800",
}

function statusLabel(status?: string | null) {
  if (!status) return "No access"
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function PortalAccessPage() {
  const [rows, setRows] = useState<PortalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [summary, setSummary] = useState({ total: 0, enabled: 0, active: 0 })

  const [grantOpen, setGrantOpen] = useState(false)
  const [grantTarget, setGrantTarget] = useState<PortalRow | null>(null)
  const [grantEmail, setGrantEmail] = useState("")
  const [grantMethod, setGrantMethod] = useState<"temp_password" | "email">("temp_password")
  const [granting, setGranting] = useState(false)

  const [resultOpen, setResultOpen] = useState(false)
  const [result, setResult] = useState<{ name: string; email: string; tempPassword?: string | null } | null>(null)
  const [copied, setCopied] = useState(false)

  const [suspendTarget, setSuspendTarget] = useState<PortalRow | null>(null)
  const [suspendReason, setSuspendReason] = useState("")
  const [suspendBusy, setSuspendBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/employees/portal-access?limit=500", {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to load portal access")
      setRows(data.employees || [])
      setSummary({ total: data.total || 0, enabled: data.enabled || 0, active: data.active || 0 })
    } catch (e: any) {
      toast({ title: "Load failed", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter !== "all") {
        const rowStatus = r.portal?.status || "none"
        if (rowStatus !== statusFilter) return false
      }
      if (!q) return true
      return `${r.name} ${r.employee_code} ${r.department || ""} ${r.portal?.login_email || r.suggested_email || ""}`
        .toLowerCase()
        .includes(q)
    })
  }, [rows, search, statusFilter])

  function openGrant(row: PortalRow) {
    setGrantTarget(row)
    setGrantEmail(row.portal?.login_email || row.suggested_email || "")
    setGrantMethod("temp_password")
    setGrantOpen(true)
  }

  async function submitGrant() {
    if (!grantTarget) return
    if (!grantEmail.trim().includes("@")) {
      toast({ title: "Enter a valid email", variant: "destructive" })
      return
    }
    setGranting(true)
    try {
      const res = await fetch("/api/employees/portal-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "enable",
          employee_id: grantTarget.employee_id,
          method: grantMethod,
          login_email: grantEmail.trim().toLowerCase(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.failures?.length) {
        throw new Error(data.failures?.[0]?.error || data.error || "Could not grant portal access")
      }
      const provisioned = data.provisioned?.[0]
      setGrantOpen(false)
      setResult({
        name: grantTarget.name,
        email: provisioned?.login_email || grantEmail,
        tempPassword: provisioned?.temp_password || null,
      })
      setResultOpen(true)
      await load()
    } catch (e: any) {
      toast({ title: "Could not grant access", description: e.message, variant: "destructive" })
    } finally {
      setGranting(false)
    }
  }

  async function resetPassword(row: PortalRow) {
    try {
      const res = await fetch("/api/employees/portal-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "enable",
          employee_id: row.employee_id,
          method: "temp_password",
          login_email: row.portal?.login_email,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.failures?.length) {
        throw new Error(data.failures?.[0]?.error || data.error || "Could not reset the password")
      }
      const provisioned = data.provisioned?.[0]
      setResult({
        name: row.name,
        email: provisioned?.login_email || row.portal?.login_email || "",
        tempPassword: provisioned?.temp_password || null,
      })
      setResultOpen(true)
      await load()
    } catch (e: any) {
      toast({ title: "Reset failed", description: e.message, variant: "destructive" })
    }
  }

  async function setStatus(row: PortalRow, action: "suspend" | "restore", reason?: string) {
    setSuspendBusy(true)
    try {
      const res = await fetch("/api/employees/portal-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, employee_id: row.employee_id, reason: reason || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Update failed")
      toast({
        title: action === "suspend" ? "Access suspended" : "Access restored",
        description: `${row.name}'s portal login has been ${action === "suspend" ? "suspended" : "restored"}.`,
      })
      setSuspendTarget(null)
      setSuspendReason("")
      await load()
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" })
    } finally {
      setSuspendBusy(false)
    }
  }

  async function copyPassword() {
    if (!result?.tempPassword) return
    try {
      await navigator.clipboard.writeText(result.tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore clipboard failures
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-muted-foreground">
            <Link href="/app/employees">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Employees
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-teal-700" />
              Portal Access
            </h1>
            <p className="text-sm text-muted-foreground">
              Invite employees to the self-service portal, issue temporary passwords, and suspend or restore access.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total employees</p>
            <p className="text-2xl font-semibold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Portal enabled</p>
            <p className="text-2xl font-semibold">{summary.enabled}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active logins</p>
            <p className="text-2xl font-semibold">{summary.active}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, employee ID, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="none">No access</SelectItem>
                <SelectItem value="invited">Invited</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Employees</CardTitle>
          <CardDescription>Portal login status for everyone in your organisation</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-12 text-muted-foreground justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading portal access…
            </div>
          ) : filtered.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Login email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last login</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.employee_id}>
                      <TableCell>
                        <p className="font-medium text-sm">{r.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.employee_code} · {r.department || "—"}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.portal?.login_email || r.suggested_email || (
                          <span className="text-muted-foreground">No email on file</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_TONE[r.portal?.status || ""] || "bg-slate-100 text-slate-700"}>
                          {statusLabel(r.portal?.status)}
                        </Badge>
                        {r.portal?.must_change_password && r.portal?.status !== "suspended" ? (
                          <Badge className="ml-1 bg-slate-100 text-slate-700 text-[10px]">Must set password</Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.portal?.last_login_at ? new Date(r.portal.last_login_at).toLocaleString() : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          {!r.portal ? (
                            <Button size="sm" variant="outline" onClick={() => openGrant(r)}>
                              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                              Grant access
                            </Button>
                          ) : r.portal.status === "suspended" || r.portal.status === "disabled" ? (
                            <Button size="sm" variant="outline" onClick={() => void setStatus(r, "restore")}>
                              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                              Restore
                            </Button>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" onClick={() => void resetPassword(r)}>
                                <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                                Reset password
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-700 hover:text-red-800"
                                onClick={() => setSuspendTarget(r)}
                              >
                                <Ban className="mr-1.5 h-3.5 w-3.5" />
                                Suspend
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No employees match this filter.</p>
          )}
        </CardContent>
      </Card>

      {/* Grant access dialog */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Grant portal access</DialogTitle>
            <DialogDescription>
              {grantTarget ? `Set up a self-service login for ${grantTarget.name}.` : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Login email</Label>
              <Input value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} placeholder="name@company.com" />
            </div>
            <div className="space-y-2">
              <Label>How should they get access?</Label>
              <RadioGroup value={grantMethod} onValueChange={(v) => setGrantMethod(v as "temp_password" | "email")}>
                <div className="flex items-start gap-2 rounded-md border p-3">
                  <RadioGroupItem value="temp_password" id="method-temp" className="mt-0.5" />
                  <Label htmlFor="method-temp" className="cursor-pointer font-normal">
                    <span className="flex items-center gap-1.5 font-medium">
                      <KeyRound className="h-3.5 w-3.5" /> Temporary password
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Generate a one-time password you hand to the employee directly.
                    </span>
                  </Label>
                </div>
                <div className="flex items-start gap-2 rounded-md border p-3">
                  <RadioGroupItem value="email" id="method-email" className="mt-0.5" />
                  <Label htmlFor="method-email" className="cursor-pointer font-normal">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Mail className="h-3.5 w-3.5" /> Email invite link
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Generate a one-time sign-in link for the employee's inbox.
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantOpen(false)} disabled={granting}>
              Cancel
            </Button>
            <Button onClick={() => void submitGrant()} disabled={granting}>
              {granting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Grant access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Portal access ready</DialogTitle>
            <DialogDescription>
              {result ? `${result.name} can now sign in at ${result.email}.` : null}
            </DialogDescription>
          </DialogHeader>
          {result?.tempPassword ? (
            <div className="space-y-1.5">
              <Label className="text-xs">Temporary password — share it securely, it won&apos;t be shown again</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={result.tempPassword} className="font-mono" />
                <Button size="icon" variant="outline" onClick={() => void copyPassword()}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The employee will be asked to set a new password on first sign-in.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              An invite link was generated and sent to the employee&apos;s email.
            </p>
          )}
          <DialogFooter>
            <Button onClick={() => setResultOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend confirmation */}
      <Dialog open={!!suspendTarget} onOpenChange={(open) => !open && setSuspendTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend portal access</DialogTitle>
            <DialogDescription>
              {suspendTarget ? `${suspendTarget.name} will not be able to sign in until access is restored.` : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">Reason (optional)</Label>
            <Input value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="e.g. On leave, pending investigation" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)} disabled={suspendBusy}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => suspendTarget && void setStatus(suspendTarget, "suspend", suspendReason)}
              disabled={suspendBusy}
            >
              {suspendBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Suspend access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
