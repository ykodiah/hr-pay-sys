-- Fix security warnings for database functions with mutable search_path
-- This addresses the Supabase Security Advisor warnings

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Fix update_system_currency function  
CREATE OR REPLACE FUNCTION public.update_system_currency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update currency across related tables when system currency changes
    UPDATE payroll_configuration 
    SET currency_code = NEW.currency_code,
        currency_symbol = NEW.currency_symbol
    WHERE company_id = NEW.company_id;
    
    RETURN NEW;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_system_currency() TO authenticated;
