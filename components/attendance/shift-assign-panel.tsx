"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"

type Employee = {
  id: string
  first_name?: string
  last_name?: string
  employee_id?: string
  department?: string
}

function empName(e: Employee | any) {
  if (!e) return "Employee"
  return `${e.first_name || ""} ${e.last_name || ""}`.trim() || e.employee_id || "Employee"
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function ShiftAssignPanel({
  employees,
  shifts,
}: {
  employees: Employee[]
  shifts: any[]
}) {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    employee_id: "",
    shift_id: "",
    effective_from: today(),
    effective_to: "",
    is_primary: true,
    notes: "",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/attendance/shift-assignments", {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to load assignments")
      setAssignments(data.assignments || [])
    } catch (e: any) {
      toast({ title: "Load failed", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function save() {
    if (!form.employee_id || !form.shift_id) {
      toast({ title: "Employee and shift required", variant: "destructive" })
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/attendance/shift-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          effective_to: form.effective_to || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Save failed")
      toast({ title: "Shift assigned", description: "Late detection now uses this shift start + grace." })
      setOpen(false)
      setForm({
        employee_id: "",
        shift_id: "",
        effective_from: today(),
        effective_to: "",
        is_primary: true,
        notes: "",
      })
      await load()
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/attendance/shift-assignments?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Delete failed")
      toast({ title: "Assignment removed" })
      await load()
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const activeShifts = shifts.filter((s) => s.is_active !== false)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Employee shift assignments</h2>
          <p className="text-sm text-muted-foreground">
            Late detection uses each employee&apos;s assigned shift — not a hardcoded 08:00 default.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => setOpen(true)}
            disabled={!activeShifts.length}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Assign shift
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Current assignments</CardTitle>
          <CardDescription>Primary assignment wins for a date; create shifts first if the list is empty.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : assignments.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Primary</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        {a.employee ? empName(a.employee) : a.employee_id}
                      </TableCell>
                      <TableCell>
                        {a.shift?.name || a.shift_id}
                        {a.shift?.start_time ? (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({String(a.shift.start_time).slice(0, 5)}–{String(a.shift.end_time || "").slice(0, 5)})
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>{a.effective_from}</TableCell>
                      <TableCell>{a.effective_to || "—"}</TableCell>
                      <TableCell>
                        {a.is_primary ? (
                          <Badge className="bg-teal-100 text-teal-900">Primary</Badge>
                        ) : (
                          <Badge variant="outline">Secondary</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-700"
                          disabled={busy}
                          onClick={() => void remove(a.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No assignments yet. Unassigned employees fall back to the company default active shift.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign shift to employee</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Employee</Label>
              <Select
                value={form.employee_id || undefined}
                onValueChange={(v) => setForm({ ...form, employee_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {empName(e)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Shift</Label>
              <Select
                value={form.shift_id || undefined}
                onValueChange={(v) => setForm({ ...form, shift_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {activeShifts.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({String(s.start_time).slice(0, 5)}–{String(s.end_time).slice(0, 5)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Effective from</Label>
                <Input
                  type="date"
                  value={form.effective_from}
                  onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
                />
              </div>
              <div>
                <Label>Effective to (optional)</Label>
                <Input
                  type="date"
                  value={form.effective_to}
                  onChange={(e) => setForm({ ...form, effective_to: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700" disabled={busy} onClick={() => void save()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
