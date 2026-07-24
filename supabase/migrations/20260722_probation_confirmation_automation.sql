-- =============================================================================
-- 093: Probation Period & Confirmation Automation
-- Safe / idempotent.
-- =============================================================================

-- Modify employees table for probation tracking
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS probation_start_date DATE;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS probation_end_date DATE;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS probation_duration_months INT DEFAULT 6;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS confirmation_status TEXT DEFAULT 'pending' CHECK (confirmation_status IN ('pending', 'confirmed', 'not_confirmed', 'extended'));

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS confirmation_decision_date TIMESTAMPTZ;

-- Create probation reviews table
CREATE TABLE IF NOT EXISTS public.recruitment_probation_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  probation_start_date DATE NOT NULL,
  probation_end_date DATE NOT NULL,
  review_board_initiated_at TIMESTAMPTZ,
  notification_sent_at TIMESTAMPTZ,
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'under_review', 'confirmed', 'not_confirmed', 'extended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id)
);

-- Create confirmation decisions table
CREATE TABLE IF NOT EXISTS public.recruitment_confirmation_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  probation_review_id UUID REFERENCES public.recruitment_probation_reviews(id) ON DELETE CASCADE,
  confirmed BOOLEAN NOT NULL,
  pay_decision TEXT CHECK (pay_decision IN ('same_pay', 'pay_increase')),
  new_salary DECIMAL(15, 2),
  confirmation_date DATE,
  decided_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  decision_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create probation notifications table
CREATE TABLE IF NOT EXISTS public.recruitment_probation_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  probation_review_id UUID REFERENCES public.recruitment_probation_reviews(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL DEFAULT 'hr_priority_alert' CHECK (notification_type IN ('hr_priority_alert', 'employee_alert')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_probation_reviews_company
  ON public.recruitment_probation_reviews (company_id, probation_end_date);

CREATE INDEX IF NOT EXISTS idx_probation_reviews_employee
  ON public.recruitment_probation_reviews (employee_id);

CREATE INDEX IF NOT EXISTS idx_probation_reviews_status
  ON public.recruitment_probation_reviews (review_status, company_id);

CREATE INDEX IF NOT EXISTS idx_confirmation_decisions_company
  ON public.recruitment_confirmation_decisions (company_id, decision_date DESC);

CREATE INDEX IF NOT EXISTS idx_confirmation_decisions_employee
  ON public.recruitment_confirmation_decisions (employee_id);

CREATE INDEX IF NOT EXISTS idx_probation_notifications_pending
  ON public.recruitment_probation_notifications (status, scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_probation_notifications_company
  ON public.recruitment_probation_notifications (company_id, scheduled_for DESC);

-- Enable RLS
ALTER TABLE public.recruitment_probation_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_confirmation_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_probation_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'recruitment_probation_reviews'
      AND policyname = 'recruitment_probation_reviews_all'
  ) THEN
    CREATE POLICY recruitment_probation_reviews_all ON public.recruitment_probation_reviews
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'recruitment_confirmation_decisions'
      AND policyname = 'recruitment_confirmation_decisions_all'
  ) THEN
    CREATE POLICY recruitment_confirmation_decisions_all ON public.recruitment_confirmation_decisions
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'recruitment_probation_notifications'
      AND policyname = 'recruitment_probation_notifications_all'
  ) THEN
    CREATE POLICY recruitment_probation_notifications_all ON public.recruitment_probation_notifications
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

NOTIFY pgrst, 'reload schema';
