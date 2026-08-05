-- Leave pay mode (full salary vs prorate) + one-time leave allowance
-- + attendance analytics helper columns. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Leave types: pay mode + leave allowance setup
-- ---------------------------------------------------------------------------
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT true;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS payment_percentage numeric(5, 2) DEFAULT 100;
-- full_salary = keep full monthly payroll while on leave; prorate = pay only leave days
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS pay_mode varchar(20) DEFAULT 'prorate';
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS has_leave_allowance boolean DEFAULT false;
-- fixed | days_of_pay | percent_monthly
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS leave_allowance_type varchar(30) DEFAULT 'fixed';
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS leave_allowance_amount numeric(12, 2) DEFAULT 0;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS leave_allowance_once_per_year boolean DEFAULT true;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS leave_allowance_notes text;

COMMENT ON COLUMN public.leave_types.pay_mode IS 'full_salary | prorate — how paid leave affects monthly payroll';
COMMENT ON COLUMN public.leave_types.has_leave_allowance IS 'One-time leave allowance paid when leave is approved';
COMMENT ON COLUMN public.leave_types.leave_allowance_type IS 'fixed (GHS) | days_of_pay | percent_monthly';

-- ---------------------------------------------------------------------------
-- Leave requests: computed pay + allowance snapshot
-- ---------------------------------------------------------------------------
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS is_paid_leave boolean;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS pay_mode_applied varchar(20);
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS payment_percentage_applied numeric(5, 2);
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS daily_rate_used numeric(12, 4);
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS paid_amount numeric(12, 2) DEFAULT 0;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS unpaid_deduction numeric(12, 2) DEFAULT 0;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS leave_allowance_amount numeric(12, 2) DEFAULT 0;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS leave_allowance_type varchar(30);
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS leave_allowance_paid boolean DEFAULT false;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS leave_pay_formula text;

-- ---------------------------------------------------------------------------
-- Payroll pay inputs: dedicated leave allowance line (one-time)
-- ---------------------------------------------------------------------------
ALTER TABLE public.payroll_pay_inputs ADD COLUMN IF NOT EXISTS leave_allowance numeric(12, 2) DEFAULT 0;
ALTER TABLE public.payroll_pay_inputs ADD COLUMN IF NOT EXISTS unpaid_leave_deduction numeric(12, 2) DEFAULT 0;

-- ---------------------------------------------------------------------------
-- Optional leave allowance ledger (audit / once-per-year)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leave_allowance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_request_id uuid REFERENCES public.leave_requests(id) ON DELETE SET NULL,
  leave_type_id uuid REFERENCES public.leave_types(id) ON DELETE SET NULL,
  pay_period varchar(7) NOT NULL,
  year integer NOT NULL,
  amount numeric(12, 2) NOT NULL DEFAULT 0,
  allowance_type varchar(30),
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (company_id, leave_request_id)
);

CREATE INDEX IF NOT EXISTS idx_leave_allowance_payments_emp_year
  ON public.leave_allowance_payments(company_id, employee_id, year);

-- ---------------------------------------------------------------------------
-- Attendance analytics daily rollup (optional cache)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  stat_date date NOT NULL,
  present_count integer DEFAULT 0,
  late_count integer DEFAULT 0,
  absent_count integer DEFAULT 0,
  leave_count integer DEFAULT 0,
  half_day_count integer DEFAULT 0,
  overtime_hours numeric(10, 2) DEFAULT 0,
  total_hours numeric(10, 2) DEFAULT 0,
  headcount integer DEFAULT 0,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (company_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_daily_stats_company_date
  ON public.attendance_daily_stats(company_id, stat_date DESC);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'leave_types',
    'leave_requests',
    'leave_allowance_payments',
    'payroll_pay_inputs',
    'attendance_daily_stats'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_all', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true)', t || '_all', t);
      EXECUTE format('GRANT ALL ON public.%I TO authenticated, anon, service_role', t);
    END IF;
  END LOOP;
END $$;
