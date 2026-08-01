import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const viewSQL = `
DROP VIEW IF EXISTS public.v_payroll_report_summary CASCADE;

CREATE VIEW public.v_payroll_report_summary AS
SELECT
  p.company_id,
  p.payroll_run_id,
  COALESCE(p.pay_period, to_char(COALESCE(p.pay_period_start, p.pay_date, p.created_at), 'YYYY-MM')) AS pay_period,
  p.pay_period_start,
  p.pay_period_end,
  p.pay_date,
  p.employee_id,
  COALESCE(
    NULLIF(p.snapshot_employee_name, ''),
    TRIM(CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, '')))
  ) AS employee_name,
  COALESCE(NULLIF(p.snapshot_employee_id_no, ''), e.employee_id, e.id::text) AS employee_id_no,
  COALESCE(NULLIF(p.snapshot_position, ''), e.position) AS position,
  COALESCE(NULLIF(p.snapshot_department, ''), e.department) AS department,
  COALESCE(ef.ssnit_number, p.snapshot_ssnit_number) AS ssnit_number,
  COALESCE(ef.bank_name, p.snapshot_bank_name) AS bank_name,
  COALESCE(ef.bank_account_number, p.snapshot_account_number) AS account_number,
  c.name AS company_name,
  COALESCE(e.ghana_card_number, to_jsonb(e)->>'national_id') AS ghana_card_number,
  COALESCE(e.first_name, '') AS first_name,
  COALESCE(e.last_name, '') AS last_name,
  COALESCE(e.other_names, '') AS other_names,
  COALESCE(
    NULLIF(to_jsonb(e)->>'hire_date', '')::date,
    NULLIF(to_jsonb(e)->>'date_of_joining', '')::date
  ) AS date_of_joining,
  COALESCE(
    to_jsonb(e)->>'employment_type',
    to_jsonb(e)->>'contract_type',
    to_jsonb(e)->>'employment_status'
  ) AS contract_type,
  COALESCE(p.basic_salary, 0)::numeric AS basic_salary,
  COALESCE(p.transport_allowance, 0)::numeric AS transport_allowance,
  COALESCE(p.housing_allowance, 0)::numeric AS housing_allowance,
  COALESCE(p.medical_allowance, 0)::numeric AS medical_allowance,
  COALESCE(p.meal_allowance, 0)::numeric AS meal_allowance,
  COALESCE(p.communication_allowance, 0)::numeric AS communication_allowance,
  COALESCE(p.other_allowances, 0)::numeric AS other_allowances,
  COALESCE(p.overtime_pay, 0)::numeric AS overtime_pay,
  COALESCE(p.bonus_pay, 0)::numeric AS bonus_pay,
  (
    COALESCE(p.transport_allowance, 0) + COALESCE(p.housing_allowance, 0) +
    COALESCE(p.medical_allowance, 0) + COALESCE(p.meal_allowance, 0) +
    COALESCE(p.communication_allowance, 0) + COALESCE(p.other_allowances, 0)
  )::numeric AS total_allowances,
  COALESCE(p.gross_pay, 0)::numeric AS gross_pay,
  COALESCE(p.ssnit_employee, 0)::numeric AS ssnit_employee,
  COALESCE(p.ssnit_employer, 0)::numeric AS ssnit_employer,
  COALESCE(p.tier2_employee, 0)::numeric AS tier2_employee,
  COALESCE(p.tier2_employer, 0)::numeric AS tier2_employer,
  COALESCE(p.tier3_employee, 0)::numeric AS tier3_employee,
  COALESCE(p.tier3_employer, 0)::numeric AS tier3_employer,
  COALESCE(p.paye_taxable_income, 0)::numeric AS paye_taxable_income,
  COALESCE(p.tax_relief_total, 0)::numeric AS tax_relief_total,
  COALESCE(p.paye_tax, 0)::numeric AS paye_tax,
  COALESCE(p.bonus_tax, 0)::numeric AS bonus_tax,
  COALESCE(p.overtime_tax, 0)::numeric AS overtime_tax,
  COALESCE(p.loan_deduction, 0)::numeric AS loan_deduction,
  COALESCE(p.advance_deduction, 0)::numeric AS advance_deduction,
  COALESCE(p.other_deductions, 0)::numeric AS other_deductions,
  COALESCE(p.total_deductions, 0)::numeric AS total_deductions,
  COALESCE(p.net_pay, 0)::numeric AS net_pay,
  COALESCE(p.total_employer_cost, 0)::numeric AS total_employer_cost,
  (
    COALESCE(p.gross_pay, 0) + COALESCE(p.ssnit_employer, 0) +
    COALESCE(p.tier2_employer, 0) + COALESCE(p.tier3_employer, 0)
  )::numeric AS cost_to_company,
  COALESCE(p.status, 'draft') AS payslip_status,
  NULL::numeric AS loan_amount,
  COALESCE(p.loan_balance, 0)::numeric AS current_loan_balance,
  COALESCE(p.loan_deduction, 0)::numeric AS current_loan_deduction
FROM public.payslips p
LEFT JOIN public.employees e ON e.id = p.employee_id
LEFT JOIN public.employee_financial ef ON ef.employee_id = p.employee_id
LEFT JOIN public.companies c ON c.id = p.company_id;

GRANT SELECT ON public.v_payroll_report_summary TO authenticated, anon;
`;

console.log('[v0] Executing view migration...');
const { error } = await supabase.rpc('exec_sql', { sql: viewSQL });

if (error) {
  console.error('[v0] Error executing migration:', error);
  process.exit(1);
} else {
  console.log('[v0] View migration executed successfully');
}
