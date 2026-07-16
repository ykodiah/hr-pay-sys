-- Recruitment ATS + Organizational Charts schema
-- Safe to re-run.

-- ═══════════════════════════════════════════════════════════════════════════
-- ORGANIZATIONAL CHARTS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.organizational_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subsidiary_id UUID REFERENCES public.subsidiaries(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  chart_type TEXT NOT NULL DEFAULT 'hierarchical'
    CHECK (chart_type IN ('hierarchical', 'matrix', 'flat', 'functional')),
  chart_style TEXT NOT NULL DEFAULT 'modern'
    CHECK (chart_style IN ('modern', 'classic', 'minimal', 'corporate')),
  chart_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_image TEXT,
  source_employee_count INT NOT NULL DEFAULT 0,
  source_hash TEXT,
  scope TEXT NOT NULL DEFAULT 'all',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Align legacy columns if table already existed with different shape
ALTER TABLE public.organizational_charts
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS subsidiary_id UUID REFERENCES public.subsidiaries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chart_type TEXT DEFAULT 'hierarchical',
  ADD COLUMN IF NOT EXISTS chart_style TEXT DEFAULT 'modern',
  ADD COLUMN IF NOT EXISTS chart_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS preview_image TEXT,
  ADD COLUMN IF NOT EXISTS source_employee_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_hash TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS user_id UUID, -- legacy alias some UIs wrote
  ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'all';

CREATE INDEX IF NOT EXISTS idx_org_charts_company ON public.organizational_charts(company_id);
CREATE INDEX IF NOT EXISTS idx_org_charts_subsidiary ON public.organizational_charts(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_org_charts_active ON public.organizational_charts(company_id, is_active);

ALTER TABLE public.organizational_charts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_charts_all ON public.organizational_charts;
CREATE POLICY org_charts_all ON public.organizational_charts FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.organizational_charts TO authenticated, anon;

-- ═══════════════════════════════════════════════════════════════════════════
-- RECRUITMENT
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.recruitment_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  employment_type TEXT DEFAULT 'Full-time',
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'filled', 'cancelled')),
  budget_min NUMERIC(15,2) DEFAULT 0,
  budget_max NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'GHS',
  headcount INT NOT NULL DEFAULT 1,
  requester_name TEXT,
  requester_employee_id UUID,
  deadline DATE,
  description TEXT,
  requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recruitment_job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requisition_id UUID REFERENCES public.recruitment_requisitions(id) ON DELETE SET NULL,
  slug TEXT,
  title TEXT NOT NULL,
  description TEXT,
  requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  salary_min NUMERIC(15,2) DEFAULT 0,
  salary_max NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'GHS',
  location TEXT,
  department TEXT,
  employment_type TEXT DEFAULT 'Full-time',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'paused', 'closed', 'archived')),
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  views_count INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recruitment_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  experience_text TEXT,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  education TEXT,
  previous_company TEXT,
  source TEXT DEFAULT 'direct',
  resume_url TEXT,
  resume_filename TEXT,
  resume_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recruitment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_posting_id UUID REFERENCES public.recruitment_job_postings(id) ON DELETE SET NULL,
  candidate_id UUID REFERENCES public.recruitment_candidates(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')),
  score NUMERIC(5,2) DEFAULT 0,
  source TEXT DEFAULT 'direct',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cover_letter TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recruitment_application_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.recruitment_applications(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recruitment_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.recruitment_applications(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL DEFAULT 'video'
    CHECK (interview_type IN ('phone', 'video', 'in_person', 'panel', 'technical')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  interviewer_name TEXT,
  interviewer_employee_id UUID,
  location TEXT,
  meeting_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  rating NUMERIC(3,1),
  feedback TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recruitment_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.recruitment_applications(id) ON DELETE CASCADE,
  salary NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'GHS',
  start_date DATE,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  terms TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'withdrawn', 'expired')),
  offer_letter_text TEXT,
  sent_at TIMESTAMPTZ,
  acceptance_deadline DATE,
  responded_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recruitment_onboarding_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.recruitment_applications(id) ON DELETE SET NULL,
  candidate_id UUID REFERENCES public.recruitment_candidates(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  candidate_name TEXT,
  start_date DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  progress INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recruitment_onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.recruitment_onboarding_checklists(id) ON DELETE CASCADE,
  task_type TEXT DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT,
  assigned_department TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  due_date DATE,
  priority TEXT DEFAULT 'medium',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recruit_req_company ON public.recruitment_requisitions(company_id, status);
CREATE INDEX IF NOT EXISTS idx_recruit_jobs_company ON public.recruitment_job_postings(company_id, status);
CREATE INDEX IF NOT EXISTS idx_recruit_apps_company ON public.recruitment_applications(company_id, status);
CREATE INDEX IF NOT EXISTS idx_recruit_interviews_company ON public.recruitment_interviews(company_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_recruit_offers_company ON public.recruitment_offers(company_id, status);
CREATE INDEX IF NOT EXISTS idx_recruit_onboarding_company ON public.recruitment_onboarding_checklists(company_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_recruit_jobs_company_slug
  ON public.recruitment_job_postings(company_id, slug)
  WHERE slug IS NOT NULL AND slug <> '';
CREATE INDEX IF NOT EXISTS idx_recruit_jobs_published
  ON public.recruitment_job_postings(status, published_at DESC)
  WHERE status = 'published';

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'recruitment_requisitions',
    'recruitment_job_postings',
    'recruitment_candidates',
    'recruitment_applications',
    'recruitment_application_history',
    'recruitment_interviews',
    'recruitment_offers',
    'recruitment_onboarding_checklists',
    'recruitment_onboarding_tasks'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I_all ON public.%I', t, t);
    EXECUTE format('CREATE POLICY %I_all ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('GRANT ALL ON public.%I TO authenticated, anon', t);
  END LOOP;
END $$;
