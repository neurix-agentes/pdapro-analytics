
-- Fix athlete-photos storage policies: reference storage.objects.name, not athletes.name
DROP POLICY IF EXISTS "athlete-photos read by club members" ON storage.objects;
DROP POLICY IF EXISTS "athlete-photos insert by club staff" ON storage.objects;
DROP POLICY IF EXISTS "athlete-photos update by club staff" ON storage.objects;
DROP POLICY IF EXISTS "athlete-photos delete by club staff" ON storage.objects;

CREATE POLICY "athlete-photos read by club members"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'athlete-photos'
  AND EXISTS (
    SELECT 1 FROM public.athletes a
    WHERE a.id::text = split_part(storage.objects.name, '/', 1)
      AND public.is_club_member(auth.uid(), a.club_id)
  )
);

CREATE POLICY "athlete-photos insert by club staff"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'athlete-photos'
  AND EXISTS (
    SELECT 1 FROM public.athletes a
    WHERE a.id::text = split_part(storage.objects.name, '/', 1)
      AND public.has_club_role(auth.uid(), a.club_id, ARRAY['owner','admin','coach']::club_role[])
  )
);

CREATE POLICY "athlete-photos update by club staff"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'athlete-photos'
  AND EXISTS (
    SELECT 1 FROM public.athletes a
    WHERE a.id::text = split_part(storage.objects.name, '/', 1)
      AND public.has_club_role(auth.uid(), a.club_id, ARRAY['owner','admin','coach']::club_role[])
  )
);

CREATE POLICY "athlete-photos delete by club staff"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'athlete-photos'
  AND EXISTS (
    SELECT 1 FROM public.athletes a
    WHERE a.id::text = split_part(storage.objects.name, '/', 1)
      AND public.has_club_role(auth.uid(), a.club_id, ARRAY['owner','admin','coach']::club_role[])
  )
);
