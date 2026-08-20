import { NextRequest, NextResponse } from "next/server"
import { isUnresolvedTenant, resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"
import { issuePayrollRunPayslips } from "@/lib/services/payslip-service"
import { resolveEmployeeForUser } from "@/lib/employees/resolve-employee"

/**
 * Resolve an actor id that satisfies legacy payroll_runs.*_by → employees(id) FKs.
 * Prefer the linked employee row; fall back to auth user id (after script 079 drops the FK).
 */
async function resolveActorEmployeeId(
  supabase: any,
  opts: { userId: string | null; companyId: string; demo?: boolean },
): Promise<string | null> {
  if (opts.demo || !opts.userId) return null
  try {
    const emp = await resolveEmployeeForUser(supabase, {
      userId: opts.userId,
      companyId: opts.companyId,
    })
    if (emp?.id) return emp.id
  } catch {
    // ignore
  }
  // Last resort: some installs use employees.id = auth.uid()
  try {
    const { data } = await supabase
      .from("employees")
      .select("id")
      .eq("id", opts.userId)
      .eq("company_id", opts.companyId)
      .maybeSingle()
    if (data?.id) return data.id
  } catch {
    // ignore
  }
  return opts.userId
}

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
    if (isUnresolvedTenant(ctx)) return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
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
    const controlledPeriod = run.pay_period_start ? String(run.pay_period_start).slice(0, 7) : null
    if (controlledPeriod) {
      const { data: periodControl, error: periodControlError } = await supabase
        .from("payroll_periods")
        .select("status")
        .eq("company_id", companyId)
        .eq("pay_period", controlledPeriod)
        .maybeSingle()
      if (periodControlError) {
        return NextResponse.json(
          { error: `Payroll period control unavailable: ${periodControlError.message}` },
          { status: 503 },
        )
      }
      if (periodControl?.status === "closed") {
        return NextResponse.json({ error: `${controlledPeriod} is closed and immutable` }, { status: 409 })
      }
    }

    // Count employees on this run — never approve empty runs
    const { count: itemCount } = await supabase
      .from("payroll_items")
      .select("id", { count: "exact", head: true })
      .eq("payroll_run_id", payroll_run_id)
      .eq("company_id", companyId)

    if (action === "approve" && (!itemCount || itemCount < 1)) {
      return NextResponse.json(
        {
          error:
            "Cannot approve a payroll run with 0 employees. Re-run Payroll Processing with selected employees, then approve.",
        },
        { status: 422 },
      )
    }

    const now = new Date().toISOString()
    const actorId = await resolveActorEmployeeId(supabase, {
      userId: demo ? null : userId,
      companyId,
      demo,
    })

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

        // Apply loan deductions per loan type (repairs mis-allocated prior posts for this run)
        const { ensurePayslipLoanPayments } = await import("@/lib/services/loan-service")
        const { data: items } = await supabase
          .from("payroll_items")
          .select("employee_id, loan_deduction")
          .eq("payroll_run_id", payroll_run_id)

        const { data: slips } = await supabase
          .from("payslips")
          .select("id, employee_id, pay_period, loan_deduction")
          .eq("payroll_run_id", payroll_run_id)
          .eq("company_id", companyId)

        const slipByEmployee = new Map<string, { id: string; pay_period?: string; loan_deduction?: number }>()
        for (const slip of slips ?? []) {
          slipByEmployee.set(slip.employee_id, {
            id: slip.id,
            pay_period: slip.pay_period,
            loan_deduction: Number(slip.loan_deduction || 0),
          })
        }

        const payPeriod =
          run.pay_period_start ? String(run.pay_period_start).slice(0, 7) : null

        for (const item of items ?? []) {
          const slip = slipByEmployee.get(item.employee_id)
          const loanAmt = Number(item.loan_deduction ?? slip?.loan_deduction ?? 0)
          if (loanAmt <= 0) continue
          try {
            await ensurePayslipLoanPayments({
              companyId,
              employeeId: item.employee_id,
              totalDeduction: loanAmt,
              payrollRunId: payroll_run_id,
              payslipId: slip?.id ?? null,
              payPeriod: payPeriod || slip?.pay_period || null,
              paymentDate: now.slice(0, 10),
            })
          } catch (loanErr) {
            console.warn(
              "[payroll-approve] loan payment apply failed for employee",
              item.employee_id,
              loanErr,
            )
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

    // Strip null actor fields so we don't overwrite with null when unresolved
    for (const key of [
      "approved_by",
      "rejected_by",
      "hr_reviewed_by",
      "finance_reviewed_by",
    ]) {
      if (key in updatePayload && updatePayload[key] == null) {
        delete updatePayload[key]
      }
    }

    let { data: updated, error: updateError } = await supabase
      .from("payroll_runs")
      .update(updatePayload)
      .eq("id", payroll_run_id)
      .eq("company_id", companyId)
      .select("*")
      .maybeSingle()

    // Legacy FK still pointing at employees(id): retry without actor columns
    if (
      updateError &&
      /approved_by_fkey|rejected_by_fkey|reviewed_by_fkey|foreign key/i.test(
        String(updateError.message || ""),
      )
    ) {
      const retryPayload = { ...updatePayload }
      delete retryPayload.approved_by
      delete retryPayload.rejected_by
      delete retryPayload.hr_reviewed_by
      delete retryPayload.finance_reviewed_by
      const retry = await supabase
        .from("payroll_runs")
        .update(retryPayload)
        .eq("id", payroll_run_id)
        .eq("company_id", companyId)
        .select("*")
        .maybeSingle()
      updated = retry.data
      updateError = retry.error
      if (!updateError) {
        console.warn(
          "[payroll-approve] Actor FK blocked write — approved without actor id. Run scripts/079_payroll_runs_actor_fk_fix.sql",
        )
      }
    }

    if (updateError) throw new Error(updateError.message)

    try {
      await supabase.from("payroll_approval_audit").insert({
        payroll_run_id,
        action: auditAction,
        actor_id: actorId || userId || null,
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
    if (isUnresolvedTenant(ctx)) return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
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
