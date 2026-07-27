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

    // Get deductions data with policy numbers
    const { data: reportData } = await client
      .from('payroll_items')
      .select(`
        employee_id,
        deductions,
        employees!inner(employee_id_no, last_name, first_name, middle_name, insurance_policies)
      `)
      .eq('company_id', companyId)
      .eq('pay_period', payPeriod)
      .neq('status', 'cancelled')

    // Get policy numbers from deduction_details if available
    const { data: deductionDetails } = await client
      .from('payroll_deduction_details')
      .select('payroll_item_id, deduction_type, amount, policy_number')

    const detailsByItem: { [key: string]: { [key: string]: any } } = {}
    ;(deductionDetails || []).forEach((detail: any) => {
      if (!detailsByItem[detail.payroll_item_id]) {
        detailsByItem[detail.payroll_item_id] = {}
      }
      detailsByItem[detail.payroll_item_id][detail.deduction_type] = detail
    })

    // Process and group deductions by type
    const deductionsByType: { [key: string]: Array<any> } = {}

    ;(reportData || []).forEach((row: any) => {
      if (row.deductions && typeof row.deductions === 'object') {
        Object.entries(row.deductions).forEach(([deductionType, amount]: [string, any]) => {
          if (!deductionsByType[deductionType]) {
            deductionsByType[deductionType] = []
          }

          if ((amount as number) > 0) {
            // Try to get policy number from deduction_details first, then from employee insurance_policies
            let policyNumber = ''
            const detail = detailsByItem[row.employee_id]?.[deductionType]
            if (detail?.policy_number) {
              policyNumber = detail.policy_number
            } else if (row.employees.insurance_policies?.[deductionType]) {
              policyNumber = row.employees.insurance_policies[deductionType]
            }

            deductionsByType[deductionType].push({
              staff_id: row.employees.employee_id_no,
              full_name: `${row.employees.last_name} ${row.employees.first_name}${row.employees.middle_name ? ' ' + row.employees.middle_name : ''}`,
              policy_number: policyNumber,
              amount_issued: amount,
            })
          }
        })
      }
    })

    // Format report sections
    const reportSections = Object.entries(deductionsByType).map(([deductionType, rows]) => ({
      deduction_type: deductionType,
      rows: rows as Array<any>,
      subtotal: rows.reduce((sum: number, row: any) => sum + (row.amount_issued || 0), 0),
      hasPolicy: rows.some((row: any) => row.policy_number),
    }))

    await client
      .from('ghana_payroll_reports')
      .insert({
        company_id: companyId,
        pay_period: payPeriod,
        report_type: 'deductions',
        report_data: {
          companyName: company.name,
          erNumber: company.er_number,
          reportType: 'DEDUCTIONS REPORT',
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
        reportType: 'DEDUCTIONS REPORT',
        payPeriod,
        sections: reportSections,
        totalSections: reportSections.length,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[v0] Deductions report error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
