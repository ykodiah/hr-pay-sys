-- HR Formula Reports schema
-- Supporting operational tables + persisted metric snapshots for Analytics reports.
-- Safe to re-run.

-- ═══════════════════════════════════════════════════════════════════════════
-- Supporting data tables (gaps for formula inputs)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.company_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  holiday_date date NOT NULL,
  name text NOT NULL,
  is_paid boolean DEFAULT true,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, holiday_date)
);

CREATE TABLE IF NOT EXISTS public.company_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period varchar(7) NOT NULL, -- YYYY-MM
  revenue numeric(18, 2) DEFAULT 0,
  output_units numeric(18, 2) DEFAULT 0,
  hr_operating_cost numeric(18, 2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, period)
);

CREATE TABLE IF NOT EXISTS public.recruitment_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requisition_id uuid,
  job_posting_id uuid,
  category varchar(80) DEFAULT 'general',
  amount numeric(15, 2) NOT NULL DEFAULT 0,
  incurred_at date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.recruitment_requisitions
  ADD COLUMN IF NOT EXISTS filled_at timestamptz;

CREATE TABLE IF NOT EXISTS public.leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id uuid REFERENCES public.leave_types(id) ON DELETE SET NULL,
  year integer NOT NULL,
  entitled_days numeric(8, 2) DEFAULT 0,
  used_days numeric(8, 2) DEFAULT 0,
  remaining_days numeric(8, 2) DEFAULT 0,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS public.training_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  cost numeric(15, 2) DEFAULT 0,
  duration_hours numeric(8, 2) DEFAULT 0,
  status varchar(40) DEFAULT 'active',
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.training_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  hours_completed numeric(8, 2) DEFAULT 0,
  pre_score numeric(8, 2),
  post_score numeric(8, 2),
  benefit_amount numeric(15, 2) DEFAULT 0,
  status varchar(40) DEFAULT 'enrolled',
  enrolled_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  completed_at timestamptz,
  UNIQUE(course_id, employee_id)
);

