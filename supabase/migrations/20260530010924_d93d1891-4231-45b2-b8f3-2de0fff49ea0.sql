
-- Public buckets serve files via the public URL without needing a broad SELECT
-- policy on storage.objects. Removing this policy prevents anyone from
-- enumerating files in the bucket while still allowing direct fetches.
drop policy if exists "Public can read heatmaps" on storage.objects;
