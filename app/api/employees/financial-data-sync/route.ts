import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

/**
 * POST: Capture and sync financial data from onboarding checklist to employee record
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const body = await req.json()

    let companyId = body.company_id
    if (!companyId) {
      companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId
    }
    if (!companyId) return NextResponse.json({ error: "company_id required" }, { status: 400 })

    const { employee_id, checklist_id, financial_data } = body

    if (!employee_id || !checklist_id || !financial_data) {
      return NextResponse.json(
        { error: "employee_id, checklist_id, and financial_data are required" },
        { status: 400 },
      )
    }

    // Verify employee exists
    const { data: employee, error: empError } = await client
      .from("employees")
      .select("id")
      .eq("id", employee_id)
      .eq("company_id", companyId)
      .single()

    if (empError || !employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Create financial data snapshot record
    const { data: snapshot, error: snapshotError } = await client
      .from("employee_onboarding_financial_data")
      .insert({
        company_id: companyId,
        employee_id,
        onboarding_checklist_id: checklist_id,
        bank_name: financial_data.bank_name,
        bank_branch: financial_data.bank_branch,
        bank_account_number: financial_data.bank_account_number,
        bank_account_type: financial_data.bank_account_type,
        account_holder_name: financial_data.account_holder_name,
        ssnit_number: financial_data.ssnit_number,
        ssnit_registered_date: financial_data.ssnit_registered_date,
        monthly_salary: financial_data.monthly_salary,
        salary_currency: financial_data.salary_currency || "GHS",
        tax_id: financial_data.tax_id,
        tax_status: financial_data.tax_status,
        pension_id: financial_data.pension_id,
        pension_provider: financial_data.pension_provider,
        health_insurance_provider: financial_data.health_insurance_provider,
        health_insurance_number: financial_data.health_insurance_number,
        insurance_beneficiary: financial_data.insurance_beneficiary,
        insurance_relationship: financial_data.insurance_relationship,
        other_deductions: financial_data.other_deductions || {},
        allowances: financial_data.allowances || {},
        synced_by: user.isDemo ? null : user.id,
        is_latest: true,
      })
      .select()
      .single()

    if (snapshotError)
      return NextResponse.json({ error: snapshotError.message }, { status: 500 })

    // Update employee record with synced flags and sync timestamp
    const { error: updateError } = await client
      .from("employees")
      .update({
        bank_account_auto_synced: !!financial_data.bank_account_number,
        ssnit_auto_synced: !!financial_data.ssnit_number,
        financial_data_synced_at: new Date().toISOString(),
        financial_data_synced_from_checklist_id: checklist_id,
      })
      .eq("id", employee_id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Mark previous snapshots as not latest
    await client
      .from("employee_onboarding_financial_data")
      .update({ is_latest: false })
      .eq("employee_id", employee_id)
      .neq("id", snapshot.id)

    return NextResponse.json(
      {
        success: true,
        snapshot,
        message: "Financial data synced to employee record",
      },
      { status: 201 },
    )
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * GET: Fetch financial data snapshots for an employee
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const employeeId = new URL(req.url).searchParams.get("employee_id")
    const latestOnly = new URL(req.url).searchParams.get("latest_only") === "true"

    if (!employeeId) {
      return NextResponse.json({ error: "employee_id required" }, { status: 400 })
    }

    let query = client
      .from("employee_onboarding_financial_data")
      .select("*")
      .eq("employee_id", employeeId)

    if (latestOnly) {
      query = query.eq("is_latest", true)
    }

    const { data, error } = await query.order("synced_to_employee_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      financial_data: data || [],
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

/**
 * PATCH: Update financial data (HR edit)
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    const body = await req.json()

    const { snapshot_id, financial_data } = body

    if (!snapshot_id || !financial_data) {
      return NextResponse.json(
        { error: "snapshot_id and financial_data are required" },
        { status: 400 },
      )
    }

    const patch: Record<string, any> = {}

    // Only allow updating specific fields
    const allowedFields = [
      "bank_name",
      "bank_branch",
      "bank_account_number",
      "bank_account_type",
      "account_holder_name",
      "ssnit_number",
      "ssnit_registered_date",
      "monthly_salary",
      "salary_currency",
      "tax_id",
      "tax_status",
      "pension_id",
      "pension_provider",
      "health_insurance_provider",
      "health_insurance_number",
      "insurance_beneficiary",
      "insurance_relationship",
      "other_deductions",
      "allowances",
    ]

    for (const field of allowedFields) {
      if (financial_data[field] !== undefined) {
        patch[field] = financial_data[field]
      }
    }

    const { data, error } = await client
      .from("employee_onboarding_financial_data")
      .update(patch)
      .eq("id", snapshot_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      snapshot: data,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
