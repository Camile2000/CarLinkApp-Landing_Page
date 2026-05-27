-- Harden email check functions with locked search_path
-- Fixes function_search_path_mutable warnings (0011) for private.check_email_status and private.check_email_role
-- SET search_path prevents role mutable behavior and potential privilege escalation

CREATE OR REPLACE FUNCTION private.check_email_status(p_email TEXT)
  RETURNS TEXT
  LANGUAGE sql
  STABLE
  SET search_path = 'private'
AS $$
  SELECT CASE
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = p_email) THEN 'exists'
    ELSE 'available'
  END;
$$;

CREATE OR REPLACE FUNCTION private.check_email_role(p_email TEXT)
  RETURNS TEXT
  LANGUAGE sql
  STABLE
  SET search_path = 'private'
AS $$
  SELECT COALESCE(
    (raw_user_meta_data ->> 'role')::text,
    'user'
  )
  FROM auth.users
  WHERE email = p_email;
$$;

GRANT EXECUTE ON FUNCTION private.check_email_status(TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION private.check_email_role(TEXT) TO postgres;
