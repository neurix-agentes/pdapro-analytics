
-- 1) Expand club_role enum
ALTER TYPE public.club_role ADD VALUE IF NOT EXISTS 'assistant_coach';
ALTER TYPE public.club_role ADD VALUE IF NOT EXISTS 'analyst';
ALTER TYPE public.club_role ADD VALUE IF NOT EXISTS 'athlete';

-- 2) Helper: has_club_role
CREATE OR REPLACE FUNCTION public.has_club_role(_user_id uuid, _club_id uuid, _roles public.club_role[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE user_id = _user_id AND club_id = _club_id AND role = ANY(_roles)
  )
$$;

-- 3) club_invites
CREATE TABLE IF NOT EXISTS public.club_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  role public.club_role NOT NULL DEFAULT 'coach',
  email text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  max_uses integer NOT NULL DEFAULT 1,
  uses integer NOT NULL DEFAULT 0,
  revoked_at timestamptz,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_club_invites_club ON public.club_invites(club_id);
CREATE INDEX IF NOT EXISTS idx_club_invites_code ON public.club_invites(code);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_invites TO authenticated;
GRANT ALL ON public.club_invites TO service_role;

ALTER TABLE public.club_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club_invites owner read"
  ON public.club_invites FOR SELECT TO authenticated
  USING (public.is_club_owner(auth.uid(), club_id));

CREATE POLICY "club_invites owner insert"
  ON public.club_invites FOR INSERT TO authenticated
  WITH CHECK (public.is_club_owner(auth.uid(), club_id) AND created_by = auth.uid());

CREATE POLICY "club_invites owner update"
  ON public.club_invites FOR UPDATE TO authenticated
  USING (public.is_club_owner(auth.uid(), club_id));

CREATE POLICY "club_invites owner delete"
  ON public.club_invites FOR DELETE TO authenticated
  USING (public.is_club_owner(auth.uid(), club_id));

CREATE TRIGGER trg_club_invites_updated_at
  BEFORE UPDATE ON public.club_invites
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4) redeem_club_invite
CREATE OR REPLACE FUNCTION public.redeem_club_invite(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.club_invites;
  v_user_id uuid := auth.uid();
  v_user_email text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_invite FROM public.club_invites WHERE code = _code;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite_not_found';
  END IF;
  IF v_invite.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'invite_revoked';
  END IF;
  IF v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'invite_expired';
  END IF;
  IF v_invite.uses >= v_invite.max_uses THEN
    RAISE EXCEPTION 'invite_exhausted';
  END IF;

  IF v_invite.email IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    IF lower(v_user_email) <> lower(v_invite.email) THEN
      RAISE EXCEPTION 'invite_email_mismatch';
    END IF;
  END IF;

  INSERT INTO public.club_members (club_id, user_id, role)
  VALUES (v_invite.club_id, v_user_id, v_invite.role)
  ON CONFLICT (club_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.club_invites SET uses = uses + 1, updated_at = now() WHERE id = v_invite.id;

  RETURN v_invite.club_id;
END $$;

GRANT EXECUTE ON FUNCTION public.redeem_club_invite(text) TO authenticated;
