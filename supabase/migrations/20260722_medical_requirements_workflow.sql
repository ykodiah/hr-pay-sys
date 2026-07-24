-- =============================================================================
-- 092: Medical Requirements Workflow in Offers
-- Safe / idempotent.
-- =============================================================================

-- Modify recruitment_offers table for medical requirements
ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS medical_required BOOLEAN DEFAULT false;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS medical_required_before_offer_letter BOOLEAN;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS medical_submitted_at TIMESTAMPTZ;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS medical_file_path TEXT;

ALTER TABLE public.recruitment_offers
  ADD COLUMN IF NOT EXISTS medical_status TEXT DEFAULT 'pending' CHECK (medical_status IN ('pending', 'submitted', 'verified', 'rejected', 'not_required'));

-- Create table for medical submissions
CREATE TABLE IF NOT EXISTS public.recruitment_applicant_medical_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.recruitment_offers(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.recruitment_applications(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.recruitment_candidates(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  medical_file_path TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  verification_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resubmit_required')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medical_submissions_offer
  ON public.recruitment_applicant_medical_submissions (offer_id);

CREATE INDEX IF NOT EXISTS idx_medical_submissions_company
  ON public.recruitment_applicant_medical_submissions (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_medical_submissions_application
  ON public.recruitment_applicant_medical_submissions (application_id);

CREATE INDEX IF NOT EXISTS idx_medical_submissions_status
  ON public.recruitment_applicant_medical_submissions (status, company_id);

-- Enable RLS
ALTER TABLE public.recruitment_applicant_medical_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'recruitment_applicant_medical_submissions'
      AND policyname = 'recruitment_medical_submissions_all'
  ) THEN
    CREATE POLICY recruitment_medical_submissions_all ON public.recruitment_applicant_medical_submissions
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

NOTIFY pgrst, 'reload schema';
