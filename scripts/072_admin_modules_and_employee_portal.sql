-- Align superadmin modules with admin portal + employee portal support tables.
-- Safe to re-run.

-- 1) Extend superadmin_modules with portal alignment columns
ALTER TABLE public.superadmin_modules ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.superadmin_modules ADD COLUMN IF NOT EXISTS href TEXT;
ALTER TABLE public.superadmin_modules ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE public.superadmin_modules ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_superadmin_modules_code
  ON public.superadmin_modules(code)
  WHERE code IS NOT NULL;

-- 2) Upsert canonical admin portal modules (code is stable key)
INSERT INTO public.superadmin_modules (name, description, monthly_cost, is_active, code, href, section, slug)
VALUES
  ('Dashboard', 'Overview and key metrics', 0, true, 'dashboard', '/app', 'Overview', 'dashboard'),
  ('Employees', 'Manage employee records', 50, true, 'employees', '/app/employees', 'HR Management', 'employees'),
  ('Recruitment', 'Hire new talent', 40, true, 'recruitment', '/app/recruitment', 'HR Management', 'recruitment'),
  ('Org Chart', 'Organizational structure', 20, true, 'org_chart', '/app/org-chart', 'HR Management', 'org-chart'),
  ('Documents', 'Document vault', 25, true, 'documents', '/app/documents', 'HR Management', 'documents'),
  ('Communication', 'Team communication', 30, true, 'communication', '/app/communication', 'HR Management', 'communication'),
  ('Comm. Settings', 'Channels, templates & credentials', 10, true, 'communication_settings', '/app/communication/settings', 'HR Management', 'communication-settings'),
  ('Meetings', 'Secure meetings workspace', 20, true, 'meetings', '/app/meetings', 'HR Management', 'meetings'),
  ('Attendance', 'Track work hours', 35, true, 'attendance', '/app/attendance', 'Time & Attendance', 'attendance'),
  ('Attendance Alerts', 'Alerts & attendance rules', 15, true, 'attendance_alerts', '/attendance/alerts', 'Time & Attendance', 'attendance-alerts'),
  ('Leave Management', 'Manage leave requests', 30, true, 'leave', '/app/leave', 'Time & Attendance', 'leave'),
  ('Overtime', 'Overtime requests', 20, true, 'overtime', '/app/overtime', 'Time & Attendance', 'overtime'),
  ('Performance', 'Performance reviews', 35, true, 'performance', '/app/performance', 'Performance', 'performance'),
  ('Promotions', 'Career advancement', 15, true, 'promotions', '/app/promotions', 'Performance', 'promotions'),
  ('Learning', 'Training & development', 25, true, 'learning', '/app/learning', 'Performance', 'learning'),
  ('Pay Inputs', 'Period emoluments & adjustments', 20, true, 'payroll_input', '/app/payroll/input', 'Payroll', 'payroll-input'),
  ('Process Payroll', 'Run statutory payroll', 60, true, 'payroll', '/app/payroll', 'Payroll', 'payroll'),
  ('Tax Reliefs', 'Assign employee tax reliefs by year', 15, true, 'tax_reliefs', '/app/payroll/tax-reliefs', 'Payroll', 'tax-reliefs'),
  ('Payslips', 'Generate & download payslips', 15, true, 'payslips', '/app/payroll/payslips', 'Payroll', 'payslips'),
  ('Payroll History', 'Past payroll records', 10, true, 'payroll_history', '/app/payroll/history', 'Payroll', 'payroll-history'),
  ('Approvals', 'Approve payroll, leave & overtime', 15, true, 'approvals', '/app/approvals', 'Payroll', 'approvals'),
  ('Loans', 'Employee loans', 20, true, 'loans', '/app/loans', 'Payroll', 'loans'),
  ('Analytics', 'Reports & insights', 40, true, 'analytics', '/app/analytics', 'Analytics', 'analytics'),
  ('Compliance Reports', 'PAYE, SSNIT & statutory reports', 30, true, 'compliance_reports', '/app/reports', 'Analytics', 'compliance-reports'),
  ('ML Analytics', 'AI-powered HR analytics', 45, true, 'ml_analytics', '/app/ml-analytics', 'Analytics', 'ml-analytics'),
  ('My Portal', 'Personalised employee workspace', 10, true, 'self_service', '/app/self-service', 'Employee Hub', 'self-service'),
  ('Update My Details', 'Submit change requests', 5, true, 'update_details', '/app/self-service/update-details', 'Employee Hub', 'update-details'),
  ('Change Requests', 'Review employee change requests', 10, true, 'change_requests', '/app/hr/change-requests', 'Employee Hub', 'change-requests'),
  ('Disciplinary', 'Disciplinary actions', 15, true, 'disciplinary', '/app/disciplinary', 'Administration', 'disciplinary'),
  ('Offboarding', 'Employee exit process', 15, true, 'offboarding', '/app/offboarding', 'Administration', 'offboarding'),
  ('Integrations', 'Third-party integrations', 25, true, 'integrations', '/app/integrations', 'Administration', 'integrations'),
  ('Settings', 'System settings', 0, true, 'settings', '/app/settings', 'Administration', 'settings')
