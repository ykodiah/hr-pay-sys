-- Optional helper: ensure demo tenant exists in superadmin portal.
-- The app also auto-persists this via ensureDemoTenantPersisted() on GET /api/superadmin/tenants.
-- Safe to re-run.

-- Link an existing Akwaaba company if present; otherwise leave company_id null
-- (the API will provision an empty company on next load).

INSERT INTO public.superadmin_tenants (
  name,
  slug,
  description,
  plan,
  status,
  subscription_status,
  company_id,
  database_schema_name
)
SELECT
  'Akwaaba Demo Tenant',
  'akwaaba-demo',
  'Persisted demo tenant for platform testing. New customer tenants are created empty.',
  'enterprise',
  'active',
  'active',
  c.id,
  'schema_akwaaba_demo'
FROM (SELECT id FROM public.companies WHERE name ILIKE '%akwaaba%' OR email_address = 'admin@akwaabahrpay.com' LIMIT 1) c
WHERE NOT EXISTS (
  SELECT 1 FROM public.superadmin_tenants WHERE slug = 'akwaaba-demo'
);

-- If no matching company existed, still create the portal tenant shell
INSERT INTO public.superadmin_tenants (
  name,
  slug,
  description,
  plan,
  status,
  subscription_status,
  database_schema_name
)
SELECT
  'Akwaaba Demo Tenant',
  'akwaaba-demo',
  'Persisted demo tenant for platform testing. New customer tenants are created empty.',
  'enterprise',
  'active',
  'active',
  'schema_akwaaba_demo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.superadmin_tenants WHERE slug = 'akwaaba-demo'
);
