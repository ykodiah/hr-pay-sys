-- Learning & Development + Promotions modules.
-- Extends 097 training stubs. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Instructors
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.training_instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name varchar(160) NOT NULL,
  email varchar(160),
  bio text,
  expertise text[] DEFAULT '{}',
  qualifications text[] DEFAULT '{}',
  rating numeric(3, 2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_training_instructors_company ON public.training_instructors(company_id, is_active);

-- ---------------------------------------------------------------------------
-- Harden training_courses (097 stub)
-- ---------------------------------------------------------------------------
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS category varchar(60) DEFAULT 'technical';
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS delivery_type varchar(40) DEFAULT 'online';
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS level varchar(40) DEFAULT 'beginner';
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS instructor_id uuid REFERENCES public.training_instructors(id) ON DELETE SET NULL;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS instructor_name varchar(160);
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS price numeric(12, 2) DEFAULT 0;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS rating numeric(3, 2) DEFAULT 0;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS enrollment_count integer DEFAULT 0;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS prerequisites text[] DEFAULT '{}';
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS learning_objectives text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_training_courses_company ON public.training_courses(company_id, status);

-- ---------------------------------------------------------------------------
-- Learning paths
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title varchar(240) NOT NULL,
  description text,
  category varchar(80) DEFAULT 'General',
  difficulty varchar(40) DEFAULT 'beginner',
  status varchar(40) DEFAULT 'active',
  total_duration numeric(8, 2) DEFAULT 0,
  enrollments integer DEFAULT 0,
  completion_rate numeric(6, 2) DEFAULT 0,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.learning_path_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  UNIQUE (path_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_paths_company ON public.learning_paths(company_id, status);

-- ---------------------------------------------------------------------------
-- Harden training_enrollments
-- ---------------------------------------------------------------------------
ALTER TABLE public.training_enrollments ADD COLUMN IF NOT EXISTS progress numeric(6, 2) DEFAULT 0;
ALTER TABLE public.training_enrollments ADD COLUMN IF NOT EXISTS score numeric(6, 2);
ALTER TABLE public.training_enrollments ADD COLUMN IF NOT EXISTS certificate_issued boolean DEFAULT false;
ALTER TABLE public.training_enrollments ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.training_enrollments ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_training_enrollments_company ON public.training_enrollments(company_id, status);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_employee ON public.training_enrollments(employee_id);

-- ---------------------------------------------------------------------------
-- Certifications (issued to employees)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.training_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL,
  description text,
  issuer varchar(160),
  category varchar(60) DEFAULT 'professional',
  credential_id varchar(120),
  validity_months integer DEFAULT 12,
  cpd_points numeric(8, 2) DEFAULT 0,
  requirements text[] DEFAULT '{}',
  status varchar(40) DEFAULT 'active', -- active | expired | pending
  date_issued date,
  expiry_date date,
  document_url text,
  course_id uuid REFERENCES public.training_courses(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_training_certs_company ON public.training_certifications(company_id, status);
CREATE INDEX IF NOT EXISTS idx_training_certs_employee ON public.training_certifications(employee_id);

-- ---------------------------------------------------------------------------
-- Learning insights
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_learning_insights_company ON public.learning_insights(company_id, is_active, generated_at DESC);

-- Sync bridge for dashboard learning_courses stub
ALTER TABLE public.learning_courses ADD COLUMN IF NOT EXISTS category varchar(60);
ALTER TABLE public.learning_courses ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- Promotion cases (UI-aligned, company-scoped — avoids legacy schema conflict)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promotion_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  case_number varchar(40),
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_code varchar(80),
  employee_name varchar(160),
  department varchar(120),
  from_grade varchar(40) NOT NULL,
  from_step integer NOT NULL DEFAULT 1,
  to_grade varchar(40) NOT NULL,
  to_step integer NOT NULL DEFAULT 1,
  effective_date date NOT NULL,
  reason text,
  status varchar(40) DEFAULT 'draft', -- draft | in-review | approved | rejected
  initiated_by varchar(160),
  initiated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  attachments jsonb DEFAULT '[]'::jsonb,
  eligibility jsonb DEFAULT '[]'::jsonb,
  approvals jsonb DEFAULT '[]'::jsonb,
  current_base numeric(14, 2) DEFAULT 0,
  proposed_base numeric(14, 2) DEFAULT 0,
  currency varchar(10) DEFAULT 'GHS',
  letter_url text,
  tenure_check boolean DEFAULT false,
  appraisal_check boolean DEFAULT false,
  training_check boolean DEFAULT false,
  disciplinary_check boolean DEFAULT false,
  budget_check boolean DEFAULT true,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promotion_cases_company ON public.promotion_cases(company_id, status);
CREATE INDEX IF NOT EXISTS idx_promotion_cases_employee ON public.promotion_cases(employee_id);

CREATE TABLE IF NOT EXISTS public.promotion_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  case_id uuid REFERENCES public.promotion_cases(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_promotion_insights_company ON public.promotion_insights(company_id, is_active, generated_at DESC);

-- Harden salary_grades for catalog loading
ALTER TABLE public.salary_grades ADD COLUMN IF NOT EXISTS grade_code varchar(40);
ALTER TABLE public.salary_grades ADD COLUMN IF NOT EXISTS band varchar(120);
UPDATE public.salary_grades SET grade_code = COALESCE(grade_code, grade_name) WHERE grade_code IS NULL;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'training_instructors',
    'training_courses',
    'training_enrollments',
    'learning_paths',
    'learning_path_courses',
    'training_certifications',
    'learning_insights',
    'learning_courses',
    'promotion_cases',
    'promotion_insights',
    'salary_grades'
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
