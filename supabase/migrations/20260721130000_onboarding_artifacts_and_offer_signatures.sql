-- =============================================================================
-- 091: Onboarding task artifacts + offer dual signatures
-- Safe / idempotent. Run after 090.
-- =============================================================================

ALTER TABLE public.recruitment_onboarding_tasks
  ADD COLUMN IF NOT EXISTS response_data JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.recruitment_onboarding_tasks
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;

ALTER TABLE public.recruitment_onboarding_tasks
  ADD COLUMN IF NOT EXISTS attachment_name TEXT;

ALTER TABLE public.recruitment_onboarding_tasks
  ADD COLUMN IF NOT EXISTS vault_document_id UUID;

ALTER TABLE public.recruitment_onboarding_tasks
  ADD COLUMN IF NOT EXISTS document_type TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS candidate_signature_name TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS candidate_signature_data TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS candidate_signed_at TIMESTAMPTZ;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS hr_signature_name TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS hr_signature_data TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS hr_signed_at TIMESTAMPTZ;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS signed_letter_vault_id UUID;

ALTER TABLE public.document_vault
  ADD COLUMN IF NOT EXISTS checklist_id UUID;

ALTER TABLE public.document_vault
  ADD COLUMN IF NOT EXISTS onboarding_task_id UUID;

CREATE INDEX IF NOT EXISTS idx_document_vault_checklist
  ON public.document_vault (checklist_id)
  WHERE checklist_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_document_vault_employee_company
  ON public.document_vault (company_id, employee_id)
  WHERE employee_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
