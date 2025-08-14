"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Fee Head Management
export async function createFeeHead(prevState: any, formData: FormData) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { error: "User not found" }

    const feeHeadData = {
      school_id: userData.school_id,
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      is_recurring: formData.get("is_recurring") === "true",
    }

    const { error } = await supabase.from("fee_heads").insert(feeHeadData)
    if (error) return { error: error.message }

    revalidatePath("/finance/structure")
    return { success: "Fee head created successfully" }
  } catch (error) {
    console.error("Create fee head error:", error)
    return { error: "Failed to create fee head" }
  }
}

export async function getFeeHeads() {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { feeHeads: [], error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { feeHeads: [], error: "User not found" }

    const { data: feeHeads, error } = await supabase
      .from("fee_heads")
      .select(`
        *,
        fee_structures (
          id,
          amount,
          currency_code,
          grades (
            name
          ),
          terms (
            academic_yr,
            term_no
          )
        )
      `)
      .eq("school_id", userData.school_id)
      .order("name", { ascending: true })

    if (error) return { feeHeads: [], error: error.message }
    return { feeHeads: feeHeads || [], error: null }
  } catch (error) {
    console.error("Get fee heads error:", error)
    return { feeHeads: [], error: "Failed to fetch fee heads" }
  }
}

// Fee Structure Management
export async function createFeeStructure(prevState: any, formData: FormData) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { error: "User not found" }

    const feeStructureData = {
      school_id: userData.school_id,
      fee_head_id: Number.parseInt(formData.get("fee_head_id") as string),
      grade_id: Number.parseInt(formData.get("grade_id") as string),
      term_id: Number.parseInt(formData.get("term_id") as string),
      amount: Number.parseFloat(formData.get("amount") as string),
      currency_code: (formData.get("currency_code") as string) || "USD",
    }

    const { error } = await supabase.from("fee_structures").insert(feeStructureData)
    if (error) return { error: error.message }

    revalidatePath("/finance/structure")
    return { success: "Fee structure created successfully" }
  } catch (error) {
    console.error("Create fee structure error:", error)
    return { error: "Failed to create fee structure" }
  }
}

export async function getFeeStructures() {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { feeStructures: [], error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { feeStructures: [], error: "User not found" }

    const { data: feeStructures, error } = await supabase
      .from("fee_structures")
      .select(`
        *,
        fee_heads (
          name,
          code
        ),
        grades (
          name,
          level_no
        ),
        terms (
          academic_yr,
          term_no
        )
      `)
      .eq("school_id", userData.school_id)
      .order("created_at", { ascending: false })

    if (error) return { feeStructures: [], error: error.message }
    return { feeStructures: feeStructures || [], error: null }
  } catch (error) {
    console.error("Get fee structures error:", error)
    return { feeStructures: [], error: "Failed to fetch fee structures" }
  }
}

// Invoice Management
export async function generateInvoices(prevState: any, formData: FormData) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { error: "User not found" }

    const gradeId = Number.parseInt(formData.get("grade_id") as string)
    const termId = Number.parseInt(formData.get("term_id") as string)
    const dueDate = formData.get("due_date") as string

    // Get students in the selected grade
    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select(`
        id,
        first_name,
        last_name,
        enrollments!inner (
          class_id,
          classes!inner (
            grade_id
          )
        )
      `)
      .eq("school_id", userData.school_id)
      .eq("enrollments.classes.grade_id", gradeId)
      .eq("status", "active")

    if (studentsError) return { error: studentsError.message }

    // Get fee structures for the grade and term
    const { data: feeStructures, error: feeError } = await supabase
      .from("fee_structures")
      .select(`
        *,
        fee_heads (
          name,
          code
        )
      `)
      .eq("school_id", userData.school_id)
      .eq("grade_id", gradeId)
      .eq("term_id", termId)

    if (feeError) return { error: feeError.message }

    if (!feeStructures || feeStructures.length === 0) {
      return { error: "No fee structures found for the selected grade and term" }
    }

    let invoicesCreated = 0

    // Generate invoices for each student
    for (const student of students || []) {
      const totalAmount = feeStructures.reduce((sum, fs) => sum + fs.amount, 0)

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          school_id: userData.school_id,
          student_id: student.id,
          term_id: termId,
          issue_date: new Date().toISOString().split("T")[0],
          due_date: dueDate,
          total_amount: totalAmount,
          balance_due: totalAmount,
          currency_code: feeStructures[0].currency_code,
          status: "pending",
          meta: {
            generated_by: user.email,
            generated_at: new Date().toISOString(),
          },
        })
        .select()
        .single()

      if (invoiceError) continue

      // Create invoice lines
      for (const feeStructure of feeStructures) {
        await supabase.from("invoice_lines").insert({
          school_id: userData.school_id,
          invoice_id: invoice.id,
          fee_head_id: feeStructure.fee_head_id,
          description: feeStructure.fee_heads.name,
          qty: 1,
          unit_price: feeStructure.amount,
          line_amount: feeStructure.amount,
          currency_code: feeStructure.currency_code,
        })
      }

      invoicesCreated++
    }

    revalidatePath("/finance/invoices")
    return { success: `Generated ${invoicesCreated} invoices successfully` }
  } catch (error) {
    console.error("Generate invoices error:", error)
    return { error: "Failed to generate invoices" }
  }
}

