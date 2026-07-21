-- Fix get_current_user_company_id() to read from JWT metadata instead of a hardcoded UUID.
-- The earlier "corrected" migration returned a fixed company id, which broke multi-tenant isolation.
-- Run this in Supabase SQL editor after deploying the app isolation fixes.

CREATE OR REPLACE FUNCTION get_current_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() -> 'app_metadata' ->> 'company_id', '')::uuid,
    NULLIF(auth.jwt() -> 'user_metadata' ->> 'company_id', '')::uuid
  );
$$;

COMMENT ON FUNCTION get_current_user_company_id() IS
  'Returns the authenticated user company_id from JWT app/user metadata. Never hardcodes a tenant.';
