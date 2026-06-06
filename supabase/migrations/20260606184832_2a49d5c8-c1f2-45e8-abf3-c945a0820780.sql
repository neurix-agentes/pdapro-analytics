DROP POLICY IF EXISTS "clubs members read" ON public.clubs;
CREATE POLICY "clubs members read"
ON public.clubs FOR SELECT TO authenticated
USING (public.is_club_member(auth.uid(), id) OR created_by = auth.uid());

DROP FUNCTION IF EXISTS public.pda_audit_whoami();
DROP FUNCTION IF EXISTS public.debug_whoami();