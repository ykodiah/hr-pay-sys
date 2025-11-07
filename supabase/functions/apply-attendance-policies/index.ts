import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1"

type AttendanceRecord = {
  id: string
  employee_id: string
  date: string
  clock_in: string | null
  clock_out: string | null
  status: string | null
  total_hours: number | null
}

type AttendancePolicy = {
  id: string
  policy_type: string
  scope_type: string
  scope_reference: string | null
  grace_minutes: number | null
  rounding_increment: number | null
  rounding_mode: string | null
  penalty_type: string | null
  penalty_value: number | null
  auto_escalate: boolean
  escalation_minutes: number | null
  payroll_action: string | null
  effective_from: string
  effective_to: string | null
  is_active: boolean
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const roundTime = (time: string, increment: number, mode: string) => {
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
  const adjustedMinutesComponent = adjustedMinutes % 60
  return `${String(adjustedHoursComponent).padStart(2, "0")}:${String(adjustedMinutesComponent).padStart(2, "0")}`
}

const matchesScope = (policy: AttendancePolicy, record: AttendanceRecord, employee: any) => {
  switch (policy.scope_type) {
    case "company":
      return true
    case "subsidiary":
      return employee?.subsidiary_id && employee.subsidiary_id === policy.scope_reference
    case "department":
      return employee?.department && employee.department === policy.scope_reference
    case "team":
      return employee?.team && employee.team === policy.scope_reference
    default:
      return true
  }
}

const applyGraceAndRounding = (record: AttendanceRecord, policy: AttendancePolicy) => {
  const updates: Record<string, any> = {}

  if (policy.policy_type === "grace" && policy.grace_minutes && policy.grace_minutes > 0 && record.clock_in) {
    const scheduledTime = "08:00"
    const [scheduledHours, scheduledMinutes] = scheduledTime.split(":").map(Number)
    const scheduledTotal = scheduledHours * 60 + scheduledMinutes

    const [clockHours, clockMinutes] = record.clock_in.split(":").map(Number)
    const clockTotal = clockHours * 60 + clockMinutes

    if (clockTotal > scheduledTotal) {
      const diff = clockTotal - scheduledTotal
      if (diff <= policy.grace_minutes) {
        updates.clock_in = scheduledTime
        updates.status = "present"
      }
    }
  }

  if (policy.policy_type === "rounding" && policy.rounding_increment && policy.rounding_increment > 0 && record.clock_in) {
    updates.clock_in = roundTime(record.clock_in, policy.rounding_increment, policy.rounding_mode ?? "nearest")
  }
  if (policy.policy_type === "rounding" && policy.rounding_increment && policy.rounding_increment > 0 && record.clock_out) {
    updates.clock_out = roundTime(record.clock_out, policy.rounding_increment, policy.rounding_mode ?? "nearest")
  }

  return updates
}

const applyPenalty = (record: AttendanceRecord, policy: AttendancePolicy) => {
  if (policy.policy_type !== "penalty" || !policy.penalty_type) {
    return {}
  }

  const updates: Record<string, any> = {}

  if (policy.penalty_type === "late-to-absent" && record.status === "late") {
    updates.status = "absent"
  }

  return updates
}

const applyPolicyToRecord = (record: AttendanceRecord, policy: AttendancePolicy, employee: any) => {
  const updates = {
    ...applyGraceAndRounding(record, policy),
    ...applyPenalty(record, policy),
  }

  return updates
}

export async function handler(req: Request): Promise<Response> {
  try {
    let filterRecordId: string | undefined
    if (req.method === "POST") {
      const payload = await req.json().catch(() => ({}))
      filterRecordId = payload?.recordId
    } else if (req.method === "GET") {
      const url = new URL(req.url)
      filterRecordId = url.searchParams.get("recordId") ?? undefined
    }

    let recordQuery = supabase
      .from("attendance_records")
      .select("id, employee_id, date, clock_in, clock_out, status, total_hours")

    if (filterRecordId) {
      recordQuery = recordQuery.eq("id", filterRecordId)
    } else {
      recordQuery = recordQuery.gte("date", new Date().toISOString().split("T")[0])
    }

    const { data: records, error: recordsError } = await recordQuery

    if (recordsError) {
      throw recordsError
    }

    const { data: policies, error: policiesError } = await supabase
      .from("attendance_policies")
      .select("*")
      .eq("is_active", true)

    if (policiesError) {
      throw policiesError
    }

    if (!records?.length || !policies?.length) {
      return new Response(JSON.stringify({ applied: 0 }), { status: 200 })
    }

    const employeeIds = [...new Set(records.map((record) => record.employee_id))]
    const { data: employees } = await supabase
      .from("employees")
      .select("id, subsidiary_id, department, division, team")
      .in("id", employeeIds)

    const employeeMap = new Map<string, any>()
    employees?.forEach((employee) => {
      employeeMap.set(employee.id, employee)
    })

    let applied = 0

    for (const record of records) {
      const employee = employeeMap.get(record.employee_id)
      for (const policy of policies) {
        const now = new Date(record.date)
        const effectiveFrom = new Date(policy.effective_from)
        const effectiveTo = policy.effective_to ? new Date(policy.effective_to) : null

        if (now < effectiveFrom || (effectiveTo && now > effectiveTo)) {
          continue
        }

        if (!matchesScope(policy, record, employee)) {
          continue
        }

        const updates = applyPolicyToRecord(record, policy, employee)
        if (Object.keys(updates).length === 0) {
          continue
        }

        const { error: updateError } = await supabase
          .from("attendance_records")
          .update(updates)
          .eq("id", record.id)

        if (updateError) {
          console.error("Failed to update record", updateError)
          continue
        }

        await supabase.from("attendance_policy_logs").insert({
          policy_id: policy.id,
          attendance_record_id: record.id,
          employee_id: record.employee_id,
          action_type: policy.policy_type,
          details: updates,
          applied_at: new Date().toISOString(),
        })

        applied += 1
      }
    }

    return new Response(JSON.stringify({ applied }), { status: 200 })
  } catch (error) {
    console.error("apply-attendance-policies error", error)
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 })
  }
}
