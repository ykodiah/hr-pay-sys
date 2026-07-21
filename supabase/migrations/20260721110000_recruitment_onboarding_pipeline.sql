-- =============================================================================
-- 089: Enhanced recruitment onboarding pipeline
-- Safe / idempotent. Run after 088.
-- =============================================================================

ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES public.recruitment_offers(id) ON DELETE SET NULL;

ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS job_title TEXT;

ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS department TEXT;

ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'welcome';

ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS progress_notes TEXT;

ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS auto_started BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS hired_at TIMESTAMPTZ;

ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS buddy_name TEXT;

ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS manager_name TEXT;

ALTER TABLE public.recruitment_onboarding_tasks
  ADD COLUMN IF NOT EXISTS stage TEXT;

ALTER TABLE public.recruitment_onboarding_tasks
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- One active checklist per application
CREATE UNIQUE INDEX IF NOT EXISTS uq_onboarding_active_application
  ON public.recruitment_onboarding_checklists (application_id)
  WHERE application_id IS NOT NULL
    AND status IN ('pending', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_onboarding_stage
  ON public.recruitment_onboarding_checklists (company_id, stage, status);

CREATE TABLE IF NOT EXISTS public.recruitment_onboarding_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES public.recruitment_onboarding_checklists(id) ON DELETE CASCADE,
  author_id UUID,
  author_label TEXT,
  note TEXT NOT NULL,
  stage TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_notes_checklist
  ON public.recruitment_onboarding_notes (checklist_id, created_at DESC);

ALTER TABLE public.recruitment_onboarding_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'recruitment_onboarding_notes'
      AND policyname = 'recruit_onboarding_notes_all'
  ) THEN
    CREATE POLICY recruit_onboarding_notes_all ON public.recruitment_onboarding_notes
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

NOTIFY pgrst, 'reload schema';
