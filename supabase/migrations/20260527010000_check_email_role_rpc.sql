-- Function to check the role associated with an email
-- Returns 'conductor', 'garage', or NULL if email not found
CREATE OR REPLACE FUNCTION public.check_email_role(p_email TEXT)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.users
  WHERE email = p_email;
$$;

-- Grant access to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.check_email_role(text) TO anon, authenticated;
