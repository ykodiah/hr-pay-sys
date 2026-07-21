-- =============================================================================
-- 087: Store extracted CV/resume text for ATS AI screening
-- Safe / idempotent.
-- =============================================================================

ALTER TABLE public.recruitment_candidates
  ADD COLUMN IF NOT EXISTS resume_text TEXT;

ALTER TABLE public.recruitment_candidates
  ADD COLUMN IF NOT EXISTS resume_text_method TEXT;

ALTER TABLE public.recruitment_candidates
  ADD COLUMN IF NOT EXISTS resume_text_chars INT;

ALTER TABLE public.recruitment_candidates
  ADD COLUMN IF NOT EXISTS resume_text_extracted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_recruit_candidates_resume_text
  ON public.recruitment_candidates (company_id)
  WHERE resume_text IS NOT NULL AND length(btrim(resume_text)) > 0;

NOTIFY pgrst, 'reload schema';
