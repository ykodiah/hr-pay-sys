export type PolicyScopeType = "company" | "subsidiary" | "department" | "team"
export type PolicyType = "grace" | "rounding" | "penalty" | "payroll"

export interface AttendancePolicy {
  id: string
  policy_type: PolicyType
  scope_type: PolicyScopeType
  scope_reference: string | null
  grace_minutes: number | null
  rounding_increment: number | null
  rounding_mode: "nearest" | "up" | "down" | null
  penalty_type: string | null
  penalty_value: number | null
  auto_escalate: boolean
  escalation_minutes: number | null
  payroll_action: string | null
  effective_from: string
  effective_to: string | null
  is_active: boolean
}

export interface AttendanceRecordLite {
  id: string
  employee_id: string
  date: string
  clock_in: string | null
  clock_out: string | null
  status: string | null
  total_hours?: number | null
}

export interface EmployeeScopeLite {
  id: string
  company_id?: string | null
  subsidiary_id?: string | null
  department?: string | null
  division?: string | null
  team?: string | null
}

export const roundTime = (time: string, increment: number, mode: "nearest" | "up" | "down" = "nearest") => {
  const [hours, minutes] = time.split(":").map(Number)
  const totalMinutes = hours * 60 + minutes

  if (!increment || increment <= 0) {
    return time
  }

  let adjustedMinutes = totalMinutes
  if (mode === "up") {
    adjustedMinutes = Math.ceil(totalMinutes / increment) * increment
  } else if (mode === "down") {
    adjustedMinutes = Math.floor(totalMinutes / increment) * increment
  } else {
    adjustedMinutes = Math.round(totalMinutes / increment) * increment
  }

  const adjustedHoursComponent = Math.floor(adjustedMinutes / 60) % 24
  const adjustedMinutesComponent = Math.abs(adjustedMinutes % 60)
  return `${String(adjustedHoursComponent).padStart(2, "0")}:${String(adjustedMinutesComponent).padStart(2, "0")}`
}

export const isPolicyActiveForDate = (policy: AttendancePolicy, date: string) => {
  const target = new Date(date)
  const effectiveFrom = new Date(policy.effective_from)
  const effectiveTo = policy.effective_to ? new Date(policy.effective_to) : null

  if (target < effectiveFrom) {
    return false
  }

  if (effectiveTo && target > effectiveTo) {
    return false
  }

  return policy.is_active
}

export const matchesScope = (policy: AttendancePolicy, employee: EmployeeScopeLite) => {
  switch (policy.scope_type) {
    case "company":
      return true
    case "subsidiary":
      return Boolean(policy.scope_reference) && employee.subsidiary_id === policy.scope_reference
    case "department":
      return Boolean(policy.scope_reference) && employee.department === policy.scope_reference
    case "team":
      return Boolean(policy.scope_reference) && employee.team === policy.scope_reference
    default:
      return true
  }
}

export const applyPolicyToRecord = (
  record: AttendanceRecordLite,
  policy: AttendancePolicy,
  employee: EmployeeScopeLite,
  scheduledClockIn = "08:00",
) => {
  if (!isPolicyActiveForDate(policy, record.date) || !matchesScope(policy, employee)) {
    return {}
  }

  const updates: Record<string, any> = {}

  if (policy.policy_type === "grace" && policy.grace_minutes && policy.grace_minutes > 0 && record.clock_in) {
    const [scheduledHours, scheduledMinutes] = scheduledClockIn.split(":").map(Number)
    const scheduledTotal = scheduledHours * 60 + scheduledMinutes
    const [clockHours, clockMinutes] = record.clock_in.split(":").map(Number)
    const clockTotal = clockHours * 60 + clockMinutes

    if (clockTotal > scheduledTotal) {
      const diff = clockTotal - scheduledTotal
      if (diff <= policy.grace_minutes) {
        updates.clock_in = scheduledClockIn
        updates.status = record.status === "late" ? "present" : record.status
      }
    }
  }

  if (policy.policy_type === "rounding" && policy.rounding_increment && policy.rounding_increment > 0) {
    if (record.clock_in) {
      updates.clock_in = roundTime(record.clock_in, policy.rounding_increment, policy.rounding_mode ?? "nearest")
    }
    if (record.clock_out) {
      updates.clock_out = roundTime(record.clock_out, policy.rounding_increment, policy.rounding_mode ?? "nearest")
    }
  }

  if (policy.policy_type === "penalty" && policy.penalty_type) {
    if (policy.penalty_type === "late-to-absent" && record.status === "late") {
      updates.status = "absent"
    }
    if (policy.penalty_type === "unapproved-absence" && !record.clock_in && (!record.total_hours || record.total_hours === 0)) {
      updates.status = "absent"
    }
  }

  return updates
}

export const evaluatePolicies = (
  record: AttendanceRecordLite,
  policies: AttendancePolicy[],
  employee: EmployeeScopeLite,
  scheduledClockIn = "08:00",
) => {
  let workingRecord = { ...record }

  return policies.reduce<Array<{ policy: AttendancePolicy; updates: Record<string, any> }>>((acc, policy) => {
    const updates = applyPolicyToRecord(workingRecord, policy, employee, scheduledClockIn)
    if (Object.keys(updates).length) {
      acc.push({ policy, updates })
      workingRecord = { ...workingRecord, ...updates }
    }
    return acc
  }, [])
}

export const applyPolicies = (
  record: AttendanceRecordLite,
  policies: AttendancePolicy[],
  employee: EmployeeScopeLite,
  scheduledClockIn = "08:00",
) => {
  return evaluatePolicies(record, policies, employee, scheduledClockIn).reduce<Record<string, any>>((acc, entry) => {
    return { ...acc, ...entry.updates }
  }, {})
}
