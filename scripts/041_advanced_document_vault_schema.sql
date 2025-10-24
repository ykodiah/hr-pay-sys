-- Advanced Document Vault Schema with RBAC, Audit Trails, E-Signatures, and Retention Policies
-- This script creates comprehensive tables for advanced document management

-- User roles and permissions
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User role assignments
CREATE TABLE IF NOT EXISTS user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

-- Enhanced document vault with advanced features
CREATE TABLE IF NOT EXISTS document_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    employee_name VARCHAR(255),
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_hash VARCHAR(64), -- For integrity verification
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived', 'deleted')),
    notes TEXT,
    source VARCHAR(50) DEFAULT 'manual-upload',
    category VARCHAR(50) DEFAULT 'employee-document',
    
    -- RBAC fields
    access_level VARCHAR(20) DEFAULT 'standard' CHECK (access_level IN ('public', 'standard', 'confidential', 'restricted')),
    required_roles JSONB DEFAULT '[]',
    allowed_users JSONB DEFAULT '[]',
    
    -- E-signature fields
    requires_signature BOOLEAN DEFAULT false,
    signature_required_by UUID REFERENCES auth.users(id),
    signature_deadline TIMESTAMP WITH TIME ZONE,
    signature_status VARCHAR(20) DEFAULT 'not_required' CHECK (signature_status IN ('not_required', 'pending', 'signed', 'expired', 'declined')),
    signature_data JSONB,
    signed_by UUID REFERENCES auth.users(id),
    signed_at TIMESTAMP WITH TIME ZONE,
    
    -- Retention policy fields
    retention_policy_id UUID,
    retention_period_days INTEGER,
    auto_archive_date TIMESTAMP WITH TIME ZONE,
    auto_delete_date TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by UUID REFERENCES auth.users(id),
    
    -- Compliance fields
    compliance_category VARCHAR(50),
    gdpr_applicable BOOLEAN DEFAULT false,
    data_classification VARCHAR(20) DEFAULT 'internal',
    encryption_status VARCHAR(20) DEFAULT 'encrypted',
    
    -- Version control
    version_number INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES document_vault(id),
    is_latest_version BOOLEAN DEFAULT true,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document access logs (audit trail)
CREATE TABLE IF NOT EXISTS document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES document_vault(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL, -- view, download, edit, delete, approve, reject, sign, etc.
    action_details JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document signatures
CREATE TABLE IF NOT EXISTS document_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES document_vault(id) ON DELETE CASCADE,
    signer_id UUID NOT NULL REFERENCES auth.users(id),
    signature_type VARCHAR(20) DEFAULT 'electronic' CHECK (signature_type IN ('electronic', 'digital', 'wet_signature')),
    signature_data JSONB NOT NULL, -- Contains signature image, coordinates, etc.
    signature_hash VARCHAR(64), -- For integrity verification
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    is_valid BOOLEAN DEFAULT true,
    validation_details JSONB
);

-- Retention policies
CREATE TABLE IF NOT EXISTS retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    document_types TEXT[] NOT NULL,
    categories TEXT[] NOT NULL,
    retention_period_days INTEGER NOT NULL,
    archive_after_days INTEGER,
    delete_after_days INTEGER,
    compliance_requirements TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document workflows
CREATE TABLE IF NOT EXISTS document_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES document_vault(id) ON DELETE CASCADE,
    workflow_type VARCHAR(50) NOT NULL,
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
    workflow_data JSONB DEFAULT '{}',
    started_by UUID REFERENCES auth.users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES auth.users(id)
);

-- Workflow steps
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES document_workflows(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- approval, review, signature, notification
    assigned_to UUID REFERENCES auth.users(id),
    assigned_role VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'rejected')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES auth.users(id),
    step_data JSONB DEFAULT '{}',
    comments TEXT
);

