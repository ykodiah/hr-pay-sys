"use client"

import { useState } from "react"
import { Clock3, Fingerprint, LocateFixed, LogIn, LogOut, MapPin, Timer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/self-service/portal-ui"
import { fetcher, formatDate, postJson } from "@/lib/self-service/use-portal"
import useSWR from "swr"

type AttendanceResponse = {
  records: any[]
  current: any | null
  summary: Record<string, number>
  settings: Record<string, any>
  devices: any[]
  year: number
}

export default function AttendancePage() {
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [clocking, setClocking] = useState(false)
  const [manualLat, setManualLat] = useState("")
  const [manualLng, setManualLng] = useState("")
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
  const { data, error, isLoading, mutate } = useSWR<AttendanceResponse>(
    `/api/self-service/attendance?year=${year}`,
    fetcher,
  )

  async function clock(action: "clock_in" | "clock_out") {
    if (clocking) return
    const submit = async (latitude: number, longitude: number, accuracy: number) => {
      try {
        await postJson("/api/self-service/attendance", {
          action,
          latitude,
          longitude,
          accuracy,
          device_info: { platform: navigator.platform, user_agent: navigator.userAgent },
        })
        toast.success(action === "clock_in" ? "Clocked in successfully" : "Clocked out successfully")
        await mutate()
      } catch (e: any) {
        toast.error(e?.message || "Could not mark attendance")
      } finally {
        setClocking(false)
      }
    }

    if (coords) {
      setClocking(true)
      await submit(coords.lat, coords.lng, coords.accuracy)
      return
    }
    const lat = Number(manualLat)
    const lng = Number(manualLng)
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setClocking(true)
      await submit(lat, lng, 25)
      return
    }
    if (!navigator.geolocation) {
      toast.error("Enter the approved latitude and longitude to mark attendance")
      return
    }
    setClocking(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy })
        setManualLat(String(position.coords.latitude))
        setManualLng(String(position.coords.longitude))
        void submit(position.coords.latitude, position.coords.longitude, position.coords.accuracy)
      },
      (geoError) => {
        toast.error(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Allow location access in your browser settings, then try again"
            : geoError.code === geoError.TIMEOUT
              ? "Location lookup timed out. Move near a window and try again"
              : "Your location could not be determined",
        )
        setClocking(false)
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 60000 },
    )
  }

  if (isLoading) return <LoadingBlock label="Loading attendance" />
  if (error) return <ErrorBlock message={(error as Error).message} onRetry={() => mutate()} />
  if (!data) return null

  const current = data.current
  const gpsEnabled =
    data.settings.employee_gps_clock_enabled !== false && data.settings.allow_web_clock !== false
  const totalDays = data.records.length
  const present = Number(data.summary.present || 0) + Number(data.summary.late || 0)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Attendance"
        description="Clock with GPS and view attendance received from portal, biometric and imported systems."
        action={
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3].map((offset) => {
                const value = String(new Date().getFullYear() - offset)
                return <SelectItem key={value} value={value}>{value}</SelectItem>
              })}
            </SelectContent>
          </Select>
        }
      />

      <Card className="border-emerald-200 bg-emerald-50/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LocateFixed className="h-5 w-5 text-emerald-700" />
            Today&apos;s clock
          </CardTitle>
          <CardDescription>
            Marking attendance for {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
            {data.settings.attendance_method_label || " GPS clock"}
            {data.devices.length ? ` · ${data.devices.length} active biometric device(s) also sync here` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-6 text-sm">
            <div><span className="text-muted-foreground">Clock in</span><p className="font-semibold">{current?.clock_in || "—"}</p></div>
            <div><span className="text-muted-foreground">Clock out</span><p className="font-semibold">{current?.clock_out || "—"}</p></div>
            <div><span className="text-muted-foreground">Method</span><p className="font-semibold capitalize">{String(current?.source || current?.clock_in_method || "Not marked").replace(/_/g, " ")}</p></div>
            <div><span className="text-muted-foreground">Status</span><div className="mt-1"><StatusBadge status={current?.status || "not marked"} /></div></div>
            </div>
            <div className="flex flex-col gap-2 rounded-md border bg-background p-3 text-sm">
              <div className="flex items-center gap-2 font-medium"><MapPin className="size-4" /> Approved location coordinates</div>
              <p className="text-xs text-muted-foreground">Allow GPS or enter the approved coordinates below. The server applies the configured geofence before marking attendance.</p>
              <div className="grid grid-cols-2 gap-2">
                <div><Label htmlFor="portal-latitude">Latitude</Label><Input id="portal-latitude" inputMode="decimal" value={manualLat} onChange={(e) => { setManualLat(e.target.value); setCoords(null) }} placeholder="5.603700" /></div>
                <div><Label htmlFor="portal-longitude">Longitude</Label><Input id="portal-longitude" inputMode="decimal" value={manualLng} onChange={(e) => { setManualLng(e.target.value); setCoords(null) }} placeholder="-0.187000" /></div>
              </div>
              {coords ? <p className="text-xs text-muted-foreground">Current position: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)} (±{Math.round(coords.accuracy)}m)</p> : null}
            </div>
          </div>
          {gpsEnabled ? (
            <div className="flex gap-2">
              <Button onClick={() => clock("clock_in")} disabled={clocking || Boolean(current?.clock_in)}>
                <LogIn className="mr-2 h-4 w-4" /> {clocking ? "Locating…" : "Clock in"}
              </Button>
              <Button variant="outline" onClick={() => clock("clock_out")} disabled={clocking || !current?.clock_in || Boolean(current?.clock_out)}>
                <LogOut className="mr-2 h-4 w-4" /> {clocking ? "Locating…" : "Clock out"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm">
              <Fingerprint className="h-4 w-4" />
              Portal clocking is disabled; use your organisation&apos;s attendance device.
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Recorded days" value={totalDays} icon={Clock3} />
        <StatCard label="Present / late" value={present} icon={LocateFixed} tone="positive" />
        <StatCard label="Hours worked" value={Number(data.summary.total_hours || 0).toFixed(1)} icon={Timer} />
        <StatCard label="Overtime hours" value={Number(data.summary.overtime_hours || 0).toFixed(1)} icon={Timer} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance history</CardTitle>
          <CardDescription>All attendance sources are shown in one report.</CardDescription>
        </CardHeader>
        <CardContent>
          {!data.records.length ? (
            <EmptyState title="No attendance records" description={`No attendance has been recorded for ${year}.`} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr><th className="py-2">Date</th><th>In</th><th>Out</th><th>Hours</th><th>Source</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.records.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="py-3">{formatDate(row.date)}</td>
                      <td>{row.clock_in || "—"}</td>
                      <td>{row.clock_out || "—"}</td>
                      <td>{Number(row.total_hours || 0).toFixed(1)}</td>
                      <td className="capitalize">{String(row.source || row.clock_in_method || "manual").replace(/_/g, " ")}</td>
                      <td><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
