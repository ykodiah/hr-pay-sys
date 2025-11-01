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

-- =====================================================================================
-- Seed default templates for core automation events
-- =====================================================================================

WITH template_defs AS (
    SELECT
        'PAYROLL.COMPLETED'::text AS template_key,
        'Payslip Release Notification'::text AS name,
        'Employees receive a notice when payroll completes and payslips are available.'::text AS description,
        'email'::text AS channel_type,
        'automation'::text AS category,
        ARRAY['automation', 'payroll', 'default']::text[] AS tags,
        $$Payslip for {{payroll.period_name}} ready$$::text AS subject,
        $$Hi {{employee.first_name}}, your payslip for {{payroll.period_name}} is now available in the self-service portal.$$::text AS content_text,
        $$<p>Hi {{employee.first_name}},</p><p>Your payslip for {{payroll.period_name}} is ready. <a href="{{links.payslip_url}}">View your payslip</a>.</p>$$::text AS content_html,
        jsonb_build_array(
            jsonb_build_object('key', 'employee.first_name', 'label', 'Employee first name', 'required', false),
            jsonb_build_object('key', 'payroll.period_name', 'label', 'Payroll period', 'required', true),
            jsonb_build_object('key', 'links.payslip_url', 'label', 'Payslip download link', 'required', false)
        ) AS variables
    UNION ALL
    SELECT
        'PAYROLL.VARIANCE_DETECTED',
        'Payroll Variance Alert',
        'Alerts an employee when their net pay changes significantly.',
        'email',
        'automation',
        ARRAY['automation', 'payroll', 'variance'],
        $$Change detected in your {{payroll.period_name}} pay$$,
        $$Hi {{employee.first_name}}, we noticed a change of {{payroll.net_change}} to your pay for {{payroll.period_name}}. Open your payslip to review the breakdown.$$,
        $$<p>Hi {{employee.first_name}},</p><p>We noticed a change of {{payroll.net_change}} to your pay for {{payroll.period_name}}. <a href="{{links.payslip_url}}">Review your detailed payslip</a> for the full breakdown.</p><p>If something looks incorrect, reply to this message or contact payroll support.</p>$$,
        jsonb_build_array(
            jsonb_build_object('key', 'employee.first_name', 'label', 'Employee first name', 'required', false),
            jsonb_build_object('key', 'payroll.period_name', 'label', 'Payroll period', 'required', true),
            jsonb_build_object('key', 'payroll.net_change', 'label', 'Net pay difference', 'required', true),
            jsonb_build_object('key', 'links.payslip_url', 'label', 'Payslip download link', 'required', false)
        )
    UNION ALL
    SELECT
        'LEAVE.APPROVED',
        'Leave Approval Confirmation',
        'Confirms approved leave requests and highlights the approved dates.',
        'email',
        'automation',
        ARRAY['automation', 'leave'],
        $$Your leave request has been approved$$,
        $$Hi {{employee.first_name}}, your {{leave.type}} request from {{leave.start_date}} to {{leave.end_date}} has been approved. Enjoy your time off!$$,
        $$<p>Hi {{employee.first_name}},</p><p>Your {{leave.type}} request covering {{leave.start_date}} to {{leave.end_date}} has been approved. Enjoy your time off!</p>$$,
        jsonb_build_array(
            jsonb_build_object('key', 'employee.first_name', 'label', 'Employee first name', 'required', false),
            jsonb_build_object('key', 'leave.type', 'label', 'Leave type', 'required', true),
            jsonb_build_object('key', 'leave.start_date', 'label', 'Leave start date', 'required', true),
            jsonb_build_object('key', 'leave.end_date', 'label', 'Leave end date', 'required', true)
        )
    UNION ALL
    SELECT
        'LEAVE.REJECTED',
        'Leave Decision Update',
        'Lets an employee know their leave request needs attention.',
        'email',
        'automation',
        ARRAY['automation', 'leave', 'default'],
        $$Update on your leave request$$,
        $$Hi {{employee.first_name}}, your {{leave.type}} request for {{leave.start_date}} to {{leave.end_date}} was updated. Please review the comments from {{manager.name}}.$$,
        $$<p>Hi {{employee.first_name}},</p><p>Your {{leave.type}} request for {{leave.start_date}} to {{leave.end_date}} was updated. Please review the comments from {{manager.name}} in the self-service portal.</p>$$,
        jsonb_build_array(
            jsonb_build_object('key', 'employee.first_name', 'label', 'Employee first name', 'required', false),
            jsonb_build_object('key', 'leave.type', 'label', 'Leave type', 'required', true),
            jsonb_build_object('key', 'leave.start_date', 'label', 'Leave start date', 'required', true),
            jsonb_build_object('key', 'leave.end_date', 'label', 'Leave end date', 'required', true),
            jsonb_build_object('key', 'manager.name', 'label', 'Approver name', 'required', false)
        )
    UNION ALL
    SELECT
        'HR.DOC_EXPIRING',
        'Document Expiry Reminder',
        'Short SMS-style reminder for expiring compliance documents.',
        'sms',
        'automation',
        ARRAY['automation', 'compliance', 'default'],
        $$Reminder: {{document.type}} expires on {{document.expiry_date}}$$,
        $$Hi {{employee.first_name}}, your {{document.type}} expires on {{document.expiry_date}}. Update it in the portal to stay compliant.$$,
        NULL::text,
        jsonb_build_array(
            jsonb_build_object('key', 'employee.first_name', 'label', 'Employee first name', 'required', false),
            jsonb_build_object('key', 'document.type', 'label', 'Document type', 'required', true),
            jsonb_build_object('key', 'document.expiry_date', 'label', 'Document expiry date', 'required', true)
        )
),
target_companies AS (
    SELECT id AS company_id FROM companies
),
inserted_templates AS (
    INSERT INTO communication_templates (
        company_id,
        template_key,
        name,
        description,
        channel_type,
        category,
        tags,
        language,
        metadata,
        is_active,
        created_by,
        updated_by
    )
    SELECT
        c.company_id,
        d.template_key,
        d.name,
        d.description,
        d.channel_type,
        d.category,
        d.tags,
        'en',
        '{}'::jsonb,
        TRUE,
        NULL,
        NULL
    FROM target_companies c
    CROSS JOIN template_defs d
    WHERE NOT EXISTS (
        SELECT 1
        FROM communication_templates existing
        WHERE existing.company_id = c.company_id
          AND existing.template_key = d.template_key
    )
    RETURNING id, company_id, template_key
),
inserted_versions AS (
    INSERT INTO communication_template_versions (
        template_id,
        version_number,
        status,
        subject,
        content_text,
        content_html,
        preview_json,
        variables,
        metadata,
        created_by,
        updated_by,
        published_at
    )
    SELECT
        it.id,
        1,
        'published',
        d.subject,
        d.content_text,
        d.content_html,
        '{}'::jsonb,
        d.variables,
        '{}'::jsonb,
        NULL,
        NULL,
        NOW()
    FROM inserted_templates it
    JOIN template_defs d ON d.template_key = it.template_key
    RETURNING id, template_id
)
UPDATE communication_templates t
SET current_version_id = iv.id
FROM inserted_versions iv
WHERE t.id = iv.template_id;

