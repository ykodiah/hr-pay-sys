-- ============================================================================
-- 060_multi_company_settings_persistence.sql
-- Multi-company / subsidiary settings persistence for Settings → Multi-Company
-- Safe to re-run.
-- ============================================================================

ALTER TABLE subsidiaries
  ADD COLUMN IF NOT EXISTS industry VARCHAR(150),
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS divisions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS departments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS locations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS settings_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS employee_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS subsidiary_sync_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  sync_hr_policies BOOLEAN DEFAULT true,
  sync_payroll_config BOOLEAN DEFAULT true,
  sync_leave_types BOOLEAN DEFAULT true,
  sync_roles_permissions BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subsidiary_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL,
  sync_status VARCHAR(20) DEFAULT 'pending',
  sync_data JSONB DEFAULT '{}'::jsonb,
  synced_by UUID,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT
);

-- Per-subsidiary applied settings snapshot (result of Sync Settings)
CREATE TABLE IF NOT EXISTS subsidiary_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE UNIQUE,
  hr_policies JSONB DEFAULT '{}'::jsonb,
  payroll_config JSONB DEFAULT '{}'::jsonb,
  leave_types JSONB DEFAULT '[]'::jsonb,
  roles_permissions JSONB DEFAULT '[]'::jsonb,
  synced_types JSONB DEFAULT '[]'::jsonb,
  settings_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subsidiary_settings_company ON subsidiary_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_subsidiary_sync_log_company ON subsidiary_sync_log(company_id);
CREATE INDEX IF NOT EXISTS idx_subsidiary_sync_log_subsidiary ON subsidiary_sync_log(subsidiary_id);

COMMENT ON TABLE subsidiary_settings IS 'Applied parent-company settings snapshots per subsidiary';
COMMENT ON TABLE subsidiary_sync_preferences IS 'Tenant preferences for which settings areas sync to subsidiaries';
COMMENT ON TABLE subsidiary_sync_log IS 'Audit log of subsidiary settings synchronization runs';
