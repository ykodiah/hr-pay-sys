import { createClient } from "@/lib/supabase/server"

export type UserRole = "super_admin" | "school_admin" | "principal" | "teacher" | "student" | "parent" | "staff"

export interface AuthUser {
  id: number
  email: string
  school_id: number
  roles: UserRole[]
  profile?: {
    first_name: string
    last_name: string
    phone?: string
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null

  // Get user details from our users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select(`
      id,
      email,
      school_id,
      user_roles (
        roles (
          code,
          label
        )
      )
    `)
    .eq("email", user.email)
    .single()

  if (userError || !userData) return null

  // Get profile information (could be from staff or students table)
  let profile = null

  // Try to get staff profile first
  const { data: staffData } = await supabase
    .from("staff")
    .select("first_name, last_name, phone")
    .eq("user_id", userData.id)
    .single()

  if (staffData) {
    profile = staffData
  } else {
    // Try student profile
    const { data: studentData } = await supabase
      .from("students")
      .select("first_name, last_name")
      .eq("id", userData.id) // Assuming student records link differently
      .single()

    if (studentData) {
      profile = { ...studentData, phone: null }
    }
  }

  return {
    id: userData.id,
    email: userData.email,
    school_id: userData.school_id,
    roles: userData.user_roles?.map((ur: any) => ur.roles.code) || [],
    profile,
  }
}

export function hasRole(user: AuthUser, role: UserRole): boolean {
  return user.roles.includes(role)
}

export function hasAnyRole(user: AuthUser, roles: UserRole[]): boolean {
  return roles.some((role) => user.roles.includes(role))
}
