"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface StudentFormData {
  first_name: string
  last_name: string
  student_no: string
  gender: string
  dob: string
  admission_dt: string
  status: string
  medical_flags?: any
  guardians?: {
    first_name: string
    last_name: string
    email: string
    phone: string
    national_id?: string
    address?: string
    relationship: string
    is_primary: boolean
  }[]
}

export async function createStudent(prevState: any, formData: FormData) {
  const supabase = createClient()

  try {
    // Get current user to determine school_id
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()

    if (!userData) return { error: "User not found" }

    const studentData = {
      school_id: userData.school_id,
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      student_no: formData.get("student_no") as string,
      gender: formData.get("gender") as string,
      dob: formData.get("dob") as string,
      admission_dt: formData.get("admission_dt") as string,
      status: (formData.get("status") as string) || "active",
      medical_flags: formData.get("medical_flags") ? JSON.parse(formData.get("medical_flags") as string) : null,
    }

    const { data: student, error } = await supabase.from("students").insert(studentData).select().single()

    if (error) return { error: error.message }

    // Handle guardian data if provided
    const guardianData = formData.get("guardian_data")
    if (guardianData) {
      const guardians = JSON.parse(guardianData as string)

      for (const guardianInfo of guardians) {
        // Create guardian
        const { data: guardian, error: guardianError } = await supabase
          .from("guardians")
          .insert({
            school_id: userData.school_id,
            ...guardianInfo,
          })
          .select()
          .single()

        if (guardianError) continue

        // Link guardian to student
        await supabase.from("student_guardians").insert({
          school_id: userData.school_id,
          student_id: student.id,
          guardian_id: guardian.id,
          relationship: guardianInfo.relationship,
          is_primary: guardianInfo.is_primary,
        })
      }
    }

    revalidatePath("/students")
    return { success: "Student created successfully", student_id: student.id }
  } catch (error) {
    console.error("Create student error:", error)
    return { error: "Failed to create student" }
  }
}

export async function getStudents(searchTerm?: string, classFilter?: string, statusFilter?: string) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { students: [], error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()

    if (!userData) return { students: [], error: "User not found" }

    let query = supabase
      .from("students")
      .select(`
        *,
        enrollments (
          id,
          status,
          classes (
            id,
            name,
            grades (
              name
            )
          )
        ),
        student_guardians (
          relationship,
          is_primary,
          guardians (
            first_name,
            last_name,
            phone,
            email
          )
        )
      `)
      .eq("school_id", userData.school_id)
      .is("deleted_at", null)

    if (searchTerm) {
      query = query.or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,student_no.ilike.%${searchTerm}%`,
      )
    }

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter)
    }

    const { data: students, error } = await query.order("created_at", { ascending: false })

    if (error) return { students: [], error: error.message }

    return { students: students || [], error: null }
  } catch (error) {
    console.error("Get students error:", error)
    return { students: [], error: "Failed to fetch students" }
  }
}

export async function getStudentById(id: string) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { student: null, error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()

    if (!userData) return { student: null, error: "User not found" }

    const { data: student, error } = await supabase
      .from("students")
      .select(`
        *,
        enrollments (
          id,
          status,
          term_id,
          classes (
            id,
            name,
            grades (
              name,
              level_no
            )
          ),
          terms (
            academic_yr,
            term_no,
            is_current
          )
        ),
        student_guardians (
          relationship,
          is_primary,
          guardians (
            id,
            first_name,
            last_name,
            phone,
            email,
            national_id,
            address
          )
        )
      `)
      .eq("id", id)
      .eq("school_id", userData.school_id)
      .is("deleted_at", null)
      .single()

    if (error) return { student: null, error: error.message }

    return { student, error: null }
  } catch (error) {
    console.error("Get student error:", error)
    return { student: null, error: "Failed to fetch student" }
  }
}

export async function updateStudent(id: string, prevState: any, formData: FormData) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()

    if (!userData) return { error: "User not found" }

    const updateData = {
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      student_no: formData.get("student_no") as string,
      gender: formData.get("gender") as string,
      dob: formData.get("dob") as string,
      admission_dt: formData.get("admission_dt") as string,
      status: formData.get("status") as string,
      medical_flags: formData.get("medical_flags") ? JSON.parse(formData.get("medical_flags") as string) : null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from("students")
      .update(updateData)
      .eq("id", id)
      .eq("school_id", userData.school_id)

    if (error) return { error: error.message }

    revalidatePath("/students")
    revalidatePath(`/students/${id}`)
    return { success: "Student updated successfully" }
  } catch (error) {
    console.error("Update student error:", error)
    return { error: "Failed to update student" }
  }
}

export async function deleteStudent(id: string) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()

    if (!userData) return { error: "User not found" }

    // Soft delete
    const { error } = await supabase
      .from("students")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("school_id", userData.school_id)

    if (error) return { error: error.message }

    revalidatePath("/students")
    return { success: "Student deleted successfully" }
  } catch (error) {
    console.error("Delete student error:", error)
    return { error: "Failed to delete student" }
  }
}
