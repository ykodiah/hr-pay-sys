-- Employee Allowances and Deductions Schema
-- This script creates tables for employee-specific allowances and deductions
-- Run this script to add the new functionality for employee financial management

-- =============================================================================
-- MIGRATION OVERVIEW
-- =============================================================================
-- 1. Create employee_allowances table for employee-specific allowances
-- 2. Create employee_deductions table for employee-specific deductions
-- 3. Create indexes for performance
-- 4. Enable RLS and create policies
-- 5. Create helper functions
-- 6. Insert sample data

-- =============================================================================
-- 1. CREATE EMPLOYEE ALLOWANCES TABLE
-- =============================================================================

-- Create employee_allowances table
CREATE TABLE IF NOT EXISTS employee_allowances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    allowance_id UUID NOT NULL REFERENCES payroll_allowances(id) ON DELETE CASCADE,
    taxable BOOLEAN NOT NULL DEFAULT false,
    recurring BOOLEAN NOT NULL DEFAULT true,
    amount DECIMAL(12,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    calculation_type VARCHAR(10) NOT NULL DEFAULT 'AMOUNT' CHECK (calculation_type IN ('AMOUNT', 'PERCENTAGE')),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique active allowance per employee
    UNIQUE(employee_id, allowance_id, effective_date) DEFERRABLE INITIALLY DEFERRED
);

-- Add comments to the table and columns
COMMENT ON TABLE employee_allowances IS 'Employee-specific allowances with taxable status, recurring nature, and calculation type';
COMMENT ON COLUMN employee_allowances.employee_id IS 'Reference to the employee';
COMMENT ON COLUMN employee_allowances.allowance_id IS 'Reference to the payroll allowance template';
COMMENT ON COLUMN employee_allowances.taxable IS 'Whether this allowance is taxable for the employee';
COMMENT ON COLUMN employee_allowances.recurring IS 'Whether this allowance is recurring or one-time';
COMMENT ON COLUMN employee_allowances.amount IS 'Fixed amount for the allowance (when calculation_type is AMOUNT)';
COMMENT ON COLUMN employee_allowances.percentage IS 'Percentage of basic salary (when calculation_type is PERCENTAGE)';
COMMENT ON COLUMN employee_allowances.calculation_type IS 'How the allowance is calculated: AMOUNT or PERCENTAGE';
COMMENT ON COLUMN employee_allowances.effective_date IS 'Date when this allowance becomes effective';
COMMENT ON COLUMN employee_allowances.end_date IS 'Date when this allowance ends (NULL for ongoing)';
COMMENT ON COLUMN employee_allowances.is_active IS 'Whether this allowance is currently active';
COMMENT ON COLUMN employee_allowances.created_by IS 'User who created this allowance assignment';

-- =============================================================================
-- 2. CREATE EMPLOYEE DEDUCTIONS TABLE
-- =============================================================================

-- Create employee_deductions table
CREATE TABLE IF NOT EXISTS employee_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    deduction_id UUID NOT NULL REFERENCES payroll_deductions(id) ON DELETE CASCADE,
    taxable BOOLEAN NOT NULL DEFAULT false,
    recurring BOOLEAN NOT NULL DEFAULT true,
    amount DECIMAL(12,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    calculation_type VARCHAR(10) NOT NULL DEFAULT 'AMOUNT' CHECK (calculation_type IN ('AMOUNT', 'PERCENTAGE')),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique active deduction per employee
    UNIQUE(employee_id, deduction_id, effective_date) DEFERRABLE INITIALLY DEFERRED
);

