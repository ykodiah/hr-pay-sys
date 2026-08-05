"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Award, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function MyCertificationsPage() {
  const [loading, setLoading] = useState(true)
  const [certs, setCerts] = useState<any[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const meRes = await fetch("/api/self-service/me", { credentials: "include", cache: "no-store" })
      const me = await meRes.json().catch(() => ({}))
      const eid = me?.employee?.id || me?.data?.employee?.id || null

      const res = await fetch("/api/learning", { credentials: "include", cache: "no-store" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to load")
      setCerts((json.certifications || []).filter((c: any) => !eid || c.employee_id === eid))
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Certifications</h1>
          <p className="text-sm text-muted-foreground">Credentials issued and tracked in Learning & Development.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {certs.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
          No certifications on file yet.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {certs.map((c) => (
            <div key={c.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-teal-700" />
                  <p className="font-semibold">{c.name}</p>
                </div>
                <Badge variant="outline" className="capitalize">{c.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{c.issuer || "Issuer not set"}</p>
              <p className="mt-2 text-sm">
                Issued {c.dateIssued || c.date_issued || "—"} · Expires {c.expiryDate || c.expiry_date || "—"}
              </p>
              {c.cpdPoints != null && (
                <p className="mt-1 text-xs text-teal-800">{c.cpdPoints || c.cpd_points || 0} CPD points</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
