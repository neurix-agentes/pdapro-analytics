
-- 1) club_members: remove self-insert (apenas owners/admins via redeem_club_invite)
DROP POLICY IF EXISTS "club_members owner manage insert" ON public.club_members;
CREATE POLICY "club_members owner manage insert"
ON public.club_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_club_owner(auth.uid(), club_id));

-- 2) storage.objects: substituir policies frouxas por policies escopadas por clube
-- gps-files
DROP POLICY IF EXISTS "Authenticated can read gps-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload gps-files" ON storage.objects;
DROP POLICY IF EXISTS "gps-files members read" ON storage.objects;
DROP POLICY IF EXISTS "gps-files members insert" ON storage.objects;
DROP POLICY IF EXISTS "gps-files members update" ON storage.objects;
DROP POLICY IF EXISTS "gps-files members delete" ON storage.objects;

CREATE POLICY "gps-files members read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'gps-files' AND public.is_club_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "gps-files members insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gps-files' AND public.is_club_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "gps-files members update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'gps-files' AND public.is_club_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "gps-files members delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'gps-files' AND public.is_club_member(auth.uid(), ((storage.foldername(name))[1])::uuid));

-- reports
DROP POLICY IF EXISTS "Authenticated can read reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload reports" ON storage.objects;
DROP POLICY IF EXISTS "reports members read" ON storage.objects;
DROP POLICY IF EXISTS "reports members insert" ON storage.objects;
DROP POLICY IF EXISTS "reports members update" ON storage.objects;
DROP POLICY IF EXISTS "reports members delete" ON storage.objects;

CREATE POLICY "reports members read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'reports' AND public.is_club_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "reports members insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'reports' AND public.is_club_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "reports members update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'reports' AND public.is_club_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "reports members delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'reports' AND public.is_club_member(auth.uid(), ((storage.foldername(name))[1])::uuid));

-- heatmaps (bucket agora privado)
DROP POLICY IF EXISTS "Authenticated can upload heatmaps" ON storage.objects;
DROP POLICY IF EXISTS "heatmaps members read" ON storage.objects;
DROP POLICY IF EXISTS "heatmaps members insert" ON storage.objects;
DROP POLICY IF EXISTS "heatmaps members update" ON storage.objects;
DROP POLICY IF EXISTS "heatmaps members delete" ON storage.objects;

CREATE POLICY "heatmaps members read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'heatmaps' AND public.is_club_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "heatmaps members insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'heatmaps' AND public.is_club_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "heatmaps members update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'heatmaps' AND public.is_club_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "heatmaps members delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'heatmaps' AND public.is_club_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
