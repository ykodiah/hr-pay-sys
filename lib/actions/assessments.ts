"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Assessment Management
export async function createAssessment(prevState: any, formData: FormData) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { error: "User not found" }

    const assessmentData = {
      school_id: userData.school_id,
      class_subject_id: Number.parseInt(formData.get("class_subject_id") as string),
      term_id: Number.parseInt(formData.get("term_id") as string),
      title: formData.get("title") as string,
      type: formData.get("type") as string,
      max_score: Number.parseFloat(formData.get("max_score") as string),
      weight_pct: Number.parseFloat(formData.get("weight_pct") as string),
      moderation_status: "pending",
    }

    const { data: assessment, error } = await supabase.from("assessments").insert(assessmentData).select().single()
    if (error) return { error: error.message }

    revalidatePath("/assessments")
    return { success: "Assessment created successfully", assessment_id: assessment.id }
  } catch (error) {
    console.error("Create assessment error:", error)
    return { error: "Failed to create assessment" }
  }
}

export async function getAssessments(classSubjectId?: string, termId?: string) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { assessments: [], error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { assessments: [], error: "User not found" }

    let query = supabase
      .from("assessments")
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
          subjects (
            name,
            code
          ),
          staff (
            first_name,
            last_name
          )
        ),
        terms (
          academic_yr,
          term_no
        ),
        assessment_scores (
          id,
          raw_score,
          moderated_score,
          students (
            first_name,
            last_name,
            student_no
          )
        )
      `)
      .eq("school_id", userData.school_id)

    if (classSubjectId) {
      query = query.eq("class_subject_id", classSubjectId)
    }

    if (termId) {
      query = query.eq("term_id", termId)
    }

    const { data: assessments, error } = await query.order("created_at", { ascending: false })

    if (error) return { assessments: [], error: error.message }
    return { assessments: assessments || [], error: null }
  } catch (error) {
    console.error("Get assessments error:", error)
    return { assessments: [], error: "Failed to fetch assessments" }
  }
}

export async function getAssessmentById(id: string) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { assessment: null, error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { assessment: null, error: "User not found" }

    const { data: assessment, error } = await supabase
      .from("assessments")
      .select(`
        *,
        class_subjects (
          id,
          classes (
            id,
            name,
            grades (
              name
            ),
            enrollments (
              students (
                id,
                first_name,
                last_name,
                student_no
              )
            )
          ),
          subjects (
            name,
            code
          ),
          staff (
            first_name,
            last_name
          )
        ),
        terms (
          academic_yr,
          term_no
        ),
        assessment_scores (
          id,
          student_id,
          raw_score,
          moderated_score,
          students (
            id,
            first_name,
            last_name,
            student_no
          )
        )
      `)
      .eq("id", id)
      .eq("school_id", userData.school_id)
      .single()

    if (error) return { assessment: null, error: error.message }
    return { assessment, error: null }
  } catch (error) {
    console.error("Get assessment error:", error)
    return { assessment: null, error: "Failed to fetch assessment" }
  }
}

// Score Management
export async function updateAssessmentScore(assessmentId: string, studentId: string, rawScore: number) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { error: "User not found" }

    // Check if score already exists
    const { data: existingScore } = await supabase
      .from("assessment_scores")
      .select("id")
      .eq("assessment_id", assessmentId)
      .eq("student_id", studentId)
      .eq("school_id", userData.school_id)
      .single()

    const scoreData = {
      school_id: userData.school_id,
      assessment_id: Number.parseInt(assessmentId),
      student_id: Number.parseInt(studentId),
      raw_score: rawScore,
      moderated_score: rawScore, // Initially same as raw score
    }

    let error
    if (existingScore) {
      // Update existing score
      const result = await supabase
        .from("assessment_scores")
        .update({ raw_score: rawScore, moderated_score: rawScore, updated_at: new Date().toISOString() })
        .eq("id", existingScore.id)
      error = result.error
    } else {
      // Insert new score
      const result = await supabase.from("assessment_scores").insert(scoreData)
      error = result.error
    }

    if (error) return { error: error.message }

    revalidatePath(`/assessments/${assessmentId}`)
    return { success: "Score updated successfully" }
  } catch (error) {
    console.error("Update score error:", error)
    return { error: "Failed to update score" }
  }
}

export async function bulkUpdateScores(prevState: any, formData: FormData) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { error: "User not found" }

    const assessmentId = formData.get("assessment_id") as string
    const scoresData = JSON.parse(formData.get("scores_data") as string)

    for (const scoreEntry of scoresData) {
      if (scoreEntry.score !== null && scoreEntry.score !== "") {
        await updateAssessmentScore(assessmentId, scoreEntry.student_id, Number.parseFloat(scoreEntry.score))
      }
    }

    revalidatePath(`/assessments/${assessmentId}`)
    return { success: "All scores updated successfully" }
  } catch (error) {
    console.error("Bulk update scores error:", error)
    return { error: "Failed to update scores" }
  }
}

// Get Class Subjects for Assessment Creation
export async function getClassSubjects() {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { classSubjects: [], error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { classSubjects: [], error: "User not found" }

    const { data: classSubjects, error } = await supabase
      .from("class_subjects")
      .select(`
        *,
        classes (
          name,
          grades (
            name
          )
        ),
        subjects (
          name,
          code
        ),
        staff (
          first_name,
          last_name
        )
      `)
      .eq("school_id", userData.school_id)
      .order("created_at", { ascending: false })

    if (error) return { classSubjects: [], error: error.message }
    return { classSubjects: classSubjects || [], error: null }
  } catch (error) {
    console.error("Get class subjects error:", error)
    return { classSubjects: [], error: "Failed to fetch class subjects" }
  }
}

// Get Current Terms
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
      .order("academic_yr", { ascending: false })
      .order("term_no", { ascending: true })

    if (error) return { terms: [], error: error.message }
    return { terms: terms || [], error: null }
  } catch (error) {
    console.error("Get terms error:", error)
    return { terms: [], error: "Failed to fetch terms" }
  }
}

// Grade Analytics
export async function getGradeAnalytics(classId?: string, subjectId?: string, termId?: string) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { analytics: null, error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { analytics: null, error: "User not found" }

    // This would typically involve complex queries to calculate averages, distributions, etc.
    // For now, returning a basic structure
    const analytics = {
      totalAssessments: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passRate: 0,
      gradeDistribution: {
        A: 0,
        B: 0,
        C: 0,
        D: 0,
        F: 0,
      },
    }

    return { analytics, error: null }
  } catch (error) {
    console.error("Get analytics error:", error)
    return { analytics: null, error: "Failed to fetch analytics" }
  }
}
