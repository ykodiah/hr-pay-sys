"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createUser(formData: FormData) {
  const supabase = createServerClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const userType = formData.get("userType") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return { error: authError.message }
    }

    // Create user record
    const { error: userError } = await supabase.from("users").insert({
      id: authData.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      address,
      is_active: true,
    })

    if (userError) {
      return { error: userError.message }
    }

    // Create role-specific record
    if (userType === "staff") {
      const { error: staffError } = await supabase.from("staff").insert({
        user_id: authData.user.id,
        employee_id: `EMP${Date.now()}`,
        hire_date: new Date().toISOString().split("T")[0],
        status: "active",
      })

      if (staffError) {
        return { error: staffError.message }
      }
    } else if (userType === "parent") {
      const { error: guardianError } = await supabase.from("guardians").insert({
        user_id: authData.user.id,
        relationship: "parent",
      })

      if (guardianError) {
        return { error: guardianError.message }
      }
    }

    // Assign user role
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: authData.user.id,
      role: userType === "staff" ? "teacher" : userType,
    })

    if (roleError) {
      return { error: roleError.message }
    }

    revalidatePath("/users")
    return { success: true }
  } catch (error) {
    return { error: "Failed to create user" }
  }
}

export async function getUsers() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("users")
    .select(`
      *,
      user_roles(role),
      staff(employee_id, hire_date, status),
      guardians(relationship)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching users:", error)
    return []
  }

  return data || []
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  const supabase = createServerClient()

  const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/users")
  return { success: true }
}
