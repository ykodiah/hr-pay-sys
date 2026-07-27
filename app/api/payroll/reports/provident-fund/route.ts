import { NextRequest, NextResponse } from 'next/server'
import {
  resolveReportContext,
  fetchPayrollItems,
  cacheReport,
} from '@/lib/payroll/report-query-helpers'

export async function POST(request: NextRequest) {
  try {
    const { companyId, payPeriod } = await request.json()

    if (!companyId || !payPeriod) {
      return NextResponse.json({ error: 'Missing required fields: companyId, payPeriod' }, { status: 400 })
    }

    const ctx = await resolveReportContext(request, companyId, payPeriod)
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const { client, company, periodStart, periodEnd } = ctx

    const items = await fetchPayrollItems(
      client,
      company.id,
      periodStart,
      periodEnd,
      `basic_salary, deductions, employees!inner(employee_id_no, ssnit_number, nia_number, last_name, first_name, middle_name, tier3_applicable)`,
    )

    const rows = items
      .filter((item: any) => item.employees?.tier3_applicable !== false)
      .map((item: any) => {
        const emp = item.employees
        const deductions = (item.deductions as Record<string, any>) || {}
        // Provident fund deduction stored under various keys
        const pfAmount = Number(
          deductions.provident_fund ?? deductions.tier3 ?? deductions.pf ?? 0,
        )
        const basic = Number(item.basic_salary || 0)
        return {
          staff_id: emp.employee_id_no || '',
          ssnit_number: emp.ssnit_number || '',
          nia_number: emp.nia_number || '',
          full_name: `${emp.last_name || ''} ${emp.first_name || ''}${emp.middle_name ? ' ' + emp.middle_name : ''}`.trim(),
          basic_salary: basic,
          pf_contribution: pfAmount,
          pf_percentage: basic > 0 ? Number(((pfAmount / basic) * 100).toFixed(2)) : 0,
        }
      })
      .filter((r: any) => r.pf_contribution > 0)

    const reportPayload = {
      companyName: company.name,
      erNumber: company.erNumber,
      reportType: 'PF CONTRIBUTION',
      payPeriod,
      rows,
      totalRows: rows.length,
      generatedAt: new Date().toISOString(),
    }

    await cacheReport(client, company.id, payPeriod, 'provident_fund', reportPayload, companyId)

    return NextResponse.json({ success: true, report: reportPayload })
  } catch (error) {
    console.error('[v0] Provident Fund report error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
