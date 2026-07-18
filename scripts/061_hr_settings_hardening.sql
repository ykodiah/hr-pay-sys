-- Harden HR settings tables used by Settings > HR
-- Safe to re-run.

ALTER TABLE IF EXISTS public.hr_documents
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS file_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS public.leave_policies
  ADD COLUMN IF NOT EXISTS usage_rate VARCHAR(20) DEFAULT '0%',
  ADD COLUMN IF NOT EXISTS trend VARCHAR(20) DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Unique policy name per company (needed for upsert / rename safety)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leave_policies_company_id_name_key'
  ) THEN
    ALTER TABLE public.leave_policies
      ADD CONSTRAINT leave_policies_company_id_name_key UNIQUE (company_id, name);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

ALTER TABLE IF EXISTS public.salary_grades
  ADD COLUMN IF NOT EXISTS notches JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS public.unstructured_salary_grades
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_leave_policies_company_active
  ON public.leave_policies(company_id, is_active);

CREATE INDEX IF NOT EXISTS idx_hr_documents_company
  ON public.hr_documents(company_id);

CREATE INDEX IF NOT EXISTS idx_salary_grades_company
  ON public.salary_grades(company_id);
