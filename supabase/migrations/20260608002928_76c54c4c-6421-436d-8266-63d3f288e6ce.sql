
-- Refit FK: drop old (points to coaches) and recreate against club_members
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_coach_id_fkey;

-- Zera valores legados que poderiam apontar para coaches.id
UPDATE public.teams SET coach_id = NULL WHERE coach_id IS NOT NULL;

ALTER TABLE public.teams
  ADD CONSTRAINT teams_coach_id_fkey
  FOREIGN KEY (coach_id) REFERENCES public.club_members(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.list_club_members_with_profiles(_club_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role club_role,
  created_at timestamptz,
  name text,
  email text,
  avatar_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cm.id, cm.user_id, cm.role, cm.created_at,
         COALESCE(p.name, split_part(p.email,'@',1), 'Usuário'),
         p.email,
         p.avatar_url
  FROM public.club_members cm
  LEFT JOIN public.profiles p ON p.user_id = cm.user_id
  WHERE cm.club_id = _club_id
    AND public.is_club_member(auth.uid(), _club_id)
  ORDER BY
    CASE cm.role
      WHEN 'owner' THEN 0
      WHEN 'admin' THEN 1
      WHEN 'coach' THEN 2
      WHEN 'assistant_coach' THEN 3
      ELSE 4
    END,
    cm.created_at;
$$;
GRANT EXECUTE ON FUNCTION public.list_club_members_with_profiles(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.preview_club_invite(_code text)
RETURNS TABLE (
  club_id uuid,
  club_name text,
  club_short_name text,
  club_logo_url text,
  role club_role,
  email text,
  expires_at timestamptz,
  uses int,
  max_uses int,
  revoked boolean,
  expired boolean,
  exhausted boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id, c.name, c.short_name, c.logo_url,
    i.role, i.email, i.expires_at, i.uses, i.max_uses,
    (i.revoked_at IS NOT NULL),
    (i.expires_at < now()),
    (i.uses >= i.max_uses)
  FROM public.club_invites i
  JOIN public.clubs c ON c.id = i.club_id
  WHERE i.code = _code
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.preview_club_invite(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.transfer_club_ownership(_club_id uuid, _new_owner_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.club_members WHERE club_id=_club_id AND user_id=v_caller AND role='owner') THEN
    RAISE EXCEPTION 'not_owner';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.club_members WHERE club_id=_club_id AND user_id=_new_owner_user_id) THEN
    RAISE EXCEPTION 'target_not_member';
  END IF;
  UPDATE public.club_members SET role='admin' WHERE club_id=_club_id AND user_id=v_caller;
  UPDATE public.club_members SET role='owner' WHERE club_id=_club_id AND user_id=_new_owner_user_id;
END $$;
GRANT EXECUTE ON FUNCTION public.transfer_club_ownership(uuid, uuid) TO authenticated;
