-- Comprehensive Loan Module - Professional Loan Management System
-- Supports multiple loan types, approval workflows, amortization schedules, and ledger tracking

-- ============================================================================
-- 1. LOAN TYPES - Fully configurable loan products
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.loan_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Interest Configuration
  interest_type VARCHAR(50) NOT NULL CHECK (interest_type IN ('fixed', 'reducing_balance', 'daily_compound')),
  annual_interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00, -- 0-100%
  
  -- Loan Amount Constraints
  min_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  max_amount NUMERIC(15, 2) NOT NULL DEFAULT 1000000,
  
  -- Tenure
  min_tenure_months INTEGER NOT NULL DEFAULT 3,
  max_tenure_months INTEGER NOT NULL DEFAULT 60,
  default_tenure_months INTEGER NOT NULL DEFAULT 12,
  
  -- Charges & Fees
  processing_fee_type VARCHAR(50) DEFAULT 'fixed' CHECK (processing_fee_type IN ('fixed', 'percentage')), -- fixed amount or % of loan
  processing_fee_amount NUMERIC(15, 2) DEFAULT 0,
  insurance_fee_type VARCHAR(50) DEFAULT NULL CHECK (insurance_fee_type IN ('fixed', 'percentage')),
  insurance_fee_amount NUMERIC(15, 2) DEFAULT 0,
  admin_fee_type VARCHAR(50) DEFAULT NULL CHECK (admin_fee_type IN ('fixed', 'percentage')),
  admin_fee_amount NUMERIC(15, 2) DEFAULT 0,
  
  -- Approval Configuration
  requires_approval BOOLEAN DEFAULT TRUE,
  auto_approve_max_amount NUMERIC(15, 2) DEFAULT 0, -- Auto-approve if below this
  approval_roles TEXT[] DEFAULT ARRAY['admin', 'finance_manager'], -- Roles that can approve
  
  -- Eligibility
  min_service_months INTEGER DEFAULT 0,
  min_monthly_salary NUMERIC(15, 2) DEFAULT 0,
  max_loan_multiplier NUMERIC(5, 2) DEFAULT 3, -- Max loan = salary × multiplier
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by uuid REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(company_id, code)
);

CREATE INDEX idx_loan_types_company ON public.loan_types(company_id);
CREATE INDEX idx_loan_types_active ON public.loan_types(is_active);

-- ============================================================================
-- 2. ENHANCE EMPLOYEE_LOANS TABLE - Add comprehensive tracking
-- ============================================================================
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS loan_type_id uuid REFERENCES public.loan_types(id);
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'cancelled'));
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS initiated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS initiated_by_role VARCHAR(50) DEFAULT 'employee'; -- 'employee' or 'admin'
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS principal_amount NUMERIC(15, 2);
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS tenure_months INTEGER;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(5, 2);
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS interest_type VARCHAR(50);
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS monthly_installment NUMERIC(15, 2);
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(15, 2);
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS total_interest NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS processing_fee NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS insurance_fee NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS admin_fee NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS total_charges NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS disbursement_date DATE;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS first_payment_date DATE;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS final_payment_date DATE;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'pending_approval', 'approved', 'disbursed', 'active', 'completed', 'defaulted', 'cancelled'));
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS created_by uuid NOT NULL DEFAULT (auth.uid());
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_employee_loans_type ON public.employee_loans(loan_type_id);
CREATE INDEX IF NOT EXISTS idx_employee_loans_status ON public.employee_loans(status);
CREATE INDEX IF NOT EXISTS idx_employee_loans_approval ON public.employee_loans(approval_status);

-- ============================================================================
-- 3. LOAN SCHEDULES - Amortization schedule tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.loan_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_loan_id uuid NOT NULL REFERENCES public.employee_loans(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  
  payment_number INTEGER NOT NULL, -- 1, 2, 3, ...
  due_date DATE NOT NULL,
  principal_amount NUMERIC(15, 2) NOT NULL,
  interest_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_payment NUMERIC(15, 2) NOT NULL, -- principal + interest
  
  -- Payment Tracking
  paid_amount NUMERIC(15, 2) DEFAULT 0,
  payment_date DATE,
  payment_method VARCHAR(50), -- 'payroll_deduction', 'bank_transfer', 'cash'
  payment_reference VARCHAR(100),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partially_paid', 'paid', 'overdue', 'waived')),
  
  -- Balance Tracking
  remaining_principal NUMERIC(15, 2) NOT NULL,
  remaining_total NUMERIC(15, 2) NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(employee_loan_id, payment_number)
);

CREATE INDEX idx_loan_schedules_loan ON public.loan_schedules(employee_loan_id);
CREATE INDEX idx_loan_schedules_employee ON public.loan_schedules(employee_id);
CREATE INDEX idx_loan_schedules_due_date ON public.loan_schedules(due_date);
CREATE INDEX idx_loan_schedules_status ON public.loan_schedules(payment_status);

