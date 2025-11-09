"use server"

import { createClient } from "@/lib/supabase/server"

export type AttendancePermissions = {
  canViewOwnAttendance: boolean
  canViewTeamAttendance: boolean
  canViewAllAttendance: boolean
  canEditOwnAttendance: boolean
  canEditTeamAttendance: boolean
  canEditAllAttendance: boolean
  canApproveOvertime: boolean
  canManageShifts: boolean
  canManageDevices: boolean
  canViewAnalytics: boolean
  canManagePolicies: boolean
  canExportReports: boolean
  isEmployee: boolean
  isManager: boolean
  isHR: boolean
  isAdmin: boolean
}

export async function getAttendancePermissions(employeeId: string): Promise<AttendancePermissions> {
  const supabase = await createClient()

  // Get user roles
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select(`
      role:roles(code, level)
    `)
    .eq("employee_id", employeeId)
    .eq("is_active", true)

  // Get employee info for manager check
  const { data: employee } = await supabase
    .from("employees")
    .select("special_role, is_supervisor")
    .eq("id", employeeId)
    .single()

  const roles = userRoles?.map((ur: any) => ur.role?.code) || []
  const isAdmin = roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")
  const isHR = roles.includes("HR_MANAGER") || employee?.special_role === "HR"
  const isManager =
    employee?.is_supervisor || employee?.special_role === "Head of Department" || roles.includes("MANAGER")

  return {
    canViewOwnAttendance: true, // All employees can view their own
    canViewTeamAttendance: isManager || isHR || isAdmin,
    canViewAllAttendance: isHR || isAdmin,
    canEditOwnAttendance: true, // Can request corrections
    canEditTeamAttendance: isManager || isHR || isAdmin,
    canEditAllAttendance: isHR || isAdmin,
    canApproveOvertime: isManager || isHR || isAdmin,
    canManageShifts: isHR || isAdmin,
    canManageDevices: isHR || isAdmin,
    canViewAnalytics: isManager || isHR || isAdmin,
    canManagePolicies: isHR || isAdmin,
    canExportReports: isManager || isHR || isAdmin,
    isEmployee: !isManager && !isHR && !isAdmin,
    isManager: isManager && !isHR && !isAdmin,
    isHR,
    isAdmin,
  }
}