-- Document comments and annotations
CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES document_vault(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'general' CHECK (comment_type IN ('general', 'review', 'approval', 'rejection', 'annotation')),
    is_internal BOOLEAN DEFAULT true,
    parent_comment_id UUID REFERENCES document_comments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document sharing and collaboration
CREATE TABLE IF NOT EXISTS document_sharing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES document_vault(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES auth.users(id),
    shared_with_role VARCHAR(50),
    shared_by UUID NOT NULL REFERENCES auth.users(id),
    permission_level VARCHAR(20) DEFAULT 'view' CHECK (permission_level IN ('view', 'comment', 'edit', 'admin')),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_vault_employee_id ON document_vault(employee_id);
CREATE INDEX IF NOT EXISTS idx_document_vault_status ON document_vault(status);
CREATE INDEX IF NOT EXISTS idx_document_vault_access_level ON document_vault(access_level);
CREATE INDEX IF NOT EXISTS idx_document_vault_upload_date ON document_vault(upload_date);
CREATE INDEX IF NOT EXISTS idx_document_vault_retention ON document_vault(auto_archive_date, auto_delete_date);
CREATE INDEX IF NOT EXISTS idx_document_vault_signature ON document_vault(requires_signature, signature_status);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_document_id ON document_access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_user_id ON document_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_accessed_at ON document_access_logs(accessed_at);
CREATE INDEX IF NOT EXISTS idx_document_signatures_document_id ON document_signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_signer_id ON document_signatures(signer_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_assigned_to ON workflow_steps(assigned_to);
CREATE INDEX IF NOT EXISTS idx_document_comments_document_id ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_sharing_document_id ON document_sharing(document_id);

-- RLS Policies
ALTER TABLE document_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sharing ENABLE ROW LEVEL SECURITY;

-- Document vault RLS policies
CREATE POLICY "Users can view documents they have access to" ON document_vault
    FOR SELECT USING (
        -- Public documents
        access_level = 'public' OR
        -- User has specific access (convert JSONB array to text array)
        auth.uid()::text = ANY(SELECT jsonb_array_elements_text(allowed_users)) OR
        -- User has required role
        EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN user_roles ur ON ura.role_id = ur.id
            WHERE ura.user_id = auth.uid() 
            AND ura.is_active = true
            AND ur.name = ANY(SELECT jsonb_array_elements_text(required_roles))
        ) OR
        -- User is the uploader or employee
        auth.uid() = uploaded_by OR
        auth.uid() = employee_id
    );

CREATE POLICY "Users can insert documents" ON document_vault
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update documents they have edit access to" ON document_vault
    FOR UPDATE USING (
        auth.uid() = uploaded_by OR
        EXISTS (
            SELECT 1 FROM document_sharing ds
            WHERE ds.document_id = id
            AND ds.shared_with_user_id = auth.uid()
            AND ds.permission_level IN ('edit', 'admin')
            AND ds.is_active = true
        )
    );

-- Access logs RLS policies
CREATE POLICY "Users can view their own access logs" ON document_access_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert access logs" ON document_access_logs
    FOR INSERT WITH CHECK (true);

-- Signatures RLS policies
CREATE POLICY "Users can view signatures for documents they have access to" ON document_signatures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM document_vault dv
            WHERE dv.id = document_id
            AND (
                dv.access_level = 'public' OR
                auth.uid() = ANY(SELECT jsonb_array_elements_text(dv.allowed_users)) OR
                auth.uid() = dv.uploaded_by OR
                auth.uid() = dv.employee_id
            )
        )
    );

-- Insert initial roles
INSERT INTO user_roles (name, description, permissions) VALUES
('super_admin', 'Super Administrator with full system access', '{"documents": {"all": true}, "users": {"all": true}, "settings": {"all": true}}'),
('hr_manager', 'HR Manager with full document access', '{"documents": {"all": true}, "employees": {"all": true}}'),
('hr_specialist', 'HR Specialist with standard document access', '{"documents": {"view": true, "upload": true, "edit": true}, "employees": {"view": true, "edit": true}}'),
('manager', 'Department Manager with team document access', '{"documents": {"view": true, "upload": true}, "employees": {"view": true}}'),
('employee', 'Employee with personal document access', '{"documents": {"view": true, "upload": true}, "employees": {"view": "own"}}'),
('auditor', 'Auditor with read-only access to all documents', '{"documents": {"view": true}, "audit": {"all": true}}')
ON CONFLICT (name) DO NOTHING;

