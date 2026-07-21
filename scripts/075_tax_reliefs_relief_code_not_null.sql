-- =============================================================================
-- 075: Ensure tax_reliefs.relief_code is always populated
-- Safe / idempotent. Fixes NOT NULL failures when syncing GRA catalog rows.
-- =============================================================================

ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS relief_code TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS gra_code TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS code TEXT;

-- Backfill from any available code column / name
UPDATE public.tax_reliefs
SET relief_code = COALESCE(
  NULLIF(BTRIM(relief_code), ''),
  NULLIF(BTRIM(gra_code), ''),
  NULLIF(BTRIM(code), ''),
  LEFT(REGEXP_REPLACE(UPPER(COALESCE(NULLIF(BTRIM(name), ''), 'RELIEF')), '[^A-Z0-9]+', '-', 'g'), 40)
    || '-' || SUBSTRING(REPLACE(id::text, '-', ''), 1, 6)
)
WHERE relief_code IS NULL OR BTRIM(relief_code) = '';

UPDATE public.tax_reliefs
SET gra_code = COALESCE(NULLIF(BTRIM(gra_code), ''), NULLIF(BTRIM(relief_code), ''), NULLIF(BTRIM(code), ''))
WHERE gra_code IS NULL OR BTRIM(gra_code) = '';

UPDATE public.tax_reliefs
SET code = COALESCE(NULLIF(BTRIM(code), ''), NULLIF(BTRIM(relief_code), ''), NULLIF(BTRIM(gra_code), ''))
WHERE code IS NULL OR BTRIM(code) = '';

-- Prefer DEFAULT over hard NOT NULL if legacy rows still empty (shouldn't after backfill)
ALTER TABLE public.tax_reliefs ALTER COLUMN relief_code SET DEFAULT 'CUSTOM';

DO $$
BEGIN
  -- Only enforce NOT NULL when every row has a value
  IF NOT EXISTS (
    SELECT 1 FROM public.tax_reliefs WHERE relief_code IS NULL OR BTRIM(relief_code) = ''
  ) THEN
    BEGIN
      ALTER TABLE public.tax_reliefs ALTER COLUMN relief_code SET NOT NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not set relief_code NOT NULL: %', SQLERRM;
    END;
  END IF;
END $$;
