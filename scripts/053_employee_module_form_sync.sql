-- Employee form sync: ensure financial defaults, document metadata, payroll catalogs.
-- Safe to re-run after 050/051/052.

-- Soften NOT NULL financial fields that blocked creates with empty bank/ssnit
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.employee_financial ALTER COLUMN bank_name DROP NOT NULL;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER TABLE public.employee_financial ALTER COLUMN bank_account_number DROP NOT NULL;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER TABLE public.employee_financial ALTER COLUMN ssnit_number DROP NOT NULL;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER TABLE public.employee_financial ALTER COLUMN monthly_salary SET DEFAULT 0;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER TABLE public.employee_financial ALTER COLUMN bank_name SET DEFAULT 'Pending';
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER TABLE public.employee_financial ALTER COLUMN bank_account_number SET DEFAULT 'Pending';
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER TABLE public.employee_financial ALTER COLUMN ssnit_number SET DEFAULT 'Pending';
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;

-- Employee documents: ensure filename display columns exist
CREATE TABLE IF NOT EXISTS public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  document_type TEXT,
  document_name TEXT,
  file_name TEXT,
  file_path TEXT,
  file_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  upload_date TIMESTAMPTZ DEFAULT now(),
  uploaded_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.employee_documents
  ADD COLUMN IF NOT EXISTS document_type TEXT,
  ADD COLUMN IF NOT EXISTS document_name TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS upload_date TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS uploaded_by TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON public.employee_documents(employee_id);

-- Ensure payroll catalog tables exist for settings ↔ employee form
CREATE TABLE IF NOT EXISTS public.payroll_allowances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  taxable BOOLEAN DEFAULT false,
  recurring BOOLEAN DEFAULT true,
  amount DECIMAL(10,2) DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  type VARCHAR(20) DEFAULT 'FIXED',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS public.payroll_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  taxable BOOLEAN DEFAULT false,
  recurring BOOLEAN DEFAULT true,
  amount DECIMAL(10,2) DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  type VARCHAR(20) DEFAULT 'FIXED',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS public.employee_allowances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  allowance_id UUID REFERENCES public.payroll_allowances(id) ON DELETE SET NULL,
  code TEXT,
  description TEXT,
  taxable BOOLEAN NOT NULL DEFAULT false,
  recurring BOOLEAN NOT NULL DEFAULT true,
  amount DECIMAL(12,2) DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  calculation_type VARCHAR(10) NOT NULL DEFAULT 'AMOUNT',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  deduction_id UUID REFERENCES public.payroll_deductions(id) ON DELETE SET NULL,
  code TEXT,
  description TEXT,
  taxable BOOLEAN NOT NULL DEFAULT false,
  recurring BOOLEAN NOT NULL DEFAULT true,
  amount DECIMAL(12,2) DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  calculation_type VARCHAR(10) NOT NULL DEFAULT 'AMOUNT',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.employee_allowances
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.employee_deductions
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Allow catalog-less assignments (code/description only)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.employee_allowances ALTER COLUMN allowance_id DROP NOT NULL;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER TABLE public.employee_deductions ALTER COLUMN deduction_id DROP NOT NULL;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;

CREATE INDEX IF NOT EXISTS idx_emp_allowances_employee ON public.employee_allowances(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_deductions_employee ON public.employee_deductions(employee_id);

-- Open policies for demo/authenticated access (aligns with other module scripts)
ALTER TABLE public.payroll_allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'payroll_allowances',
    'payroll_deductions',
    'employee_allowances',
    'employee_deductions',
    'employee_documents'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_all ON public.%I', t, t);
    EXECUTE format('CREATE POLICY %I_all ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('GRANT ALL ON public.%I TO authenticated, anon', t);
  END LOOP;
END $$;
