-- =============================================================================
-- 079: Fix payroll_runs actor FKs + approval readiness
-- Fixes: payroll_runs_approved_by_fkey when approved_by is auth.users id
-- Safe / idempotent.
-- =============================================================================

-- Drop legacy FKs that incorrectly point actor columns at employees(id).
-- App stores auth user ids (and optionally employee ids) on these columns.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'payroll_runs'
      AND c.contype = 'f'
      AND (
        c.conname ILIKE '%approved_by%'
        OR c.conname ILIKE '%created_by%'
        OR c.conname ILIKE '%rejected_by%'
        OR c.conname ILIKE '%hr_reviewed_by%'
        OR c.conname ILIKE '%finance_reviewed_by%'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.payroll_runs DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS rejected_by UUID;
ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS approval_stage TEXT;
ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS hr_reviewed_by UUID;
ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS hr_reviewed_at TIMESTAMPTZ;
ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS finance_reviewed_by UUID;
ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS finance_reviewed_at TIMESTAMPTZ;
ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;
ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS history_locked BOOLEAN DEFAULT false;
ALTER TABLE public.payroll_runs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Allow modern approval statuses if a restrictive CHECK still exists
DO $$
DECLARE
  r record;
BEGIN
  -- Drop status checks that reject 'pending' / 'partial' / 'completed'
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'payroll_runs'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.payroll_runs DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'status check cleanup: %', SQLERRM;
END $$;
