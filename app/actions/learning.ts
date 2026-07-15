"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Types
export interface Course {
  id: string
  title: string
  description: string
  category: string
  type: string
  level: string
  duration: number
  instructor: string
  price: number
  rating: number
  enrollments: number
  status: string
  tags: string[]
  prerequisites: string[]
  learning_objectives: string[]
  company_id: string
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  course_id: string
  employee_id: string
  enrollment_date: string
  start_date: string | null
  completion_date: string | null
  status: string
  progress: number
  score: number | null
  certificate_issued: boolean
  company_id: string
  course?: Course
  employee?: {
    id: string
    full_name: string
    employee_id: string
    department: string | null
  }
}

export interface LearningPath {
  id: string
  title: string
  description: string
  category: string
  courses: string[]
  total_duration: number
  difficulty: string
  enrollments: number
  completion_rate: number
  status: string
  company_id: string
}

// Get courses
export async function getCourses() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: [], error: "Not authenticated" }

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

  if (!employee) return { data: [], error: "Employee not found" }

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("company_id", employee.company_id)
    .order("created_at", { ascending: false })

  if (error) {
    // If table doesn't exist, return empty array
    if (error.code === "42P01") {
      return { data: [], error: null }
    }
    return { data: [], error: error.message }
  }

  return { data: data || [], error: null }
}

// Create course
export async function createCourse(course: Partial<Course>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

  if (!employee) return { success: false, error: "Employee not found" }

  const { data, error } = await supabase
    .from("courses")
    .insert({
      ...course,
      company_id: employee.company_id,
      status: "active",
      enrollments: 0,
      rating: 0,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath("/app/learning")
  return { success: true, data }
}

// Get enrollments
export async function getEnrollments() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: [], error: "Not authenticated" }

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

  if (!employee) return { data: [], error: "Employee not found" }

  const { data, error } = await supabase
    .from("course_enrollments")
    .select(`
      *,
      course:courses(*),
      employee:employees(id, full_name, employee_id, department)
    `)
    .eq("company_id", employee.company_id)
    .order("enrollment_date", { ascending: false })

  if (error) {
    if (error.code === "42P01") {
      return { data: [], error: null }
    }
    return { data: [], error: error.message }
  }

  return { data: data || [], error: null }
}

// Enroll in course
export async function enrollInCourse(courseId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

  if (!employee) return { success: false, error: "Employee not found" }

  const { data, error } = await supabase
    .from("course_enrollments")
    .insert({
      course_id: courseId,
      employee_id: user.id,
      company_id: employee.company_id,
      enrollment_date: new Date().toISOString(),
      status: "enrolled",
      progress: 0,
      certificate_issued: false,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  // Update course enrollment count
  await supabase.rpc("increment_course_enrollments", { course_id: courseId })

  revalidatePath("/app/learning")
  return { success: true, data }
}

// Update enrollment progress
export async function updateEnrollmentProgress(enrollmentId: string, progress: number, score?: number) {
  const supabase = await createClient()

  const updates: Record<string, unknown> = {
    progress,
    updated_at: new Date().toISOString(),
  }

  if (progress > 0) {
    updates.status = "in-progress"
    updates.start_date = updates.start_date || new Date().toISOString()
  }

  if (progress >= 100) {
    updates.status = "completed"
    updates.completion_date = new Date().toISOString()
    if (score !== undefined) {
      updates.score = score
    }
  }

  const { error } = await supabase.from("course_enrollments").update(updates).eq("id", enrollmentId)

  if (error) return { success: false, error: error.message }

  revalidatePath("/app/learning")
  return { success: true }
}

// Issue certificate
export async function issueCertificate(enrollmentId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("course_enrollments")
    .update({
      certificate_issued: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId)

  if (error) return { success: false, error: error.message }

  revalidatePath("/app/learning")
  return { success: true }
}

// Get learning stats
export async function getLearningStats() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

  if (!employee) return null

  // Get course count
  const { count: coursesCount } = await supabase
    .from("courses")
    .select("id", { count: "exact" })
    .eq("company_id", employee.company_id)
    .eq("status", "active")

  // Get enrollment count
  const { count: enrollmentsCount } = await supabase
    .from("course_enrollments")
    .select("id", { count: "exact" })
    .eq("company_id", employee.company_id)

  // Get completed count
  const { count: completedCount } = await supabase
    .from("course_enrollments")
    .select("id", { count: "exact" })
    .eq("company_id", employee.company_id)
    .eq("status", "completed")

  // Get certificates count
  const { count: certificatesCount } = await supabase
    .from("course_enrollments")
    .select("id", { count: "exact" })
    .eq("company_id", employee.company_id)
    .eq("certificate_issued", true)

  const completionRate =
    enrollmentsCount && enrollmentsCount > 0 ? Math.round(((completedCount || 0) / enrollmentsCount) * 100) : 0

  return {
    activeCourses: coursesCount || 0,
    totalEnrollments: enrollmentsCount || 0,
    completionRate,
    certificates: certificatesCount || 0,
  }
}
