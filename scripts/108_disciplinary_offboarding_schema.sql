-- Disciplinary / Grievance + Offboarding modules.
-- Extends analytics stubs from 097. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Disciplinary cases (rich case file)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.disciplinary_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  case_number varchar(40),
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  category varchar(80) DEFAULT 'Misconduct',
  severity varchar(20) DEFAULT 'medium', -- low | medium | high | critical
  status varchar(40) DEFAULT 'open', -- open | investigating | hearing_scheduled | resolved | closed | escalated
  title varchar(240) NOT NULL,
  description text,
  reported_by varchar(160),
  reported_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  due_date date,
  assigned_to varchar(160),
  witnesses text[] DEFAULT '{}',
  documents jsonb DEFAULT '[]'::jsonb,
  hearing_date date,
  resolution text,
  compliance_notes text,
  labour_act_ref varchar(160),
  created_by uuid,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disc_cases_company ON public.disciplinary_cases(company_id, status);
CREATE INDEX IF NOT EXISTS idx_disc_cases_employee ON public.disciplinary_cases(employee_id);

-- Harden disciplinary_actions (analytics stub from 097)
ALTER TABLE public.disciplinary_actions ADD COLUMN IF NOT EXISTS case_id uuid REFERENCES public.disciplinary_cases(id) ON DELETE CASCADE;
ALTER TABLE public.disciplinary_actions ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.disciplinary_actions ADD COLUMN IF NOT EXISTS issued_by varchar(160);
ALTER TABLE public.disciplinary_actions ADD COLUMN IF NOT EXISTS acknowledged boolean DEFAULT false;
ALTER TABLE public.disciplinary_actions ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;
ALTER TABLE public.disciplinary_actions ADD COLUMN IF NOT EXISTS follow_up_required boolean DEFAULT false;
ALTER TABLE public.disciplinary_actions ADD COLUMN IF NOT EXISTS follow_up_date date;
ALTER TABLE public.disciplinary_actions ADD COLUMN IF NOT EXISTS labour_act_ref varchar(160);
ALTER TABLE public.disciplinary_actions ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_disc_actions_case ON public.disciplinary_actions(case_id);
CREATE INDEX IF NOT EXISTS idx_disc_actions_company ON public.disciplinary_actions(company_id);

-- Harden grievances
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS title varchar(240);
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS grievance_type varchar(80) DEFAULT 'Workplace';
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS priority varchar(20) DEFAULT 'medium';
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS desired_outcome text;
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS investigator varchar(160);
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS mediator varchar(160);
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS hearing_date date;
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS resolution text;
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS hr_response text;
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS satisfaction_rating numeric(3, 1);
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS submitted_by uuid;
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

-- Broaden grievance status check (drop old, allow UI statuses)
DO $$
BEGIN
  ALTER TABLE public.grievances DROP CONSTRAINT IF EXISTS grievances_status_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.grievances DROP CONSTRAINT IF EXISTS grievances_status_check;
-- No strict CHECK — allow filed/submitted/acknowledged/investigating/mediation/hearing/resolved/closed/withdrawn

CREATE INDEX IF NOT EXISTS idx_grievances_company ON public.grievances(company_id, status);

-- AI insights for employee relations
CREATE TABLE IF NOT EXISTS public.disciplinary_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  case_id uuid REFERENCES public.disciplinary_cases(id) ON DELETE CASCADE,
  insight_type varchar(60) NOT NULL,
  title varchar(200) NOT NULL,
  body text,
  severity varchar(20) DEFAULT 'info',
  confidence numeric(4, 3),
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  generated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_disc_insights_company ON public.disciplinary_insights(company_id, is_active, generated_at DESC);

-- ---------------------------------------------------------------------------
-- Offboarding
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offboarding_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  case_number varchar(40),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  department varchar(120),
  position varchar(160),
  last_working_day date NOT NULL,
  reason varchar(80) DEFAULT 'resignation', -- resignation | termination | retirement | contract_end | other
  reason_notes text,
  status varchar(40) DEFAULT 'initiated', -- initiated | in_progress | completed | cancelled
  exit_interview_completed boolean DEFAULT false,
  assets_returned boolean DEFAULT false,
  documents_complete boolean DEFAULT false,
  settlement_amount numeric(14, 2) DEFAULT 0,
  settlement_status varchar(40) DEFAULT 'pending', -- pending | processing | paid | waived
  settlement_paid_at timestamptz,
  initiated_by uuid,
  notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offboard_cases_company ON public.offboarding_cases(company_id, status);
CREATE INDEX IF NOT EXISTS idx_offboard_cases_employee ON public.offboarding_cases(employee_id);

CREATE TABLE IF NOT EXISTS public.offboarding_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES public.offboarding_cases(id) ON DELETE CASCADE,
  item_key varchar(80) NOT NULL,
  label varchar(200) NOT NULL,
  category varchar(60) DEFAULT 'general', -- interview | assets | documents | settlement | it | hr
  is_done boolean DEFAULT false,
  done_at timestamptz,
  done_by varchar(160),
  sort_order integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offboard_checklist_case ON public.offboarding_checklist(case_id);

CREATE TABLE IF NOT EXISTS public.offboarding_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES public.offboarding_cases(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  name varchar(160) NOT NULL,
  asset_type varchar(80) DEFAULT 'equipment',
  serial_number varchar(120),
  condition varchar(40) DEFAULT 'good',
  returned boolean DEFAULT false,
  returned_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offboard_assets_case ON public.offboarding_assets(case_id);

CREATE TABLE IF NOT EXISTS public.offboarding_exit_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES public.offboarding_cases(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  scheduled_at timestamptz,
  completed_at timestamptz,
  interviewer varchar(160),
  status varchar(40) DEFAULT 'scheduled', -- scheduled | completed | skipped
  reasons jsonb DEFAULT '[]'::jsonb,
  ratings jsonb DEFAULT '{}'::jsonb,
  feedback text,
  would_recommend boolean,
  rehire_eligible boolean,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (case_id)
);

CREATE TABLE IF NOT EXISTS public.offboarding_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  case_id uuid REFERENCES public.offboarding_cases(id) ON DELETE CASCADE,
  insight_type varchar(60) NOT NULL,
  title varchar(200) NOT NULL,
  body text,
  severity varchar(20) DEFAULT 'info',
  confidence numeric(4, 3),
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  generated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_offboard_insights_company ON public.offboarding_insights(company_id, is_active, generated_at DESC);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'disciplinary_cases',
    'disciplinary_actions',
    'disciplinary_insights',
    'grievances',
    'offboarding_cases',
    'offboarding_checklist',
    'offboarding_assets',
    'offboarding_exit_interviews',
    'offboarding_insights'
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
