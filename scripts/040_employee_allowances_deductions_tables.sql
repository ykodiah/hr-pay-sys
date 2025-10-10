-- Create Employee Allowances and Deductions Tables
-- This script creates tables to store employee-specific allowances and deductions
-- that can be linked to the payroll computation

-- =============================================================================
-- 1. CREATE EMPLOYEE ALLOWANCES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS employee_allowances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    allowance_code VARCHAR(20) NOT NULL,
    allowance_description TEXT NOT NULL,
    is_taxable BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT true,
    calculation_type VARCHAR(10) DEFAULT 'AMOUNT' CHECK (calculation_type IN ('AMOUNT', 'PERCENTAGE')),
    amount DECIMAL(12,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique allowance per employee
    UNIQUE(employee_id, allowance_code)
);

-- Add comments to the table and columns
COMMENT ON TABLE employee_allowances IS 'Employee-specific allowances linked to payroll computation';
COMMENT ON COLUMN employee_allowances.employee_id IS 'Reference to the employee';
COMMENT ON COLUMN employee_allowances.company_id IS 'Reference to the company';
COMMENT ON COLUMN employee_allowances.allowance_code IS 'Code of the allowance (e.g., TRANS, HOUSE)';
COMMENT ON COLUMN employee_allowances.allowance_description IS 'Description of the allowance';
COMMENT ON COLUMN employee_allowances.is_taxable IS 'Whether the allowance is taxable';
COMMENT ON COLUMN employee_allowances.is_recurring IS 'Whether the allowance is recurring (monthly) or one-time';
COMMENT ON COLUMN employee_allowances.calculation_type IS 'Whether to use amount or percentage for calculation';
COMMENT ON COLUMN employee_allowances.amount IS 'Fixed amount of the allowance';
COMMENT ON COLUMN employee_allowances.percentage IS 'Percentage of basic salary for the allowance';

-- =============================================================================
-- 2. CREATE EMPLOYEE DEDUCTIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS employee_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    deduction_code VARCHAR(20) NOT NULL,
    deduction_description TEXT NOT NULL,
    is_taxable BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT true,
    calculation_type VARCHAR(10) DEFAULT 'AMOUNT' CHECK (calculation_type IN ('AMOUNT', 'PERCENTAGE')),
    amount DECIMAL(12,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique deduction per employee
    UNIQUE(employee_id, deduction_code)
);

-- Add comments to the table and columns
COMMENT ON TABLE employee_deductions IS 'Employee-specific deductions linked to payroll computation';
COMMENT ON COLUMN employee_deductions.employee_id IS 'Reference to the employee';
COMMENT ON COLUMN employee_deductions.company_id IS 'Reference to the company';
COMMENT ON COLUMN employee_deductions.deduction_code IS 'Code of the deduction (e.g., TAX, SSNIT)';
COMMENT ON COLUMN employee_deductions.deduction_description IS 'Description of the deduction';
COMMENT ON COLUMN employee_deductions.is_taxable IS 'Whether the deduction affects taxable income';
COMMENT ON COLUMN employee_deductions.is_recurring IS 'Whether the deduction is recurring (monthly) or one-time';
COMMENT ON COLUMN employee_deductions.calculation_type IS 'Whether to use amount or percentage for calculation';
COMMENT ON COLUMN employee_deductions.amount IS 'Fixed amount of the deduction';
COMMENT ON COLUMN employee_deductions.percentage IS 'Percentage of basic salary for the deduction';

