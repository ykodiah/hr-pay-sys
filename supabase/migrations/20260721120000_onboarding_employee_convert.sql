-- =============================================================================
-- 090: Onboarding → employee conversion audit
-- Safe / idempotent. Run after 089.
-- =============================================================================

ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

ALTER TABLE public.recruitment_onboarding_checklists
  ADD COLUMN IF NOT EXISTS converted_by UUID;

CREATE TABLE IF NOT EXISTS public.recruitment_hire_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES public.recruitment_onboarding_checklists(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.recruitment_applications(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES public.recruitment_offers(id) ON DELETE SET NULL,
  candidate_id UUID REFERENCES public.recruitment_candidates(id) ON DELETE SET NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  action TEXT NOT NULL DEFAULT 'created',
  -- created | linked_existing
  actor_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_hire_conversion_checklist
  ON public.recruitment_hire_conversions (checklist_id);

CREATE INDEX IF NOT EXISTS idx_hire_conversions_company
  ON public.recruitment_hire_conversions (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hire_conversions_employee
  ON public.recruitment_hire_conversions (employee_id);

ALTER TABLE public.recruitment_hire_conversions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'recruitment_hire_conversions'
      AND policyname = 'recruit_hire_conversions_all'
  ) THEN
    CREATE POLICY recruit_hire_conversions_all ON public.recruitment_hire_conversions
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

NOTIFY pgrst, 'reload schema';
