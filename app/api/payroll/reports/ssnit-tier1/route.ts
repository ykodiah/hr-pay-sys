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
      `
        basic_salary,
        employees!inner(employee_id_no, ssnit_number, nia_number, last_name, first_name, middle_name)
      `,
    )

    const rows = items.map((item: any) => {
      const emp = item.employees
      return {
        staff_id: emp.employee_id_no || '',
        ssnit_number: emp.ssnit_number || '',
        nia_number: emp.nia_number || '',
        surname: emp.last_name || '',
        first_name: emp.first_name || '',
        other_names: emp.middle_name || '',
        basic_salary: Number(item.basic_salary || 0),
        tier1_contribution: Number((Number(item.basic_salary || 0) * 0.135).toFixed(2)),
        code: 'N',
      }
    })

    const reportPayload = {
      companyName: company.name,
      erNumber: company.erNumber,
      reportType: 'SSNIT TIER 1 CONTRIBUTION',
      payPeriod,
      contributionRate: 13.5,
      rows,
      totalRows: rows.length,
      generatedAt: new Date().toISOString(),
    }

    await cacheReport(client, company.id, payPeriod, 'ssnit_tier1', reportPayload, companyId)

    return NextResponse.json({ success: true, report: reportPayload })
  } catch (error) {
    console.error('[v0] SSNIT Tier 1 report error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
