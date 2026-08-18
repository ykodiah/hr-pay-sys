"use client"

import { useState } from "react"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, RefreshCw, GraduationCap, ShieldCheck, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { fetcher, postJson, patchJson } from "@/lib/self-service/use-portal"
import { EmptyState, ErrorBlock, LoadingBlock } from "@/components/self-service/portal-ui"

export default function MyCoursesPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/self-service/learning", fetcher)
  const [busyId, setBusyId] = useState<string | null>(null)

  const myCourses = data?.my_courses || []
  const available = data?.available_courses || []
  const certs = data?.certifications || []
  const summary = data?.summary || { enrolled: 0, completed: 0, hours: 0, certifications: 0 }

  async function enroll(courseId: string) {
    setBusyId(courseId)
    try {
      await postJson("/api/self-service/learning", { course_id: courseId })
      toast({ title: "Enrolled", description: "Added to your course list." })
      await mutate()
    } catch (e: any) {
      toast({ title: "Enroll failed", description: e?.message, variant: "destructive" })
    } finally {
      setBusyId(null)
    }
  }

  async function updateProgress(id: string, progress: number) {
    setBusyId(id)
    try {
      await patchJson("/api/self-service/learning", { id, progress })
      await mutate()
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message, variant: "destructive" })
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading) return <LoadingBlock label="Loading your courses" rows={4} />
  if (error) return <ErrorBlock message={error.message} onRetry={() => mutate()} />

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
          <p className="text-sm text-slate-500">Track enrollments, certifications, and browse the learning catalog.</p>
        </div>
        <Button variant="outline" onClick={() => mutate()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Enrolled" value={summary.enrolled} />
        <StatCard label="Completed" value={summary.completed} />
        <StatCard label="Hours logged" value={summary.hours} />
        <StatCard label="Certifications" value={summary.certifications} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-800">My enrollments</h2>
        {myCourses.length === 0 ? (
          <EmptyState icon={BookOpen} title="No enrollments yet" description="Enroll in a course from the catalog below." />
        ) : (
          <div className="space-y-3">
            {myCourses.map((e: any) => (
              <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-teal-700" />
                    <p className="font-semibold text-slate-900">{e.title}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {String(e.status).replace(/_/g, " ")}
                  </Badge>
                </div>
                <Progress value={Number(e.progress) || 0} className="mt-3 h-2" />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs tabular-nums text-slate-500">{e.progress || 0}% complete</p>
                  {e.status !== "completed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === e.id}
                      onClick={() => updateProgress(e.id, Math.min(100, (Number(e.progress) || 0) + 25))}
                    >
                      Log progress
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-800">Certifications</h2>
        {certs.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No certifications on file" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {certs.map((c: any) => (
              <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-700" />
                  <p className="font-semibold text-slate-900">{c.name || c.certification_name}</p>
                </div>
                {c.expiry_date && (
                  <p className={`mt-1 flex items-center gap-1 text-xs ${c.expired ? "text-red-600" : c.expiring_soon ? "text-amber-600" : "text-slate-500"}`}>
                    {(c.expired || c.expiring_soon) && <AlertTriangle className="h-3 w-3" />}
                    {c.expired ? "Expired" : c.expiring_soon ? "Expiring soon" : "Valid until"} {new Date(c.expiry_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-800">Catalog</h2>
        {available.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No courses available right now" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {available.map((c: any) => (
              <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-900">{c.title}</p>
                <p className="text-xs capitalize text-slate-500">
                  {c.category} · {c.duration_hours}h · {c.delivery_type}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{c.description}</p>
                <Button
                  size="sm"
                  className="mt-3 bg-teal-700 text-white hover:bg-teal-800"
                  disabled={busyId === c.id}
                  onClick={() => enroll(c.id)}
                >
                  Enroll
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
