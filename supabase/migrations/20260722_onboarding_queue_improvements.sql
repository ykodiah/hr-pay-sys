-- =============================================================================
-- 094: Onboarding Queue & Stage Archiving
-- Safe / idempotent.
-- =============================================================================

-- Modify recruitment_onboarding_checklists table for queue and archiving
ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS queue_position INT;

ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS completed_stages JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS is_stage_archived BOOLEAN DEFAULT false;

ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- Create table for completed stages summary
CREATE TABLE IF NOT EXISTS public.recruitment_onboarding_completed_stages_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES public.recruitment_onboarding_checklists(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  signed_off_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  signed_off_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tasks_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_onboarding_queue_company
  ON public.recruitment_onboarding_checklists (company_id, queue_position)
  WHERE status IN ('pending', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_onboarding_queue_archived
  ON public.recruitment_onboarding_checklists (company_id, is_stage_archived)
  WHERE is_stage_archived = true;

CREATE INDEX IF NOT EXISTS idx_completed_stages_checklist
  ON public.recruitment_onboarding_completed_stages_summary (checklist_id, signed_off_at DESC);

CREATE INDEX IF NOT EXISTS idx_completed_stages_company
  ON public.recruitment_onboarding_completed_stages_summary (company_id, signed_off_at DESC);

CREATE INDEX IF NOT EXISTS idx_completed_stages_stage
  ON public.recruitment_onboarding_completed_stages_summary (stage, company_id);

-- Enable RLS
ALTER TABLE public.recruitment_onboarding_completed_stages_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'recruitment_onboarding_completed_stages_summary'
      AND policyname = 'recruitment_completed_stages_all'
  ) THEN
    CREATE POLICY recruitment_completed_stages_all ON public.recruitment_onboarding_completed_stages_summary
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

NOTIFY pgrst, 'reload schema';
