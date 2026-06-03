-- Fix clubs RLS for onboarding + add explicit grants
ALTER TABLE public.clubs ALTER COLUMN created_by SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "clubs auth insert" ON public.clubs;
CREATE POLICY "clubs auth insert" ON public.clubs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Explicit GRANTs on all public tables
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.clubs, public.club_members, public.teams, public.coaches,
  public.athletes, public.fields, public.sessions, public.heatmaps,
  public.reports, public.transfers, public.profiles
  TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON
  public.clubs, public.club_members, public.teams, public.coaches,
  public.athletes, public.fields, public.sessions, public.heatmaps,
  public.reports, public.transfers, public.profiles, public.user_roles
  TO service_role;