export async function getInvoices(status?: string, studentId?: string) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { invoices: [], error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { invoices: [], error: "User not found" }

    let query = supabase
      .from("invoices")
      .select(`
        *,
        students (
          first_name,
          last_name,
          student_no
        ),
        terms (
          academic_yr,
          term_no
        ),
        invoice_lines (
          id,
          description,
          qty,
          unit_price,
          line_amount,
          fee_heads (
            name,
            code
          )
        ),
        payments (
          id,
          amount,
          status,
          paid_at
        )
      `)
      .eq("school_id", userData.school_id)
      .is("deleted_at", null)

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (studentId) {
      query = query.eq("student_id", studentId)
    }

    const { data: invoices, error } = await query.order("created_at", { ascending: false })

    if (error) return { invoices: [], error: error.message }
    return { invoices: invoices || [], error: null }
  } catch (error) {
    console.error("Get invoices error:", error)
    return { invoices: [], error: "Failed to fetch invoices" }
  }
}

export async function getInvoiceById(id: string) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { invoice: null, error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { invoice: null, error: "User not found" }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(`
        *,
        students (
          first_name,
          last_name,
          student_no,
          student_guardians (
            guardians (
              first_name,
              last_name,
              email,
              phone
            )
          )
        ),
        terms (
          academic_yr,
          term_no
        ),
        invoice_lines (
          id,
          description,
          qty,
          unit_price,
          line_amount,
          currency_code,
          fee_heads (
            name,
            code
          )
        ),
        payments (
          id,
          amount,
          status,
          paid_at,
          payer_name,
          payer_phone,
          txn_reference
        )
      `)
      .eq("id", id)
      .eq("school_id", userData.school_id)
      .single()

    if (error) return { invoice: null, error: error.message }
    return { invoice, error: null }
  } catch (error) {
    console.error("Get invoice error:", error)
    return { invoice: null, error: "Failed to fetch invoice" }
  }
}

// Payment Management
export async function recordPayment(prevState: any, formData: FormData) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { error: "User not found" }

    const invoiceId = Number.parseInt(formData.get("invoice_id") as string)
    const amount = Number.parseFloat(formData.get("amount") as string)
    const payerName = formData.get("payer_name") as string
    const payerPhone = formData.get("payer_phone") as string
    const txnReference = formData.get("txn_reference") as string

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .eq("school_id", userData.school_id)
      .single()

    if (invoiceError || !invoice) return { error: "Invoice not found" }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        school_id: userData.school_id,
        invoice_id: invoiceId,
        amount: amount,
        currency_code: invoice.currency_code,
        status: "completed",
        paid_at: new Date().toISOString(),
        payer_name: payerName,
        payer_phone: payerPhone,
        txn_reference: txnReference,
        meta: {
          recorded_by: user.email,
          recorded_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (paymentError) return { error: paymentError.message }

    // Update invoice balance
    const newBalance = Math.max(0, invoice.balance_due - amount)
    const newStatus = newBalance === 0 ? "paid" : newBalance < invoice.total_amount ? "partial" : "pending"

    await supabase
      .from("invoices")
      .update({
        balance_due: newBalance,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)

    revalidatePath("/finance/invoices")
    revalidatePath(`/finance/invoices/${invoiceId}`)
    return { success: "Payment recorded successfully" }
  } catch (error) {
    console.error("Record payment error:", error)
    return { error: "Failed to record payment" }
  }
}