-- Insert sample retention policies
INSERT INTO retention_policies (name, description, document_types, categories, retention_period_days, archive_after_days, delete_after_days, compliance_requirements) VALUES
('Employee Records', 'Standard retention for employee documents', ARRAY['academic', 'resume', 'passport', 'national-id'], ARRAY['employee-document'], 2555, 1825, 2555, ARRAY['GDPR', 'Labor Law']),
('Medical Records', 'Medical document retention policy', ARRAY['medical'], ARRAY['employee-document'], 1825, 1095, 1825, ARRAY['Medical Privacy', 'GDPR']),
('Financial Documents', 'Payroll and financial document retention', ARRAY['payroll', 'financial'], ARRAY['employee-document'], 2555, 1825, 2555, ARRAY['Tax Law', 'Financial Regulations']),
('Training Materials', 'Training content retention', ARRAY['training'], ARRAY['training-content'], 1095, 730, 1095, ARRAY['Training Records']),
('Company Assets', 'Company logo and asset retention', ARRAY['company-logo'], ARRAY['company-asset'], 3650, 2555, 3650, ARRAY['Brand Guidelines'])
ON CONFLICT DO NOTHING;

-- Functions for document management
CREATE OR REPLACE FUNCTION log_document_access(
    p_document_id UUID,
    p_action VARCHAR(50),
    p_action_details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO document_access_logs (document_id, user_id, action, action_details, ip_address, user_agent)
    VALUES (
        p_document_id,
        auth.uid(),
        p_action,
        p_action_details,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check document access
CREATE OR REPLACE FUNCTION check_document_access(p_document_id UUID) RETURNS BOOLEAN AS $$
DECLARE
    doc_access_level VARCHAR(20);
    doc_required_roles JSONB;
    doc_allowed_users JSONB;
    user_has_role BOOLEAN := FALSE;
BEGIN
    SELECT access_level, required_roles, allowed_users
    INTO doc_access_level, doc_required_roles, doc_allowed_users
    FROM document_vault
    WHERE id = p_document_id;
    
    -- Check if user has specific access
    IF auth.uid()::text = ANY(SELECT jsonb_array_elements_text(doc_allowed_users)) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has required role
    IF doc_required_roles IS NOT NULL AND jsonb_array_length(doc_required_roles) > 0 THEN
        SELECT EXISTS (
            SELECT 1 FROM user_role_assignments ura
            JOIN user_roles ur ON ura.role_id = ur.id
            WHERE ura.user_id = auth.uid() 
            AND ura.is_active = true
            AND ur.name = ANY(SELECT jsonb_array_elements_text(doc_required_roles))
        ) INTO user_has_role;
        
        IF user_has_role THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    -- Check access level
    IF doc_access_level = 'public' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible documents
CREATE OR REPLACE FUNCTION get_accessible_documents() RETURNS TABLE (
    id UUID,
    file_name VARCHAR(255),
    document_type VARCHAR(50),
    status VARCHAR(20),
    upload_date TIMESTAMP WITH TIME ZONE,
    access_level VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT dv.id, dv.file_name, dv.document_type, dv.status, dv.upload_date, dv.access_level
    FROM document_vault dv
    WHERE check_document_access(dv.id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_document_vault_updated_at BEFORE UPDATE ON document_vault FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_retention_policies_updated_at BEFORE UPDATE ON retention_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_comments_updated_at BEFORE UPDATE ON document_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE document_vault IS 'Enhanced document vault with RBAC, e-signatures, and retention policies';
COMMENT ON TABLE document_access_logs IS 'Audit trail for all document access and actions';
COMMENT ON TABLE document_signatures IS 'E-signature data for documents';
COMMENT ON TABLE retention_policies IS 'Document retention and compliance policies';
COMMENT ON TABLE document_workflows IS 'Document approval and review workflows';
COMMENT ON TABLE workflow_steps IS 'Individual steps in document workflows';
COMMENT ON TABLE document_comments IS 'Comments and annotations on documents';
COMMENT ON TABLE document_sharing IS 'Document sharing and collaboration settings';