CREATE TABLE IF NOT EXISTS public.engagement_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL DEFAULT 'Engagement Survey',
  period_start date NOT NULL,
  period_end date NOT NULL,
  max_score numeric(8, 2) DEFAULT 100,
  status varchar(40) DEFAULT 'open',
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.engagement_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.engagement_surveys(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  score numeric(8, 2),
  enps_score integer CHECK (enps_score IS NULL OR (enps_score BETWEEN 0 AND 10)),
  is_positive boolean,
  responded_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.grievances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  subject text,
  status varchar(40) DEFAULT 'filed'
    CHECK (status IN ('filed', 'investigating', 'resolved', 'closed', 'withdrawn')),
  filed_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.disciplinary_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  action_type varchar(80) DEFAULT 'warning',
  status varchar(40) DEFAULT 'issued',
  issued_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.safety_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  incident_date date NOT NULL DEFAULT CURRENT_DATE,
  severity varchar(40) DEFAULT 'minor',
  is_lost_time boolean DEFAULT false,
  lost_days numeric(8, 2) DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Align learning_courses ghost table used by dashboard (optional bridge)
CREATE TABLE IF NOT EXISTS public.learning_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  status varchar(40) DEFAULT 'active',
  cost numeric(15, 2) DEFAULT 0,
  duration_hours numeric(8, 2) DEFAULT 0,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Formula report catalog + snapshot storage
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hr_formula_categories (
  id varchar(64) PRIMARY KEY,
  title varchar(120) NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  description text
);

INSERT INTO public.hr_formula_categories (id, title, sort_order, description) VALUES
  ('workforce', 'Workforce Planning', 1, 'Turnover, retention, growth, and absenteeism'),
  ('attendance', 'Time & Attendance', 2, 'Attendance, absence, leave utilization, punctuality'),
  ('recruitment', 'Recruitment', 3, 'Time to fill, cost per hire, offer and source metrics'),
  ('compensation', 'Compensation & Benefits', 4, 'Average salary, CTC, benefits, fixed/variable pay'),
  ('training', 'Training & Development', 5, 'Training cost, hours, effectiveness, ROI'),
  ('performance', 'Performance Management', 6, 'Appraisal completion and performer ratios'),
  ('engagement', 'Employee Engagement', 7, 'Engagement score, eNPS, engagement index'),
  ('relations', 'Employee Relations', 8, 'Grievance and disciplinary rates'),
  ('safety', 'Health & Safety', 9, 'Incident rate, LTIFR, illness absence'),
  ('general', 'General', 10, 'Span of control, productivity, HR cost per employee')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description;

CREATE TABLE IF NOT EXISTS public.hr_formula_definitions (
  id varchar(80) PRIMARY KEY,
  category_id varchar(64) NOT NULL REFERENCES public.hr_formula_categories(id) ON DELETE CASCADE,
  name varchar(160) NOT NULL,
  formula_text text NOT NULL,
  unit varchar(40) DEFAULT 'percent',
  sort_order integer NOT NULL DEFAULT 0
);

INSERT INTO public.hr_formula_definitions (id, category_id, name, formula_text, unit, sort_order) VALUES
  ('turnover_rate', 'workforce', 'Employee Turnover Rate (%)', '(Employees Left ÷ Average Employees) × 100', 'percent', 1),
  ('retention_rate', 'workforce', 'Retention Rate (%)', '((End Headcount − New Joinees) ÷ Start Headcount) × 100', 'percent', 2),
  ('workforce_growth', 'workforce', 'Workforce Growth Rate (%)', '((End − Start Headcount) ÷ Start Headcount) × 100', 'percent', 3),
  ('absenteeism_rate', 'workforce', 'Absenteeism Rate (%)', '(Absent Days ÷ Working Days) × 100', 'percent', 4),

  ('attendance_pct', 'attendance', 'Attendance Percentage (%)', '(Days Present ÷ Working Days) × 100', 'percent', 1),
  ('absence_rate', 'attendance', 'Absence Rate (%)', '(Days Absent ÷ Working Days) × 100', 'percent', 2),
  ('leave_utilization', 'attendance', 'Leave Utilization (%)', '(Leave Days Taken ÷ Leave Days Entitled) × 100', 'percent', 3),
  ('punctuality_rate', 'attendance', 'Punctuality Rate (%)', '(On-time Arrivals ÷ Working Days) × 100', 'percent', 4),

  ('time_to_fill', 'recruitment', 'Time to Fill (Days)', 'Date Position Filled − Date Requisition Raised', 'days', 1),
  ('cost_per_hire', 'recruitment', 'Cost per Hire', 'Total Recruitment Cost ÷ Number of Hires', 'currency', 2),
  ('offer_acceptance', 'recruitment', 'Offer Acceptance Rate (%)', '(Offers Accepted ÷ Offers Extended) × 100', 'percent', 3),
  ('source_effectiveness', 'recruitment', 'Source Effectiveness (%)', '(Hires from Top Source ÷ Total Hires) × 100', 'percent', 4),

  ('average_salary', 'compensation', 'Average Salary', 'Total Salary Paid ÷ Total Employees', 'currency', 1),
  ('payroll_ctc_pct', 'compensation', 'Payroll Cost to Company (%)', '(Total Payroll Cost ÷ Total Revenue) × 100', 'percent', 2),
  ('benefits_per_employee', 'compensation', 'Benefits Cost per Employee', 'Total Benefits Cost ÷ Total Employees', 'currency', 3),
  ('fixed_variable_ratio', 'compensation', 'Fixed to Variable Pay Ratio', 'Total Fixed Pay ÷ Total Variable Pay', 'ratio', 4),

  ('training_cost_per_emp', 'training', 'Training Cost per Employee', 'Total Training Cost ÷ Total Employees', 'currency', 1),
  ('training_hours_per_emp', 'training', 'Training Hours per Employee', 'Total Training Hours ÷ Total Employees', 'hours', 2),
  ('training_effectiveness', 'training', 'Training Effectiveness (%)', '((Post − Pre Score) ÷ Pre Score) × 100', 'percent', 3),
  ('training_roi', 'training', 'Training ROI (%)', '((Benefits − Cost) ÷ Cost) × 100', 'percent', 4),

  ('perf_completion', 'performance', 'Performance Completion Rate (%)', '(Completed Appraisals ÷ Employees) × 100', 'percent', 1),
  ('high_performer_ratio', 'performance', 'High Performer Ratio (%)', '(High Performers ÷ Employees) × 100', 'percent', 2),
  ('perf_improvement', 'performance', 'Performance Improvement Rate (%)', '(Employees Improved ÷ Employees) × 100', 'percent', 3),
  ('low_performer_ratio', 'performance', 'Low Performer Ratio (%)', '(Low Performers ÷ Employees) × 100', 'percent', 4),

  ('engagement_score', 'engagement', 'Engagement Score (%)', '(Score Obtained ÷ Maximum Possible Score) × 100', 'percent', 1),
  ('enps', 'engagement', 'eNPS', '% Promoters − % Detractors', 'score', 2),
  ('engagement_index', 'engagement', 'Engagement Index (%)', '(Positive Responses ÷ Total Responses) × 100', 'percent', 3),

  ('grievance_rate', 'relations', 'Grievance Rate (%)', '(Grievances Filed ÷ Employees) × 100', 'percent', 1),
  ('grievance_resolution', 'relations', 'Grievance Resolution Rate (%)', '(Resolved ÷ Filed) × 100', 'percent', 2),
  ('disciplinary_rate', 'relations', 'Disciplinary Action Rate (%)', '(Disciplinary Actions ÷ Employees) × 100', 'percent', 3),

  ('incident_rate', 'safety', 'Incident Rate (IR)', '(Incidents ÷ Man-hours) × 1,000,000', 'rate', 1),
  ('ltifr', 'safety', 'LTIFR', '(Lost Time Injuries ÷ Man-hours) × 1,000,000', 'rate', 2),
  ('illness_absence', 'safety', 'Absence Due to Illness (%)', '(Sick Leave Days ÷ Working Days) × 100', 'percent', 3),

  ('span_of_control', 'general', 'Span of Control', 'Subordinates ÷ Managers', 'ratio', 1),
  ('employee_productivity', 'general', 'Employee Productivity', 'Output ÷ Number of Employees', 'units', 2),
  ('hr_cost_per_employee', 'general', 'HR Cost per Employee', 'Total HR Cost ÷ Total Employees', 'currency', 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  formula_text = EXCLUDED.formula_text,
  unit = EXCLUDED.unit,
  sort_order = EXCLUDED.sort_order;

CREATE TABLE IF NOT EXISTS public.hr_formula_report_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id varchar(64) REFERENCES public.hr_formula_categories(id) ON DELETE SET NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status varchar(40) DEFAULT 'completed',
  generated_by uuid,
  generated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  notes text
);

CREATE TABLE IF NOT EXISTS public.hr_formula_report_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.hr_formula_report_runs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id varchar(64) NOT NULL REFERENCES public.hr_formula_categories(id) ON DELETE CASCADE,
  formula_id varchar(80) NOT NULL REFERENCES public.hr_formula_definitions(id) ON DELETE CASCADE,
  value numeric(18, 4),
  unit varchar(40),
  numerator numeric(18, 4),
  denominator numeric(18, 4),
  inputs jsonb DEFAULT '{}'::jsonb,
  data_status varchar(40) DEFAULT 'ok'
    CHECK (data_status IN ('ok', 'partial', 'no_data', 'error')),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hr_formula_runs_company ON public.hr_formula_report_runs(company_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_hr_formula_metrics_run ON public.hr_formula_report_metrics(run_id);
CREATE INDEX IF NOT EXISTS idx_hr_formula_metrics_company ON public.hr_formula_report_metrics(company_id, category_id);
CREATE INDEX IF NOT EXISTS idx_company_financials_period ON public.company_financials(company_id, period);
CREATE INDEX IF NOT EXISTS idx_grievances_company ON public.grievances(company_id, filed_at);
CREATE INDEX IF NOT EXISTS idx_disciplinary_company ON public.disciplinary_actions(company_id, issued_at);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_company ON public.safety_incidents(company_id, incident_date);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_company ON public.training_enrollments(company_id);
CREATE INDEX IF NOT EXISTS idx_engagement_responses_company ON public.engagement_responses(company_id);

-- RLS open for service role / authenticated (tenant enforced in app layer)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'company_holidays','company_financials','recruitment_costs','leave_balances',
    'training_courses','training_enrollments','engagement_surveys','engagement_responses',
    'grievances','disciplinary_actions','safety_incidents','learning_courses',
    'hr_formula_categories','hr_formula_definitions','hr_formula_report_runs','hr_formula_report_metrics'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true)',
      t || '_all', t
    );
    EXECUTE format('GRANT ALL ON public.%I TO authenticated, anon, service_role', t);
  END LOOP;
END $$;
