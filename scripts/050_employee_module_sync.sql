-- Employee module sync helpers: unique financial row, indexes, status normalization support.
-- Safe to re-run.

-- One financial record per employee (required for upsert onConflict)
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_financial_employee_id_unique
  ON public.employee_financial(employee_id);

CREATE INDEX IF NOT EXISTS idx_employees_company_status
  ON public.employees(company_id, status);

CREATE INDEX IF NOT EXISTS idx_employees_company_department
  ON public.employees(company_id, department);

CREATE INDEX IF NOT EXISTS idx_employees_company_employee_code
  ON public.employees(company_id, employee_id);

-- Ensure common financial columns exist for payroll sync
ALTER TABLE public.employee_financial
  ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annual_salary NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS transport_allowance NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS housing_allowance NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medical_allowance NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meal_allowance NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS communication_allowance NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uniform_allowance NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_allowances NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS ssnit_number TEXT,
  ADD COLUMN IF NOT EXISTS tier3_contribution NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
