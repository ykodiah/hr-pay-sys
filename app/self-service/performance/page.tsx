"use client"

import { useState } from "react"
import useSWR from "swr"
import { Star, Target, Award, ClipboardCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { fetcher, patchJson, formatDate } from "@/lib/self-service/use-portal"
import {
  PageHeader,
  StatCard,
  StatusBadge,
  EmptyState,
  LoadingBlock,
  ErrorBlock,
} from "@/components/self-service/portal-ui"

type Review = {
  id: string
  review_period_start: string | null
  review_period_end: string | null
  review_type: string | null
  status: string | null
  overall_rating: number | null
  overall_score: number | null
  rating: number | null
  strengths: string | null
  areas_for_improvement: string | null
  comments: string | null
  submitted_at: string | null
}

type Competency = {
  id: string
  competency_name: string | null
  rating: number | null
  max_rating: number | null
  comments: string | null
}

type Goal = {
  id: string
  title: string | null
  status: string | null
  progress: number | null
  due_date: string | null
  category: string | null
}

type PerformanceResponse = {
  reviews: Review[]
  competencies: Competency[]
  goals: Goal[]
  summary: {
    total_reviews: number
    average_rating: number | null
    latest: Review | null
    awaiting_self_assessment: number
  }
}

function ratingOf(review: Review) {
  return Number(review.overall_rating ?? review.overall_score ?? review.rating ?? 0)
}

function isOpen(review: Review) {
  return !["approved", "completed", "closed"].includes(String(review.status || "").toLowerCase())
}

export default function PerformancePage() {
  const { data, error, isLoading, mutate } = useSWR<PerformanceResponse>(
    "/api/self-service/performance",
    fetcher,
  )

  const [active, setActive] = useState<Review | null>(null)
  const [comments, setComments] = useState("")
  const [saving, setSaving] = useState(false)

  const reviews = data?.reviews ?? []
  const competencies = data?.competencies ?? []
  const goals = data?.goals ?? []
  const summary = data?.summary

  function openSelfAssessment(review: Review) {
    setActive(review)
    setComments(review.comments || "")
  }

  async function submitSelfAssessment() {
    if (!active) return
    if (!comments.trim()) {
      toast.error("Add your self-assessment before submitting")
      return
    }
    setSaving(true)
    try {
      await patchJson("/api/self-service/performance", { id: active.id, comments })
      toast.success("Self-assessment submitted")
      setActive(null)
      setComments("")
      mutate()
    } catch (e: any) {
      toast.error(e?.message || "Could not submit self-assessment")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <LoadingBlock label="Loading performance data" />
  if (error) return <ErrorBlock message={(error as Error).message} onRetry={() => mutate()} />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My performance"
        description="Review cycles, competency ratings and the goals you are measured on."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Average rating"
          value={summary?.average_rating != null ? summary.average_rating.toFixed(2) : "—"}
          icon={Star}
        />
        <StatCard label="Reviews on record" value={String(summary?.total_reviews ?? 0)} icon={ClipboardCheck} />
        <StatCard
          label="Awaiting your input"
          value={String(summary?.awaiting_self_assessment ?? 0)}
          icon={ClipboardCheck}
          tone={summary?.awaiting_self_assessment ? "warning" : "default"}
        />
        <StatCard label="Tracked goals" value={String(goals.length)} icon={Target} />
      </div>

      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="competencies">Competencies</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-4 flex flex-col gap-4">
          {reviews.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No reviews yet"
              description="Once your first review cycle opens, it will appear here with your ratings and feedback."
            />
          ) : (
            reviews.map((review) => {
              const rating = ratingOf(review)
              return (
                <Card key={review.id}>
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base capitalize">
                        {review.review_type ? `${review.review_type} review` : "Performance review"}
                      </CardTitle>
                      <CardDescription>
                        {formatDate(review.review_period_start)} — {formatDate(review.review_period_end)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={review.status} />
                      {rating > 0 ? (
                        <span className="flex items-center gap-1 text-sm font-semibold text-card-foreground">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          {rating.toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {review.strengths ? (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Strengths
                        </p>
                        <p className="mt-1 text-sm text-card-foreground">{review.strengths}</p>
                      </div>
                    ) : null}
                    {review.areas_for_improvement ? (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Areas to develop
                        </p>
                        <p className="mt-1 text-sm text-card-foreground">{review.areas_for_improvement}</p>
                      </div>
                    ) : null}
                    {review.comments ? (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Your self-assessment
                        </p>
                        <p className="mt-1 text-sm text-card-foreground">{review.comments}</p>
                      </div>
                    ) : null}
                    {isOpen(review) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="self-start"
                        onClick={() => openSelfAssessment(review)}
                      >
                        {review.comments ? "Edit self-assessment" : "Add self-assessment"}
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="competencies" className="mt-4">
          {competencies.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No competency assessments"
              description="Competency scores appear here once a reviewer completes your assessment."
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                {competencies.map((c) => {
                  const max = Number(c.max_rating || 5)
                  const value = Number(c.rating || 0)
                  return (
                    <div key={c.id} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-card-foreground">
                          {c.competency_name || "Competency"}
                        </span>
                        <span className="text-muted-foreground">
                          {value.toFixed(1)} / {max}
                        </span>
                      </div>
                      <Progress value={max ? (value / max) * 100 : 0} />
                      {c.comments ? <p className="text-xs text-muted-foreground">{c.comments}</p> : null}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          {goals.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No goals assigned"
              description="Goals set by your manager for this review cycle will be listed here."
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-5 p-6">
                {goals.map((goal) => {
                  const progress = Number(goal.progress || 0)
                  return (
                    <div key={goal.id} className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-card-foreground">{goal.title}</span>
                        <StatusBadge status={goal.status} />
                      </div>
                      <Progress value={progress} />
                      <p className="text-xs text-muted-foreground">
                        {goal.category || "Uncategorised"}
                        {goal.due_date ? ` · due ${formatDate(goal.due_date)}` : ""} · {progress}% complete
                      </p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(active)} onOpenChange={(next) => !next && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Self-assessment</DialogTitle>
            <DialogDescription>
              Share your own view of this review period. Your reviewer sees this before finalising.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="self-assessment">Your comments</Label>
            <Textarea
              id="self-assessment"
              rows={6}
              placeholder="What went well, what was challenging, and what support would help?"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submitSelfAssessment} disabled={saving}>
              {saving ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
