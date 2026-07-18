-- Repair and harden Settings > Multi-Company persistence.
-- Compatible with older subsidiaries schemas. Safe to re-run.

-- Older installs linked subsidiaries.company_id to company_settings(id).
-- Convert those values to the actual tenant companies(id) before replacing the FK.
DO $$
DECLARE
  constraint_name TEXT;
  referenced_table TEXT;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subsidiaries'
  ) THEN
    SELECT tc.constraint_name, ccu.table_name
    INTO constraint_name, referenced_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.constraint_schema = kcu.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.constraint_schema = tc.constraint_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'subsidiaries'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'company_id'
    LIMIT 1;

    IF referenced_table = 'company_settings' THEN
      UPDATE public.subsidiaries s
      SET company_id = cs.company_id
      FROM public.company_settings cs
      WHERE s.company_id = cs.id
        AND cs.company_id IS NOT NULL;

      EXECUTE format(
        'ALTER TABLE public.subsidiaries DROP CONSTRAINT IF EXISTS %I',
        constraint_name
      );
    END IF;
  END IF;
END $$;

ALTER TABLE IF EXISTS public.subsidiaries
  ADD COLUMN IF NOT EXISTS company_id UUID,
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ssnit_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS industry VARCHAR(150),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS email_address VARCHAR(255),
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS divisions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS departments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS locations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS settings_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS employee_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill aliases from older table shapes.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subsidiaries' AND column_name = 'phone'
  ) THEN
    UPDATE public.subsidiaries
    SET phone_number = phone
    WHERE (phone_number IS NULL OR phone_number = '') AND phone IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subsidiaries' AND column_name = 'email'
  ) THEN
    UPDATE public.subsidiaries
    SET email_address = email
    WHERE (email_address IS NULL OR email_address = '') AND email IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subsidiaries' AND column_name = 'logo'
  ) THEN
    UPDATE public.subsidiaries
    SET logo_url = logo
    WHERE (logo_url IS NULL OR logo_url = '') AND logo IS NOT NULL;
  END IF;
END $$;

-- Add the correct tenant FK when there is not already a companies FK.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.constraint_schema = kcu.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.constraint_schema = tc.constraint_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'subsidiaries'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'company_id'
      AND ccu.table_name = 'companies'
  ) THEN
    ALTER TABLE public.subsidiaries
      ADD CONSTRAINT subsidiaries_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES public.companies(id)
      ON DELETE CASCADE NOT VALID;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_subsidiaries_company
  ON public.subsidiaries(company_id);
