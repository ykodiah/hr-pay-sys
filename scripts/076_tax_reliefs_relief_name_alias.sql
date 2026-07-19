-- =============================================================================
-- 076: Ensure tax_reliefs has relief_name (legacy NOT NULL) + name aliases
-- Safe / idempotent.
-- =============================================================================

ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS relief_name TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS relief_code TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS gra_code TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS code TEXT;

-- Backfill relief_name from name / description
UPDATE public.tax_reliefs
SET relief_name = COALESCE(
  NULLIF(BTRIM(relief_name), ''),
  NULLIF(BTRIM(name), ''),
  NULLIF(BTRIM(description), ''),
  NULLIF(BTRIM(relief_code), ''),
  'Tax relief'
)
WHERE relief_name IS NULL OR BTRIM(relief_name) = '';

-- Backfill name from relief_name
UPDATE public.tax_reliefs
SET name = COALESCE(
  NULLIF(BTRIM(name), ''),
  NULLIF(BTRIM(relief_name), ''),
  'Tax relief'
)
WHERE name IS NULL OR BTRIM(name) = '';

ALTER TABLE public.tax_reliefs ALTER COLUMN relief_name SET DEFAULT 'Tax relief';
ALTER TABLE public.tax_reliefs ALTER COLUMN name SET DEFAULT 'Tax relief';
