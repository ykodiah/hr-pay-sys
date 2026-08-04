"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, MapPin, Navigation, RefreshCw, Clock3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"

type Employee = {
  id: string
  first_name?: string
  last_name?: string
  employee_id?: string
}

function empName(e: Employee) {
  return `${e.first_name || ""} ${e.last_name || ""}`.trim() || e.employee_id || "Employee"
}

export function AttendanceClockPanel({ employees }: { employees: Employee[] }) {
  const [employeeId, setEmployeeId] = useState("")
  const [busy, setBusy] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null)
  const [locBusy, setLocBusy] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const [audits, setAudits] = useState<any[]>([])

  const loadAudits = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance/gps-audit?limit=30", {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) setAudits(data.audits || [])
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void loadAudits()
  }, [loadAudits])

  async function captureLocation() {
    if (!navigator.geolocation) {
      toast({ title: "GPS unavailable", description: "Browser does not support geolocation", variant: "destructive" })
      return
    }
    setLocBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setLocBusy(false)
        toast({ title: "Location captured", description: `±${Math.round(pos.coords.accuracy || 0)}m accuracy` })
      },
      (err) => {
        setLocBusy(false)
        toast({ title: "Location failed", description: err.message, variant: "destructive" })
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  async function clock(action: "clock_in" | "clock_out") {
    if (!employeeId) {
      toast({ title: "Select employee", variant: "destructive" })
      return
    }
    if (!coords) {
      toast({ title: "Capture GPS first", description: "Geofenced clock-in needs a location", variant: "destructive" })
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/attendance/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action,
          employee_id: employeeId,
          latitude: coords.lat,
          longitude: coords.lng,
          accuracy: coords.accuracy,
          device_info: {
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
            platform: typeof navigator !== "undefined" ? navigator.platform : "",
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Clock action failed")
      setLastResult(data)
      toast({
        title: action === "clock_in" ? "Clocked in" : "Clocked out",
        description: data.late
          ? `Marked late vs shift ${data.shift?.name || ""}`
          : data.geofence
            ? `${data.geofence.inside ? "Inside" : "Outside"} ${data.geofence.name}`
            : `Status: ${data.status}`,
      })
      await loadAudits()
    } catch (e: any) {
      toast({ title: "Clock failed", description: e.message, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm border-teal-100 bg-gradient-to-br from-teal-50/80 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Navigation className="h-4 w-4 text-teal-700" />
              Geofenced clock-in
            </CardTitle>
            <CardDescription>
              Uses live GPS, assigned shift for late detection, and writes a GPS audit trail.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Employee</Label>
              <Select value={employeeId || undefined} onValueChange={setEmployeeId}>
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

            <div className="rounded-lg border bg-white/80 p-3 text-sm">
              {coords ? (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-teal-700" />
                  <div>
                    <p className="font-medium">
                      {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Accuracy ±{Math.round(coords.accuracy || 0)}m
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No location yet — capture GPS to continue.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void captureLocation()} disabled={locBusy}>
                {locBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                Capture GPS
              </Button>
              <Button className="bg-teal-600 hover:bg-teal-700" disabled={busy} onClick={() => void clock("clock_in")}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock3 className="mr-2 h-4 w-4" />}
                Clock in
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => void clock("clock_out")}>
                Clock out
              </Button>
            </div>

            {lastResult ? (
              <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3 text-sm space-y-1">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-teal-100 text-teal-900">{lastResult.status}</Badge>
                  {lastResult.late ? <Badge className="bg-amber-100 text-amber-900">Late</Badge> : null}
                  {lastResult.geofence ? (
                    <Badge variant="outline">
                      {lastResult.geofence.inside ? "Inside" : "Outside"} {lastResult.geofence.name} ·{" "}
                      {lastResult.geofence.distance_meters}m
                    </Badge>
                  ) : null}
                </div>
                {lastResult.shift ? (
                  <p className="text-xs text-muted-foreground">
                    Shift: {lastResult.shift.name || "Assigned"} ({String(lastResult.shift.start_time || "").slice(0, 5)}–
                    {String(lastResult.shift.end_time || "").slice(0, 5)})
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">GPS audit trail</CardTitle>
              <CardDescription>Recent clock events with distance / fence match</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => void loadAudits()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {audits.length ? (
              <div className="max-h-80 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Fence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audits.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {a.created_at ? new Date(a.created_at).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-sm">{a.employee_name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {a.event_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {a.inside_geofence == null
                            ? "—"
                            : a.inside_geofence
                              ? `✓ ${a.geofence_name || "inside"}`
                              : `✗ ${a.distance_meters ?? "?"}m`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No GPS events yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
