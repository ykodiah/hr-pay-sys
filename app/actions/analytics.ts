"use server"

import { getComprehensiveAnalytics, generateComplianceReport, predictAbsenteeismRisk } from "@/lib/attendance/analytics"
import { createClient } from "@/lib/supabase/server"

async function getCurrentCompanyId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

  if (!employee) throw new Error("Employee not found")

  return employee.company_id
}

export async function getAnalytics(startDate: string, endDate: string) {
  const companyId = await getCurrentCompanyId()
  return await getComprehensiveAnalytics(companyId, startDate, endDate)
}

export async function getComplianceReport(startDate: string, endDate: string) {
  const companyId = await getCurrentCompanyId()
  return await generateComplianceReport(companyId, startDate, endDate)
}

export async function getAbsenteeismRisks() {
  const companyId = await getCurrentCompanyId()
  return await predictAbsenteeismRisk(companyId)
}
