-- Employee Update / Transfer / Audit Trail
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) Audit events (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  event_type varchar(40) NOT NULL, -- create | update | transfer | deactivate | reverse | import
  source varchar(60) NOT NULL DEFAULT 'hr_update', -- hr_update | transfer | legacy_edit | reverse | self_service | import | api
  reason text,
  actor_user_id uuid,
  actor_name varchar(200),
  actor_email varchar(200),
  actor_role varchar(60),
  summary text,
  metadata jsonb DEFAULT '{}'::jsonb,
  reversed_at timestamptz,
  reversed_by_event_id uuid,
  reverses_event_id uuid,
  transfer_id uuid,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emp_audit_events_company
  ON public.employee_audit_events(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emp_audit_events_employee
  ON public.employee_audit_events(employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emp_audit_events_type
  ON public.employee_audit_events(company_id, event_type);

-- ---------------------------------------------------------------------------
-- 2) Field-level diffs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_audit_diffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.employee_audit_events(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  entity varchar(40) NOT NULL DEFAULT 'employee', -- employee | financial
  field_name varchar(80) NOT NULL,
  field_label varchar(120),
  old_value text,
  new_value text,
  sensitivity varchar(20) NOT NULL DEFAULT 'soft', -- soft | hard | org
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emp_audit_diffs_event
  ON public.employee_audit_diffs(event_id);
CREATE INDEX IF NOT EXISTS idx_emp_audit_diffs_employee
  ON public.employee_audit_diffs(employee_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3) Formal transfers (org moves)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  reason text,
  reference_no varchar(80),
  status varchar(30) NOT NULL DEFAULT 'applied', -- applied | reversed
  from_subsidiary_id uuid,
  to_subsidiary_id uuid,
  from_division text,
  to_division text,
  from_department text,
  to_department text,
  from_location text,
  to_location text,
  from_direct_supervisor uuid,
  to_direct_supervisor uuid,
  from_head_of_department uuid,
  to_head_of_department uuid,
  actor_user_id uuid,
  actor_name varchar(200),
  audit_event_id uuid,
  reversed_at timestamptz,
  reversed_by uuid,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emp_transfers_company
  ON public.employee_transfers(company_id, effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_emp_transfers_employee
  ON public.employee_transfers(employee_id, effective_date DESC);

-- Link transfer_id FK after both tables exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'employee_audit_events_transfer_id_fkey'
  ) THEN
    ALTER TABLE public.employee_audit_events
      ADD CONSTRAINT employee_audit_events_transfer_id_fkey
      FOREIGN KEY (transfer_id) REFERENCES public.employee_transfers(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'employee_audit_events',
    'employee_audit_diffs',
    'employee_transfers'
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
