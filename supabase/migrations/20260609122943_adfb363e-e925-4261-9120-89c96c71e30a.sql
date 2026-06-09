DROP POLICY IF EXISTS "clubs auth insert" ON public.clubs;
CREATE POLICY "clubs auth insert" ON public.clubs
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());