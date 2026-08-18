"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Inbox } from "lucide-react"
import { statusTone } from "@/lib/self-service/use-portal"

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>}
      </div>
      {action}
    </header>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: React.ComponentType<{ className?: string }>
  tone?: "default" | "positive" | "warning" | "critical"
}) {
  const tones: Record<string, string> = {
    default: "text-slate-900",
    positive: "text-emerald-600",
    warning: "text-amber-600",
    critical: "text-rose-600",
  }
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className={`mt-2 truncate text-2xl font-semibold ${tones[tone]}`}>{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <span className="rounded-lg bg-slate-100 p-2 text-slate-600">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </CardContent>
    </Card>
  )
}

export function StatusBadge({ status }: { status?: string | null }) {
  const label = String(status || "unknown").replace(/_/g, " ")
  return (
    <Badge variant="outline" className={`capitalize ${statusTone(status)}`}>
      {label}
    </Badge>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white p-12 text-center">
      <Icon className="h-8 w-8 text-slate-300" />
      <p className="font-medium text-slate-900">{title}</p>
      {description && <p className="max-w-md text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  )
}

export function LoadingBlock({ rows = 3, label }: { rows?: number; label?: string }) {
  return (
    <div className="flex flex-col gap-3">
      {label && <p className="text-sm text-slate-500">{label}…</p>}
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  )
}

export function ErrorBlock({
  error,
  message,
  onRetry,
}: {
  error?: { message?: string } | null
  message?: string
  onRetry?: () => void
}) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>{message || error?.message || "Something went wrong"}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-current px-2 py-1 text-xs font-medium"
          >
            Retry
          </button>
        )}
      </AlertDescription>
    </Alert>
  )
}
