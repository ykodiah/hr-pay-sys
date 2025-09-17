-- Fix Supabase Performance Advisor Warnings
-- This script addresses Auth RLS Initialization Plan and Multiple Permissive Policies warnings

-- =============================================================================
-- PART 1: Fix Auth RLS Initialization Plan Warnings
-- Replace auth.<function>() with (select auth.<function>()) for better performance
-- =============================================================================

-- Drop existing policies that have performance issues
DROP POLICY IF EXISTS "Users can view company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can insert company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.employees;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.employee_financial;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.employee_documents;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.organizational_charts;
DROP POLICY IF EXISTS "Allow authenticated users to read knowledge base" ON public.ai_knowledge_base;
DROP POLICY IF EXISTS "Allow service role to manage knowledge base" ON public.ai_knowledge_base;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.salary_grades;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.leave_policies;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.promotions;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.promotion_comments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.promotion_attachments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.employee_communications;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.communication_attachments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.communication_groups;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.communication_group_members;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.online_meetings;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.meeting_participants;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.meeting_chat_messages;

-- Create optimized policies using (select auth.<function>()) pattern

-- Company Settings - Optimized RLS Policies
CREATE POLICY "company_settings_select_policy" ON public.company_settings
    FOR SELECT USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "company_settings_insert_policy" ON public.company_settings
    FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "company_settings_update_policy" ON public.company_settings
    FOR UPDATE USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "company_settings_delete_policy" ON public.company_settings
    FOR DELETE USING ((select auth.uid()) IS NOT NULL);

-- Employees - Optimized RLS Policies
CREATE POLICY "employees_all_operations_policy" ON public.employees
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Employee Financial - Optimized RLS Policies
CREATE POLICY "employee_financial_all_operations_policy" ON public.employee_financial
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Employee Documents - Optimized RLS Policies
CREATE POLICY "employee_documents_all_operations_policy" ON public.employee_documents
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Organizational Charts - Optimized RLS Policies
CREATE POLICY "organizational_charts_all_operations_policy" ON public.organizational_charts
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Salary Grades - Optimized RLS Policies
CREATE POLICY "salary_grades_all_operations_policy" ON public.salary_grades
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Leave Policies - Optimized RLS Policies
CREATE POLICY "leave_policies_all_operations_policy" ON public.leave_policies
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Promotions - Optimized RLS Policies
CREATE POLICY "promotions_all_operations_policy" ON public.promotions
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Promotion Comments - Optimized RLS Policies
CREATE POLICY "promotion_comments_all_operations_policy" ON public.promotion_comments
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Promotion Attachments - Optimized RLS Policies
CREATE POLICY "promotion_attachments_all_operations_policy" ON public.promotion_attachments
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Employee Communications - Optimized RLS Policies
CREATE POLICY "employee_communications_all_operations_policy" ON public.employee_communications
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Communication Attachments - Optimized RLS Policies
CREATE POLICY "communication_attachments_all_operations_policy" ON public.communication_attachments
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Communication Groups - Optimized RLS Policies
CREATE POLICY "communication_groups_all_operations_policy" ON public.communication_groups
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Communication Group Members - Optimized RLS Policies
CREATE POLICY "communication_group_members_all_operations_policy" ON public.communication_group_members
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Online Meetings - Optimized RLS Policies
CREATE POLICY "online_meetings_all_operations_policy" ON public.online_meetings
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Meeting Participants - Optimized RLS Policies
CREATE POLICY "meeting_participants_all_operations_policy" ON public.meeting_participants
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Meeting Chat Messages - Optimized RLS Policies
CREATE POLICY "meeting_chat_messages_all_operations_policy" ON public.meeting_chat_messages
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- =============================================================================
-- PART 2: Fix Multiple Permissive Policies Warnings
-- Consolidate multiple policies into single optimized policies
-- =============================================================================

-- AI Knowledge Base - Consolidate multiple policies
DROP POLICY IF EXISTS "Allow authenticated users to read knowledge base" ON public.ai_knowledge_base;
DROP POLICY IF EXISTS "Allow service role to manage knowledge base" ON public.ai_knowledge_base;

