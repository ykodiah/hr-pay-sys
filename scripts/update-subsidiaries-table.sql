-- Update subsidiaries table to support new logo upload functionality
-- and ensure all form fields are properly supported

-- Add logo_file_id column to reference uploaded files
ALTER TABLE public.subsidiaries 
ADD COLUMN IF NOT EXISTS logo_file_id uuid REFERENCES public.company_files(id);

-- Add industry column to match the form fields
ALTER TABLE public.subsidiaries 
ADD COLUMN IF NOT EXISTS industry character varying(255);

-- Create index for better performance on logo file lookups
CREATE INDEX IF NOT EXISTS idx_subsidiaries_logo_file_id ON public.subsidiaries(logo_file_id);

-- Create index for better performance on company lookups
CREATE INDEX IF NOT EXISTS idx_subsidiaries_company_id ON public.subsidiaries(company_id);

-- Create index for better performance on status filtering
CREATE INDEX IF NOT EXISTS idx_subsidiaries_status ON public.subsidiaries(status);

-- Update RLS policies for subsidiaries table to ensure proper access control
DROP POLICY IF EXISTS "Users can view subsidiaries of their company" ON public.subsidiaries;
CREATE POLICY "Users can view subsidiaries of their company" ON public.subsidiaries
    FOR SELECT USING (
        company_id IN (
            SELECT c.id FROM public.companies c
            WHERE c.id = (SELECT auth.uid()::text::uuid)
            OR EXISTS (
                SELECT 1 FROM public.employees e 
                WHERE e.company_id = c.id 
                AND e.id = (SELECT auth.uid()::text::uuid)
            )
        )
    );

DROP POLICY IF EXISTS "Users can insert subsidiaries for their company" ON public.subsidiaries;
CREATE POLICY "Users can insert subsidiaries for their company" ON public.subsidiaries
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT c.id FROM public.companies c
            WHERE c.id = (SELECT auth.uid()::text::uuid)
            OR EXISTS (
                SELECT 1 FROM public.employees e 
                WHERE e.company_id = c.id 
                AND e.id = (SELECT auth.uid()::text::uuid)
                AND e.special_role IN ('admin', 'hr_manager', 'ceo')
            )
        )
    );

DROP POLICY IF EXISTS "Users can update subsidiaries of their company" ON public.subsidiaries;
CREATE POLICY "Users can update subsidiaries of their company" ON public.subsidiaries
    FOR UPDATE USING (
        company_id IN (
            SELECT c.id FROM public.companies c
            WHERE c.id = (SELECT auth.uid()::text::uuid)
            OR EXISTS (
                SELECT 1 FROM public.employees e 
                WHERE e.company_id = c.id 
                AND e.id = (SELECT auth.uid()::text::uuid)
                AND e.special_role IN ('admin', 'hr_manager', 'ceo')
            )
        )
    );

-- Create function to handle subsidiary logo file cleanup
CREATE OR REPLACE FUNCTION public.cleanup_subsidiary_logo()
RETURNS TRIGGER AS $$
BEGIN
    -- When logo_file_id is updated or subsidiary is deleted, clean up old file
    IF TG_OP = 'UPDATE' AND OLD.logo_file_id IS DISTINCT FROM NEW.logo_file_id THEN
        -- Delete old logo file if it exists and is not referenced elsewhere
        IF OLD.logo_file_id IS NOT NULL THEN
            DELETE FROM public.company_files 
            WHERE id = OLD.logo_file_id 
            AND NOT EXISTS (
                SELECT 1 FROM public.subsidiaries s 
                WHERE s.logo_file_id = OLD.logo_file_id 
                AND s.id != NEW.id
            )
            AND NOT EXISTS (
                SELECT 1 FROM public.companies c 
                WHERE c.logo_file_id = OLD.logo_file_id
            );
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        -- Delete logo file when subsidiary is deleted
        IF OLD.logo_file_id IS NOT NULL THEN
            DELETE FROM public.company_files 
            WHERE id = OLD.logo_file_id 
            AND NOT EXISTS (
                SELECT 1 FROM public.subsidiaries s 
                WHERE s.logo_file_id = OLD.logo_file_id
            )
            AND NOT EXISTS (
                SELECT 1 FROM public.companies c 
                WHERE c.logo_file_id = OLD.logo_file_id
            );
        END IF;
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for logo cleanup
DROP TRIGGER IF EXISTS trigger_cleanup_subsidiary_logo ON public.subsidiaries;
CREATE TRIGGER trigger_cleanup_subsidiary_logo
    AFTER UPDATE OF logo_file_id OR DELETE ON public.subsidiaries
    FOR EACH ROW EXECUTE FUNCTION public.cleanup_subsidiary_logo();

-- Insert sample subsidiaries data for testing (if not exists)
INSERT INTO public.subsidiaries (
    id, name, tax_id, ssnit_number, email_address, phone_number, 
    address, company_id, divisions, departments, locations, 
    status, industry, created_at, updated_at
) VALUES 
(
    gen_random_uuid(),
    'Press Limited',
    '100546',
    '10021',
    'info@pressltd.com',
    '0243939960',
    'P. O. Box 2194, Accra Ghana',
    '00000000-0000-0000-0000-000000000001',
    '["Manufacturing", "Retail"]'::jsonb,
    '["Sales", "Marketing", "Production", "Finance"]'::jsonb,
    '["Accra", "Kumasi"]'::jsonb,
    'active',
    'Manufacturing',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Pharmacy Limited',
    '525',
    '10026',
    'info@pharmacyltd.com',
    '0244567890',
    'Adum Kumasi',
    '00000000-0000-0000-0000-000000000001',
    '["Pharmacy", "Clinic", "Lab"]'::jsonb,
    '["Sales", "Marketing", "Finance"]'::jsonb,
    '["Adum", "Kejetia"]'::jsonb,
    'active',
    'Healthcare',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create function to get subsidiary statistics
CREATE OR REPLACE FUNCTION public.get_subsidiary_stats(company_uuid uuid)
RETURNS TABLE (
    total_subsidiaries bigint,
    active_subsidiaries bigint,
    inactive_subsidiaries bigint,
    total_divisions bigint,
    total_departments bigint,
    total_locations bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_subsidiaries,
        COUNT(*) FILTER (WHERE status = 'active') as active_subsidiaries,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive_subsidiaries,
        COALESCE(SUM(jsonb_array_length(divisions)), 0) as total_divisions,
        COALESCE(SUM(jsonb_array_length(departments)), 0) as total_departments,
        COALESCE(SUM(jsonb_array_length(locations)), 0) as total_locations
    FROM public.subsidiaries 
    WHERE company_id = company_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subsidiaries TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subsidiary_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_subsidiary_logo() TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN public.subsidiaries.logo_file_id IS 'Reference to uploaded logo file in company_files table';
COMMENT ON COLUMN public.subsidiaries.industry IS 'Industry sector of the subsidiary company';
COMMENT ON FUNCTION public.get_subsidiary_stats(uuid) IS 'Returns statistical information about subsidiaries for a given company';
COMMENT ON FUNCTION public.cleanup_subsidiary_logo() IS 'Automatically cleans up logo files when subsidiaries are updated or deleted';
