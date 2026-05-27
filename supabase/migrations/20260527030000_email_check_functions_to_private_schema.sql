-- =============================================================
-- SECURITY FIX: Move check_email_* functions to private schema
-- Rationale:
--   - Prevent exposure via PostgREST (public schema is REST-exposed)
--   - Remove SECURITY DEFINER warnings from Supabase Advisor
--   - Add server-side rate limiting via Edge Function
-- =============================================================

-- Drop old public functions (with dependent GRANTs)
DROP FUNCTION IF EXISTS public.check_email_role(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.check_email_status(TEXT) CASCADE;

-- Create private schema if not exists
CREATE SCHEMA IF NOT EXISTS private;

-- Recreate functions in private schema (not exposed by PostgREST)
-- These will only be called by Edge Function with service_role

CREATE FUNCTION private.check_email_role(p_email TEXT)
  RETURNS text
  LANGUAGE sql
  STABLE
  SET search_path = private, public, pg_temp
AS $$
  SELECT role::text
  FROM public.users
  WHERE email = p_email;
$$;

COMMENT ON FUNCTION private.check_email_role(TEXT) IS
  'Private helper: check role of email. Called only by Edge Function '
  'with service_role. No longer exposed via PostgREST (SECURITY DEFINER warnings fixed).';

CREATE FUNCTION private.check_email_status(p_email TEXT)
  RETURNS TEXT
  LANGUAGE sql
  STABLE
  SET search_path = private, public, pg_temp
AS $$
  SELECT CASE
    WHEN au.id IS NULL THEN 'available'
    WHEN au.email_confirmed_at IS NULL THEN 'pending_verification'
    ELSE 'verified'
  END
  FROM auth.users au
  WHERE au.email = p_email;
$$;

COMMENT ON FUNCTION private.check_email_status(TEXT) IS
  'Private helper: check email status (available/pending_verification/verified). '
  'Called only by Edge Function with service_role. No longer exposed via PostgREST.';

-- Grant EXECUTE only to postgres (for Edge Function calls via service_role)
GRANT EXECUTE ON FUNCTION private.check_email_role(TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION private.check_email_status(TEXT) TO postgres;

-- === DEPRECATION NOTICE ===
-- Migration 20260527020000_email_check_rpc_hardening.sql is now SUPERSEDED.
-- The functions are no longer in public schema and not exposed as RPC.
-- Clients should use the /functions/check-email-availability Edge Function instead.
