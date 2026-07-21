import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { resolveEmployeeForUser } from "@/lib/employees/resolve-employee"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await createClient()
    // Service role for reliable reads across RLS while still scoping by resolved company
    let db: any = client
    try {
      db = createServiceClient()
    } catch {
      db = client
    }

    const resolved = await resolveCompanyId(
      db,
      user.isDemo ? null : user.id,
      user.isDemo ? null : user,
    )
    const companyId = resolved?.companyId || null

    const employee = await resolveEmployeeForUser(db, {
      userId: user.id,
      email: user.email,
      companyId,
    })

    if (!employee) {
      return NextResponse.json(
        {
          error: "No employee profile linked to this account for your company.",
          company_id: companyId,
        },
        { status: 404 },
      )
    }

    // Isolation: reject if employee.company_id mismatches resolved company
    if (companyId && employee.company_id && employee.company_id !== companyId) {
      return NextResponse.json({ error: "Employee does not belong to this company" }, { status: 403 })
    }

    let financial: any = null
    try {
      const { data } = await db
        .from("employee_financial")
        .select("*")
        .eq("employee_id", employee.id)
        .maybeSingle()
      financial = data
    } catch {
      financial = null
    }

    let leaveBalance: number | null = null
    try {
      const { data: balances } = await db
        .from("leave_balances")
        .select("remaining_days, balance, days_remaining")
        .eq("employee_id", employee.id)
        .limit(20)
      if (Array.isArray(balances) && balances.length) {
        leaveBalance = balances.reduce(
          (sum: number, b: any) =>
            sum + Number(b.remaining_days ?? b.days_remaining ?? b.balance ?? 0),
          0,
        )
      }
    } catch {
      leaveBalance = null
    }

    let lastPayslip: any = null
    try {
      const { data } = await db
        .from("payslips")
        .select("id, net_pay, gross_pay, pay_period, period, created_at")
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      lastPayslip = data
    } catch {
      try {
        const { data } = await db
          .from("payroll_payslips")
          .select("id, net_pay, gross_pay, pay_period, created_at")
          .eq("employee_id", employee.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        lastPayslip = data
      } catch {
        lastPayslip = null
      }
    }

    let goals: any[] = []
    try {
      const { data } = await db
        .from("employee_self_service_goals")
        .select("id, title, progress, status, due_date")
        .eq("employee_id", employee.id)
        .eq("company_id", employee.company_id)
        .order("created_at", { ascending: false })
        .limit(20)
      goals = data || []
    } catch {
      goals = []
    }

    const displayName =
      employee.display_name ||
      employee.full_name ||
      `${employee.first_name || ""} ${employee.last_name || ""}`.trim()

    return NextResponse.json({
      company_id: employee.company_id || companyId,
      company_name: resolved?.companyName || null,
      employee: {
        id: employee.id,
        employee_id: employee.employee_id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        full_name: displayName,
        corporate_email: employee.corporate_email,
        personal_email: employee.personal_email,
        phone: employee.phone,
        position: employee.position,
        department: employee.department,
        division: employee.division,
        location: employee.location,
        special_role: employee.special_role,
        status: employee.status,
        date_of_joining: employee.date_of_joining,
        date_of_birth: employee.date_of_birth,
        address: employee.address,
        ghana_card_number: employee.ghana_card_number,
        emergency_contact_name: employee.emergency_contact_name,
        emergency_contact_tel: employee.emergency_contact_tel,
        direct_supervisor: employee.direct_supervisor,
        head_of_department: employee.head_of_department,
        profile_picture: employee.profile_picture,
        contract_type: employee.contract_type,
      },
      financial: financial
        ? {
            monthly_salary: financial.monthly_salary,
            bank_name: financial.bank_name,
            bank_account_number: financial.bank_account_number,
            ssnit_number: financial.ssnit_number,
            tier3_contribution: financial.tier3_contribution,
          }
        : null,
      stats: {
        leave_days_remaining: leaveBalance,
        last_net_pay: lastPayslip ? Number(lastPayslip.net_pay || 0) : null,
        last_pay_period: lastPayslip?.pay_period || lastPayslip?.period || null,
        goals_count: goals.length,
        avg_goal_progress:
          goals.length > 0
            ? Math.round(goals.reduce((s, g) => s + Number(g.progress || 0), 0) / goals.length)
            : null,
      },
      goals,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load profile" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    let db: any
    try {
      db = createServiceClient()
    } catch {
      db = await createClient()
    }

    const resolved = await resolveCompanyId(db, user.isDemo ? null : user.id, user.isDemo ? null : user)
    const employee = await resolveEmployeeForUser(db, {
      userId: user.id,
      email: user.email,
      companyId: resolved?.companyId || null,
    })
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 })

    // Employees may only update limited personal fields
    const allowed: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.phone !== undefined) allowed.phone = body.phone
    if (body.personal_email !== undefined) allowed.personal_email = body.personal_email
    if (body.address !== undefined) allowed.address = body.address
    if (body.emergency_contact_name !== undefined) allowed.emergency_contact_name = body.emergency_contact_name
    if (body.emergency_contact_tel !== undefined) allowed.emergency_contact_tel = body.emergency_contact_tel

    const { data, error } = await db
      .from("employees")
      .update(allowed)
      .eq("id", employee.id)
      .eq("company_id", employee.company_id)
      .select("*")
      .single()

    if (error) throw error
    return NextResponse.json({ employee: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 })
  }
}
