CREATE OR REPLACE FUNCTION public.security_posture_check()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_owner boolean;
  v_heatmaps_private boolean;
  v_club_members_ok boolean;
  v_storage_scoped_count int;
  v_debug_removed boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE user_id = v_uid AND role IN ('owner','admin')
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT NOT public INTO v_heatmaps_private
  FROM storage.buckets WHERE id = 'heatmaps';

  SELECT NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'club_members'
      AND cmd = 'INSERT'
      AND with_check ILIKE '%user_id = auth.uid()%'
  ) INTO v_club_members_ok;

  SELECT count(*) INTO v_storage_scoped_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (qual ILIKE '%is_club_member%' OR with_check ILIKE '%is_club_member%');

  SELECT NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'debug_whoami'
  ) INTO v_debug_removed;

  RETURN jsonb_build_object(
    'heatmaps_private', COALESCE(v_heatmaps_private, false),
    'club_members_owner_only', COALESCE(v_club_members_ok, false),
    'storage_scoped_policy_count', v_storage_scoped_count,
    'storage_scoped_ok', v_storage_scoped_count >= 3,
    'debug_whoami_removed', v_debug_removed,
    'checked_at', now()
  );
END $$;

REVOKE ALL ON FUNCTION public.security_posture_check() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.security_posture_check() TO authenticated;