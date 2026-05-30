
-- PDA Sport — Storage buckets for GPS files, heatmaps and reports
insert into storage.buckets (id, name, public) values
  ('gps-files', 'gps-files', false),
  ('heatmaps', 'heatmaps', true),
  ('reports', 'reports', false)
on conflict (id) do nothing;

-- Authenticated users can upload their own files in any of these buckets
create policy "Authenticated can upload gps-files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'gps-files');

create policy "Authenticated can read gps-files"
  on storage.objects for select to authenticated
  using (bucket_id = 'gps-files');

create policy "Authenticated can upload heatmaps"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'heatmaps');

create policy "Public can read heatmaps"
  on storage.objects for select to public
  using (bucket_id = 'heatmaps');

create policy "Authenticated can upload reports"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'reports');

create policy "Authenticated can read reports"
  on storage.objects for select to authenticated
  using (bucket_id = 'reports');
