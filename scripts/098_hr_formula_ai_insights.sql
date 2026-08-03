-- Persist AI/ML insights for HR formula report runs
-- Safe to re-run.

ALTER TABLE public.hr_formula_report_runs
  ADD COLUMN IF NOT EXISTS health_score numeric(6, 2),
  ADD COLUMN IF NOT EXISTS health_label varchar(40),
  ADD COLUMN IF NOT EXISTS executive_brief text,
  ADD COLUMN IF NOT EXISTS ai_narrative text,
  ADD COLUMN IF NOT EXISTS ml_model varchar(80),
  ADD COLUMN IF NOT EXISTS ai_model varchar(120),
  ADD COLUMN IF NOT EXISTS insights_json jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS export_formats text[] DEFAULT ARRAY['csv']::text[];

CREATE TABLE IF NOT EXISTS public.hr_formula_ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.hr_formula_report_runs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id varchar(64) NOT NULL REFERENCES public.hr_formula_categories(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  health_score numeric(6, 2),
  health_label varchar(40),
  executive_brief text,
  narrative text,
  blocks jsonb DEFAULT '[]'::jsonb,
  ml_model varchar(80),
  ai_model varchar(120),
  source varchar(20) DEFAULT 'ml',
  generated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hr_formula_ai_company
  ON public.hr_formula_ai_insights(company_id, category_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_hr_formula_ai_run
  ON public.hr_formula_ai_insights(run_id);

ALTER TABLE public.hr_formula_ai_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hr_formula_ai_insights_all ON public.hr_formula_ai_insights;
CREATE POLICY hr_formula_ai_insights_all ON public.hr_formula_ai_insights
  FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.hr_formula_ai_insights TO authenticated, anon, service_role;
