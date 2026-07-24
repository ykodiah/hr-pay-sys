-- =============================================================================
-- Recruitment Enhancements Migration
-- Adds: archived_stages array, is_stage_archived flag, completed_stages jsonb
--       on onboarding checklists; interview assessment tables; medical uploads;
--       varchar expansion for employees.
-- Safe / idempotent.
-- =============================================================================

-- ----------------------------------------------------------------
-- 1. onboarding checklists: add archived_stages + stage tracking
-- ----------------------------------------------------------------
ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS archived_stages TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS completed_stages JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS is_stage_archived BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- ----------------------------------------------------------------
-- 2. employees: widen varchar columns that caused overflow
-- ----------------------------------------------------------------
-- position & department are currently character varying (no explicit limit shown,
-- but the error says varchar(100)). Widen them safely.
ALTER TABLE public.employees
  ALTER COLUMN position TYPE character varying(255),
  ALTER COLUMN department TYPE character varying(255),
  ALTER COLUMN location TYPE character varying(255),
  ALTER COLUMN notice_period TYPE character varying(200),
  ALTER COLUMN educational_level TYPE character varying(200);

-- ----------------------------------------------------------------
-- 3. Interview assessment forms
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recruitment_interview_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  interview_id UUID NOT NULL REFERENCES public.recruitment_interviews(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.recruitment_applications(id) ON DELETE SET NULL,
  assessor_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  assessor_name TEXT,
  assessor_title TEXT,

  -- Assessment criteria scores (0-100)
  technical_score NUMERIC,
  communication_score NUMERIC,
  cultural_fit_score NUMERIC,
  problem_solving_score NUMERIC,
  overall_score NUMERIC,

  -- Qualitative notes
  strengths TEXT,
  areas_for_improvement TEXT,
  recommendation TEXT CHECK (recommendation IN ('strongly_recommend', 'recommend', 'neutral', 'not_recommend', 'strongly_not_recommend')),
  notes TEXT,

  -- Result
  outcome TEXT CHECK (outcome IN ('passed', 'failed', 'pending')),
  pass_threshold NUMERIC DEFAULT 60,

  -- Sign-off
  signed_off_at TIMESTAMPTZ,
  signed_off_name TEXT,
  signed_off_data TEXT, -- base64 signature or typed name

  -- Notifications sent
  result_notified_at TIMESTAMPTZ,
  notification_channel TEXT, -- 'email', 'sms', 'both'

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for assessments
ALTER TABLE public.recruitment_interview_assessments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'recruitment_interview_assessments' AND policyname = 'recruit_assessments_all'
  ) THEN
    CREATE POLICY recruit_assessments_all ON public.recruitment_interview_assessments
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ----------------------------------------------------------------
-- 4. Medical upload records
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recruitment_medical_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.recruitment_offers(id) ON DELETE SET NULL,
  application_id UUID REFERENCES public.recruitment_applications(id) ON DELETE SET NULL,
  checklist_id UUID REFERENCES public.recruitment_onboarding_checklists(id) ON DELETE SET NULL,
  candidate_name TEXT,
  candidate_email TEXT,

  -- File details
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size BIGINT,

  -- Workflow
  requested_at TIMESTAMPTZ DEFAULT now(),
  uploaded_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'reviewed', 'approved', 'rejected')),

  -- AI-generated form content (for pre-filled medical form)
  ai_form_content TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_medical_uploads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'recruitment_medical_uploads' AND policyname = 'recruit_medical_uploads_all'
  ) THEN
    CREATE POLICY recruit_medical_uploads_all ON public.recruitment_medical_uploads
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Add medical_upload_id reference to onboarding tasks
ALTER TABLE public.recruitment_onboarding_tasks
  ADD COLUMN IF NOT EXISTS medical_upload_id UUID REFERENCES public.recruitment_medical_uploads(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------
-- 5. Interview: add assessment_sent_at + applicant result fields
-- ----------------------------------------------------------------
ALTER TABLE public.recruitment_interviews
  ADD COLUMN IF NOT EXISTS assessment_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assessment_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS applicant_result TEXT CHECK (applicant_result IN ('passed', 'failed', 'pending')),
  ADD COLUMN IF NOT EXISTS result_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS result_notification_channel TEXT,
  ADD COLUMN IF NOT EXISTS interviewer_ids TEXT[]; -- array of employee IDs for multi-panelists

-- ----------------------------------------------------------------
-- 6. Onboarding checklists: medical tracking fields
-- ----------------------------------------------------------------
ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS medical_required BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS medical_timing TEXT DEFAULT 'after' CHECK (medical_timing IN ('before', 'after')),
  ADD COLUMN IF NOT EXISTS medical_request_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS medical_upload_id UUID REFERENCES public.recruitment_medical_uploads(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------
-- 7. Onboarding completed stages summary (may already exist)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recruitment_onboarding_completed_stages_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES public.recruitment_onboarding_checklists(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  signed_off_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  signed_off_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tasks_summary JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_onboarding_completed_stages_summary ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'recruitment_onboarding_completed_stages_summary' AND policyname = 'recruit_completed_stages_all'
  ) THEN
    CREATE POLICY recruit_completed_stages_all ON public.recruitment_onboarding_completed_stages_summary
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