ON CONFLICT DO NOTHING;

-- Prefer upsert by code when unique index exists
UPDATE public.superadmin_modules m
SET
  name = v.name,
  description = v.description,
  monthly_cost = v.monthly_cost,
  is_active = true,
  href = v.href,
  section = v.section,
  slug = v.slug
FROM (
  VALUES
    ('dashboard', 'Dashboard', 'Overview and key metrics', 0, '/app', 'Overview', 'dashboard'),
    ('employees', 'Employees', 'Manage employee records', 50, '/app/employees', 'HR Management', 'employees'),
    ('recruitment', 'Recruitment', 'Hire new talent', 40, '/app/recruitment', 'HR Management', 'recruitment'),
    ('org_chart', 'Org Chart', 'Organizational structure', 20, '/app/org-chart', 'HR Management', 'org-chart'),
    ('documents', 'Documents', 'Document vault', 25, '/app/documents', 'HR Management', 'documents'),
    ('communication', 'Communication', 'Team communication', 30, '/app/communication', 'HR Management', 'communication'),
    ('communication_settings', 'Comm. Settings', 'Channels, templates & credentials', 10, '/app/communication/settings', 'HR Management', 'communication-settings'),
    ('meetings', 'Meetings', 'Secure meetings workspace', 20, '/app/meetings', 'HR Management', 'meetings'),
    ('attendance', 'Attendance', 'Track work hours', 35, '/app/attendance', 'Time & Attendance', 'attendance'),
    ('attendance_alerts', 'Attendance Alerts', 'Alerts & attendance rules', 15, '/attendance/alerts', 'Time & Attendance', 'attendance-alerts'),
    ('leave', 'Leave Management', 'Manage leave requests', 30, '/app/leave', 'Time & Attendance', 'leave'),
    ('overtime', 'Overtime', 'Overtime requests', 20, '/app/overtime', 'Time & Attendance', 'overtime'),
    ('performance', 'Performance', 'Performance reviews', 35, '/app/performance', 'Performance', 'performance'),
    ('promotions', 'Promotions', 'Career advancement', 15, '/app/promotions', 'Performance', 'promotions'),
    ('learning', 'Learning', 'Training & development', 25, '/app/learning', 'Performance', 'learning'),
    ('payroll_input', 'Pay Inputs', 'Period emoluments & adjustments', 20, '/app/payroll/input', 'Payroll', 'payroll-input'),
    ('payroll', 'Process Payroll', 'Run statutory payroll', 60, '/app/payroll', 'Payroll', 'payroll'),
    ('tax_reliefs', 'Tax Reliefs', 'Assign employee tax reliefs by year', 15, '/app/payroll/tax-reliefs', 'Payroll', 'tax-reliefs'),
    ('payslips', 'Payslips', 'Generate & download payslips', 15, '/app/payroll/payslips', 'Payroll', 'payslips'),
    ('payroll_history', 'Payroll History', 'Past payroll records', 10, '/app/payroll/history', 'Payroll', 'payroll-history'),
    ('approvals', 'Approvals', 'Approve payroll, leave & overtime', 15, '/app/approvals', 'Payroll', 'approvals'),
    ('loans', 'Loans', 'Employee loans', 20, '/app/loans', 'Payroll', 'loans'),
    ('analytics', 'Analytics', 'Reports & insights', 40, '/app/analytics', 'Analytics', 'analytics'),
    ('compliance_reports', 'Compliance Reports', 'PAYE, SSNIT & statutory reports', 30, '/app/reports', 'Analytics', 'compliance-reports'),
    ('ml_analytics', 'ML Analytics', 'AI-powered HR analytics', 45, '/app/ml-analytics', 'Analytics', 'ml-analytics'),
    ('self_service', 'My Portal', 'Personalised employee workspace', 10, '/app/self-service', 'Employee Hub', 'self-service'),
    ('update_details', 'Update My Details', 'Submit change requests', 5, '/app/self-service/update-details', 'Employee Hub', 'update-details'),
    ('change_requests', 'Change Requests', 'Review employee change requests', 10, '/app/hr/change-requests', 'Employee Hub', 'change-requests'),
    ('disciplinary', 'Disciplinary', 'Disciplinary actions', 15, '/app/disciplinary', 'Administration', 'disciplinary'),
    ('offboarding', 'Offboarding', 'Employee exit process', 15, '/app/offboarding', 'Administration', 'offboarding'),
    ('integrations', 'Integrations', 'Third-party integrations', 25, '/app/integrations', 'Administration', 'integrations'),
    ('settings', 'Settings', 'System settings', 0, '/app/settings', 'Administration', 'settings')
) AS v(code, name, description, monthly_cost, href, section, slug)
WHERE m.code = v.code;

