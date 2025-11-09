import { requireEmployeeAccess } from "@/lib/supabase/auth"
import { getAttendancePermissions } from "@/lib/attendance/permissions"
import AttendancePortalClient from "./attendance-client"

export default async function EmployeeAttendancePage() {
  const { user, employee, company } = await requireEmployeeAccess()
  const permissions = await getAttendancePermissions(employee.id)

  return <AttendancePortalClient employee={employee} company={company} permissions={permissions} />
}