-- ============================================================================
-- 4. LOAN LEDGER - Complete transaction history
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.loan_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_loan_id uuid NOT NULL REFERENCES public.employee_loans(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
    'disbursement', 'payment', 'interest_accrual', 'charge', 
    'fee_waived', 'interest_waived', 'penalty', 'adjustment'
  )),
  
  transaction_date DATE NOT NULL,
  description TEXT,
  
  -- Amount
  principal_amount NUMERIC(15, 2) DEFAULT 0,
  interest_amount NUMERIC(15, 2) DEFAULT 0,
  charge_amount NUMERIC(15, 2) DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL,
  
  -- Balance Impact
  outstanding_balance_before NUMERIC(15, 2),
  outstanding_balance_after NUMERIC(15, 2),
  
  -- Reference
  reference_id VARCHAR(100), -- schedule_id, payslip_id, etc
  payment_method VARCHAR(50),
  
  -- Metadata
  created_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_loan_ledger_loan ON public.loan_ledger(employee_loan_id);
CREATE INDEX idx_loan_ledger_employee ON public.loan_ledger(employee_id);
CREATE INDEX idx_loan_ledger_date ON public.loan_ledger(transaction_date);
CREATE INDEX idx_loan_ledger_type ON public.loan_ledger(transaction_type);

-- ============================================================================
-- 5. VIEWS - For easy data access and reporting
-- ============================================================================

-- Current Active Loans with Type Info
CREATE OR REPLACE VIEW v_active_employee_loans AS
SELECT
  el.id,
  el.company_id,
  el.employee_id,
  e.employee_id AS employee_id_no,
  CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
  e.department,
  e.position,
  lt.id AS loan_type_id,
  lt.code AS loan_type_code,
  lt.name AS loan_type_name,
  el.principal_amount,
  el.tenure_months,
  el.interest_rate,
  el.interest_type,
  el.monthly_installment,
  el.outstanding_balance,
  el.total_charges,
  el.approval_status,
  el.status,
  el.disbursement_date,
  el.first_payment_date,
  el.final_payment_date,
  el.created_at
FROM public.employee_loans el
LEFT JOIN public.loan_types lt ON el.loan_type_id = lt.id
LEFT JOIN public.employees e ON el.employee_id = e.id
WHERE el.status IN ('active', 'disbursed');

-- Pending Loan Approvals
CREATE OR REPLACE VIEW v_pending_loan_approvals AS
SELECT
  el.id,
  el.company_id,
  el.employee_id,
  e.employee_id AS employee_id_no,
  CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
  lt.name AS loan_type_name,
  el.principal_amount,
  el.tenure_months,
  el.interest_rate,
  el.initiated_by_role,
  el.created_at,
  el.approval_status
FROM public.employee_loans el
LEFT JOIN public.loan_types lt ON el.loan_type_id = lt.id
LEFT JOIN public.employees e ON el.employee_id = e.id
WHERE el.approval_status = 'pending'
ORDER BY el.created_at DESC;

-- Monthly Loan Payments Due
CREATE OR REPLACE VIEW v_loan_payments_due AS
SELECT
  ls.id AS schedule_id,
  ls.employee_loan_id,
  ls.employee_id,
  e.employee_id AS employee_id_no,
  CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
  lt.name AS loan_type_name,
  ls.payment_number,
  ls.due_date,
  ls.principal_amount,
  ls.interest_amount,
  ls.total_payment,
  ls.paid_amount,
  ls.payment_status,
  ls.remaining_principal,
  el.outstanding_balance,
  CURRENT_DATE > ls.due_date AS is_overdue
FROM public.loan_schedules ls
LEFT JOIN public.employee_loans el ON ls.employee_loan_id = el.id
LEFT JOIN public.loan_types lt ON el.loan_type_id = lt.id
LEFT JOIN public.employees e ON ls.employee_id = e.id
WHERE ls.payment_status IN ('pending', 'overdue')
ORDER BY ls.due_date;

-- ============================================================================
-- 6. TRIGGERS - Automatic timestamp updates
-- ============================================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_loan_types_updated ON public.loan_types;
CREATE TRIGGER tr_loan_types_updated BEFORE UPDATE ON public.loan_types
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS tr_loan_schedules_updated ON public.loan_schedules;
CREATE TRIGGER tr_loan_schedules_updated BEFORE UPDATE ON public.loan_schedules
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.loan_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_loans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loan_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.loan_ledger TO authenticated;
GRANT SELECT ON v_active_employee_loans TO authenticated;
GRANT SELECT ON v_pending_loan_approvals TO authenticated;
GRANT SELECT ON v_loan_payments_due TO authenticated;
