-- Pay Inputs: period emoluments & adjustments that feed payroll runs
-- Master salary stays on employee_financial; this table holds period overrides.

CREATE TABLE IF NOT EXISTS public.payroll_pay_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  pay_period TEXT NOT NULL, -- e.g. "2026-07"
  pay_period_start DATE,
  pay_period_end DATE,

  -- Earnings (NULL = use master employee_financial)
  basic_salary NUMERIC(12,2),
  transport_allowance NUMERIC(12,2),
  housing_allowance NUMERIC(12,2),
  medical_allowance NUMERIC(12,2),
  meal_allowance NUMERIC(12,2),
  communication_allowance NUMERIC(12,2),
  uniform_allowance NUMERIC(12,2),
  other_allowances NUMERIC(12,2),
  overtime_amount NUMERIC(12,2) DEFAULT 0,
  bonus_amount NUMERIC(12,2) DEFAULT 0,

  -- Non-tax deductions
  loan_deduction NUMERIC(12,2) DEFAULT 0,
  advance_deduction NUMERIC(12,2) DEFAULT 0,
  other_deductions NUMERIC(12,2) DEFAULT 0,

  -- Pension flags
  tier2_applicable BOOLEAN DEFAULT true,
  tier3_applicable BOOLEAN DEFAULT false,
  tier3_employee_rate NUMERIC(5,2) DEFAULT 0,

  -- When true, saving also updates employee_financial master record
  apply_to_master BOOLEAN DEFAULT false,

  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft | approved | processed
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (company_id, employee_id, pay_period)
);

CREATE INDEX IF NOT EXISTS idx_payroll_pay_inputs_company_period
  ON public.payroll_pay_inputs(company_id, pay_period);

CREATE INDEX IF NOT EXISTS idx_payroll_pay_inputs_employee
  ON public.payroll_pay_inputs(employee_id);

ALTER TABLE public.payroll_pay_inputs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payroll_pay_inputs_all" ON public.payroll_pay_inputs;
CREATE POLICY "payroll_pay_inputs_all" ON public.payroll_pay_inputs
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.payroll_pay_inputs TO authenticated;
GRANT ALL ON public.payroll_pay_inputs TO anon;

COMMENT ON TABLE public.payroll_pay_inputs IS
  'Period pay inputs / emolument adjustments. Feeds processPayrollRun and can sync back to employee_financial.';
