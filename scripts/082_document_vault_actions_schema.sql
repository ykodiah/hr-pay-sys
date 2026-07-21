-- =============================================================================
-- 082: Document vault action support (comments, sharing, audit, archive)
-- Safe / idempotent. Complements 041 + 062.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.document_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS employee_id UUID;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS employee_name TEXT;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual-upload';
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'employee-document';
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'standard';
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS archived_by UUID;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS uploaded_by UUID;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS upload_date TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS requires_signature BOOLEAN DEFAULT false;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS signature_status TEXT DEFAULT 'not_required';

CREATE TABLE IF NOT EXISTS public.document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.document_vault(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.document_vault(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.document_vault(id) ON DELETE CASCADE,
  shared_with_email TEXT,
  shared_with_user_id UUID,
  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'download', 'comment', 'edit')),
  shared_by UUID,
  shared_by_name TEXT,
  expires_at TIMESTAMPTZ,
  access_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.document_vault(id) ON DELETE CASCADE,
  company_id UUID,
  name TEXT,
  status TEXT DEFAULT 'pending',
  current_step INT DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.document_workflows(id) ON DELETE CASCADE,
  step_order INT NOT NULL DEFAULT 1,
  step_name TEXT,
  assignee_id UUID,
  assignee_name TEXT,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_access_logs_doc ON public.document_access_logs(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_comments_doc ON public.document_comments(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_sharing_doc ON public.document_sharing(document_id);
CREATE INDEX IF NOT EXISTS idx_document_workflows_doc ON public.document_workflows(document_id);
CREATE INDEX IF NOT EXISTS idx_document_vault_company_status ON public.document_vault(company_id, status);

ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_access_logs_all ON public.document_access_logs;
CREATE POLICY document_access_logs_all ON public.document_access_logs FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS document_comments_all ON public.document_comments;
CREATE POLICY document_comments_all ON public.document_comments FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS document_sharing_all ON public.document_sharing;
CREATE POLICY document_sharing_all ON public.document_sharing FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS document_workflows_all ON public.document_workflows;
CREATE POLICY document_workflows_all ON public.document_workflows FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS workflow_steps_all ON public.workflow_steps;
CREATE POLICY workflow_steps_all ON public.workflow_steps FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.document_access_logs TO authenticated, anon;
GRANT ALL ON public.document_comments TO authenticated, anon;
GRANT ALL ON public.document_sharing TO authenticated, anon;
GRANT ALL ON public.document_workflows TO authenticated, anon;
GRANT ALL ON public.workflow_steps TO authenticated, anon;

NOTIFY pgrst, 'reload schema';
