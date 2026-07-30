-- Migration 084: Add Ghana Reports module
-- Purpose: Enable Ghana Payroll Reports as a system module

-- Ensure Ghana Reports module exists in superadmin_modules
INSERT INTO public.superadmin_modules (name, description, monthly_cost, is_active, code, href, section, slug)
VALUES (
  'Ghana Reports',
  'Generate statutory and operational payroll reports for submission',
  25,
  true,
  'payroll_reports',
  '/app/payroll/reports',
  'Payroll',
  'payroll-reports'
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  monthly_cost = EXCLUDED.monthly_cost,
  href = EXCLUDED.href,
  section = EXCLUDED.section,
  slug = EXCLUDED.slug;

-- Enable the module for the default tenant (demo setup)
INSERT INTO public.superadmin_tenant_modules (tenant_id, module_id, status, enabled_at)
SELECT 
  t.id,
  m.id,
  'enabled',
  NOW()
FROM public.superadmin_modules m
CROSS JOIN (
  -- Get all tenants or use a known default tenant ID
  SELECT id FROM public.superadmin_tenants LIMIT 10
) t
WHERE m.code = 'payroll_reports'
ON CONFLICT (tenant_id, module_id) DO UPDATE SET
  status = EXCLUDED.status,
  enabled_at = EXCLUDED.enabled_at;
