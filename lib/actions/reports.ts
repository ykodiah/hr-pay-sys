"use server"

import { createServerClient } from "@/lib/supabase/server"

export async function getStudentEnrollmentStats() {
  try {
    const supabase = await createServerClient()

    // Get enrollment by grade
    const { data: enrollmentByGrade, error: gradeError } = await supabase
      .from("enrollments")
      .select(`
        id,
        classes(
          id,
          name,
          grades(id, name)
        )
      `)
      .eq("status", "active")

    if (gradeError) throw gradeError

    // Get total students
    const { count: totalStudents, error: countError } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    if (countError) throw countError

    // Get new enrollments this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: newEnrollments, error: newError } = await supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString())

    if (newError) throw newError

    // Process enrollment by grade
    const gradeStats = enrollmentByGrade?.reduce((acc: any, enrollment: any) => {
      const gradeName = enrollment.classes?.grades?.name || "Unknown"
      acc[gradeName] = (acc[gradeName] || 0) + 1
      return acc
    }, {})

    return {
      totalStudents: totalStudents || 0,
      newEnrollments: newEnrollments || 0,
      gradeStats: gradeStats || {},
      error: null,
    }
  } catch (error) {
    console.error("Error fetching enrollment stats:", error)
    return {
      totalStudents: 0,
      newEnrollments: 0,
      gradeStats: {},
      error: "Failed to fetch enrollment statistics",
    }
  }
}

export async function getFinancialStats() {
  try {
    const supabase = await createServerClient()

    // Get total revenue this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: monthlyPayments, error: paymentsError } = await supabase
      .from("payments")
      .select("amount")
      .eq("status", "completed")
      .gte("payment_date", startOfMonth.toISOString())

    if (paymentsError) throw paymentsError

    const monthlyRevenue = monthlyPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0

    // Get outstanding balances
    const { data: outstandingInvoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("balance_due")
      .neq("status", "paid")

    if (invoicesError) throw invoicesError

    const outstandingBalance = outstandingInvoices?.reduce((sum, invoice) => sum + (invoice.balance_due || 0), 0) || 0

    // Get payment trends (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: paymentTrends, error: trendsError } = await supabase
      .from("payments")
      .select("amount, payment_date")
      .eq("status", "completed")
      .gte("payment_date", sixMonthsAgo.toISOString())
      .order("payment_date")

    if (trendsError) throw trendsError

    // Group payments by month
    const monthlyTrends = paymentTrends?.reduce((acc: any, payment: any) => {
      const month = new Date(payment.payment_date).toISOString().slice(0, 7) // YYYY-MM
      acc[month] = (acc[month] || 0) + (payment.amount || 0)
      return acc
    }, {})

    return {
      monthlyRevenue,
      outstandingBalance,
      monthlyTrends: monthlyTrends || {},
      error: null,
    }
  } catch (error) {
    console.error("Error fetching financial stats:", error)
    return {
      monthlyRevenue: 0,
      outstandingBalance: 0,
      monthlyTrends: {},
      error: "Failed to fetch financial statistics",
    }
  }
}

export async function getAcademicPerformanceStats() {
  try {
    const supabase = await createServerClient()

    // Get average scores by subject
    const { data: assessmentScores, error: scoresError } = await supabase.from("assessment_scores").select(`
        score,
        assessments(
          id,
          max_score,
          class_subjects(
            subjects(name)
          )
        )
      `)

    if (scoresError) throw scoresError

    // Calculate average performance by subject
    const subjectPerformance = assessmentScores?.reduce((acc: any, score: any) => {
      const subjectName = score.assessments?.class_subjects?.subjects?.name || "Unknown"
      const percentage = (score.score / score.assessments?.max_score) * 100

      if (!acc[subjectName]) {
        acc[subjectName] = { total: 0, count: 0 }
      }
      acc[subjectName].total += percentage
      acc[subjectName].count += 1

      return acc
    }, {})

    // Calculate averages
    const subjectAverages = Object.entries(subjectPerformance || {}).map(([subject, data]: [string, any]) => ({
      subject,
      average: Math.round(data.total / data.count),
    }))

    // Get recent assessment completion rates
    const { data: recentAssessments, error: assessmentsError } = await supabase
      .from("assessments")
      .select(`
        id,
        title,
        assessment_scores(id)
      `)
      .order("created_at", { ascending: false })
      .limit(10)

    if (assessmentsError) throw assessmentsError

    return {
      subjectAverages,
      recentAssessments: recentAssessments || [],
      error: null,
    }
  } catch (error) {
    console.error("Error fetching academic performance stats:", error)
    return {
      subjectAverages: [],
      recentAssessments: [],
      error: "Failed to fetch academic performance statistics",
    }
  }
}

export async function getCommunicationStats() {
  try {
    const supabase = await createServerClient()

    // Get message stats
    const { count: totalMessages, error: messagesError } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })

    if (messagesError) throw messagesError

    // Get announcement stats
    const { count: totalAnnouncements, error: announcementsError } = await supabase
      .from("announcements")
      .select("*", { count: "exact", head: true })

    if (announcementsError) throw announcementsError

    // Get recent activity
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - 7)

    const { count: weeklyMessages, error: weeklyError } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfWeek.toISOString())

    if (weeklyError) throw weeklyError

    return {
      totalMessages: totalMessages || 0,
      totalAnnouncements: totalAnnouncements || 0,
      weeklyMessages: weeklyMessages || 0,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching communication stats:", error)
    return {
      totalMessages: 0,
      totalAnnouncements: 0,
      weeklyMessages: 0,
      error: "Failed to fetch communication statistics",
    }
  }
}
