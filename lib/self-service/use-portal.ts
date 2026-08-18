"use client"

import useSWR from "swr"

export async function portalFetcher(url: string) {
  const res = await fetch(url, { credentials: "include" })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(body?.error || "Request failed") as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return body
}

/** POST/PATCH/DELETE helper that surfaces the server's error message. */
export async function portalMutate<T = any>(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  payload?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.error || "Request failed")
  return body as T
}

/** Convenience aliases used across the portal pages. */
export const fetcher = portalFetcher
export const postJson = <T = any,>(url: string, payload?: unknown) => portalMutate<T>(url, "POST", payload)
export const patchJson = <T = any,>(url: string, payload?: unknown) => portalMutate<T>(url, "PATCH", payload)
export const deleteJson = <T = any,>(url: string, payload?: unknown) => portalMutate<T>(url, "DELETE", payload)

const options = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 30_000,
  keepPreviousData: true,
  shouldRetryOnError: false,
}

export function usePortalMe() {
  return useSWR("/api/self-service/me", portalFetcher, options)
}

export function usePortalResource<T = any>(path: string | null) {
  return useSWR<T>(path, portalFetcher, options)
}

export function formatMoney(value: unknown, currency = "GHS") {
  const num = Number(value || 0)
  return `${currency} ${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
}

export function relativeTime(value?: string | null) {
  if (!value) return ""
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return ""
  const diff = Date.now() - then
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(value)
}

export function statusTone(status?: string | null) {
  const s = String(status || "").toLowerCase()
  if (["approved", "active", "completed", "paid", "resolved", "issued"].includes(s)) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200"
  }
  if (["pending", "in_progress", "initiated", "open", "enrolled", "invited"].includes(s)) {
    return "bg-amber-50 text-amber-700 border-amber-200"
  }
  if (["rejected", "cancelled", "withdrawn", "suspended", "disabled", "expired"].includes(s)) {
    return "bg-rose-50 text-rose-700 border-rose-200"
  }
  return "bg-slate-100 text-slate-700 border-slate-200"
}