-- Add comments to the table and columns
COMMENT ON TABLE employee_deductions IS 'Employee-specific deductions with taxable status, recurring nature, and calculation type';
COMMENT ON COLUMN employee_deductions.employee_id IS 'Reference to the employee';
COMMENT ON COLUMN employee_deductions.deduction_id IS 'Reference to the payroll deduction template';
COMMENT ON COLUMN employee_deductions.taxable IS 'Whether this deduction is taxable for the employee';
COMMENT ON COLUMN employee_deductions.recurring IS 'Whether this deduction is recurring or one-time';
COMMENT ON COLUMN employee_deductions.amount IS 'Fixed amount for the deduction (when calculation_type is AMOUNT)';
COMMENT ON COLUMN employee_deductions.percentage IS 'Percentage of basic salary (when calculation_type is PERCENTAGE)';
COMMENT ON COLUMN employee_deductions.calculation_type IS 'How the deduction is calculated: AMOUNT or PERCENTAGE';
COMMENT ON COLUMN employee_deductions.effective_date IS 'Date when this deduction becomes effective';
COMMENT ON COLUMN employee_deductions.end_date IS 'Date when this deduction ends (NULL for ongoing)';
COMMENT ON COLUMN employee_deductions.is_active IS 'Whether this deduction is currently active';
COMMENT ON COLUMN employee_deductions.created_by IS 'User who created this deduction assignment';

