import test from "node:test"
import assert from "node:assert/strict"

import {
  applyPolicyToRecord,
  evaluatePolicies,
  roundTime,
  type AttendancePolicy,
  type AttendanceRecordLite,
  type EmployeeScopeLite,
} from "../lib/attendance/policy-engine"

const buildPolicy = (overrides: Partial<AttendancePolicy>): AttendancePolicy => ({
  id: "policy-1",
  policy_type: "grace",
  scope_type: "company",
  scope_reference: null,
  grace_minutes: 10,
  rounding_increment: null,
  rounding_mode: null,
  penalty_type: null,
  penalty_value: null,
  auto_escalate: false,
  escalation_minutes: null,
  payroll_action: null,
  effective_from: "2024-01-01",
  effective_to: null,
  is_active: true,
  ...overrides,
})

const employee: EmployeeScopeLite = { id: "employee-1", subsidiary_id: "subsidiary-1", department: "finance" }

const baseRecord: AttendanceRecordLite = {
  id: "record-1",
  employee_id: "employee-1",
  date: "2024-04-02",
  clock_in: "08:11",
  clock_out: "17:03",
  status: "late",
  total_hours: 8,
}

test("roundTime respects modes and increments", () => {
  assert.equal(roundTime("08:07", 15, "nearest"), "08:00")
  assert.equal(roundTime("08:08", 15, "up"), "08:15")
  assert.equal(roundTime("08:14", 15, "down"), "08:00")
})

test("grace policy normalises late clock-in within threshold", () => {
  const policy = buildPolicy({ policy_type: "grace", grace_minutes: 15 })
  const updates = applyPolicyToRecord(baseRecord, policy, employee)
  assert.deepEqual(updates, { clock_in: "08:00", status: "present" })
})

test("evaluatePolicies aggregates multiple policy effects", () => {
  const policies: AttendancePolicy[] = [
    buildPolicy({ id: "policy-grace", policy_type: "grace", grace_minutes: 15 }),
    buildPolicy({
      id: "policy-rounding",
      policy_type: "rounding",
      rounding_increment: 15,
      rounding_mode: "nearest",
    }),
    buildPolicy({
      id: "policy-penalty",
      policy_type: "penalty",
      penalty_type: "late-to-absent",
    }),
  ]

  const results = evaluatePolicies(baseRecord, policies, employee)
  assert.equal(results.length, 2)

  const merged = results.reduce<Record<string, unknown>>((acc, entry) => Object.assign(acc, entry.updates), {})
  assert.deepEqual(merged, { clock_in: "08:00", clock_out: "17:00", status: "present" })
})
