-- Communication Integration Credentials Schema
-- Provides customer-managed channel provider settings with secure storage and auditing.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET application_name = 'supabase-migrations';

-- ========================================================================= --
-- 1. Core table for customer-managed communication provider integrations      --
-- ========================================================================= --

CREATE TABLE IF NOT EXISTS communication_provider_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'sms', 'whatsapp', 'push', 'teams', 'slack', 'webhook')),
    provider_name TEXT NOT NULL,
    provider_identifier TEXT,
    display_label TEXT,
    configuration JSONB DEFAULT '{}'::jsonb,
    encrypted_credentials TEXT,
    vault_secret_reference TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'disabled')),
    last_validated_at TIMESTAMP WITH TIME ZONE,
    validation_error TEXT,
    created_by UUID REFERENCES employees(id),
    updated_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (company_id, channel_type, provider_name),
    CHECK (
        NOT is_active OR (
            encrypted_credentials IS NOT NULL OR vault_secret_reference IS NOT NULL
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_comm_provider_integrations_company ON communication_provider_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_comm_provider_integrations_status ON communication_provider_integrations(status);
CREATE INDEX IF NOT EXISTS idx_comm_provider_integrations_channel ON communication_provider_integrations(channel_type);

-- ========================================================================= --
-- 2. Audit log table to track configuration lifecycle changes                --
-- ========================================================================= --

CREATE TABLE IF NOT EXISTS communication_integration_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES communication_provider_integrations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'validated', 'status_changed')),
    change_context JSONB DEFAULT '{}'::jsonb,
    changed_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_integration_audit_integration ON communication_integration_audit_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_comm_integration_audit_company ON communication_integration_audit_logs(company_id);

-- ========================================================================= --
-- 3. Helper function: sanitize integration row for audit payloads            --
-- ========================================================================= --

CREATE OR REPLACE FUNCTION sanitize_integration_payload(p_row communication_provider_integrations)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    sanitized JSONB;
BEGIN
    sanitized := to_jsonb(p_row) - ARRAY[
        'encrypted_credentials',
        'vault_secret_reference'
    ];
    RETURN sanitized;
END;
$$;

-- ========================================================================= --
-- 4. Trigger function to populate audit logs                                 --
-- ========================================================================= --

CREATE OR REPLACE FUNCTION log_comm_integration_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    payload JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        payload := jsonb_build_object(
            'after', sanitize_integration_payload(NEW)
        );
        INSERT INTO communication_integration_audit_logs (
            integration_id,
            company_id,
            action,
            change_context,
            changed_by
        ) VALUES (
            NEW.id,
            NEW.company_id,
            'created',
            payload,
            NEW.created_by
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        payload := jsonb_build_object(
            'before', sanitize_integration_payload(OLD),
            'after', sanitize_integration_payload(NEW)
        );
        INSERT INTO communication_integration_audit_logs (
            integration_id,
            company_id,
            action,
            change_context,
            changed_by
        ) VALUES (
            NEW.id,
            NEW.company_id,
            CASE
                WHEN NEW.status IS DISTINCT FROM OLD.status THEN 'status_changed'
                ELSE 'updated'
            END,
            payload,
            COALESCE(NEW.updated_by, NEW.created_by)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        payload := jsonb_build_object(
            'before', sanitize_integration_payload(OLD)
        );
        INSERT INTO communication_integration_audit_logs (
            integration_id,
            company_id,
            action,
            change_context,
            changed_by
        ) VALUES (
            OLD.id,
            OLD.company_id,
            'deleted',
            payload,
            OLD.updated_by
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_comm_integration_audit
AFTER INSERT OR UPDATE OR DELETE ON communication_provider_integrations
FOR EACH ROW EXECUTE FUNCTION log_comm_integration_changes();

-- ========================================================================= --
-- 5. Trigger to maintain updated_at timestamp                                 --
-- ========================================================================= --

CREATE TRIGGER trg_comm_integration_set_updated_at
BEFORE UPDATE ON communication_provider_integrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ========================================================================= --
-- 6. Secure access with Row Level Security                                    --
-- ========================================================================= --

ALTER TABLE communication_provider_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_integration_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comm_integrations_company_access" ON communication_provider_integrations
FOR SELECT USING (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    (user_has_permission('communication_integrations', 'read') OR user_is_company_admin())
);

CREATE POLICY "comm_integrations_company_manage" ON communication_provider_integrations
FOR INSERT WITH CHECK (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    (user_has_permission('communication_integrations', 'manage') OR user_is_company_admin())
);

CREATE POLICY "comm_integrations_company_update" ON communication_provider_integrations
FOR UPDATE USING (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    (user_has_permission('communication_integrations', 'manage') OR user_is_company_admin())
)
WITH CHECK (
    company_id = get_current_user_company_id()
);

CREATE POLICY "comm_integrations_company_delete" ON communication_provider_integrations
FOR DELETE USING (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    (user_has_permission('communication_integrations', 'manage') OR user_is_company_admin())
);

CREATE POLICY "comm_integration_audit_select" ON communication_integration_audit_logs
FOR SELECT USING (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    (user_has_permission('communication_integrations', 'read') OR user_is_company_admin())
);

-- ========================================================================= --
-- 7. Helper view exposing sanitized integration summaries                      --
-- ========================================================================= --

CREATE OR REPLACE VIEW communication_integration_summaries AS
SELECT
    id,
    company_id,
    channel_type,
    provider_name,
    provider_identifier,
    display_label,
    configuration,
    (encrypted_credentials IS NOT NULL OR vault_secret_reference IS NOT NULL) AS has_credentials,
    is_active,
    status,
    last_validated_at,
    validation_error,
    created_at,
    updated_at
FROM communication_provider_integrations;

