"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Grade Management
export async function createGrade(prevState: any, formData: FormData) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { error: "User not found" }

    const gradeData = {
      school_id: userData.school_id,
      name: formData.get("name") as string,
      level_no: Number.parseInt(formData.get("level_no") as string),
    }

    const { error } = await supabase.from("grades").insert(gradeData)
    if (error) return { error: error.message }

    revalidatePath("/academic/classes")
    return { success: "Grade created successfully" }
  } catch (error) {
    console.error("Create grade error:", error)
    return { error: "Failed to create grade" }
  }
}

export async function getGrades() {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { grades: [], error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { grades: [], error: "User not found" }

    const { data: grades, error } = await supabase
      .from("grades")
      .select("*")
      .eq("school_id", userData.school_id)
      .order("level_no", { ascending: true })

    if (error) return { grades: [], error: error.message }
    return { grades: grades || [], error: null }
  } catch (error) {
    console.error("Get grades error:", error)
    return { grades: [], error: "Failed to fetch grades" }
  }
}

// Class Management
export async function createClass(prevState: any, formData: FormData) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { error: "User not found" }

    const classData = {
      school_id: userData.school_id,
      name: formData.get("name") as string,
      grade_id: Number.parseInt(formData.get("grade_id") as string),
      tutor_id: formData.get("tutor_id") ? Number.parseInt(formData.get("tutor_id") as string) : null,
      capacity: Number.parseInt(formData.get("capacity") as string),
    }

    const { error } = await supabase.from("classes").insert(classData)
    if (error) return { error: error.message }

    revalidatePath("/academic/classes")
    return { success: "Class created successfully" }
  } catch (error) {
    console.error("Create class error:", error)
    return { error: "Failed to create class" }
  }
}

export async function getClasses() {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { classes: [], error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { classes: [], error: "User not found" }

    const { data: classes, error } = await supabase
      .from("classes")
      .select(`
        *,
        grades (
          name,
          level_no
        ),
        staff (
          first_name,
          last_name
        ),
        enrollments (
          id,
          status
        )
      `)
      .eq("school_id", userData.school_id)
      .order("created_at", { ascending: false })

    if (error) return { classes: [], error: error.message }
    return { classes: classes || [], error: null }
  } catch (error) {
    console.error("Get classes error:", error)
    return { classes: [], error: "Failed to fetch classes" }
  }
}

// Subject Management
export async function createSubject(prevState: any, formData: FormData) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { error: "User not found" }

    const subjectData = {
      school_id: userData.school_id,
      name: formData.get("name") as string,
      code: formData.get("code") as string,
    }

    const { error } = await supabase.from("subjects").insert(subjectData)
    if (error) return { error: error.message }

    revalidatePath("/academic/subjects")
    return { success: "Subject created successfully" }
  } catch (error) {
    console.error("Create subject error:", error)
    return { error: "Failed to create subject" }
  }
}

export async function getSubjects() {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { subjects: [], error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { subjects: [], error: "User not found" }

    const { data: subjects, error } = await supabase
      .from("subjects")
      .select(`
        *,
        class_subjects (
          id,
          classes (
            name,
            grades (
              name
            )
          ),
          staff (
            first_name,
            last_name
          )
        )
      `)
      .eq("school_id", userData.school_id)
      .order("name", { ascending: true })

    if (error) return { subjects: [], error: error.message }
    return { subjects: subjects || [], error: null }
  } catch (error) {
    console.error("Get subjects error:", error)
    return { subjects: [], error: "Failed to fetch subjects" }
  }
}

export async function assignSubjectToClass(prevState: any, formData: FormData) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { error: "User not found" }

    const assignmentData = {
      school_id: userData.school_id,
      subject_id: Number.parseInt(formData.get("subject_id") as string),
      class_id: Number.parseInt(formData.get("class_id") as string),
      teacher_id: formData.get("teacher_id") ? Number.parseInt(formData.get("teacher_id") as string) : null,
    }

    const { error } = await supabase.from("class_subjects").insert(assignmentData)
    if (error) return { error: error.message }

    revalidatePath("/academic/subjects")
    return { success: "Subject assigned to class successfully" }
  } catch (error) {
    console.error("Assign subject error:", error)
    return { error: "Failed to assign subject to class" }
  }
}

// Term Management
export async function createTerm(prevState: any, formData: FormData) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { error: "User not found" }

    const isCurrent = formData.get("is_current") === "true"

    // If setting as current, unset other current terms
    if (isCurrent) {
      await supabase.from("terms").update({ is_current: false }).eq("school_id", userData.school_id)
    }

    const termData = {
      school_id: userData.school_id,
      academic_yr: formData.get("academic_yr") as string,
      term_no: Number.parseInt(formData.get("term_no") as string),
      starts_on: formData.get("starts_on") as string,
      ends_on: formData.get("ends_on") as string,
      is_current: isCurrent,
    }

    const { error } = await supabase.from("terms").insert(termData)
    if (error) return { error: error.message }

    revalidatePath("/academic/terms")
    return { success: "Term created successfully" }
  } catch (error) {
    console.error("Create term error:", error)
    return { error: "Failed to create term" }
  }
}

export async function getTerms() {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { terms: [], error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { terms: [], error: "User not found" }

    const { data: terms, error } = await supabase
      .from("terms")
      .select("*")
      .eq("school_id", userData.school_id)
      .order("academic_yr", { ascending: false })
      .order("term_no", { ascending: true })

    if (error) return { terms: [], error: error.message }
    return { terms: terms || [], error: null }
  } catch (error) {
    console.error("Get terms error:", error)
    return { terms: [], error: "Failed to fetch terms" }
  }
}

export async function setCurrentTerm(termId: number) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { error: "User not found" }

    // Unset all current terms
    await supabase.from("terms").update({ is_current: false }).eq("school_id", userData.school_id)

    // Set the selected term as current
    const { error } = await supabase
      .from("terms")
      .update({ is_current: true })
      .eq("id", termId)
      .eq("school_id", userData.school_id)

    if (error) return { error: error.message }

    revalidatePath("/academic/terms")
    return { success: "Current term updated successfully" }
  } catch (error) {
    console.error("Set current term error:", error)
    return { error: "Failed to set current term" }
  }
}

export async function getCurrentTerms() {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { terms: [], error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { terms: [], error: "User not found" }

    const { data: terms, error } = await supabase
      .from("terms")
      .select("*")
      .eq("school_id", userData.school_id)
      .eq("is_current", true)
      .order("academic_yr", { ascending: false })
      .order("term_no", { ascending: true })

    if (error) return { terms: [], error: error.message }
    return { terms: terms || [], error: null }
  } catch (error) {
    console.error("Get current terms error:", error)
    return { terms: [], error: "Failed to fetch current terms" }
  }
}

// Staff/Teachers
export async function getTeachers() {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { teachers: [], error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { teachers: [], error: "User not found" }

    const { data: teachers, error } = await supabase
      .from("staff")
      .select("*")
      .eq("school_id", userData.school_id)
      .eq("is_teaching", true)
      .is("deleted_at", null)
      .order("first_name", { ascending: true })

    if (error) return { teachers: [], error: error.message }
    return { teachers: teachers || [], error: null }
  } catch (error) {
    console.error("Get teachers error:", error)
    return { teachers: [], error: "Failed to fetch teachers" }
  }
}