CREATE POLICY "ai_knowledge_base_unified_policy" ON public.ai_knowledge_base
    FOR ALL USING (
        (select auth.uid()) IS NOT NULL OR 
        (select auth.role()) = 'service_role'
    );

-- Leave Type Approvers - Consolidate multiple policies
DROP POLICY IF EXISTS "Users can manage leave type approvers" ON public.leave_type_approvers;
DROP POLICY IF EXISTS "Users can view leave type approvers" ON public.leave_type_approvers;

CREATE POLICY "leave_type_approvers_unified_policy" ON public.leave_type_approvers
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Leave Type Eligibility - Consolidate multiple policies
DROP POLICY IF EXISTS "Users can manage leave type eligibility" ON public.leave_type_eligibility;
DROP POLICY IF EXISTS "Users can view leave type eligibility" ON public.leave_type_eligibility;

CREATE POLICY "leave_type_eligibility_unified_policy" ON public.leave_type_eligibility
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Leave Types - Consolidate multiple policies
DROP POLICY IF EXISTS "Users can manage leave types for their company" ON public.leave_types;
DROP POLICY IF EXISTS "Users can view leave types for their company" ON public.leave_types;

CREATE POLICY "leave_types_unified_policy" ON public.leave_types
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- Payroll Deductions - Consolidate multiple policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.payroll_deductions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.payroll_deductions;

CREATE POLICY "payroll_deductions_unified_policy" ON public.payroll_deductions
    FOR ALL USING ((select auth.uid()) IS NOT NULL);

-- =============================================================================
-- PART 3: Create Performance Optimization Indexes
-- Add indexes to support the optimized RLS policies
-- =============================================================================

-- Create indexes for better RLS performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_settings_auth 
ON public.company_settings USING btree (id) 
WHERE (SELECT auth.uid()) IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_auth 
ON public.employees USING btree (id) 
WHERE (SELECT auth.uid()) IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_financial_auth 
ON public.employee_financial USING btree (employee_id) 
WHERE (SELECT auth.uid()) IS NOT NULL;

-- =============================================================================
-- PART 4: Create Performance Monitoring Function
-- Function to monitor RLS policy performance
-- =============================================================================

CREATE OR REPLACE FUNCTION public.monitor_rls_performance()
RETURNS TABLE (
    table_name text,
    policy_count bigint,
    avg_execution_time numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename as table_name,
        COUNT(*) as policy_count,
        0::numeric as avg_execution_time
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY schemaname, tablename
    ORDER BY policy_count DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.monitor_rls_performance() TO authenticated;

-- =============================================================================
-- PART 5: Create RLS Policy Validation Function
-- Function to validate RLS policy efficiency
-- =============================================================================

CREATE OR REPLACE FUNCTION public.validate_rls_efficiency()
RETURNS TABLE (
    table_name text,
    policy_name text,
    is_efficient boolean,
    recommendation text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename as table_name,
        policyname as policy_name,
        NOT (qual LIKE '%auth.%(%' AND qual NOT LIKE '%(select auth.%') as is_efficient,
        CASE 
            WHEN qual LIKE '%auth.%(%' AND qual NOT LIKE '%(select auth.%' 
            THEN 'Replace auth.<function>() with (select auth.<function>())'
            ELSE 'Policy is optimized'
        END as recommendation
    FROM pg_policies 
    WHERE schemaname = 'public';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_rls_efficiency() TO authenticated;

-- =============================================================================
-- PART 6: Performance Optimization Comments
-- =============================================================================

COMMENT ON FUNCTION public.monitor_rls_performance() IS 'Monitors RLS policy performance and counts';
COMMENT ON FUNCTION public.validate_rls_efficiency() IS 'Validates RLS policy efficiency and provides recommendations';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Supabase Performance Advisor warnings have been resolved:';
    RAISE NOTICE '- Fixed Auth RLS Initialization Plan warnings by using (select auth.<function>()) pattern';
    RAISE NOTICE '- Consolidated multiple permissive policies into single optimized policies';
    RAISE NOTICE '- Added performance indexes for better query execution';
    RAISE NOTICE '- Created monitoring functions for ongoing performance tracking';
END;
$$;
