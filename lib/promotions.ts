export type SalaryStep = {
  step: number
  basePay: number
  currency: string
  effectiveFrom: string
}

export type GradeScale = {
  id: string
  gradeCode: string
  band: string
  minStep: number
  maxStep: number
  steps: SalaryStep[]
}

export type EligibilityCheck = {
  id: string
  label: string
  passed: boolean
  details: string
}

export type PromotionApprovalStage = {
  stage: number
  role: string
  approverName: string
  status: "pending" | "approved" | "rejected"
  decidedAt?: string
  comment?: string
}

export type PromotionCase = {
  id: string
  employeeId: string
  employeeName: string
  department: string
  fromGrade: string
  fromStep: number
  toGrade: string
  toStep: number
  effectiveDate: string
  reason: string
  status: "draft" | "in-review" | "approved" | "rejected"
  initiatedBy: string
  initiatedAt: string
  attachments: string[]
  eligibility: EligibilityCheck[]
  approvals: PromotionApprovalStage[]
  compensationDelta: {
    currentBase: number
    proposedBase: number
    currency: string
  }
  letterUrl?: string
}

export const gradeCatalog: GradeScale[] = [
  {
    id: "grade-6",
    gradeCode: "G6",
    band: "Mid-Level Professional",
    minStep: 1,
    maxStep: 5,
    steps: [3800, 4100, 4400, 4700, 5000].map((base, index) => ({
      step: index + 1,
      basePay: base,
      currency: "GHS",
      effectiveFrom: "2025-01-01",
    })),
  },
  {
    id: "grade-7",
    gradeCode: "G7",
    band: "Senior Professional",
    minStep: 1,
    maxStep: 5,
    steps: [4200, 4530, 4860, 5190, 5520].map((base, index) => ({
      step: index + 1,
      basePay: base,
      currency: "GHS",
      effectiveFrom: "2025-01-01",
    })),
  },
  {
    id: "grade-8",
    gradeCode: "G8",
    band: "Manager",
    minStep: 1,
    maxStep: 5,
    steps: [4600, 4960, 5320, 5680, 6040].map((base, index) => ({
      step: index + 1,
      basePay: base,
      currency: "GHS",
      effectiveFrom: "2025-01-01",
    })),
  },
  {
    id: "grade-9",
    gradeCode: "G9",
    band: "Senior Manager",
    minStep: 1,
    maxStep: 5,
    steps: [5000, 5390, 5780, 6170, 6560].map((base, index) => ({
      step: index + 1,
      basePay: base,
      currency: "GHS",
      effectiveFrom: "2025-01-01",
    })),
  },
]

export const approvalMatrix: { stage: number; role: string }[] = [
  { stage: 1, role: "Line Manager" },
  { stage: 2, role: "Head of Department" },
  { stage: 3, role: "HR Director" },
  { stage: 4, role: "Finance Director" },
  { stage: 5, role: "Managing Director" },
]

export function getSalaryForGradeStep(gradeCode: string, step: number) {
  const grade = gradeCatalog.find((entry) => entry.gradeCode === gradeCode)
  if (!grade) return { base: 0, currency: "GHS" }
  const salaryStep = grade.steps.find((entry) => entry.step === step)
  if (!salaryStep) return { base: grade.steps.at(-1)?.basePay ?? 0, currency: "GHS" }
  return { base: salaryStep.basePay, currency: salaryStep.currency }
}

export function evaluateEligibility(
  currentGrade: string,
  currentStep: number,
  tenureMonths: number,
  appraisalScore: number,
  trainingCompleted: boolean,
  hasActiveDisciplinary: boolean,
  payrollLocked: boolean,
): EligibilityCheck[] {
  return [
    {
      id: "tenure",
      label: "Minimum tenure in current grade",
      passed: tenureMonths >= 12,
      details: tenureMonths >= 12 ? `${tenureMonths} months served` : `${tenureMonths} months served (min 12)`
    },
    {
      id: "appraisal",
      label: "Appraisal score meets threshold",
      passed: appraisalScore >= 3.5,
      details: `Score ${appraisalScore.toFixed(1)} / 5.0`
    },
    {
      id: "training",
      label: "Mandatory leadership training completed",
      passed: trainingCompleted,
      details: trainingCompleted ? "Completed" : "Incomplete"
    },
    {
      id: "disciplinary",
      label: "No active disciplinary case",
      passed: !hasActiveDisciplinary,
      details: hasActiveDisciplinary ? "Disciplinary flag recorded" : "Clear"
    },
    {
      id: "payroll",
      label: "Destination payroll period open",
      passed: !payrollLocked,
      details: payrollLocked ? "Upcoming payroll already closed" : "Open"
    },
    {
      id: "salary-band",
      label: "Proposed grade/step within salary scale",
      passed: Boolean(getSalaryForGradeStep(currentGrade, currentStep)),
      details: `${currentGrade} step ${currentStep}`,
    },
  ]
}

export function computeSalaryDelta(fromGrade: string, fromStep: number, toGrade: string, toStep: number) {
  const current = getSalaryForGradeStep(fromGrade, fromStep)
  const proposed = getSalaryForGradeStep(toGrade, toStep)
  return {
    currentBase: current.base,
    proposedBase: proposed.base,
    currency: proposed.currency,
    difference: proposed.base - current.base,
  }
}

export function generatePromotionLetter(promotion: PromotionCase) {
  const { employeeName, department, compensationDelta, toGrade, toStep, effectiveDate } = promotion
  return `Promotion Letter\n\nDear ${employeeName},\n\nCongratulations! Following a successful review, we are pleased to confirm your promotion within ${department}.\n\nNew Grade: ${toGrade}\nNew Step: ${toStep}\nNew Base Salary: ${compensationDelta.currency} ${compensationDelta.proposedBase.toLocaleString()}\nEffective Date: ${effectiveDate}\n\nPlease acknowledge receipt within five working days.\n\nRegards,\nHR Directorate`
}