-- Insert any missing by code
INSERT INTO public.superadmin_modules (name, description, monthly_cost, is_active, code, href, section, slug)
SELECT v.name, v.description, v.monthly_cost, true, v.code, v.href, v.section, v.slug
FROM (
  VALUES
    ('dashboard', 'Dashboard', 'Overview and key metrics', 0, '/app', 'Overview', 'dashboard'),
    ('employees', 'Employees', 'Manage employee records', 50, '/app/employees', 'HR Management', 'employees'),
    ('recruitment', 'Recruitment', 'Hire new talent', 40, '/app/recruitment', 'HR Management', 'recruitment'),
    ('org_chart', 'Org Chart', 'Organizational structure', 20, '/app/org-chart', 'HR Management', 'org-chart'),
    ('documents', 'Documents', 'Document vault', 25, '/app/documents', 'HR Management', 'documents'),
    ('communication', 'Communication', 'Team communication', 30, '/app/communication', 'HR Management', 'communication'),
    ('communication_settings', 'Comm. Settings', 'Channels, templates & credentials', 10, '/app/communication/settings', 'HR Management', 'communication-settings'),
    ('meetings', 'Meetings', 'Secure meetings workspace', 20, '/app/meetings', 'HR Management', 'meetings'),
    ('attendance', 'Attendance', 'Track work hours', 35, '/app/attendance', 'Time & Attendance', 'attendance'),
    ('attendance_alerts', 'Attendance Alerts', 'Alerts & attendance rules', 15, '/attendance/alerts', 'Time & Attendance', 'attendance-alerts'),
    ('leave', 'Leave Management', 'Manage leave requests', 30, '/app/leave', 'Time & Attendance', 'leave'),
    ('overtime', 'Overtime', 'Overtime requests', 20, '/app/overtime', 'Time & Attendance', 'overtime'),
    ('performance', 'Performance', 'Performance reviews', 35, '/app/performance', 'Performance', 'performance'),
    ('promotions', 'Promotions', 'Career advancement', 15, '/app/promotions', 'Performance', 'promotions'),
    ('learning', 'Learning', 'Training & development', 25, '/app/learning', 'Performance', 'learning'),
    ('payroll_input', 'Pay Inputs', 'Period emoluments & adjustments', 20, '/app/payroll/input', 'Payroll', 'payroll-input'),
    ('payroll', 'Process Payroll', 'Run statutory payroll', 60, '/app/payroll', 'Payroll', 'payroll'),
    ('tax_reliefs', 'Tax Reliefs', 'Assign employee tax reliefs by year', 15, '/app/payroll/tax-reliefs', 'Payroll', 'tax-reliefs'),
    ('payslips', 'Payslips', 'Generate & download payslips', 15, '/app/payroll/payslips', 'Payroll', 'payslips'),
    ('payroll_history', 'Payroll History', 'Past payroll records', 10, '/app/payroll/history', 'Payroll', 'payroll-history'),
    ('approvals', 'Approvals', 'Approve payroll, leave & overtime', 15, '/app/approvals', 'Payroll', 'approvals'),
    ('loans', 'Loans', 'Employee loans', 20, '/app/loans', 'Payroll', 'loans'),
    ('analytics', 'Analytics', 'Reports & insights', 40, '/app/analytics', 'Analytics', 'analytics'),
    ('compliance_reports', 'Compliance Reports', 'PAYE, SSNIT & statutory reports', 30, '/app/reports', 'Analytics', 'compliance-reports'),
    ('ml_analytics', 'ML Analytics', 'AI-powered HR analytics', 45, '/app/ml-analytics', 'Analytics', 'ml-analytics'),
    ('self_service', 'My Portal', 'Personalised employee workspace', 10, '/app/self-service', 'Employee Hub', 'self-service'),
    ('update_details', 'Update My Details', 'Submit change requests', 5, '/app/self-service/update-details', 'Employee Hub', 'update-details'),
    ('change_requests', 'Change Requests', 'Review employee change requests', 10, '/app/hr/change-requests', 'Employee Hub', 'change-requests'),
    ('disciplinary', 'Disciplinary', 'Disciplinary actions', 15, '/app/disciplinary', 'Administration', 'disciplinary'),
    ('offboarding', 'Offboarding', 'Employee exit process', 15, '/app/offboarding', 'Administration', 'offboarding'),
    ('integrations', 'Integrations', 'Third-party integrations', 25, '/app/integrations', 'Administration', 'integrations'),
    ('settings', 'Settings', 'System settings', 0, '/app/settings', 'Administration', 'settings')
) AS v(code, name, description, monthly_cost, href, section, slug)
WHERE NOT EXISTS (
  SELECT 1 FROM public.superadmin_modules m WHERE m.code = v.code
);

-- 3) Employee portal profile extensions (optional columns)
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS special_role VARCHAR(50);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS inactive_reason TEXT;

CREATE TABLE IF NOT EXISTS public.employee_profiles (
  id UUID PRIMARY KEY, -- auth.users.id
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_self_service_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ess_goals_employee ON public.employee_self_service_goals(employee_id);
CREATE INDEX IF NOT EXISTS idx_ess_goals_company ON public.employee_self_service_goals(company_id);

-- Ensure every active tenant gets newly synced modules enabled
INSERT INTO public.superadmin_tenant_modules (tenant_id, module_id, status, enabled_at)
SELECT t.id, m.id, 'enabled', now()
FROM public.superadmin_tenants t
CROSS JOIN public.superadmin_modules m
WHERE t.status = 'active'
  AND m.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.superadmin_tenant_modules tm
    WHERE tm.tenant_id = t.id AND tm.module_id = m.id
  );
