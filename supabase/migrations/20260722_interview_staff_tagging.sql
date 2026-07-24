-- =============================================================================
-- 091: Interview Staff Tagging & Notifications
-- Safe / idempotent.
-- =============================================================================

-- Modify recruitment_interviews table to add staff assignment
ALTER TABLE public.recruitment_interviews
  ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;

ALTER TABLE public.recruitment_interviews
  ADD COLUMN IF NOT EXISTS interview_summary TEXT;

ALTER TABLE public.recruitment_interviews
  ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'all' CHECK (notification_type IN ('email', 'sms', 'notification', 'all'));

-- Create table for tracking multiple staff tagged to an interview
CREATE TABLE IF NOT EXISTS public.recruitment_interview_staff_tagging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  interview_id UUID NOT NULL REFERENCES public.recruitment_interviews(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  notification_sent_at TIMESTAMPTZ,
  email_status TEXT DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed', 'bounced')),
  sms_status TEXT DEFAULT 'pending' CHECK (sms_status IN ('pending', 'sent', 'failed')),
  notification_status TEXT DEFAULT 'pending' CHECK (notification_status IN ('pending', 'sent', 'read')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(interview_id, staff_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_interview_staff_company
  ON public.recruitment_interview_staff_tagging (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interview_staff_interview
  ON public.recruitment_interview_staff_tagging (interview_id);

CREATE INDEX IF NOT EXISTS idx_interview_staff_notification_pending
  ON public.recruitment_interview_staff_tagging (company_id, notification_status)
  WHERE notification_status = 'pending';

-- Enable RLS
ALTER TABLE public.recruitment_interview_staff_tagging ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'recruitment_interview_staff_tagging'
      AND policyname = 'recruitment_interview_staff_tagging_all'
  ) THEN
    CREATE POLICY recruitment_interview_staff_tagging_all ON public.recruitment_interview_staff_tagging
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

NOTIFY pgrst, 'reload schema';
