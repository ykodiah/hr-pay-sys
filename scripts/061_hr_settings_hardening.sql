-- Harden HR settings tables used by Settings > HR
-- Compatible with older leave_policies schema from 014 (policy_name / max_days)
-- and newer schema from 059 (name / days). Safe to re-run.

-- ----------------------------------------------------------------------------
-- hr_documents
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.hr_documents
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS file_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ----------------------------------------------------------------------------
-- leave_policies: normalize columns across schema variants
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leave_policies'
  ) THEN
    CREATE TABLE public.leave_policies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      days INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      carry_over BOOLEAN DEFAULT false,
      usage_rate VARCHAR(20) DEFAULT '0%',
      trend VARCHAR(20) DEFAULT 'new',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (company_id, name)
    );
    RETURN;
  END IF;

  -- Newer Settings UI columns
  ALTER TABLE public.leave_policies ADD COLUMN IF NOT EXISTS name VARCHAR(150);
  ALTER TABLE public.leave_policies ADD COLUMN IF NOT EXISTS days INTEGER DEFAULT 0;
  ALTER TABLE public.leave_policies ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE public.leave_policies ADD COLUMN IF NOT EXISTS carry_over BOOLEAN DEFAULT false;
  ALTER TABLE public.leave_policies ADD COLUMN IF NOT EXISTS usage_rate VARCHAR(20) DEFAULT '0%';
  ALTER TABLE public.leave_policies ADD COLUMN IF NOT EXISTS trend VARCHAR(20) DEFAULT 'new';
  ALTER TABLE public.leave_policies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  ALTER TABLE public.leave_policies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

  -- Older 014 columns (keep for compatibility / NOT NULL constraints)
  ALTER TABLE public.leave_policies ADD COLUMN IF NOT EXISTS policy_name VARCHAR(100);
  ALTER TABLE public.leave_policies ADD COLUMN IF NOT EXISTS policy_type VARCHAR(50);
  ALTER TABLE public.leave_policies ADD COLUMN IF NOT EXISTS max_days INTEGER;

  -- Backfill name <-> policy_name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leave_policies' AND column_name = 'policy_name'
  ) THEN
    UPDATE public.leave_policies
    SET name = policy_name
    WHERE (name IS NULL OR btrim(name) = '') AND policy_name IS NOT NULL;

    UPDATE public.leave_policies
    SET policy_name = name
    WHERE (policy_name IS NULL OR btrim(policy_name) = '') AND name IS NOT NULL;
  END IF;

  -- Backfill days <-> max_days
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leave_policies' AND column_name = 'max_days'
  ) THEN
    UPDATE public.leave_policies
    SET days = max_days
    WHERE days IS NULL AND max_days IS NOT NULL;

    UPDATE public.leave_policies
    SET max_days = days
    WHERE max_days IS NULL AND days IS NOT NULL;
  END IF;

  -- Default policy_type when required by older schema
  UPDATE public.leave_policies
  SET policy_type = COALESCE(NULLIF(btrim(policy_type), ''), 'annual')
  WHERE policy_type IS NULL OR btrim(policy_type) = '';

  -- Ensure remaining nulls do not block NOT NULL / unique indexes
  UPDATE public.leave_policies
  SET name = COALESCE(NULLIF(btrim(name), ''), 'Leave Policy ' || LEFT(id::text, 8))
  WHERE name IS NULL OR btrim(name) = '';

  UPDATE public.leave_policies
  SET days = COALESCE(days, 0)
  WHERE days IS NULL;

  -- Unique (company_id, name) only after name exists and is populated
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leave_policies_company_id_name_key'
  ) THEN
    BEGIN
      ALTER TABLE public.leave_policies
        ADD CONSTRAINT leave_policies_company_id_name_key UNIQUE (company_id, name);
    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE 'leave_policies: skipped unique(company_id, name) due to duplicate rows';
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- salary grades
-- ----------------------------------------------------------------------------
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
