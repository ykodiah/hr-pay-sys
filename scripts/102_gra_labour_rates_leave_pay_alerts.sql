-- GRA labour rates (yearly), leave pay columns, alert FK cleanup
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- GRA National Daily Minimum Wage + OT multipliers (year-keyed)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gra_labour_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL UNIQUE,
  daily_minimum_wage numeric(12, 2) NOT NULL,
  hours_per_day numeric(4, 2) DEFAULT 8,
  working_days_per_month integer DEFAULT 27,
  standard_monthly_hours numeric(8, 2) DEFAULT 173.33,
  overtime_weekday_multiplier numeric(4, 2) DEFAULT 1.5,
  overtime_weekend_multiplier numeric(4, 2) DEFAULT 2.0,
  overtime_holiday_multiplier numeric(4, 2) DEFAULT 2.0,
  currency varchar(8) DEFAULT 'GHS',
  effective_from date,
  effective_to date,
  source text,
  notes text,
  synced_at timestamptz,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.gra_labour_rates (
  year, daily_minimum_wage, hours_per_day, working_days_per_month, standard_monthly_hours,
  overtime_weekday_multiplier, overtime_weekend_multiplier, overtime_holiday_multiplier,
  currency, effective_from, effective_to, source, notes, synced_at
) VALUES
  (2024, 18.15, 8, 27, 173.33, 1.5, 2.0, 2.0, 'GHS', '2024-01-01', '2024-12-31',
   'National Tripartite Committee 2024', 'NDMW GH¢18.15', CURRENT_TIMESTAMP),
  (2025, 19.97, 8, 27, 173.33, 1.5, 2.0, 2.0, 'GHS', '2025-01-01', '2025-12-31',
   'National Tripartite Committee 2025', 'NDMW GH¢19.97', CURRENT_TIMESTAMP),
  (2026, 19.97, 8, 27, 173.33, 1.5, 2.0, 2.0, 'GHS', '2026-01-01', NULL,
   'Carried forward pending 2026 announcement', 'Update when NTC/GRA publishes 2026 NDMW', CURRENT_TIMESTAMP)
ON CONFLICT (year) DO UPDATE SET
  daily_minimum_wage = EXCLUDED.daily_minimum_wage,
  overtime_weekday_multiplier = EXCLUDED.overtime_weekday_multiplier,
  overtime_weekend_multiplier = EXCLUDED.overtime_weekend_multiplier,
  updated_at = CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- Drop ambiguous FKs on attendance_alerts acknowledged_by / resolved_by
-- (they pointed at employees, colliding with employee_id embed)
-- ---------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'attendance_alerts'
      AND con.contype = 'f'
      AND (
        pg_get_constraintdef(con.oid) ILIKE '%acknowledged_by%employees%'
        OR pg_get_constraintdef(con.oid) ILIKE '%resolved_by%employees%'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.attendance_alerts DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.attendance_alerts ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.attendance_alerts ADD COLUMN IF NOT EXISTS resolution_note text;
ALTER TABLE public.attendance_alerts ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.attendance_alerts ALTER COLUMN message DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- Leave pay fields on leave_requests + leave_types payment_percentage
-- ---------------------------------------------------------------------------
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT true;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS payment_percentage numeric(5, 2) DEFAULT 100;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS entitlement_amount numeric(5, 2) DEFAULT 0;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS min_notice_days integer DEFAULT 0;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS allow_carry_over boolean DEFAULT false;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS max_carry_over_days numeric(5, 2) DEFAULT 0;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT true;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS is_paid_leave boolean;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS payment_percentage_applied numeric(5, 2);
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS daily_rate_used numeric(12, 4);
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS paid_amount numeric(12, 2) DEFAULT 0;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS unpaid_deduction numeric(12, 2) DEFAULT 0;

ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS amount_earned numeric(12, 2) DEFAULT 0;
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS hourly_rate_used numeric(12, 4);
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS multiplier_used numeric(5, 2);
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS rate_label varchar(40);
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS pay_period varchar(7);
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS payroll_status varchar(40) DEFAULT 'pending_payroll';

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'gra_labour_rates',
    'attendance_alerts',
    'attendance_alert_rules',
    'leave_types',
    'leave_requests',
    'overtime_requests'
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
