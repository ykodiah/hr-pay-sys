-- Communication Templates & Snippets Schema
-- Milestone 1: foundational entities for reusable omni-channel messaging

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET application_name = 'supabase-migrations';

-- =====================================================================================
-- Core template catalogue
-- =====================================================================================

CREATE TABLE IF NOT EXISTS communication_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    template_key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'sms', 'whatsapp', 'push', 'teams', 'slack', 'webhook')),
    category TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    language TEXT DEFAULT 'en',
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    current_version_id UUID,
    created_by UUID REFERENCES employees(id),
    updated_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (company_id, template_key)
);

CREATE INDEX IF NOT EXISTS idx_comm_templates_company ON communication_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_comm_templates_channel ON communication_templates(company_id, channel_type);

-- =====================================================================================
-- Version history for templates (draft + published states)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS communication_template_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES communication_templates(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    subject TEXT,
    content_text TEXT,
    content_html TEXT,
    preview_json JSONB DEFAULT '{}'::jsonb,
    variables JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES employees(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (template_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_comm_template_versions_template ON communication_template_versions(template_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_comm_template_versions_status ON communication_template_versions(template_id, status);

ALTER TABLE communication_templates
    ADD CONSTRAINT communication_templates_current_version_fkey
    FOREIGN KEY (current_version_id)
    REFERENCES communication_template_versions(id)
    ON DELETE SET NULL;

-- =====================================================================================
-- Reusable snippets (headers, footers, disclaimers, reusable paragraphs)
-- =====================================================================================

CREATE TABLE IF NOT EXISTS communication_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    snippet_key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    language TEXT DEFAULT 'en',
    content_text TEXT,
    content_html TEXT,
    variables JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES employees(id),
    updated_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (company_id, snippet_key)
);

CREATE INDEX IF NOT EXISTS idx_comm_snippets_company ON communication_snippets(company_id);
CREATE INDEX IF NOT EXISTS idx_comm_snippets_category ON communication_snippets(company_id, category);

-- =====================================================================================
-- Helper view: expose template + latest (or published) version for fast reads
-- =====================================================================================

CREATE OR REPLACE VIEW communication_template_summaries AS
SELECT
    t.id,
    t.company_id,
    t.template_key,
    t.name,
    t.description,
    t.channel_type,
    t.category,
    t.tags,
    t.language,
    t.metadata,
    t.is_active,
    t.created_by,
    t.updated_by,
    t.created_at,
    t.updated_at,
    v.id AS version_id,
    v.version_number,
    v.status,
    v.subject,
    v.content_text,
    v.content_html,
    v.preview_json,
    v.variables,
    v.metadata AS version_metadata,
    v.created_at AS version_created_at,
    v.published_at
FROM communication_templates t
LEFT JOIN LATERAL (
    SELECT *
    FROM communication_template_versions v
    WHERE v.template_id = t.id
    ORDER BY
        CASE WHEN t.current_version_id IS NOT NULL AND v.id = t.current_version_id THEN 0 ELSE 1 END,
        v.version_number DESC
    LIMIT 1
) v ON TRUE;

-- =====================================================================================
-- Row Level Security (company scoped with permission helpers)
-- =====================================================================================

ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY comm_templates_select ON communication_templates
    FOR SELECT
    USING (
        is_user_authenticated()
        AND company_id = get_current_user_company_id()
        AND (user_has_permission('communication_templates', 'read') OR user_is_company_admin())
    );

CREATE POLICY comm_templates_insert ON communication_templates
    FOR INSERT
    WITH CHECK (
        is_user_authenticated()
        AND company_id = get_current_user_company_id()
        AND (user_has_permission('communication_templates', 'manage') OR user_is_company_admin())
    );

CREATE POLICY comm_templates_update ON communication_templates
    FOR UPDATE
    USING (
        is_user_authenticated()
        AND company_id = get_current_user_company_id()
        AND (user_has_permission('communication_templates', 'manage') OR user_is_company_admin())
    )
    WITH CHECK (
        company_id = get_current_user_company_id()
    );

CREATE POLICY comm_templates_delete ON communication_templates
    FOR DELETE
    USING (
        is_user_authenticated()
        AND company_id = get_current_user_company_id()
        AND (user_has_permission('communication_templates', 'manage') OR user_is_company_admin())
    );

CREATE POLICY comm_template_versions_select ON communication_template_versions
    FOR SELECT
    USING (
        is_user_authenticated()
        AND EXISTS (
            SELECT 1 FROM communication_templates t
            WHERE t.id = template_id
              AND t.company_id = get_current_user_company_id()
        )
        AND (user_has_permission('communication_templates', 'read') OR user_is_company_admin())
    );

CREATE POLICY comm_template_versions_insert ON communication_template_versions
    FOR INSERT
    WITH CHECK (
        is_user_authenticated()
        AND EXISTS (
            SELECT 1 FROM communication_templates t
            WHERE t.id = template_id
              AND t.company_id = get_current_user_company_id()
              AND (user_has_permission('communication_templates', 'manage') OR user_is_company_admin())
        )
    );

CREATE POLICY comm_template_versions_update ON communication_template_versions
    FOR UPDATE
    USING (
        is_user_authenticated()
        AND EXISTS (
            SELECT 1 FROM communication_templates t
            WHERE t.id = template_id
              AND t.company_id = get_current_user_company_id()
              AND (user_has_permission('communication_templates', 'manage') OR user_is_company_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM communication_templates t
            WHERE t.id = template_id
              AND t.company_id = get_current_user_company_id()
        )
    );

CREATE POLICY comm_template_versions_delete ON communication_template_versions
    FOR DELETE
    USING (
        is_user_authenticated()
        AND EXISTS (
            SELECT 1 FROM communication_templates t
            WHERE t.id = template_id
              AND t.company_id = get_current_user_company_id()
              AND (user_has_permission('communication_templates', 'manage') OR user_is_company_admin())
        )
    );

CREATE POLICY comm_snippets_select ON communication_snippets
    FOR SELECT
    USING (
        is_user_authenticated()
        AND company_id = get_current_user_company_id()
        AND (user_has_permission('communication_snippets', 'read') OR user_has_permission('communication_templates', 'read') OR user_is_company_admin())
    );

CREATE POLICY comm_snippets_insert ON communication_snippets
    FOR INSERT
    WITH CHECK (
        is_user_authenticated()
        AND company_id = get_current_user_company_id()
        AND (user_has_permission('communication_snippets', 'manage') OR user_has_permission('communication_templates', 'manage') OR user_is_company_admin())
    );

CREATE POLICY comm_snippets_update ON communication_snippets
    FOR UPDATE
    USING (
        is_user_authenticated()
        AND company_id = get_current_user_company_id()
        AND (user_has_permission('communication_snippets', 'manage') OR user_has_permission('communication_templates', 'manage') OR user_is_company_admin())
    )
    WITH CHECK (
        company_id = get_current_user_company_id()
    );

CREATE POLICY comm_snippets_delete ON communication_snippets
    FOR DELETE
    USING (
        is_user_authenticated()
        AND company_id = get_current_user_company_id()
        AND (user_has_permission('communication_snippets', 'manage') OR user_has_permission('communication_templates', 'manage') OR user_is_company_admin())
    );

-- =====================================================================================
-- Timestamps maintenance
-- =====================================================================================

CREATE TRIGGER trg_comm_templates_updated
    BEFORE UPDATE ON communication_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_comm_snippets_updated
    BEFORE UPDATE ON communication_snippets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_comm_template_versions_updated
    BEFORE UPDATE ON communication_template_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

