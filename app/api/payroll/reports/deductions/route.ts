import { NextRequest, NextResponse } from 'next/server'
import {
  resolveReportContext,
  fetchPayrollItems,
  cacheReport,
} from '@/lib/payroll/report-query-helpers'

export async function POST(request: NextRequest) {
  try {
    const { companyId, payPeriod } = await request.json()

    if (!payPeriod) {
      return NextResponse.json({ error: 'Missing required field: payPeriod' }, { status: 400 })
    }

    const ctx = await resolveReportContext(request, companyId, payPeriod)
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const { client, company, periodStart, periodEnd } = ctx

    const items = await fetchPayrollItems(
      client,
      company.id,
      periodStart,
      periodEnd,
      `deductions, employees!inner(employee_id_no, last_name, first_name, middle_name, insurance_policies)`,
    )

    // Group deductions by type across all employees
    const byType: Record<string, Array<{ staff_id: string; full_name: string; policy_number: string; amount_issued: number }>> = {}

    for (const item of items) {
      const emp = (item as any).employees
      const deductions = ((item as any).deductions as Record<string, number>) || {}
      const insurancePolicies = (emp.insurance_policies as Record<string, string>) || {}
      const fullName = `${emp.last_name || ''} ${emp.first_name || ''}${emp.middle_name ? ' ' + emp.middle_name : ''}`.trim()

      for (const [type, amount] of Object.entries(deductions)) {
        const num = Number(amount || 0)
        if (num <= 0) continue
        if (!byType[type]) byType[type] = []
        byType[type].push({
          staff_id: emp.employee_id_no || '',
          full_name: fullName,
          policy_number: insurancePolicies[type] || '',
          amount_issued: num,
        })
      }
    }

    const sections = Object.entries(byType).map(([deduction_type, rows]) => ({
      deduction_type,
      rows,
      subtotal: rows.reduce((s, r) => s + r.amount_issued, 0),
      hasPolicy: rows.some((r) => r.policy_number !== ''),
    }))

    const reportPayload = {
      companyName: company.name,
      erNumber: company.erNumber,
      reportType: 'DEDUCTIONS REPORT',
      payPeriod,
      sections,
      totalSections: sections.length,
      generatedAt: new Date().toISOString(),
    }

    await cacheReport(client, company.id, payPeriod, 'deductions', reportPayload, companyId)

    return NextResponse.json({ success: true, report: reportPayload })
  } catch (error) {
    console.error('[v0] Deductions report error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
