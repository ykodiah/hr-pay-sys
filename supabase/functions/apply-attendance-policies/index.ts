import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1"
import {
  applyPolicies,
  type AttendancePolicy,
  type AttendanceRecordLite,
  type EmployeeScopeLite,
  isPolicyActiveForDate,
  evaluatePolicies,
} from "../../../lib/attendance/policy-engine.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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

      const employeeMap = new Map<string, EmployeeScopeLite>()
      employees?.forEach((employee) => {
        employeeMap.set(employee.id, employee)
      })

    let applied = 0

      for (const record of records as AttendanceRecordLite[]) {
        const employee = employeeMap.get(record.employee_id)
        if (!employee) continue

        const relevantPolicies = policies.filter((policy) => isPolicyActiveForDate(policy, record.date))
        if (!relevantPolicies.length) continue

        const evaluationResults = evaluatePolicies(record, relevantPolicies, employee)
        if (!evaluationResults.length) {
          continue
        }

        const updates = applyPolicies(record, relevantPolicies, employee)

        const { error: updateError } = await supabase
          .from("attendance_records")
          .update(updates)
          .eq("id", record.id)

        if (updateError) {
          console.error("Failed to update record", updateError)
          continue
        }

        for (const result of evaluationResults) {
          await supabase.from("attendance_policy_logs").insert({
            policy_id: result.policy.id,
            attendance_record_id: record.id,
            employee_id: record.employee_id,
            action_type: result.policy.policy_type,
            details: result.updates,
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
