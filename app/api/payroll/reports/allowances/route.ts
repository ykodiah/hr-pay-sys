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

    // Get allowances data
    const { data: reportData } = await client
      .from('payroll_items')
      .select(`
        employee_id,
        allowances,
        employees!inner(employee_id_no, last_name, first_name, middle_name)
      `)
      .eq('company_id', companyId)
      .eq('pay_period', payPeriod)
      .neq('status', 'cancelled')

    // Process and group allowances by type
    const allowancesByType: { [key: string]: Array<any> } = {}

    ;(reportData || []).forEach((row: any) => {
      if (row.allowances && typeof row.allowances === 'object') {
        Object.entries(row.allowances).forEach(([allowanceType, amount]: [string, any]) => {
          if (!allowancesByType[allowanceType]) {
            allowancesByType[allowanceType] = []
          }

          if ((amount as number) > 0) {
            allowancesByType[allowanceType].push({
              staff_id: row.employees.employee_id_no,
              full_name: `${row.employees.last_name} ${row.employees.first_name}${row.employees.middle_name ? ' ' + row.employees.middle_name : ''}`,
              amount_issued: amount,
            })
          }
        })
      }
    })

    // Format report sections
    const reportSections = Object.entries(allowancesByType).map(([allowanceType, rows]) => ({
      allowance_type: allowanceType,
      rows: rows as Array<any>,
      subtotal: rows.reduce((sum: number, row: any) => sum + (row.amount_issued || 0), 0),
    }))

    await client
      .from('ghana_payroll_reports')
      .insert({
        company_id: companyId,
        pay_period: payPeriod,
        report_type: 'allowances',
        report_data: {
          companyName: company.name,
          erNumber: company.er_number,
          reportType: 'ALLOWANCES REPORT',
          payPeriod,
          sections: reportSections,
        },
        generated_by: user.id,
      })

    return NextResponse.json({
      success: true,
      report: {
        companyName: company.name,
        erNumber: company.er_number,
        reportType: 'ALLOWANCES REPORT',
        payPeriod,
        sections: reportSections,
        totalSections: reportSections.length,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[v0] Allowances report error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
