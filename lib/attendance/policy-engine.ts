"use server"

import { createClient } from "@/lib/supabase/server"
import {
  calculateLateMinutes,
  calculateTotalHours,
  calculateOvertimeHours,
  calculateAnomalyScore,
} from "./calculations"

// Policy types
export interface AttendancePolicy {
  id: string
  company_id: string
  policy_name: string
  policy_type: string
  rules: any
  is_active: boolean
}

export interface PolicyRule {
  grace_period_minutes?: number
  late_penalty_amount?: number
  late_penalty_type?: "fixed" | "percentage" | "per_minute"
  early_departure_penalty?: number
  overtime_calculation_method?: "standard" | "differential" | "tiered"
  auto_deduct_late?: boolean
  auto_calculate_overtime?: boolean
  round_to_nearest?: number
}

// Policy Engine Core
export class AttendancePolicyEngine {
  private companyId: string
  private policies: AttendancePolicy[] = []

  constructor(companyId: string) {
    this.companyId = companyId
  }

  async loadPolicies() {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("attendance_policies")
      .select("*")
      .eq("company_id", this.companyId)
      .eq("is_active", true)

    if (error) {
      console.error("[v0] Error loading policies:", error)
      return
    }

    this.policies = data || []
  }

  private getPolicy(type: string): AttendancePolicy | null {
    return this.policies.find((p) => p.policy_type === type) || null
  }

  // Apply grace period policy
  applyGracePeriodPolicy(
    clockIn: string,
    shiftStart: string,
  ): {
    isLate: boolean
    lateMinutes: number
    gracePeriod: number
  } {
    const policy = this.getPolicy("grace_period")
    const gracePeriod = policy?.rules?.grace_period_minutes || 15

    return {
      ...calculateLateMinutes(clockIn, shiftStart, gracePeriod),
      gracePeriod,
    }
  }

  // Apply late penalty policy
  applyLatePenalty(lateMinutes: number): number {
    const policy = this.getPolicy("late_penalty")
    if (!policy || lateMinutes === 0) return 0

    const rules = policy.rules as PolicyRule

    if (rules.late_penalty_type === "fixed") {
      return rules.late_penalty_amount || 0
    } else if (rules.late_penalty_type === "per_minute") {
      return (rules.late_penalty_amount || 0) * lateMinutes
    } else if (rules.late_penalty_type === "percentage") {
      // Percentage of daily wage (would need daily wage in context)
      return 0 // Implement based on wage
    }

    return 0
  }

  // Apply overtime calculation policy
  applyOvertimeCalculation(
    totalHours: number,
    date: Date,
    overtimeType: "weekday" | "weekend" | "holiday" = "weekday",
  ): {
    overtimeHours: number
    overtimeRate: number
    overtimePay: number
  } {
    const policy = this.getPolicy("overtime_calculation")
    const rules = policy?.rules as PolicyRule
    const method = rules?.overtime_calculation_method || "standard"

    const standardHours = 8
    const overtimeHours = calculateOvertimeHours(totalHours, standardHours)

    let overtimeRate = 1.5 // Default 1.5x

    if (method === "differential") {
      // Different rates for weekday vs weekend
      if (overtimeType === "weekend") {
        overtimeRate = 2.0
      } else if (overtimeType === "holiday") {
        overtimeRate = 2.5
      }
    } else if (method === "tiered") {
      // Tiered rates based on hours
      if (overtimeHours > 4) {
        overtimeRate = 2.0
      } else if (overtimeHours > 2) {
        overtimeRate = 1.75
      }
    }

    return {
      overtimeHours,
      overtimeRate,
      overtimePay: overtimeHours * overtimeRate, // Would multiply by hourly rate
    }
  }

  // Round time according to policy
  roundTime(minutes: number): number {
    const policy = this.getPolicy("time_rounding")
    const roundTo = policy?.rules?.round_to_nearest || 15

    return Math.round(minutes / roundTo) * roundTo
  }

  // Process attendance record with all policies
  async processAttendanceRecord(record: {
    employee_id: string
    date: string
    clock_in?: string
    clock_out?: string
    shift_id?: string
  }): Promise<any> {
    await this.loadPolicies()

    const supabase = await createClient()

    // Get shift details
    let shiftStart = "09:00:00"
    let shiftEnd = "17:00:00"
    let breakDuration = 60

    if (record.shift_id) {
      const { data: shift } = await supabase.from("attendance_shifts").select("*").eq("id", record.shift_id).single()

      if (shift) {
        shiftStart = shift.start_time
        shiftEnd = shift.end_time
        breakDuration = shift.break_duration_minutes
      }
    }

    // Initialize processed record
    const processed: any = {
      ...record,
      company_id: this.companyId,
    }

    // Apply grace period and calculate late status
    if (record.clock_in) {
      const lateResult = this.applyGracePeriodPolicy(record.clock_in, shiftStart)
      processed.is_late = lateResult.isLate
      processed.late_minutes = lateResult.lateMinutes

      // Calculate late penalty if policy is active
      const policy = this.getPolicy("late_penalty")
      if (policy?.rules?.auto_deduct_late) {
        processed.late_penalty = this.applyLatePenalty(lateResult.lateMinutes)
      }
    }

    // Calculate total hours and overtime
    if (record.clock_in && record.clock_out) {
      const totalHours = calculateTotalHours(record.clock_in, record.clock_out, breakDuration)
      processed.total_hours = totalHours

      // Apply overtime calculation
      const overtimePolicy = this.getPolicy("overtime_calculation")
      if (overtimePolicy?.rules?.auto_calculate_overtime) {
        const date = new Date(record.date)
        const dayOfWeek = date.getDay()
        const overtimeType = dayOfWeek === 0 || dayOfWeek === 6 ? "weekend" : "weekday"

        const overtime = this.applyOvertimeCalculation(totalHours, date, overtimeType)
        processed.overtime_hours = overtime.overtimeHours
        processed.overtime_rate = overtime.overtimeRate
      }

      processed.status = "present"
    } else if (record.clock_in && !record.clock_out) {
      processed.status = "incomplete"
    } else {
      processed.status = "absent"
    }

    // Calculate AI anomaly score
    processed.ai_anomaly_score = calculateAnomalyScore(processed)

    return processed
  }
}

// Helper function to process a batch of records
export async function processAttendanceBatch(companyId: string, records: any[]): Promise<any[]> {
  const engine = new AttendancePolicyEngine(companyId)
  await engine.loadPolicies()

  const processed = await Promise.all(records.map((record) => engine.processAttendanceRecord(record)))

  return processed
}

// Create or update policy
export async function saveAttendancePolicy(companyId: string, policy: Partial<AttendancePolicy>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const policyData = {
    ...policy,
    company_id: companyId,
    created_by: user?.id,
  }

  if (policy.id) {
    const { data, error } = await supabase
      .from("attendance_policies")
      .update(policyData)
      .eq("id", policy.id)
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase.from("attendance_policies").insert(policyData).select().single()

    if (error) throw error
    return data
  }
}

// Get active policies for a company
export async function getActivePolicies(companyId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("attendance_policies")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)

  if (error) throw error
  return data
}
