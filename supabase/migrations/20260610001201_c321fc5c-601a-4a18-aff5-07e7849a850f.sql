
-- RLS for athlete-photos bucket. Members of the club can read; admins/owners/coaches can write.
CREATE POLICY "athlete-photos read by club members"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'athlete-photos'
  AND EXISTS (
    SELECT 1 FROM public.athletes a
    WHERE a.id::text = split_part(name, '/', 1)
      AND public.is_club_member(auth.uid(), a.club_id)
  )
);

CREATE POLICY "athlete-photos insert by club staff"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'athlete-photos'
  AND EXISTS (
    SELECT 1 FROM public.athletes a
    WHERE a.id::text = split_part(name, '/', 1)
      AND public.has_club_role(auth.uid(), a.club_id, ARRAY['owner','admin','coach']::club_role[])
  )
);

CREATE POLICY "athlete-photos update by club staff"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'athlete-photos'
  AND EXISTS (
    SELECT 1 FROM public.athletes a
    WHERE a.id::text = split_part(name, '/', 1)
      AND public.has_club_role(auth.uid(), a.club_id, ARRAY['owner','admin','coach']::club_role[])
  )
);

CREATE POLICY "athlete-photos delete by club staff"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'athlete-photos'
  AND EXISTS (
    SELECT 1 FROM public.athletes a
    WHERE a.id::text = split_part(name, '/', 1)
      AND public.has_club_role(auth.uid(), a.club_id, ARRAY['owner','admin','coach']::club_role[])
  )
);
