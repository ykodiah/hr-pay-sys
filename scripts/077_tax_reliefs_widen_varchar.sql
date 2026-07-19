-- =============================================================================
-- 077: Widen legacy VARCHAR(20) tax_reliefs text columns
-- Safe / idempotent. Fixes "value too long for type character varying(20)".
-- =============================================================================

DO $$
DECLARE
  col text;
BEGIN
  FOREACH col IN ARRAY ARRAY[
    'name',
    'relief_name',
    'description',
    'relief_code',
    'gra_code',
    'code',
    'category',
    'currency'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tax_reliefs'
        AND column_name = col
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.tax_reliefs ALTER COLUMN %I TYPE TEXT USING %I::text',
        col,
        col
      );
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS relief_name TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS relief_code TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS gra_code TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS code TEXT;
