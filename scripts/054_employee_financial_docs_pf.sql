-- Employee financial extras: bank branch, provident fund, document vault linkage.
-- Safe to re-run after 053.

-- Banking + Provident Fund (Tier 3) on employee master financials
ALTER TABLE public.employee_financial
  ADD COLUMN IF NOT EXISTS bank_branch TEXT,
  ADD COLUMN IF NOT EXISTS provident_fund_enrolled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS provident_fund_rate NUMERIC(5,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  BEGIN
    ALTER TABLE public.employee_financial
      ADD CONSTRAINT chk_employee_pf_rate
      CHECK (provident_fund_rate >= 0 AND provident_fund_rate <= 16.5);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Keep document rows uniquely replaceable per type
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_documents_emp_type
  ON public.employee_documents(employee_id, document_type)
  WHERE document_type IS NOT NULL AND document_type <> '';

ALTER TABLE public.employee_documents
  ADD COLUMN IF NOT EXISTS vault_document_id UUID,
  ADD COLUMN IF NOT EXISTS file_content TEXT; -- small-file fallback for preview when blob unavailable

-- Ensure document_vault exists (subset compatible with 041)
CREATE TABLE IF NOT EXISTS public.document_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  file_url TEXT NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  source TEXT DEFAULT 'employee-onboarding',
  category TEXT DEFAULT 'employee-document',
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.document_vault
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS employee_name TEXT,
  ADD COLUMN IF NOT EXISTS document_type TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS file_type TEXT,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS upload_date TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS uploaded_by UUID,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'employee-onboarding',
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'employee-document',
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_document_vault_employee ON public.document_vault(employee_id);
CREATE INDEX IF NOT EXISTS idx_document_vault_company ON public.document_vault(company_id);

ALTER TABLE public.document_vault ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS document_vault_all ON public.document_vault;
CREATE POLICY document_vault_all ON public.document_vault FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.document_vault TO authenticated, anon;

-- Seed PF rate onto period inputs table if missing (already in 047, keep additive)
ALTER TABLE public.payroll_pay_inputs
  ADD COLUMN IF NOT EXISTS tier3_applicable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tier3_employee_rate NUMERIC(5,2) DEFAULT 0;
