-- =============================================================================
-- 088: Recruitment offers — public response links, remuneration, audit events
-- Safe / idempotent.
-- =============================================================================

-- Public short code for candidate response portal (/o/{short_code})
ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS short_code TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS response_token TEXT;

-- Richer remuneration / employment terms
ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS remuneration JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS working_hours TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS probation_months INT DEFAULT 3;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS notice_months INT DEFAULT 1;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS signatory_name TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS signatory_title TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS department TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS job_title_snapshot TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS candidate_name_snapshot TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS candidate_email_snapshot TEXT;

-- Letter versioning / HTML snapshot for PDF
ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS offer_letter_version INT NOT NULL DEFAULT 1;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS offer_letter_html TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS ai_letter_notes TEXT;

-- Response / send tracking
ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS response_channel TEXT;
  -- portal | admin | email | null

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS candidate_response_note TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS withdrawn_reason TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS email_status TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS last_email_at TIMESTAMPTZ;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS public_views INT NOT NULL DEFAULT 0;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Unique short codes / tokens
CREATE UNIQUE INDEX IF NOT EXISTS uq_recruit_offers_short_code
  ON public.recruitment_offers (short_code)
  WHERE short_code IS NOT NULL AND btrim(short_code) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_recruit_offers_response_token
  ON public.recruitment_offers (response_token)
  WHERE response_token IS NOT NULL AND btrim(response_token) <> '';

CREATE INDEX IF NOT EXISTS idx_recruit_offers_application
  ON public.recruitment_offers (application_id);

-- Event / audit log for offer lifecycle
CREATE TABLE IF NOT EXISTS public.recruitment_offer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES public.recruitment_offers(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.recruitment_applications(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  -- created | updated | letter_edited | remuneration_updated | sent | viewed |
  -- accepted | rejected | withdrawn | expired | ai_regenerated | admin_status
  actor_type TEXT, -- admin | candidate | system | ai
  actor_id UUID,
  actor_label TEXT,
  from_status TEXT,
  to_status TEXT,
  notes TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recruit_offer_events_offer
  ON public.recruitment_offer_events (offer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recruit_offer_events_company
  ON public.recruitment_offer_events (company_id, created_at DESC);

ALTER TABLE public.recruitment_offer_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'recruitment_offer_events' AND policyname = 'recruit_offer_events_all'
  ) THEN
    CREATE POLICY recruit_offer_events_all ON public.recruitment_offer_events
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Backfill short_code / response_token for existing offers (deterministic-ish unique)
UPDATE public.recruitment_offers o
SET
  short_code = COALESCE(
    NULLIF(btrim(o.short_code), ''),
    upper(substr(replace(o.id::text, '-', ''), 1, 8))
  ),
  response_token = COALESCE(
    NULLIF(btrim(o.response_token), ''),
    replace(o.id::text, '-', '') || substr(md5(o.id::text || coalesce(o.company_id::text, '')), 1, 16)
  )
WHERE o.short_code IS NULL OR o.response_token IS NULL;

NOTIFY pgrst, 'reload schema';
