-- Hardening for recruitment + org chart DB flows
-- Safe to re-run after 051_recruitment_and_org_chart.sql

-- Persist chart generation scope so regenerate round-trips correctly
ALTER TABLE public.organizational_charts
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'all';

CREATE INDEX IF NOT EXISTS idx_org_charts_scope ON public.organizational_charts(company_id, scope);

-- Unique shareable job slugs per company (ignore null/empty)
CREATE UNIQUE INDEX IF NOT EXISTS idx_recruit_jobs_company_slug
  ON public.recruitment_job_postings(company_id, slug)
  WHERE slug IS NOT NULL AND slug <> '';

-- Fast public careers lookups
CREATE INDEX IF NOT EXISTS idx_recruit_jobs_published
  ON public.recruitment_job_postings(status, published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_recruit_jobs_slug
  ON public.recruitment_job_postings(slug)
  WHERE slug IS NOT NULL AND slug <> '';

-- Backfill empty slugs from titles where possible
UPDATE public.recruitment_job_postings
SET slug = lower(regexp_replace(regexp_replace(coalesce(title, 'job'), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
    || '-' || substr(replace(id::text, '-', ''), 1, 8)
WHERE slug IS NULL OR btrim(slug) = '';
