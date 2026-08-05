-- Performance module: goals/OKRs, reviews, competencies, assessments, succession, insights.
-- Extends existing performance_reviews. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Harden existing performance_reviews
-- ---------------------------------------------------------------------------
ALTER TABLE public.performance_reviews ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.performance_reviews ADD COLUMN IF NOT EXISTS review_type varchar(40) DEFAULT 'annual';
ALTER TABLE public.performance_reviews ADD COLUMN IF NOT EXISTS period_label varchar(80);
ALTER TABLE public.performance_reviews ADD COLUMN IF NOT EXISTS overall_score numeric(4, 2);
ALTER TABLE public.performance_reviews ADD COLUMN IF NOT EXISTS goals_score numeric(4, 2);
ALTER TABLE public.performance_reviews ADD COLUMN IF NOT EXISTS competencies_score numeric(4, 2);
ALTER TABLE public.performance_reviews ADD COLUMN IF NOT EXISTS competency_scores jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.performance_reviews ADD COLUMN IF NOT EXISTS feedback text;
ALTER TABLE public.performance_reviews ADD COLUMN IF NOT EXISTS comments text;
ALTER TABLE public.performance_reviews ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.performance_reviews ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE public.performance_reviews ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.performance_reviews ADD COLUMN IF NOT EXISTS rating numeric(4, 2);
ALTER TABLE public.performance_reviews ADD COLUMN IF NOT EXISTS period_start date;
ALTER TABLE public.performance_reviews ADD COLUMN IF NOT EXISTS period_end date;

-- Alias rating ↔ overall_rating for ML consumers
UPDATE public.performance_reviews SET rating = overall_rating WHERE rating IS NULL AND overall_rating IS NOT NULL;
UPDATE public.performance_reviews SET overall_score = COALESCE(overall_score, rating, overall_rating::numeric);
UPDATE public.performance_reviews SET period_start = COALESCE(period_start, review_period_start);
UPDATE public.performance_reviews SET period_end = COALESCE(period_end, review_period_end);

CREATE INDEX IF NOT EXISTS idx_perf_reviews_company ON public.performance_reviews(company_id, status);

-- ---------------------------------------------------------------------------
-- Goals / OKRs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.performance_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  title varchar(240) NOT NULL,
  description text,
  goal_type varchar(40) DEFAULT 'individual', -- individual | team | company
  category varchar(80) DEFAULT 'Individual',
  priority varchar(20) DEFAULT 'medium', -- low | medium | high | critical
  department varchar(120),
  status varchar(40) DEFAULT 'active', -- draft | active | completed | overdue | cancelled
  progress numeric(6, 2) DEFAULT 0,
  target_value numeric(14, 2) DEFAULT 100,
  current_value numeric(14, 2) DEFAULT 0,
  unit varchar(40) DEFAULT '%',
  start_date date,
  end_date date,
  due_date date,
  parent_goal_id uuid REFERENCES public.performance_goals(id) ON DELETE SET NULL,
  key_results jsonb DEFAULT '[]'::jsonb,
  owner_name varchar(160),
  created_by uuid,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.performance_goals ADD COLUMN IF NOT EXISTS priority varchar(20) DEFAULT 'medium';
ALTER TABLE public.performance_goals ADD COLUMN IF NOT EXISTS due_date date;

CREATE INDEX IF NOT EXISTS idx_perf_goals_company ON public.performance_goals(company_id, status);
CREATE INDEX IF NOT EXISTS idx_perf_goals_employee ON public.performance_goals(employee_id);

-- ---------------------------------------------------------------------------
-- Competencies catalog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.performance_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name varchar(160) NOT NULL,
  description text,
  category varchar(60) DEFAULT 'Core',
  level varchar(40) DEFAULT 'intermediate',
  roles text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_perf_competencies_company ON public.performance_competencies(company_id, is_active);

-- ---------------------------------------------------------------------------
-- Per-employee competency assessments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.performance_competency_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  competency_id uuid REFERENCES public.performance_competencies(id) ON DELETE SET NULL,
  competency_name varchar(160) NOT NULL,
  category varchar(60) DEFAULT 'Core',
  current_level numeric(3, 1) DEFAULT 3,
  target_level numeric(3, 1) DEFAULT 4,
  assessed_by varchar(160),
  notes text,
  assessed_at date DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_perf_comp_assess_company ON public.performance_competency_assessments(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_perf_comp_assess_employee ON public.performance_competency_assessments(employee_id);

-- ---------------------------------------------------------------------------
-- Succession plans
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.performance_succession (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  position varchar(160) NOT NULL,
  target_position varchar(160),
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  incumbent_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  incumbent_name varchar(160),
  department varchar(120),
  criticality varchar(20) DEFAULT 'medium',
  risk_level varchar(20) DEFAULT 'medium',
  readiness_level varchar(40) DEFAULT 'developing',
  readiness_percent numeric(5, 2) DEFAULT 0,
  potential_rating varchar(20) DEFAULT 'medium',
  development_plan text,
  successors jsonb DEFAULT '[]'::jsonb,
  development_needs text[] DEFAULT '{}',
  notes text,
  status varchar(40) DEFAULT 'active',
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.performance_succession ADD COLUMN IF NOT EXISTS target_position varchar(160);
ALTER TABLE public.performance_succession ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.performance_succession ADD COLUMN IF NOT EXISTS readiness_level varchar(40) DEFAULT 'developing';
ALTER TABLE public.performance_succession ADD COLUMN IF NOT EXISTS readiness_percent numeric(5, 2) DEFAULT 0;
ALTER TABLE public.performance_succession ADD COLUMN IF NOT EXISTS potential_rating varchar(20) DEFAULT 'medium';
ALTER TABLE public.performance_succession ADD COLUMN IF NOT EXISTS development_plan text;

CREATE INDEX IF NOT EXISTS idx_perf_succession_company ON public.performance_succession(company_id, status);

-- ---------------------------------------------------------------------------
-- AI/ML insight cache (fast dashboard sync)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.performance_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  insight_type varchar(60) NOT NULL,
  title varchar(200) NOT NULL,
  message text,
  body text,
  score numeric(6, 2),
  confidence numeric(4, 3),
  severity varchar(20) DEFAULT 'info',
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  generated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  expires_at timestamptz
);

ALTER TABLE public.performance_insights ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE public.performance_insights ADD COLUMN IF NOT EXISTS confidence numeric(4, 3);

CREATE INDEX IF NOT EXISTS idx_perf_insights_company ON public.performance_insights(company_id, is_active, generated_at DESC);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'performance_goals',
    'performance_competencies',
    'performance_competency_assessments',
    'performance_succession',
    'performance_insights',
    'performance_reviews'
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