-- =============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Create indexes for employee_allowances table
CREATE INDEX IF NOT EXISTS idx_employee_allowances_employee_id ON employee_allowances(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_allowances_allowance_id ON employee_allowances(allowance_id);
CREATE INDEX IF NOT EXISTS idx_employee_allowances_active ON employee_allowances(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_allowances_effective_date ON employee_allowances(effective_date);
CREATE INDEX IF NOT EXISTS idx_employee_allowances_created_by ON employee_allowances(created_by);

-- Create indexes for employee_deductions table
CREATE INDEX IF NOT EXISTS idx_employee_deductions_employee_id ON employee_deductions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_deductions_deduction_id ON employee_deductions(deduction_id);
CREATE INDEX IF NOT EXISTS idx_employee_deductions_active ON employee_deductions(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_deductions_effective_date ON employee_deductions(effective_date);
CREATE INDEX IF NOT EXISTS idx_employee_deductions_created_by ON employee_deductions(created_by);

-- =============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on employee_allowances table
ALTER TABLE employee_allowances ENABLE ROW LEVEL SECURITY;

-- Enable RLS on employee_deductions table
ALTER TABLE employee_deductions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. CREATE RLS POLICIES FOR EMPLOYEE ALLOWANCES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "employee_allowances_select_policy" ON employee_allowances;
DROP POLICY IF EXISTS "employee_allowances_insert_policy" ON employee_allowances;
DROP POLICY IF EXISTS "employee_allowances_update_policy" ON employee_allowances;
DROP POLICY IF EXISTS "employee_allowances_delete_policy" ON employee_allowances;

-- Replace is_authenticated() with auth.uid() IS NOT NULL
CREATE POLICY "employee_allowances_select_policy" ON employee_allowances
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND 
        employee_id IN (
            SELECT id FROM employees 
            WHERE company_id IN (
                SELECT company_id FROM employees 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "employee_allowances_insert_policy" ON employee_allowances
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        employee_id IN (
            SELECT id FROM employees 
            WHERE company_id IN (
                SELECT company_id FROM employees 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "employee_allowances_update_policy" ON employee_allowances
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND 
        employee_id IN (
            SELECT id FROM employees 
            WHERE company_id IN (
                SELECT company_id FROM employees 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "employee_allowances_delete_policy" ON employee_allowances
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND 
        employee_id IN (
            SELECT id FROM employees 
            WHERE company_id IN (
                SELECT company_id FROM employees 
                WHERE id = auth.uid()
            )
        )
    );

-- =============================================================================
-- 6. CREATE RLS POLICIES FOR EMPLOYEE DEDUCTIONS
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "employee_deductions_select_policy" ON employee_deductions;
DROP POLICY IF EXISTS "employee_deductions_insert_policy" ON employee_deductions;
DROP POLICY IF EXISTS "employee_deductions_update_policy" ON employee_deductions;
DROP POLICY IF EXISTS "employee_deductions_delete_policy" ON employee_deductions;

-- Replace is_authenticated() with auth.uid() IS NOT NULL
CREATE POLICY "employee_deductions_select_policy" ON employee_deductions
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND 
        employee_id IN (
            SELECT id FROM employees 
            WHERE company_id IN (
                SELECT company_id FROM employees 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "employee_deductions_insert_policy" ON employee_deductions
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        employee_id IN (
            SELECT id FROM employees 
            WHERE company_id IN (
                SELECT company_id FROM employees 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "employee_deductions_update_policy" ON employee_deductions
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND 
        employee_id IN (
            SELECT id FROM employees 
            WHERE company_id IN (
                SELECT company_id FROM employees 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "employee_deductions_delete_policy" ON employee_deductions
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND 
        employee_id IN (
            SELECT id FROM employees 
            WHERE company_id IN (
                SELECT company_id FROM employees 
                WHERE id = auth.uid()
            )
        )
    );

-- =============================================================================
-- 7. GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions on employee_allowances table
GRANT ALL ON employee_allowances TO authenticated;
GRANT ALL ON employee_allowances TO anon;

-- Grant permissions on employee_deductions table
GRANT ALL ON employee_deductions TO authenticated;
GRANT ALL ON employee_deductions TO anon;

-- =============================================================================
-- 8. CREATE HELPER FUNCTIONS
-- =============================================================================

-- Function to get employee allowances with details
CREATE OR REPLACE FUNCTION get_employee_allowances(employee_uuid UUID)
RETURNS TABLE(
    id UUID,
    allowance_code VARCHAR(20),
    allowance_description TEXT,
    taxable BOOLEAN,
    recurring BOOLEAN,
    amount DECIMAL(12,2),
    percentage DECIMAL(5,2),
    calculation_type VARCHAR(10),
    effective_date DATE,
    end_date DATE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ea.id,
        pa.code as allowance_code,
        pa.description as allowance_description,
        ea.taxable,
        ea.recurring,
        ea.amount,
        ea.percentage,
        ea.calculation_type,
        ea.effective_date,
        ea.end_date,
        ea.is_active
    FROM employee_allowances ea
    JOIN payroll_allowances pa ON ea.allowance_id = pa.id
    WHERE ea.employee_id = employee_uuid
    AND ea.is_active = true
    ORDER BY pa.description;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get employee deductions with details
CREATE OR REPLACE FUNCTION get_employee_deductions(employee_uuid UUID)
RETURNS TABLE(
    id UUID,
    deduction_code VARCHAR(20),
    deduction_description TEXT,
    taxable BOOLEAN,
    recurring BOOLEAN,
    amount DECIMAL(12,2),
    percentage DECIMAL(5,2),
    calculation_type VARCHAR(10),
    effective_date DATE,
    end_date DATE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ed.id,
        pd.code as deduction_code,
        pd.description as deduction_description,
        ed.taxable,
        ed.recurring,
        ed.amount,
        ed.percentage,
        ed.calculation_type,
        ed.effective_date,
        ed.end_date,
        ed.is_active
    FROM employee_deductions ed
    JOIN payroll_deductions pd ON ed.deduction_id = pd.id
    WHERE ed.employee_id = employee_uuid
    AND ed.is_active = true
    ORDER BY pd.description;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate employee total allowances
CREATE OR REPLACE FUNCTION calculate_employee_allowances(employee_uuid UUID, basic_salary DECIMAL(12,2))
RETURNS TABLE(
    total_amount DECIMAL(12,2),
    taxable_amount DECIMAL(12,2),
    non_taxable_amount DECIMAL(12,2)
) AS $$
DECLARE
    total DECIMAL(12,2) := 0;
    taxable DECIMAL(12,2) := 0;
    non_taxable DECIMAL(12,2) := 0;
    allowance_amount DECIMAL(12,2);
BEGIN
    -- Calculate allowances
    FOR allowance_amount IN
        SELECT 
            CASE 
                WHEN ea.calculation_type = 'AMOUNT' THEN ea.amount
                WHEN ea.calculation_type = 'PERCENTAGE' THEN (basic_salary * ea.percentage / 100)
                ELSE 0
            END
        FROM employee_allowances ea
        WHERE ea.employee_id = employee_uuid
        AND ea.is_active = true
        AND (ea.end_date IS NULL OR ea.end_date >= CURRENT_DATE)
    LOOP
        total := total + allowance_amount;
    END LOOP;
    
    -- Calculate taxable vs non-taxable
    FOR allowance_amount IN
        SELECT 
            CASE 
                WHEN ea.calculation_type = 'AMOUNT' THEN ea.amount
                WHEN ea.calculation_type = 'PERCENTAGE' THEN (basic_salary * ea.percentage / 100)
                ELSE 0
            END
        FROM employee_allowances ea
        WHERE ea.employee_id = employee_uuid
        AND ea.is_active = true
        AND (ea.end_date IS NULL OR ea.end_date >= CURRENT_DATE)
    LOOP
        IF (SELECT ea.taxable FROM employee_allowances ea WHERE ea.employee_id = employee_uuid LIMIT 1) THEN
            taxable := taxable + allowance_amount;
        ELSE
            non_taxable := non_taxable + allowance_amount;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT total, taxable, non_taxable;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate employee total deductions
CREATE OR REPLACE FUNCTION calculate_employee_deductions(employee_uuid UUID, basic_salary DECIMAL(12,2))
RETURNS TABLE(
    total_amount DECIMAL(12,2),
    taxable_amount DECIMAL(12,2),
    non_taxable_amount DECIMAL(12,2)
) AS $$
DECLARE
    total DECIMAL(12,2) := 0;
    taxable DECIMAL(12,2) := 0;
    non_taxable DECIMAL(12,2) := 0;
    deduction_amount DECIMAL(12,2);
BEGIN
    -- Calculate deductions
    FOR deduction_amount IN
        SELECT 
            CASE 
                WHEN ed.calculation_type = 'AMOUNT' THEN ed.amount
                WHEN ed.calculation_type = 'PERCENTAGE' THEN (basic_salary * ed.percentage / 100)
                ELSE 0
            END
        FROM employee_deductions ed
        WHERE ed.employee_id = employee_uuid
        AND ed.is_active = true
        AND (ed.end_date IS NULL OR ed.end_date >= CURRENT_DATE)
    LOOP
        total := total + deduction_amount;
    END LOOP;
    
    -- Calculate taxable vs non-taxable
    FOR deduction_amount IN
        SELECT 
            CASE 
                WHEN ed.calculation_type = 'AMOUNT' THEN ed.amount
                WHEN ed.calculation_type = 'PERCENTAGE' THEN (basic_salary * ed.percentage / 100)
                ELSE 0
            END
        FROM employee_deductions ed
        WHERE ed.employee_id = employee_uuid
        AND ed.is_active = true
        AND (ed.end_date IS NULL OR ed.end_date >= CURRENT_DATE)
    LOOP
        IF (SELECT ed.taxable FROM employee_deductions ed WHERE ed.employee_id = employee_uuid LIMIT 1) THEN
            taxable := taxable + deduction_amount;
        ELSE
            non_taxable := non_taxable + deduction_amount;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT total, taxable, non_taxable;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_employee_allowances(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_allowances(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_employee_deductions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_deductions(UUID) TO anon;
GRANT EXECUTE ON FUNCTION calculate_employee_allowances(UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_employee_allowances(UUID, DECIMAL) TO anon;
GRANT EXECUTE ON FUNCTION calculate_employee_deductions(UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_employee_deductions(UUID, DECIMAL) TO anon;

-- =============================================================================
-- 9. CREATE TRIGGERS FOR AUDIT TRAIL
-- =============================================================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_employee_allowances_updated_at ON employee_allowances;
CREATE TRIGGER update_employee_allowances_updated_at
    BEFORE UPDATE ON employee_allowances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_deductions_updated_at ON employee_deductions;
CREATE TRIGGER update_employee_deductions_updated_at
    BEFORE UPDATE ON employee_deductions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 10. INSERT SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert sample allowances for testing (uncomment if needed)
-- INSERT INTO employee_allowances (employee_id, allowance_id, taxable, recurring, amount, calculation_type, created_by)
-- SELECT 
--     e.id as employee_id,
--     pa.id as allowance_id,
--     pa.taxable,
--     pa.recurring,
--     CASE 
--         WHEN pa.code = 'TRANS' THEN 500
--         WHEN pa.code = 'HOUSE' THEN 600
--         WHEN pa.code = 'MED' THEN 100
--         ELSE 0
--     END as amount,
--     'AMOUNT' as calculation_type,
--     (SELECT id FROM auth.users LIMIT 1) as created_by
-- FROM employees e
-- CROSS JOIN payroll_allowances pa
-- WHERE pa.code IN ('TRANS', 'HOUSE', 'MED')
-- AND e.id IN (SELECT id FROM employees LIMIT 3);

-- =============================================================================
-- 11. VERIFICATION
-- =============================================================================

-- Verify all changes
DO $$
DECLARE
    employee_allowances_exists BOOLEAN;
    employee_deductions_exists BOOLEAN;
    rls_enabled_allowances BOOLEAN;
    rls_enabled_deductions BOOLEAN;
    functions_exist BOOLEAN;
BEGIN
    -- Check if employee_allowances table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'employee_allowances'
    ) INTO employee_allowances_exists;
    
    -- Check if employee_deductions table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'employee_deductions'
    ) INTO employee_deductions_exists;
    
    -- Check if RLS is enabled on employee_allowances
    SELECT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'employee_allowances' 
        AND relrowsecurity = true
    ) INTO rls_enabled_allowances;
    
    -- Check if RLS is enabled on employee_deductions
    SELECT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'employee_deductions' 
        AND relrowsecurity = true
    ) INTO rls_enabled_deductions;
    
    -- Check if helper functions exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'get_employee_allowances'
    ) INTO functions_exist;
    
    -- Report results
    IF NOT employee_allowances_exists THEN
        RAISE EXCEPTION 'employee_allowances table not found';
    END IF;
    
    IF NOT employee_deductions_exists THEN
        RAISE EXCEPTION 'employee_deductions table not found';
    END IF;
    
    IF NOT rls_enabled_allowances THEN
        RAISE EXCEPTION 'RLS not enabled on employee_allowances table';
    END IF;
    
    IF NOT rls_enabled_deductions THEN
        RAISE EXCEPTION 'RLS not enabled on employee_deductions table';
    END IF;
    
    IF NOT functions_exist THEN
        RAISE EXCEPTION 'Helper functions not found';
    END IF;
    
    RAISE NOTICE 'Employee allowances and deductions schema created successfully!';
    RAISE NOTICE 'Changes applied:';
    RAISE NOTICE '- Created employee_allowances table with RLS policies';
    RAISE NOTICE '- Created employee_deductions table with RLS policies';
    RAISE NOTICE '- Created helper functions for calculations';
    RAISE NOTICE '- Created indexes for performance';
    RAISE NOTICE '- Created triggers for audit trail';
END $$;

-- =============================================================================
-- 12. LOG COMPLETION
-- =============================================================================

-- Log completion
INSERT INTO public.migration_log (migration_name, executed_at, description)
VALUES (
    '040_employee_allowances_deductions_schema',
    NOW(),
    'Created employee allowances and deductions tables with full functionality for employee financial management'
) ON CONFLICT DO NOTHING;

-- Final success message
SELECT 'Employee Allowances and Deductions Schema Created Successfully!' as status;
