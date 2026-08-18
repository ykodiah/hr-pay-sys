"use client"

import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Award, RefreshCw, AlertTriangle } from "lucide-react"
import { fetcher } from "@/lib/self-service/use-portal"
import { EmptyState, ErrorBlock, LoadingBlock } from "@/components/self-service/portal-ui"

export default function MyCertificationsPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/self-service/learning", fetcher)
  const certs = data?.certifications || []

  if (isLoading) return <LoadingBlock label="Loading certifications" rows={3} />
  if (error) return <ErrorBlock message={error.message} onRetry={() => mutate()} />

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Certifications</h1>
          <p className="text-sm text-slate-500">Credentials issued and tracked in Learning &amp; Development.</p>
        </div>
        <Button variant="outline" onClick={() => mutate()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {certs.length === 0 ? (
        <EmptyState icon={Award} title="No certifications on file yet" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {certs.map((c: any) => (
            <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-teal-700" />
                  <p className="font-semibold text-slate-900">{c.name}</p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {c.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">{c.issuer || "Issuer not set"}</p>
              <p className="mt-2 text-sm text-slate-600">
                Issued {c.date_issued ? new Date(c.date_issued).toLocaleDateString() : "—"} · Expires{" "}
                {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : "—"}
              </p>
              {(c.expired || c.expiring_soon) && (
                <p className={`mt-1 flex items-center gap-1 text-xs ${c.expired ? "text-red-600" : "text-amber-600"}`}>
                  <AlertTriangle className="h-3 w-3" /> {c.expired ? "Expired" : "Expiring within 90 days"}
                </p>
              )}
              {c.cpd_points != null && <p className="mt-1 text-xs text-teal-800">{c.cpd_points || 0} CPD points</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
