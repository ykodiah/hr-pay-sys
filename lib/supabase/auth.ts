import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    redirect("/auth/login")
  }
  return user
}

export async function getEmployeeProfile(userId: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("employee_profiles")
    .select(`
      *,
      employee:employees(
        *,
        company:companies(*),
        subsidiary:subsidiaries(*)
      )
    `)
    .eq("id", userId)
    .single()

  return profile
}

export async function requireEmployeeAccess() {
  const user = await requireAuth()
  const profile = await getEmployeeProfile(user.id)

  if (!profile?.employee) {
    redirect("/auth/setup-profile")
  }

  return {
    user,
    employee: profile.employee,
    company: profile.employee.company,
    subsidiary: profile.employee.subsidiary,
  }
}

export async function requireHRAccess() {
  const { employee } = await requireEmployeeAccess()

  if (!employee.special_role || !["HR", "Admin"].includes(employee.special_role)) {
    redirect("/unauthorized")
  }

  return employee
}
