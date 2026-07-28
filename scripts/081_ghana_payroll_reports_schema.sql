-- =============================================================================
-- 081: Ghana Payroll Reports Schema
-- Adds support for SSNIT Tier 1/2, Provident Fund, PAYE, Allowances, and Deductions reports
-- =============================================================================

-- Enhance employees table for Ghana tax/SSNIT tracking
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ssnit_number TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nia_number TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tier2_applicable BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tier3_applicable BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS insurance_policies JSONB DEFAULT '{}'::jsonb;

-- Enhance payroll_items for detailed Ghana report tracking
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS ssnit_tier1_employee NUMERIC(15,2) DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS ssnit_tier1_employer NUMERIC(15,2) DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS ssnit_tier2_employee NUMERIC(15,2) DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS ssnit_tier2_employer NUMERIC(15,2) DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS tier2_reporting_only BOOLEAN DEFAULT FALSE;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS tier3_employee NUMERIC(15,2) DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS tier3_employer NUMERIC(15,2) DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS overtime_income NUMERIC(15,2) DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS overtime_tax NUMERIC(15,2) DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS paye_total_tax NUMERIC(15,2) DEFAULT 0;
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS paye_basic_handling BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN payroll_items.paye_basic_handling IS 'TRUE if basic_salary <= 1500, only overtime income taxed';

-- Create ghana_payroll_reports table for caching generated reports
CREATE TABLE IF NOT EXISTS ghana_payroll_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  pay_period TEXT NOT NULL,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
    'ssnit_tier1', 'ssnit_tier2', 'provident_fund', 'paye', 'allowances', 'deductions'
  )),
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  report_metadata JSONB DEFAULT '{}'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ghana_payroll_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports for their company" ON ghana_payroll_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees hr_emp
      WHERE hr_emp.id::text = auth.uid()::text
      AND hr_emp.company_id = ghana_payroll_reports.company_id
      AND hr_emp.special_role IN ('HR', 'Admin', 'Finance')
    )
  );

CREATE INDEX IF NOT EXISTS idx_ghana_reports_company_period 
  ON ghana_payroll_reports(company_id, pay_period, report_type);

-- Create ghana_report_templates table for customization
CREATE TABLE IF NOT EXISTS ghana_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL,
  template_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  er_number TEXT,
  company_name TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ghana_report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates for their company" ON ghana_report_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees hr_emp
      WHERE hr_emp.id::text = auth.uid()::text
      AND hr_emp.company_id = ghana_report_templates.company_id
      AND hr_emp.special_role IN ('HR', 'Admin', 'Finance')
    )
  );

-- Create allowance_types table for consistent allowance reporting
CREATE TABLE IF NOT EXISTS allowance_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  allowance_name TEXT NOT NULL,
  allowance_code VARCHAR(20),
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE allowance_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view allowance types for their company" ON allowance_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees hr_emp
      WHERE hr_emp.id::text = auth.uid()::text
      AND hr_emp.company_id = allowance_types.company_id
    )
  );

-- Create deduction_types table for consistent deduction reporting
CREATE TABLE IF NOT EXISTS deduction_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  deduction_name TEXT NOT NULL,
  deduction_code VARCHAR(20),
  description TEXT,
  requires_policy_number BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE deduction_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deduction types for their company" ON deduction_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees hr_emp
      WHERE hr_emp.id::text = auth.uid()::text
      AND hr_emp.company_id = deduction_types.company_id
    )
  );

-- Create payroll_deduction_details for tracking policy numbers
CREATE TABLE IF NOT EXISTS payroll_deduction_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_item_id UUID NOT NULL REFERENCES payroll_items(id) ON DELETE CASCADE,
  deduction_type VARCHAR(100) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  policy_number TEXT,
  insurance_provider TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_deduction_details_item 
  ON payroll_deduction_details(payroll_item_id);

-- Create indexes for report generation performance
CREATE INDEX IF NOT EXISTS idx_payroll_items_company_run 
  ON payroll_items(company_id, payroll_run_id);

CREATE INDEX IF NOT EXISTS idx_payroll_items_employee_run 
  ON payroll_items(employee_id, payroll_run_id);

-- Notify PostgREST to reload schema cache (Supabase)
NOTIFY pgrst, 'reload schema';
