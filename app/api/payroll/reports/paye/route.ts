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
      `basic_salary, allowances, deductions, net_pay,
       employees!inner(employee_id_no, tin_number, last_name, first_name, middle_name, job_title)`,
    )

    const rows = items.map((item: any) => {
      const emp = item.employees
      const allowances = (item.allowances as Record<string, number>) || {}
      const deductions = (item.deductions as Record<string, number>) || {}
      const basic = Number(item.basic_salary || 0)
      const totalAllowances = Object.values(allowances).reduce((s, v) => s + Number(v || 0), 0)
      const totalDeductions = Object.values(deductions).reduce((s, v) => s + Number(v || 0), 0)
      // Ghana PAYE rule: if basic ≤ 1500, tax only on overtime
      const isOvertimeRule = basic <= 1500
      const overtimeIncome = Number(allowances.overtime ?? allowances.overtime_pay ?? 0)
      // paye_tax field may not exist on payroll_items — derive from deductions
      const payeTax = Number(deductions.paye ?? deductions.paye_tax ?? deductions.income_tax ?? 0)
      const overtimeTax = isOvertimeRule ? payeTax : 0
      const basicTax = isOvertimeRule ? 0 : payeTax

      return {
        staff_id: emp.employee_id_no || '',
        tin_number: emp.tin_number || '',
        full_name: `${emp.last_name || ''} ${emp.first_name || ''}${emp.middle_name ? ' ' + emp.middle_name : ''}`.trim(),
        category: emp.job_title || '',
        basic_salary: basic,
        total_allowances: totalAllowances,
        overtime_income: isOvertimeRule ? overtimeIncome : 0,
        basic_tax: basicTax,
        total_tax_payable: payeTax,
        net_pay: Number(item.net_pay || 0),
        is_basic_overtime_rule: isOvertimeRule,
      }
    })

    const reportPayload = {
      companyName: company.name,
      erNumber: company.erNumber,
      reportType: 'PAYE TAX REPORT',
      payPeriod,
      notes: 'Basic salary ≤ GHS 1,500: PAYE calculated on overtime income only',
      rows,
      totalRows: rows.length,
      generatedAt: new Date().toISOString(),
    }

    await cacheReport(client, company.id, payPeriod, 'paye', reportPayload, companyId)

    return NextResponse.json({ success: true, report: reportPayload })
  } catch (error) {
    console.error('[v0] PAYE report error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
