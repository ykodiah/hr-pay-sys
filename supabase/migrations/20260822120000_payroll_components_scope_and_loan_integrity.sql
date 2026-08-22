-- Expand pay-component assignment scopes and reinforce loan/payroll integrity.
-- Safe / idempotent for existing tenants.

ALTER TABLE public.payroll_component_assignments
  ADD COLUMN IF NOT EXISTS source_scope_values TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.payroll_component_assignments.source_scope_type IS
  'Assignment audience: individual | all_employees | job_title | department | location | division | subsidiary | csv';

COMMENT ON COLUMN public.payroll_component_assignments.source_scope_value IS
  'Pipe-delimited selected scope values for multi-select audiences (legacy single value still supported)';

COMMENT ON COLUMN public.payroll_component_assignments.source_scope_values IS
  'Selected multi-select audience values (job titles, departments, locations, divisions, subsidiaries)';

CREATE INDEX IF NOT EXISTS idx_payroll_component_assignments_scope_type
  ON public.payroll_component_assignments(company_id, source_scope_type, status);

CREATE INDEX IF NOT EXISTS idx_employee_loans_company_status_autodeduct
  ON public.employee_loans(company_id, status, auto_deduct)
  WHERE status IN ('active', 'approved');

-- Ensure employees.position remains available for job-title assignments
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Keep job_title aligned with position when only one is populated
UPDATE public.employees
SET job_title = position
WHERE (job_title IS NULL OR btrim(job_title) = '')
  AND position IS NOT NULL
  AND btrim(position) <> '';

UPDATE public.employees
SET position = job_title
WHERE (position IS NULL OR btrim(position) = '')
  AND job_title IS NOT NULL
  AND btrim(job_title) <> '';
