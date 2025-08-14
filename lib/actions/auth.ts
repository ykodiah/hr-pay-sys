"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    // Update last login time
    await supabase.from("users").update({ last_login_at: new Date().toISOString() }).eq("email", email.toString())

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const schoolName = formData.get("schoolName")

  if (!email || !password || !schoolName) {
    return { error: "All fields are required" }
  }

  const supabase = createClient()

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "https://schoolmgt.vercel.app/dashboard",
      },
    })

    if (authError) {
      return { error: authError.message }
    }

    if (authData.user) {
      // Create school
      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .insert({
          name: schoolName.toString(),
          email: email.toString(),
        })
        .select()
        .single()

      if (schoolError) {
        return { error: "Failed to create school" }
      }

      // Create user record
      const { error: userError } = await supabase.from("users").insert({
        email: email.toString(),
        school_id: schoolData.id,
        is_active: true,
      })

      if (userError) {
        return { error: "Failed to create user record" }
      }

      return { success: true, message: "Account created successfully! Please check your email to verify." }
    }

    return { error: "Failed to create account" }
  } catch (error) {
    console.error("Signup error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
