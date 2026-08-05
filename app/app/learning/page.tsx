"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Award,
  BookOpen,
  Brain,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type Overview = {
  courses: any[]
  enrollments: any[]
  paths: any[]
  certifications: any[]
  instructors: any[]
  insights: any[]
  employees: { id: string; name: string; code: string; department: string }[]
  stats: {
    activeCourses: number
    totalCourses: number
    enrollments: number
    inProgress: number
    completed: number
    certifications: number
    instructors: number
    avgProgress: number
    paths: number
  }
  charts: {
    byCategory: { category: string; count: number }[]
    statusMix: { status: string; count: number }[]
  }
}

const CHART = ["#0d9488", "#14b8a6", "#f59e0b", "#f97316", "#64748b", "#ef4444"]
const CATEGORIES = ["technical", "leadership", "compliance", "soft-skills"]

function LearningPageInner() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") || "overview"
  const [tab, setTab] = useState(tabParam)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<Overview | null>(null)
  const [search, setSearch] = useState("")

  const [courseOpen, setCourseOpen] = useState(false)
  const [pathOpen, setPathOpen] = useState(false)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [certOpen, setCertOpen] = useState(false)
  const [instructorOpen, setInstructorOpen] = useState(false)

  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    category: "technical",
    type: "online",
    level: "beginner",
    duration: "8",
    instructor: "",
    price: "0",
    learningObjectives: "",
  })
  const [pathForm, setPathForm] = useState({ title: "", description: "", category: "General", difficulty: "beginner", courses: [] as string[] })
  const [enrollForm, setEnrollForm] = useState({ employeeId: "", courseId: "" })
  const [certForm, setCertForm] = useState({
    employeeId: "",
    name: "",
    issuer: "",
    category: "professional",
    validityPeriod: "12",
    cpdPoints: "0",
  })
  const [instructorForm, setInstructorForm] = useState({ name: "", email: "", expertise: "", bio: "" })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/learning", { credentials: "include", cache: "no-store" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to load")
      setData(json as Overview)
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setTab(tabParam)
  }, [tabParam])

  async function postAction(body: Record<string, unknown>) {
    setSaving(true)
    try {
      const res = await fetch("/api/learning", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Save failed")
      toast({ title: "Saved" })
      await load()
      return true
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Save failed", variant: "destructive" })
      return false
    } finally {
      setSaving(false)
    }
  }

  async function generateInsights() {
    setSaving(true)
    try {
      const res = await fetch("/api/learning", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_insights" }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed")
      toast({ title: `Generated ${json.generated ?? 0} AI insights` })
      await load()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const filteredCourses = useMemo(() => {
    const q = search.toLowerCase()
    return (data?.courses || []).filter(
      (c) => !q || String(c.title).toLowerCase().includes(q) || String(c.category).toLowerCase().includes(q),
    )
  }, [data?.courses, search])

  const stats = data?.stats

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Capability</p>
          <h1 className="text-2xl font-bold text-slate-900">Learning & Development</h1>
          <p className="text-sm text-muted-foreground">
            Courses, paths, enrollments, and certifications — synced to the database with AI coverage signals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            className="rounded-xl bg-gradient-to-r from-teal-700 to-emerald-600 text-white hover:from-teal-800 hover:to-emerald-700"
            onClick={() => void generateInsights()}
            disabled={saving}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate AI insights
          </Button>
          <Button className="rounded-xl bg-teal-700 text-white hover:bg-teal-800" onClick={() => setCourseOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New course
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active courses", value: stats?.activeCourses ?? "—", icon: BookOpen },
          { label: "Enrollments", value: stats?.enrollments ?? "—", icon: Users },
          { label: "Completed", value: stats?.completed ?? "—", icon: GraduationCap },
          { label: "Active certs", value: stats?.certifications ?? "—", icon: Award },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-teal-100/80 bg-gradient-to-br from-teal-50/50 to-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
              <card.icon className="h-4 w-4 text-teal-700" />
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-slate-100/80 p-1">
          {[
            ["overview", "Overview"],
            ["courses", "Courses"],
            ["paths", "Paths"],
            ["enrollments", "Enrollments"],
            ["certifications", "Certifications"],
            ["instructors", "Instructors"],
            ["insights", "AI Insights"],
          ].map(([v, l]) => (
            <TabsTrigger key={v} value={v} className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-teal-800">
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold">Courses by category</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts.byCategory || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {(data?.charts.byCategory || []).map((_, i) => (
                        <Cell key={i} fill={CHART[i % CHART.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold">Enrollment status</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts.statusMix || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0d9488" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-muted-foreground">Average learner progress</p>
            <Progress value={Number(stats?.avgProgress) || 0} className="mt-2 h-2" />
            <p className="mt-1 text-right text-xs tabular-nums text-teal-800">{stats?.avgProgress ?? 0}%</p>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search courses…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button size="sm" className="rounded-xl bg-teal-700 text-white hover:bg-teal-800" onClick={() => setCourseOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add course
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No courses yet.</TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell className="capitalize">{c.category}</TableCell>
                      <TableCell className="capitalize">{c.type || c.delivery_type}</TableCell>
                      <TableCell className="tabular-nums">{c.duration || c.duration_hours}</TableCell>
                      <TableCell>{c.instructor || c.instructor_name || "—"}</TableCell>
                      <TableCell className="tabular-nums">{c.enrollments || c.enrollment_count || 0}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{c.status}</Badge></TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => void postAction({ action: "delete", entity: "course", id: c.id })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="paths" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="rounded-xl bg-teal-700 text-white hover:bg-teal-800" onClick={() => setPathOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add path
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(data?.paths || []).length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed py-12 text-center text-muted-foreground">No learning paths yet.</div>
            ) : (
              (data?.paths || []).map((p: any) => (
                <div key={p.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{p.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{p.difficulty} · {p.totalDuration || p.total_duration}h</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => void postAction({ action: "delete", entity: "path", id: p.id })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                  <p className="mt-2 text-xs text-teal-800">{(p.courseTitles || []).join(" → ") || `${(p.courses || []).length} courses`}</p>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="rounded-xl bg-teal-700 text-white hover:bg-teal-800" onClick={() => setEnrollOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Enroll employee
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Cert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.enrollments || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No enrollments yet.</TableCell>
                  </TableRow>
                ) : (
                  (data?.enrollments || []).map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.employeeName || "—"}</TableCell>
                      <TableCell>{e.courseName}</TableCell>
                      <TableCell className="min-w-[120px]">
                        <div className="mb-1 text-xs tabular-nums">{e.progress}%</div>
                        <Progress value={Number(e.progress) || 0} className="h-2" />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{String(e.status).replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">{e.score ?? "—"}</TableCell>
                      <TableCell>{e.certificateIssued ? "Yes" : "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="rounded-xl bg-teal-700 text-white hover:bg-teal-800" onClick={() => setCertOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add certification
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Issuer</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.certifications || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No certifications yet.</TableCell>
                  </TableRow>
                ) : (
                  (data?.certifications || []).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.employeeName || "—"}</TableCell>
                      <TableCell>{c.issuer || "—"}</TableCell>
                      <TableCell>{c.dateIssued || c.date_issued || "—"}</TableCell>
                      <TableCell>{c.expiryDate || c.expiry_date || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{c.status}</Badge></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="instructors" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="rounded-xl bg-teal-700 text-white hover:bg-teal-800" onClick={() => setInstructorOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add instructor
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(data?.instructors || []).length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed py-12 text-center text-muted-foreground">No instructors yet.</div>
            ) : (
              (data?.instructors || []).map((i: any) => (
                <div key={i.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{i.name}</p>
                      <p className="text-xs text-muted-foreground">{i.email || "—"}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => void postAction({ action: "delete", entity: "instructor", id: i.id })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-teal-800">{(i.expertise || []).join(" · ")}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{i.coursesCount} courses · {i.studentsCount} learners</p>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-white p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-teal-700 p-2 text-white"><Brain className="h-5 w-5" /></div>
              <div>
                <p className="font-semibold">AI / ML learning insights</p>
                <p className="text-sm text-muted-foreground">
                  Flags stalled enrollments, expiring certifications, coverage gaps, and catalog balance.
                </p>
              </div>
            </div>
            <Button className="rounded-xl bg-teal-700 text-white hover:bg-teal-800" onClick={() => void generateInsights()} disabled={saving}>
              <Sparkles className="mr-2 h-4 w-4" /> Run analysis
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(data?.insights || []).length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed py-12 text-center text-muted-foreground">No insights yet — click Run analysis.</div>
            ) : (
              (data?.insights || []).map((ins: any) => (
                <div key={ins.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <Badge variant="outline" className="mb-2 capitalize">{ins.insight_type?.replace(/_/g, " ")}</Badge>
                  <p className="font-semibold">{ins.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{ins.body}</p>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Course dialog */}
      <Dialog open={courseOpen} onOpenChange={setCourseOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New course</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Title</Label>
              <Input value={courseForm.title} onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={courseForm.category} onValueChange={(v) => setCourseForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Delivery</Label>
              <Select value={courseForm.type} onValueChange={(v) => setCourseForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["online", "virtual", "classroom", "blended"].map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select value={courseForm.level} onValueChange={(v) => setCourseForm((f) => ({ ...f, level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["beginner", "intermediate", "advanced"].map((l) => (
                    <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Duration (hours)</Label>
              <Input type="number" value={courseForm.duration} onChange={(e) => setCourseForm((f) => ({ ...f, duration: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Instructor</Label>
              <Input value={courseForm.instructor} onChange={(e) => setCourseForm((f) => ({ ...f, instructor: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Price (GHS)</Label>
              <Input type="number" value={courseForm.price} onChange={(e) => setCourseForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} value={courseForm.description} onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Learning objectives (one per line)</Label>
              <Textarea rows={3} value={courseForm.learningObjectives} onChange={(e) => setCourseForm((f) => ({ ...f, learningObjectives: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={saving || !courseForm.title}
              onClick={async () => {
                const ok = await postAction({
                  action: "course",
                  ...courseForm,
                  duration: Number(courseForm.duration),
                  price: Number(courseForm.price),
                  learningObjectives: courseForm.learningObjectives,
                })
                if (ok) setCourseOpen(false)
              }}
            >
              Save course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Path */}
      <Dialog open={pathOpen} onOpenChange={setPathOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New learning path</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={pathForm.title} onChange={(e) => setPathForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} value={pathForm.description} onChange={(e) => setPathForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Courses (hold Ctrl/Cmd to multi-select)</Label>
              <select
                multiple
                className="h-32 w-full rounded-md border px-2 py-1 text-sm"
                value={pathForm.courses}
                onChange={(e) =>
                  setPathForm((f) => ({
                    ...f,
                    courses: Array.from(e.target.selectedOptions).map((o) => o.value),
                  }))
                }
              >
                {(data?.courses || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPathOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={saving || !pathForm.title}
              onClick={async () => {
                const ok = await postAction({ action: "path", ...pathForm })
                if (ok) setPathOpen(false)
              }}
            >
              Save path
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Enroll employee</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select value={enrollForm.employeeId} onValueChange={(v) => setEnrollForm((f) => ({ ...f, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {(data?.employees || []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select value={enrollForm.courseId} onValueChange={(v) => setEnrollForm((f) => ({ ...f, courseId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {(data?.courses || []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={saving || !enrollForm.employeeId || !enrollForm.courseId}
              onClick={async () => {
                const ok = await postAction({ action: "enrollment", ...enrollForm })
                if (ok) setEnrollOpen(false)
              }}
            >
              Enroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cert */}
      <Dialog open={certOpen} onOpenChange={setCertOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add certification</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select value={certForm.employeeId} onValueChange={(v) => setCertForm((f) => ({ ...f, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {(data?.employees || []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={certForm.name} onChange={(e) => setCertForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Issuer</Label>
              <Input value={certForm.issuer} onChange={(e) => setCertForm((f) => ({ ...f, issuer: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Validity (months)</Label>
                <Input type="number" value={certForm.validityPeriod} onChange={(e) => setCertForm((f) => ({ ...f, validityPeriod: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>CPD points</Label>
                <Input type="number" value={certForm.cpdPoints} onChange={(e) => setCertForm((f) => ({ ...f, cpdPoints: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={saving || !certForm.name}
              onClick={async () => {
                const ok = await postAction({
                  action: "certification",
                  ...certForm,
                  validityPeriod: Number(certForm.validityPeriod),
                  cpdPoints: Number(certForm.cpdPoints),
                })
                if (ok) setCertOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instructor */}
      <Dialog open={instructorOpen} onOpenChange={setInstructorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add instructor</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={instructorForm.name} onChange={(e) => setInstructorForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={instructorForm.email} onChange={(e) => setInstructorForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Expertise (comma-separated)</Label>
              <Input value={instructorForm.expertise} onChange={(e) => setInstructorForm((f) => ({ ...f, expertise: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea rows={3} value={instructorForm.bio} onChange={(e) => setInstructorForm((f) => ({ ...f, bio: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstructorOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={saving || !instructorForm.name}
              onClick={async () => {
                const ok = await postAction({
                  action: "instructor",
                  name: instructorForm.name,
                  email: instructorForm.email,
                  bio: instructorForm.bio,
                  expertise: instructorForm.expertise,
                })
                if (ok) setInstructorOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function LearningPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading learning…</div>}>
      <LearningPageInner />
    </Suspense>
  )
}
