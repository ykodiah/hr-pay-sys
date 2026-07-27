import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiUser } from '@/lib/auth/api-user'

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { companyId, payPeriod } = await request.json()

    if (!companyId || !payPeriod) {
      return NextResponse.json({ error: 'Missing required fields: companyId, payPeriod' }, { status: 400 })
    }

    const client = await createClient()

    const { data: userAccess } = await client
      .from('employees')
      .select('id')
      .eq('id', user.id)
      .eq('company_id', companyId)
      .in('special_role', ['HR', 'Admin', 'Finance'])
      .single()

    if (!userAccess) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

    const { data: company } = await client
      .from('companies')
      .select('name, er_number')
      .eq('id', companyId)
      .single()

    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    // Get PAYE data with special handling for basic salary ≤ 1500
    const { data: reportData } = await client
      .from('payroll_items')
      .select(`
        employee_id,
        basic_salary,
        allowances,
        deductions,
        overtime_income,
        paye_tax,
        overtime_tax,
        net_pay,
        employees!inner(tin_number, employee_id_no, job_title, last_name, first_name, middle_name)
      `)
      .eq('company_id', companyId)
      .eq('pay_period', payPeriod)
      .neq('status', 'cancelled')

    const processedData = (reportData || []).map((item: any) => {
      const allowances = item.allowances || {}
      const deductions = item.deductions || {}
      const totalAllowances = Object.values(allowances).reduce((sum: number, val: any) => sum + (val || 0), 0)
      const totalDeductions = Object.values(deductions).reduce((sum: number, val: any) => sum + (val || 0), 0)
      const isBasicOvertime = item.basic_salary <= 1500

      return {
        staff_id: item.employees.employee_id_no,
        tin_number: item.employees.tin_number || '',
        full_name: `${item.employees.last_name} ${item.employees.first_name}${item.employees.middle_name ? ' ' + item.employees.middle_name : ''}`,
        category: item.employees.job_title || '',
        basic_salary: item.basic_salary,
        total_allowances: totalAllowances,
        overtime_income: isBasicOvertime ? item.overtime_income : 0,
        basic_tax: isBasicOvertime ? 0 : item.paye_tax,
        total_tax_payable: isBasicOvertime ? item.overtime_tax : item.paye_tax,
        total_deductions: totalDeductions,
        net_pay: item.net_pay,
        is_basic_overtime_rule: isBasicOvertime,
      }
    })

    await client
      .from('ghana_payroll_reports')
      .insert({
        company_id: companyId,
        pay_period: payPeriod,
        report_type: 'paye',
        report_data: {
          companyName: company.name,
          erNumber: company.er_number,
          reportType: 'PAYE TAX REPORT',
          payPeriod,
          notes: 'Basic salary ≤ 1500: tax calculated on overtime income only',
          rows: processedData,
        },
        generated_by: user.id,
      })

    return NextResponse.json({
      success: true,
      report: {
        companyName: company.name,
        erNumber: company.er_number,
        reportType: 'PAYE TAX REPORT',
        payPeriod,
        rows: processedData,
        totalRows: processedData.length,
        notes: 'Basic salary ≤ 1500: tax calculated on overtime income only',
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[v0] PAYE report error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
