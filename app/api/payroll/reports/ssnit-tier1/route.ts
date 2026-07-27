import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireApiUser } from '@/lib/auth/api-user';
import { resolveCompanyId } from '@/lib/employees/resolve-company';

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { companyId, payPeriod } = await request.json();

    if (!companyId || !payPeriod) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, payPeriod' },
        { status: 400 }
      );
    }

    const client = await createClient();

    // Verify user has access to this company
    const { data: userAccess } = await client
      .from('employees')
      .select('id')
      .eq('id', user.id)
      .eq('company_id', companyId)
      .in('special_role', ['HR', 'Admin', 'Finance'])
      .single();

    if (!userAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get company details
    const { data: company } = await client
      .from('companies')
      .select('name, er_number')
      .eq('id', companyId)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get SSNIT Tier 1 data: 13.50% of basic salary
    const { data: reportData } = await client
      .from('payroll_items')
      .select(`
        employee_id,
        basic_salary,
        employees!inner(employee_id_no, ssnit_number, nia_number, last_name, first_name, middle_name)
      `)
      .eq('company_id', companyId)
      .eq('pay_period', payPeriod)
      .neq('status', 'cancelled')
      .order('employees.last_name');

    const processedReportData = (reportData || []).map((item: any) => ({
      staff_id: item.employees.employee_id_no,
      ssnit_number: item.employees.ssnit_number,
      nia_number: item.employees.nia_number,
      surname: item.employees.last_name,
      first_name: item.employees.first_name,
      other_names: item.employees.middle_name,
      basic_salary: item.basic_salary,
      tier1_contribution: Number((item.basic_salary * 0.135).toFixed(2)),
      code: 'N',
    }));

    // Cache the report
    await client
      .from('ghana_payroll_reports')
      .insert({
        company_id: companyId,
        pay_period: payPeriod,
        report_type: 'ssnit_tier1',
        report_data: {
          companyName: company.name,
          erNumber: company.er_number,
          reportType: 'SSNIT TIER 1 CONTRIBUTION',
          payPeriod,
          contributionRate: 13.5,
          rows: processedReportData,
        },
        generated_by: user.id,
      })
      .throwOnError();

    return NextResponse.json({
      success: true,
      report: {
        companyName: company.name,
        erNumber: company.er_number,
        reportType: 'SSNIT TIER 1 CONTRIBUTION',
        payPeriod,
        contributionRate: 13.5,
        rows: processedReportData,
        totalRows: processedReportData.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[v0] SSNIT Tier 1 report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
