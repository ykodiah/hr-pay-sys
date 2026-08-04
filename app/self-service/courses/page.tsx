"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function MyCoursesPage() {
  const [loading, setLoading] = useState(true)
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [catalog, setCatalog] = useState<any[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const meRes = await fetch("/api/self-service/me", { credentials: "include", cache: "no-store" })
      const me = await meRes.json().catch(() => ({}))
      const eid = me?.employee?.id || me?.data?.employee?.id || null
      setEmployeeId(eid)

      const res = await fetch("/api/learning", { credentials: "include", cache: "no-store" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to load")
      setCatalog(json.courses || [])
      setEnrollments((json.enrollments || []).filter((e: any) => e.employee_id === eid))
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function enroll(courseId: string) {
    if (!employeeId) return
    try {
      const res = await fetch("/api/learning", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enrollment", employeeId, courseId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Enroll failed")
      toast({ title: "Enrolled" })
      await load()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed", variant: "destructive" })
    }
  }

  const enrolledIds = new Set(enrollments.map((e) => e.course_id))

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-sm text-muted-foreground">Track enrollments and browse the learning catalog.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-800">My enrollments</h2>
        {enrollments.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-10 text-center text-muted-foreground">No enrollments yet.</div>
        ) : (
          enrollments.map((e) => (
            <div key={e.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-teal-700" />
                  <p className="font-semibold">{e.courseName}</p>
                </div>
                <Badge variant="outline" className="capitalize">{String(e.status).replace(/_/g, " ")}</Badge>
              </div>
              <Progress value={Number(e.progress) || 0} className="mt-3 h-2" />
              <p className="mt-1 text-right text-xs tabular-nums">{e.progress || 0}%</p>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-800">Catalog</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {catalog
            .filter((c) => c.status === "active")
            .map((c) => (
              <div key={c.id} className="rounded-2xl border p-4">
                <p className="font-semibold">{c.title}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {c.category} · {c.duration || c.duration_hours}h · {c.type || c.delivery_type}
                </p>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                <Button
                  size="sm"
                  className="mt-3 bg-teal-700 text-white hover:bg-teal-800"
                  disabled={enrolledIds.has(c.id) || !employeeId}
                  onClick={() => void enroll(c.id)}
                >
                  {enrolledIds.has(c.id) ? "Enrolled" : "Enroll"}
                </Button>
              </div>
            ))}
        </div>
      </section>
    </div>
  )
}
