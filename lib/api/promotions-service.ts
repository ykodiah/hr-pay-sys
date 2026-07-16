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

/** Load active employees from DB via shared employees API. */
export async function loadPromotionEmployees(companyId?: string): Promise<PromotionEmployeeProfile[]> {
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
      trainingCompleted: Boolean(emp.training_completed ?? true),
      hasDisciplinary: Boolean(emp.has_disciplinary ?? false),
      supervisor: emp.direct_supervisor || "—",
      headOfDepartment: emp.head_of_department || "—",
      _uuid: emp.id,
    }))
    if (!promotionStore.length && cachedEmployees.length) {
      promotionStore = buildSeedPromotionCases()
    }
    return cachedEmployees
  } catch {
    return cachedEmployees.length ? cachedEmployees : FALLBACK_EMPLOYEES
  }
}

export function getPromotionEmployees() {
  return cachedEmployees.length ? cachedEmployees : FALLBACK_EMPLOYEES
}

export function buildSeedPromotionCases(): PromotionCase[] {
  const source = cachedEmployees.length ? cachedEmployees : FALLBACK_EMPLOYEES
  if (source.length < 1) return []
  const ama = source[0]
  const kofi = source[1] ?? source[0]

  const amaEligibility = evaluateEligibility(
    ama.grade,
    ama.step,
    ama.tenureMonths,
    ama.appraisalScore,
    ama.trainingCompleted,
    ama.hasDisciplinary,
    false,
  )
  const amaDelta = computeSalaryDelta(ama.grade, ama.step, "G8", 1)

  const kofiEligibility = evaluateEligibility(
    kofi.grade,
    kofi.step,
    kofi.tenureMonths,
    kofi.appraisalScore,
    kofi.trainingCompleted,
    kofi.hasDisciplinary,
    false,
  )
  const kofiDelta = computeSalaryDelta(kofi.grade, kofi.step, "G7", 2)

  return [
    {      id: "PC-2025-001",
      employeeId: ama.id,
      employeeName: ama.name,
      department: ama.department,
      fromGrade: ama.grade,
      fromStep: ama.step,
      toGrade: "G8",
      toStep: 1,
      effectiveDate: "2025-03-01",
      reason: "Leadership programme completion and 2024 performance rating above threshold.",
      status: "in-review",
      initiatedBy: "John Doe",
      initiatedAt: "2025-01-20",
      attachments: ["appraisal-summary-2024.pdf", "leadership-certificate.pdf"],
      eligibility: amaEligibility,
      approvals: approvalMatrix.map((entry, index) => ({
        stage: entry.stage,
        role: entry.role,
        approverName: getApproverName(entry.role),
        status: index === 0 ? "pending" : "pending",
      })),
      compensationDelta: {
        currentBase: amaDelta.currentBase,
        proposedBase: amaDelta.proposedBase,
        currency: amaDelta.currency,
      },
    },
    {
      id: "PC-2025-002",
      employeeId: kofi.id,
      employeeName: kofi.name,
      department: kofi.department,
      fromGrade: kofi.grade,
      fromStep: kofi.step,
      toGrade: "G7",
      toStep: 2,
      effectiveDate: "2025-02-15",
      reason: "Exceeded sales targets for three consecutive quarters and mentoring contributions.",
      status: "approved",
      initiatedBy: "Jane Smith",
      initiatedAt: "2025-01-10",
      attachments: ["sales-report-q4.pdf", "mentorship-feedback.pdf"],
      eligibility: kofiEligibility,
      approvals: approvalMatrix.map((entry) => ({
        stage: entry.stage,
        role: entry.role,
        approverName: getApproverName(entry.role),
        status: "approved",
        decidedAt: "2025-01-25",
        comment: "Approved as part of annual review cycle.",
      })),
      compensationDelta: {
        currentBase: kofiDelta.currentBase,
        proposedBase: kofiDelta.proposedBase,
        currency: kofiDelta.currency,
      },
      letterUrl: undefined,
    },
  ]
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

export async function listPromotionCases(): Promise<PromotionCase[]> {
  try {
    const payload = await httpRequest<{ data: PromotionCase[] }>(promotionsEndpoint(), { method: "GET" })
    if (Array.isArray(payload?.data)) {
      promotionStore = payload.data
    }
    return structuredClone(promotionStore)
  } catch (error) {
    if (!isApiError(error)) {
      console.warn("Promotion API error", error)
    }
    return structuredClone(promotionStore)
  }
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
