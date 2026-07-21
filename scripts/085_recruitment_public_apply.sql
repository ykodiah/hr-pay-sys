-- =============================================================================
-- 085: Recruitment public apply modernization
-- short_code links, ensure resume fields, applications sync helpers
-- Safe / idempotent.
-- =============================================================================

-- Short public apply codes (/j/XXXXXX)
ALTER TABLE public.recruitment_job_postings
  ADD COLUMN IF NOT EXISTS short_code TEXT;

ALTER TABLE public.recruitment_job_postings
  ADD COLUMN IF NOT EXISTS public_summary TEXT;

ALTER TABLE public.recruitment_job_postings
  ADD COLUMN IF NOT EXISTS applications_count INT NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_recruit_jobs_short_code
  ON public.recruitment_job_postings (short_code)
  WHERE short_code IS NOT NULL AND btrim(short_code) <> '';

-- Candidate resume / LinkedIn extras
ALTER TABLE public.recruitment_candidates
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

ALTER TABLE public.recruitment_candidates
  ADD COLUMN IF NOT EXISTS resume_mime_type TEXT;

ALTER TABLE public.recruitment_candidates
  ADD COLUMN IF NOT EXISTS resume_size INT;

-- Application attachment mirror (handy for queue)
ALTER TABLE public.recruitment_applications
  ADD COLUMN IF NOT EXISTS resume_url TEXT;

ALTER TABLE public.recruitment_applications
  ADD COLUMN IF NOT EXISTS resume_filename TEXT;

-- Requester FK already exists as requester_employee_id; ensure index
CREATE INDEX IF NOT EXISTS idx_recruit_req_requester
  ON public.recruitment_requisitions (requester_employee_id)
  WHERE requester_employee_id IS NOT NULL;

-- Generator for collision-resistant short codes
CREATE OR REPLACE FUNCTION public.generate_job_short_code(p_len INT DEFAULT 8)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
  attempt INT := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..GREATEST(6, LEAST(p_len, 12)) LOOP
      result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.recruitment_job_postings WHERE short_code = result
    );
    attempt := attempt + 1;
    IF attempt > 50 THEN
      result := result || substr(md5(random()::text), 1, 4);
      EXIT;
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- Backfill missing short codes
UPDATE public.recruitment_job_postings
SET short_code = public.generate_job_short_code(8)
WHERE short_code IS NULL OR btrim(short_code) = '';

-- Keep applications_count roughly in sync
CREATE OR REPLACE FUNCTION public.trg_recruit_app_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.job_posting_id IS NOT NULL THEN
    UPDATE public.recruitment_job_postings
    SET applications_count = COALESCE(applications_count, 0) + 1,
        updated_at = now()
    WHERE id = NEW.job_posting_id;
  ELSIF TG_OP = 'DELETE' AND OLD.job_posting_id IS NOT NULL THEN
    UPDATE public.recruitment_job_postings
    SET applications_count = GREATEST(0, COALESCE(applications_count, 0) - 1),
        updated_at = now()
    WHERE id = OLD.job_posting_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.job_posting_id IS DISTINCT FROM OLD.job_posting_id THEN
    IF OLD.job_posting_id IS NOT NULL THEN
      UPDATE public.recruitment_job_postings
      SET applications_count = GREATEST(0, COALESCE(applications_count, 0) - 1),
          updated_at = now()
      WHERE id = OLD.job_posting_id;
    END IF;
    IF NEW.job_posting_id IS NOT NULL THEN
      UPDATE public.recruitment_job_postings
      SET applications_count = COALESCE(applications_count, 0) + 1,
          updated_at = now()
      WHERE id = NEW.job_posting_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recruit_app_count ON public.recruitment_applications;
CREATE TRIGGER trg_recruit_app_count
AFTER INSERT OR UPDATE OR DELETE ON public.recruitment_applications
FOR EACH ROW EXECUTE FUNCTION public.trg_recruit_app_count();

-- Recompute counts once
UPDATE public.recruitment_job_postings j
SET applications_count = COALESCE((
  SELECT count(*)::int FROM public.recruitment_applications a WHERE a.job_posting_id = j.id
), 0);

GRANT EXECUTE ON FUNCTION public.generate_job_short_code(INT) TO authenticated, anon;

NOTIFY pgrst, 'reload schema';
