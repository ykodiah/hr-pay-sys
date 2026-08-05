"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, MapPinned, Plus, Trash2, RefreshCw } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"

const emptyForm = {
  name: "",
  location_label: "",
  latitude: "",
  longitude: "",
  radius_meters: "150",
  enforce_on_clock_in: true,
  enforce_on_clock_out: false,
}

/** Accra CBD sample so Save works even when browser GPS is blocked */
const SAMPLE_COORDS = { latitude: "5.6037000", longitude: "-0.1870000" }

export function GeofencePanel() {
  const [geofences, setGeofences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/attendance/geofences?include_inactive=true", {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to load geofences")
      setGeofences(data.geofences || [])
    } catch (e: any) {
      toast({ title: "Load failed", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditId(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(g: any) {
    setEditId(g.id)
    setForm({
      name: g.name || "",
      location_label: g.location_label || "",
      latitude: String(g.latitude ?? ""),
      longitude: String(g.longitude ?? ""),
      radius_meters: String(g.radius_meters ?? 150),
      enforce_on_clock_in: g.enforce_on_clock_in !== false,
      enforce_on_clock_out: Boolean(g.enforce_on_clock_out),
    })
    setOpen(true)
  }

  async function deactivate(id: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/attendance/geofences?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed")
      toast({ title: "Geofence deactivated" })
      await load()
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setForm((f) => ({ ...f, ...SAMPLE_COORDS }))
      toast({
        title: "GPS unavailable",
        description: "Filled Accra sample coordinates — replace with your site lat/lng.",
      })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }))
        toast({ title: "Location filled" })
      },
      () => {
        setForm((f) => ({ ...f, ...SAMPLE_COORDS }))
        toast({
          title: "Browser blocked GPS",
          description: "Sample coordinates inserted — paste your office lat/lng from Google Maps.",
          variant: "destructive",
        })
      },
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  async function save() {
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" })
      return
    }
    if (!form.latitude || !form.longitude) {
      toast({
        title: "Coordinates required",
        description: "Enter lat/lng or use “Use my current location”.",
        variant: "destructive",
      })
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/attendance/geofences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: editId || undefined,
          name: form.name,
          location_label: form.location_label,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          radius_meters: Number(form.radius_meters),
          enforce_on_clock_in: form.enforce_on_clock_in,
          enforce_on_clock_out: form.enforce_on_clock_out,
          is_active: true,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Save failed")
      toast({
        title: editId ? "Geofence updated" : "Geofence created",
        description: form.enforce_on_clock_in
          ? "Clock-in will reject punches outside this radius."
          : "Fence saved (enforcement off — turn on to block outside punches).",
      })
      setOpen(false)
      await load()
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Worksite geofences</h2>
          <p className="text-sm text-muted-foreground">
            Define approved clock-in zones. Mobile clock rejects punches outside the radius when enforcement is on.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={openCreate}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            Add geofence
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {geofences.map((g) => (
            <Card key={g.id} className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPinned className="h-4 w-4 text-teal-700" />
                      {g.name}
                    </CardTitle>
                    <CardDescription>{g.location_label || "No label"}</CardDescription>
                  </div>
                  <Badge className={g.is_active === false ? "bg-slate-100" : "bg-emerald-100 text-emerald-800"}>
                    {g.is_active === false ? "Inactive" : "Active"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  {Number(g.latitude).toFixed(5)}, {Number(g.longitude).toFixed(5)} · {g.radius_meters}m
                </p>
                <p className="text-xs">
                  Enforce: in {g.enforce_on_clock_in !== false ? "yes" : "no"} · out{" "}
                  {g.enforce_on_clock_out ? "yes" : "no"}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(g)}>
                    Edit
                  </Button>
                  {g.is_active !== false ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700"
                      disabled={busy}
                      onClick={() => void deactivate(g.id)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Deactivate
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
          {!geofences.length ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No geofences yet. Add HQ or branch sites to enforce mobile clock-in.
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit geofence" : "New geofence"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Location label</Label>
              <Input
                value={form.location_label}
                onChange={(e) => setForm({ ...form, location_label: e.target.value })}
                placeholder="Head office · Accra"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Latitude</Label>
                <Input
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                />
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
              Use my current location
            </Button>
            <div>
              <Label>Radius (meters)</Label>
              <Input
                type="number"
                min={25}
                value={form.radius_meters}
                onChange={(e) => setForm({ ...form, radius_meters: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Enforce on clock-in</Label>
              <Switch
                checked={form.enforce_on_clock_in}
                onCheckedChange={(v) => setForm({ ...form, enforce_on_clock_in: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Enforce on clock-out</Label>
              <Switch
                checked={form.enforce_on_clock_out}
                onCheckedChange={(v) => setForm({ ...form, enforce_on_clock_out: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700" disabled={busy} onClick={() => void save()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
