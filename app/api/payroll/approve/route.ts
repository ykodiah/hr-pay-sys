import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"
import { issuePayrollRunPayslips } from "@/lib/services/payslip-service"

/**
 * POST /api/payroll/approve
 * Body: { payroll_run_id, action: "hr_review" | "finance_review" | "approve" | "reject", notes?, rejection_reason? }
 *
 * Tenant-scoped: run must belong to the authenticated user's company.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, userId, demo, service: supabase } = ctx

    const { payroll_run_id, action, notes, rejection_reason } = body
    const reason = rejection_reason ?? notes ?? null

    if (!payroll_run_id || !action) {
      return NextResponse.json({ error: "payroll_run_id and action required" }, { status: 400 })
    }

    const { data: run, error: runErr } = await supabase
      .from("payroll_runs")
      .select("*")
      .eq("id", payroll_run_id)
      .eq("company_id", companyId)
      .maybeSingle()
    if (runErr || !run) {
      return NextResponse.json(
        { error: runErr?.message || "Payroll run not found for this company" },
        { status: 404 },
      )
    }

    const now = new Date().toISOString()
    const actorId = demo ? null : userId

    let updatePayload: Record<string, any> = { updated_at: now }
    let auditAction = action
    let issueResult: { issued: number; alreadyIssued: number; error: string | null } | null = null

    switch (action) {
      case "hr_review":
        updatePayload = {
          ...updatePayload,
          approval_stage: "hr_reviewed",
          hr_reviewed_by: actorId,
          hr_reviewed_at: now,
          status: run.status === "draft" ? "pending" : run.status,
        }
        auditAction = "hr_reviewed"
        break

      case "finance_review":
        updatePayload = {
          ...updatePayload,
          approval_stage: "finance_reviewed",
          finance_reviewed_by: actorId,
          finance_reviewed_at: now,
        }
        auditAction = "finance_reviewed"
        break

      case "approve": {
        updatePayload = {
          ...updatePayload,
          status: "approved",
          approval_stage: "approved",
          approved_by: actorId,
          approved_at: now,
          posted_at: now,
          history_locked: true,
        }
        auditAction = "approved"

        issueResult = await issuePayrollRunPayslips(payroll_run_id)
        if (issueResult.error) {
          const { error: slipErr, count } = await supabase
            .from("payslips")
            .update({ status: "issued", issued_at: now, updated_at: now }, { count: "exact" })
            .eq("payroll_run_id", payroll_run_id)
            .eq("company_id", companyId)
            .eq("status", "draft")
          if (slipErr) {
            console.warn("[payroll-approve] payslip issue failed:", issueResult.error, slipErr.message)
          } else {
            issueResult = { issued: count ?? 0, alreadyIssued: 0, error: null }
          }
        }

        const { data: items } = await supabase
          .from("payroll_items")
          .select("employee_id, loan_deduction")
          .eq("payroll_run_id", payroll_run_id)

        for (const item of items ?? []) {
          const loanAmt = Number(item.loan_deduction ?? 0)
          if (loanAmt <= 0) continue
          const { data: loans } = await supabase
            .from("employee_loans")
            .select("id, amount_paid, remaining_balance, monthly_payment, status")
            .eq("employee_id", item.employee_id)
            .eq("company_id", companyId)
            .in("status", ["active", "approved"])
            .order("created_at", { ascending: true })

          let remaining = loanAmt
          for (const loan of loans ?? []) {
            if (remaining <= 0) break
            const pay = Math.min(remaining, Number(loan.remaining_balance ?? loan.monthly_payment ?? remaining))
            const amountPaid = Number(loan.amount_paid ?? 0) + pay
            const balance = Math.max(0, Number(loan.remaining_balance ?? 0) - pay)
            await supabase
              .from("employee_loans")
              .update({
                amount_paid: amountPaid,
                remaining_balance: balance,
                status: balance <= 0 ? "completed" : "active",
                updated_at: now,
              })
              .eq("id", loan.id)
              .eq("company_id", companyId)
            remaining -= pay
          }
        }

        if (run.pay_period_start) {
          const period = String(run.pay_period_start).slice(0, 7)
          await supabase
            .from("payroll_pay_inputs")
            .update({ status: "posted", updated_at: now })
            .eq("company_id", companyId)
            .eq("pay_period", period)
        }
        break
      }

      case "reject":
        updatePayload = {
          ...updatePayload,
          status: "rejected",
          approval_stage: "rejected",
          rejected_by: actorId,
          rejected_at: now,
          rejection_reason: reason,
        }
        auditAction = "rejected"
        break

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: hr_review | finance_review | approve | reject" },
          { status: 400 },
        )
    }

    const { data: updated, error: updateError } = await supabase
      .from("payroll_runs")
      .update(updatePayload)
      .eq("id", payroll_run_id)
      .eq("company_id", companyId)
      .select("*")
      .maybeSingle()

    if (updateError) throw new Error(updateError.message)

    try {
      await supabase.from("payroll_approval_audit").insert({
        payroll_run_id,
        action: auditAction,
        actor_id: actorId,
        notes: notes ?? reason ?? null,
      })
    } catch {
      // optional audit table
    }

    return NextResponse.json({
      success: true,
      action: auditAction,
      run: updated,
      company_id: companyId,
      payslips_issued: issueResult?.issued ?? 0,
      history: action === "approve",
    })
  } catch (err) {
    return jsonError(err, "Failed to approve payroll run")
  }
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service: supabase } = ctx

    const { searchParams } = new URL(request.url)
    const payroll_run_id = searchParams.get("payroll_run_id")

    // Only return audit for runs belonging to this tenant
    if (payroll_run_id) {
      const { data: run } = await supabase
        .from("payroll_runs")
        .select("id")
        .eq("id", payroll_run_id)
        .eq("company_id", companyId)
        .maybeSingle()
      if (!run) {
        return NextResponse.json({ audit: [], company_id: companyId })
      }
    }

    let query = supabase
      .from("payroll_approval_audit")
      .select("*")
      .order("created_at", { ascending: false })

    if (payroll_run_id) query = query.eq("payroll_run_id", payroll_run_id)

    const { data, error } = await query
    if (error) throw new Error(error.message)

    return NextResponse.json({ audit: data ?? [], company_id: companyId })
  } catch (err) {
    return jsonError(err, "Failed to load approval audit")
  }
}
