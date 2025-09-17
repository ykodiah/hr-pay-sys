-- Fix Supabase Performance Advisor warnings for unindexed foreign keys
-- This script adds covering indexes for all foreign key constraints to improve query performance

-- Communication tables indexes
CREATE INDEX IF NOT EXISTS idx_communication_attachments_message_id 
ON public.communication_attachments (message_id);

CREATE INDEX IF NOT EXISTS idx_communication_groups_created_by 
ON public.communication_groups (created_by);

CREATE INDEX IF NOT EXISTS idx_employee_communications_company_id 
ON public.employee_communications (company_id);

-- Company and file management indexes
CREATE INDEX IF NOT EXISTS idx_companies_logo_file_id 
ON public.companies (logo_file_id);

CREATE INDEX IF NOT EXISTS idx_company_files_uploaded_by 
ON public.company_files (uploaded_by);

-- Employee related indexes
CREATE INDEX IF NOT EXISTS idx_employees_company_id 
ON public.employees (company_id);

CREATE INDEX IF NOT EXISTS idx_employees_department_id 
ON public.employees (department_id);

CREATE INDEX IF NOT EXISTS idx_employees_position_id 
ON public.employees (position_id);

CREATE INDEX IF NOT EXISTS idx_employee_financial_employee_id 
ON public.employee_financial (employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id 
ON public.employee_documents (employee_id);

-- Leave management indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id 
ON public.leave_requests (employee_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_leave_type_id 
ON public.leave_requests (leave_type_id);

CREATE INDEX IF NOT EXISTS idx_leave_type_approvers_leave_type_id 
ON public.leave_type_approvers (leave_type_id);

CREATE INDEX IF NOT EXISTS idx_leave_type_approvers_approver_id 
ON public.leave_type_approvers (approver_id);

CREATE INDEX IF NOT EXISTS idx_leave_type_eligibility_leave_type_id 
ON public.leave_type_eligibility (leave_type_id);

-- Payroll indexes
CREATE INDEX IF NOT EXISTS idx_payroll_allowances_company_id 
ON public.payroll_allowances (company_id);

CREATE INDEX IF NOT EXISTS idx_payroll_deductions_company_id 
ON public.payroll_deductions (company_id);

-- Subsidiary indexes
CREATE INDEX IF NOT EXISTS idx_subsidiaries_company_id 
ON public.subsidiaries (company_id);

CREATE INDEX IF NOT EXISTS idx_subsidiaries_logo_file_id 
ON public.subsidiaries (logo_file_id);

-- Organizational structure indexes
CREATE INDEX IF NOT EXISTS idx_organizational_charts_company_id 
ON public.organizational_charts (company_id);

CREATE INDEX IF NOT EXISTS idx_organizational_charts_parent_id 
ON public.organizational_charts (parent_id);

-- Roles and permissions indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON public.user_roles (user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_role_id 
ON public.user_roles (role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id 
ON public.role_permissions (role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id 
ON public.role_permissions (permission_id);

CREATE INDEX IF NOT EXISTS idx_access_logs_user_id 
ON public.access_logs (user_id);

-- Meeting and communication indexes
CREATE INDEX IF NOT EXISTS idx_meetings_company_id 
ON public.meetings (company_id);

CREATE INDEX IF NOT EXISTS idx_meetings_created_by 
ON public.meetings (created_by);

-- AI and analytics indexes
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_company_id 
ON public.ai_knowledge_base (company_id);

CREATE INDEX IF NOT EXISTS idx_security_analytics_company_id 
ON public.security_analytics (company_id);

-- Composite indexes for frequently queried combinations
CREATE INDEX IF NOT EXISTS idx_employees_company_status 
ON public.employees (company_id, status);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_status 
ON public.leave_requests (employee_id, status);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_active 
ON public.user_roles (user_id, is_active);

-- Performance optimization comment
COMMENT ON INDEX idx_communication_attachments_message_id IS 'Improves performance for message attachment queries';
COMMENT ON INDEX idx_employees_company_status IS 'Composite index for employee filtering by company and status';
COMMENT ON INDEX idx_leave_requests_employee_status IS 'Composite index for leave request queries by employee and status';

-- Analyze tables to update statistics after index creation
ANALYZE public.communication_attachments;
ANALYZE public.communication_groups;
ANALYZE public.companies;
ANALYZE public.company_files;
ANALYZE public.employees;
ANALYZE public.employee_communications;
ANALYZE public.leave_requests;
ANALYZE public.subsidiaries;
ANALYZE public.user_roles;
ANALYZE public.role_permissions;
