-- Fix alert rule column types + overtime → payroll earning fields
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) Attendance alert rules: unify channel/role columns to JSONB
--    (matches create_attendance_alerts_system.sql; API accepts both)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'attendance_alert_rules'
      AND column_name = 'notification_channels' AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.attendance_alert_rules
      ALTER COLUMN notification_channels TYPE jsonb
      USING to_jsonb(notification_channels);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'attendance_alert_rules'
      AND column_name = 'recipient_roles' AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.attendance_alert_rules
      ALTER COLUMN recipient_roles TYPE jsonb
      USING to_jsonb(recipient_roles);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'attendance_alert_rules'
      AND column_name = 'escalation_recipients' AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.attendance_alert_rules
      ALTER COLUMN escalation_recipients TYPE jsonb
      USING CASE
        WHEN escalation_recipients IS NULL THEN NULL
        ELSE to_jsonb(escalation_recipients)
      END;
  END IF;
END $$;

ALTER TABLE public.attendance_alert_rules
  ALTER COLUMN notification_channels SET DEFAULT '["in_app"]'::jsonb;
ALTER TABLE public.attendance_alert_rules
  ALTER COLUMN recipient_roles SET DEFAULT '["admin","hr"]'::jsonb;

ALTER TABLE public.attendance_alerts ADD COLUMN IF NOT EXISTS resolution_note text;
ALTER TABLE public.attendance_alerts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.attendance_alerts ALTER COLUMN message DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_alert_rules_company_active
  ON public.attendance_alert_rules(company_id, is_active);

-- ---------------------------------------------------------------------------
-- 2) Overtime earnings → month-end payroll bridge
-- ---------------------------------------------------------------------------
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS amount_earned numeric(12, 2) DEFAULT 0;
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS hourly_rate_used numeric(12, 4);
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS multiplier_used numeric(5, 2);
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS rate_label varchar(40);
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS pay_period varchar(7);
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS payroll_status varchar(40) DEFAULT 'pending_payroll';
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS payroll_synced_at timestamptz;
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS hours_approved numeric(6, 2);
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_overtime_requests_company_period
  ON public.overtime_requests(company_id, pay_period, status);
CREATE INDEX IF NOT EXISTS idx_overtime_requests_payroll_status
  ON public.overtime_requests(company_id, payroll_status, date);

-- Ensure overtime_rates exists for multipliers
CREATE TABLE IF NOT EXISTS public.overtime_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  rate_type varchar(20) NOT NULL,
  multiplier numeric(3, 2) NOT NULL DEFAULT 1.5,
  description varchar(255),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Seed default rates per company when missing
INSERT INTO public.overtime_rates (company_id, rate_type, multiplier, description)
SELECT c.id, 'weekday', 1.50, 'Weekday overtime (1.5x)'
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.overtime_rates r WHERE r.company_id = c.id AND r.rate_type = 'weekday'
);

INSERT INTO public.overtime_rates (company_id, rate_type, multiplier, description)
SELECT c.id, 'weekend', 2.00, 'Weekend / rest-day overtime (2x)'
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.overtime_rates r WHERE r.company_id = c.id AND r.rate_type = 'weekend'
);

-- payroll_pay_inputs already holds overtime_amount — ensure present
CREATE TABLE IF NOT EXISTS public.payroll_pay_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  pay_period varchar(7) NOT NULL,
  pay_period_start date,
  pay_period_end date,
  overtime_amount numeric(12, 2) DEFAULT 0,
  bonus_amount numeric(12, 2) DEFAULT 0,
  status varchar(40) DEFAULT 'draft',
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (company_id, employee_id, pay_period)
);

ALTER TABLE public.payroll_pay_inputs ADD COLUMN IF NOT EXISTS overtime_amount numeric(12, 2) DEFAULT 0;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'attendance_alert_rules',
    'attendance_alerts',
    'overtime_requests',
    'overtime_rates',
    'payroll_pay_inputs'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_service_all', t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true)',
        t || '_service_all',
        t
      );
      EXECUTE format('GRANT ALL ON public.%I TO authenticated, anon, service_role', t);
    END IF;
  END LOOP;
END $$;
