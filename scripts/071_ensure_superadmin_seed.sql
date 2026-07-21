-- Ensure superadmin portal seed user exists with password Demo@12345
-- Email: admin@akwaabahrpay.com
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.superadmin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- bcrypt hash for Demo@12345 (cost 12)
INSERT INTO public.superadmin_users (email, password_hash, first_name, last_name, role, status)
VALUES (
  'admin@akwaabahrpay.com',
  '$2b$12$vaN3lAjBABcJuAnOtAOLYO4gjeZ.4E76tztPVVAYLpz2Y3bnbmsJ2',
  'System',
  'Admin',
  'admin',
  'active'
)
ON CONFLICT (email) DO UPDATE
SET
  password_hash = EXCLUDED.password_hash,
  status = 'active',
  updated_at = now();
