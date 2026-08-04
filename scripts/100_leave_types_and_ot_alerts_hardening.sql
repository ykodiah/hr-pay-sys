-- Leave types + overtime approve hardening + attendance alerts company scope
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  code varchar(20) NOT NULL,
  description text,
  category varchar(50) NOT NULL DEFAULT 'general',
  entitlement_type varchar(20) NOT NULL DEFAULT 'annual',
  entitlement_amount numeric(5, 2) DEFAULT 0,
  max_days_per_year numeric(5, 2),
  max_consecutive_days integer,
  min_service_months integer DEFAULT 0,
  eligible_genders varchar(20) DEFAULT 'all',
  eligible_employment_types text[],
  requires_approval boolean DEFAULT true,
  approval_levels integer DEFAULT 1,
  auto_approve_threshold integer,
  min_notice_days integer DEFAULT 0,
  requires_documentation boolean DEFAULT false,
  documentation_required_after integer,
  is_paid boolean DEFAULT true,
  payment_percentage numeric(5, 2) DEFAULT 100.00,
  payment_cap_days integer,
  allow_carry_over boolean DEFAULT false,
  max_carry_over_days numeric(5, 2) DEFAULT 0,
  carry_over_expiry_months integer DEFAULT 12,
  accrual_start_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  updated_by uuid,
  UNIQUE(company_id, code)
);

ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS category varchar(50) DEFAULT 'general';
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS entitlement_type varchar(20) DEFAULT 'annual';
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS entitlement_amount numeric(5, 2) DEFAULT 0;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT true;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT true;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS allow_carry_over boolean DEFAULT false;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS max_carry_over_days numeric(5, 2) DEFAULT 0;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS min_notice_days integer DEFAULT 0;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS approval_levels integer DEFAULT 1;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS payment_percentage numeric(5, 2) DEFAULT 100.00;
ALTER TABLE public.leave_types ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_leave_types_company_active ON public.leave_types(company_id, is_active);

-- Overtime: drop brittle approved_by → auth.users FK if present
DO $$
DECLARE fk text;
BEGIN
  SELECT con.conname INTO fk
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'overtime_requests'
    AND con.contype = 'f'
    AND pg_get_constraintdef(con.oid) ILIKE '%approved_by%auth.users%';
  IF fk IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.overtime_requests DROP CONSTRAINT %I', fk);
  END IF;
END $$;

ALTER TABLE public.overtime_requests ALTER COLUMN approved_by DROP NOT NULL;
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS hours_approved numeric(6, 2);
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

-- Attendance alerts company scoping
CREATE TABLE IF NOT EXISTS public.attendance_alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  rule_name varchar(160) NOT NULL,
  rule_type varchar(80) DEFAULT 'attendance',
  alert_category varchar(80) DEFAULT 'general',
  trigger_condition jsonb DEFAULT '{}'::jsonb,
  severity varchar(20) DEFAULT 'medium',
  notification_channels text[] DEFAULT ARRAY['in_app'],
  recipient_roles text[] DEFAULT ARRAY['admin','hr'],
  is_auto_escalate boolean DEFAULT false,
  escalation_delay_hours integer DEFAULT 24,
  escalation_recipients text[],
  is_active boolean DEFAULT true,
  template_key varchar(120),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.attendance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  rule_id uuid REFERENCES public.attendance_alert_rules(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  alert_type varchar(80) DEFAULT 'general',
  severity varchar(20) DEFAULT 'medium',
  title text NOT NULL,
  message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  status varchar(40) DEFAULT 'pending',
  resolution_note text,
  sent_at timestamptz,
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  resolved_at timestamptz,
  resolved_by uuid,
  escalated_at timestamptz,
  escalation_level integer DEFAULT 0,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.attendance_alerts ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.attendance_alerts ADD COLUMN IF NOT EXISTS resolution_note text;
ALTER TABLE public.attendance_alerts ADD COLUMN IF NOT EXISTS acknowledged_by uuid;
ALTER TABLE public.attendance_alerts ADD COLUMN IF NOT EXISTS resolved_by uuid;
ALTER TABLE public.attendance_alerts ADD COLUMN IF NOT EXISTS escalation_level integer DEFAULT 0;
ALTER TABLE public.attendance_alerts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.attendance_alert_rules ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.attendance_alert_rules ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.attendance_alert_rules ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.attendance_alert_rules ADD COLUMN IF NOT EXISTS escalation_recipients text[];

CREATE TABLE IF NOT EXISTS public.alert_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid REFERENCES public.attendance_alerts(id) ON DELETE CASCADE,
  employee_id uuid,
  response_note text,
  action_taken varchar(40),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_alerts_company ON public.attendance_alerts(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_alert_rules_company ON public.attendance_alert_rules(company_id, is_active);

-- Biometric devices soft-deactivate support
ALTER TABLE public.biometric_devices ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.biometric_devices ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'leave_types',
    'attendance_alerts',
    'attendance_alert_rules',
    'alert_acknowledgments',
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
