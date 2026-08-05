import { approvalMatrix, computeSalaryDelta, evaluateEligibility, PromotionCase } from "@/lib/promotions"

import { httpRequest, isApiError } from "./http-client"

export type PromotionEmployeeProfile = {
  id: string
  name: string
  department: string
  grade: string
  step: number
  tenureMonths: number
  appraisalScore: number
  trainingCompleted: boolean
  hasDisciplinary: boolean
  supervisor: string
  headOfDepartment: string
  _uuid?: string
}

/** Fallback only when DB has no employees yet. */
const FALLBACK_EMPLOYEES: PromotionEmployeeProfile[] = []

let cachedEmployees: PromotionEmployeeProfile[] = []
let promotionStore: PromotionCase[] = []

const PROMOTIONS_API_BASE = (process.env.NEXT_PUBLIC_PROMOTIONS_API_URL ?? "/promotions").replace(/\/$/, "")

function promotionsEndpoint(path = "") {
  return `${PROMOTIONS_API_BASE}${path}`
}

function monthsSince(dateStr?: string | null): number {
  if (!dateStr) return 12
  const start = new Date(dateStr)
  if (Number.isNaN(start.getTime())) return 12
  const now = new Date()
  return Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()))
}

/** Load active employees — prefer promotions API (enriched eligibility), fallback to /api/employees. */
export async function loadPromotionEmployees(companyId?: string): Promise<PromotionEmployeeProfile[]> {
  try {
    const enriched = await httpRequest<{ data?: PromotionEmployeeProfile[]; employees?: PromotionEmployeeProfile[] }>(
      `${promotionsEndpoint()}?view=employees`,
      { method: "GET" },
    )
    const rows = enriched?.employees ?? enriched?.data ?? []
    if (Array.isArray(rows) && rows.length) {
      cachedEmployees = rows
      return cachedEmployees
    }
  } catch {
    /* fall through */
  }

  try {
    const params = new URLSearchParams({ status: "active", limit: "500", options: "true" })
    if (companyId) params.set("company_id", companyId)
    const res = await fetch(`/api/employees?${params}`, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to load employees")
    const json = await res.json()
    const rows = json.employees ?? json.data ?? []
    cachedEmployees = rows.map((emp: any) => ({
      id: emp.employee_id || emp.id,
      name: emp.full_name || `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim(),
      department: emp.department || "General",
      grade: emp.grade || "G6",
      step: Number(emp.step ?? 1),
      tenureMonths: monthsSince(emp.date_of_joining),
      appraisalScore: Number(emp.appraisal_score ?? 3.5),
      trainingCompleted: Boolean(emp.training_completed ?? false),
      hasDisciplinary: Boolean(emp.has_disciplinary ?? false),
      supervisor: emp.direct_supervisor || "—",
      headOfDepartment: emp.head_of_department || "—",
      _uuid: emp.id,
    }))
    return cachedEmployees
  } catch {
    return cachedEmployees.length ? cachedEmployees : FALLBACK_EMPLOYEES
  }
}

export function getPromotionEmployees() {
  return cachedEmployees.length ? cachedEmployees : FALLBACK_EMPLOYEES
}

function getApproverName(role: string) {
  const directory: Record<string, string> = {
    "Line Manager": "Ama Koomson",
    "Head of Department": "Kwesi Nyarko",
    "HR Director": "Efua Bediako",
    "Finance Director": "Yaw Sarfo",
    "Managing Director": "Nana Akoto",
  }
  return directory[role] ?? role
}

/** @deprecated Seeds removed — DB is source of truth. Kept for type compatibility. */
export function buildSeedPromotionCases(): PromotionCase[] {
  return []
}

export async function listPromotionCases(): Promise<PromotionCase[]> {
  try {
    const payload = await httpRequest<{ data: PromotionCase[] }>(promotionsEndpoint(), { method: "GET" })
    if (Array.isArray(payload?.data)) {
      promotionStore = payload.data
      return structuredClone(promotionStore)
    }
  } catch (error) {
    if (!isApiError(error)) {
      console.warn("Promotion API error", error)
    }
  }
  return structuredClone(promotionStore)
}

export async function createPromotionCase(casePayload: PromotionCase): Promise<PromotionCase> {
  try {
    const payload = await httpRequest<{ data: PromotionCase }>(promotionsEndpoint(), {
      method: "POST",
      body: JSON.stringify(casePayload),
    })
    if (payload?.data) {
      promotionStore = [payload.data, ...promotionStore.filter((item) => item.id !== payload.data.id)]
      return payload.data
    }
  } catch (error) {
    if (!isApiError(error)) {
      console.warn("Promotion create fallback", error)
    }
  }

  promotionStore = [casePayload, ...promotionStore]
  return casePayload
}

export async function persistPromotionCase(caseRecord: PromotionCase): Promise<void> {
  try {
    await httpRequest(promotionsEndpoint(`/${caseRecord.id}`), {
      method: "PUT",
      body: JSON.stringify(caseRecord),
    })
  } catch (error) {
    if (!isApiError(error)) {
      console.warn("Promotion update fallback", error)
    }
  } finally {
    promotionStore = promotionStore.map((entry) => (entry.id === caseRecord.id ? caseRecord : entry))
  }
}

export async function generatePromotionInsights(): Promise<{ generated: number }> {
  try {
    const payload = await httpRequest<{ generated?: number }>(promotionsEndpoint(), {
      method: "POST",
      body: JSON.stringify({ action: "generate_insights" }),
    })
    return { generated: payload?.generated ?? 0 }
  } catch {
    return { generated: 0 }
  }
}

export { evaluateEligibility, computeSalaryDelta, approvalMatrix, getApproverName }
