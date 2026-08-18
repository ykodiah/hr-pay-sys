"use client"

import { useState } from "react"
import useSWR from "swr"
import { Target, Plus, CheckCircle2, TrendingUp, Trash2, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { fetcher, postJson, patchJson, portalMutate, formatDate } from "@/lib/self-service/use-portal"
import {
  PageHeader,
  StatCard,
  StatusBadge,
  EmptyState,
  LoadingBlock,
  ErrorBlock,
} from "@/components/self-service/portal-ui"

type Goal = {
  id: string
  title: string | null
  progress: number | null
  status: string | null
  due_date: string | null
  created_at: string | null
}

type AssignedGoal = {
  id: string
  title: string | null
  description: string | null
  category: string | null
  priority: string | null
  status: string | null
  progress: number | null
  target_value: number | null
  current_value: number | null
  unit: string | null
  due_date: string | null
  end_date: string | null
}

type GoalsResponse = {
  goals: Goal[]
  assigned_goals: AssignedGoal[]
  summary: { total: number; completed: number; in_progress: number; average_progress: number }
}

export default function GoalsPage() {
  const { data, error, isLoading, mutate } = useSWR<GoalsResponse>("/api/self-service/goals", fetcher)

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", due_date: "" })

  const goals = data?.goals ?? []
  const assigned = data?.assigned_goals ?? []
  const summary = data?.summary

  function resetForm() {
    setForm({ title: "", due_date: "" })
  }

  async function createGoal() {
    if (!form.title.trim()) {
      toast.error("Give the goal a title")
      return
    }
    setSaving(true)
    try {
      await postJson("/api/self-service/goals", {
        title: form.title,
        due_date: form.due_date,
        status: "not_started",
      })
      toast.success("Goal created")
      setOpen(false)
      resetForm()
      mutate()
    } catch (e: any) {
      toast.error(e?.message || "Could not create goal")
    } finally {
      setSaving(false)
    }
  }

  async function updateProgress(goal: Goal, progress: number) {
    setBusyId(goal.id)
    try {
      await patchJson("/api/self-service/goals", {
        id: goal.id,
        progress,
        status: progress >= 100 ? "completed" : "in_progress",
      })
      mutate()
    } catch (e: any) {
      toast.error(e?.message || "Could not update goal")
    } finally {
      setBusyId(null)
    }
  }

  async function removeGoal(id: string) {
    setBusyId(id)
    try {
      await portalMutate(`/api/self-service/goals?id=${encodeURIComponent(id)}`, "DELETE")
      toast.success("Goal removed")
      mutate()
    } catch (e: any) {
      toast.error(e?.message || "Could not remove goal")
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading) return <LoadingBlock label="Loading your goals" />
  if (error) return <ErrorBlock message={(error as Error).message} onRetry={() => mutate()} />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My goals"
        description="Track goals your manager assigned and the personal ones you set for yourself."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New goal
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total goals" value={String(summary?.total ?? 0)} icon={Target} />
        <StatCard label="In progress" value={String(summary?.in_progress ?? 0)} icon={TrendingUp} />
        <StatCard
          label="Completed"
          value={String(summary?.completed ?? 0)}
          icon={CheckCircle2}
          tone="positive"
        />
        <StatCard label="Average progress" value={`${summary?.average_progress ?? 0}%`} icon={TrendingUp} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Assigned by your manager</h2>
        {assigned.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No assigned goals"
            description="When your manager sets performance goals for you, they appear here."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {assigned.map((goal) => {
              const progress = Number(goal.progress || 0)
              return (
                <div key={goal.id} className="rounded-lg border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-sm font-semibold text-card-foreground">{goal.title}</h3>
                        <StatusBadge status={goal.status} />
                        {goal.priority ? (
                          <span className="text-xs capitalize text-muted-foreground">
                            {goal.priority} priority
                          </span>
                        ) : null}
                      </div>
                      {goal.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {goal.category || "Uncategorised"}
                        {goal.due_date || goal.end_date
                          ? ` · due ${formatDate(goal.due_date || goal.end_date)}`
                          : ""}
                      </p>
                    </div>
                    {goal.target_value ? (
                      <div className="text-right text-xs text-muted-foreground">
                        <p className="text-sm font-semibold text-card-foreground">
                          {Number(goal.current_value || 0)} / {Number(goal.target_value)}
                        </p>
                        <p>{goal.unit || "units"}</p>
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-medium text-card-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} />
                    <p className="text-xs text-muted-foreground">
                      Progress on assigned goals is updated by your manager during reviews.
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-900">My personal goals</h2>
        {goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No personal goals yet"
            description="Create your first development goal to track what you are working towards this cycle."
            action={
              <Button onClick={() => setOpen(true)} className="mt-2">
                <Plus className="mr-2 h-4 w-4" />
                Create a goal
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {goals.map((goal) => {
              const progress = Number(goal.progress || 0)
              return (
                <div key={goal.id} className="rounded-lg border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-sm font-semibold text-card-foreground">{goal.title}</h3>
                        <StatusBadge status={goal.status} />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {goal.due_date ? `Due ${formatDate(goal.due_date)}` : "No target date"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGoal(goal.id)}
                      disabled={busyId === goal.id}
                      aria-label={`Delete goal ${goal.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-medium text-card-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} />
                    <div className="mt-1 flex flex-wrap gap-2">
                      {[0, 25, 50, 75, 100].map((step) => (
                        <Button
                          key={step}
                          size="sm"
                          variant={progress === step ? "default" : "outline"}
                          disabled={busyId === goal.id}
                          onClick={() => updateProgress(goal, step)}
                        >
                          {step}%
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) resetForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a goal</DialogTitle>
            <DialogDescription>
              Personal goals are visible to you and your manager, and feed into your performance reviews.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-title">Title *</Label>
              <Input
                id="goal-title"
                placeholder="e.g. Complete payroll compliance training"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-date">Target date</Label>
              <Input
                id="goal-date"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={createGoal} disabled={saving}>
              {saving ? "Creating..." : "Create goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
