import { NextRequest, NextResponse } from "next/server"
import {
  requirePortalSession,
  isPortalError,
  portalJsonError,
  logPortalActivity,
} from "@/lib/self-service/portal-session"
import { coerceFieldValue } from "@/lib/employees/audit-fields"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Fields an employee may edit directly (everything else needs an HR change request). */
const SELF_EDITABLE = [
  "phone",
  "personal_email",
  "address",
  "emergency_contact_name",
  "emergency_contact_tel",
] as const

export async function GET(_req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const { db, employeeId, companyId, employee } = session
    const year = new Date().getFullYear()

    const [financialRes, balancesRes, payslipRes, leaveRes, loanRes, unreadRes, requestsRes] =
      await Promise.all([
        db.from("employee_financial").select("*").eq("employee_id", employeeId).maybeSingle(),
        db
          .from("leave_balances")
          .select("entitled_days, used_days, remaining_days, leave_type_id, year")
          .eq("employee_id", employeeId)
          .eq("company_id", companyId)
          .eq("year", year),
        db
          .from("payslips")
          .select("id, net_pay, gross_pay, pay_period, pay_date, status")
          .eq("employee_id", employeeId)
          .eq("company_id", companyId)
          .order("pay_date", { ascending: false, nullsFirst: false })
          .limit(1),
        db
          .from("leave_requests")
          .select("id, status, start_date, end_date, days_requested, leave_type_name")
          .eq("employee_id", employeeId)
          .eq("company_id", companyId)
          .order("start_date", { ascending: false })
          .limit(5),
        db
          .from("employee_loans")
          .select("id, status, outstanding_balance, remaining_balance, monthly_installment, monthly_payment")
          .eq("employee_id", employeeId)
          .eq("company_id", companyId)
          .in("status", ["active", "Active", "disbursed", "approved"]),
        db
          .from("employee_notifications")
          .select("id", { count: "exact", head: true })
          .eq("employee_id", employeeId)
          .is("read_at", null),
        db
          .from("employee_profile_change_requests")
          .select("id, status, changes, created_at, reviewer_note, reviewed_at")
          .eq("employee_id", employeeId)
          .order("created_at", { ascending: false })
          .limit(5),
      ])

    const balances = balancesRes.data || []
    const leaveRemaining = balances.reduce(
      (sum: number, b: any) => sum + Number(b.remaining_days ?? 0),
      0,
    )
    const leaveEntitled = balances.reduce(
      (sum: number, b: any) => sum + Number(b.entitled_days ?? 0),
      0,
    )

    const loans = loanRes.data || []
    const loanOutstanding = loans.reduce(
      (sum: number, l: any) => sum + Number(l.outstanding_balance ?? l.remaining_balance ?? 0),
      0,
    )

    const lastPayslip = (payslipRes.data || [])[0] || null
    const displayName =
      employee.display_name ||
      employee.full_name ||
      `${employee.first_name || ""} ${employee.last_name || ""}`.trim()

    return NextResponse.json({
      company_id: companyId,
      company_name: session.companyName,
      can_access_admin: session.canAccessAdmin,
      portal: session.account
        ? {
            status: session.account.status,
            login_email: session.account.login_email,
            must_change_password: session.account.must_change_password,
            last_login_at: session.account.last_login_at,
          }
        : null,
      employee: {
        id: employee.id,
        employee_id: employee.employee_id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        other_names: employee.other_names,
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
        contract_type: employee.contract_type,
        date_of_joining: employee.date_of_joining,
        date_of_birth: employee.date_of_birth,
        gender: employee.gender,
        marital_status: employee.marital_status,
        address: employee.address,
        ghana_card_number: employee.ghana_card_number,
        emergency_contact_name: employee.emergency_contact_name,
        emergency_contact_tel: employee.emergency_contact_tel,
        educational_level: employee.educational_level,
        profile_picture: employee.profile_picture,
      },
      financial: financialRes.data
        ? {
            monthly_salary: financialRes.data.monthly_salary,
            annual_salary: financialRes.data.annual_salary,
            bank_name: financialRes.data.bank_name,
            bank_branch: financialRes.data.bank_branch,
            bank_account_number: financialRes.data.bank_account_number,
            ssnit_number: financialRes.data.ssnit_number,
            provident_fund_enrolled: financialRes.data.provident_fund_enrolled,
            tier3_contribution: financialRes.data.tier3_contribution,
          }
        : null,
      stats: {
        leave_days_remaining: leaveRemaining,
        leave_days_entitled: leaveEntitled,
        last_net_pay: lastPayslip ? Number(lastPayslip.net_pay || 0) : null,
        last_pay_period: lastPayslip?.pay_period || null,
        loan_outstanding: loanOutstanding,
        active_loans: loans.length,
        unread_notifications: unreadRes.count ?? 0,
        pending_leave: (leaveRes.data || []).filter((r: any) =>
          String(r.status || "").toLowerCase() === "pending",
        ).length,
      },
      recent_leave: leaveRes.data || [],
      change_requests: requestsRes.data || [],
      self_editable_fields: SELF_EDITABLE,
    })
  } catch (err) {
    return portalJsonError(err, "Failed to load your profile")
  }
}

/** PATCH — direct update of the small set of self-editable contact fields. */
export async function PATCH(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    const changed: string[] = []

    for (const field of SELF_EDITABLE) {
      if (body[field] === undefined) continue
      const value = coerceFieldValue(field, body[field])
      if (value !== session.employee[field]) changed.push(field)
      patch[field] = value
    }

    if (!changed.length) {
      return NextResponse.json({ employee: session.employee, message: "No changes to save" })
    }

    const { data, error } = await session.db
      .from("employees")
      .update(patch)
      .eq("id", session.employeeId)
      .eq("company_id", session.companyId)
      .select("*")
      .single()

    if (error) throw new Error(error.message)

    await logPortalActivity(session, "profile_update", `Updated ${changed.join(", ")}`, { changed })

    return NextResponse.json({
      employee: data,
      changed,
      message: `Saved ${changed.length} change(s).`,
    })
  } catch (err) {
    return portalJsonError(err, "Failed to update your details")
  }
}