export async function getPayments() {
  try {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { payments: [], error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { payments: [], error: "User not found" }

    const { data: payments, error } = await supabase
      .from("payments")
      .select(`
        *,
        invoices(
          id,
          students(
            first_name,
            last_name,
            student_no
          )
        ),
        payment_channels(
          name
        )
      `)
      .eq("school_id", userData.school_id)
      .order("payment_date", { ascending: false })

    if (error) throw error

    return { payments: payments || [], error: null }
  } catch (error) {
    console.error("Error fetching payments:", error)
    return { payments: [], error: "Failed to fetch payments" }
  }
}

// Scholarship Management
export async function createScholarship(prevState: any, formData: FormData) {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { error: "User not found" }

    const scholarshipData = {
      school_id: userData.school_id,
      student_id: Number.parseInt(formData.get("student_id") as string),
      name: formData.get("name") as string,
      percent_off: formData.get("percent_off") ? Number.parseFloat(formData.get("percent_off") as string) : null,
      amount_off: formData.get("amount_off") ? Number.parseFloat(formData.get("amount_off") as string) : null,
      starts_on: formData.get("starts_on") as string,
      ends_on: formData.get("ends_on") as string,
    }

    const { error } = await supabase.from("scholarships").insert(scholarshipData)
    if (error) return { error: error.message }

    revalidatePath("/finance/scholarships")
    return { success: "Scholarship created successfully" }
  } catch (error) {
    console.error("Create scholarship error:", error)
    return { error: "Failed to create scholarship" }
  }
}

export async function getScholarships() {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { scholarships: [], error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { scholarships: [], error: "User not found" }

    const { data: scholarships, error } = await supabase
      .from("scholarships")
      .select(`
        *,
        students (
          first_name,
          last_name,
          student_no
        )
      `)
      .eq("school_id", userData.school_id)
      .order("created_at", { ascending: false })

    if (error) return { scholarships: [], error: error.message }
    return { scholarships: scholarships || [], error: null }
  } catch (error) {
    console.error("Get scholarships error:", error)
    return { scholarships: [], error: "Failed to fetch scholarships" }
  }
}

// Financial Analytics
export async function getFinancialSummary() {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { summary: null, error: "Not authenticated" }

    const { data: userData } = await supabase.from("users").select("school_id").eq("email", user.email).single()
    if (!userData) return { summary: null, error: "User not found" }

    // Get invoice totals
    const { data: invoiceSummary } = await supabase
      .from("invoices")
      .select("total_amount, balance_due, status")
      .eq("school_id", userData.school_id)
      .is("deleted_at", null)

    // Get payment totals
    const { data: paymentSummary } = await supabase
      .from("payments")
      .select("amount, status")
      .eq("school_id", userData.school_id)

    const totalInvoiced = invoiceSummary?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
    const totalOutstanding = invoiceSummary?.reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0
    const totalCollected = paymentSummary?.reduce((sum, pay) => sum + (pay.amount || 0), 0) || 0

    const paidInvoices = invoiceSummary?.filter((inv) => inv.status === "paid").length || 0
    const pendingInvoices = invoiceSummary?.filter((inv) => inv.status === "pending").length || 0
    const partialInvoices = invoiceSummary?.filter((inv) => inv.status === "partial").length || 0

    const summary = {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      collectionRate: totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0,
      invoiceStats: {
        total: invoiceSummary?.length || 0,
        paid: paidInvoices,
        pending: pendingInvoices,
        partial: partialInvoices,
      },
    }

    return { summary, error: null }
  } catch (error) {
    console.error("Get financial summary error:", error)
    return { summary: null, error: "Failed to fetch financial summary" }
  }
}
