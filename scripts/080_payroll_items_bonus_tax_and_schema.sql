-- =============================================================================
-- 080: Align payroll_items + payslips columns for Ghana payroll process
-- Fixes: Could not find the 'bonus_tax' column of 'payroll_items' in the schema cache
-- Safe / idempotent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.payroll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS payroll_run_id UUID;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS employee_id UUID;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS pay_period TEXT;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS basic_salary NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS allowances JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS deductions JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS overtime_pay NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS bonus_pay NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS gross_pay NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS ssnit_employee NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS ssnit_employer NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS tier2_employee NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS tier2_employer NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS tier3_employee NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS tier3_employer NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS tax_deduction NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS paye_tax NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS overtime_tax NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS bonus_tax NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS loan_deduction NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS advance_deduction NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS other_deductions NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS total_deductions NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS net_pay NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS taxable_income NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS paye_taxable_income NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS tax_relief_total NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS tax_year INT;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS calculation_breakdown JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'calculated';
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.payroll_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_payroll_items_run ON public.payroll_items(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_company_period ON public.payroll_items(company_id, pay_period);

-- Payslips: ensure matching columns for process inserts
CREATE TABLE IF NOT EXISTS public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS payroll_item_id UUID;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS payroll_run_id UUID;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS employee_id UUID;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS pay_period TEXT;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS pay_period_start DATE;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS pay_period_end DATE;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS pay_date DATE;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS snapshot_employee_name TEXT;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS snapshot_employee_id_no TEXT;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS snapshot_position TEXT;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS snapshot_department TEXT;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS snapshot_location TEXT;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS snapshot_division TEXT;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS snapshot_subsidiary TEXT;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS snapshot_company_name TEXT;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS snapshot_ssnit_number TEXT;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS snapshot_bank_name TEXT;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS snapshot_account_number TEXT;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS basic_salary NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS transport_allowance NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS housing_allowance NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS medical_allowance NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS meal_allowance NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS communication_allowance NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS other_allowances NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS overtime_pay NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS bonus_pay NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS gross_pay NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS ssnit_employee NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS ssnit_employer NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS tier2_employee NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS tier3_employee NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS paye_taxable_income NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS tax_relief_total NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS paye_tax NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS overtime_tax NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS bonus_tax NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS loan_deduction NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS advance_deduction NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS other_deductions NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS total_deductions NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS net_pay NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.payslips ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_payslips_company_period ON public.payslips(company_id, pay_period);
CREATE INDEX IF NOT EXISTS idx_payslips_run ON public.payslips(payroll_run_id);

-- Optional: notify PostgREST to reload schema cache (Supabase)
NOTIFY pgrst, 'reload schema';
