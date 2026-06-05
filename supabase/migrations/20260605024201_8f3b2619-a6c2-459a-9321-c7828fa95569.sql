CREATE OR REPLACE FUNCTION public.debug_whoami()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'auth_uid', auth.uid(),
    'auth_role', auth.role(),
    'current_user', current_user,
    'jwt_claims', current_setting('request.jwt.claims', true)::jsonb
  )
$$;
GRANT EXECUTE ON FUNCTION public.debug_whoami() TO anon, authenticated, service_role;