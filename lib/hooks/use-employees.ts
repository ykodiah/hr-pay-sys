"use client"

import useSWR from "swr"
import type { EmployeeDto } from "@/lib/employees/dto"

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || "Failed to load employees")
  return json
}

export function useEmployees(options?: {
  companyId?: string
  status?: string
  q?: string
  includeFinancial?: boolean
  limit?: number
  enabled?: boolean
}) {
  const enabled = options?.enabled !== false
  const params = new URLSearchParams()
  if (options?.companyId) params.set("company_id", options.companyId)
  if (options?.status) params.set("status", options.status)
  if (options?.q) params.set("q", options.q)
  if (options?.includeFinancial) params.set("include_financial", "true")
  if (options?.limit) params.set("limit", String(options.limit))

  const key = enabled ? `/api/employees?${params.toString()}` : null
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 3000,
  })

  const employees: EmployeeDto[] = data?.employees ?? data?.data ?? []

  return {
    employees,
    meta: data?.meta,
    error,
    isLoading,
    mutate,
  }
}

export function useEmployeeOptions(companyId?: string) {
  return useEmployees({
    companyId,
    status: "active",
    limit: 500,
    enabled: Boolean(companyId),
  })
}
