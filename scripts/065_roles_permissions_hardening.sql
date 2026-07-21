-- Harden roles & permissions for Settings > Roles.
-- Stores module-level permissions as a JSONB array of `module:action` strings,
-- e.g. ["employees:view", "employees:edit", "payroll:all"].
-- Safe to re-run.

-- ----------------------------------------------------------------------------
-- roles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  code VARCHAR(50),
  level INTEGER DEFAULT 1,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_system_role BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.roles
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_system_role BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Coerce permissions to JSONB array if an older text[]/text column exists.
DO $$
DECLARE
  perm_type TEXT;
BEGIN
  SELECT data_type INTO perm_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'permissions';

  IF perm_type IS NOT NULL AND perm_type <> 'jsonb' THEN
    ALTER TABLE public.roles
      ALTER COLUMN permissions TYPE JSONB USING
        CASE
          WHEN permissions IS NULL THEN '[]'::jsonb
          WHEN perm_type = 'ARRAY' THEN to_jsonb(permissions)
          ELSE
            CASE
              WHEN btrim(permissions::text) = '' THEN '[]'::jsonb
              WHEN left(btrim(permissions::text), 1) = '[' THEN permissions::text::jsonb
              ELSE to_jsonb(string_to_array(permissions::text, ','))
            END
        END;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'roles.permissions type coercion skipped: %', SQLERRM;
END $$;

ALTER TABLE public.roles ALTER COLUMN permissions SET DEFAULT '[]'::jsonb;
UPDATE public.roles SET permissions = '[]'::jsonb WHERE permissions IS NULL;

-- Backfill role code from name when missing.
UPDATE public.roles
SET code = regexp_replace(lower(name), '[^a-z0-9]+', '_', 'g')
WHERE (code IS NULL OR btrim(code) = '') AND name IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_company_name ON public.roles (company_id, name);
CREATE INDEX IF NOT EXISTS idx_roles_company ON public.roles(company_id);
CREATE INDEX IF NOT EXISTS idx_roles_active ON public.roles(company_id, is_active);

-- ----------------------------------------------------------------------------
-- user_roles (assignment counts power the "Users" badge)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE (employee_id, role_id)
);

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS assigned_by UUID,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(role_id, is_active);

-- ----------------------------------------------------------------------------
-- Seed baseline roles for companies that have none yet.
-- ----------------------------------------------------------------------------
INSERT INTO public.roles (company_id, name, description, code, level, permissions, is_system_role, is_active)
SELECT
  c.id,
  seed.name,
  seed.description,
  seed.code,
  seed.level,
  seed.permissions::jsonb,
  true,
  true
FROM public.companies c
CROSS JOIN (
  VALUES
    (
      'Administrator',
      'Full access to all modules and settings',
      'administrator',
      100,
      '["dashboard:all","employees:all","payroll:all","leave:all","attendance:all","performance:all","documents:all","reports:all","multi_company:all","notifications:all","settings:all","roles:all"]'
    ),
    (
      'HR Manager',
      'Manage employees, leave, performance and documents',
      'hr_manager',
      60,
      '["dashboard:view","employees:all","leave:all","attendance:all","performance:all","documents:all","reports:view","reports:export"]'
    ),
    (
      'Payroll Officer',
      'Run payroll and manage compensation',
      'payroll_officer',
      50,
      '["dashboard:view","payroll:all","employees:view","reports:view","reports:export"]'
    ),
    (
      'Employee',
      'Self-service access to personal information',
      'employee',
      10,
      '["dashboard:view","leave:view","leave:create","documents:view"]'
    )
) AS seed(name, description, code, level, permissions)
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles r WHERE r.company_id = c.id
)
ON CONFLICT (company_id, name) DO NOTHING;
