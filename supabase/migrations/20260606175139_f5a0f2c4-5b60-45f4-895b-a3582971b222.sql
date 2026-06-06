CREATE OR REPLACE FUNCTION public.pda_audit_whoami()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'auth_uid', auth.uid(),
    'auth_role', auth.role(),
    'current_user', current_user,
    'session_user', session_user,
    'jwt_claims', current_setting('request.jwt.claims', true)::jsonb
  )
$$;

GRANT EXECUTE ON FUNCTION public.pda_audit_whoami() TO anon, authenticated, service_role;