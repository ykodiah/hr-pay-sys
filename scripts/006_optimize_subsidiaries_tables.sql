-- Optimize subsidiaries tables for system-wide usage
-- This script ensures proper indexes, constraints, and sample data

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subsidiaries_company_id ON subsidiaries(company_id);
CREATE INDEX IF NOT EXISTS idx_subsidiaries_status ON subsidiaries(status);
CREATE INDEX IF NOT EXISTS idx_subsidiaries_name ON subsidiaries(name);

-- Add indexes for employees subsidiary relationship
CREATE INDEX IF NOT EXISTS idx_employees_subsidiary_id ON employees(subsidiary_id);

-- Ensure foreign key constraints exist
ALTER TABLE subsidiaries 
ADD CONSTRAINT IF NOT EXISTS fk_subsidiaries_company_id 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE employees 
ADD CONSTRAINT IF NOT EXISTS fk_employees_subsidiary_id 
FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id) ON DELETE SET NULL;

-- Create a view for active subsidiaries with company info
CREATE OR REPLACE VIEW active_subsidiaries AS
SELECT 
    s.id,
    s.name,
    s.tax_id,
    s.ssnit_number,
    s.address,
    s.phone_number,
    s.email_address,
    s.divisions,
    s.departments,
    s.locations,
    s.logo_url,
    s.status,
    s.created_at,
    s.updated_at,
    c.name as company_name,
    c.id as company_id
FROM subsidiaries s
JOIN companies c ON s.company_id = c.id
WHERE s.status = 'active';

-- Create a function to get subsidiary options for dropdowns
CREATE OR REPLACE FUNCTION get_subsidiary_options()
RETURNS TABLE (
    id uuid,
    name text,
    divisions jsonb,
    departments jsonb,
    locations jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name::text,
        s.divisions,
        s.departments,
        s.locations
    FROM subsidiaries s
    WHERE s.status = 'active'
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql;

-- Insert sample company data if not exists
INSERT INTO companies (
    id,
    name,
    tax_id,
    ssnit_number,
    industry,
    address,
    phone_number,
    email_address,
    divisions,
    departments,
    locations,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Akwaaba Technologies Ltd',
    'C0012345678',
    '1234567890',
    'Technology',
    '123 Liberation Road, Labone, Accra, Ghana',
    '+233 30 123 4567',
    'info@akwaabatech.com',
    '["Head Office", "IT Division", "Sales Division", "Marketing Division"]'::jsonb,
    '["Human Resources", "Information Technology", "Sales", "Marketing", "Finance", "Operations"]'::jsonb,
    '["Accra - Head Office", "Kumasi - Branch Office", "Takoradi - Regional Office"]'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tax_id = EXCLUDED.tax_id,
    ssnit_number = EXCLUDED.ssnit_number,
    industry = EXCLUDED.industry,
    address = EXCLUDED.address,
    phone_number = EXCLUDED.phone_number,
    email_address = EXCLUDED.email_address,
    divisions = EXCLUDED.divisions,
    departments = EXCLUDED.departments,
    locations = EXCLUDED.locations,
    updated_at = NOW();

-- Insert sample subsidiary data
INSERT INTO subsidiaries (
    id,
    company_id,
    name,
    tax_id,
    ssnit_number,
    address,
    phone_number,
    email_address,
    divisions,
    departments,
    locations,
    status,
    created_at,
    updated_at
) VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Akwaaba Tech Solutions',
    'CC001',
    '1234567891',
    '456 Ring Road, Accra, Ghana',
    '+233 30 456 7890',
    'solutions@akwaabatech.com',
    '["Software Development", "Technical Support", "Quality Assurance"]'::jsonb,
    '["Development", "Support", "QA", "Project Management"]'::jsonb,
    '["Accra - Main Office", "Tema - Support Center"]'::jsonb,
    'active',
    NOW(),
    NOW()
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Akwaaba Consulting',
    'CC002',
    '1234567892',
    '789 Oxford Street, Kumasi, Ghana',
    '+233 32 789 0123',
    'consulting@akwaabatech.com',
    '["Business Consulting", "IT Consulting", "Training"]'::jsonb,
    '["Consulting", "Training", "Business Development"]'::jsonb,
    '["Kumasi - Main Office", "Sunyani - Branch Office"]'::jsonb,
    'active',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tax_id = EXCLUDED.tax_id,
    ssnit_number = EXCLUDED.ssnit_number,
    address = EXCLUDED.address,
    phone_number = EXCLUDED.phone_number,
    email_address = EXCLUDED.email_address,
    divisions = EXCLUDED.divisions,
    departments = EXCLUDED.departments,
    locations = EXCLUDED.locations,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Grant necessary permissions
GRANT SELECT ON active_subsidiaries TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_subsidiary_options() TO anon, authenticated;
