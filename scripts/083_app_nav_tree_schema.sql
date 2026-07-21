-- =============================================================================
-- 083: Collapsible app navigation tree schema
-- Stores numbered module headings + nested nav nodes for the left sidebar.
-- Safe / idempotent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.app_nav_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  number INT NOT NULL,
  title TEXT NOT NULL,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  gates JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_nav_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.app_nav_modules(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.app_nav_nodes(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  href TEXT,
  node_type TEXT NOT NULL DEFAULT 'link'
    CHECK (node_type IN ('folder', 'link')),
  gate_code TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module_id, code)
);

CREATE TABLE IF NOT EXISTS public.app_nav_user_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  user_id UUID,
  expanded_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  collapsed_sidebar BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_app_nav_nodes_module ON public.app_nav_nodes(module_id, parent_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_app_nav_nodes_parent ON public.app_nav_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_app_nav_modules_sort ON public.app_nav_modules(sort_order, number);

ALTER TABLE public.app_nav_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_nav_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_nav_user_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_nav_modules_all ON public.app_nav_modules;
CREATE POLICY app_nav_modules_all ON public.app_nav_modules FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS app_nav_nodes_all ON public.app_nav_nodes;
CREATE POLICY app_nav_nodes_all ON public.app_nav_nodes FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS app_nav_user_state_all ON public.app_nav_user_state;
CREATE POLICY app_nav_user_state_all ON public.app_nav_user_state FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.app_nav_modules TO authenticated, anon;
GRANT ALL ON public.app_nav_nodes TO authenticated, anon;
GRANT ALL ON public.app_nav_user_state TO authenticated, anon;

-- Seed modules (phase 1)
INSERT INTO public.app_nav_modules (code, number, title, sort_order, gates)
VALUES
  ('hr_management', 1, 'HR Management', 1, '["employees","recruitment","org_chart","documents"]'::jsonb),
  ('communications', 2, 'Communications', 2, '["communication","communication_settings","meetings"]'::jsonb),
  ('time_attendance', 3, 'Time & Attendance', 3, '["attendance","attendance_alerts","leave","overtime"]'::jsonb),
  ('performance_module', 4, 'Performance Module', 4, '["performance","promotions","learning"]'::jsonb)
ON CONFLICT (code) DO UPDATE SET
  number = EXCLUDED.number,
  title = EXCLUDED.title,
  sort_order = EXCLUDED.sort_order,
  gates = EXCLUDED.gates,
  updated_at = now();

-- Helper to upsert a node
CREATE OR REPLACE FUNCTION public.upsert_nav_node(
  p_module_code TEXT,
  p_parent_code TEXT,
  p_code TEXT,
  p_label TEXT,
  p_href TEXT,
  p_node_type TEXT,
  p_gate TEXT,
  p_sort INT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_module_id UUID;
  v_parent_id UUID;
BEGIN
  SELECT id INTO v_module_id FROM public.app_nav_modules WHERE code = p_module_code;
  IF v_module_id IS NULL THEN
    RAISE EXCEPTION 'Unknown module %', p_module_code;
  END IF;

  v_parent_id := NULL;
  IF p_parent_code IS NOT NULL AND length(trim(p_parent_code)) > 0 THEN
    SELECT id INTO v_parent_id
    FROM public.app_nav_nodes
    WHERE module_id = v_module_id AND code = p_parent_code;
  END IF;

  INSERT INTO public.app_nav_nodes (
    module_id, parent_id, code, label, href, node_type, gate_code, sort_order
  ) VALUES (
    v_module_id, v_parent_id, p_code, p_label, p_href, p_node_type, p_gate, p_sort
  )
  ON CONFLICT (module_id, code) DO UPDATE SET
    parent_id = EXCLUDED.parent_id,
    label = EXCLUDED.label,
    href = EXCLUDED.href,
    node_type = EXCLUDED.node_type,
    gate_code = EXCLUDED.gate_code,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();
END;
$$;

-- ── HR Management ───────────────────────────────────────────────────────────
SELECT public.upsert_nav_node('hr_management', NULL, 'employees', 'Employees', NULL, 'folder', 'employees', 1);
SELECT public.upsert_nav_node('hr_management', 'employees', 'employees_add', 'Add Employees', '/app/employees?action=add', 'link', 'employees', 1);
SELECT public.upsert_nav_node('hr_management', 'employees', 'employees_view', 'View Employees', '/app/employees', 'link', 'employees', 2);

SELECT public.upsert_nav_node('hr_management', NULL, 'recruitment', 'Recruitment', NULL, 'folder', 'recruitment', 2);
SELECT public.upsert_nav_node('hr_management', 'recruitment', 'recruitment_overview', 'Overview', '/app/recruitment?tab=overview', 'link', 'recruitment', 1);
SELECT public.upsert_nav_node('hr_management', 'recruitment', 'recruitment_requisitions', 'Requisitions', NULL, 'folder', 'recruitment', 2);
SELECT public.upsert_nav_node('hr_management', 'recruitment_requisitions', 'recruitment_req_add', 'Add Requisition', '/app/recruitment?tab=requisitions&action=add', 'link', 'recruitment', 1);
SELECT public.upsert_nav_node('hr_management', 'recruitment_requisitions', 'recruitment_req_view', 'View Requisition', '/app/recruitment?tab=requisitions', 'link', 'recruitment', 2);
SELECT public.upsert_nav_node('hr_management', 'recruitment', 'recruitment_jobs', 'Jobs', NULL, 'folder', 'recruitment', 3);
SELECT public.upsert_nav_node('hr_management', 'recruitment_jobs', 'recruitment_jobs_add', 'Add Jobs', '/app/recruitment?tab=jobs&action=add', 'link', 'recruitment', 1);
SELECT public.upsert_nav_node('hr_management', 'recruitment_jobs', 'recruitment_jobs_view', 'View Jobs list', '/app/recruitment?tab=jobs', 'link', 'recruitment', 2);
SELECT public.upsert_nav_node('hr_management', 'recruitment', 'recruitment_applications', 'Applications', NULL, 'folder', 'recruitment', 4);
SELECT public.upsert_nav_node('hr_management', 'recruitment_applications', 'recruitment_apps_add', 'Add Applications', '/app/recruitment?tab=applications&action=add', 'link', 'recruitment', 1);
SELECT public.upsert_nav_node('hr_management', 'recruitment_applications', 'recruitment_apps_view', 'View Applications List', '/app/recruitment?tab=applications', 'link', 'recruitment', 2);
SELECT public.upsert_nav_node('hr_management', 'recruitment', 'recruitment_interviews', 'Interviews', NULL, 'folder', 'recruitment', 5);
SELECT public.upsert_nav_node('hr_management', 'recruitment_interviews', 'recruitment_int_add', 'Schedule Interview', '/app/recruitment?tab=interviews&action=add', 'link', 'recruitment', 1);
SELECT public.upsert_nav_node('hr_management', 'recruitment_interviews', 'recruitment_int_view', 'View Interview List', '/app/recruitment?tab=interviews', 'link', 'recruitment', 2);
SELECT public.upsert_nav_node('hr_management', 'recruitment', 'recruitment_offers', 'Offers', NULL, 'folder', 'recruitment', 6);
SELECT public.upsert_nav_node('hr_management', 'recruitment_offers', 'recruitment_offers_view', 'View Offer list', '/app/recruitment?tab=offers', 'link', 'recruitment', 1);
SELECT public.upsert_nav_node('hr_management', 'recruitment', 'recruitment_onboarding', 'Onboarding', NULL, 'folder', 'recruitment', 7);
SELECT public.upsert_nav_node('hr_management', 'recruitment_onboarding', 'recruitment_onb_view', 'View Onboarding', '/app/recruitment?tab=onboarding', 'link', 'recruitment', 1);
SELECT public.upsert_nav_node('hr_management', 'recruitment', 'recruitment_analytics', 'Analytics', NULL, 'folder', 'recruitment', 8);
SELECT public.upsert_nav_node('hr_management', 'recruitment_analytics', 'recruitment_analytics_view', 'View Analytics', '/app/recruitment?tab=analytics', 'link', 'recruitment', 1);

SELECT public.upsert_nav_node('hr_management', NULL, 'org_chart', 'Organizational Chart', NULL, 'folder', 'org_chart', 3);
SELECT public.upsert_nav_node('hr_management', 'org_chart', 'org_chart_create', 'Create Organizational Chart', '/app/org-chart?action=create', 'link', 'org_chart', 1);
SELECT public.upsert_nav_node('hr_management', 'org_chart', 'org_chart_view', 'View Org. Chart', '/app/org-chart', 'link', 'org_chart', 2);

SELECT public.upsert_nav_node('hr_management', NULL, 'documents', 'Document', '/app/documents', 'link', 'documents', 4);

-- ── Communications ───────────────────────────────────────────────────────────
SELECT public.upsert_nav_node('communications', NULL, 'communication', 'Communications', '/app/communication', 'link', 'communication', 1);
SELECT public.upsert_nav_node('communications', NULL, 'communication_settings', 'Comm. Settings', NULL, 'folder', 'communication_settings', 2);
SELECT public.upsert_nav_node('communications', 'communication_settings', 'comm_channels', 'Channels', '/app/communication/settings?tab=channels', 'link', 'communication_settings', 1);
SELECT public.upsert_nav_node('communications', 'communication_settings', 'comm_templates', 'Templates', '/app/communication/settings?tab=templates', 'link', 'communication_settings', 2);
SELECT public.upsert_nav_node('communications', 'communication_settings', 'comm_snippets', 'Snippets', '/app/communication/settings?tab=snippets', 'link', 'communication_settings', 3);
SELECT public.upsert_nav_node('communications', NULL, 'meetings', 'Meetings', '/app/meetings', 'link', 'meetings', 3);

-- ── Time & Attendance ────────────────────────────────────────────────────────
SELECT public.upsert_nav_node('time_attendance', NULL, 'attendance', 'Attendance', '/app/attendance', 'link', 'attendance', 1);
SELECT public.upsert_nav_node('time_attendance', NULL, 'attendance_alerts', 'Attendance Alerts', '/attendance/alerts', 'link', 'attendance_alerts', 2);
SELECT public.upsert_nav_node('time_attendance', NULL, 'leave', 'Leave Management', '/app/leave', 'link', 'leave', 3);
SELECT public.upsert_nav_node('time_attendance', NULL, 'overtime', 'Overtime', '/app/overtime', 'link', 'overtime', 4);

-- ── Performance Module ───────────────────────────────────────────────────────
SELECT public.upsert_nav_node('performance_module', NULL, 'performance', 'Performance', NULL, 'folder', 'performance', 1);
SELECT public.upsert_nav_node('performance_module', 'performance', 'perf_overview', 'Overview', '/app/performance?tab=overview', 'link', 'performance', 1);
SELECT public.upsert_nav_node('performance_module', 'performance', 'perf_goals', 'Goals & OKRs', NULL, 'folder', 'performance', 2);
SELECT public.upsert_nav_node('performance_module', 'perf_goals', 'perf_goals_add', 'Add New Goals', '/app/performance?tab=goals&action=add', 'link', 'performance', 1);
SELECT public.upsert_nav_node('performance_module', 'perf_goals', 'perf_goals_list', 'Goal List', '/app/performance?tab=goals', 'link', 'performance', 2);
SELECT public.upsert_nav_node('performance_module', 'performance', 'perf_reviews', 'Reviews', NULL, 'folder', 'performance', 3);
SELECT public.upsert_nav_node('performance_module', 'perf_reviews', 'perf_reviews_add', 'Add New Review', '/app/performance?tab=reviews&action=add', 'link', 'performance', 1);
SELECT public.upsert_nav_node('performance_module', 'perf_reviews', 'perf_reviews_list', 'Review List', '/app/performance?tab=reviews', 'link', 'performance', 2);
SELECT public.upsert_nav_node('performance_module', 'performance', 'perf_competencies', 'Competencies', NULL, 'folder', 'performance', 4);
SELECT public.upsert_nav_node('performance_module', 'perf_competencies', 'perf_comp_add', 'Add Competency', '/app/performance?tab=competencies&action=add', 'link', 'performance', 1);
SELECT public.upsert_nav_node('performance_module', 'perf_competencies', 'perf_comp_list', 'Competency List', '/app/performance?tab=competencies', 'link', 'performance', 2);
SELECT public.upsert_nav_node('performance_module', 'performance', 'perf_succession', 'Succession', NULL, 'folder', 'performance', 5);
SELECT public.upsert_nav_node('performance_module', 'perf_succession', 'perf_succ_add', 'Add Succession Plan', '/app/performance?tab=succession&action=add', 'link', 'performance', 1);
SELECT public.upsert_nav_node('performance_module', 'perf_succession', 'perf_succ_list', 'Succession List', '/app/performance?tab=succession', 'link', 'performance', 2);
SELECT public.upsert_nav_node('performance_module', 'performance', 'perf_analytics', 'Analytics', '/app/performance?tab=analytics', 'link', 'performance', 6);

SELECT public.upsert_nav_node('performance_module', NULL, 'promotions', 'Promotion', '/app/promotions', 'link', 'promotions', 2);

SELECT public.upsert_nav_node('performance_module', NULL, 'learning', 'Learning & Development', NULL, 'folder', 'learning', 3);
SELECT public.upsert_nav_node('performance_module', 'learning', 'learn_overview', 'Overview', '/app/learning?tab=overview', 'link', 'learning', 1);
SELECT public.upsert_nav_node('performance_module', 'learning', 'learn_courses', 'Courses', NULL, 'folder', 'learning', 2);
SELECT public.upsert_nav_node('performance_module', 'learn_courses', 'learn_courses_add', 'Add New Course', '/app/learning?tab=courses&action=add', 'link', 'learning', 1);
SELECT public.upsert_nav_node('performance_module', 'learn_courses', 'learn_courses_list', 'Course List', '/app/learning?tab=courses', 'link', 'learning', 2);
SELECT public.upsert_nav_node('performance_module', 'learning', 'learn_paths', 'Learning Paths', NULL, 'folder', 'learning', 3);
SELECT public.upsert_nav_node('performance_module', 'learn_paths', 'learn_paths_add', 'Add Learning Paths', '/app/learning?tab=paths&action=add', 'link', 'learning', 1);
SELECT public.upsert_nav_node('performance_module', 'learn_paths', 'learn_paths_list', 'Learning Path List', '/app/learning?tab=paths', 'link', 'learning', 2);
SELECT public.upsert_nav_node('performance_module', 'learning', 'learn_enrollments', 'Enrollments', '/app/learning?tab=enrollments', 'link', 'learning', 4);
SELECT public.upsert_nav_node('performance_module', 'learning', 'learn_certs', 'Certifications', NULL, 'folder', 'learning', 5);
SELECT public.upsert_nav_node('performance_module', 'learn_certs', 'learn_certs_add', 'Add Certifications', '/app/learning?tab=certifications&action=add', 'link', 'learning', 1);
SELECT public.upsert_nav_node('performance_module', 'learn_certs', 'learn_certs_view', 'View Certifications', '/app/learning?tab=certifications', 'link', 'learning', 2);
SELECT public.upsert_nav_node('performance_module', 'learning', 'learn_instructors', 'Instructors', NULL, 'folder', 'learning', 6);
SELECT public.upsert_nav_node('performance_module', 'learn_instructors', 'learn_inst_add', 'Add Instructors', '/app/learning?tab=instructors&action=add', 'link', 'learning', 1);
SELECT public.upsert_nav_node('performance_module', 'learn_instructors', 'learn_inst_view', 'View Instructors', '/app/learning?tab=instructors', 'link', 'learning', 2);
SELECT public.upsert_nav_node('performance_module', 'learning', 'learn_analytics', 'Analytics', '/app/learning?tab=analytics', 'link', 'learning', 7);

GRANT EXECUTE ON FUNCTION public.upsert_nav_node(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT)
  TO authenticated, anon;

NOTIFY pgrst, 'reload schema';

-- Verification (expected: 4 modules, ~70+ nodes).
-- Note: each SELECT upsert_nav_node(...) earlier returns "" because the function is VOID — that is success.
SELECT
  (SELECT count(*) FROM public.app_nav_modules) AS modules,
  (SELECT count(*) FROM public.app_nav_nodes) AS nodes;

SELECT m.number, m.code, m.title, count(n.id) AS node_count
FROM public.app_nav_modules m
LEFT JOIN public.app_nav_nodes n ON n.module_id = m.id
GROUP BY m.number, m.code, m.title
ORDER BY m.number;
