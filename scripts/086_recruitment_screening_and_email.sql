-- =============================================================================
-- 086: Recruitment application screening + applicant email audit
-- Tenant-isolated AI screening results and confirmation-email logs.
-- Safe / idempotent.
-- =============================================================================

ALTER TABLE public.recruitment_applications
  ADD COLUMN IF NOT EXISTS screening_score NUMERIC(5,2);

ALTER TABLE public.recruitment_applications
  ADD COLUMN IF NOT EXISTS screening_summary TEXT;

ALTER TABLE public.recruitment_applications
  ADD COLUMN IF NOT EXISTS screening_status TEXT
    CHECK (screening_status IS NULL OR screening_status IN (
      'pending', 'running', 'completed', 'overridden', 'failed'
    ));

ALTER TABLE public.recruitment_applications
  ADD COLUMN IF NOT EXISTS screened_at TIMESTAMPTZ;

ALTER TABLE public.recruitment_applications
  ADD COLUMN IF NOT EXISTS screened_by UUID;

CREATE TABLE IF NOT EXISTS public.recruitment_application_screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.recruitment_applications(id) ON DELETE CASCADE,
  job_posting_id UUID REFERENCES public.recruitment_job_postings(id) ON DELETE SET NULL,
  candidate_id UUID REFERENCES public.recruitment_candidates(id) ON DELETE SET NULL,
  ai_score NUMERIC(5,2),
  final_score NUMERIC(5,2),
  recommendation TEXT
    CHECK (recommendation IS NULL OR recommendation IN (
      'strong_yes', 'yes', 'maybe', 'no', 'strong_no'
    )),
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  criteria_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary TEXT,
  model_used TEXT,
  resume_excerpt TEXT,
  cover_letter_excerpt TEXT,
  job_requirements_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_manual_override BOOLEAN NOT NULL DEFAULT false,
  override_reason TEXT,
  override_by UUID,
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'overridden')),
  error_message TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recruit_screenings_company
  ON public.recruitment_application_screenings (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recruit_screenings_application
  ON public.recruitment_application_screenings (application_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.recruitment_application_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.recruitment_applications(id) ON DELETE SET NULL,
  candidate_id UUID REFERENCES public.recruitment_candidates(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL DEFAULT 'application_received'
    CHECK (email_type IN (
      'application_received', 'screening_update', 'interview_invite', 'offer', 'rejection', 'other'
    )),
  recipient_email TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
  provider TEXT,
  external_id TEXT,
  error_message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recruit_app_emails_company
  ON public.recruitment_application_emails (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recruit_app_emails_application
  ON public.recruitment_application_emails (application_id);

ALTER TABLE public.recruitment_application_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_application_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recruit_screenings_all ON public.recruitment_application_screenings;
CREATE POLICY recruit_screenings_all ON public.recruitment_application_screenings
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS recruit_app_emails_all ON public.recruitment_application_emails;
CREATE POLICY recruit_app_emails_all ON public.recruitment_application_emails
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.recruitment_application_screenings TO authenticated, anon;
GRANT ALL ON public.recruitment_application_emails TO authenticated, anon;

NOTIFY pgrst, 'reload schema';
