-- Link Settings > HR documents to Document Vault copies.
-- Safe to re-run.

ALTER TABLE IF EXISTS public.hr_documents
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS vault_document_id UUID,
  ADD COLUMN IF NOT EXISTS file_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure document_vault exists for company HR copies (no employee required)
CREATE TABLE IF NOT EXISTS public.document_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID,
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
  ADD COLUMN IF NOT EXISTS company_id UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_hr_documents_vault ON public.hr_documents(vault_document_id);
CREATE INDEX IF NOT EXISTS idx_document_vault_company ON public.document_vault(company_id);
CREATE INDEX IF NOT EXISTS idx_document_vault_source ON public.document_vault(source);

-- Payroll configuration table (Settings > Payroll source of truth)
CREATE TABLE IF NOT EXISTS public.payroll_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  pay_frequency VARCHAR(20) DEFAULT 'monthly',
  currency VARCHAR(10) DEFAULT 'ghs',
  minimum_wage DECIMAL(15,2) DEFAULT 18.15,
  overtime_weekday_multiplier DECIMAL(5,2) DEFAULT 1.5,
  overtime_weekend_multiplier DECIMAL(5,2) DEFAULT 2.0,
  payroll_cutoff_day INTEGER DEFAULT 25,
  auto_calculate_paye BOOLEAN DEFAULT true,
  auto_calculate_ssnit BOOLEAN DEFAULT true,
  auto_calculate_provident_fund BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payroll_allowances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  taxable BOOLEAN DEFAULT true,
  recurring BOOLEAN DEFAULT true,
  amount DECIMAL(15,2) DEFAULT 0,
  percentage DECIMAL(8,4) DEFAULT 0,
  type VARCHAR(20) DEFAULT 'FIXED',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS public.payroll_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  taxable BOOLEAN DEFAULT false,
  recurring BOOLEAN DEFAULT true,
  amount DECIMAL(15,2) DEFAULT 0,
  percentage DECIMAL(8,4) DEFAULT 0,
  type VARCHAR(20) DEFAULT 'FIXED',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS public.tax_reliefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'GHS',
  category VARCHAR(50) DEFAULT 'Personal',
  is_active BOOLEAN DEFAULT true,
  effective_date DATE,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
