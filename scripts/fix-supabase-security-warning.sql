-- Fix the security warning for update_system_currency function
-- by setting the search_path parameter to prevent SQL injection

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.update_system_currency(text);

-- Recreate the function with proper search_path security
CREATE OR REPLACE FUNCTION public.update_system_currency(new_currency text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the system currency in payroll_configuration table
  UPDATE payroll_configuration 
  SET currency = new_currency,
      updated_at = NOW()
  WHERE company_id IS NOT NULL;
  
  -- Update currency in companies table if it exists
  UPDATE companies 
  SET currency = new_currency,
      updated_at = NOW()
  WHERE id IS NOT NULL;
  
  -- Log the currency change
  INSERT INTO system_logs (action, description, created_at)
  VALUES ('currency_update', 'System currency updated to: ' || new_currency, NOW());
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_system_currency(text) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.update_system_currency(text) IS 'Updates system currency across all relevant tables with proper security settings';