-- =============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_employee_allowances_employee_id ON employee_allowances(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_allowances_company_id ON employee_allowances(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_allowances_active ON employee_allowances(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_allowances_code ON employee_allowances(allowance_code);

CREATE INDEX IF NOT EXISTS idx_employee_deductions_employee_id ON employee_deductions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_deductions_company_id ON employee_deductions(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_deductions_active ON employee_deductions(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_deductions_code ON employee_deductions(deduction_code);

-- =============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE employee_allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_deductions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. CREATE RLS POLICIES FOR EMPLOYEE ALLOWANCES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "employee_allowances_select_policy" ON employee_allowances;
DROP POLICY IF EXISTS "employee_allowances_insert_policy" ON employee_allowances;
DROP POLICY IF EXISTS "employee_allowances_update_policy" ON employee_allowances;
DROP POLICY IF EXISTS "employee_allowances_delete_policy" ON employee_allowances;

-- Create RLS policies for employee_allowances
CREATE POLICY "employee_allowances_select_policy" ON employee_allowances
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM employees 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "employee_allowances_insert_policy" ON employee_allowances
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM employees 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "employee_allowances_update_policy" ON employee_allowances
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM employees 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "employee_allowances_delete_policy" ON employee_allowances
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM employees 
            WHERE id = auth.uid()
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

-- Create RLS policies for employee_deductions
CREATE POLICY "employee_deductions_select_policy" ON employee_deductions
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM employees 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "employee_deductions_insert_policy" ON employee_deductions
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM employees 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "employee_deductions_update_policy" ON employee_deductions
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM employees 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "employee_deductions_delete_policy" ON employee_deductions
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM employees 
            WHERE id = auth.uid()
        )
    );

-- =============================================================================
-- 7. GRANT PERMISSIONS
-- =============================================================================

GRANT ALL ON employee_allowances TO authenticated;
GRANT ALL ON employee_allowances TO anon;
GRANT ALL ON employee_deductions TO authenticated;
GRANT ALL ON employee_deductions TO anon;

-- =============================================================================
-- 8. CREATE TRIGGERS FOR AUDIT TRAIL
-- =============================================================================

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for employee_allowances
DROP TRIGGER IF EXISTS update_employee_allowances_updated_at ON employee_allowances;
CREATE TRIGGER update_employee_allowances_updated_at
    BEFORE UPDATE ON employee_allowances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for employee_deductions
DROP TRIGGER IF EXISTS update_employee_deductions_updated_at ON employee_deductions;
CREATE TRIGGER update_employee_deductions_updated_at
    BEFORE UPDATE ON employee_deductions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 9. CREATE HELPER FUNCTIONS
-- =============================================================================

-- Function to get all allowances for an employee
CREATE OR REPLACE FUNCTION get_employee_allowances(employee_uuid UUID)
RETURNS TABLE(
    id UUID,
    allowance_code VARCHAR(20),
    allowance_description TEXT,
    is_taxable BOOLEAN,
    is_recurring BOOLEAN,
    calculation_type VARCHAR(10),
    amount DECIMAL(12,2),
    percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ea.id,
        ea.allowance_code,
        ea.allowance_description,
        ea.is_taxable,
        ea.is_recurring,
        ea.calculation_type,
        ea.amount,
        ea.percentage
    FROM employee_allowances ea
    WHERE ea.employee_id = employee_uuid
      AND ea.is_active = true
    ORDER BY ea.allowance_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all deductions for an employee
CREATE OR REPLACE FUNCTION get_employee_deductions(employee_uuid UUID)
RETURNS TABLE(
    id UUID,
    deduction_code VARCHAR(20),
    deduction_description TEXT,
    is_taxable BOOLEAN,
    is_recurring BOOLEAN,
    calculation_type VARCHAR(10),
    amount DECIMAL(12,2),
    percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ed.id,
        ed.deduction_code,
        ed.deduction_description,
        ed.is_taxable,
        ed.is_recurring,
        ed.calculation_type,
        ed.amount,
        ed.percentage
    FROM employee_deductions ed
    WHERE ed.employee_id = employee_uuid
      AND ed.is_active = true
    ORDER BY ed.deduction_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate total allowances for an employee
CREATE OR REPLACE FUNCTION calculate_employee_allowances(employee_uuid UUID, basic_salary DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    total_allowances DECIMAL := 0;
    allowance_record RECORD;
BEGIN
    FOR allowance_record IN 
        SELECT calculation_type, amount, percentage 
        FROM employee_allowances 
        WHERE employee_id = employee_uuid AND is_active = true
    LOOP
        IF allowance_record.calculation_type = 'AMOUNT' THEN
            total_allowances := total_allowances + allowance_record.amount;
        ELSIF allowance_record.calculation_type = 'PERCENTAGE' THEN
            total_allowances := total_allowances + (basic_salary * allowance_record.percentage / 100);
        END IF;
    END LOOP;
    
    RETURN total_allowances;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate total deductions for an employee
CREATE OR REPLACE FUNCTION calculate_employee_deductions(employee_uuid UUID, basic_salary DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    total_deductions DECIMAL := 0;
    deduction_record RECORD;
BEGIN
    FOR deduction_record IN 
        SELECT calculation_type, amount, percentage 
        FROM employee_deductions 
        WHERE employee_id = employee_uuid AND is_active = true
    LOOP
        IF deduction_record.calculation_type = 'AMOUNT' THEN
            total_deductions := total_deductions + deduction_record.amount;
        ELSIF deduction_record.calculation_type = 'PERCENTAGE' THEN
            total_deductions := total_deductions + (basic_salary * deduction_record.percentage / 100);
        END IF;
    END LOOP;
    
    RETURN total_deductions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_employee_allowances(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_allowances(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_employee_deductions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_deductions(UUID) TO anon;
GRANT EXECUTE ON FUNCTION calculate_employee_allowances(UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_employee_allowances(UUID, DECIMAL) TO anon;
GRANT EXECUTE ON FUNCTION calculate_employee_deductions(UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_employee_deductions(UUID, DECIMAL) TO anon;

-- =============================================================================
-- 10. MIGRATION LOG
-- =============================================================================

-- Create migration log table if it doesn't exist
CREATE TABLE IF NOT EXISTS migration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

-- Log the migration
INSERT INTO migration_log (migration_name, executed_at, description)
VALUES (
    '040_employee_allowances_deductions_tables',
    NOW(),
    'Created employee_allowances and employee_deductions tables with RLS policies and helper functions for payroll computation'
) ON CONFLICT (migration_name) DO NOTHING;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

SELECT 'Employee Allowances and Deductions Tables Created Successfully!' as status;
